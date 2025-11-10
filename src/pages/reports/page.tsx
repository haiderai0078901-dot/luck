import { useState, useEffect } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { Search, FileText, User, Calendar, Eye, X, Download, Share2, Printer, ChevronDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export default function Reports() {
  const { loading, error, reports, staff, refreshData } = useSupabaseData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPrintDropdown, setShowPrintDropdown] = useState(false);
  
  // Demo user system - only "admin" user can edit
  const [currentUser, setCurrentUser] = useState('viewer'); // Default to viewer
  const isEditable = currentUser === 'admin';

  const patientRef = searchParams.get('patient_ref');

  // Add debugging console log
  console.log('Reports rows (from v_reports):', reports.slice(0,3));

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle user switch for demo
  const handleUserSwitch = (user: string) => {
    setCurrentUser(user);
    showToast(`Switched to ${user} mode`, 'success');
  };

  // Handle radiologist assignment change
  const handleRadiologistChange = async (reportId: string, staffId: string) => {
    if (!isEditable) return;
    
    try {
      // Call the Supabase RPC function
      const { error } = await supabase.rpc('assign_radiologist', {
        p_report_id: reportId,
        p_radiologist_id: staffId || null
      });

      if (error) {
        console.error('Error assigning radiologist:', error);
        showToast('Failed to assign radiologist', 'error');
        return;
      }

      // Refresh the data to show updated radiologist_name
      await refreshData();
      showToast('Radiologist assignment updated', 'success');
    } catch (err) {
      console.error('Error assigning radiologist:', err);
      showToast('Failed to assign radiologist', 'error');
    }
  };

  // Handle close report
  const handleCloseReport = async (reportId: string) => {
    if (!isEditable) return;
    
    try {
      // Call the Supabase RPC function
      const { error } = await supabase.rpc('close_report', {
        p_report_id: reportId
      });

      if (error) {
        console.error('Error closing report:', error);
        showToast('Failed to close report', 'error');
        return;
      }

      // Refresh the data to show updated status/closed_at
      await refreshData();
      showToast('Report closed successfully', 'success');
    } catch (err) {
      console.error('Error closing report:', err);
      showToast('Failed to close report', 'error');
    }
  };

  // Handle reopen report
  const handleReopenReport = async (reportId: string) => {
    if (!isEditable) return;
    
    try {
      // Call the Supabase RPC function
      const { error } = await supabase.rpc('reopen_report', {
        p_report_id: reportId
      });

      if (error) {
        console.error('Error reopening report:', error);
        showToast('Failed to reopen report', 'error');
        return;
      }

      // Refresh the data to show updated status
      await refreshData();
      showToast('Report reopened successfully', 'success');
    } catch (err) {
      console.error('Error reopening report:', err);
      showToast('Failed to reopen report', 'error');
    }
  };

  // Get display name for staff member
  const getStaffDisplayName = (staffMember: any) => {
    return staffMember.display_name || staffMember.staff_name || staffMember.email || 'Unknown';
  };

  // Filter reports based on search and patient_ref
  const filteredReports = reports.filter(report => {
    const reportId = report.report_id || '';
    const patientId = report.patient_id || '';
    const scanType = report.scan_type || '';
    const radiologist = report.radiologist || '';
    
    const matchesSearch = reportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
           patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
           scanType.toLowerCase().includes(searchTerm.toLowerCase()) ||
           radiologist.toLowerCase().includes(searchTerm.toLowerCase());

    // Apply patient_ref filter if present
    const matchesPatientRef = patientRef ? (report.patient_ref === patientRef || report.patient_id === patientRef) : true;
    
    return matchesSearch && matchesPatientRef;
  });

  // Export CSV function
  const exportToCSV = () => {
    const headers = [
      'Report ID',
      'Patient ID', 
      'Scan Type',
      'Radiologist',
      'Date'
    ];

    const csvData = filteredReports.map(report => [
      report.report_id,
      report.patient_id || report.patient_ref,
      report.scan_type,
      report.radiologist,
      new Date(report.date || report.reported_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'reports.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print function - Updated to generate PDF download
  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Reports${patientRef ? ` - Patient ${patientRef}` : ''}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #005EB8; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #E8F0FE; color: #005EB8; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .print-date { color: #666; font-size: 14px; margin-bottom: 20px; }
            .search-info { color: #666; font-size: 14px; margin-bottom: 10px; font-style: italic; }
            .report-details { margin-top: 30px; page-break-before: always; }
            .report-card { border: 1px solid #ddd; margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; }
            .report-header { background-color: #005EB8; color: white; padding: 10px; margin: -15px -15px 15px -15px; font-weight: bold; }
            .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
            .detail-item { margin-bottom: 10px; }
            .detail-label { font-weight: bold; color: #005EB8; margin-bottom: 5px; }
            .detail-value { color: #333; }
            .notes-section { margin-top: 15px; }
            .notes-content { background-color: #f5f5f5; padding: 10px; border-radius: 5px; white-space: pre-wrap; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              .report-card { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>Reports${patientRef ? ` - Patient ${patientRef}` : ''}</h1>
          <div class="print-date">Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          ${searchTerm ? `<div class="search-info">Filtered by: "${searchTerm}"</div>` : ''}
          <div>Total reports: ${filteredReports.length}</div>
          
          <!-- Summary Table -->
          <table>
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Patient ID</th>
                <th>Scan Type</th>
                <th>Radiologist</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredReports.map(report => `
                <tr>
                  <td>${report.report_id}</td>
                  <td>${report.patient_id || report.patient_ref}</td>
                  <td>${report.scan_type}</td>
                  <td>${report.radiologist}</td>
                  <td>${new Date(report.date || report.reported_at).toLocaleDateString()}</td>
                  <td>${report.status || 'Active'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Detailed Report Information -->
          <div class="report-details">
            <h2 style="color: #005EB8; margin-bottom: 20px;">Detailed Report Information</h2>
            ${filteredReports.map(report => `
              <div class="report-card">
                <div class="report-header">
                  Report ID: ${report.report_id} - ${report.scan_type}
                </div>
                
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-label">Report ID</div>
                    <div class="detail-value">${report.report_id}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Patient ID</div>
                    <div class="detail-value">${report.patient_id || report.patient_ref}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Scan Type</div>
                    <div class="detail-value">${report.scan_type}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Radiologist</div>
                    <div class="detail-value">${report.radiologist}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${new Date(report.date || report.reported_at).toLocaleDateString()}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">${report.status || 'Active'}</div>
                  </div>
                </div>

                ${report.notes || report.summary ? `
                  <div class="notes-section">
                    <div class="detail-label">Notes</div>
                    <div class="notes-content">${report.notes || report.summary || 'No notes available'}</div>
                  </div>
                ` : ''}

                ${(report.findings || report.summary) && report.findings !== report.notes ? `
                  <div class="notes-section">
                    <div class="detail-label">Findings</div>
                    <div class="notes-content">${report.findings || report.summary}</div>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;

    // Create a temporary iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      try {
        iframe.contentWindow?.print();
        // Clean up after a delay
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      } catch (error) {
        console.error('Print error:', error);
        // Fallback: open in new window
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(printContent);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }
        document.body.removeChild(iframe);
      }
    };
    
    iframe.src = 'data:text/html;charset=utf-8,' + encodeURIComponent(printContent);
  };

  // Download PDF function
  const handleDownloadPDF = () => {
    const printContent = `
      <html>
        <head>
          <title>Reports${patientRef ? ` - Patient ${patientRef}` : ''}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #005EB8; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #E8F0FE; color: #005EB8; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .print-date { color: #666; font-size: 14px; margin-bottom: 20px; }
            .search-info { color: #666; font-size: 14px; margin-bottom: 10px; font-style: italic; }
            .report-details { margin-top: 30px; page-break-before: always; }
            .report-card { border: 1px solid #ddd; margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; }
            .report-header { background-color: #005EB8; color: white; padding: 10px; margin: -15px -15px 15px -15px; font-weight: bold; }
            .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
            .detail-item { margin-bottom: 10px; }
            .detail-label { font-weight: bold; color: #005EB8; margin-bottom: 5px; }
            .detail-value { color: #333; }
            .notes-section { margin-top: 15px; }
            .notes-content { background-color: #f5f5f5; padding: 10px; border-radius: 5px; white-space: pre-wrap; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              .report-card { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>Reports${patientRef ? ` - Patient ${patientRef}` : ''}</h1>
          <div class="print-date">Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          ${searchTerm ? `<div class="search-info">Filtered by: "${searchTerm}"</div>` : ''}
          <div>Total reports: ${filteredReports.length}</div>
          
          <!-- Summary Table -->
          <table>
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Patient ID</th>
                <th>Scan Type</th>
                <th>Radiologist</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredReports.map(report => `
                <tr>
                  <td>${report.report_id}</td>
                  <td>${report.patient_id || report.patient_ref}</td>
                  <td>${report.scan_type}</td>
                  <td>${report.radiologist}</td>
                  <td>${new Date(report.date || report.reported_at).toLocaleDateString()}</td>
                  <td>${report.status || 'Active'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Detailed Report Information -->
          <div class="report-details">
            <h2 style="color: #005EB8; margin-bottom: 20px;">Detailed Report Information</h2>
            ${filteredReports.map(report => `
              <div class="report-card">
                <div class="report-header">
                  Report ID: ${report.report_id} - ${report.scan_type}
                </div>
                
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-label">Report ID</div>
                    <div class="detail-value">${report.report_id}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Patient ID</div>
                    <div class="detail-value">${report.patient_id || report.patient_ref}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Scan Type</div>
                    <div class="detail-value">${report.scan_type}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Radiologist</div>
                    <div class="detail-value">${report.radiologist}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${new Date(report.date || report.reported_at).toLocaleDateString()}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">${report.status || 'Active'}</div>
                  </div>
                </div>

                ${report.notes || report.summary ? `
                  <div class="notes-section">
                    <div class="detail-label">Notes</div>
                    <div class="notes-content">${report.notes || report.summary || 'No notes available'}</div>
                  </div>
                ` : ''}

                ${(report.findings || report.summary) && report.findings !== report.notes ? `
                  <div class="notes-section">
                    <div class="detail-label">Findings</div>
                    <div class="notes-content">${report.findings || report.summary}</div>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;

    // Create a blob with the HTML content for download
    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reports${patientRef ? `-patient-${patientRef}` : ''}-${new Date().toISOString().split('T')[0]}.html`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Share link function
  const handleShareLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      showToast('Link copied', 'success');
    }).catch(() => {
      showToast('Failed to copy link', 'error');
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white font-medium ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Demo User Switcher */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Demo Mode</h3>
            <p className="text-sm text-yellow-700">Current user: <strong>{currentUser}</strong> {isEditable ? '(Can edit)' : '(Read-only)'}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleUserSwitch('admin')}
              className={`px-3 py-1 text-xs rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                currentUser === 'admin' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-white text-yellow-800 border border-yellow-300 hover:bg-yellow-100'
              }`}
            >
              Admin User
            </button>
            <button
              onClick={() => handleUserSwitch('viewer')}
              className={`px-3 py-1 text-xs rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                currentUser === 'viewer' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-white text-yellow-800 border border-yellow-300 hover:bg-yellow-100'
              }`}
            >
              Viewer User
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports{patientRef ? ` - Patient ${patientRef}` : ''}</h1>
        <p className="text-gray-600">View and manage radiology reports</p>
      </div>

      {/* Search Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Report ID, Patient ID, Scan Type, or Radiologist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing {filteredReports.length} of {reports.length} reports
        </p>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={() => setShowPrintDropdown(!showPrintDropdown)}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Print/Download</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showPrintDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <button
                  onClick={() => {
                    handlePrint();
                    setShowPrintDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => {
                    handleDownloadPDF();
                    setShowPrintDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleShareLink}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Link</span>
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#E8F0FE]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  Report ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  Patient ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  Scan Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  Radiologist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.report_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {report.report_id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {report.patient_id || report.patient_ref}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {report.scan_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditable ? (
                      <div className="relative">
                        <select
                          value={report.radiologist_id || ''}
                          onChange={(e) => handleRadiologistChange(report.report_id, e.target.value)}
                          className="text-sm text-gray-900 border border-gray-300 rounded-md px-2 py-1 pr-8 focus:ring-2 focus:ring-[#005EB8] focus:border-transparent cursor-pointer appearance-none"
                        >
                          <option value="">Unassigned</option>
                          {staff.map((staffMember) => (
                            <option key={staffMember.staff_id} value={staffMember.staff_id}>
                              {getStaffDisplayName(staffMember)}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <i className="ri-arrow-down-s-line text-gray-400"></i>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-900">
                        {report.radiologist_name || 'Unassigned'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {new Date(report.date || report.reported_at).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="inline-flex items-center px-3 py-1 border border-[#005EB8] text-[#005EB8] text-sm rounded-md hover:bg-[#005EB8] hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </button>
                      {isEditable && (
                        report.status === 'closed' ? (
                          <button
                            onClick={() => handleReopenReport(report.report_id)}
                            className="inline-flex items-center px-3 py-1 border border-green-600 text-green-600 text-sm rounded-md hover:bg-green-600 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                          >
                            Reopen
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCloseReport(report.report_id)}
                            className="inline-flex items-center px-3 py-1 border border-red-600 text-red-600 text-sm rounded-md hover:bg-red-600 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                          >
                            Close
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {patientRef ? 'No reports for this patient yet.' : 'No reports found matching your criteria'}
            </p>
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Report Details</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Report Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Report ID
                    </label>
                    <p className="text-sm text-gray-900">{selectedReport.report_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Patient ID
                    </label>
                    <p className="text-sm text-gray-900">{selectedReport.patient_id || selectedReport.patient_ref}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scan Type
                    </label>
                    <p className="text-sm text-gray-900">{selectedReport.scan_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Radiologist
                    </label>
                    <p className="text-sm text-gray-900">{selectedReport.radiologist}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedReport.date || selectedReport.reported_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedReport.notes || selectedReport.summary || 'No notes available'}
                    </p>
                  </div>
                </div>

                {/* Findings Section */}
                {(selectedReport.findings || selectedReport.summary) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Findings
                    </label>
                    <div className="bg-gray-50 rounded-md p-4">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {selectedReport.findings || selectedReport.summary}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 bg-[#005EB8] text-white rounded-md hover:bg-[#004494] transition-colors whitespace-nowrap cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
