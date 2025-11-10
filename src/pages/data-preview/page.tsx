
import { useDemoData } from '../../hooks/useDemoData';
import { useDataPreviewCounts } from '../../hooks/useDataPreviewCounts';
import { Database, RefreshCw, FileText, Users, Activity, Server, Github } from 'lucide-react';

export default function DataPreview() {
  const { loading, error, followups, reports, staff, dataSource, refetch } = useDemoData();
  const { counts, loading: countsLoading } = useDataPreviewCounts();

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-[#005EB8]">Loading data preview...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  const dataStats = [
    {
      title: 'Follow-ups',
      count: counts.followups,
      icon: Activity,
      color: 'bg-blue-500',
      data: followups
    },
    {
      title: 'Reports',
      count: counts.reports,
      icon: FileText,
      color: 'bg-green-500',
      data: reports
    },
    {
      title: 'Staff',
      count: counts.staff,
      icon: Users,
      color: 'bg-purple-500',
      data: staff
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Preview</h1>
            <p className="text-gray-600">
              {dataSource === 'supabase' ? 'Live Supabase database' : 'GitHub dataset fallback'} for RadAssist AI demo
            </p>
          </div>
          <button
            onClick={refetch}
            className="flex items-center space-x-2 px-4 py-2 bg-[#005EB8] text-white rounded-md hover:bg-[#004494] transition-colors whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Data Source Status */}
      <div className={`${dataSource === 'supabase' ? 'bg-green-50 border-green-200' : 'bg-[#E8F0FE] border-blue-200'} border rounded-lg p-6`}>
        <div className="flex items-center space-x-3 mb-4">
          {dataSource === 'supabase' ? (
            <Server className="w-6 h-6 text-green-600" />
          ) : (
            <Github className="w-6 h-6 text-[#005EB8]" />
          )}
          <h2 className={`text-lg font-semibold ${dataSource === 'supabase' ? 'text-green-800' : 'text-[#005EB8]'}`}>
            Data Source: {dataSource === 'supabase' ? 'Supabase Database' : 'GitHub Repository'}
          </h2>
        </div>
        <div className="space-y-2 text-sm">
          {dataSource === 'supabase' ? (
            <>
              <p><strong>Status:</strong> Connected to live Supabase database</p>
              <p><strong>Tables:</strong> followups, reports, staff</p>
              <p><strong>Last Updated:</strong> {new Date().toLocaleString()}</p>
              <p><strong>Data Type:</strong> Live database records</p>
            </>
          ) : (
            <>
              <p><strong>Repository:</strong> AI-2025-001-Clean-Synthetic-Dataset-for-Backlog-Demo</p>
              <p><strong>Owner:</strong> feditheanalyst</p>
              <p><strong>Last Updated:</strong> {new Date().toLocaleString()}</p>
              <p><strong>Cache Status:</strong> Active (24-hour cache)</p>
            </>
          )}
        </div>
      </div>

      {/* Data Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dataStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className={`${stat.color} rounded-lg p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.count}</p>
                  <p className="text-white/80 text-xs mt-1">records loaded</p>
                </div>
                <Icon className="w-8 h-8 text-white/80" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Raw Data Sections */}
      {dataStats.map((stat) => (
        <div key={stat.title} className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <stat.icon className="w-5 h-5 mr-2" />
                {stat.title} Data ({stat.count} records)
              </h3>
              <span className="text-sm text-gray-500">
                Source: {dataSource === 'supabase' ? 'Supabase' : 'GitHub'} | {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(stat.data.slice(0, 5), null, 2)}
                {stat.data.length > 5 && (
                  <div className="mt-4 text-gray-600 italic">
                    ... and {stat.data.length - 5} more records
                  </div>
                )}
              </pre>
            </div>
          </div>
        </div>
      ))}

      {/* Configuration Information */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Configuration & Setup</h3>
        </div>
        <div className="p-6 space-y-4">
          {dataSource === 'supabase' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supabase Configuration</label>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>✅ VITE_SUPABASE_URL configured</p>
                  <p>✅ VITE_SUPABASE_ANON_KEY configured</p>
                  <p>✅ Database connection established</p>
                  <p>✅ Tables: followups, reports, staff accessible</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Data URLs</label>
                <div className="space-y-2">
                  <code className="block text-xs bg-gray-100 p-2 rounded text-gray-800 break-all">
                    https://raw.githubusercontent.com/feditheanalyst/AI-2025-001-Clean-Synthetic-Dataset-for-Backlog-Demo/main/followups.json
                  </code>
                  <code className="block text-xs bg-gray-100 p-2 rounded text-gray-800 break-all">
                    https://raw.githubusercontent.com/feditheanalyst/AI-2025-001-Clean-Synthetic-Dataset-for-Backlog-Demo/main/reports.json
                  </code>
                  <code className="block text-xs bg-gray-100 p-2 rounded text-gray-800 break-all">
                    https://raw.githubusercontent.com/feditheanalyst/AI-2025-001-Clean-Synthetic-Dataset-for-Backlog-Demo/main/staff.json
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Technical Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">Technical Notes</h3>
        <ul className="space-y-2 text-sm text-yellow-700">
          <li>• Supabase integration with automatic GitHub fallback</li>
          <li>• Data is cached locally for 24 hours to improve performance</li>
          <li>• Automatic fallback to cached data if sources are unavailable</li>
          <li>• All data is synthetic and safe for demonstration purposes</li>
          <li>• Console logs confirm successful data loading from active source</li>
          <li>• Environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY</li>
        </ul>
      </div>
    </div>
  );
}
