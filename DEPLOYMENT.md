# Deployment Guide

This project is set up for a split deployment:
- **Backend (Django)**: Deployed on **Render** (Python + Postgres).
- **Frontend (React)**: Deployed on **Vercel**.

## 1. Push Code to GitHub
Ensure all your latest changes are pushed to GitHub.
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

## 2. Deploy Backend (Render)
1.  Sign up/Login to [Render.com](https://render.com).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  Select the **backend** folder as the `Root Directory`. `Settings > Root Directory: backend`.
5.  **Runtime**: `Python 3`
6.  **Build Command**: `./build.sh`
7.  **Start Command**: `gunicorn playto_backend.wsgi:application`
8.  **Environment Variables**:
    *   `PYTHON_VERSION`: `3.9.0` (or your local version)
    *   `SECRET_KEY`: (Generate a random string)
    *   `DEBUG`: `False`
    *   `ALLOWED_HOSTS`: `*` (or your frontend domain later)
    *   `DATABASE_URL`: Render will provide this if you create a Postgres database.
        *   **Recommended**: Go to **Dashboard > New + > PostgreSQL**. Create it. Copy the `Internal Database URL`. Add it as `DATABASE_URL` in your Web Service environment variables.

9.  Deploy! Wait for it to go live. Copy the **Service URL** (e.g., `https://playto-backend.onrender.com`).

## 3. Deploy Frontend (Vercel)
1.  Sign up/Login to [Vercel.com](https://vercel.com).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Framework Preset**: Create React App (should auto-detect).
5.  **Root Directory**: Edit this -> select `frontend`.
6.  **Environment Variables**:
    *   `REACT_APP_API_URL`: Paste your Render Backend URL (e.g., `https://playto-backend.onrender.com`) **IMPORTANT**: Do NOT add a trailing slash.
7.  Deploy!

## 4. Final Configuration
1.  Go back to **Render** (Backend).
2.  Update `CORS_ALLOWED_ORIGINS` env var (or strict `ALLOWED_HOSTS` if you changed it from `*`) to include your new Vercel domain (e.g., `https://playto-frontend.vercel.app`).
    *   Example env var: `CORS_ALLOWED_ORIGINS` = `https://playto-frontend.vercel.app`
3.  Enjoy your live app!
