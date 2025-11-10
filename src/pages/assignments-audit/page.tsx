import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, FileText, User, Calendar, Clock } from 'lucide-react';

interface AuditRecord {
  changed_at: string;
  report_id: string;
  old_radiologist_id: string | null;
  new_radiologist_id: string | null;
  changed_by: string;
}

export default function AssignmentsAudit() {
  const [loading, setLoading] = useState(true);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('radiologist_assignment_audit')
        .select('*')
        .order('changed_at', { ascending: false });

      if (error) throw error;

      setAuditRecords(data || []);
      console.log('✅ Audit data loaded:', data?.slice(0, 3));
    } catch (err: any) {
      console.error('Error fetching audit data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  // Filter audit records based on search
  const filteredRecords = auditRecords.filter(record => {
    const reportId = record.report_id || '';
    const changedBy = record.changed_by || '';
    const oldRadiologist = record.old_radiologist_id || '';
    const newRadiologist = record.new_radiologist_id || '';
    
    return reportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
           changedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
           oldRadiologist.toLowerCase().includes(searchTerm.toLowerCase()) ||
           newRadiologist.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error loading audit data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignments Audit</h1>
        <p className="text-gray-600">Track radiologist assignment changes</p>
      </div>

      {/* Search Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Report ID, Changed By, or Radiologist ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing {filteredRecords.length} of {auditRecords.length} audit records
        </p>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#E8F0FE]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  Changed At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  Report ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  Old Radiologist ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  New Radiologist ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  Changed By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(record.changed_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(record.changed_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {record.report_id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {record.old_radiologist_id || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {record.new_radiologist_id || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {record.changed_by}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No audit records found matching your criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}