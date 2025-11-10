
import { supabase } from '@/lib/supabaseClient';

export interface UpdateAssignmentParams {
  followupId: string;
  staffId: string;
  currentStatus?: string;
}

export interface UpdateAssignmentResult {
  ok: boolean;
  error?: string;
}

export async function updateAssignment({
  followupId,
  staffId,
  currentStatus
}: UpdateAssignmentParams): Promise<UpdateAssignmentResult> {
  try {
    // Prepare update data
    const updateData: any = {
      assigned_to: staffId,
      updated_at: new Date().toISOString()
    };

    // If status is NULL or empty, set to 'pending'
    if (!currentStatus || currentStatus.trim() === '') {
      updateData.status = 'pending';
    }

    // Update the followups table
    const { error: updateError } = await supabase
      .from('followups')
      .update(updateData)
      .eq('followup_id', followupId);

    if (updateError) {
      console.error('❌ Assign error', { followupId, staffId, error: updateError });
      return { ok: false, error: updateError.message };
    }

    // Try to insert audit record (if table exists)
    try {
      const { error: auditError } = await supabase
        .from('assignments_audit')
        .insert({
          followup_id: followupId,
          assigned_to: staffId,
          assigned_by: 'system-demo',
          assigned_at: new Date().toISOString()
        });

      // Don't fail the main operation if audit fails
      if (auditError) {
        console.warn('Audit record insertion failed:', auditError);
      }
    } catch (auditErr) {
      console.warn('Audit table may not exist:', auditErr);
    }

    return { ok: true };
  } catch (err) {
    console.error('❌ Assign error', { followupId, staffId, error: err });
    return { ok: false, error: err instanceof Error ? err.message : 'Network error occurred' };
  }
}
