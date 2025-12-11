# Docker Setup Guide

This project is fully dockerized. You can run the entire stack (Frontend, Backend, Database, Redis) with a single command.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

## Quick Start

1. **Start the System:**
   Open a terminal in the project root and run:
   ```bash
   docker-compose up --build
   ```
   - The `--build` flag ensures that any changes to your code are rebuilt into the containers.
   - Add `-d` to run in detached mode (background): `docker-compose up -d --build`

2. **Access the Application:**
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:5000](http://localhost:5000)
   - **MongoDB:** `localhost:27017`
   - **Redis:** `localhost:6379`

3. **Stop the System:**
   ```bash
   docker-compose down
   ```
   - To stop and remove volumes (reset database): `docker-compose down -v`

## Configuration

- **Frontend:** The frontend is served via Nginx on port 3000. It proxies API requests (`/api/*`) to the backend container.
- **Backend:** The backend runs on port 5000. It connects to the `mongodb` and `redis` containers automatically.
- **Environment Variables:**
  - The backend uses the `.env` file in `backend/.env`.
  - The `docker-compose.yml` overrides some variables (like `MONGO_URI` and `REDIS_URL`) to point to the docker containers.

## Troubleshooting

- **Database Connection Errors:** Ensure the `mongodb` container is running. Docker handles the networking, so `mongodb://admin:admin123@mongodb:27017/...` is the correct internal URL.
- **Frontend API Errors:** The frontend Nginx config proxies `/api` to `http://backend:5000/api`. Ensure the backend is running.
- **Rebuild:** If you install new packages, you must rebuild: `docker-compose up --build`.
