# Product Variants Implementation Guide

## ✅ What's Been Implemented

Product variants allow products to have multiple options (size, color, material, style) with individual SKUs, prices, and stock levels.

---

## 📊 Database Schema Changes

### Product Model (`backend/src/models/Product.js`)

**New Fields:**

```javascript
{
  variants: [
    {
      sku: String,         // Unique identifier (e.g., "T-SHIRT-L-RED")
      name: String,        // Display name (e.g., "Large / Red")
      size: String,        // "S", "M", "L", "XL", etc.
      color: String,       // "Red", "Blue", "Black", etc.
      material: String,    // "Cotton", "Polyester", etc.
      style: String,       // "Regular", "Slim Fit", etc.
      price: Number,       // Override product price (optional)
      stock: Number,       // Variant-specific stock
      images: [String],    // Variant-specific images
      isActive: Boolean    // Enable/disable variant
    }
  ],
  hasVariants: Boolean   // Quick check flag
}
```

### Cart Model (`backend/src/models/Cart.js`)

**New Fields:**

```javascript
{
  items: [
    {
      product: ObjectId,
      quantity: Number,
      variantId: ObjectId, // Reference to specific variant
      variantDetails: {
        // Denormalized for quick access
        sku: String,
        size: String,
        color: String,
        material: String,
        style: String,
        price: Number,
      },
    },
  ];
}
```

### Order Model (`backend/src/models/Order.js`)

**New Fields:**

```javascript
{
  items: [
    {
      product: ObjectId,
      quantity: Number,
      price: Number,
      variantId: ObjectId, // Snapshot at order time
      variantDetails: {
        sku: String,
        size: String,
        color: String,
        material: String,
        style: String,
      },
    },
  ];
}
```

---

## 🔌 API Endpoints

### Product Endpoints (Enhanced)

#### Create Product with Variants

```http
POST /api/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Classic T-Shirt",
  "description": "Premium cotton t-shirt",
  "price": 29.99,
  "category": "Clothing",
  "stock": 100,
  "images": ["https://example.com/tshirt.jpg"],
  "hasVariants": true,
  "variants": [
    {
      "sku": "TSHIRT-S-RED",
      "name": "Small / Red",
      "size": "S",
      "color": "Red",
      "stock": 20,
      "images": ["https://example.com/tshirt-s-red.jpg"]
    },
    {
      "sku": "TSHIRT-M-BLUE",
      "name": "Medium / Blue",
      "size": "M",
      "color": "Blue",
      "price": 34.99,
      "stock": 30
    }
  ]
}
```

#### Add Variant to Existing Product

```http
POST /api/products/{productId}/variants
Authorization: Bearer {token}

{
  "sku": "TSHIRT-L-GREEN",
  "size": "L",
  "color": "Green",
  "stock": 15,
  "price": 32.99
}
```

#### Update Variant

```http
PUT /api/products/{productId}/variants/{variantId}
Authorization: Bearer {token}

{
  "stock": 25,
  "price": 31.99
}
```

#### Delete Variant

```http
DELETE /api/products/{productId}/variants/{variantId}
Authorization: Bearer {token}
```

---

### Cart Endpoints (Enhanced)

#### Add to Cart with Variant

```http
POST /api/cart/add
Authorization: Bearer {token}

{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 2,
  "variantId": "507f1f77bcf86cd799439012"
}
```

#### Update Cart Item

```http
PUT /api/cart/update
Authorization: Bearer {token}

{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 3,
  "variantId": "507f1f77bcf86cd799439012"
}
```

#### Remove from Cart

```http
DELETE /api/cart/remove/{productId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "variantId": "507f1f77bcf86cd799439012"
}
```

---

## 💻 Frontend Integration

### Using the API Client

```javascript
import api from "./utils/api";

// Create product with variants
await api.createProduct({
  name: "Premium Hoodie",
  description: "Comfortable hoodie",
  price: 49.99,
  category: "Clothing",
  stock: 50,
  hasVariants: true,
  variants: [
    {
      sku: "HOODIE-S-BLACK",
      size: "S",
      color: "Black",
      stock: 10,
    },
    {
      sku: "HOODIE-M-GRAY",
      size: "M",
      color: "Gray",
      stock: 15,
      price: 54.99,
    },
  ],
});

// Add variant to existing product
await api.addVariant(productId, {
  sku: "HOODIE-L-NAVY",
  size: "L",
  color: "Navy",
  stock: 20,
});

// Add to cart with variant selection
await api.addToCart(productId, 1, variantId);

// Update cart item
await api.updateCartItem(productId, 2, variantId);

// Remove from cart
await api.removeFromCart(productId, variantId);
```

### React Example

```jsx
function ProductDetails({ product }) {
  const [selectedVariant, setSelectedVariant] = useState(null);

  const handleAddToCart = async () => {
    if (product.hasVariants && !selectedVariant) {
      alert("Please select a variant");
      return;
    }

    try {
      await api.addToCart(product._id, 1, selectedVariant?._id);
      alert("Added to cart!");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>Price: ${product.price}</p>

      {product.hasVariants && (
        <div>
          <h3>Select Options:</h3>
          {product.variants
            .filter((v) => v.isActive)
            .map((variant) => (
              <button
                key={variant._id}
                onClick={() => setSelectedVariant(variant)}
                style={{
                  border:
                    selectedVariant?._id === variant._id
                      ? "2px solid blue"
                      : "1px solid gray",
                }}
              >
                {variant.size} / {variant.color}
                <br />${variant.price || product.price}
                <br />
                Stock: {variant.stock}
              </button>
            ))}
        </div>
      )}

      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
```

### Vue.js Example

```vue
<template>
  <div>
    <h1>{{ product.name }}</h1>
    <p>{{ product.description }}</p>
    <p>Price: ${{ product.price }}</p>

    <div v-if="product.hasVariants">
      <h3>Select Options:</h3>
      <button
        v-for="variant in activeVariants"
        :key="variant._id"
        @click="selectedVariant = variant"
        :class="{ selected: selectedVariant?._id === variant._id }"
      >
        {{ variant.size }} / {{ variant.color }}
        <br />
        ${{ variant.price || product.price }}
        <br />
        Stock: {{ variant.stock }}
      </button>
    </div>

    <button @click="addToCart">Add to Cart</button>
  </div>
</template>

<script>
import api from "./utils/api";

export default {
  props: ["product"],
  data() {
    return {
      selectedVariant: null,
    };
  },
  computed: {
    activeVariants() {
      return this.product.variants?.filter((v) => v.isActive) || [];
    },
  },
  methods: {
    async addToCart() {
      if (this.product.hasVariants && !this.selectedVariant) {
        alert("Please select a variant");
        return;
      }

      try {
        await api.addToCart(this.product._id, 1, this.selectedVariant?._id);
        alert("Added to cart!");
      } catch (error) {
        console.error("Error:", error);
      }
    },
  },
};
</script>

<style>
.selected {
  border: 2px solid blue;
}
</style>
```

---

## 🔄 Business Logic

### Validation Rules

1. **Required Variant Selection**

   - If `product.hasVariants === true`, user MUST select a variant
   - Cart add operation will fail with error if no variant selected

2. **Stock Validation**

   - Variant stock checked independently
   - Cart update fails if requested quantity exceeds variant stock

3. **SKU Uniqueness**

   - Each variant SKU must be unique within a product
   - Duplicate SKU returns 400 error

4. **Price Override**

   - If variant has `price`, it overrides product base price
   - If variant has no `price`, product base price is used

5. **Cart Item Matching**
   - Same product + same variant = same cart item (quantity updates)
   - Same product + different variant = separate cart items

---

## 🧪 Testing

### Manual Testing Steps

1. **Create Product with Variants**

   ```bash
   # Login as vendor/admin first
   POST /api/products
   ```

2. **Get Product Details**

   ```bash
   GET /api/products/{productId}
   # Verify variants array is populated
   ```

3. **Add to Cart with Variant**

   ```bash
   POST /api/cart/add
   # Include variantId in body
   ```

4. **View Cart**

   ```bash
   GET /api/cart
   # Verify variantDetails are populated
   ```

5. **Checkout**

   ```bash
   POST /api/orders/checkout
   # Verify order items include variant details
   ```

6. **View Order**
   ```bash
   GET /api/orders/{orderId}
   # Verify variant snapshot stored in order
   ```

---

## 📝 Example: Complete Product with Variants

```json
{
  "name": "Premium Cotton T-Shirt",
  "description": "High-quality 100% cotton t-shirt",
  "price": 29.99,
  "category": "Clothing",
  "stock": 100,
  "images": ["https://example.com/tshirt-main.jpg"],
  "tags": ["cotton", "casual", "summer"],
  "hasVariants": true,
  "variants": [
    {
      "sku": "TSHIRT-S-BLACK",
      "name": "Small / Black",
      "size": "S",
      "color": "Black",
      "material": "Cotton",
      "stock": 15,
      "images": ["https://example.com/tshirt-s-black.jpg"],
      "isActive": true
    },
    {
      "sku": "TSHIRT-M-BLACK",
      "name": "Medium / Black",
      "size": "M",
      "color": "Black",
      "material": "Cotton",
      "stock": 25,
      "images": ["https://example.com/tshirt-m-black.jpg"],
      "isActive": true
    },
    {
      "sku": "TSHIRT-L-WHITE",
      "name": "Large / White",
      "size": "L",
      "color": "White",
      "material": "Cotton",
      "price": 32.99,
      "stock": 20,
      "images": ["https://example.com/tshirt-l-white.jpg"],
      "isActive": true
    },
    {
      "sku": "TSHIRT-XL-NAVY",
      "name": "Extra Large / Navy",
      "size": "XL",
      "color": "Navy",
      "material": "Cotton",
      "price": 34.99,
      "stock": 10,
      "images": ["https://example.com/tshirt-xl-navy.jpg"],
      "isActive": true
    }
  ]
}
```

---

## ✅ Files Modified

- `backend/src/models/Product.js` - Added variant schema
- `backend/src/models/Cart.js` - Added variant tracking
- `backend/src/models/Order.js` - Added variant snapshot
- `backend/src/routes/products.js` - Variant CRUD endpoints
- `backend/src/routes/cart.js` - Variant-aware cart operations
- `backend/src/routes/orders.js` - Variant handling in checkout
- `frontend-utils/api.js` - Added variant API methods

---

## 🎯 Next Steps

Ready to implement the next feature: **Discount/Coupon System**

This will include:

- Coupon codes (percentage/fixed discount)
- Expiration dates
- Usage limits
- Apply coupons to cart
- Validate and calculate discounts

Would you like me to proceed with the Discount/Coupon system?
