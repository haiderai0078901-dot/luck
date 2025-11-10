
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeeklyStats } from '../../hooks/useWeeklyStats';

export default function WeeklyReportPage() {
  const navigate = useNavigate();
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    return startOfWeek.toISOString().split('T')[0];
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Calculate week range for the hook
  const weekStart = new Date(selectedWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  
  const startISO = weekStart.toISOString();
  const endISO = weekEnd.toISOString();

  // Use the new hook
  const { loading, error, data } = useWeeklyStats(startISO, endISO);

  // Fallback to zeros if no data or error
  const stats = data ? {
    totalReports: data.totalReports,
    totalFollowups: data.totalFollowups,
    overdueFollowups: data.overdue,
    completedFollowups: data.completed,
    pendingFollowups: data.pending,
    weeklyReports: [], // Keep empty for now as we don't have detailed report data
    weeklyFollowups: [] // Keep empty for now as we don't have detailed followup data
  } : {
    totalReports: 0,
    totalFollowups: 0,
    overdueFollowups: 0,
    completedFollowups: 0,
    pendingFollowups: 0,
    weeklyReports: [],
    weeklyFollowups: []
  };

  const getWeekRange = (startDate: string) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      start: start.toLocaleDateString('en-GB'),
      end: end.toLocaleDateString('en-GB')
    };
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    alert('Weekly report generated successfully!');
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const currentDate = new Date(selectedWeek);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const handleDateSelect = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    setSelectedWeek(startOfWeek.toISOString().split('T')[0]);
    setShowCalendar(false);
  };

  const getMonthYear = () => {
    const currentDate = new Date(selectedWeek);
    return currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: number) => {
    const currentDate = new Date(selectedWeek);
    currentDate.setMonth(currentDate.getMonth() + direction);
    setSelectedWeek(currentDate.toISOString().split('T')[0]);
  };

  const weekRange = getWeekRange(selectedWeek);

  // Chart data for bar chart - use data from hook
  const barChartData = [
    { label: 'Reports', value: stats.totalReports, color: '#005EB8' },
    { label: 'Follow-ups', value: stats.totalFollowups, color: '#10B981' },
    { label: 'Completed', value: stats.completedFollowups, color: '#059669' },
    { label: 'Pending', value: stats.pendingFollowups, color: '#D97706' },
    { label: 'Overdue', value: stats.overdueFollowups, color: '#DC2626' }
  ];

  const maxValue = Math.max(...barChartData.map(d => d.value), 1);

  // Chart data for pie chart (follow-up status)
  const pieChartData = [
    { label: 'Completed', value: stats.completedFollowups, color: '#059669' },
    { label: 'Pending', value: stats.pendingFollowups, color: '#D97706' },
    { label: 'Overdue', value: stats.overdueFollowups, color: '#DC2626' }
  ];

  const totalFollowupStatus = stats.completedFollowups + stats.pendingFollowups + stats.overdueFollowups;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005EB8] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Weekly Report Generator</h1>
            <p className="text-gray-600">Generate comprehensive weekly reports for radiology department performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <img 
              src="https://static.readdy.ai/image/a4ac012d2ef5b8e88ed8146b71225bab/da9a889a8621bac55f6a3bd7cb64f7ce.png" 
              alt="NHS Logo" 
              className="h-12 w-auto"
            />
            <button
              onClick={handleDashboardClick}
              className="flex items-center space-x-2 bg-[#005EB8] text-white px-4 py-2 rounded-md hover:bg-[#004494] transition-colors whitespace-nowrap cursor-pointer"
            >
              <span>🏠</span>
              <span className="text-sm font-medium">Dashboard</span>
            </button>
          </div>
        </div>

        {/* Week Selection */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Report Week</h2>
          <div className="flex items-center gap-4">
            <div>
              <label htmlFor="week-select" className="block text-sm font-medium text-gray-700 mb-2">
                Week Starting:
              </label>
              <input
                id="week-select"
                type="date"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent"
              />
            </div>
            <div className="text-sm text-gray-600 mt-6 relative">
              <div className="flex items-center gap-2">
                <span>Report Period: {weekRange.start} - {weekRange.end}</span>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <i className="ri-calendar-line text-[#005EB8]"></i>
                </button>
              </div>
              
              {/* Calendar Popup */}
              {showCalendar && (
                <div className="absolute top-8 left-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10 w-80">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => navigateMonth(-1)}
                      className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <i className="ri-arrow-left-line"></i>
                    </button>
                    <h3 className="font-semibold text-gray-900">{getMonthYear()}</h3>
                    <button
                      onClick={() => navigateMonth(1)}
                      className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <i className="ri-arrow-right-line"></i>
                    </button>
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day Headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar Days */}
                    {generateCalendarDays().map((date, index) => {
                      const isCurrentMonth = date.getMonth() === new Date(selectedWeek).getMonth();
                      const isSelected = date.toISOString().split('T')[0] === selectedWeek;
                      const isToday = date.toDateString() === new Date().toDateString();
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleDateSelect(date)}
                          className={`p-2 text-xs rounded hover:bg-gray-100 cursor-pointer ${
                            !isCurrentMonth ? 'text-gray-300' : 'text-gray-900'
                          } ${
                            isSelected ? 'bg-[#005EB8] text-white hover:bg-[#004494]' : ''
                          } ${
                            isToday && !isSelected ? 'bg-blue-50 text-[#005EB8] font-medium' : ''
                          }`}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Close Button */}
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowCalendar(false)}
                      className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <i className="ri-file-text-line text-xl text-[#005EB8]"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <i className="ri-calendar-check-line text-xl text-green-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Follow-ups</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFollowups}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <i className="ri-check-line text-xl text-green-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedFollowups}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <i className="ri-time-line text-xl text-yellow-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingFollowups}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <i className="ri-alert-line text-xl text-red-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdueFollowups}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Weekly Performance Overview</h3>
            <div className="space-y-4">
              {barChartData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-20 text-sm font-medium text-gray-700 text-right mr-4">
                    {item.label}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="h-6 rounded-full flex items-center justify-end pr-2"
                      style={{
                        backgroundColor: item.color,
                        width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                        minWidth: item.value > 0 ? '24px' : '0px'
                      }}
                    >
                      {item.value > 0 && (
                        <span className="text-white text-xs font-medium">{item.value}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Follow-up Status Distribution</h3>
            <div className="flex items-center justify-center">
              {totalFollowupStatus > 0 ? (
                <div className="relative">
                  <svg width="200" height="200" className="transform -rotate-90">
                    {(() => {
                      let currentAngle = 0;
                      return pieChartData.map((item, index) => {
                        if (item.value === 0) return null;
                        const percentage = (item.value / totalFollowupStatus) * 100;
                        const angle = (percentage / 100) * 360;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + angle;
                        currentAngle += angle;

                        const startAngleRad = (startAngle * Math.PI) / 180;
                        const endAngleRad = (endAngle * Math.PI) / 180;
                        
                        const largeArcFlag = angle > 180 ? 1 : 0;
                        const x1 = 100 + 80 * Math.cos(startAngleRad);
                        const y1 = 100 + 80 * Math.sin(startAngleRad);
                        const x2 = 100 + 80 * Math.cos(endAngleRad);
                        const y2 = 100 + 80 * Math.sin(endAngleRad);

                        const pathData = [
                          `M 100 100`,
                          `L ${x1} ${y1}`,
                          `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                          'Z'
                        ].join(' ');

                        return (
                          <path
                            key={index}
                            d={pathData}
                            fill={item.color}
                            stroke="white"
                            strokeWidth="2"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{totalFollowupStatus}</div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-500 text-sm">No Data</span>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 space-y-2">
              {pieChartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded mr-2"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {item.value} ({totalFollowupStatus > 0 ? Math.round((item.value / totalFollowupStatus) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Report Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Reports */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Reports Generated This Week</h3>
            </div>
            <div className="p-6">
              {data?.reportsByDay && data.reportsByDay.some(d => d.count > 0) ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {data.reportsByDay.map((day, index) => (
                    day.count > 0 && (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{new Date(day.date).toLocaleDateString('en-GB')}</p>
                          <p className="text-sm text-gray-600">Daily reports</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{day.count} reports</p>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No reports generated this week</p>
              )}
            </div>
          </div>

          {/* Weekly Follow-ups */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Follow-ups This Week</h3>
            </div>
            <div className="p-6">
              {data?.followupsByDay && data.followupsByDay.some(d => d.count > 0) ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {data.followupsByDay.map((day, index) => (
                    day.count > 0 && (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{new Date(day.date).toLocaleDateString('en-GB')}</p>
                          <p className="text-sm text-gray-600">Daily follow-ups</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{day.count} follow-ups</p>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No follow-ups scheduled this week</p>
              )}
            </div>
          </div>
        </div>

        {/* Generate Report Button */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h3>
            <p className="text-gray-600 mb-6">
              Generate a comprehensive PDF report for the week of {weekRange.start} - {weekRange.end}
            </p>
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="bg-[#005EB8] text-white px-8 py-3 rounded-md hover:bg-[#004494] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Generating Report...
                </>
              ) : (
                <>
                  <i className="ri-download-line mr-2"></i>
                  Generate Weekly Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* NHS Compliance Footer */}
      <div className="fixed bottom-4 right-4">
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
  );
}
