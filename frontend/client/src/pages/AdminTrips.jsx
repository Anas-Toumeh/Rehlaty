import { useEffect, useState } from 'react';
import API from '../api/axiosConfig';
import AdminSidebar from '../components/Admin/AdminSidebar';

const AdminTrips = () => {
  const [trips, setTrips] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [passengersCount, setPassengersCount] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // دالة جلب البيانات من التوابع الأربعة
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // تنفيذ الطلبات بالتوازي لضمان السرعة
      const [resActive, resCount, resPassengers, resMonthly] = await Promise.all([
        API.get(`/admin/trips/active?search=${searchTerm}`),
        API.get('/admin/trips/active-count'),
        API.get('/admin/trips/active-passengers'),
        API.get('/admin/trips/completed-monthly')
      ]);

      setTrips(resActive.data);
      setActiveCount(resCount.data.activeTripsCount);
      setPassengersCount(resPassengers.data.totalPassengers);
      setMonthlyCount(resMonthly.data.count);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDashboardData();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex" dir="rtl">
      
      {/* Sidebar */}
      <div className={`fixed lg:sticky top-0 right-0 h-screen z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <AdminSidebar closeSidebar={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Navbar */}
        <header className="h-24 px-8 lg:px-12 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-blue-600">
              <i className="fas fa-bars text-xl"></i>
            </button>
            <div>
              <h1 className="text-2xl font-black text-[#1B2559]">مراقبة الرحلات</h1>
              <p className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest">إدارة الحركة والركاب</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3 bg-[#F4F7FE] px-5 py-3 rounded-2xl w-80 shadow-inner">
            <i className="fas fa-search text-gray-400"></i>
            <input 
              type="text" 
              placeholder="ابحث عن مدينة أو مسار..." 
              className="bg-transparent border-none outline-none text-sm font-bold text-[#1B2559] w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <main className="p-6 lg:p-10 space-y-8">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="الرحلات النشطة" value={activeCount} icon="fa-bus" color="blue" />
            <StatCard title="ركاب على الطريق" value={passengersCount} icon="fa-user-friends" color="orange" />
            <StatCard title="مكتملة هذا الشهر" value={monthlyCount} icon="fa-calendar-check" color="green" />
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-50 overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#1B2559]">قائمة الرحلات المجدولة والمنطلقة</h3>
              <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                <span className="text-[10px] font-black text-blue-600 uppercase">مزامنة فورية</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-[#F9FAFE]">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-[#A3AED0] uppercase tracking-wider">شركة النقل</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#A3AED0] uppercase tracking-wider">خط السير</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#A3AED0] uppercase tracking-wider text-center">الإقلاع</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#A3AED0] uppercase tracking-wider text-center">الوضعية</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#A3AED0] uppercase tracking-wider text-center">إشغال المقاعد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan="5" className="py-20 text-center"><i className="fas fa-spinner fa-spin text-3xl text-blue-500"></i></td></tr>
                  ) : trips.length > 0 ? (
                    trips.map((trip) => (
                      <tr key={trip._id} className="hover:bg-blue-50/20 transition-all cursor-default group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm overflow-hidden group-hover:scale-110 transition-transform">
                              {trip.companyId?.logo ? (
                                <img src={`http://localhost:5000${trip.companyId.logo}`} alt="logo" className="w-full h-full object-cover" />
                              ) : (
                                <i className="fas fa-building text-gray-300"></i>
                              )}
                            </div>
                            <span className="font-black text-[#1B2559] text-sm">{trip.companyId?.name || 'شركة غير معروفة'}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-[#1B2559]">{trip.from}</span>
                            <i className="fas fa-arrow-left text-blue-300 text-xs"></i>
                            <span className="text-sm font-bold text-[#1B2559]">{trip.to}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <p className="text-xs font-black text-[#1B2559]">{new Date(trip.departureTime).toLocaleDateString('ar-SY')}</p>
                          <p className="text-[10px] font-bold text-[#A3AED0]">{new Date(trip.departureTime).toLocaleTimeString('ar-SY', {hour: '2-digit', minute:'2-digit'})}</p>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-tighter shadow-sm border ${
                            trip.status === 'OnWay' 
                            ? 'bg-amber-500 text-white border-amber-600' 
                            : 'bg-green-500 text-white border-green-600'
                          }`}>
                            {trip.status === 'OnWay' ? 'في الطريق' : 'بانتظار الإقلاع'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col items-center">
                            <div className="flex justify-between w-24 mb-1">
                              <span className="text-[9px] font-black text-blue-600">{trip.bookedSeats} محجوز</span>
                              <span className="text-[9px] font-black text-gray-400">{trip.totalSeats} كلي</span>
                            </div>
                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${trip.bookedSeats / trip.totalSeats > 0.8 ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${(trip.bookedSeats / trip.totalSeats) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="py-20 text-center text-gray-400 font-bold">لا توجد رحلات نشطة حالياً تتوافق مع بحثك</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// مكون كرت الإحصائيات (StatCard)
const StatCard = ({ title, value, icon, color }) => {
  const themes = {
    blue: "bg-blue-600 text-white shadow-blue-200",
    orange: "bg-orange-500 text-white shadow-orange-200",
    green: "bg-green-500 text-white shadow-green-200"
  };
  return (
    <div className={`p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl transition-all hover:-translate-y-1 ${themes[color]}`}>
      <div>
        <p className="text-[10px] font-black uppercase opacity-80 tracking-widest mb-1">{title}</p>
        <p className="text-4xl font-black">{value}</p>
      </div>
      <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center text-2xl backdrop-blur-sm">
        <i className={`fas ${icon}`}></i>
      </div>
    </div>
  );
};

export default AdminTrips;