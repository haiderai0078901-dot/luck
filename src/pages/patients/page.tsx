
import { useState, useEffect } from 'react';
import { Search, Filter, User, Calendar, FileText, Phone, Mail, MapPin, X, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface PatientSummary {
  patient_id: string;
  nhs_number: string;
  first_name: string;
  last_name: string;
  dob: string;
  sex: string;
  gp_practice: string;
  allergies_count: number;
  medications_count: number;
  conditions_count: number;
}

interface Allergy {
  id: string;
  patient_id: string;
  allergy_name: string;
  severity: string;
}

interface Medication {
  id: string;
  patient_id: string;
  drug_name: string;
  dose: string;
  frequency: string;
  active: boolean;
}

interface Condition {
  id: string;
  patient_id: string;
  condition_name: string;
  status: string;
}

interface Report {
  report_id: string;
  scan_type: string;
  radiologist: string;
  reported_at: string;
}

interface FollowUp {
  followup_id: string;
  action_required: string;
  status: string;
  due_date: string;
  assigned_to: string;
}

interface NewPatientForm {
  nhs_number: string;
  first_name: string;
  last_name: string;
  dob: string;
  sex: string;
  gp_practice: string;
}

interface NewAllergyForm {
  allergen: string;
  severity: string;
  notes: string;
}

interface NewMedicationForm {
  drug_name: string;
  dose: string;
  frequency: string;
  notes: string;
}

interface NewConditionForm {
  diagnosis: string;
  status: string;
  notes: string;
}

export default function Patients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'allergies' | 'medications' | 'conditions'>('allergies');
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState<NewPatientForm>({
    nhs_number: '',
    first_name: '',
    last_name: '',
    dob: '',
    sex: '',
    gp_practice: ''
  });
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    count: number | null;
    error: string | null;
  }>({ connected: false, count: null, error: null });

  // New modals state
  const [isNewAllergyModalOpen, setIsNewAllergyModalOpen] = useState(false);
  const [isNewMedicationModalOpen, setIsNewMedicationModalOpen] = useState(false);
  const [isNewConditionModalOpen, setIsNewConditionModalOpen] = useState(false);
  const [newAllergyForm, setNewAllergyForm] = useState<NewAllergyForm>({
    allergen: '',
    severity: '',
    notes: ''
  });
  const [newMedicationForm, setNewMedicationForm] = useState<NewMedicationForm>({
    drug_name: '',
    dose: '',
    frequency: '',
    notes: ''
  });
  const [newConditionForm, setNewConditionForm] = useState<NewConditionForm>({
    diagnosis: '',
    status: '',
    notes: ''
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Additional state for reports & follow‑ups
  const [reports, setReports] = useState<Report[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const [followUpsExpanded, setFollowUpsExpanded] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);

  // Check Supabase connection on component mount
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const { count, error } = await supabase
          .from('v_patient_ehr_summary')
          .select('*', { count: 'exact', head: true });

        if (error) {
          setSupabaseStatus({
            connected: false,
            count: null,
            error: error.message
          });
        } else {
          setSupabaseStatus({
            connected: true,
            count: count || 0,
            error: null
          });
        }
      } catch (err) {
        setSupabaseStatus({
          connected: false,
          count: null,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    };

    checkSupabaseConnection();
  }, []);

  // Fetch patient data from Supabase
  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('v_patient_ehr_summary')
        .select('patient_id, nhs_number, first_name, last_name, dob, sex, gp_practice, allergies_count, medications_count, conditions_count')
        .order('last_name', { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setPatients(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch patient-specific data for drawer tabs
  const fetchPatientData = async (patientId: string, tab: 'allergies' | 'medications' | 'conditions') => {
    try {
      setTabLoading(true);
      
      if (tab === 'allergies') {
        const { data, error } = await supabase
          .from('allergies')
          .select('id, patient_id, allergy_name, severity')
          .eq('patient_id', patientId);
        
        if (error) throw error;
        setAllergies(data || []);
      } else if (tab === 'medications') {
        const { data, error } = await supabase
          .from('medications')
          .select('id, patient_id, drug_name, dose, frequency, active')
          .eq('patient_id', patientId);
        
        if (error) throw error;
        setMedications(data || []);
      } else if (tab === 'conditions') {
        const { data, error } = await supabase
          .from('conditions')
          .select('id, patient_id, condition_name, status')
          .eq('patient_id', patientId);
        
        if (error) throw error;
        setConditions(data || []);
      }
    } catch (err) {
      console.error(`Error fetching ${tab}:`, err);
    } finally {
      setTabLoading(false);
    }
  };

  // Fetch recent reports
  const fetchRecentReports = async (patientId: string) => {
    try {
      setReportsLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('report_id, scan_type, radiologist, reported_at')
        .eq('patient_ref', patientId)
        .order('reported_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  // Fetch recent follow‑ups
  const fetchRecentFollowUps = async (patientId: string) => {
    try {
      setFollowUpsLoading(true);
      const { data, error } = await supabase
        .from('followups')
        .select('followup_id, action_required, status, due_date, assigned_to')
        .eq('patient_ref', patientId)
        .order('due_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setFollowUps(data || []);
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
    } finally {
      setFollowUpsLoading(false);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Filter patients based on search term (NHS number or last name)
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.nhs_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handlePatientClick = (patient: PatientSummary) => {
    setSelectedPatient(patient);
    setIsDrawerOpen(true);
    setActiveTab('allergies');
    setReportsExpanded(false);
    setFollowUpsExpanded(false);
    fetchPatientData(patient.patient_id, 'allergies');
    fetchRecentReports(patient.patient_id);
    fetchRecentFollowUps(patient.patient_id);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedPatient(null);
    setAllergies([]);
    setMedications([]);
    setConditions([]);
    setReports([]);
    setFollowUps([]);
    setReportsExpanded(false);
    setFollowUpsExpanded(false);
  };

  const handleTabChange = (tab: 'allergies' | 'medications' | 'conditions') => {
    setActiveTab(tab);
    if (selectedPatient) {
      fetchPatientData(selectedPatient.patient_id, tab);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe': return 'bg-red-100 text-red-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'mild': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'resolved': return 'bg-blue-100 text-blue-800';
      case 'chronic': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleNewPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('patients')
        .insert([{
          nhs_number: newPatientForm.nhs_number,
          first_name: newPatientForm.first_name,
          last_name: newPatientForm.last_name,
          dob: newPatientForm.dob,
          sex: newPatientForm.sex,
          gp_practice: newPatientForm.gp_practice
        }]);

      if (error) {
        throw error;
      }

      // Reset form and close modal
      setNewPatientForm({
        nhs_number: '',
        first_name: '',
        last_name: '',
        dob: '',
        sex: '',
        gp_practice: ''
      });
      setIsNewPatientModalOpen(false);
      
      // Refresh the patient list
      await fetchPatients();
    } catch (err) {
      console.error('Error creating patient:', err);
      alert('Failed to create patient. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = (field: keyof NewPatientForm, value: string) => {
    setNewPatientForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Export CSV function
  const exportToCSV = () => {
    const headers = [
      'Patient ID',
      'NHS Number', 
      'First Name',
      'Last Name',
      'Date of Birth',
      'Sex',
      'GP Practice',
      'Allergies',
      'Medications',
      'Conditions'
    ];

    const csvData = filteredPatients.map(patient => [
      patient.patient_id,
      patient.nhs_number,
      patient.first_name,
      patient.last_name,
      new Date(patient.dob).toLocaleDateString(),
      patient.sex,
      patient.gp_practice,
      patient.allergies_count,
      patient.medications_count,
      patient.conditions_count
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'patients.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print function
  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Patients Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #005EB8; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #E8F0FE; color: #005EB8; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .print-date { color: #666; font-size: 14px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Patients (EHR) Report</h1>
          <div class="print-date">Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          <div>Total patients: ${filteredPatients.length}</div>
          <table>
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>NHS Number</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Date of Birth</th>
                <th>Sex</th>
                <th>GP Practice</th>
                <th>Allergies</th>
                <th>Medications</th>
                <th>Conditions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPatients.map(patient => `
                <tr>
                  <td>${patient.patient_id}</td>
                  <td>${patient.nhs_number}</td>
                  <td>${patient.first_name}</td>
                  <td>${patient.last_name}</td>
                  <td>${new Date(patient.dob).toLocaleDateString()}</td>
                  <td>${patient.sex}</td>
                  <td>${patient.gp_practice}</td>
                  <td>${patient.allergies_count}</td>
                  <td>${patient.medications_count}</td>
                  <td>${patient.conditions_count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  // Handle new allergy submission
  const handleNewAllergySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('allergies')
        .insert([{
          patient_ref: selectedPatient.patient_id,
          allergen: newAllergyForm.allergen,
          severity: newAllergyForm.severity,
          notes: newAllergyForm.notes,
          recorded_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Reset form and close modal
      setNewAllergyForm({ allergen: '', severity: '', notes: '' });
      setIsNewAllergyModalOpen(false);
      
      // Refresh data
      await Promise.all([
        fetchPatients(),
        fetchPatientData(selectedPatient.patient_id, 'allergies')
      ]);
      
      showToast('Saved ✓', 'success');
    } catch (err) {
      console.error('Error creating allergy:', err);
      showToast('Save failed — please try again', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle new medication submission
  const handleNewMedicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('medications')
        .insert([{
          patient_ref: selectedPatient.patient_id,
          drug_name: newMedicationForm.drug_name,
          dose: newMedicationForm.dose,
          frequency: newMedicationForm.frequency,
          notes: newMedicationForm.notes,
          recorded_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Reset form and close modal
      setNewMedicationForm({ drug_name: '', dose: '', frequency: '', notes: '' });
      setIsNewMedicationModalOpen(false);
      
      // Refresh data
      await Promise.all([
        fetchPatients(),
        fetchPatientData(selectedPatient.patient_id, 'medications')
      ]);
      
      showToast('Saved ✓', 'success');
    } catch (err) {
      console.error('Error creating medication:', err);
      showToast('Save failed — please try again', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle new condition submission
  const handleNewConditionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('conditions')
        .insert([{
          patient_ref: selectedPatient.patient_id,
          diagnosis: newConditionForm.diagnosis,
          status: newConditionForm.status,
          notes: newConditionForm.notes,
          recorded_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Reset form and close modal
      setNewConditionForm({ diagnosis: '', status: '', notes: '' });
      setIsNewConditionModalOpen(false);
      
      // Refresh data
      await Promise.all([
        fetchPatients(),
        fetchPatientData(selectedPatient.patient_id, 'conditions')
      ]);
      
      showToast('Saved ✓', 'success');
    } catch (err) {
      console.error('Error creating condition:', err);
      showToast('Save failed — please try again', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewFullRecord = () => {
    if (selectedPatient) {
      navigate(`/reports?patient_ref=${selectedPatient.patient_id}`);
    }
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

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Patients (EHR)</h1>
          <button
            onClick={() => setIsNewPatientModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#005EB8] text-white rounded-md hover:bg-[#004494] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New Patient</span>
          </button>
        </div>
        <p className="text-gray-600">Electronic Health Records - Patient information and medical history</p>
        
        {/* Supabase Connection Status */}
        <div className="mt-3">
          {supabaseStatus.connected ? (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✅ Connected to Supabase · {supabaseStatus.count} patients found
            </div>
          ) : (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              ⚠️ Supabase error: {supabaseStatus.error}
            </div>
          )}
        </div>

        {/* Loading and Error Messages */}
        {loading && (
          <div className="mt-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Loading patient data...
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Error: {error}
            </div>
          </div>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by NHS Number or Last Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing {filteredPatients.length} of {patients.length} patients
        </p>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-download-line w-4 h-4"></i>
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-printer-line w-4 h-4"></i>
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#E8F0FE]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  Patient ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  NHS Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  First Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  Last Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  Date of Birth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  Sex
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  GP Practice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  Allergies
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  Medications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#005EB8] uppercase tracking-wider">
                  Conditions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr 
                  key={patient.patient_id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handlePatientClick(patient)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {patient.patient_id}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-gray-900">
                      {patient.nhs_number}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {patient.first_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {patient.last_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">
                        {new Date(patient.dob).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Age: {calculateAge(patient.dob)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {patient.sex}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {patient.gp_practice}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {patient.allergies_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {patient.medications_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {patient.conditions_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPatients.length === 0 && !loading && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {patients.length === 0 ? 'No patients found in database' : 'No patients found matching your search criteria'}
            </p>
          </div>
        )}
      </div>

      {/* Patient Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <User className="w-8 h-8 text-[#005EB8] mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
              <p className="text-sm text-gray-600">Total Patients</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-orange-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {patients.reduce((sum, p) => sum + p.medications_count, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Medications</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {patients.reduce((sum, p) => sum + p.conditions_count, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Conditions</p>
            </div>
          </div>
        </div>
      </div>

      {/* New Patient Modal */}
      {isNewPatientModalOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsNewPatientModalOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">New Patient</h2>
                  <button
                    onClick={() => setIsNewPatientModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleNewPatientSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NHS Number
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatientForm.nhs_number}
                      onChange={(e) => handleFormChange('nhs_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm"
                      placeholder="e.g., 123 456 7890"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newPatientForm.first_name}
                        onChange={(e) => handleFormChange('first_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newPatientForm.last_name}
                        onChange={(e) => handleFormChange('last_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        required
                        value={newPatientForm.dob}
                        onChange={(e) => handleFormChange('dob', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsNewPatientModalOpen(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-[#005EB8] text-white rounded-md hover:bg-[#004494] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Patient'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Patient Summary Drawer */}
      {isDrawerOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeDrawer}
          />
          
          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Patient Summary</h2>
                <button
                  onClick={closeDrawer}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {selectedPatient && (
                <div className="space-y-6">
                  {/* Patient Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">NHS Number</label>
                      <p className="text-lg font-mono text-gray-900">{selectedPatient.nhs_number}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-lg text-gray-900">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Date of Birth & Age</label>
                      <p className="text-lg text-gray-900">
                        {new Date(selectedPatient.dob).toLocaleDateString()} 
                        <span className="text-gray-600 ml-2">(Age: {calculateAge(selectedPatient.dob)})</span>
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Sex</label>
                      <p className="text-lg text-gray-900">{selectedPatient.sex}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">GP Practice</label>
                      <p className="text-lg text-gray-900">{selectedPatient.gp_practice}</p>
                    </div>
                  </div>

                  {/* Recent Reports Section */}
                  <div className="border-t pt-4">
                    <button
                      onClick={() => setReportsExpanded(!reportsExpanded)}
                      className="flex items-center justify-between w-full text-left mb-2 hover:bg-gray-50 p-2 rounded-md transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-medium text-gray-700">Recent Reports</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{reports.length} reports</span>
                        {reportsExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>
                    
                    {reportsExpanded && (
                      <div className="space-y-2 ml-2">
                        {reportsLoading ? (
                          <div className="text-center py-2">
                            <div className="text-xs text-gray-500">Loading reports...</div>
                          </div>
                        ) : reports.length === 0 ? (
                          <p className="text-xs text-gray-500 py-2">No reports found</p>
                        ) : (
                          reports.map((report) => (
                            <div key={report.report_id} className="p-2 bg-gray-50 rounded-md">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-900">{report.scan_type}</span>
                                <span className="text-xs text-gray-500">{formatRelativeTime(report.reported_at)}</span>
                              </div>
                              <div className="text-xs text-gray-600">
                                <span>ID: {report.report_id}</span>
                                {report.radiologist && (
                                  <span className="ml-2">• {report.radiologist}</span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Recent Follow-ups Section */}
                  <div className="border-t pt-4">
                    <button
                      onClick={() => setFollowUpsExpanded(!followUpsExpanded)}
                      className="flex items-center justify-between w-full text-left mb-2 hover:bg-gray-50 p-2 rounded-md transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-medium text-gray-700">Recent Follow-ups</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{followUps.length} follow-ups</span>
                        {followUpsExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>
                    
                    {followUpsExpanded && (
                      <div className="space-y-2 ml-2">
                        {followUpsLoading ? (
                          <div className="text-center py-2">
                            <div className="text-xs text-gray-500">Loading follow-ups...</div>
                          </div>
                        ) : followUps.length === 0 ? (
                          <p className="text-xs text-gray-500 py-2">No follow-ups found</p>
                        ) : (
                          followUps.map((followUp) => (
                            <div key={followUp.followup_id} className="p-2 bg-gray-50 rounded-md">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-900">{followUp.action_required}</span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(followUp.status)}`}>
                                  {followUp.status}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600">
                                <span>ID: {followUp.followup_id}</span>
                                <span className="ml-2">• Due: {formatRelativeTime(followUp.due_date)}</span>
                                {followUp.assigned_to && (
                                  <span className="ml-2">• {followUp.assigned_to}</span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Actions</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsNewAllergyModalOpen(true)}
                        className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Allergy</span>
                      </button>
                      <button
                        onClick={() => setIsNewMedicationModalOpen(true)}
                        className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Medication</span>
                      </button>
                      <button
                        onClick={() => setIsNewConditionModalOpen(true)}
                        className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Condition</span>
                      </button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="border-t pt-6">
                    <div className="flex space-x-1 mb-4">
                      <button
                        onClick={() => handleTabChange('allergies')}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                          activeTab === 'allergies'
                            ? 'bg-[#005EB8] text-white'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        Allergies ({selectedPatient.allergies_count})
                      </button>
                      <button
                        onClick={() => handleTabChange('medications')}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                          activeTab === 'medications'
                            ? 'bg-[#005EB8] text-white'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        Medications ({selectedPatient.medications_count})
                      </button>
                      <button
                        onClick={() => handleTabChange('conditions')}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                          activeTab === 'conditions'
                            ? 'bg-[#005EB8] text-white'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        Conditions ({selectedPatient.conditions_count})
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-3">
                      {tabLoading ? (
                        <div className="text-center py-4">
                          <div className="text-sm text-gray-500">Loading...</div>
                        </div>
                      ) : (
                        <>
                          {activeTab === 'allergies' && (
                            <div className="space-y-2">
                              {allergies.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No allergies recorded</p>
                              ) : (
                                allergies.map((allergy) => (
                                  <div key={allergy.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-900">{allergy.allergy_name}</span>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(allergy.severity)}`}>
                                      {allergy.severity}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {activeTab === 'medications' && (
                            <div className="space-y-2">
                              {medications.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No medications recorded</p>
                              ) : (
                                medications.map((medication) => (
                                  <div key={medication.id} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-gray-900">{medication.drug_name}</span>
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        medication.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {medication.active ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      <span>{medication.dose}</span> · <span>{medication.frequency}</span>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {activeTab === 'conditions' && (
                            <div className="space-y-2">
                              {conditions.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No conditions recorded</p>
                              ) : (
                                conditions.map((condition) => (
                                  <div key={condition.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-900">{condition.condition_name}</span>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(condition.status)}`}>
                                      {condition.status}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="border-t pt-6">
                    <button 
                      onClick={handleViewFullRecord}
                      className="w-full bg-[#005EB8] text-white py-3 px-4 rounded-md hover:bg-[#004494] transition-colors font-medium cursor-pointer whitespace-nowrap"
                    >
                      View Full Record
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* New Allergy Modal */}
      {isNewAllergyModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsNewAllergyModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Add Allergy</h3>
                  <button
                    onClick={() => setIsNewAllergyModalOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleNewAllergySubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergen</label>
                    <input
                      type="text"
                      required
                      value={newAllergyForm.allergen}
                      onChange={(e) => setNewAllergyForm(prev => ({ ...prev, allergen: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm"
                      placeholder="e.g., Penicillin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                    <div className="relative">
                      <select
                        required
                        value={newAllergyForm.severity}
                        onChange={(e) => setNewAllergyForm(prev => ({ ...prev, severity: e.target.value }))}
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm appearance-none"
                      >
                        <option value="">Select severity</option>
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Severe">Severe</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={newAllergyForm.notes}
                      onChange={(e) => setNewAllergyForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm"
                      rows={2}
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsNewAllergyModalOpen(false)}
                      className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-3 py-1.5 text-sm bg-[#005EB8] text-white rounded-md hover:bg-[#004494] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* New Medication Modal */}
      {isNewMedicationModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsNewMedicationModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Add Medication</h3>
                  <button
                    onClick={() => setIsNewMedicationModalOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleNewMedicationSubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Drug Name</label>
                    <input
                      type="text"
                      required
                      value={newMedicationForm.drug_name}
                      onChange={(e) => setNewMedicationForm(prev => ({ ...prev, drug_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm"
                      placeholder="e.g., Aspirin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dose</label>
                    <input
                      type="text"
                      required
                      value={newMedicationForm.dose}
                      onChange={(e) => setNewMedicationForm(prev => ({ ...prev, dose: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm"
                      placeholder="e.g., 75mg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <input
                      type="text"
                      required
                      value={newMedicationForm.frequency}
                      onChange={(e) => setNewMedicationForm(prev => ({ ...prev, frequency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm"
                      placeholder="e.g., Once daily"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={newMedicationForm.notes}
                      onChange={(e) => setNewMedicationForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm"
                      rows={2}
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsNewMedicationModalOpen(false)}
                      className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-3 py-1.5 text-sm bg-[#005EB8] text-white rounded-md hover:bg-[#004494] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* New Condition Modal */}
      {isNewConditionModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsNewConditionModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Add Condition</h3>
                  <button
                    onClick={() => setIsNewConditionModalOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleNewConditionSubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                    <input
                      type="text"
                      required
                      value={newConditionForm.diagnosis}
                      onChange={(e) => setNewConditionForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm"
                      placeholder="e.g., Hypertension"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="relative">
                      <select
                        required
                        value={newConditionForm.status}
                        onChange={(e) => setNewConditionForm(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm appearance-none"
                      >
                        <option value="">Select status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Chronic">Chronic</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={newConditionForm.notes}
                      onChange={(e) => setNewConditionForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#005EB8] focus:border-transparent text-sm"
                      rows={2}
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsNewConditionModalOpen(false)}
                      className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-3 py-1.5 text-sm bg-[#005EB8] text-white rounded-md hover:bg-[#004494] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
