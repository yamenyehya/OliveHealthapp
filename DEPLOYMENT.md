# Olive Health — Deployment & SEO Launch Guide

This guide provides simple, step-by-step instructions to successfully deploy Olive Health to Render, resolve MongoDB connection issues, and achieve perfect search engine indexing for articles.

---

## 1. MongoDB Atlas Configuration (Crucial)

Since Render uses dynamic, rotating outbound IP addresses, your MongoDB Atlas cluster will block requests from Render by default unless you configure **IP Access Lists** correctly.

### Step-by-Step Fix:
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Select your project and navigate to **Security** -> **Network Access** in the left sidebar.
3. Click the **Add IP Address** button.
4. Select **Allow Access From Anywhere** (IP `0.0.0.0/0`).
5. Click **Confirm**. 
   *Note: This is completely safe as your database is fully secured by your strong username and password credentials (e.g., `<your_username>` / `<your_password>`).*

---

## 2. Deploying to Render (Fast & Easy)

We have pre-configured a Blueprint layout in `/render.yaml` for a single-click deployment.

### Option A: Manual Setup (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New** -> **Web Service**.
2. Connect your GitHub repository (`yamenyehya/olivehealth`).
3. Configure the following settings:
   * **Language/Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start`
4. Expand the **Environment Variables** section and add:
   * `NODE_ENV`: `production`
   * `JWT_SECRET`: `<your_jwt_secret>`
   * `MONGODB_URI`: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=<app_name>`
   * `GEMINI_API_KEY`: `<your_gemini_api_key>`
   * `APP_URL`: `https://your-app-name.onrender.com` (replace with your actual Render URL once generated)
   * `GOOGLE_CLIENT_ID`: `<your_google_client_id>`
   * `GOOGLE_CLIENT_SECRET`: `<your_google_client_secret>`
5. Click **Deploy Web Service**.

---

## 3. SEO, Custom URLs, & Indexing

The platform is equipped with modern, server-side SEO architecture:
1. **Dynamic Articles Subdomains & Paths**: Visiting `/articles/some-article-slug` runs an SEO-prepass middleware. It loads the exact article from MongoDB, replaces browser titles, and injects dynamic `<meta name="description">`, **OpenGraph (OG)**, and **Twitter Cards** metadata so links look beautiful when shared on social media and indexers.
2. **Sitemap (`/sitemap.xml`)**: Serves an up-to-date, structured XML index mapping all approved medical articles, priorities, and edit dates for Google Search Console.
3. **Robots Control (`/robots.txt`)**: Points search bots directly to your sitemap.

---

## 4. Google Authentication

* **Google Login**: Works out of the box using your production Google OAuth credentials. If `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is not set in the environment variables, the system gracefully provides a developer-friendly modal to continue with a simulation.
