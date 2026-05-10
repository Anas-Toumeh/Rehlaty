// pages/Manager/ReportsDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ManagerSidebar from "../components/Manager/ManagerSidebar";
import API from "../api/axiosConfig";

const ReportsDashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const companyId = localStorage.getItem('companyId');
  // بيانات الإحصائيات
  const [stats, setStats] = useState({
    // إحصائيات عامة
    totalBuses: 0,
    totalEmployees: 0,
    totalDrivers: 0,
    
    // إحصائيات الرحلات
    completedTrips: 0,
    scheduledTrips: 0,
    ongoingTrips: 0,
    cancelledTrips: 0,
    
    // إحصائيات الحجوزات والإيرادات
    totalBookings: 0,
    totalRevenue: 0,
    averageTicketPrice: 0,
    
    // إحصائيات شهرية
    monthlyTrips: [],
    monthlyRevenue: 0,
    monthlyBookings: 0
  });
  
  // بيانات التقرير التفصيلي
  const [detailedReport, setDetailedReport] = useState({
    dailyStats: [],
    topRoutes: [],
    busUtilization: []
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // جلب الإحصائيات العامة
  const fetchGeneralStats = async () => {
    try {
      // جلب عدد الباصات
      const busesRes = await API.get("company/buses");
      const employeesRes = await API.get("/company/users", {
        params: {
          role: ["Employee", "CompanyManager"], 
            
                companyId: companyId
            },
            paramsSerializer: {
                indexes: null 
            }
        });
      const driversRes =  await API.get("/company/users", {
        params: {
          role: ["Driver"], 
            
                companyId: companyId
            },
            paramsSerializer: {
                indexes: null 
            }
        });
      
      setStats(prev => ({
        ...prev,
        totalBuses: busesRes.data.count || 0,
        totalEmployees: employeesRes.data.count || 0,
        totalDrivers: driversRes.data.count || 0
      }));
      
    } catch (error) {
      console.error("Error fetching general stats:", error);
    }
  };

  // جلب إحصائيات الرحلات والحجوزات
  const fetchTripStats = async () => {
    try {
      const response = await API.get("/company/trip-stats");
      
      if (response.data.success) {
        setStats(prev => ({
          ...prev,
          completedTrips: response.data.stats.completed || 0,
          scheduledTrips: response.data.stats.scheduled || 0,
          ongoingTrips: response.data.stats.ongoing || 0,
          cancelledTrips: response.data.stats.cancelled || 0,
          totalBookings: response.data.stats.totalBookings || 0,
          totalRevenue: response.data.stats.totalRevenue || 0,
          averageTicketPrice: response.data.stats.averageTicketPrice || 0
        }));
      }
    } catch (error) {
      console.error("Error fetching trip stats:", error);
    }
  };

  // جلب التقارير الشهرية
  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      const response = await API.get("/company/monthly", {
        params: { month: selectedMonth, year: selectedYear }
      });
      
      if (response.data.success) {
        setStats(prev => ({
          ...prev,
          monthlyRevenue: response.data.report.totalRevenue || 0,
          monthlyBookings: response.data.report.totalBookings || 0,
          monthlyTrips: response.data.report.trips || []
        }));
      }
    } catch (error) {
      console.error("Error fetching monthly report:", error);
      showToast("حدث خطأ في جلب التقرير الشهري", "error");
    } finally {
      setLoading(false);
    }
  };

  // جلب التقرير التفصيلي
  const fetchDetailedReport = async () => {
    try {
      setLoading(true);
      const response = await API.get("/company/detailed", {
        params: { month: selectedMonth, year: selectedYear }
      });
      
      if (response.data.success) {
        setDetailedReport({
          dailyStats: response.data.dailyStats || [],
          topRoutes: response.data.topRoutes || [],
          busUtilization: response.data.busUtilization || []
        });
        setShowDetailedReport(true);
      }
    } catch (error) {
      console.error("Error fetching detailed report:", error);
      showToast("حدث خطأ في جلب التقرير التفصيلي", "error");
    } finally {
      setLoading(false);
    }
  };

  // تصدير التقرير إلى PDF/Excel
  const exportReport = async (format = 'pdf') => {
    try {
      const response = await API.get(`/company/export/${format}`, {
        params: { month: selectedMonth, year: selectedYear },
        responseType: 'blob'    
      });
      
      // إنشاء رابط التحميل
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${selectedYear}_${selectedMonth}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showToast(`تم تصدير التقرير بنجاح`, "success");
    } catch (error) {
      console.error("Error exporting report:", error);
      showToast("حدث خطأ في تصدير التقرير", "error");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchGeneralStats(),
        fetchTripStats(),
        fetchMonthlyReport()
      ]);
      setLoading(false);
    };
    loadData();
  }, [selectedMonth, selectedYear]);

  // تنسيق الأرقام
  const formatNumber = (num) => {
    return num?.toLocaleString() || 0;
  };

  const formatCurrency = (amount) => {
    return `${amount?.toLocaleString() || 0} ل.س`;
  };

  // أشهر السنة
  const months = [
    { value: 1, label: "يناير" },
    { value: 2, label: "فبراير" },
    { value: 3, label: "مارس" },
    { value: 4, label: "أبريل" },
    { value: 5, label: "مايو" },
    { value: 6, label: "يونيو" },
    { value: 7, label: "يوليو" },
    { value: 8, label: "أغسطس" },
    { value: 9, label: "سبتمبر" },
    { value: 10, label: "أكتوبر" },
    { value: 11, label: "نوفمبر" },
    { value: 12, label: "ديسمبر" }
  ];

  // السنوات (آخر 5 سنوات)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="fas fa-spinner fa-pulse text-4xl text-blue-600 mb-4"></i>
            <p className="text-gray-500">جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 ${
            toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}>
            <i className={`fas ${toast.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`}></i>
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full z-50 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        isSidebarOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        <ManagerSidebar closeSidebar={() => setIsSidebarOpen(false)} />
      </div>
      
      {/* Main Content */}
      <div className=" w-full transition-all duration-300">
        <main className="w-full">
          {/* Header */}
          <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="px-4 sm:px-6 lg:px-10 py-4 md:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsSidebarOpen(true)} 
                    className="lg:hidden p-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <i className="fas fa-bars text-lg"></i>
                  </button>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-800">
                      التقارير المالية
                    </h1>
                    <p className="text-gray-500 text-xs md:text-sm mt-1">
                      إحصائيات وتقارير الأداء المالي للشركة
                    </p>
                  </div>
                </div>
                
                {/* مُحدد الشهر والسنة */}
                <div className="flex gap-2">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl font-bold text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl font-bold text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            
            {/* بطاقات الإحصائيات العامة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard 
                title="إجمالي الباصات" 
                value={stats.totalBuses} 
                icon="fa-bus" 
                color="from-blue-500 to-blue-600"
                bgColor="bg-blue-50"
              />
              <StatCard 
                title="الموظفين" 
                value={stats.totalEmployees} 
                icon="fa-users" 
                color="from-purple-500 to-purple-600"
                bgColor="bg-purple-50"
              />
              <StatCard 
                title="السائقين" 
                value={stats.totalDrivers} 
                icon="fa-truck-fast" 
                color="from-green-500 to-green-600"
                bgColor="bg-green-50"
              />
              <StatCard 
                title="الإيرادات الإجمالية" 
                value={formatCurrency(stats.totalRevenue)} 
                icon="fa-chart-line" 
                color="from-amber-500 to-amber-600"
                bgColor="bg-amber-50"
                isCurrency
              />
            </div>

            {/* بطاقات حالة الرحلات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <TripStatusCard 
                title="مكتملة" 
                value={stats.completedTrips} 
                icon="fa-check-circle" 
                color="text-green-600"
                bgColor="bg-green-100"
                borderColor="border-green-200"
              />
              <TripStatusCard 
                title="مجدولة" 
                value={stats.scheduledTrips} 
                icon="fa-calendar" 
                color="text-blue-600"
                bgColor="bg-blue-100"
                borderColor="border-blue-200"
              />
              <TripStatusCard 
                title="في الطريق" 
                value={stats.ongoingTrips} 
                icon="fa-play-circle" 
                color="text-amber-600"
                bgColor="bg-amber-100"
                borderColor="border-amber-200"
              />
              <TripStatusCard 
                title="ملغية" 
                value={stats.cancelledTrips} 
                icon="fa-times-circle" 
                color="text-red-600"
                bgColor="bg-red-100"
                borderColor="border-red-200"
              />
            </div>

            {/* بطاقات الإيرادات الشهرية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* الإيرادات الشهرية */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <i className="fas fa-chart-simple"></i>
                    إيرادات {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                  </h3>
                </div>
                <div className="p-6 text-center">
                  <div className="text-4xl font-black text-emerald-600 mb-2">
                    {formatCurrency(stats.monthlyRevenue)}
                  </div>
                  <p className="text-gray-500 text-sm">إجمالي الإيرادات الشهرية</p>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                    <div>
                      <p className="text-xs text-gray-400">عدد الحجوزات</p>
                      <p className="text-xl font-bold text-gray-800">{formatNumber(stats.monthlyBookings)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">متوسط سعر التذكرة</p>
                      <p className="text-xl font-bold text-gray-800">{formatCurrency(stats.averageTicketPrice)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* إحصائيات الحجوزات */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <i className="fas fa-ticket"></i>
                    إحصائيات الحجوزات
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex justify-around items-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <i className="fas fa-ticket-alt text-blue-600 text-2xl"></i>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{formatNumber(stats.totalBookings)}</p>
                      <p className="text-xs text-gray-500">إجمالي الحجوزات</p>
                    </div>
                    <div className="w-px h-12 bg-gray-200"></div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <i className="fas fa-chart-line text-green-600 text-2xl"></i>
                      </div>
                      <p className="text-xl font-bold text-green-600">{formatNumber(stats.monthlyBookings)}</p>
                      <p className="text-xs text-gray-500">حجوزات هذا الشهر</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* أزرار التقارير */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={fetchDetailedReport}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <i className="fas fa-file-alt"></i>
                عرض تقرير مفصل
              </button>
              <button
                onClick={() => exportReport('pdf')}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-red-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <i className="fas fa-file-pdf"></i>
                تصدير PDF
              </button>
              <button
                onClick={() => exportReport('excel')}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-green-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <i className="fas fa-file-excel"></i>
                تصدير Excel
              </button>
            </div>

            {/* التقرير التفصيلي - Modal */}
            {showDetailedReport && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailedReport(false)}>
                <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-3xl">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        تقرير {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                      </h2>
                      <button onClick={() => setShowDetailedReport(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <i className="fas fa-times text-xl"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* الرحلات اليومية */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i className="fas fa-calendar-day text-blue-500"></i>
                        تفاصيل الرحلات اليومية
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-right">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-sm font-bold text-gray-500">اليوم</th>
                              <th className="px-4 py-2 text-sm font-bold text-gray-500">عدد الرحلات</th>
                              <th className="px-4 py-2 text-sm font-bold text-gray-500">عدد الحجوزات</th>
                              <th className="px-4 py-2 text-sm font-bold text-gray-500">الإيرادات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailedReport.dailyStats.map((day, idx) => (
                              <tr key={idx} className="border-b border-gray-100">
                                <td className="px-4 py-3">{day.date}</td>
                                <td className="px-4 py-3">{day.trips}</td>
                                <td className="px-4 py-3">{day.bookings}</td>
                                <td className="px-4 py-3 font-bold text-green-600">{formatCurrency(day.revenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* أفضل المسارات */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i className="fas fa-route text-purple-500"></i>
                        أفضل المسارات من حيث الإيرادات
                      </h3>
                      <div className="space-y-3">
                        {detailedReport.topRoutes.map((route, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-xl p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-gray-800">{route.from} → {route.to}</span>
                              <span className="text-green-600 font-bold">{formatCurrency(route.revenue)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>🚌 {route.trips} رحلة</span>
                              <span>🎫 {route.bookings} حجز</span>
                              <span>⭐ {route.rating}% إشغال</span>
                            </div>
                            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${route.rating}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* استغلال الباصات */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i className="fas fa-chart-pie text-amber-500"></i>
                        نسبة استغلال الباصات
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {detailedReport.busUtilization.map((bus, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-xl p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-gray-800">{bus.busNumber}</span>
                              <span className="text-blue-600 font-bold">{bus.utilization}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${bus.utilization}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                              <span>🚌 {bus.trips} رحلة</span>
                              <span>🪑 {bus.seatsBooked} / {bus.totalSeats} مقعد</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3">
                    <button
                      onClick={() => exportReport('pdf')}
                      className="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold hover:bg-red-700 transition"
                    >
                      <i className="fas fa-file-pdf ml-2"></i>
                      تصدير PDF
                    </button>
                    <button
                      onClick={() => setShowDetailedReport(false)}
                      className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// مكون بطاقة الإحصائيات
const StatCard = ({ title, value, icon, color, bgColor, isCurrency }) => (
  <div className={`${bgColor} rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`bg-gradient-to-br ${color} p-3 rounded-xl text-white shadow-lg`}>
        <i className={`fas ${icon} text-xl`}></i>
      </div>
      {isCurrency ? (
        <div className="text-emerald-600 text-sm font-bold">
          <i className="fas fa-chart-line ml-1"></i>
          إجمالي
        </div>
      ) : null}
    </div>
    <div className={`text-2xl font-black ${isCurrency ? 'text-emerald-600' : 'text-gray-800'}`}>
      {value}
    </div>
    <div className="text-sm text-gray-500 mt-1">{title}</div>
  </div>
);

// مكون بطاقة حالة الرحلة
const TripStatusCard = ({ title, value, icon, color, bgColor, borderColor }) => (
  <div className={`bg-white rounded-2xl p-6 border ${borderColor} hover:shadow-lg transition-all duration-300`}>
    <div className="flex items-center justify-between mb-3">
      <div className={`${bgColor} p-3 rounded-xl`}>
        <i className={`fas ${icon} ${color} text-xl`}></i>
      </div>
      <span className={`text-2xl font-black ${color}`}>{value}</span>
    </div>
    <p className="text-gray-600 text-sm">{title}</p>
  </div>
);

export default ReportsDashboard;