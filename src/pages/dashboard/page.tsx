
import { Activity, AlertTriangle, CheckCircle, Clock, FileText, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export default function DashboardPage() {
  const { stats, staffAssignments, staffAssignmentsError, slaData, loading, error, reload } = useDashboardStats();

  const handleRefresh = () => {
    reload();
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading dashboard: {error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-3">
          <Link
            to="/weekly-report"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap cursor-pointer"
          >
            Weekly Report
          </Link>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Scans */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Scans</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.totalScans.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.pending.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.completed.toLocaleString()}
              </p>
              {slaData && !loading && (
                <p className="text-xs text-gray-500 mt-1">
                  SLA Met: {slaData.pct_met}% (last 28 days)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-500 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.overdue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Assignments Created This Week */}
        <Link to="/assignments?range=this-week" className="block">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-600">Assignments Created (This Week)</p>
                  <div className="relative ml-1 group">
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Count from assignments_audit since Monday (date_trunc('week')). This is an activity metric and may be higher than the current assigned items in Worklist.
                    </div>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.assignmentsThisWeek.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  All assignment events incl. reassignments & completed
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Assignments by Staff Widget */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignments by Staff (This Week)</h2>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading staff assignments...</div>
          </div>
        ) : staffAssignmentsError ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>{staffAssignmentsError}</p>
            </div>
          </div>
        ) : staffAssignments.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No assignments this week</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {staffAssignments.map((item, index) => {
              const maxAssignments = Math.max(...staffAssignments.map(s => s.total_assignments));
              const percentage = maxAssignments > 0 ? (item.total_assignments / maxAssignments) * 100 : 0;
              
              return (
                <Link 
                  key={index} 
                  to={`/assignments?staff=${encodeURIComponent(item.staff_id)}`}
                  className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors"
                >
                  <div className="w-32 text-sm font-medium text-gray-700 truncate">
                    {item.staff}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div 
                      className="bg-blue-500 h-6 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {item.total_assignments}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <Link 
              to="/pending-cases"
              className="block w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
            >
              View Pending Cases
            </Link>
            <Link 
              to="/weekly-report"
              className="block w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
            >
              Generate Report
            </Link>
            <Link 
              to="/alerts"
              className="block w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
            >
              Manage Alerts
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Activity</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• 3 new scans processed</p>
            <p>• 2 cases assigned to staff</p>
            <p>• 1 overdue case resolved</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">System Status</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">All systems operational</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Database connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
