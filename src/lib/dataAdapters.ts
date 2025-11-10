
export function deriveDashboardStats({ followUps = [], reports = [] }) {
  const totalScans = reports.length;
  const pending = followUps.filter(f => f.status === "pending").length;
  const completed = followUps.filter(f => f.status === "completed").length;
  const overdue = followUps.filter(f => f.status === "overdue").length;

  return { totalScans, pending, completed, overdue };
}

export function buildWorklistRows({ followUps = [], reports = [], staff = [] }) {
  // Build quick lookups
  const staffById = new Map(staff.map(s => [s.staff_id || s.id, s]));
  const reportById = new Map(reports.map(r => [r.report_id || r.id, r]));

  return followUps.map(f => {
    const r = f.report_id ? reportById.get(f.report_id) : null;
    const assignee = f.assigned_to ? staffById.get(f.assigned_to) : null;

    // Follow-up action - prioritize action_required from Supabase
    const followUpAction =
      f.action_required ||
      f.follow_up_action ||
      r?.follow_up_instruction ||
      "No action assigned";

    // Priority from due_date
    let priority = "Low";
    if (f.due_date) {
      const due = new Date(f.due_date);
      const now = new Date();
      const days = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (days < 0) priority = "High";
      else if (days <= 3) priority = "Medium";
    }

    // Assigned staff display - prioritize assigned_to from Supabase
    const assigned =
      f.assigned_to ||
      assignee?.full_name ||
      assignee?.name ||
      "Unassigned";

    return {
      id: f.followup_id || f.id,
      patient: f.patient_ref || f.patient_id || "—",
      status: f.status || "pending",
      followUpAction,
      priority,
      assigned,
      dueDate: f.due_date || null
    };
  });
}
