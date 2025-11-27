# 🔧 Fix Image Upload - Restart Backend Server

## The Issue
The registration endpoint has been fixed to return JWT tokens, but the backend server needs to be restarted to apply the changes.

## ✅ Step-by-Step Fix

### 1. Stop Current Backend Server
```bash
# Find the backend process
Get-Process -Name node | Where-Object {$_.StartTime -lt (Get-Date).AddHours(-1)}

# Or simply press Ctrl+C in the terminal running the backend
```

### 2. Restart Backend
```bash
cd backend
npm run dev
```

You should see:
```
Server running on port 5000
MongoDB connected
Socket.io enabled for real-time notifications
```

### 3. Test Image Upload

**Option A: Use the HTML Test Tool**
```bash
# Open in browser:
file:///c:/Users/amadi/Shopping_site/backend/test-upload.html

# Or serve it:
cd backend
npx http-server . -p 8080
# Then open: http://localhost:8080/test-upload.html
```

**Option B: Use the Frontend**
```bash
# Make sure frontend is running:
cd frontend
npm run dev

# Then:
1. Go to http://localhost:5173/vendor/register
2. Register as vendor (you'll get logged in automatically!)
3. Go to "Add Product"
4. Upload images
5. Create product
```

### 4. Verify It Works

You should be able to:
- ✅ Register as vendor and get a token
- ✅ Upload images immediately after registration
- ✅ See image previews
- ✅ Create products with images
- ✅ See uploaded images in the uploads folder

## 🐛 If It Still Doesn't Work

Run the diagnostic:
```bash
cd backend
node diagnose-upload.js
```

This will show you exactly where the issue is.

## 📝 What Was Fixed

1. **Registration endpoint** (`/api/auth/register`) now returns:
   - JWT token
   - Refresh token
   - User data
   
2. **Vendor fields** supported:
   - businessName
   - businessAddress

3. **Image upload** working with authentication

## ✅ Expected Result

After restarting backend, the diagnostic test should show:
```
✅ Backend is running
✅ Vendor registered, token received
✅ Upload successful!
   Image URL: /uploads/xxxxx.jpg
   CDN: local
   Message: Image uploaded successfully
```

---

**Ready to test?** Restart the backend and try uploading! 🚀
