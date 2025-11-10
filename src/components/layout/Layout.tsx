
import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, FileText, AlertTriangle, Database, ChevronDown, Settings, Plug, Code, LogOut, HelpCircle, User } from 'lucide-react';
import HelpModal from '../help/HelpModal';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Worklist', href: '/worklist', icon: Activity },
    { name: 'Patients (EHR)', href: '/patients', icon: User },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
    { name: 'Data Preview', href: '/data-preview', icon: Database }
  ];

  const userMenuItems = [
    { name: 'Settings', icon: Settings },
    { name: 'NHS Connectors', icon: Plug },
    { name: 'API Integrations', icon: Code },
    { name: 'Help', icon: HelpCircle },
    { name: 'Sign Out', icon: LogOut }
  ];

  const handleMenuItemClick = (itemName: string) => {
    setIsUserDropdownOpen(false);
    
    if (itemName === 'Sign Out') {
      navigate('/login');
    } else if (itemName === 'Help') {
      setIsHelpModalOpen(true);
    } else {
      console.log(`Clicked: ${itemName}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="bg-[#005EB8] shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-white">RadAssist AI-NHS</h1>
              <div className="hidden md:flex space-x-6">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-white/80 text-sm">
                NHS Radiology Workflows
              </div>
              
              {/* Help Button */}
              <button
                onClick={() => setIsHelpModalOpen(true)}
                className="flex items-center justify-center w-8 h-8 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                title="Need Help?"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              
              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium">Dr. Taylor</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      {userMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.name}
                            onClick={() => handleMenuItemClick(item.name)}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay to close dropdown when clicking outside */}
      {isUserDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsUserDropdownOpen(false)}
        />
      )}

      {/* Help Modal */}
      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#E8F0FE] border-t border-gray-200 mt-auto">
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="flex items-center space-x-4">
              <p className="text-[#005EB8] font-medium">
                Empowering NHS Radiology Teams – Smarter Follow-ups, Safer Patients.
              </p>
              {/* AI Support Assistant Button - Keep for manual trigger */}
              <button
                onClick={() => {
                  const widget = document.querySelector('#vapi-widget-floating-button') as HTMLElement;
                  if (widget) {
                    widget.click();
                  }
                }}
                className="flex items-center space-x-2 px-3 py-1.5 bg-[#005EB8] text-white text-sm rounded-md hover:bg-[#004494] transition-colors cursor-pointer"
                title="Chat with RadAssist AI Support"
              >
                <i className="ri-customer-service-2-line text-sm"></i>
                <span>AI Support</span>
              </button>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>All data shown are synthetic and for demonstration purposes only.</span>
              <a 
                href="https://www.radassistai.com/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#005EB8] hover:underline cursor-pointer"
              >
                Built by RadAssist AI
              </a>
            </div>
          </div>
          
          {/* NHS Compliance Footer */}
          <div className="flex justify-end items-center mt-3">
            <div className="flex items-center space-x-2 text-xs text-[#6B7280]">
              <i className="ri-government-line text-[20px] text-[#6B7280]"></i>
              <span>© 2025 RadAssist AI — NHS Data Protection Compliant | </span>
              <a 
                href="https://www.gov.uk/government/groups/data-and-technology-assurance-coordination-dtac" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline cursor-pointer"
              >
                DTAC
              </a>
              <span> & </span>
              <a 
                href="https://www.dsptoolkit.nhs.uk/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline cursor-pointer"
              >
                DSPT
              </a>
              <span> Verified | Hosted Securely on Microsoft Azure</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
