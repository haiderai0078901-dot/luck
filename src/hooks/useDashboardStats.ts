
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

type DashboardStats = {
  totalScans: number;
  pending: number;
  completed: number;
  overdue: number;
  assignmentsThisWeek: number;
};

type StaffAssignment = {
  staff: string;
  staff_id: string;
  total_assignments: number;
};

type SLAData = {
  pct_met: number;
} | null;

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({ 
    totalScans: 0, 
    pending: 0, 
    completed: 0, 
    overdue: 0,
    assignmentsThisWeek: 0
  });
  const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>([]);
  const [staffAssignmentsError, setStaffAssignmentsError] = useState<string | null>(null);
  const [slaData, setSlaData] = useState<SLAData>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all KPI metrics from v_dashboard_counts (single-row view), SLA data, and assignments this week
      const [dashboardResult, slaResult, assignmentsResult] = await Promise.all([
        supabase.from("v_dashboard_counts").select("*").single(),
        supabase.from("v_followups_sla").select("pct_met").single(),
        supabase.from("v_assignments_total_this_week").select("assignments").single()
      ]);

      if (dashboardResult.error) {
        throw new Error("Supabase query failed");
      }

      // Get staff assignments this week from v_assignments_by_staff_week - show ALL rows, sorted descending
      const { data: staffAssignmentsData, error: staffError } = await supabase
        .from('v_assignments_by_staff_week')
        .select('staff, staff_id, total_assignments')
        .order('total_assignments', { ascending: false });

      // Extract all KPI values from v_dashboard_counts (show 0 if null)
      const dashboardData = dashboardResult.data;
      const totalScans = dashboardData?.total_scans || 0;
      const pending = dashboardData?.pending || 0;
      const completed = dashboardData?.completed || 0;
      const overdue = dashboardData?.overdue || 0;
      
      // Get assignments this week from v_assignments_total_this_week (show 0 if null)
      const assignmentsThisWeek = assignmentsResult.data?.assignments || 0;

      // Handle SLA data from v_followups_sla
      let processedSlaData: SLAData = null;
      if (slaResult.error) {
        console.warn("❌ Failed to fetch SLA data from v_followups_sla:", slaResult.error);
      } else if (slaResult.data && slaResult.data.pct_met !== null) {
        processedSlaData = { pct_met: slaResult.data.pct_met };
      }

      // Process staff assignments data from v_assignments_by_staff_week - show ALL rows
      let processedStaffAssignments: StaffAssignment[] = [];
      let staffAssignmentsError: string | null = null;
      
      if (staffError) {
        console.warn("❌ Failed to fetch staff assignments this week:", staffError);
        staffAssignmentsError = "⚠️ Couldn't load assignments.";
      } else if (staffAssignmentsData) {
        // Show ALL rows from the view, already sorted descending by total_assignments
        processedStaffAssignments = staffAssignmentsData.map(item => ({
          staff: item.staff,
          staff_id: item.staff_id,
          total_assignments: item.total_assignments
        }));
      }

      setStats({ totalScans, pending, completed, overdue, assignmentsThisWeek });
      setStaffAssignments(processedStaffAssignments);
      setStaffAssignmentsError(staffAssignmentsError);
      setSlaData(processedSlaData);
      console.log("✅ Dashboard stats loaded from Supabase");
      
    } catch {
      // Fallback to GitHub demo JSON
      try {
        const base = "https://raw.githubusercontent.com/feditheanalyst/AI-2025-001-Clean-Synthetic-Dataset-for-Backlog-Demo/main";
        
        const [reportsRes, followupsRes] = await Promise.all([
          fetch(`${base}/reports.json`).then(r => r.json()).catch(() => []),
          fetch(`${base}/followups.json`).then(r => r.json()).catch(() => []),
        ]);

        const totalScans = Array.isArray(reportsRes) ? reportsRes.length : 0;
        const pending = Array.isArray(followupsRes) ? followupsRes.filter((f: any) => f.status === "pending").length : 0;
        const completed = Array.isArray(followupsRes) ? followupsRes.filter((f: any) => f.status === "completed").length : 0;
        const overdue = Array.isArray(followupsRes) ? followupsRes.filter((f: any) => f.status === "overdue").length : 0;
        
        // Fallback: show 0 for assignments this week and empty staff assignments
        console.warn("⚠️ Supabase fallback: assignments this week set to 0");
        const assignmentsThisWeek = 0;
        const staffAssignmentsData: StaffAssignment[] = [];

        setStats({ totalScans, pending, completed, overdue, assignmentsThisWeek });
        setStaffAssignments(staffAssignmentsData);
        setStaffAssignmentsError(null);
        setSlaData(null); // No SLA data in fallback
        console.log("⚠️ Supabase fallback: dashboard stats loaded from GitHub dataset");
        
      } catch (fallbackError) {
        setError("Failed to load dashboard statistics");
        console.error("❌ Failed to load dashboard stats from both sources");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, staffAssignments, staffAssignmentsError, slaData, loading, error, reload: load };
}
