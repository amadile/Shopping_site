# Frontend-Backend Integration Guide

## 🎉 Complete Integration Setup

This guide will help you integrate the Vue.js frontend with your Express.js backend.

## 📋 Prerequisites

✅ Backend running on `http://localhost:5000`  
✅ Node.js 18+ installed  
✅ MongoDB running  
✅ Redis running (for Socket.io and sessions)

## 🚀 Step-by-Step Setup

### Step 1: Install Frontend Dependencies

```bash
cd frontend
npm install
```

This will install:

- Vue 3 - Frontend framework
- Vue Router - Routing
- Pinia - State management
- Axios - HTTP client
- Socket.io-client - Real-time communication
- Vue Toastification - Notifications
- Tailwind CSS - Styling
- And more...

### Step 2: Configure Environment

Create `.env` file in `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000
```

For production:

```env
VITE_API_URL=https://your-production-api.com
```

### Step 3: Start Development Servers

**Terminal 1 - Backend:**

```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

**Terminal 3 - Backend Worker (optional but recommended):**

```bash
cd backend
npm run worker
```

### Step 4: Test the Integration

1. **Open browser:** http://localhost:3000
2. **Register a new account**
3. **Login with credentials**
4. **Test features:**
   - Add products to cart
   - View notifications
   - Check real-time updates

## 🔌 API Integration Points

### Authentication Flow

```
Frontend (Vue)              Backend (Express)
     |                            |
     |------ POST /api/auth/login-|
     |                            |
     |<----- JWT Token ----------|
     |                            |
  (Save token)              (Create session)
     |                            |
     |------ Socket.io connect---|
     |       (with token)         |
     |                            |
     |<----- Real-time updates --|
```

### Request Flow with CSRF

```
1. Frontend makes POST request
   ↓
2. api.js checks for CSRF token
   ↓
3. If no token, fetch from /api/csrf-token
   ↓
4. Add token to request header
   ↓
5. Send request to backend
   ↓
6. Backend validates CSRF token
   ↓
7. Process request and send response
```

## 🔔 Real-time Notifications Setup

### Backend Configuration

Your backend already has:

- ✅ Socket.io server initialized
- ✅ Notification service ready
- ✅ Notification routes configured

### Frontend Connection

The frontend automatically:

1. **Connects** on login
2. **Listens** for notification events
3. **Shows** toast popups
4. **Updates** notification bell count
5. **Disconnects** on logout

### Testing Real-time Notifications

**Option 1: Via Backend Code**

```javascript
// In any backend file
import notificationService from "./services/notificationService.js";

await notificationService.sendToUser(userId, {
  type: "order",
  title: "Order Shipped!",
  message: "Your order #12345 has been shipped",
  priority: "medium",
});
```

**Option 2: Via API Call**

```bash
# Using curl or Postman
POST http://localhost:5000/api/notifications
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userId": "user-id-here",
  "type": "promotion",
  "title": "Special Offer!",
  "message": "50% off on all items",
  "priority": "high"
}
```

## 🛒 Shopping Cart Integration

### Add to Cart Flow

```
User clicks "Add to Cart"
    ↓
Frontend: cartStore.addToCart(productId, quantity)
    ↓
API: POST /api/cart/add { productId, quantity }
    ↓
Backend: Validates stock, adds to cart
    ↓
Response: Updated cart object
    ↓
Frontend: Updates cart state & shows toast
    ↓
Header cart count updates automatically
```

### Cart Synchronization

- Cart persists in MongoDB
- Fetched on login
- Real-time updates via Pinia store
- Displayed in header with item count

## 🔐 Security Features

### CSRF Protection

**Backend sends token:**

```javascript
GET / api / csrf - token;
Response: {
  csrfToken: "abc123...";
}
```

**Frontend automatically:**

1. Fetches token on first POST/PUT/DELETE
2. Caches for 55 minutes
3. Includes in `x-csrf-token` header
4. Retries with new token on 403

### JWT Authentication

**Login process:**

```javascript
// Frontend
await authStore.login({ email, password })

// Backend responds with:
{
  token: "jwt-token",
  refreshToken: "refresh-token",
  user: { id, name, email, role }
}

// Frontend saves to:
- localStorage.authToken
- localStorage.refreshToken
- localStorage.user

// All subsequent requests include:
Authorization: Bearer <token>
```

## 📱 UI/UX Features

### Toast Notifications

```javascript
// Success
toast.success("Item added to cart!");

// Error
toast.error("Failed to add item");

// Warning
toast.warning("Low stock!");

// Info
toast.info("Order processing...");
```

### Loading States

```vue
<button :disabled="loading" class="btn btn-primary">
  <span v-if="!loading">Submit</span>
  <span v-else>
    <div class="spinner"></div>
    Loading...
  </span>
</button>
```

### Form Validation

```javascript
// Client-side validation
if (!email || !isValidEmail(email)) {
  toast.error("Invalid email");
  return;
}

// Server-side validation handled by backend
// Errors automatically shown as toast
```

## 🎨 Styling & Theming

### Tailwind CSS Classes

```html
<!-- Buttons -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-danger">Danger</button>

<!-- Cards -->
<div class="card">Content</div>

<!-- Inputs -->
<input class="input" type="text" />

<!-- Badges -->
<span class="badge badge-success">Active</span>
```

### Custom Styling

Edit `frontend/src/assets/main.css` to customize:

- Colors
- Fonts
- Spacing
- Animations

## 🧪 Testing Integration

### Test Checklist

- [ ] **User Registration**

  - Register new account
  - Receive email verification
  - Check user created in database

- [ ] **User Login**

  - Login with credentials
  - Token saved to localStorage
  - Redirected to home page
  - User menu shows name

- [ ] **Shopping Cart**

  - Add product to cart
  - Cart count updates in header
  - View cart page
  - Update quantities
  - Remove items

- [ ] **Real-time Notifications**

  - Login to see notification bell
  - Trigger notification from backend
  - Toast appears
  - Bell count updates
  - Click to view notification

- [ ] **Protected Routes**

  - Try accessing /admin without login → redirected
  - Try accessing /admin as customer → redirected
  - Login as admin → /admin accessible

- [ ] **Socket.io Connection**
  - Check browser console for "Socket.io connected"
  - Test real-time updates
  - Logout → socket disconnects

## 🐛 Troubleshooting

### Issue: CORS Errors

**Problem:** `Access-Control-Allow-Origin` error

**Solution:** Backend CORS configuration

```javascript
// backend/src/index.js
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Socket.io CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});
```

### Issue: Socket.io Won't Connect

**Problem:** Socket connection failed

**Checklist:**

1. ✅ Backend Socket.io initialized
2. ✅ Backend running on port 5000
3. ✅ Frontend proxy configured in vite.config.js
4. ✅ Valid auth token in localStorage
5. ✅ CORS configured for Socket.io

**Solution:**

```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
      },
    },
  },
});
```

### Issue: CSRF Token Errors

**Problem:** 403 Forbidden - Invalid CSRF token

**Solution:**

1. Clear browser cookies
2. Restart backend server
3. Frontend will auto-fetch new token
4. Check backend middleware order:

```javascript
app.use(csrfProtection); // Before routes
app.use("/api", routes); // After CSRF
```

### Issue: API Requests Not Working

**Problem:** Network errors or timeouts

**Checklist:**

1. Backend running? `curl http://localhost:5000/api/products`
2. Correct API URL in `.env`?
3. Token in localStorage? Check browser DevTools
4. CORS enabled in backend?

## 📊 Monitoring

### Browser DevTools

**Check Connection Status:**

```javascript
// Console
localStorage.getItem("authToken"); // Should show JWT
localStorage.getItem("user"); // Should show user JSON
```

**Check Socket Connection:**

```javascript
// Console (when logged in)
// Should see: "Socket.io connected"
```

**Network Tab:**

- API requests should return 200/201
- Socket.io should show "101 Switching Protocols"
- Check request/response headers

## 🚀 Production Deployment

### Frontend Build

```bash
cd frontend
npm run build
```

Output in `frontend/dist/`

### Deployment Options

**Option 1: Static Hosting (Netlify/Vercel)**

1. Connect GitHub repo
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable: `VITE_API_URL`

**Option 2: Same Server as Backend**

```javascript
// backend/src/index.js
import path from "path";

// Serve frontend build
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// Handle SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});
```

**Option 3: Docker**

```dockerfile
# Multi-stage build
FROM node:18 as frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:18
WORKDIR /app
COPY backend/ ./
COPY --from=frontend /app/frontend/dist ./public
RUN npm ci --production
EXPOSE 5000
CMD ["npm", "start"]
```

## ✅ Integration Complete!

Your Vue.js frontend is now fully integrated with the Express.js backend!

### What You Have:

- ✅ Modern Vue 3 application
- ✅ Real-time notifications with Socket.io
- ✅ Secure authentication with JWT
- ✅ CSRF protection
- ✅ Shopping cart functionality
- ✅ Responsive UI with Tailwind CSS
- ✅ State management with Pinia
- ✅ Production-ready architecture

### Next Steps:

1. Implement remaining views (products, orders, admin)
2. Add more features as needed
3. Customize styling and branding
4. Add analytics tracking
5. Deploy to production

## 📚 Additional Resources

- [Vue.js Documentation](https://vuejs.org)
- [Pinia Documentation](https://pinia.vuejs.org)
- [Socket.io Client API](https://socket.io/docs/v4/client-api/)
- [Tailwind CSS](https://tailwindcss.com)
- [Axios Documentation](https://axios-http.com)

---

**Need Help?**

- Check the README.md files
- Review the code comments
- Test individual features
- Check browser console for errors

**Happy coding! 🎉**
