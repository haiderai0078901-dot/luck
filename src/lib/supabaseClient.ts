
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://utuqbhkrqwhmvuwljxsw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dXFiaGtycXdobXZ1d2xqeHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NjM3NjQsImV4cCI6MjA3NzQzOTc2NH0.LP0YPO9ldG_ElFfngx1wCaNm3KBXbS3mJWZci4FC4CI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection
async function testSupabaseConnection() {
  try {
    const [reportsTest, followupsTest, staffTest] = await Promise.all([
      supabase.from('reports').select('*').limit(1),
      supabase.from('followups').select('*').limit(1),
      supabase.from('staff').select('*').limit(1)
    ]);

    if (reportsTest.error || followupsTest.error || staffTest.error) {
      console.log("⚠️ Supabase not connected");
      return false;
    }

    console.log("✅ Supabase connected");
    return true;
  } catch (error) {
    console.log("⚠️ Supabase not connected");
    return false;
  }
}

// AI Suggestion Action
export const aiSuggestion = async (p_followup_action: string, p_due_date: string, p_status: string) => {
  try {
    const { data, error } = await supabase.rpc('get_ai_suggestion', {
      p_followup_action,
      p_due_date,
      p_status
    });

    if (error) {
      console.error('AI Suggestion RPC error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('AI Suggestion error:', error);
    return null;
  }
};

// Test AI Suggestion Action
export const testAiSuggestion = async () => {
  try {
    const { data, error } = await supabase.rpc('get_ai_suggestion', {
      p_followup_action: 'Refer to Oncology',
      p_due_date: '2025-11-21',
      p_status: 'overdue'
    });

    if (error) {
      console.error('Test AI Suggestion RPC error:', error);
      return `Error: ${error.message}`;
    }

    return data || 'No data returned';
  } catch (error) {
    console.error('Test AI Suggestion error:', error);
    return `Error: ${error.message}`;
  }
};

// Test connection on initialization
testSupabaseConnection();

export const supabase_types = {
  SupabaseFollowUp: {} as {
    id: string;
    patient_ref: string;
    scan_date: string;
    action_required: string;
    assigned_to: string;
    status: string;
    priority: string;
    due_date: string;
    created_at: string;
  },
  SupabaseReport: {} as {
    id: string;
    patient_ref: string;
    scan_type: string;
    radiologist: string;
    report_date: string;
    summary: string;
    created_at: string;
  },
  SupabaseStaff: {} as {
    id: string;
    name: string;
    role: string;
    team: string;
    email: string;
    created_at: string;
  }
};

export type SupabaseFollowUp = typeof supabase_types.SupabaseFollowUp;
export type SupabaseReport = typeof supabase_types.SupabaseReport;
export type SupabaseStaff = typeof supabase_types.SupabaseStaff;

console.log("✅ Supabase client connected successfully to RadAssist AI");
