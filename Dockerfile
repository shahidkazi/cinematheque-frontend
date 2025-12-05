# Dockerfile for production deployment
FROM python:3.10-slim as backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend.py .

# Build frontend
FROM node:18-alpine as frontend

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy frontend code
COPY App.jsx App.css ./src/
COPY public ./public/

# Build the React app
RUN npm run build

# Final stage
FROM python:3.10-slim

WORKDIR /app

# Copy backend from backend stage
COPY --from=backend /app /app
COPY --from=backend /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages

# Copy frontend build from frontend stage
COPY --from=frontend /app/build ./build

# Install uvicorn for production
RUN pip install uvicorn[standard]

# Create a production-ready backend file
RUN echo 'from backend import *\nfrom fastapi.staticfiles import StaticFiles\napp.mount("/", StaticFiles(directory="build", html=True), name="static")' > production.py

# Expose port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["uvicorn", "production:app", "--host", "0.0.0.0", "--port", "8000"]
