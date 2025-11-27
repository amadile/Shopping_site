# 🚀 Frontend CSRF Integration - Quick Start

## ✅ What's Been Created

I've created a **complete, production-ready frontend API client** with automatic CSRF protection:

### 📁 Files Created

```
frontend-utils/
├── csrfManager.js    - CSRF token management (automatic)
├── api.js            - Ready-to-use API client with all endpoints
├── README.md         - Complete documentation
└── test.html         - Interactive test page
```

## 🎯 How to Use

### Option 1: Test Immediately (Simple HTML)

1. **Open test.html in a browser that supports ES6 modules:**

   ```bash
   # You need a local server to test ES6 modules
   # Install http-server globally:
   npm install -g http-server

   # Then run from frontend-utils directory:
   cd c:\Users\amadi\Shopping_site\frontend-utils
   http-server -p 8080
   ```

2. **Open in browser:**

   ```
   http://localhost:8080/test.html
   ```

3. **Test the API:**
   - Click "Get CSRF Token" - CSRF protection working
   - Register a user - Automatic CSRF token included
   - Login - Token saved automatically
   - All other operations work seamlessly!

### Option 2: Integrate with Your Frontend Framework

#### **React/Next.js:**

1. Copy files to your project:

   ```bash
   cp frontend-utils/csrfManager.js src/utils/
   cp frontend-utils/api.js src/utils/
   ```

2. Use in components:

   ```jsx
   import api from "./utils/api";

   function MyComponent() {
     const handleLogin = async () => {
       try {
         await api.login({ email, password });
         // CSRF token automatically included!
       } catch (error) {
         console.error(error);
       }
     };
   }
   ```

#### **Vue.js:**

1. Copy files to your project:

   ```bash
   cp frontend-utils/csrfManager.js src/utils/
   cp frontend-utils/api.js src/utils/
   ```

2. Use in components:

   ```vue
   <script>
   import api from "@/utils/api";

   export default {
     methods: {
       async handleLogin() {
         try {
           await api.login({ email, password });
           // CSRF token automatically included!
         } catch (error) {
           console.error(error);
         }
       },
     },
   };
   </script>
   ```

#### **Plain JavaScript:**

```html
<script type="module">
  import api from "./utils/api.js";

  // Just use it!
  await api.login({ email, password });
</script>
```

## 🔒 CSRF Protection is Automatic!

You don't need to do anything special:

```javascript
// Before (manual CSRF):
const csrfToken = await fetch("/api/csrf-token").then((r) => r.json());
await fetch("/api/cart/add", {
  method: "POST",
  headers: {
    "X-CSRF-Token": csrfToken.csrfToken, // ❌ Manual
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ productId, quantity }),
});

// After (automatic CSRF):
await api.addToCart(productId, quantity); // ✅ Automatic!
```

## 📚 Available API Methods

All methods are ready to use - **CSRF tokens are automatically included**:

### Authentication

- `api.register(userData)`
- `api.login(credentials)`
- `api.logout()`
- `api.forgotPassword(email)`
- `api.resetPassword(token, password)`

### Products

- `api.getProducts(params)`
- `api.getProduct(id)`
- `api.createProduct(data)`
- `api.updateProduct(id, data)`
- `api.deleteProduct(id)`

### Cart

- `api.getCart()`
- `api.addToCart(productId, quantity)`
- `api.updateCartItem(productId, quantity)`
- `api.removeFromCart(productId)`
- `api.clearCart()`

### Orders

- `api.checkout()`
- `api.getMyOrders()`
- `api.getOrder(id)`
- `api.updateOrderStatus(id, status)`

### Payments

- `api.createPaymentIntent(orderId)`
- `api.confirmPayment(paymentIntentId, orderId)`

### Reviews

- `api.addReview(productId, rating, comment)`
- `api.getReviews(productId)`
- `api.deleteReview(id)`

### User Profile

- `api.getProfile()`
- `api.updateProfile(data)`
- `api.changePassword(current, new)`
- `api.getAddresses()`, `api.addAddress()`, etc.

### Admin

- `api.getUsers()`, `api.updateUser()`, etc.
- `api.getAdminOrders()`, `api.getAdminStats()`

### Analytics

- `api.getSalesAnalytics(period)`
- `api.getProductAnalytics(limit)`
- `api.getCustomerAnalytics()`

**See `README.md` for complete documentation!**

## ⚙️ Configuration

### Set your API URL:

**React (.env):**

```bash
REACT_APP_API_URL=http://localhost:5000
```

**Vue.js (.env):**

```bash
VUE_APP_API_URL=http://localhost:5000
```

**Production:**

```bash
REACT_APP_API_URL=https://api.yoursite.com
```

## 🎨 Example: Complete Login Flow

```javascript
import api from "./utils/api";

// 1. User fills in login form
const handleLogin = async (email, password) => {
  try {
    // 2. Login (CSRF token automatically included)
    const result = await api.login({ email, password });

    // 3. Token automatically saved to localStorage
    console.log("Logged in!", result);

    // 4. Now all requests include auth token
    const profile = await api.getProfile();
    console.log("Profile:", profile);
  } catch (error) {
    console.error("Login failed:", error.message);
  }
};

// Logout
const handleLogout = async () => {
  await api.logout(); // Clears tokens automatically
};
```

## 🧪 Testing the Integration

### Test with curl:

```bash
# Get CSRF token
curl http://localhost:5000/api/csrf-token

# Register (CSRF required)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_TOKEN_HERE" \
  -d '{"name":"Test","email":"test@test.com","password":"password123"}'
```

### Test with the HTML page:

```bash
# Start a local server
cd frontend-utils
python -m http.server 8080
# or
npx http-server -p 8080

# Open http://localhost:8080/test.html
```

## 🎯 What's Handled Automatically

✅ CSRF token fetching  
✅ CSRF token caching (1 hour)  
✅ CSRF token refresh on expiry  
✅ Auto-retry on 403 CSRF errors  
✅ Authorization header injection  
✅ Token storage in localStorage  
✅ Cookie credentials handling  
✅ Error handling

**You literally just import and use it!**

## 🔥 Summary

**Backend:** ✅ Secured with CSRF protection  
**Frontend:** ✅ Automatic CSRF handling ready  
**Integration:** ✅ Zero manual CSRF management needed

Just import `api` and use it. Everything else is automatic! 🎉

---

**Questions?** Check the full `README.md` for detailed documentation!
