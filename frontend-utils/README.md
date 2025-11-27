# Frontend API Integration Guide

## 🚀 Quick Start

The CSRF protection is **automatically handled** by the API client. Just import and use!

### Installation

1. Copy `csrfManager.js` and `api.js` to your frontend project
2. Install if needed: No external dependencies required!

### Basic Usage

```javascript
import api from "./utils/api";

// All methods automatically include CSRF tokens when needed!

// Example: Register a user
const registerUser = async () => {
  try {
    const result = await api.register({
      name: "John Doe",
      email: "john@example.com",
      password: "securePassword123",
    });
    console.log("User registered:", result);
  } catch (error) {
    console.error("Registration failed:", error.message);
  }
};

// Example: Add item to cart
const addToCart = async (productId) => {
  try {
    const cart = await api.addToCart(productId, 2); // quantity = 2
    console.log("Cart updated:", cart);
  } catch (error) {
    console.error("Failed to add to cart:", error.message);
  }
};

// Example: Checkout
const checkout = async () => {
  try {
    const order = await api.checkout();
    console.log("Order created:", order);
  } catch (error) {
    console.error("Checkout failed:", error.message);
  }
};
```

## 📚 API Methods

### Authentication

```javascript
// Register new user
await api.register({ name, email, password });

// Login (auto-saves token)
await api.login({ email, password });

// Logout (clears tokens)
await api.logout();

// Forgot password
await api.forgotPassword("user@example.com");

// Reset password
await api.resetPassword(token, newPassword);
```

### Products

```javascript
// Get all products with filters
await api.getProducts({
  category: "electronics",
  page: 1,
  limit: 10,
});

// Get single product
await api.getProduct(productId);

// Create product (vendor/admin)
await api.createProduct({ name, description, price, category, stock });

// Update product
await api.updateProduct(productId, { price: 99.99 });

// Delete product (admin)
await api.deleteProduct(productId);
```

### Shopping Cart

```javascript
// Get cart
await api.getCart();

// Add to cart
await api.addToCart(productId, quantity);

// Update quantity
await api.updateCartItem(productId, newQuantity);

// Remove item
await api.removeFromCart(productId);

// Clear cart
await api.clearCart();
```

### Orders

```javascript
// Checkout (create order from cart)
await api.checkout();

// Get my orders
await api.getMyOrders();

// Get specific order
await api.getOrder(orderId);

// Update order status (admin)
await api.updateOrderStatus(orderId, "shipped");
```

### Payments

```javascript
// Create payment intent
const { clientSecret } = await api.createPaymentIntent(orderId);

// Confirm payment
await api.confirmPayment(paymentIntentId, orderId);
```

### Reviews

```javascript
// Add review
await api.addReview(productId, 5, "Great product!");

// Get product reviews
await api.getReviews(productId);

// Delete review
await api.deleteReview(reviewId);
```

### User Profile

```javascript
// Get profile
await api.getProfile();

// Update profile
await api.updateProfile({ name: "New Name" });

// Change password
await api.changePassword("oldPass", "newPass");

// Manage addresses
await api.getAddresses();
await api.addAddress({ fullName, addressLine1, city, state, zipCode, country });
await api.updateAddress(addressId, { city: "New City" });
await api.deleteAddress(addressId);
```

### Admin APIs

```javascript
// User management
await api.getUsers({ role: "customer", page: 1 });
await api.getUser(userId);
await api.updateUser(userId, { role: "vendor" });
await api.deleteUser(userId);

// Order management
await api.getAdminOrders({ status: "pending" });

// Statistics
await api.getAdminStats();
```

### Analytics (Admin)

```javascript
// Sales analytics
await api.getSalesAnalytics("30d"); // '7d', '30d', '90d'

// Top products
await api.getProductAnalytics(10);

// Customer analytics
await api.getCustomerAnalytics();
```

## 🔒 CSRF Protection (Automatic)

CSRF tokens are **automatically managed**:

- ✅ Fetched on first POST/PUT/DELETE request
- ✅ Cached for 1 hour
- ✅ Auto-refreshed when expired
- ✅ Auto-retried on 403 errors
- ✅ Cleared on logout

**You don't need to do anything!** Just use the API methods.

## 🔑 Authentication Flow

```javascript
// 1. Login
const { token, refreshToken } = await api.login({ email, password });
// Tokens are automatically stored in localStorage

// 2. Make authenticated requests
// Authorization header is automatically added
const profile = await api.getProfile();

// 3. Logout
await api.logout();
// Tokens are automatically cleared
```

## ⚙️ Configuration

### Change API Base URL

**For React:**

```javascript
// .env
REACT_APP_API_URL=https://api.yoursite.com
```

**For Vue.js:**

```javascript
// .env
VUE_APP_API_URL=https://api.yoursite.com
```

**Manual override:**

```javascript
import api from "./utils/api";
api.baseURL = "https://api.yoursite.com";
```

## 🎨 Framework-Specific Examples

### React Example

```jsx
import React, { useState, useEffect } from "react";
import api from "./utils/api";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.getProducts({ limit: 20 });
        setProducts(data.products);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (productId) => {
    try {
      await api.addToCart(productId, 1);
      alert("Added to cart!");
    } catch (error) {
      alert("Failed to add to cart");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {products.map((product) => (
        <div key={product._id}>
          <h3>{product.name}</h3>
          <p>${product.price}</p>
          <button onClick={() => handleAddToCart(product._id)}>
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Vue.js Example

```vue
<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div v-for="product in products" :key="product._id">
        <h3>{{ product.name }}</h3>
        <p>${{ product.price }}</p>
        <button @click="addToCart(product._id)">Add to Cart</button>
      </div>
    </div>
  </div>
</template>

<script>
import api from "@/utils/api";

export default {
  data() {
    return {
      products: [],
      loading: true,
    };
  },
  async mounted() {
    try {
      const data = await api.getProducts({ limit: 20 });
      this.products = data.products;
    } catch (error) {
      console.error("Error:", error);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async addToCart(productId) {
      try {
        await api.addToCart(productId, 1);
        alert("Added to cart!");
      } catch (error) {
        alert("Failed to add to cart");
      }
    },
  },
};
</script>
```

## 🛠️ Advanced Usage

### Custom Request with CSRF

```javascript
import csrfManager from "./utils/csrfManager";

const customRequest = async () => {
  const response = await csrfManager.secureRequest("/api/custom-endpoint", {
    method: "POST",
    headers: {
      "Custom-Header": "value",
    },
    body: JSON.stringify({ data: "value" }),
  });

  return response.json();
};
```

### Manual Token Management

```javascript
import { getCSRFToken, clearCSRFToken } from "./utils/csrfManager";

// Get token manually
const token = await getCSRFToken();

// Clear token manually
clearCSRFToken();
```

## 🐛 Error Handling

```javascript
try {
  await api.login({ email, password });
} catch (error) {
  // error.message contains the error description
  if (error.message.includes("Invalid credentials")) {
    // Handle invalid login
  } else if (error.message.includes("403")) {
    // Handle forbidden
  } else {
    // Handle other errors
  }
}
```

## ✅ Best Practices

1. **Always use try-catch** when calling API methods
2. **Store tokens in localStorage** (done automatically)
3. **Clear tokens on logout** (done automatically)
4. **Don't expose sensitive data** in client-side code
5. **Use HTTPS** in production

## 🔐 Security Notes

- ✅ CSRF tokens are automatically included
- ✅ Authorization tokens are stored securely
- ✅ Credentials are included for cookie-based auth
- ✅ Tokens auto-refresh on expiry
- ⚠️ Always use HTTPS in production
- ⚠️ Never commit API keys or secrets

---

**That's it!** CSRF protection is fully automated. Just import and use the API client! 🎉
