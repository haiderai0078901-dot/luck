import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

type Counts = { followups: number; reports: number; staff: number };

export function useDataPreviewCounts() {
  const [counts, setCounts] = useState<Counts>({ followups: 0, reports: 0, staff: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // Try Supabase first
      const [{ count: fu }, { count: rp }, { count: st }] = await Promise.all([
        supabase.from("followups").select("*", { count: "exact", head: true }),
        supabase.from("reports").select("*",   { count: "exact", head: true }),
        supabase.from("staff").select("*",     { count: "exact", head: true }),
      ]);
      if (fu !== null && rp !== null && st !== null) {
        setCounts({ followups: fu!, reports: rp!, staff: st! });
        console.log("✅ Data Preview counts loaded from Supabase");
        return;
      }
      throw new Error("Supabase unavailable");
    } catch {
      // Fallback to GitHub demo JSON
      const base =
        "https://raw.githubusercontent.com/feditheanalyst/AI-2025-001-Clean-Synthetic-Dataset-for-Backlog-Demo/main";
      const [fuRes, rpRes, stRes] = await Promise.all([
        fetch(`${base}/followups.json`).then(r=>r.json()).catch(()=>[]),
        fetch(`${base}/reports.json`).then(r=>r.json()).catch(()=>[]),
        fetch(`${base}/staff.json`).then(r=>r.json()).catch(()=>[]),
      ]);
      setCounts({
        followups: Array.isArray(fuRes) ? fuRes.length : 0,
        reports:   Array.isArray(rpRes) ? rpRes.length : 0,
        staff:     Array.isArray(stRes) ? stRes.length : 0,
      });
      console.log("⚠️ Supabase fallback: counts loaded from GitHub dataset");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { counts, loading, error, reload: load };
}