
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Clock, AlertTriangle, User, Calendar, FileText, X, Search, Check, History } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { updateAssignment } from '@/utils/updateAssignment';

interface CaseDetails {
  patient_ref?: string;
  report_id?: string;
  scan_type?: string;
  modality?: string;
  reported_at?: string;
  action_required?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  staff_name?: string;
  days_overdue?: number;
}

interface StaffMember {
  staff_id: string;
  staff_name: string;
  role: string;
  team: string;
  is_active: boolean;
}

interface AssignmentHistoryRecord {
  assigned_at: string;
  assigned_to: string;
  assigned_by: string;
}

interface AssignmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  followupId: string;
  staffMembers: StaffMember[];
}

function AssignmentHistoryModal({ isOpen, onClose, followupId, staffMembers }: AssignmentHistoryModalProps) {
  const [history, setHistory] = useState<AssignmentHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && followupId) {
      fetchAssignmentHistory();
    }
  }, [isOpen, followupId]);

  const fetchAssignmentHistory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('assignments_audit')
        .select('assigned_at, assigned_to, assigned_by')
        .eq('followup_id', followupId)
        .order('assigned_at', { ascending: false })
        .limit(20);

      if (fetchError) {
        setError('Failed to load assignment history');
        console.error('Assignment history fetch error:', fetchError);
      } else {
        setHistory(data || []);
      }
    } catch (err) {
      setError('Failed to load assignment history');
      console.error('Assignment history fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStaffName = (staffId: string) => {
    const staff = staffMembers.find(s => s.staff_id === staffId);
    return staff ? staff.staff_name : staffId;
  };

  const formatTimestampUK = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Assignment History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-[#005EB8]">Loading assignment history...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date/Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Assigned To</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Assigned By</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatTimestampUK(record.assigned_at)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {getStaffName(record.assigned_to)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {record.assigned_by}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No history yet</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface AssignmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: any;
  onAssignmentSuccess: (staffId: string, staffName: string) => void;
}

function AssignmentDrawer({ isOpen, onClose, caseData, onAssignmentSuccess }: AssignmentDrawerProps) {
  const [activeStaff, setActiveStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch active staff
  useEffect(() => {
    if (isOpen) {
      fetchActiveStaff();
      // Preselect current assignee
      if (caseData?.assigned_to) {
        setSelectedStaffId(caseData.assigned_to);
      }
    }
  }, [isOpen, caseData]);

  const fetchActiveStaff = async () => {
    setIsLoading(true);
    setDbError(false);
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('staff_id, staff_name, role, team, is_active')
        .eq('is_active', true)
        .limit(50)
        .order('staff_name');

      if (error) {
        setDbError(true);
        console.error('Failed to fetch staff:', error);
      } else {
        setActiveStaff(data || []);
      }
    } catch (err) {
      setDbError(true);
      console.error('Staff fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered staff based on search
  const filteredStaff = useMemo(() => {
    if (!debouncedSearchTerm) return activeStaff;
    const term = debouncedSearchTerm.toLowerCase();
    return activeStaff.filter(staff => 
      staff.staff_name.toLowerCase().includes(term) ||
      staff.role.toLowerCase().includes(term) ||
      staff.team.toLowerCase().includes(term)
    );
  }, [activeStaff, debouncedSearchTerm]);

  const selectedStaff = activeStaff.find(s => s.staff_id === selectedStaffId);

  const handleAssign = async () => {
    if (!selectedStaffId || !caseData || isAssigning) return;

    setIsAssigning(true);
    
    try {
      const followupId = caseData.followup_id || caseData.id;
      
      // Use Supabase RPC instead of direct table update
      const { data, error } = await supabase.rpc('assign_followup', {
        p_followup_id: followupId,
        p_staff_id: selectedStaffId,
        p_assigned_by: 'demo-ui'
      });

      if (error) {
        console.error('❌ Assign error', { followupId, staffId: selectedStaffId, error });
        setToast({ type: 'error', message: `❌ Couldn't assign: ${error.message}` });
        setIsAssigning(false);
      } else {
        const staffName = selectedStaff?.staff_name || 'Unknown';
        setToast({ type: 'success', message: `✅ Assigned to ${staffName}` });
        
        // Close drawer and update parent after short delay
        setTimeout(() => {
          onAssignmentSuccess(selectedStaffId, staffName);
          onClose();
          setToast(null);
        }, 1000);
      }
    } catch (err) {
      console.error('❌ Assign error', { followupId: caseData.followup_id || caseData.id, staffId: selectedStaffId, error: err });
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setToast({ type: 'error', message: `❌ Couldn't assign: ${errorMessage}` });
      setIsAssigning(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isDropdownOpen) {
        setIsDropdownOpen(false);
      } else {
        onClose();
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50"
        onClick={handleBackdropClick}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="bg-white h-full w-96 shadow-xl overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Assign Case</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Read-only case details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                <div className="text-sm text-gray-900">{caseData?.patient_ref || caseData?.patient_id || 'N/A'}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scan Type</label>
                <div className="text-sm text-gray-900">{caseData?.scan_type || caseData?.type || 'N/A'}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Required</label>
                <div className="text-sm text-gray-900">{caseData?.action_required || caseData?.follow_up_action || 'N/A'}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <div className="text-sm text-gray-900">
                  {caseData?.due_date ? new Date(caseData.due_date).toLocaleDateString() : 'Not set'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Assignee</label>
                <div className="text-sm text-gray-900">{caseData?.assigned_to || caseData?.assignee?.full_name || caseData?.assignee?.name || 'Unassigned'}</div>
              </div>
            </div>

            {/* Staff picker */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Assign to</label>
              
              {dbError ? (
                <div className="text-sm text-red-600">Database unavailable</div>
              ) : (
                <div className="relative">
                  <div 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer bg-white flex items-center justify-between"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span className="text-sm text-gray-900">
                      {selectedStaff ? `${selectedStaff.staff_name} — ${selectedStaff.role} (${selectedStaff.team})` : 'Select staff member...'}
                    </span>
                    <div className="text-gray-400">
                      {isDropdownOpen ? '▲' : '▼'}
                    </div>
                  </div>
                  
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search staff..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent"
                            autoFocus
                          />
                        </div>
                      </div>
                      
                      {isLoading ? (
                        <div className="p-3 text-sm text-gray-600 text-center">Loading staff...</div>
                      ) : filteredStaff.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto">
                          {filteredStaff.map((staff) => (
                            <div
                              key={staff.staff_id}
                              className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                                selectedStaffId === staff.staff_id ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                              }`}
                              onClick={() => {
                                setSelectedStaffId(staff.staff_id);
                                setIsDropdownOpen(false);
                                setSearchTerm('');
                              }}
                            >
                              <span>{staff.staff_name} — {staff.role} ({staff.team})</span>
                              {selectedStaffId === staff.staff_id && (
                                <Check className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-sm text-gray-600 text-center">No staff found</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* View History button */}
              <div className="mt-2">
                <button
                  onClick={() => setHistoryModalOpen(true)}
                  className="text-sm text-[#005EB8] hover:text-[#004494] transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <History className="w-4 h-4" />
                  <span>View History</span>
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={onClose}
                disabled={isAssigning}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedStaffId || dbError || isAssigning}
                className="bg-[#005EB8] text-white px-4 py-2 rounded-md hover:bg-[#004494] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>

        {/* Toast notification */}
        {toast && (
          <div className={`fixed top-4 right-4 px-4 py-2 rounded-md shadow-lg z-50 ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.message}
          </div>
        )}
      </div>

      {/* Assignment History Modal */}
      <AssignmentHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        followupId={caseData?.followup_id || caseData?.id || ''}
        staffMembers={activeStaff}
      />
    </>
  );
}

export default function PendingCases() {
  const { loading, error, staff = [] } = useSupabaseData();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<CaseDetails | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [assignmentDrawerOpen, setAssignmentDrawerOpen] = useState(false);
  const [assignmentCaseData, setAssignmentCaseData] = useState<any>(null);
  const [pendingCasesData, setPendingCasesData] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'unassigned' | 'overdue'>('all');
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const navigate = useNavigate();

  // Fetch pending cases based on filter
  const fetchPendingCases = async () => {
    setIsLoadingCases(true);
    try {
      let query;
      
      switch (filterType) {
        case 'unassigned':
          query = supabase.from('v_followups_pending_unassigned').select('*');
          break;
        case 'overdue':
          query = supabase.from('v_followups_pending').select('*').eq('is_overdue', true);
          break;
        default:
          query = supabase.from('v_followups_pending').select('*');
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Failed to fetch pending cases:', error);
        setPendingCasesData([]);
      } else {
        setPendingCasesData(data || []);
      }
    } catch (err) {
      console.error('Pending cases fetch error:', err);
      setPendingCasesData([]);
    } finally {
      setIsLoadingCases(false);
    }
  };

  // Fetch cases when filter changes
  useEffect(() => {
    fetchPendingCases();
  }, [filterType]);

  const handleReviewClick = async (case_: any, index: number) => {
    const identifier = case_.followup_id || case_.report_id || case_.patient_ref || case_.patient_id || `pending-${index}`;
    console.log(`✅ Review opened for ${identifier}`);
    
    setModalLoading(true);
    setModalOpen(true);
    
    try {
      let caseDetails: CaseDetails = {};
      
      // Try to fetch additional data from Supabase
      if (case_.followup_id) {
        const { data: followupData, error: followupError } = await supabase
          .from('followups')
          .select('*')
          .eq('followup_id', case_.followup_id)
          .single();
        
        if (!followupError && followupData) {
          caseDetails = { ...followupData };
        }
      } else if (case_.report_id) {
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .select('*')
          .eq('report_id', case_.report_id)
          .single();
        
        if (!reportError && reportData) {
          caseDetails = { ...reportData };
        }
      } else if (case_.patient_ref || case_.patient_id) {
        const patientRef = case_.patient_ref || case_.patient_id;
        const { data: followupData, error: followupError } = await supabase
          .from('followups')
          .select('*')
          .eq('patient_ref', patientRef)
          .single();
        
        if (!followupError && followupData) {
          caseDetails = { ...followupData };
        }
      }
      
      // Merge with existing case data
      const mergedData = {
        patient_ref: caseDetails.patient_ref || case_.patient_ref || case_.patient_id || `NHS${String(1001 + index).padStart(6, '0')}`,
        report_id: caseDetails.report_id || case_.report_id || '',
        scan_type: caseDetails.scan_type || caseDetails.modality || case_.scan_type || case_.type || case_.modality || 'N/A',
        reported_at: caseDetails.reported_at || case_.date || case_.scan_date || case_.reported_at || '',
        action_required: caseDetails.action_required || case_.action_required || case_.follow_up_action || 'N/A',
        status: caseDetails.status || case_.status || case_.STATUS || case_['Status'] || 'pending',
        priority: caseDetails.priority || case_.priority || '',
        assigned_to: caseDetails.assigned_to || case_.assigned_to || '',
      };
      
      // Map staff ID to staff name
      if (mergedData.assigned_to) {
        const staffMember = staff.find(s => s.staff_id === mergedData.assigned_to);
        mergedData.staff_name = staffMember?.staff_name || mergedData.assigned_to;
      }
      
      // Calculate days overdue if status is overdue
      if (mergedData.status?.toLowerCase() === 'overdue' && mergedData.reported_at) {
        const reportDate = new Date(mergedData.reported_at);
        const today = new Date();
        const diffTime = today.getTime() - reportDate.getTime();
        mergedData.days_overdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      setModalData(mergedData);
    } catch (err) {
      console.log(`⚠️ Review modal data fetch failed: ${err}`);
      // Use existing case data as fallback
      setModalData({
        patient_ref: case_.patient_ref || case_.patient_id || `NHS${String(1001 + index).padStart(6, '0')}`,
        report_id: case_.report_id || '',
        scan_type: case_.scan_type || case_.type || case_.modality || 'N/A',
        reported_at: case_.date || case_.scan_date || case_.reported_at || '',
        action_required: case_.action_required || case_.follow_up_action || 'N/A',
        status: case_.status || case_.STATUS || case_['Status'] || 'pending',
        priority: case_.priority || '',
        assigned_to: case_.assigned_to || case_.assignee?.full_name || case_.assignee?.name || '',
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleAssignClick = (case_: any, index: number) => {
    setAssignmentCaseData(case_);
    setAssignmentDrawerOpen(true);
  };

  const handleAssignmentSuccess = (staffId: string, staffName: string) => {
    // Update the case in local state
    setPendingCasesData(prev => 
      prev.map(case_ => 
        (case_.followup_id || case_.id) === (assignmentCaseData?.followup_id || assignmentCaseData?.id)
          ? { ...case_, assigned_to: staffId, assignee: { full_name: staffName } }
          : case_
      )
    );
    setAssignmentDrawerOpen(false);
    setAssignmentCaseData(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalData(null);
  };

  const handleOpenInWorklist = () => {
    if (modalData?.patient_ref) {
      navigate(`/worklist?patient=${modalData.patient_ref}`);
    }
    closeModal();
  };

  // Handle ESC key and outside click
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-[#005EB8]">Loading pending cases...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error loading data: {String(error)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Pending Cases</h1>
        <p className="text-gray-600">
          {pendingCasesData.length} pending follow-up cases requiring review
        </p>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
            filterType === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('unassigned')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
            filterType === 'unassigned'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Unassigned
        </button>
        <button
          onClick={() => setFilterType('overdue')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
            filterType === 'overdue'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overdue
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-orange-500 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium opacity-90">Total Pending</p>
              <p className="text-white text-3xl font-bold mt-2">{pendingCasesData.length}</p>
            </div>
            <Clock className="w-8 h-8 text-white opacity-80" />
          </div>
        </div>
        
        <div className="bg-[#005EB8] rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium opacity-90">High Priority</p>
              <p className="text-white text-3xl font-bold mt-2">
                {pendingCasesData.filter(c => (c.priority || '').toLowerCase() === 'high').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-white opacity-80" />
          </div>
        </div>

        <div className="bg-green-500 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium opacity-90">This Week</p>
              <p className="text-white text-3xl font-bold mt-2">
                {pendingCasesData.filter(c => {
                  const date = new Date(c.date || c.scan_date || c.reported_at || '');
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return date >= weekAgo;
                }).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-white opacity-80" />
          </div>
        </div>
      </div>

      {/* Cases List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pending Cases</h3>
        </div>
        
        {isLoadingCases ? (
          <div className="p-12 text-center">
            <div className="text-[#005EB8]">Loading cases...</div>
          </div>
        ) : pendingCasesData.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {pendingCasesData.map((case_, index) => (
              <div key={case_.id || case_.followup_id || `pending-${index}`} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          Patient {case_.patient_id || case_.patient_ref || `NHS${String(1001 + index).padStart(6, '0')}`}
                        </span>
                      </div>
                      
                      {(case_.priority || '').toLowerCase() === 'high' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          High Priority
                        </span>
                      )}
                      
                      {case_.is_overdue && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Overdue
                        </span>
                      )}
                      
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Scan Date:</span>
                        <br />
                        {case_.date || case_.scan_date || case_.reported_at || new Date(Date.now() - index * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </div>
                      
                      <div>
                        <span className="font-medium">Scan Type:</span>
                        <br />
                        {case_.scan_type || case_.type || case_.modality || 'N/A'}
                      </div>
                      
                      <div>
                        <span className="font-medium">Assigned To:</span>
                        <br />
                        {case_.assigned_to || case_.assignee?.full_name || case_.assignee?.name || case_.staff_name || 'Unassigned'}
                      </div>
                      
                      <div>
                        <span className="font-medium">Follow-up Required:</span>
                        <br />
                        {case_.action_required || case_.follow_up_action || 'N/A'}
                      </div>
                    </div>
                    
                    {(case_.notes || case_.comments) && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <div className="flex items-start space-x-2">
                          <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div>
                            <span className="text-sm font-medium text-gray-700">Notes:</span>
                            <p className="text-sm text-gray-600 mt-1">
                              {case_.notes || case_.comments}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-6 flex space-x-2">
                    <button 
                      onClick={() => handleReviewClick(case_, index)}
                      className="bg-[#005EB8] text-white px-4 py-2 rounded-md hover:bg-[#004494] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Review
                    </button>
                    {case_.assigned_to ? (
                      <span className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-600 cursor-not-allowed">
                        Assigned
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleAssignClick(case_, index)}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Cases</h3>
            <p className="text-gray-600">
              {filterType === 'unassigned' 
                ? 'All cases have been assigned.' 
                : filterType === 'overdue' 
                ? 'No overdue cases found.' 
                : 'All follow-up cases have been reviewed and processed.'}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {pendingCasesData.length > 0 && (
        <div className="flex justify-end space-x-4">
          <button className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer">
            Export List
          </button>
          <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors whitespace-nowrap cursor-pointer">
            Mark All Reviewed
          </button>
        </div>
      )}

      {/* Case Review Modal */}
      {modalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleModalBackdropClick}
          onKeyDown={handleModalKeyDown}
          tabIndex={-1}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Case Review</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {modalLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-[#005EB8]">Loading case details...</div>
                </div>
              ) : modalData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                      <div className="text-sm text-gray-900">{modalData.patient_ref || 'N/A'}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Report ID</label>
                      <div className="text-sm text-gray-900">{modalData.report_id || 'N/A'}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Scan Type</label>
                      <div className="text-sm text-gray-900">{modalData.scan_type || modalData.modality || 'N/A'}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Scan / Reported Date</label>
                      <div className="text-sm text-gray-900">
                        {modalData.reported_at ? new Date(modalData.reported_at).toLocaleDateString() : ''}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className="text-sm text-gray-900">{modalData.status || 'N/A'}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <div className="text-sm text-gray-900">{modalData.priority || 'Normal'}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                      <div className="text-sm text-gray-900">{modalData.staff_name || modalData.assigned_to || 'Unassigned'}</div>
                    </div>
                    
                    {modalData.status?.toLowerCase() === 'overdue' && modalData.days_overdue && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Days Overdue</label>
                        <div className="text-sm text-red-600 font-medium">{modalData.days_overdue} days</div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Required</label>
                    <div className="text-sm text-gray-900">{modalData.action_required || 'N/A'}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No additional details available for this case.</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleOpenInWorklist}
                className="bg-[#005EB8] text-white px-4 py-2 rounded-md hover:bg-[#004494] transition-colors whitespace-nowrap cursor-pointer"
              >
                Open in Worklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Drawer */}
      <AssignmentDrawer
        isOpen={assignmentDrawerOpen}
        onClose={() => {
          setAssignmentDrawerOpen(false);
          setAssignmentCaseData(null);
        }}
        caseData={assignmentCaseData}
        onAssignmentSuccess={handleAssignmentSuccess}
      />
    </div>
  );
}
