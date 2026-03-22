# Laser Absorptivity Visualiser

Interactive visualisation of laser absorptivity in metal powder beds for laser powder bed fusion (L-PBF). Adjust laser, material, and powder parameters with sliders and see how surface and effective powder bed absorptivity respond in real time.

![Python](https://img.shields.io/badge/python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
![React](https://img.shields.io/badge/React-18-61DAFB)

## What it does

- Computes single-surface **Fresnel absorptivity** from complex refractive index (n, k) for s, p, circular, and unpolarised light.
- Applies **Hagen-Rubens temperature correction** — scales optical constants with electrical conductivity to model absorptivity changes from room temperature through melting.
- Computes effective **powder bed absorptivity** via the **Gusarov two-flux radiative transfer model**, accounting for multiple reflections between particles.
- Classifies the processing **regime** (powder bed, liquid surface, keyhole risk) based on temperature relative to solidus/liquidus.
- Renders an interactive **2D ray trace** through a gravity-settled particle packing, showing how rays bounce between particles and where energy is absorbed.
- Plots **absorptivity vs angle** (Fresnel curves with pseudo-Brewster peak) and **absorptivity vs temperature** (surface and powder bed).
- Ships with material presets for 316L, Ti-6Al-4V, IN718, AlSi10Mg, CoCrMo, and Cu at three laser wavelengths (515 nm, 1064 nm, 10600 nm).

## Running locally

**Backend**:

```bash
cd backend
pip install ..  # or: uv sync (from repo root)
uvicorn main:app --reload --port 8080
```

**Frontend** (Node 20+):

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies API requests to `localhost:8080`.

## Docker

```bash
docker build -t absorptivity-vis .
docker run -p 8080:8080 absorptivity-vis
```

Opens at `http://localhost:8080`. The single container builds the React frontend and serves it from FastAPI alongside the API.

## Limitations and assumptions

The models used are useful first-order approximations, but each makes significant simplifying assumptions:

- **Room-temperature optical constants** — tabulated (n, k) values are at ~25 °C. Temperature dependence is approximated via Hagen-Rubens conductivity scaling, which is most accurate in the far-IR (10600 nm) and less reliable at NIR/visible wavelengths where interband transitions dominate.
- **Hagen-Rubens validity** — the relation n ~ k ~ sqrt(sigma / 2*eps0*omega) assumes free-electron (Drude) behaviour. It breaks down at short wavelengths (515 nm) where bound-electron transitions are significant, especially for Cu and Al alloys.
- **Liquid-phase extrapolation** — optical constants above the liquidus are extrapolated from liquid electrical conductivity using Hagen-Rubens. Actual liquid metal optical properties may differ due to structural and electronic changes at melting.
- **Gusarov two-flux model** — treats the powder bed as a 1D slab with Lambertian scattering from spherical particle surfaces. It does not capture particle shape, surface roughness, oxide layers, or 3D packing effects. The model is most accurate when the optical depth (tau = 1.5 * eta * t/D50) is large (tau >> 1).
- **Single particle size** — the Gusarov model uses D50 as a single representative diameter. The full particle size distribution (D10–D90) affects optical depth distribution but is not captured in this scalar model.
- **No keyhole physics** — keyhole-mode absorptivity depends on vapour depression geometry, recoil pressure, and fluid flow, none of which are modelled. The keyhole regime flag is a rough heuristic based on temperature above liquidus.
- **2D ray trace is illustrative** — the ray trace visualisation shows the multiple-reflection mechanism qualitatively in a 2D cross-section. It is not used for quantitative absorptivity prediction; the Gusarov model provides the reported values.
- **Flat surface assumption** — the Fresnel model assumes an optically smooth, flat interface. Surface roughness, oxide films, and contamination are not accounted for.
- **No wavelength-dependent scattering** — particle scattering is treated as wavelength-independent (geometric optics regime, valid when particle diameter >> wavelength).
