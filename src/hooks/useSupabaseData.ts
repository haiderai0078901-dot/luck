
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useSupabaseData() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const { data: reportsRaw, error: reportsErr } = await supabase.from('v_reports_enriched').select('report_id, patient_ref, scan_type, reported_at, status, closed_at, radiologist_name');
      const { data: staffRaw, error: staffErr } = await supabase.from('staff').select('*');

      if (reportsErr) throw reportsErr;
      if (staffErr) throw staffErr;

      const { data: f, error: ef } = await supabase.from("followups").select("*").limit(50);

      if (ef) throw ef;

      // Normalize reports with exact fields from v_reports_enriched
      const reports = (reportsRaw || []).map((r: any) => {
        return {
          report_id: r.report_id,
          patient_id: r.patient_ref,
          patient_ref: r.patient_ref,
          scan_type: r.scan_type,
          radiologist: r.radiologist_name || 'Unassigned',
          radiologist_name: r.radiologist_name,
          date: r.reported_at,
          reported_at: r.reported_at,
          status: r.status,
          closed_at: r.closed_at,
        };
      });

      console.log("✅ Reports data loaded from v_reports_enriched:", reports.slice(0, 3));

      setReports(reports || []);
      setFollowUps(f || []);
      setStaff(staffRaw || []);

      console.log("✅ Supabase data loaded successfully for RadAssist AI");
    } catch (err) {
      console.warn("⚠️ Supabase data fetch failed", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    await fetchData();
  };

  return { loading, error, reports, followUps, staff, refreshData };
}
