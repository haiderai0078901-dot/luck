
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HelpModal from '../../components/help/HelpModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate brief loading for better UX
    setTimeout(() => {
      console.log('✅ Demo login successful — redirected to dashboard');
      navigate('/');
    }, 500);
  };

  const handleForgotPassword = () => {
    setIsHelpModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#005EB8] via-blue-400 to-white flex items-center justify-center relative overflow-hidden">
      {/* NHS Logo Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <img 
          src="https://static.readdy.ai/image/a4ac012d2ef5b8e88ed8146b71225bab/da9a889a8621bac55f6a3bd7cb64f7ce.png" 
          alt="NHS Logo Watermark" 
          className="w-96 h-auto"
        />
      </div>

      <div className="max-w-md w-full mx-4 relative z-10">
        {/* NHS Logo at Top */}
        <div className="text-center mb-8">
          <img 
            src="https://static.readdy.ai/image/a4ac012d2ef5b8e88ed8146b71225bab/da9a889a8621bac55f6a3bd7cb64f7ce.png" 
            alt="NHS Logo" 
            className="h-16 w-auto mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            RadAssist AI
          </h1>
          <p className="text-blue-100 text-lg drop-shadow">
            NHS Radiology Assistant
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Sign In
            </h2>
            <p className="text-gray-600 mt-2">
              Access your RadAssist AI dashboard
            </p>
          </div>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-[#005EB8] transition-colors"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-[#005EB8] transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#005EB8] hover:bg-[#004494] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005EB8] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer transition-all duration-200 transform hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="ri-login-circle-line mr-2"></i>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-4 text-right">
            <button
              onClick={handleForgotPassword}
              className="text-sm text-[#005EB8] hover:text-[#004494] hover:underline cursor-pointer transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Secure access to NHS-compliant radiology tools
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center space-x-4 text-white/80 text-xs">
            <div className="flex items-center space-x-1">
              <i className="ri-shield-check-line text-sm"></i>
              <span>NHS Compliant</span>
            </div>
            <div className="flex items-center space-x-1">
              <i className="ri-lock-line text-sm"></i>
              <span>Secure Login</span>
            </div>
            <div className="flex items-center space-x-1">
              <i className="ri-cloud-line text-sm"></i>
              <span>Azure Hosted</span>
            </div>
          </div>
        </div>
      </div>

      {/* NHS Compliance Footer */}
      <div className="fixed bottom-4 right-4">
        <div className="flex items-center space-x-2 text-xs text-white/70 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
          <i className="ri-government-line text-[16px]"></i>
          <span>© 2025 RadAssist AI — NHS Data Protection Compliant | </span>
          <a 
            href="https://www.gov.uk/government/groups/data-and-technology-assurance-coordination-dtac" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline cursor-pointer text-blue-200"
          >
            DTAC
          </a>
          <span> & </span>
          <a 
            href="https://www.dsptoolkit.nhs.uk/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline cursor-pointer text-blue-200"
          >
            DSPT
          </a>
          <span> Verified | Hosted Securely on Microsoft Azure</span>
        </div>
      </div>

      {/* Help Modal for Password Reset */}
      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)}
        prefilledData={{
          email: email,
          subject: 'Password Reset Request'
        }}
      />
    </div>
  );
};

export default Login;
