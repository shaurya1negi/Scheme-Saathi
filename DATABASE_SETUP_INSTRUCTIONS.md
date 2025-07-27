# 🗄️ Database Setup Instructions

## After updating your .env.local file, follow these steps:

### 1. **Open Supabase SQL Editor**
   - In your Supabase dashboard, click on **SQL Editor** in the left sidebar
   - Click **"New Query"**

### 2. **Run the Database Schema**
   - Open the file `supabase/schema.sql` in your project
   - Copy the entire contents of that file
   - Paste it into the SQL Editor in Supabase
   - Click **"Run"** button

### 3. **Verify Tables Were Created**
   - Go to **Table Editor** in your Supabase dashboard
   - You should see these tables:
     - ✅ `users`
     - ✅ `user_interactions`
     - ✅ `user_schemes`
     - ✅ `scheme_applications`

### 4. **Enable Authentication (Optional)**
   - Go to **Authentication** → **Settings**
   - Ensure **"Enable email confirmations"** is configured as needed
   - For Google OAuth (optional):
     - Go to **Authentication** → **Providers**
     - Enable Google and configure with your Google OAuth credentials

### 5. **Test Your Setup**
   - Restart your development server: `npm run dev`
   - The yellow setup banner should disappear
   - Try signing up for a new account
   - Check the **Authentication** tab in Supabase to see if users are created

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console for error messages
2. Check the Supabase logs in your dashboard
3. Verify your environment variables are correct
4. Make sure there are no trailing spaces in your .env.local file

## ✅ Success Indicators

When everything is working correctly:
- No yellow setup banner on your website
- Sign up creates a new user in Supabase Authentication
- User profile data is saved to the `users` table
- No error messages in browser console
