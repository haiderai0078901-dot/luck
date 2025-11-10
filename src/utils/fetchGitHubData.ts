export interface FollowUp {
  id: string;
  patient_id: string;
  scan_date: string;
  follow_up_action: string;
  assigned_staff: string;
  status: 'Pending' | 'Completed' | 'Overdue';
  priority: string;
  notes?: string;
}

export interface Report {
  id: string;
  patient_id: string;
  scan_type: string;
  radiologist: string;
  date: string;
  notes: string;
  findings?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  email?: string;
}

export interface DemoData {
  followups: FollowUp[];
  reports: Report[];
  staff: Staff[];
}

const GITHUB_URLS = {
  followups: 'https://raw.githubusercontent.com/feditheanalyst/AI-2025-001-Clean-Synthetic-Dataset-for-Backlog-Demo/main/followups.json',
  reports: 'https://raw.githubusercontent.com/feditheanalyst/AI-2025-001-Clean-Synthetic-Dataset-for-Backlog-Demo/main/reports.json',
  staff: 'https://raw.githubusercontent.com/feditheanalyst/AI-2025-001-Clean-Synthetic-Dataset-for-Backlog-Demo/main/staff.json'
};

const CACHE_KEY = 'radassist_demo_data';
const CACHE_TIMESTAMP_KEY = 'radassist_demo_data_timestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function fetchGitHubData(): Promise<DemoData> {
  try {
    // Check cache first
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cachedData && cachedTimestamp) {
      const timestamp = parseInt(cachedTimestamp);
      const now = Date.now();
      
      if (now - timestamp < CACHE_DURATION) {
        console.log('✅ Using cached GitHub demo data for RadAssist AI');
        return JSON.parse(cachedData);
      }
    }

    // Fetch fresh data
    const [followupsResponse, reportsResponse, staffResponse] = await Promise.all([
      fetch(GITHUB_URLS.followups),
      fetch(GITHUB_URLS.reports),
      fetch(GITHUB_URLS.staff)
    ]);

    if (!followupsResponse.ok || !reportsResponse.ok || !staffResponse.ok) {
      throw new Error('Failed to fetch one or more data sources');
    }

    const [followups, reports, staff] = await Promise.all([
      followupsResponse.json(),
      reportsResponse.json(),
      staffResponse.json()
    ]);

    const demoData: DemoData = {
      followups: followups || [],
      reports: reports || [],
      staff: staff || []
    };

    // Cache the data
    localStorage.setItem(CACHE_KEY, JSON.stringify(demoData));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

    console.log('✅ GitHub demo data loaded for RadAssist AI');
    return demoData;

  } catch (error) {
    console.warn('⚠️ GitHub data fetch failed', error);
    
    // Try to return cached data even if expired
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      console.log('Using expired cached data as fallback');
      return JSON.parse(cachedData);
    }

    // Return empty data structure as last resort
    return {
      followups: [],
      reports: [],
      staff: []
    };
  }
}