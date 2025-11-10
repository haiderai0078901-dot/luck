import { supabase } from './supabaseClient';

/**
 * Sends a ticket confirmation email via Supabase Edge Function
 * @param email - Recipient email address
 * @param name - Recipient name
 * @param ticketId - Ticket ID for reference
 * @returns Promise<boolean> - true if email sent successfully, false otherwise
 */
export async function sendTicketEmail(
  email: string, 
  name: string, 
  ticketId: string
): Promise<boolean> {
  try {
    if (!email || !name || !ticketId) {
      console.error('❌ sendTicketEmail: Missing required parameters');
      return false;
    }

    const { data, error } = await supabase.functions.invoke('send-ticket-email', {
      body: {
        email,
        name,
        ticket_id: ticketId,
      },
    });

    if (error) {
      console.error('❌ Edge Function error:', error);
      return false;
    }

    if (!data?.ok) {
      console.error('❌ Email sending failed:', data?.error || 'Unknown error');
      return false;
    }

    console.log(`📧 Confirmation email sent to ${email} for ticket ${ticketId}`);
    return true;

  } catch (error) {
    console.error('❌ sendTicketEmail error:', error);
    return false;
  }
}