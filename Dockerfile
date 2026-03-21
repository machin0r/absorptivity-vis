# Stage 1 — Build frontend
FROM node:20-slim AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2 — Runtime
FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Install Python dependencies
COPY pyproject.toml .
COPY backend/ ./backend/
RUN uv pip install --system .

# Copy backend source to working directory (uvicorn runs from /app)
COPY backend/*.py ./

# Copy built frontend into static/ so FastAPI can serve it
COPY --from=frontend-build /app/dist ./static/

# Non-root user
RUN useradd --create-home appuser
USER appuser

EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
