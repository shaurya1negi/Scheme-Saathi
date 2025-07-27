# Supabase Integration Setup Guide

This guide will help you set up Supabase authentication and database integration for your Scheme Saathi application.

## Prerequisites

1. A Supabase account (create one at [supabase.com](https://supabase.com))
2. Node.js and npm installed
3. Your Next.js application running

## Step 1: Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: scheme-saathi
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **Service Role Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`) - **Keep this secret!**

## Step 3: Configure Environment Variables

1. Open your `.env.local` file in the project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

NODE_ENV=development
```

⚠️ **Security Note**: Never commit your `.env.local` file to version control!

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `supabase/schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the SQL
5. Verify that the tables were created by going to **Table Editor**

You should see these tables:
- `users`
- `user_interactions`
- `user_schemes`
- `scheme_applications`

## Step 5: Configure Authentication Providers

### Email Authentication (Already Enabled)
Email/password authentication is enabled by default.

### Google OAuth (Optional but Recommended)

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Find "Google" and click "Configure"
3. Toggle "Enable sign in with Google"
4. You'll need to set up Google OAuth:

#### Setting up Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Configure the OAuth consent screen
6. For the OAuth client:
   - **Application type**: Web application
   - **Authorized redirect URIs**: Add your Supabase callback URL:
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     ```
7. Copy the **Client ID** and **Client Secret**
8. Paste them into your Supabase Google provider configuration
9. Save the configuration

## Step 6: Configure Row Level Security (RLS)

The schema includes RLS policies, but verify they're working:

1. Go to **Authentication** → **Policies**
2. You should see policies for each table
3. Test by creating a user account and verifying they can only access their own data

## Step 7: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your application at `http://localhost:3000`

3. Test the following features:
   - **Sign Up**: Create a new account
   - **Sign In**: Log in with existing credentials
   - **Google Sign In**: Test OAuth flow (if configured)
   - **Profile Management**: Update user profile information
   - **Data Persistence**: Verify user data is saved and retrieved

## Step 8: Enable Real-time Features (Optional)

If you want real-time updates for user interactions:

1. Go to **Database** → **Replication**
2. Add the following tables to replication:
   - `user_interactions`
   - `user_schemes`
   - `scheme_applications`

## Production Deployment

### Environment Variables
Make sure to set these environment variables in your production environment:

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NODE_ENV=production
```

### Authentication Settings
1. Update your Google OAuth redirect URIs to include your production domain
2. Configure your site URL in Supabase: **Authentication** → **URL Configuration**
   - **Site URL**: `https://your-domain.com`
   - **Redirect URLs**: Add your production callback URL

### Security Checklist
- [ ] All environment variables are set correctly
- [ ] RLS policies are enabled and tested
- [ ] Service role key is kept secret
- [ ] OAuth providers are configured for production domain
- [ ] Database backups are enabled
- [ ] Monitoring is set up

## Troubleshooting

### Common Issues

1. **"Invalid JWT" errors**
   - Check that your environment variables are correct
   - Ensure you're using the right project credentials

2. **Authentication not working**
   - Verify your redirect URLs are configured correctly
   - Check browser console for errors
   - Ensure your site URL matches your domain

3. **Database queries failing**
   - Check RLS policies are correctly set up
   - Verify user has proper permissions
   - Look at the Supabase logs for detailed error messages

4. **Real-time not working**
   - Ensure tables are added to replication
   - Check browser console for WebSocket connection errors

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com/)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## Next Steps

Now that Supabase is integrated, you can:

1. **Add more authentication providers** (GitHub, Discord, etc.)
2. **Implement advanced features** like password reset, email verification
3. **Add real-time features** for live updates
4. **Create admin panels** for managing users and data
5. **Set up analytics** to track user engagement
6. **Implement caching** for better performance

## API Endpoints

Your application now includes these API endpoints:

- `GET /api/schemes/recommendations` - Get personalized scheme recommendations
- Add more endpoints as needed for your specific features

## Database Schema Overview

- **users**: Extended user profiles with personal information
- **user_interactions**: Track user actions for analytics
- **user_schemes**: User bookmarks and scheme interactions
- **scheme_applications**: Track application status and data

Remember to regularly backup your database and monitor your usage to stay within Supabase's limits for your plan tier.
