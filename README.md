# Inventory & Order Management System

A simplified full-stack application for managing products, customers, orders, and inventory tracking.

## Features

- **Products**: CRUD operations with unique SKU enforcement
- **Customers**: CRUD operations with unique email enforcement
- **Orders**: Create orders with line items, stock validation, and automatic inventory reduction
- **Inventory tracking**: Audit log for initial stock, manual adjustments, and order placements
- **Responsive UI**: React dashboard for day-to-day operations
- **Dockerized stack**: PostgreSQL, FastAPI backend, and React frontend via Docker Compose

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Frontend | React, Vite, React Router |
| Database | PostgreSQL |
| Containerization | Docker, Docker Compose |

## Business Rules

1. Product SKUs must be unique
2. Customer emails must be unique
3. Orders cannot be created when requested quantity exceeds available stock
4. Stock is reduced automatically when an order is confirmed
5. Inventory changes are recorded in an audit log

## Project Structure

```text
inventory-order-management/
├── backend/                 # FastAPI application
├── frontend/                # React application
├── docker-compose.yml       # Local development stack
├── docker-compose.prod.yml  # Production-style compose file
└── .env.example             # Environment variable template
```

## Quick Start (Docker)

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Start all services:

```bash
docker compose up --build
```

3. Open the application:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

## Local Development (Without Docker)

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://inventory_user:inventory_pass@localhost:5432/inventory_db
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
export VITE_API_URL=http://localhost:8000
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product |
| PUT | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product |
| GET | `/api/products/{id}/inventory` | Product inventory history |
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/{id}` | Update customer |
| DELETE | `/api/customers/{id}` | Delete customer |
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Create order |
| GET | `/api/inventory/logs` | Inventory audit log |

## Deployment Guide

### 1. GitHub Repository

```bash
git add .
git commit -m "Add inventory and order management system"
git branch -M main
git remote add origin https://github.com/<your-username>/inventory-order-management.git
git push -u origin main
```

### 2. Backend + PostgreSQL (Render)

1. Create a **PostgreSQL** database on Render.
2. Create a **Web Service** from the backend Dockerfile.
3. Set environment variables:
   - `DATABASE_URL` = Render internal PostgreSQL URL
   - `CORS_ORIGINS` = your frontend public URL
4. Deploy and note the backend URL.

Suggested backend URL placeholder: `https://inventory-order-backend.onrender.com`

### 3. Frontend (Vercel or Netlify)

1. Import the GitHub repository.
2. Set root directory to `frontend`.
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Set environment variable:
   - `VITE_API_URL` = your deployed backend URL

Suggested frontend URL placeholder: `https://inventory-order-frontend.vercel.app`

### 4. Docker Hub Images

Push images manually:

```bash
docker build -t <dockerhub-username>/inventory-order-backend:latest ./backend
docker build --build-arg VITE_API_URL=https://your-backend-url -t <dockerhub-username>/inventory-order-frontend:latest ./frontend
docker push <dockerhub-username>/inventory-order-backend:latest
docker push <dockerhub-username>/inventory-order-frontend:latest
```

Or configure GitHub Actions secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- Repository variable `VITE_API_URL`

## Submission Checklist

Replace placeholders with your deployed resources:

| Item | Link |
| --- | --- |
| GitHub Repository | `https://github.com/<your-username>/inventory-order-management` |
| Backend Docker Image | `https://hub.docker.com/r/<your-username>/inventory-order-backend` |
| Frontend Docker Image | `https://hub.docker.com/r/<your-username>/inventory-order-frontend` |
| Live Backend URL | `https://<your-backend-host>/docs` |
| Live Frontend URL | `https://<your-frontend-host>` |

## Environment Variables

See `.env.example` for all supported variables. Never commit real credentials to source control.

## License

MIT
