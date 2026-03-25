"""
2D ray tracing engine for laser absorptivity visualisation.

Generates a 2D cross-section of packed circles from a particle size
distribution, then traces parallel laser rays through the scene,
tracking absorption at each particle surface via the local Fresnel
reflectance at the local angle of incidence.

This visualisation is illustrative only — it shows the multiple-reflection
mechanism qualitatively. The quantitative absorptivity is computed via the
Gusarov two-flux model in gusarov.py.

Coordinate system:
  x : horizontal across scene (µm)
  y : vertical, 0 at top of powder layer, positive downward
  Powder occupies y ∈ [0, layer_thickness_um]
  Rays enter from y < 0 (above the powder bed)
  "Escaped upward" = ray exits through y < Y_TOP
  "Hit substrate"  = ray exits through y > layer_thickness_um (absorbed by substrate)
"""

import math
from dataclasses import dataclass, field

import numpy as np

from fresnel import fresnel_absorptivity
from hagen_rubens import temperature_corrected_nk
from materials import get_nk

# ── Scene constants ───────────────────────────────────────────────────────────
_MIN_INTENSITY = 0.01    # ray is discarded below this normalised intensity
_MAX_BOUNCES   = 25      # safety cap per ray
_INTERSECT_EPS = 1e-3    # µm — guard against self-intersection


# ── Data classes ─────────────────────────────────────────────────────────────

@dataclass
class Particle:
    x: float    # centre x (µm)
    y: float    # centre y (µm)
    r: float    # radius  (µm)
    absorbed_energy: float = 0.0   # accumulated absorbed intensity (normalised)


@dataclass
class RaySegment:
    x0: float
    y0: float
    x1: float
    y1: float
    intensity: float   # normalised intensity at the START of this segment


@dataclass
class RayResult:
    segments: list[RaySegment] = field(default_factory=list)
    absorbed_total: float = 0.0   # total absorbed fraction of initial intensity
    n_bounces: int = 0
    escaped: bool = False         # True if exited upward (not absorbed)


# ── Particle packing ─────────────────────────────────────────────────────────

def _sample_radii(d10: float, d50: float, d90: float, n: int, rng: np.random.Generator) -> np.ndarray:
    """Sample particle radii from a log-normal distribution fitted to D10/D50/D90."""
    mu_log = math.log(d50)
    # Fit sigma from D90 and D10 (average both sides for robustness)
    s_high = (math.log(d90) - math.log(d50)) / 1.2816 if d90 > d50 else 0.3
    s_low  = (math.log(d50) - math.log(d10)) / 1.2816 if d50 > d10 else 0.3
    sigma_log = max((s_high + s_low) / 2, 0.05)

    diameters = np.exp(rng.normal(mu_log, sigma_log, n))
    diameters = np.clip(diameters, d10 * 0.4, d90 * 1.4)
    return diameters / 2   # radius


def pack_particles(
    d10_um: float,
    d50_um: float,
    d90_um: float,
    packing_fraction: float,
    layer_thickness_um: float,
    scene_width_um: float,
    seed: int = 42,
) -> list[Particle]:
    """
    Generate a 2D gravity-settled packing of circles within the powder layer.

    Particles are dropped from above at random x positions and settle onto the
    substrate floor (y = layer_thickness_um) or onto previously placed particles.
    Larger particles are placed first to form a stable base.  The result looks
    like a realistic cross-section of a wiped powder layer.
    """
    rng = np.random.default_rng(seed)
    mean_area = math.pi * (d50_um / 2) ** 2
    scene_area = scene_width_um * layer_thickness_um
    n_target = int(min(packing_fraction, 0.52) * scene_area / mean_area)
    n_target = int(n_target * 2.5)
    n_target = max(n_target, 8)
    n_target = min(n_target, 400)

    radii = _sample_radii(d10_um, d50_um, d90_um, n_target * 3, rng)
    # Place in distribution order (already randomised by _sample_radii)

    particles: list[Particle] = []
    gap = 0.3  # small visual gap (µm) so hatching lines don't merge

    for r in radii:
        if len(particles) >= n_target:
            break
        r = min(r, layer_thickness_um * 0.45, scene_width_um * 0.45)
        if r <= 0:
            continue

        best_x: float | None = None
        best_y = -math.inf

        # Try many x positions; keep the one that settles deepest (densest packing)
        for _ in range(80):
            x = rng.uniform(r, scene_width_um - r)

            # Gravity: particle falls until it hits substrate or another particle
            y_settle = layer_thickness_um - r  # substrate floor

            for p in particles:
                dx_val = x - p.x
                touch_dist = r + p.r + gap
                if abs(dx_val) < touch_dist:
                    # y where falling circle would just touch this particle from above
                    y_on_p = p.y - math.sqrt(touch_dist ** 2 - dx_val ** 2)
                    if y_on_p < y_settle:
                        y_settle = y_on_p

            # Reject if particle protrudes more than 5% above the powder surface
            y_min = -(layer_thickness_um * 0.05)
            if y_settle < y_min:
                continue

            # Verify no overlap (floating-point safety)
            if any(math.hypot(x - p.x, y_settle - p.y) < r + p.r + gap - 0.05
                   for p in particles):
                continue

            # Keep the deepest valid placement
            if y_settle > best_y:
                best_y = y_settle
                best_x = x

        if best_x is not None:
            particles.append(Particle(x=best_x, y=best_y, r=r))

    return particles


# ── Ray–circle intersection ───────────────────────────────────────────────────

def _intersect_ray_circle(
    px: float, py: float,
    dx: float, dy: float,
    cx: float, cy: float, cr: float,
) -> tuple[float, float, float] | None:
    """
    Smallest positive t for ray (px + t·dx, py + t·dy) hitting circle (cx, cy, cr).
    Returns (t, nx, ny) where (nx, ny) is the outward surface normal at the hit point,
    or None if no hit.
    """
    fx = px - cx
    fy = py - cy
    b = fx * dx + fy * dy       # F·D
    c_val = fx * fx + fy * fy - cr * cr
    disc = b * b - c_val

    if disc < 0:
        return None

    sqrt_disc = math.sqrt(disc)
    t1 = -b - sqrt_disc
    t2 = -b + sqrt_disc

    t = None
    if t1 > _INTERSECT_EPS:
        t = t1
    elif t2 > _INTERSECT_EPS:
        t = t2

    if t is None:
        return None

    # Hit point and outward normal
    hx = px + t * dx
    hy = py + t * dy
    nx = (hx - cx) / cr
    ny = (hy - cy) / cr
    return t, nx, ny


# ── Single ray tracer ─────────────────────────────────────────────────────────

def _trace_ray(
    x0: float, y0: float,
    dx: float, dy: float,
    particles: list[Particle],
    y_top: float,
    y_bottom: float,
    scene_width: float,
    n_T: float, k_T: float,
    polarisation: str,
) -> RayResult:
    """Trace one ray until it escapes, is absorbed, or hits max bounces."""
    result = RayResult()
    px, py = x0, y0
    rdx, rdy = dx, dy
    intensity = 1.0

    for _ in range(_MAX_BOUNCES):
        # ── Find nearest particle hit ────────────────────────────────────────
        t_best: float | None = None
        hit_particle: Particle | None = None
        nx_best = ny_best = 0.0

        for p in particles:
            res = _intersect_ray_circle(px, py, rdx, rdy, p.x, p.y, p.r)
            if res is not None:
                t, nx, ny = res
                if t_best is None or t < t_best:
                    t_best = t
                    nx_best, ny_best = nx, ny
                    hit_particle = p

        # ── No particle hit: ray travels to scene boundary ───────────────────
        if t_best is None:
            # Extend to the scene boundary in travel direction
            t_bound = _t_to_boundary(px, py, rdx, rdy, y_top, y_bottom, scene_width)
            x1 = px + t_bound * rdx
            y1 = py + t_bound * rdy
            result.segments.append(RaySegment(px, py, x1, y1, intensity))

            result.escaped = y1 <= y_top   # exited through top boundary
            break

        # ── Hit point ────────────────────────────────────────────────────────
        x1 = px + t_best * rdx
        y1 = py + t_best * rdy

        # Check if hit is outside scene bounds
        if y1 < y_top - 0.5:
            result.segments.append(RaySegment(px, py, x1, y1, intensity))
            result.escaped = True
            break
        if y1 > y_bottom + 0.5:
            result.segments.append(RaySegment(px, py, x1, y1, intensity))
            break   # absorbed by substrate

        result.segments.append(RaySegment(px, py, x1, y1, intensity))

        # ── Local angle of incidence (from outward normal) ───────────────────
        # cos θ = -(d · n), positive for a ray hitting from outside
        cos_theta = -(rdx * nx_best + rdy * ny_best)
        cos_theta = max(0.0, min(1.0, cos_theta))
        local_theta_deg = min(math.degrees(math.acos(cos_theta)), 84.9)

        # ── Fresnel absorptivity at local angle ───────────────────────────────
        _, _, A_local = fresnel_absorptivity(n_T, k_T, local_theta_deg, polarisation)

        absorbed = intensity * A_local
        result.absorbed_total += absorbed
        result.n_bounces += 1

        if hit_particle is not None:
            hit_particle.absorbed_energy += absorbed

        intensity *= (1.0 - A_local)
        if intensity < _MIN_INTENSITY:
            break

        # ── Specular reflection: r = d − 2(d·n)n ─────────────────────────────
        dot_dn = rdx * nx_best + rdy * ny_best
        rdx -= 2.0 * dot_dn * nx_best
        rdy -= 2.0 * dot_dn * ny_best
        # Renormalise (should be unit vector, but guard floating point drift)
        mag = math.sqrt(rdx * rdx + rdy * rdy)
        if mag > 1e-9:
            rdx /= mag
            rdy /= mag

        px, py = x1, y1

    return result


def _t_to_boundary(
    px: float, py: float,
    dx: float, dy: float,
    y_top: float, y_bottom: float,
    x_right: float,
) -> float:
    """Return parameter t at which the ray first exits the scene bounding box."""
    candidates = []

    if abs(dy) > 1e-9:
        t_top = (y_top - py) / dy
        t_bot = (y_bottom - py) / dy
        if t_top > _INTERSECT_EPS:
            candidates.append(t_top)
        if t_bot > _INTERSECT_EPS:
            candidates.append(t_bot)

    if abs(dx) > 1e-9:
        t_left  = (0.0 - px) / dx
        t_right = (x_right - px) / dx
        if t_left > _INTERSECT_EPS:
            candidates.append(t_left)
        if t_right > _INTERSECT_EPS:
            candidates.append(t_right)

    return min(candidates) if candidates else 100.0


# ── Public API ────────────────────────────────────────────────────────────────

def run_raytrace(
    material: str,
    wavelength_nm: float,
    angle_deg: float,
    polarisation: str,
    temperature_C: float,
    d10_um: float,
    d50_um: float,
    d90_um: float,
    packing_fraction: float,
    layer_thickness_um: float,
    n_rays: int = 20,
    spot_diameter_um: float = 80.0,
) -> dict:
    """
    Run the full ray trace and return a dict suitable for JSON serialisation.

    Returns
    -------
    dict with keys:
      particles     : list of {x, y, radius, absorbed_energy}
      rays          : list of {segments: [{x0,y0,x1,y1,intensity}], absorbed_total, n_bounces, escaped}
      summary       : {ray_count, avg_bounces, fraction_absorbed, fraction_escaped}
      scene         : {width_um, height_um, powder_top_um, powder_bottom_um}
    """
    # ── Scene geometry ────────────────────────────────────────────────────────
    scene_width_um    = max(spot_diameter_um * 3.0, 8.0 * d50_um, 4.0 * layer_thickness_um, 150.0)
    above_layer_um    = layer_thickness_um * 0.4   # space above powder for ray entry
    below_layer_um    = layer_thickness_um * 0.2   # substrate indicator
    scene_height_um   = above_layer_um + layer_thickness_um + below_layer_um

    # Powder layer in scene coords (y=0 at scene top)
    y_powder_top    = above_layer_um
    y_powder_bottom = above_layer_um + layer_thickness_um

    y_scene_top    = 0.0
    y_scene_bottom = scene_height_um

    # ── Pack particles ────────────────────────────────────────────────────────
    particles = pack_particles(
        d10_um, d50_um, d90_um, packing_fraction,
        layer_thickness_um, scene_width_um,
    )
    # Shift particles into scene coordinates
    for p in particles:
        p.y += y_powder_top

    # ── Optical constants at temperature ─────────────────────────────────────
    n_ref, k_ref = get_nk(material, wavelength_nm)
    n_T, k_T = temperature_corrected_nk(material, n_ref, k_ref, temperature_C)

    # ── Ray entry ─────────────────────────────────────────────────────────────
    theta = math.radians(angle_deg)
    dx = math.sin(theta)
    dy = math.cos(theta)   # positive = downward

    # Rays enter from y = y_scene_top + small offset, spread evenly in x
    y_entry = y_scene_top + above_layer_um * 0.1

    # Spread entry x-positions so that rays illuminate the scene evenly
    # For angled rays, offset x so they enter through the top of the scene
    ray_results: list[RayResult] = []
    for i in range(n_rays):
        frac = (i + 0.5) / n_rays
        spot_left = (scene_width_um - spot_diameter_um) / 2.0
        x_hit = spot_left + frac * spot_diameter_um   # where ray should hit the powder top
        # Walk back along ray direction to find x at y = y_entry
        if abs(dy) > 1e-9:
            dt = (y_powder_top - y_entry) / dy
            x0 = x_hit - dt * dx
        else:
            x0 = x_hit

        # Clip to scene bounds; shift if out
        if x0 < 0:
            x0 = 0.0
        if x0 > scene_width_um:
            x0 = scene_width_um

        result = _trace_ray(
            x0, y_entry, dx, dy,
            particles,
            y_scene_top, y_scene_bottom,
            scene_width_um,
            n_T, k_T, polarisation,
        )
        ray_results.append(result)

    # ── Summary statistics ────────────────────────────────────────────────────
    avg_bounces = sum(r.n_bounces for r in ray_results) / max(len(ray_results), 1)
    # Fraction absorbed = mean absorbed_total across all rays
    # (each ray starts with intensity=1, so absorbed_total is already normalised)
    frac_absorbed = sum(r.absorbed_total for r in ray_results) / max(len(ray_results), 1)
    frac_escaped  = 1.0 - frac_absorbed

    # ── Serialise ─────────────────────────────────────────────────────────────
    return {
        "particles": [
            {"x": p.x, "y": p.y, "radius": p.r, "absorbed_energy": p.absorbed_energy}
            for p in particles
        ],
        "rays": [
            {
                "segments": [
                    {"x0": s.x0, "y0": s.y0, "x1": s.x1, "y1": s.y1, "intensity": s.intensity}
                    for s in r.segments
                ],
                "absorbed_total": r.absorbed_total,
                "n_bounces": r.n_bounces,
                "escaped": r.escaped,
            }
            for r in ray_results
        ],
        "summary": {
            "ray_count": n_rays,
            "avg_bounces": round(avg_bounces, 2),
            "fraction_absorbed": round(frac_absorbed, 4),
            "fraction_escaped": round(frac_escaped, 4),
        },
        "scene": {
            "width_um": scene_width_um,
            "height_um": scene_height_um,
            "powder_top_um": y_powder_top,
            "powder_bottom_um": y_powder_bottom,
        },
    }
