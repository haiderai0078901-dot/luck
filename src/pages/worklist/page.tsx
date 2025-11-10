
import { useState, useEffect } from 'react';
import { useDemoData } from '../../hooks/useDemoData';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { buildWorklistRows } from '../../lib/dataAdapters';
import { aiSuggestion, testAiSuggestion } from '../../lib/supabaseClient';
import { Search, Filter, User, Calendar, Activity, X, Brain, UserPlus, Check } from 'lucide-react';
import AssignmentDrawer from '../pending-cases/components/AssignmentDrawer';

export default function Worklist() {
  const { loading: demoLoading, error: demoError, followups: demoFollowups } = useDemoData();
  const { loading: supabaseLoading, error: supabaseError, followUps: supabaseFollowUps, reports, staff } = useSupabaseData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<string>('');
  const [assignmentDrawerOpen, setAssignmentDrawerOpen] = useState(false);
  const [assignmentRowData, setAssignmentRowData] = useState<any>(null);
  const [assignedRows, setAssignedRows] = useState<Set<string>>(new Set());
  const [assignmentHistory, setAssignmentHistory] = useState<Record<string, any[]>>({});

  // Use Supabase data if available, fallback to demo data
  const loading = supabaseLoading || demoLoading;
  const error = supabaseError || demoError;
  const rows = supabaseFollowUps?.length ? buildWorklistRows({ followUps: supabaseFollowUps, reports, staff }) : demoFollowups;
  const alerts = [];

  console.log("✅ Worklist connected to Supabase data");

  // Test AI suggestion on component mount
  useEffect(() => {
    const runTest = async () => {
      const result = await testAiSuggestion();
      setTestResult(result);
    };
    runTest();
  }, []);

  // Fetch AI suggestions for all rows
  useEffect(() => {
    const fetchAiSuggestions = async () => {
      if (!rows || rows.length === 0) return;

      const suggestions: Record<string, string> = {};
      
      for (const row of rows) {
        const rowKey = `${row.patient}-${row.followUpAction}-${row.dueDate}`;
        try {
          const suggestion = await aiSuggestion(
            row.followUpAction || '',
            row.dueDate || '',
            row.status || ''
          );
          suggestions[rowKey] = suggestion || getAISuggestionFallback(row);
        } catch (error) {
          console.error('Error fetching AI suggestion for row:', error);
          suggestions[rowKey] = getAISuggestionFallback(row);
        }
      }
      
      setAiSuggestions(suggestions);
    };

    fetchAiSuggestions();
  }, [rows]);

  // AI suggestion helper function (fallback)
  const getAISuggestionFallback = (row: any) => {
    // Check for specialist pathways first
    const action = (row.followUpAction || '').toLowerCase();
    const specialistKeywords = ['oncology', 'gastroenterology', 'respiratory'];
    const hasSpecialistKeyword = specialistKeywords.some(keyword => action.includes(keyword));
    
    if (hasSpecialistKeyword && row.dueDate) {
      const due = new Date(row.dueDate);
      const now = new Date();
      const days = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (days <= 14 && days >= 0) {
        return 'High – Specialist pathway';
      }
    }
    
    // Fallback rule-based system
    if (row.status === 'Overdue' || row.status === 'overdue') {
      return 'High – Overdue status detected';
    }
    
    if (row.dueDate) {
      const due = new Date(row.dueDate);
      const now = new Date();
      const days = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (days <= 7 && days >= 0) {
        return `Medium – Due in ${days} day${days !== 1 ? 's' : ''}`;
      }
      if (days < 0) {
        return `High – ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`;
      }
    }
    
    // Check follow-up action for urgency keywords
    const urgentKeywords = ['urgent', 'immediate', 'critical', 'emergency', 'stat'];
    if (urgentKeywords.some(keyword => action.includes(keyword))) {
      return 'High – Urgent action detected';
    }
    
    return 'Low – Standard follow-up';
  };

  const handleAssignClick = (row: any) => {
    // Transform row data to match assignment drawer format
    const assignmentData = {
      followup_id: row.id || `worklist-${row.patient}`,
      patient_ref: row.patient,
      patient_id: row.patient,
      scan_type: row.scanType || row.type,
      action_required: row.followUpAction,
      follow_up_action: row.followUpAction,
      due_date: row.dueDate,
      assigned_to: row.assigned,
      assignee: { full_name: row.assigned }
    };
    
    setAssignmentRowData(assignmentData);
    setAssignmentDrawerOpen(true);
  };

  const handleAssignmentSuccess = (staffId: string, staffName: string, assignmentData?: any) => {
    if (assignmentRowData) {
      const rowKey = assignmentRowData.followup_id || `worklist-${assignmentRowData.patient_ref}`;
      
      // Mark this row as assigned
      setAssignedRows(prev => new Set([...prev, rowKey]));
      
      // Add to assignment history
      const newHistoryEntry = {
        assigned_at: assignmentData?.assigned_at || new Date().toISOString(),
        assigned_to: staffId,
        assigned_by: assignmentData?.assigned_by || 'demo-ui',
        staff_name: staffName
      };
      
      setAssignmentHistory(prev => ({
        ...prev,
        [rowKey]: [...(prev[rowKey] || []), newHistoryEntry]
      }));
    }
    
    // Refresh the data by triggering a re-fetch
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-[#005EB8]">Loading worklist data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    console.warn("⚠️ Data load error:", error);
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  // Filter data based on search and status
  const filteredRows = rows.filter(row => {
    const patient = row.patient || '';
    const action = row.followUpAction || '';
    const staff = row.assigned || '';
    
    const matchesSearch = patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'Pending':
      case 'pending':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'Completed':
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'Overdue':
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const handleRowClick = (row) => {
    setSelectedFollowup(row);
  };

  const closeDetailsPanel = () => {
    setSelectedFollowup(null);
  };

  const isRowAssigned = (row: any) => {
    const rowKey = row.id || `worklist-${row.patient}`;
    return assignedRows.has(rowKey);
  };

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className={`${selectedFollowup ? 'flex-1' : 'w-full'} p-6 space-y-6 overflow-auto`}>
        {/* Debug Test Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="text-xs text-yellow-800">
            <strong>Debug - Test AI Suggestion:</strong> {testResult || 'Loading...'}
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Worklist</h1>
          <p className="text-gray-600">Manage patient follow-up tasks and assignments</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by Patient ID, Action, or Staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#005EB8] focus:border-transparent pr-8"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            Showing {filteredRows.length} of {rows.length} follow-ups
          </p>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Overdue ({alerts?.length || 0})</span>
            </div>
          </div>
        </div>

        {/* Worklist Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#E8F0FE]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                    Patient ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                    Follow-up Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                    Assigned Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRows.map((row) => {
                  const rowKey = `${row.patient}-${row.followUpAction}-${row.dueDate}`;
                  const suggestion = aiSuggestions[rowKey] || 'Loading AI suggestion...';
                  const assigned = isRowAssigned(row);
                  
                  return (
                    <>
                      <tr 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleRowClick(row)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {row.patient}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Activity className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {row.followUpAction}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {row.assigned}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(row.status)}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {row.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignClick(row);
                            }}
                            className={`border px-3 py-1 rounded-md transition-colors text-sm whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                              row.assigned && row.assigned !== 'Unassigned'
                                ? 'bg-green-50 border-green-200 text-green-700' 
                                : 'bg-[#005EB8] border-[#005EB8] text-white hover:bg-[#004494]'
                            }`}
                          >
                            {row.assigned && row.assigned !== 'Unassigned' ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Assigned</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3 h-3" />
                                <span>Assign</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                      {/* AI Suggestion Helper Row */}
                      <tr className="bg-blue-50">
                        <td colSpan={7} className="px-6 py-2">
                          <div className="flex items-center space-x-2 text-xs">
                            <Brain className="w-3 h-3 text-blue-600" />
                            <span className="text-gray-600">AI Suggestion:</span>
                            <span className="text-gray-900">{suggestion}</span>
                          </div>
                        </td>
                      </tr>
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredRows.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No follow-ups found matching your criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Details Panel */}
      {selectedFollowup && (
        <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Follow-up Details</h2>
            <button
              onClick={closeDetailsPanel}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Patient ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient ID
              </label>
              <div className="flex items-center p-3 bg-gray-50 rounded-md">
                <User className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">{selectedFollowup.patient}</span>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <div className="flex items-center p-3 bg-gray-50 rounded-md">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">
                  {selectedFollowup.dueDate ? new Date(selectedFollowup.dueDate).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>

            {/* Follow-up Action */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow-up Action
              </label>
              <div className="flex items-start p-3 bg-gray-50 rounded-md">
                <Activity className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                <span className="text-sm text-gray-900">{selectedFollowup.followUpAction}</span>
              </div>
            </div>

            {/* Assigned Staff */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Staff
              </label>
              <div className="p-3 bg-gray-50 rounded-md">
                <span className="text-sm text-gray-900">{selectedFollowup.assigned}</span>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="p-3 bg-gray-50 rounded-md">
                <span className={getStatusBadge(selectedFollowup.status)}>
                  {selectedFollowup.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Drawer */}
      <AssignmentDrawer
        isOpen={assignmentDrawerOpen}
        onClose={() => {
          setAssignmentDrawerOpen(false);
          setAssignmentRowData(null);
        }}
        caseData={assignmentRowData}
        onAssignmentSuccess={handleAssignmentSuccess}
        assignmentHistory={assignmentRowData ? assignmentHistory[assignmentRowData.followup_id || `worklist-${assignmentRowData.patient_ref}`] : undefined}
      />
    </div>
  );
}
