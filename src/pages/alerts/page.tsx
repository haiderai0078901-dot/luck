
import { useDemoData } from '../../hooks/useDemoData';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { AlertTriangle, Clock, User, Calendar, CheckCircle } from 'lucide-react';

export default function Alerts() {
  const { loading: demoLoading, error: demoError, alerts: demoAlerts, followups: demoFollowups } = useDemoData();
  const { loading: supabaseLoading, error: supabaseError, alerts: supabaseAlerts, followUps: supabaseFollowUps } = useSupabaseData();

  // Use Supabase data if available, fallback to demo data
  const loading = supabaseLoading || demoLoading;
  const error = supabaseError || demoError;
  const alerts = supabaseAlerts?.length ? supabaseAlerts : demoAlerts;
  const followups = supabaseFollowUps?.length ? supabaseFollowUps : demoFollowups;

  console.log("✅ Alerts connected to Supabase data");

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-[#005EB8]">Loading alerts data...</div>
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

  // Get overdue follow-ups for detailed view - fix status matching to align with dashboard
  const overdueFollowups = followups.filter((f: any) => 
    f.status === 'Overdue' || 
    f.status === 'overdue' || 
    f.status === 'overbyed' ||
    f.status === 'pending' && new Date(f.due_date) < new Date()
  );
  const urgentFollowups = followups.filter((f: any) => f.priority === 'High' && (f.status === 'Pending' || f.status === 'pending'));

  // Calculate total alerts automatically
  const totalAlerts = overdueFollowups.length + urgentFollowups.length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'urgent':
        return <Clock className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getAlertBadge = (type: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (type) {
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'urgent':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Alerts</h1>
        <p className="text-gray-600">Monitor overdue follow-ups and urgent cases</p>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-800 text-sm font-medium">Overdue Follow-ups</p>
              <p className="text-red-900 text-3xl font-bold mt-2">{overdueFollowups.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-800 text-sm font-medium">High Priority Pending</p>
              <p className="text-orange-900 text-3xl font-bold mt-2">{urgentFollowups.length}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 text-sm font-medium">Total Alerts</p>
              <p className="text-green-900 text-3xl font-bold mt-2">{totalAlerts}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Overdue Follow-ups */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            Overdue Follow-ups
          </h2>
        </div>
        
        {overdueFollowups.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                    Patient ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                    Scan Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                    Follow-up Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                    Assigned Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                    Days Overdue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overdueFollowups.map((followup: any) => {
                  const scanDate = new Date(followup.scan_date);
                  const today = new Date();
                  const daysOverdue = Math.floor((today.getTime() - scanDate.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <tr key={followup.id} className="hover:bg-red-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {followup.patient_id || followup.patient_ref}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {scanDate.toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {followup.follow_up_action || followup.action_required}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {followup.assigned_staff || followup.assigned_to}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          followup.priority === 'High' ? 'bg-red-100 text-red-800' :
                          followup.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {followup.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-red-600">
                          {daysOverdue} days
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-500">No overdue follow-ups at this time</p>
          </div>
        )}
      </div>

      {/* High Priority Pending Cases */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 text-orange-500 mr-2" />
            High Priority Pending Cases
          </h2>
        </div>
        
        {urgentFollowups.length > 0 ? (
          <div className="p-6 space-y-4">
            {urgentFollowups.map((followup: any) => (
              <div key={followup.id} className="flex items-start space-x-3 p-4 bg-orange-50 rounded-md border border-orange-200">
                <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-orange-800">
                      Patient {followup.patient_id || followup.patient_ref}
                    </p>
                    <span className={getAlertBadge('urgent')}>
                      High Priority
                    </span>
                  </div>
                  <p className="text-sm text-orange-700 mt-1">{followup.follow_up_action || followup.action_required}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-orange-600">
                    <span>Assigned: {followup.assigned_staff || followup.assigned_to}</span>
                    <span>Scan Date: {new Date(followup.scan_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-500">No high priority pending cases</p>
          </div>
        )}
      </div>

      {/* All Alerts List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Active Alerts</h2>
          <p className="text-sm text-gray-600">Overdue Alerts: {alerts?.length || 0}</p>
        </div>
        
        {alerts && alerts.length > 0 ? (
          <div className="p-6 space-y-3">
            {alerts.map((alert: any) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
                {getAlertIcon(alert.type || 'overdue')}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      Patient {alert.patient_id || alert.patient_ref}
                    </p>
                    <span className={getAlertBadge(alert.type || 'overdue')}>
                      {alert.type || 'overdue'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{alert.message || alert.follow_up_action || alert.action_required}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Scan Date: {new Date(alert.date || alert.scan_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-500">No active alerts</p>
          </div>
        )}
      </div>
    </div>
  );
}
