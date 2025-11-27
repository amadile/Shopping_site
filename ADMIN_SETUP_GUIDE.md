# How to Create and Use Admin Account

## Quick Start

### 1. Create Admin Account

Run this command in the `backend` directory:

```bash
node create-admin.js
```

This will create an admin account with:
- **Email**: `admin@shopping.com`
- **Password**: `Admin@123`
- **Role**: `admin`

### 2. Login as Admin

1. Go to http://localhost:3000/login
2. Enter the admin credentials
3. You'll be logged in as an admin user

### 3. Access Admin Panel

After logging in, you can access the admin panel at:
- http://localhost:3000/admin/dashboard
- Or click on "Admin" in the navigation menu (if available)

## Admin Features Available

Once logged in as admin, you can:

✅ **Dashboard** - View overall statistics
✅ **Users** - Manage all users (customers, vendors, admins)
✅ **Vendors** - Approve/reject vendor applications, set commission rates
✅ **Products** - View and manage all products
✅ **Orders** - View and manage all orders
✅ **Analytics** - View detailed analytics and reports

## Changing Admin Password

### Option 1: Through MongoDB Compass
1. Open MongoDB Compass
2. Connect to your database
3. Find the `users` collection
4. Find the admin user (email: admin@shopping.com)
5. Update the `password` field with a new bcrypt hash

### Option 2: Delete and Recreate
1. Delete the existing admin user from MongoDB
2. Edit `create-admin.js` with new password
3. Run `node create-admin.js` again

## Creating Additional Admins

To create more admin accounts:

1. Register a regular user account
2. Use MongoDB Compass or MongoDB shell to update their role:
   ```javascript
   db.users.updateOne(
     { email: "user@example.com" },
     { $set: { role: "admin", isVerified: true } }
   )
   ```

## Security Notes

⚠️ **IMPORTANT**: 
- Change the default password immediately after first login
- Never commit admin credentials to version control
- Use strong, unique passwords for production
- Consider implementing 2FA for admin accounts in production

## Troubleshooting

### "Admin account already exists"
- The script detected an existing admin account
- Either use the existing credentials or delete the user from MongoDB and run the script again

### "Cannot connect to MongoDB"
- Make sure MongoDB is running
- Check your `.env` file has the correct `MONGO_URI`
- Verify the backend server can connect to MongoDB

### "Cannot login with admin credentials"
- Verify the email and password are correct
- Check that the user's `role` field is set to "admin" in the database
- Ensure `isVerified` is set to `true`
