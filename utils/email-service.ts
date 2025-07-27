// Example: Using the deployed Edge Function in your Next.js app
// Add this to your existing hooks or create a new email service

import { supabase } from '../lib/supabase';

export class EmailService {
  // Send welcome email to new users
  static async sendWelcomeEmail(userData: { full_name: string }) {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { 
          type: 'welcome_email', 
          data: userData 
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  // Send scheme recommendations
  static async sendSchemeRecommendations(schemes: any[]) {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { 
          type: 'scheme_recommendation', 
          data: { schemes } 
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to send scheme recommendations:', error);
      throw error;
    }
  }

  // Send application status updates
  static async sendApplicationStatusUpdate(applicationData: {
    scheme_name: string;
    status: string;
    application_id: string;
  }) {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { 
          type: 'application_status', 
          data: applicationData 
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to send status update:', error);
      throw error;
    }
  }
}

// Usage in your React components:
// await EmailService.sendWelcomeEmail({ full_name: 'John Doe' });
