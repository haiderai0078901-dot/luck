
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { submitTicket, TicketForm } from '../../features/help/submitTicket';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledData?: {
    email?: string;
    subject?: string;
  };
}

export default function HelpModal({ isOpen, onClose, prefilledData }: HelpModalProps) {
  const [form, setForm] = useState<TicketForm>({
    name: '',
    email: '',
    description: '',
    priority: 'Medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');

  useEffect(() => {
    if (isOpen) {
      console.log('🆘 Help modal opened');
      
      // Pre-fill form data if provided
      if (prefilledData) {
        setForm(prev => ({
          ...prev,
          email: prefilledData.email || prev.email,
          description: prefilledData.subject ? `Subject: ${prefilledData.subject}\n\n` : prev.description
        }));
      }
    }
  }, [isOpen, prefilledData]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await submitTicket(form);

    if (result.success) {
      setForm({ name: '', email: '', description: '', priority: 'Medium' });
      onClose();
      
      // Check if email was sent successfully
      if (result.emailSent) {
        setToastMessage('✅ Ticket submitted. Confirmation email sent.');
        setToastType('success');
      } else {
        setToastMessage('Ticket submitted, but email failed.');
        setToastType('warning');
      }
      
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } else {
      setError('There was a problem submitting your ticket. Please try again.');
    }

    setIsSubmitting(false);
  };

  const handleInputChange = (field: keyof TicketForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  if (!isOpen && !showToast) return null;

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-md shadow-lg z-[60] text-white ${
          toastType === 'success' ? 'bg-green-500' : 'bg-yellow-500'
        }`}>
          {toastMessage}
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="fixed inset-0" 
            onClick={onClose}
          />
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 relative">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Need Assistance?</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Description *
                </label>
                <textarea
                  required
                  maxLength={500}
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent h-24 resize-none"
                  placeholder="Please describe your issue..."
                />
                <div className="text-xs text-gray-500 mt-1">
                  {form.description.length}/500 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value as 'Low' | 'Medium' | 'High')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent pr-8"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#005EB8] text-white rounded-md hover:bg-[#004494] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
