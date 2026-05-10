import { useEffect, useState } from 'react';
import API from '../api/axiosConfig';
import AdminSidebar from '../components/Admin/AdminSidebar';

const AdminDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false); // Manager modal
  const [editingCompany, setEditingCompany] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [formData, setFormData] = useState({ 
    name: '', phone: '', address: '', logo: null, isActive: true 
  });

  // New manager data state
  const [managerData, setManagerData] = useState({
    fullName: '', email: '', password: '', phone: '', companyId: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/companies');
      setCompanies(res.data);
      console.log(res.data);
      
    } catch (err) { 
      showToast('حدث خطأ في تحميل البيانات', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCompanies(); }, []);

  // Manager data submission function
  const handleManagerSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/assign-manager', managerData);
      showToast('تم تعيين المدير بنجاح');
      setIsManagerModalOpen(false);
      setManagerData({ fullName: '', email: '', password: '', phone: '', companyId: '' });
      fetchCompanies(); // Refresh data
    } catch (err) {
      showToast(err.response?.data?.message || 'خطأ في إنشاء المدير', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) data.append(key, formData[key]);
    });

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editingCompany) {
        await API.put(`/admin/companies/${editingCompany._id}`, data, config);
        showToast('تم تحديث البيانات بنجاح');
      } else {
        await API.post('/admin/companies', data, config);
        showToast('تمت إضافة الشركة بنجاح');
      }
      setIsModalOpen(false);
      resetForm();
      fetchCompanies();
    } catch (err) { showToast('خطأ في عملية الحفظ', 'error'); }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', address: '', logo: null, isActive: true });
    setEditingCompany(null);
  };

  const toggleStatus = async (company) => {
    try {
      await API.patch(`/admin/companies/${company._id}/status`);
      showToast('تم تغيير الحالة بنجاح');
      fetchCompanies();
    } catch (err) { showToast('خطأ في تغيير الحالة', 'error'); }
  };

  // Filter companies that don't have a manager (assuming server returns manager field)
  const companiesWithoutManager = companies.filter(c => !c.managerId);

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex" dir="rtl">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl text-white font-bold flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
            {toast.message}
          </div>
        </div>
      )}

      {/* Sidebar Container */}
      <div className={`fixed lg:sticky top-0 right-0 h-screen z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <AdminSidebar closeSidebar={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Navbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2.5 bg-blue-600 text-white rounded-xl shadow-lg">
              <i className="fas fa-bars"></i>
            </button>
            <h1 className="text-xl lg:text-2xl font-black text-gray-800 tracking-tight">إدارة الشركات</h1>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setIsManagerModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all text-sm"
            >
              إضافة مدير شركة
            </button>
            <button 
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all text-sm"
            >
              إضافة شركة +
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-10">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <StatCard title="إجمالي الشركات" value={companies.length} icon="fa-building" color="blue" />
            <StatCard title="شركات بدون مدير" value={companiesWithoutManager.length} icon="fa-user-slash" color="amber" />
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase text-center">الشعار</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase">الشركة</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase">المدير</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase text-center">الحالة</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {companies.map((company) => (
                    <tr key={company._id} className="hover:bg-blue-50/20 transition-all">
                      <td className="px-8 py-4 flex justify-center">
                        <img src={`http://localhost:5000${company.logo}`} className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm" />
                      </td>
                      <td className="px-8 py-4 font-black text-gray-800">
                        {company.name}
                        <p className="text-[10px] text-gray-400 font-bold">{company.address}</p>
                      </td>
                      <td className="px-8 py-4 font-bold text-xs">
                        {company.managerId ? (
                          <span className="text-blue-600"><i className="fas fa-user-tie ml-1"></i> {company.managerId.fullName}</span>
                        ) : (
                          <span className="text-amber-500 font-black italic">لا يوجد مدير</span>
                        )}
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className={`px-4 py-1 rounded-full text-[9px] font-black ${company.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {company.isActive ? 'نشط' : 'متوقف'}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => { setEditingCompany(company); setFormData({...company, logo: null}); setIsModalOpen(true); }} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><i className="fas fa-edit"></i></button>
                          <button onClick={() => toggleStatus(company)} className={`p-2 rounded-lg transition-all ${company.isActive ? 'bg-red-100 text-red-600 hover:bg-red-600 hover:text-white' : 'bg-green-100 text-green-600 hover:bg-green-600 hover:text-white'}`}>
                            <i className={`fas ${company.isActive ? 'fa-power-off' : 'fa-play'}`}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* --- Company addition modal (original) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}>
           {/* Original modal content */}
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
             <form onSubmit={handleSubmit} className="p-8 space-y-4 text-right">
               <h2 className="text-2xl font-black mb-6">بيانات الشركة</h2>
               <input type="text" placeholder="اسم الشركة" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
               <input type="tel" placeholder="رقم الهاتف" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-blue-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
               <input type="text" placeholder="العنوان" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-blue-500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
               <div className="border-2 border-dashed p-6 rounded-2xl text-center bg-gray-50">
                 <input type="file" onChange={e => setFormData({...formData, logo: e.target.files[0]})} />
               </div>
               <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">حفظ</button>
             </form>
           </div>
        </div>
      )}

      {/* --- Manager assignment modal (Updated) --- */}
      {isManagerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setIsManagerModalOpen(false)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-800">إضافة مدير شركة</h2>
              <button onClick={() => setIsManagerModalOpen(false)} className="text-gray-400 hover:text-red-500"><i className="fas fa-times text-xl"></i></button>
            </div>
            <form onSubmit={handleManagerSubmit} className="p-8 space-y-4 text-right">
              
              {/* Company selection */}
              <select 
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-amber-500 font-bold"
                value={managerData.companyId}
                onChange={e => setManagerData({...managerData, companyId: e.target.value})}
                required
              >
                <option value="">اختر الشركة التي ليس لها مدير...</option>
                {companiesWithoutManager.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>

              <input type="text" placeholder="اسم المدير الكامل" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-amber-500" value={managerData.fullName} onChange={e => setManagerData({...managerData, fullName: e.target.value})} required />
              <input type="email" placeholder="البريد الإلكتروني" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-amber-500" value={managerData.email} onChange={e => setManagerData({...managerData, email: e.target.value})} required />
              <input type="password" placeholder="كلمة المرور" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-amber-500" value={managerData.password} onChange={e => setManagerData({...managerData, password: e.target.value})} required />
              <input type="tel" placeholder="رقم هاتف المدير" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-amber-500" value={managerData.phone} onChange={e => setManagerData({...managerData, phone: e.target.value})} required />
              
              <button type="submit" className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-amber-500/30">تعيين مديراً الآن</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Stats card component
const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600"
  };
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl ${colors[color]}`}>
        <i className={`fas ${icon}`}></i>
      </div>
    </div>
  );
};

export default AdminDashboard;