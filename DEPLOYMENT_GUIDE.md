# 🚀 Unified Deployment Guide (Backend + Frontend)

This guide explains how to deploy your **entire application** (Backend + Frontend) as a single unit using **Render**. This is the easiest and most professional way to host your site.

---

## 📋 Prerequisites

1.  **GitHub Account**: You need a GitHub account.
2.  **Push Code**: Ensure your latest code (including the `backend` and `frontend` folders) is pushed to a GitHub repository.

---

## 🛠️ Step 1: Prepare Your Code (Already Done!)

I have already configured your backend to serve the frontend files. When you deploy, the server will:
1.  Start the API.
2.  Serve your website (Vue.js app) from the same URL.

---

## ☁️ Step 2: Deploy to Render

1.  **Sign Up/Login**: Go to [render.com](https://render.com) and log in with GitHub.
2.  **New Web Service**: Click **"New +"** -> **"Web Service"**.
3.  **Connect Repo**: Select your `Shopping_site` repository.
4.  **Configure Settings**:
    *   **Name**: `amadile-shopping` (or any name)
    *   **Region**: Frankfurt (EU) or Ohio (US) - whichever is closer to your users.
    *   **Branch**: `main` (or `master`)
    *   **Root Directory**: `.` (Leave empty or dot)
    *   **Runtime**: `Node`
    *   **Build Command**:
        ```bash
        cd frontend && npm install && npm run build && cd ../backend && npm install
        ```
    *   **Start Command**:
        ```bash
        cd backend && npm start
        ```
    *   **Instance Type**: Free

5.  **Environment Variables**:
    Scroll down to "Environment Variables" and click **"Add Environment Variable"**. Add these from your `.env` file:
    *   `NODE_ENV`: `production`
    *   `MONGO_URI`: (Your MongoDB connection string)
    *   `JWT_SECRET`: (Your secret)
    *   `MUNOPAY_API_KEY`: `Mp_key-cef62fccf747552593fece07edf4aa3d-X`
    *   `MUNOPAY_WEBHOOK_SECRET`: `acc2159ce48845641fb7b33e`
    *   `MUNOPAY_MERCHANT_ID`: `01007466397725`
    *   `MUNOPAY_MODE`: `live` (Change to 'live' when ready, or keep 'sandbox')
    *   `API_URL`: `https://your-app-name.onrender.com` (The URL Render gives you)
    *   `BASE_URL`: `https://your-app-name.onrender.com`

6.  **Deploy**: Click **"Create Web Service"**.

---

## ⏳ Step 3: Wait for Build

Render will now:
1.  Install frontend dependencies.
2.  Build your Vue.js app (create the `dist` folder).
3.  Install backend dependencies.
4.  Start the server.

This process takes about 3-5 minutes.

---

## ✅ Step 4: Final Configuration

Once deployed, Render will give you a URL (e.g., `https://amadile-shopping.onrender.com`).

1.  **Update MunoPay Webhook**:
    *   Go to your MunoPay Dashboard.
    *   Set Webhook URL to: `https://amadile-shopping.onrender.com/api/payment/munopay/webhook`

2.  **Test**:
    *   Visit `https://amadile-shopping.onrender.com`.
    *   You should see your website!
    *   Try placing an order.

---

## ❓ Troubleshooting

*   **"Internal Server Error"**: Check the "Logs" tab in Render to see what went wrong.
*   **"Page Not Found"**: Ensure the Build Command ran successfully and created the `frontend/dist` folder.
