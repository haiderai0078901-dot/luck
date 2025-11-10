
import { Activity, Calendar, User, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface RecentAssignment {
  patient_ref: string;
  action_required: string;
  assigned_to: string;
  assigned_by: string;
  assigned_at: string;
  status: string;
}

export default function AssignmentsPage() {
  const { staffAssignments, loading, error, reload, stats } = useDashboardStats();
  const [recentAssignments, setRecentAssignments] = useState<RecentAssignment[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [filteredAssignments, setFilteredAssignments] = useState<RecentAssignment[]>([]);
  const [assignedToFilter, setAssignedToFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchRecentAssignments = async () => {
    try {
      setRecentLoading(true);
      setRecentError(null);
      
      const { data, error } = await supabase
        .from('v_assignments_recent')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('Error fetching recent assignments:', error);
        setRecentError(error.message);
        setRecentAssignments([]);
        setFilteredAssignments([]);
      } else {
        setRecentAssignments(data || []);
        setFilteredAssignments(data || []);
      }
    } catch (err) {
      console.error('Error fetching recent assignments:', err);
      setRecentError('Failed to load recent assignments');
      setRecentAssignments([]);
      setFilteredAssignments([]);
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentAssignments();
  }, []);

  useEffect(() => {
    let filtered = recentAssignments;

    if (assignedToFilter) {
      filtered = filtered.filter(assignment => 
        assignment.assigned_to.toLowerCase().includes(assignedToFilter.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(assignment => 
        assignment.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredAssignments(filtered);
  }, [recentAssignments, assignedToFilter, statusFilter]);

  const handleRefresh = () => {
    reload();
    fetchRecentAssignments();
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading assignments: {error}</p>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">Staff assignments for this week</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 whitespace-nowrap cursor-pointer"
          >
            Back to Dashboard
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Staff</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? "..." : staffAssignments.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.assignmentsThisWeek.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Date().toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Assignments Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Staff Assignment Details</h2>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading staff assignments...</div>
            </div>
          ) : staffAssignments.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No assignments this week</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Workload
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staffAssignments
                    .sort((a, b) => b.total_assignments - a.total_assignments)
                    .map((item, index) => {
                      const maxAssignments = Math.max(...staffAssignments.map(s => s.total_assignments));
                      const percentage = maxAssignments > 0 ? (item.total_assignments / maxAssignments) * 100 : 0;
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                  <User className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.staff}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-semibold">
                              {item.total_assignments}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {percentage.toFixed(0)}% of max load
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.total_assignments > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.total_assignments > 0 ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3 mr-1" />
                                  Available
                                </>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link 
              to="/pending-cases"
              className="block w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
            >
              Assign Pending Cases
            </Link>
            <Link 
              to="/worklist"
              className="block w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
            >
              View Worklist
            </Link>
            <Link 
              to="/weekly-report"
              className="block w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
            >
              Generate Report
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Insights</h3>
          <div className="space-y-3">
            {staffAssignments.length > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Highest workload:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.max(...staffAssignments.map(s => s.total_assignments))} assignments
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average workload:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(staffAssignments.reduce((sum, item) => sum + item.total_assignments, 0) / staffAssignments.length)} assignments
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Staff utilization:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {staffAssignments.filter(s => s.total_assignments > 0).length} / {staffAssignments.length} active
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Assignment Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Assignment Activity</h2>
        </div>
        
        <div className="p-6">
          {/* Filter Bar */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignedToFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Assigned To
              </label>
              <input
                id="assignedToFilter"
                type="text"
                placeholder="Enter staff name..."
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <div className="relative">
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <i className="ri-arrow-down-s-line text-gray-400"></i>
                </div>
              </div>
            </div>
          </div>

          {recentLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Loading recent assignments...</div>
            </div>
          ) : recentError ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-red-500">Error loading recent assignments: {recentError}</div>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>{recentAssignments.length === 0 ? 'No assignments recorded yet.' : 'No assignments match the current filters.'}</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Follow-up Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAssignments.map((assignment, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.patient_ref}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {assignment.action_required}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {assignment.assigned_to}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {assignment.assigned_by}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDateTime(assignment.assigned_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          assignment.status === 'Completed' 
                            ? 'bg-green-100 text-green-800'
                            : assignment.status === 'Overdue'
                            ? 'bg-red-100 text-red-800'
                            : assignment.status === 'In Progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}