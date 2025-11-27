# 🚀 Recommended Deployment: Separate Services

You asked for the **better approach**, and this is it.

Instead of trying to cram everything into one service, we will deploy:
1.  **Backend** as a **Web Service** (API only).
2.  **Frontend** as a **Static Site** (Fast, reliable, optimized for Vue).

This is the industry standard. It makes debugging easier and builds faster.

---

## Part 1: Deploy the Backend (Web Service)

1.  **Go to Render Dashboard** -> **New** -> **Web Service**.
2.  **Connect your Repo** (`Shopping_site`).
3.  **Settings**:
    *   **Name**: `shopping-backend` (or similar)
    *   **Root Directory**: `backend`
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
4.  **Environment Variables** (Add these):
    *   `NODE_ENV` = `production`
    *   `MONGO_URI` = *(Your MongoDB Connection String)*
    *   `JWT_SECRET` = *(Your Secret)*
    *   `MUNOPAY_API_KEY` = *(Your MunoPay Key)*
    *   `MUNOPAY_WEBHOOK_SECRET` = *(Your Secret)*
    *   `MUNOPAY_MERCHANT_ID` = *(Your ID)*
    *   `MUNOPAY_MODE` = `live`
    *   `ALLOWED_ORIGINS` = `*`  *(Temporarily allow all for setup)*
5.  **Click "Create Web Service"**.
6.  **Wait for it to go Live**.
7.  **Copy the Backend URL** (e.g., `https://shopping-backend.onrender.com`).

---

## Part 2: Deploy the Frontend (Static Site)

1.  **Go to Render Dashboard** -> **New** -> **Static Site**.
2.  **Connect your Repo** (`Shopping_site`).
3.  **Settings**:
    *   **Name**: `shopping-frontend`
    *   **Root Directory**: `frontend`
    *   **Build Command**: `npm install && npm run build`
    *   **Publish Directory**: `dist`
4.  **Environment Variables** (Add this):
    *   `VITE_API_URL` = *(Paste your Backend URL from Part 1)*
        *   *Example: `https://shopping-backend.onrender.com`*
5.  **Click "Create Static Site"**.
6.  **Wait for it to go Live**.
7.  **Copy the Frontend URL** (e.g., `https://shopping-frontend.onrender.com`).

---

## Part 3: Secure the Connection

Now that you have the Frontend URL, let's lock down the Backend.

1.  Go back to your **Backend Web Service** -> **Environment**.
2.  Edit `ALLOWED_ORIGINS`.
3.  Change `*` to your **Frontend URL**.
    *   *Example: `https://shopping-frontend.onrender.com`*
4.  **Save Changes**. The backend will restart automatically.

---

## ✅ You are Done!

**Why this is better:**
*   **No "Vite not found" errors**: The frontend builds in its own clean environment.
*   **Faster**: Frontend and Backend deploy independently.
*   **Cheaper/Free**: Render's Free Tier supports both of these service types!
