
import { supabase } from '../../lib/supabaseClient';
import { sendTicketEmail } from '../../lib/sendTicketEmail';

export interface TicketForm {
  name: string;
  email: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
}

export async function submitTicket(form: TicketForm) {
  try {
    const ticketId = `TKT-${Date.now()}`;
    
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        ticket_id: ticketId,
        name: form.name,
        email: form.email,
        description: form.description,
        priority: form.priority,
        status: 'Open'
      })
      .select()
      .single();

    if (error) {
      console.error('⚠️ Ticket submission error:', error);
      throw error;
    }

    console.log('📩 Ticket submitted to Supabase');
    console.log('✅ Ticket ID:', ticketId);
    
    // Send confirmation email
    const emailSent = await sendTicketEmail(form.email, form.name || "User", ticketId);
    
    // Send webhook to Make.com
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL as string, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: ticketId,
          name: form.name,
          email: form.email,
          subject: `Help Ticket - ${form.priority} Priority`,
          message: form.description,
          created_at: new Date().toISOString(),
          source: "RadAssist AI Help",
        }),
      });

      if (res.ok) {
        console.log("✅ Ticket webhook delivered to Make.com");
      } else {
        console.warn("⚠️ Webhook responded with status", res.status);
      }
    } catch (err) {
      console.error("❌ Webhook delivery failed", err);
    }
    
    return { 
      success: true, 
      ticketId, 
      data,
      emailSent
    };
  } catch (error) {
    console.error('❌ Submit ticket failed:', error);
    return { success: false, error };
  }
}
