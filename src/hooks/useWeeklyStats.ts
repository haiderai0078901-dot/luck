// Minimal, safe: counts + daily buckets from Supabase
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Totals = {
  totalReports: number;
  totalFollowups: number;
  completed: number;
  pending: number;
  overdue: number;
  reportsByDay: { date: string; count: number }[];
  followupsByDay: { date: string; count: number }[];
};

export function useWeeklyStats(startISO: string, endISO: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Totals | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true); 
        setError(null);

        if (!supabase) {
          throw new Error("Supabase not connected");
        }

        // Reports in window
        const { data: rpt, error: rptErr } = await supabase
          .from("reports")
          .select("reported_at")
          .gte("reported_at", startISO)
          .lt("reported_at", endISO);
        if (rptErr) throw rptErr;

        // Follow-ups (created in window)
        const { data: fu, error: fuErr } = await supabase
          .from("followups")
          .select("created_at,status,due_date")
          .gte("created_at", startISO)
          .lt("created_at", endISO);
        if (fuErr) throw fuErr;

        const totalReports = rpt?.length || 0;
        const totalFollowups = fu?.length || 0;
        const completed = fu?.filter(x => x.status === "completed").length || 0;
        const pending = fu?.filter(x => x.status === "pending").length || 0;
        const overdue = fu?.filter(x => x.status === "overdue").length || 0;

        // Daily buckets (YYYY-MM-DD)
        const dayKey = (d: string) => new Date(d).toISOString().slice(0, 10);
        const bucket = (rows: any[], field: string) => {
          const map = new Map<string, number>();
          rows?.forEach(r => {
            if (!r[field]) return;
            const k = dayKey(r[field]);
            map.set(k, (map.get(k) || 0) + 1);
          });
          // Fill 7-day range
          const days: { date: string; count: number }[] = [];
          const start = new Date(startISO);
          for (let i = 0; i < 7; i++) {
            const d = new Date(start); 
            d.setDate(start.getDate() + i);
            const k = d.toISOString().slice(0, 10);
            days.push({ date: k, count: map.get(k) || 0 });
          }
          return days;
        };

        const reportsByDay = bucket(rpt || [], "reported_at");
        const followupsByDay = bucket(fu || [], "created_at");

        if (isMounted) {
          setData({ 
            totalReports, 
            totalFollowups, 
            completed, 
            pending, 
            overdue, 
            reportsByDay, 
            followupsByDay 
          });
          console.log("✅ Weekly stats loaded from Supabase");
        }
      } catch (e: any) {
        if (isMounted) {
          setError(e.message || "Failed to load weekly stats");
          console.log("⚠️ Weekly stats error:", e.message || "Failed to load weekly stats");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [startISO, endISO]);

  return { loading, error, data };
}