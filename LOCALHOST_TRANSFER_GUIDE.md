# Transfer from Vercel + Render to Localhost

## The Problem
The distributed cloud deployment strategy—hosting the Next.js frontend on Vercel and the Laravel backend/database on Render—introduced unnecessary complexity for the current development phase. High latency between services, cold start times on the free tiers, and the difficulty of debugging cross-origin issues hindered rapid iteration. Additionally, managing separate production environments created overhead that distracted from core feature development.

## The Solution
The entire application stack was migrated back to a unified local development environment to restore speed and simplify debugging.

### 1. Backend Migration (Laravel)
The Laravel API was reverted to run locally using XAMPP.
*   **Database**: The `.env` configuration was updated to point `DB_HOST` to `127.0.0.1` and `DB_DATABASE` to the local instance, bypassing the remote Render PostgreSQL/MySQL database.
*   **Server**: Instead of a cloud-based web service, the backend is now served via the local Apache server (or `php artisan serve`), allowing for instant log feedback and zero-latency internal requests.

### 2. Frontend Migration (Next.js)
The frontend build process was moved off Vercel's CI/CD pipeline.
*   **API Connection**: The frontend environment variables (specifically the API base URL) were updated to point to the local backend (`http://localhost:8000` or corresponding XAMPP URL), eliminating CORS friction and network lag.
*   **Execution**: The application is now run via `npm run dev` locally, enabling Hot Module Replacement (HMR) and immediate reflection of changes.
