# JWT Token Issues - Troubleshooting Guide

## Issues Fixed ✅

### 1. Socket Authentication Token Mismatch

**Problem**: Socket.io was looking for `decoded.userId` but JWT tokens contain `decoded.id`
**Status**: ✅ FIXED in `src/config/socket.js`

### 2. Invalid JWT Signature Errors

**Problem**: Old tokens were created with a different JWT_SECRET
**Root Cause**: When the JWT_SECRET changes, all existing tokens become invalid

## Solutions

### For Users Experiencing "Invalid Token" Errors:

1. **Clear Browser Storage**

   - Open browser DevTools (F12)
   - Go to Application/Storage tab
   - Clear localStorage and sessionStorage
   - Clear cookies

2. **Log Out and Log Back In**
   - This generates new tokens with the current JWT_SECRET
   - All new requests will work correctly

### For Developers:

1. **Never Change JWT_SECRET in Production**
   - Current secret in `.env`: `8464b8cfb18801b43fb3b128e613c5cd55acb76341392a5508f7d2b2200080cd`
   - Keep this consistent across deployments
2. **For Development Testing**

   - If you need to invalidate all tokens, change the secret
   - But remember: all users will need to re-login

3. **Token Payload Structure**

   ```javascript
   // Access Token
   {
     id: user._id,      // ✅ Use 'id', not 'userId'
     role: user.role,
     iat: timestamp,
     exp: timestamp
   }

   // Refresh Token
   {
     id: user._id,      // ✅ Use 'id', not 'userId'
     iat: timestamp,
     exp: timestamp
   }
   ```

## Current Status

✅ Backend code is now consistent (using `decoded.id`)
✅ Socket authentication supports both formats for backwards compatibility
⚠️ Users with old tokens need to re-authenticate

## Testing

After restarting the backend, test with:

```bash
# 1. Login to get a new token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpassword"}'

# 2. Use the token for authenticated requests
curl -X GET http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 3. Test socket connection (from frontend)
# Socket will now authenticate properly
```

## Prevention

- ✅ Keep JWT_SECRET in `.env` and never commit to Git
- ✅ Use the same secret across all backend instances
- ✅ Consider implementing token versioning for major changes
- ✅ Use refresh tokens to handle token expiration gracefully
