// Supabase Edge Function for sending email notifications
// Deploy this to Supabase Edge Functions for serverless backend logic

import { serve } from "https://deno.land/std@0.168.0/http/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the JWT from the Authorization header
    const authorization = req.headers.get('Authorization')
    if (!authorization) {
      throw new Error('No authorization header')
    }

    // Verify the JWT and get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authorization.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Parse request body
    const { type, data } = await req.json()

    switch (type) {
      case 'welcome_email':
        return await sendWelcomeEmail(user, data, supabaseClient)
      
      case 'scheme_recommendation':
        return await sendSchemeRecommendation(user, data, supabaseClient)
      
      case 'application_status':
        return await sendApplicationStatusUpdate(user, data, supabaseClient)
      
      default:
        throw new Error('Invalid email type')
    }

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function sendWelcomeEmail(user: any, data: any, supabase: any) {
  // In a real implementation, you'd use a service like SendGrid, Resend, or Mailgun
  // This is a mock implementation
  
  const emailContent = {
    to: user.email,
    subject: 'Welcome to Scheme Saathi! 🇮🇳',
    html: `
      <h1>Welcome to Scheme Saathi!</h1>
      <p>Dear ${data.full_name || 'User'},</p>
      
      <p>Thank you for joining Scheme Saathi, your AI-powered companion for discovering government schemes in India.</p>
      
      <h2>What's Next?</h2>
      <ul>
        <li>Complete your profile to get personalized recommendations</li>
        <li>Explore our AI chatbot for instant scheme queries</li>
        <li>Use our voice assistant for hands-free help</li>
        <li>Bookmark schemes that interest you</li>
      </ul>
      
      <p>We're here to help you navigate the world of government schemes and find opportunities that match your needs.</p>
      
      <p>Best regards,<br>The Scheme Saathi Team</p>
      
      <hr>
      <p><small>This email was sent because you created an account on Scheme Saathi. If you didn't create this account, please contact our support team.</small></p>
    `
  }

  // Log the email activity
  await supabase
    .from('user_interactions')
    .insert([{
      user_id: user.id,
      interaction_type: 'email_sent',
      interaction_data: { 
        email_type: 'welcome',
        recipient: user.email 
      }
    }])

  console.log('Welcome email would be sent:', emailContent)

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Welcome email sent successfully',
      email_data: emailContent 
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function sendSchemeRecommendation(user: any, data: any, supabase: any) {
  const { schemes } = data

  const emailContent = {
    to: user.email,
    subject: 'New Scheme Recommendations for You! 📋',
    html: `
      <h1>Personalized Scheme Recommendations</h1>
      <p>Hello!</p>
      
      <p>Based on your profile, we've found some government schemes that might be perfect for you:</p>
      
      ${schemes.map((scheme: any) => `
        <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px;">
          <h3>${scheme.name}</h3>
          <p><strong>Category:</strong> ${scheme.category}</p>
          <p><strong>Eligibility Score:</strong> ${scheme.eligibility_score}%</p>
          <p>${scheme.description}</p>
          <p><strong>Why this matches you:</strong> ${scheme.recommended_reason}</p>
          <a href="${scheme.apply_url}" style="background-color: #007bff; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">Learn More</a>
        </div>
      `).join('')}
      
      <p>Log in to your Scheme Saathi account to bookmark these schemes and track your applications.</p>
      
      <p>Happy exploring!<br>The Scheme Saathi Team</p>
    `
  }

  await supabase
    .from('user_interactions')
    .insert([{
      user_id: user.id,
      interaction_type: 'email_sent',
      interaction_data: { 
        email_type: 'scheme_recommendation',
        schemes_count: schemes.length 
      }
    }])

  console.log('Scheme recommendation email would be sent:', emailContent)

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Scheme recommendation email sent successfully' 
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function sendApplicationStatusUpdate(user: any, data: any, supabase: any) {
  const { scheme_name, status, application_id } = data

  const statusMessages = {
    submitted: 'Your application has been successfully submitted!',
    under_review: 'Your application is currently under review.',
    approved: 'Congratulations! Your application has been approved! 🎉',
    rejected: 'Unfortunately, your application was not approved this time.'
  }

  const emailContent = {
    to: user.email,
    subject: `Application Status Update: ${scheme_name}`,
    html: `
      <h1>Application Status Update</h1>
      <p>Hello!</p>
      
      <p>We have an update on your application for <strong>${scheme_name}</strong>:</p>
      
      <div style="background-color: ${status === 'approved' ? '#d4edda' : status === 'rejected' ? '#f8d7da' : '#d1ecf1'}; 
                  padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3>Status: ${status.toUpperCase().replace('_', ' ')}</h3>
        <p>${statusMessages[status as keyof typeof statusMessages]}</p>
      </div>
      
      <p><strong>Application ID:</strong> ${application_id}</p>
      
      ${status === 'approved' ? 
        '<p>Please check your application portal for next steps and required documentation.</p>' :
        status === 'rejected' ?
        '<p>Don\'t worry! There are many other schemes that might be a great fit for you. Log in to explore more opportunities.</p>' :
        '<p>We\'ll notify you as soon as there\'s another update on your application.</p>'
      }
      
      <p>Best regards,<br>The Scheme Saathi Team</p>
    `
  }

  await supabase
    .from('user_interactions')
    .insert([{
      user_id: user.id,
      interaction_type: 'email_sent',
      interaction_data: { 
        email_type: 'application_status',
        scheme_name,
        status 
      }
    }])

  console.log('Application status email would be sent:', emailContent)

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Application status email sent successfully' 
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

/* 
To deploy this Edge Function:

1. Install Supabase CLI:
   npm install -g supabase

2. Login to Supabase:
   supabase login

3. Initialize your project:
   supabase init

4. Create the function:
   supabase functions new send-email

5. Replace the generated code with this file content

6. Deploy the function:
   supabase functions deploy send-email

7. Set environment variables in Supabase dashboard:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY

8. Call the function from your app:
   const { data, error } = await supabase.functions.invoke('send-email', {
     body: { 
       type: 'welcome_email', 
       data: { full_name: 'User Name' } 
     }
   })
*/
