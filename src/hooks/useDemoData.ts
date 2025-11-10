
import { useState, useEffect } from 'react';
import { fetchGitHubData, type DemoData, type FollowUp } from '../utils/fetchGitHubData';
import { supabase, type SupabaseFollowUp, type SupabaseReport, type SupabaseStaff } from '../lib/supabaseClient';

export interface Alert {
  id: string;
  patient_id: string;
  message: string;
  type: 'overdue' | 'urgent' | 'warning';
  date: string;
}

export interface UseDemoDataReturn {
  loading: boolean;
  error: string | null;
  followups: FollowUp[];
  reports: any[];
  staff: any[];
  alerts: Alert[];
  dataSource: 'supabase' | 'github';
  refetch: () => Promise<void>;
}

export function useDemoData(): UseDemoDataReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'supabase' | 'github'>('github');
  const [data, setData] = useState<DemoData>({
    followups: [],
    reports: [],
    staff: []
  });

  const generateAlertsFromSupabase = (followups: SupabaseFollowUp[]): Alert[] => {
    const today = new Date().toISOString().split('T')[0];
    
    return followups
      .filter(followup => 
        followup.status === 'Overdue' || 
        (followup.due_date < today && followup.status !== 'Completed')
      )
      .map(followup => ({
        id: `alert-${followup.id}`,
        patient_id: followup.patient_ref,
        message: `Overdue follow-up: ${followup.action_required}`,
        type: 'overdue' as const,
        date: followup.scan_date
      }));
  };

  const generateAlerts = (followups: FollowUp[]): Alert[] => {
    return followups
      .filter(followup => followup.status === 'Overdue')
      .map(followup => ({
        id: `alert-${followup.id}`,
        patient_id: followup.patient_id,
        message: `Overdue follow-up: ${followup.follow_up_action}`,
        type: 'overdue' as const,
        date: followup.scan_date
      }));
  };

  const convertSupabaseToGitHubFormat = (
    supabaseFollowups: SupabaseFollowUp[],
    supabaseReports: SupabaseReport[],
    supabaseStaff: SupabaseStaff[]
  ): DemoData => {
    const followups: FollowUp[] = supabaseFollowups.map(item => ({
      id: item.id,
      patient_id: item.patient_ref,
      scan_date: item.scan_date,
      follow_up_action: item.action_required,
      assigned_staff: item.assigned_to,
      status: item.status,
      priority: item.priority,
      notes: `Due: ${item.due_date}`
    }));

    const reports = supabaseReports.map(item => ({
      id: item.id,
      patient_id: item.patient_ref,
      scan_type: item.scan_type,
      radiologist: item.radiologist,
      date: item.report_date,
      notes: item.summary,
      findings: item.summary
    }));

    const staff = supabaseStaff.map(item => ({
      id: item.id,
      name: item.name,
      role: item.role,
      department: item.team,
      email: item.email
    }));

    return { followups, reports, staff };
  };

  const loadFromSupabase = async (): Promise<DemoData | null> => {
    if (!supabase) {
      return null;
    }

    try {
      const [followupsResult, reportsResult, staffResult] = await Promise.all([
        supabase.from('followups').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('staff').select('*').order('created_at', { ascending: false }).limit(500)
      ]);

      if (followupsResult.error || reportsResult.error || staffResult.error) {
        console.warn('⚠️ Supabase query error:', {
          followups: followupsResult.error,
          reports: reportsResult.error,
          staff: staffResult.error
        });
        return null;
      }

      const followups = followupsResult.data || [];
      const reports = reportsResult.data || [];
      const staff = staffResult.data || [];

      // If all arrays are empty, return null to trigger fallback
      if (followups.length === 0 && reports.length === 0 && staff.length === 0) {
        console.warn('⚠️ Supabase tables are empty, falling back to GitHub data');
        return null;
      }

      console.log('✅ Supabase data loaded (RadAssist AI)');
      return convertSupabaseToGitHubFormat(followups, reports, staff);

    } catch (error) {
      console.warn('⚠️ Supabase connection error:', error);
      return null;
    }
  };

  const loadFromGithub = async (): Promise<DemoData> => {
    try {
      const demoData = await fetchGitHubData();
      console.log('✅ GitHub demo data loaded (fallback)');
      return demoData;
    } catch (error) {
      console.error('⚠️ Data load error; using fallback if available', error);
      throw error;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try Supabase first
      const supabaseData = await loadFromSupabase();
      
      if (supabaseData) {
        setData(supabaseData);
        setDataSource('supabase');
      } else {
        // Fallback to GitHub
        const githubData = await loadFromGithub();
        setData(githubData);
        setDataSource('github');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('⚠️ Data load error; using fallback if available', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    loading,
    error,
    followups: data.followups,
    reports: data.reports,
    staff: data.staff,
    alerts: dataSource === 'supabase' && data.followups.length > 0 
      ? generateAlertsFromSupabase(data.followups as any)
      : generateAlerts(data.followups),
    dataSource,
    refetch: fetchData
  };
}
