
import { useState, useEffect, useMemo } from 'react';
import { X, Search, Check, History, User } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

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
  localHistory?: AssignmentHistoryRecord[];
}

function AssignmentHistoryModal({
  isOpen,
  onClose,
  followupId,
  staffMembers,
  localHistory = [],
}: AssignmentHistoryModalProps) {
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

  const combinedHistory = [...localHistory, ...history];

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
          ) : combinedHistory.length > 0 ? (
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
                  {combinedHistory.map((record, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {new Date(record.assigned_at).toLocaleString()}
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
  onAssignmentSuccess: (staffId: string, staffName: string, newHistoryEntry?: AssignmentHistoryRecord) => void;
}

export default function AssignmentDrawer({ isOpen, onClose, caseData, onAssignmentSuccess }: AssignmentDrawerProps) {
  const [activeStaff, setActiveStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [localAssignmentHistory, setLocalAssignmentHistory] = useState<AssignmentHistoryRecord[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  // Fetch assignment history when drawer opens
  useEffect(() => {
    if (isOpen && caseData) {
      fetchAssignmentHistory();
    }
  }, [isOpen, caseData]);

  const fetchAssignmentHistory = async () => {
    if (!caseData) return;
    
    setHistoryLoading(true);
    try {
      const followupId = caseData.followup_id || caseData.id;
      const { data, error } = await supabase
        .from('assignments_audit')
        .select('assigned_at, assigned_to, assigned_by')
        .eq('followup_id', followupId)
        .order('assigned_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Failed to fetch assignment history:', error);
        setAssignmentHistory([]);
      } else {
        setAssignmentHistory(data || []);
      }
    } catch (err) {
      console.error('Assignment history fetch error:', err);
      setAssignmentHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getStaffNameFromHistory = (staffId: string) => {
    const staff = activeStaff.find(s => s.staff_id === staffId);
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
        
        // Create new assignment history entry
        const newHistoryEntry: AssignmentHistoryRecord = {
          assigned_at: new Date().toISOString(),
          assigned_to: selectedStaffId,
          assigned_by: 'demo-ui'
        };
        
        // Add to local history state
        setLocalAssignmentHistory(prev => [newHistoryEntry, ...prev]);
        
        // Close drawer and update parent after short delay
        setTimeout(() => {
          onAssignmentSuccess(selectedStaffId, staffName, newHistoryEntry);
          onClose();
          setToast(null);
          
          // Refresh the page to update data source
          window.location.reload();
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

            {/* Assignment History Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Assignment History</label>
              <div className="bg-gray-50 rounded-md p-4 max-h-48 overflow-y-auto">
                {historyLoading ? (
                  <div className="text-sm text-gray-600 text-center py-4">Loading history...</div>
                ) : (assignmentHistory.length > 0 || localAssignmentHistory.length > 0) ? (
                  <div className="space-y-3">
                    {/* Show local history first (most recent) */}
                    {localAssignmentHistory.map((record, index) => (
                      <div key={`local-${index}`} className="text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">
                              {getStaffNameFromHistory(record.assigned_to)}
                            </div>
                            <div className="text-gray-600">by {record.assigned_by}</div>
                          </div>
                          <div className="text-gray-500 text-xs">
                            {formatTimestampUK(record.assigned_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Show database history */}
                    {assignmentHistory.map((record, index) => (
                      <div key={`db-${index}`} className="text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">
                              {getStaffNameFromHistory(record.assigned_to)}
                            </div>
                            <div className="text-gray-600">by {record.assigned_by}</div>
                          </div>
                          <div className="text-gray-500 text-xs">
                            {formatTimestampUK(record.assigned_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 text-center py-4">No previous assignments.</div>
                )}
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
        localHistory={localAssignmentHistory}
      />
    </>
  );
}
