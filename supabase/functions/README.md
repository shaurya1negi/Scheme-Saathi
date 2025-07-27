# Supabase Edge Functions

This directory contains serverless functions that run on Supabase Edge Runtime (Deno-based).

## Note about TypeScript Errors

The TypeScript errors you see in the IDE are expected because:
1. This code runs on Deno, not Node.js
2. It uses Deno-specific imports and APIs
3. Your IDE is configured for Node.js/Next.js

These functions will work correctly when deployed to Supabase Edge Functions.

## Functions Included

### send-email
A serverless function for sending various types of email notifications:
- Welcome emails for new users
- Scheme recommendations
- Application status updates

## Deployment Instructions

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link to your project:
   ```bash
   supabase link --project-ref your-project-id
   ```

4. Deploy the function:
   ```bash
   supabase functions deploy send-email
   ```

5. Set environment variables in your Supabase dashboard under Edge Functions.

## Usage

Call the function from your Next.js app:

```typescript
const { data, error } = await supabase.functions.invoke('send-email', {
  body: { 
    type: 'welcome_email', 
    data: { full_name: 'User Name' } 
  }
})
```
