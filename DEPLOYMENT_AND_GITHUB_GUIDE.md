# DDC Compiler — GitHub & Cloud Deployment Guide

This project is the complete **Designers Domain Club (DDC) Contest & Compiler Platform** built with Express, React (Vite + Tailwind CSS), Monaco Editor, isolated code execution runners (Python, C, Java, C++), real-time SSE leaderboards, and PostgreSQL database persistence.

---

## 🔑 1. Admin & Default Credentials

| Role | Username / Identifier | Password / Passcode | Notes |
| :--- | :--- | :--- | :--- |
| **Admin Control Center** | `admin` | `aegis2026` | Full administrative control, timer reset, question bank editor, contest manager & CSV export. |
| **Custom Admin Passcode** | Set via `ADMIN_PASSWORD` in `.env` | e.g. `aegis2026` | Can be overridden anytime via environment variable. |

---

## 🗄️ 2. Database Schema & Ready-to-Run SQL File

All PostgreSQL database tables, foreign keys, indexes, and full contest seed data are located in:
📄 **`/init_database.sql`** (in the root directory).

### How to Initialize the Database:
You can run this file in any PostgreSQL provider (Neon, Supabase, Railway, Render, AWS RDS, Cloud SQL, or local PostgreSQL):

#### Option A: Using `psql` command line
```bash
psql "postgresql://username:password@host:5432/dbname" -f init_database.sql
```

#### Option B: Using Cloud Dashboards (Supabase / Neon / Render)
1. Open your database web console (e.g. Supabase SQL Editor or Neon SQL Editor).
2. Paste the contents of `init_database.sql`.
3. Click **Run / Execute**.

#### Option C: Automatic on App Startup
The application has built-in Drizzle ORM synchronization (`src/db/seed.ts`). When you start the server with `DATABASE_URL` configured, it automatically provisions and synchronizes tables if they do not already exist.

---

## ⚙️ 3. Environment Variables (`.env`)

Create a `.env` file in your root folder:

```env
# Server Port (Default: 3000)
PORT=3000

# Admin Portal Passcode
ADMIN_PASSWORD=aegis2026

# PostgreSQL Connection String
# Works seamlessly with Neon, Supabase (Transaction Pooler / Session), Render, Railway, AWS RDS
DATABASE_URL=postgresql://postgres:your_password@your_db_host:5432/ddc_compiler?sslmode=require

# (Optional) Google Cloud SQL Parameters if deploying on GCP Cloud Run
# SQL_HOST=
# SQL_DB_NAME=
# SQL_USER=
# SQL_PASSWORD=
```

---

## 🚀 4. How to Export & Push to GitHub

### Step 1: Export from AI Studio / Local Terminal
In Google AI Studio, open the **Settings / Menu** in the top-right and click **Export to GitHub** or **Download ZIP**.

If working in terminal:
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: DDC Compiler with PostgreSQL & Monaco Editor"

# Create a new repository on GitHub, then link it:
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ddc-compiler.git
git branch -M main
git push -u origin main
```

---

## ☁️ 5. Deployment Options on Various Clouds

### 🌐 Deploy on Render.com (Recommended - 2 Clicks)
1. Go to [Render.com](https://render.com) and create a **New PostgreSQL Database**.
2. Copy the **Internal Database URL** or **External Database URL**.
3. Create a **New Web Service** and connect your GitHub repository.
4. Settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Under **Environment Variables**, add:
   - `DATABASE_URL`: *(Your PostgreSQL URL from step 2)*
   - `ADMIN_PASSWORD`: `aegis2026`
   - `NODE_ENV`: `production`
6. Click **Deploy**.

---

### 🚂 Deploy on Railway.app
1. Go to [Railway.app](https://railway.app) and click **New Project** -> **Provision PostgreSQL**.
2. Click **Add Service** -> **GitHub Repo** -> Select your repo.
3. In Variables:
   - Set `DATABASE_URL` to `${{Postgres.DATABASE_URL}}`
   - Set `ADMIN_PASSWORD` to `aegis2026`
4. Railway will automatically detect the `package.json`, build the frontend with Vite, bundle the server with esbuild, and start on port 3000.

---

### ⚡ Deploy on Supabase + Vercel / Render
1. Create a free PostgreSQL database on [Supabase.com](https://supabase.com).
2. In Supabase Dashboard -> **Project Settings** -> **Database**, copy the **Connection string** (URI).
3. Paste the SQL script from `init_database.sql` into Supabase **SQL Editor** and run it.
4. Deploy the Express + React backend to Render, Railway, or Google Cloud Run using the Supabase Connection URI as `DATABASE_URL`.

---

### 🐳 Deploy with Docker / Self-Hosted VPS (Ubuntu / Debian)
A `Dockerfile` is included in the project:
```bash
# Build the Docker container
docker build -t ddc-compiler .

# Run container with your database URL
docker run -d -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/dbname" \
  -e ADMIN_PASSWORD="aegis2026" \
  --name ddc-compiler-app \
  ddc-compiler
```

---

## 📦 6. Package Scripts Summary

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts live development server with hot reloads (`tsx server.ts`) |
| `npm run build` | Builds Vite SPA (`dist/`) and compiles TypeScript server to standalone CommonJS bundle (`dist/server.cjs`) |
| `npm start` | Runs production server (`node dist/server.cjs`) |
| `npm run lint` | Typechecks with `tsc --noEmit` |
