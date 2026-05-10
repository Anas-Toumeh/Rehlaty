// pages/Manager/EmployeesManagement.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ManagerSidebar from "../components/Manager/ManagerSidebar";
import API from "../api/axiosConfig";

const EmployeesManagement = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("employees"); // employees أو drivers
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const companyId = localStorage.getItem('companyId');

  // أنواع المستخدمين
  const USER_ROLES = {
    employee: { value: "Employee", label: "موظف", color: "bg-blue-100 text-blue-700", icon: "fa-user-tie" },
    manager: { value: "CompanyManager", label: "مدير", color: "bg-purple-100 text-purple-700", icon: "fa-user-cog" },
    driver: { value: "Driver", label: "سائق", color: "bg-green-100 text-green-700", icon: "fa-truck" }
  };

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "Employee",
    isActive: true
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // جلب الموظفين (Employee + CompanyManager)
  const fetchEmployees = async () => {
    try {
      const response = await API.get("/company/users", {
        params: {
          role: ["Employee", "CompanyManager"], 
            
                companyId: companyId
            },
            paramsSerializer: {
                indexes: null 
            }
        });
      
      if (response.data.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      showToast("حدث خطأ في تحميل الموظفين", "error");
    }
  };

  // جلب السائقين
  const fetchDrivers = async () => {
    try {
      const response = await API.get("/company/users", {
        params: {
           role: ["Driver"], // ✅ بهذه الطريقة
              
                companyId: companyId
            },
            paramsSerializer: {
                indexes: null // مهم لتنسيق المصفوفة بشكل صحيح
            }
        });
      
      if (response.data.success) {
        setDrivers(response.data.users || []);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
      showToast("حدث خطأ في تحميل السائقين", "error");
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchEmployees(), fetchDrivers()]);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // إنشاء مستخدم جديد
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      showToast("كلمة المرور غير متطابقة", "error");
      return;
    }
    
    try {
      const userData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        companyId: companyId,
        isActive: true
      };
      
      const response = await API.post("/company/users", userData);
      
      if (response.data.success) {
        showToast(`تم إضافة ${formData.role === "Driver" ? "السائق" : "الموظف"} بنجاح`, "success");
        setIsModalOpen(false);
        resetForm();
        
        if (formData.role === "Driver") {
          fetchDrivers();
        } else {
          fetchEmployees();
        }
      }
    } catch (error) {
      showToast(error.response?.data?.message || "فشل في إنشاء المستخدم", "error");
    }
  };

  // تعديل مستخدم
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        isActive: formData.isActive
      };
      
      if (formData.password) {
        if (formData.password !== formData.confirmPassword) {
          showToast("كلمة المرور غير متطابقة", "error");
          return;
        }
        userData.password = formData.password;
      }
      
      const response = await API.put(`/company/users/${editingUserId}`, userData);
      
      if (response.data.success) {
        showToast("تم تعديل المستخدم بنجاح", "success");
        setIsModalOpen(false);
        resetForm();
        
        if (formData.role === "Driver") {
          fetchDrivers();
        } else {
          fetchEmployees();
        }
      }
    } catch (error) {
      showToast(error.response?.data?.message || "فشل في تعديل المستخدم", "error");
    }
  };

  // حذف مستخدم
  const handleDelete = async () => {
    try {
      const response = await API.delete(`/company/users/${userToDelete._id}`);
      
      if (response.data.success) {
        showToast("تم حذف المستخدم بنجاح", "success");
        setShowDeleteConfirm(false);
        
        if (userToDelete.role === "Driver") {
          fetchDrivers();
        } else {
          fetchEmployees();
        }
      }
    } catch (error) {
      showToast(error.response?.data?.message || "فشل في الحذف", "error");
    }
  };

  // تبديل حالة المستخدم (تفعيل/تعطيل)
  const toggleUserStatus = async (userId, currentStatus, role) => {
    try {
      const response = await API.patch(`/company/users/${userId}/toggle-status`, {
        isActive: !currentStatus
      });
      
      if (response.data.success) {
        showToast(`تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح`, "success");
        
        if (role === "Driver") {
          fetchDrivers();
        } else {
          fetchEmployees();
        }
      }
    } catch (error) {
      showToast(error.response?.data?.message || "فشل في تغيير حالة المستخدم", "error");
    }
  };

  // فتح مودال التعديل
  const openEditModal = (user) => {
    setIsEditMode(true);
    setEditingUserId(user._id);
    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      confirmPassword: "",
      role: user.role || "Employee",
      isActive: user.isActive !== undefined ? user.isActive : true
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "Employee",
      isActive: true
    });
    setIsEditMode(false);
    setEditingUserId(null);
  };

  const getRoleBadge = (role) => {
    const roleConfig = USER_ROLES[role === "CompanyManager" ? "manager" : role === "Driver" ? "driver" : "employee"];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${roleConfig.color}`}>
        <i className={`fas ${roleConfig.icon} text-[10px]`}></i>
        {roleConfig.label}
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700">
        <i className="fas fa-check-circle text-[10px]"></i>
        نشط
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700">
        <i className="fas fa-ban text-[10px]"></i>
        غير نشط
      </span>
    );
  };

  // فلترة حسب البحث
  const filteredEmployees = users.filter(user => 
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  const filteredDrivers = drivers.filter(driver => 
    driver.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone?.includes(searchTerm)
  );

  const currentList = activeTab === "employees" ? filteredEmployees : filteredDrivers;
  const currentTitle = activeTab === "employees" ? "الموظفين" : "السائقين";
  const currentIcon = activeTab === "employees" ? "fa-users" : "fa-truck-fast";

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
    <div className="min-h-screen bg-gray-50 flex " dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 ${
            toast.type === "success" ? "bg-green-500 text-white" : 
            toast.type === "warning" ? "bg-orange-500 text-white" : "bg-red-500 text-white"
          }`}>
            <i className={`fas ${toast.type === "success" ? "fa-check-circle" : toast.type === "warning" ? "fa-exclamation-triangle" : "fa-exclamation-circle"}`}></i>
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
      <div className=" w-full  transition-all duration-300">
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
                      إدارة الموظفين
                    </h1>
                    <p className="text-gray-500 text-xs md:text-sm mt-1">
                      إدارة الموظفين والسائقين في الشركة
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => { resetForm(); setIsModalOpen(true); }}
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                >
                  <i className="fas fa-plus-circle group-hover:rotate-90 transition-transform duration-300"></i>
                  <span>إضافة {activeTab === "employees" ? "موظف" : "سائق"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm p-1 mb-6 flex gap-1">
              <button
                onClick={() => setActiveTab("employees")}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === "employees"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <i className="fas fa-users"></i>
                الموظفين
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === "employees" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {users.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("drivers")}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === "drivers"
                    ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <i className="fas fa-truck-fast"></i>
                السائقين
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === "drivers" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {drivers.length}
                </span>
              </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
              <div className="relative">
                <i className="fas fa-search absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder={`بحث عن ${currentTitle} (الاسم، البريد الإلكتروني، رقم الهاتف)...`}
                  className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Users Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentList.map((user) => (
                <div key={user._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  {/* Header */}
                  <div className={`p-4 ${
                    user.role === "Driver" 
                      ? "bg-gradient-to-r from-green-800 to-green-700" 
                      : user.role === "CompanyManager"
                      ? "bg-gradient-to-r from-purple-800 to-purple-700"
                      : "bg-gradient-to-r from-blue-800 to-blue-700"
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                          <i className={`fas ${
                            user.role === "Driver" ? "fa-truck" : 
                            user.role === "CompanyManager" ? "fa-user-cog" : "fa-user-tie"
                          } text-white text-xl`}></i>
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg">{user.fullName}</h3>
                          <p className="text-white/80 text-xs">{user.email}</p>
                        </div>
                      </div>
                      {getStatusBadge(user.isActive)}
                    </div>
                  </div>
                  
                  {/* Body */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">
                        <i className="fas fa-phone ml-2 text-gray-400"></i>
                        رقم الهاتف
                      </span>
                      <span className="font-medium text-gray-800 dir-ltr">{user.phone || '---'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">
                        <i className="fas fa-id-badge ml-2 text-gray-400"></i>
                        الدور
                      </span>
                      {getRoleBadge(user.role)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">
                        <i className="fas fa-calendar-alt ml-2 text-gray-400"></i>
                        تاريخ الإضافة
                      </span>
                      <span className="text-xs text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="border-t border-gray-100 p-3 flex justify-between gap-2">
                    <button
                      onClick={() => toggleUserStatus(user._id, user.isActive, user.role)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
                        user.isActive 
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      <i className={`fas ${user.isActive ? 'fa-ban' : 'fa-check-circle'}`}></i>
                      {user.isActive ? 'تعطيل' : 'تفعيل'}
                    </button>
                    
                    <button
                      onClick={() => openEditModal(user)}
                      className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-edit"></i>
                      تعديل
                    </button>
                    
                    <button
                      onClick={() => { setUserToDelete(user); setShowDeleteConfirm(true); }}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
                        user.role === "CompanyManager" 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                      disabled={user.role === "CompanyManager"}
                      title={user.role === "CompanyManager" ? "لا يمكن حذف مدير الشركة" : "حذف"}
                    >
                      <i className="fas fa-trash-alt"></i>
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {currentList.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl">
                <i className={`fas ${currentIcon} text-6xl text-gray-300 mb-4`}></i>
                <p className="text-gray-400 font-bold">لا يوجد {currentTitle}</p>
                <button 
                  onClick={() => { resetForm(); setIsModalOpen(true); }}
                  className="mt-4 text-blue-600 font-bold hover:text-blue-700 transition"
                >
                  <i className="fas fa-plus-circle ml-1"></i>
                  أضف {activeTab === "employees" ? "موظف جديد" : "سائق جديد"}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {isEditMode ? "تعديل المستخدم" : `إضافة ${activeTab === "employees" ? "موظف جديد" : "سائق جديد"}`}
                </h2>
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>
            
            <form onSubmit={isEditMode ? handleUpdateUser : handleCreateUser} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-user ml-1 text-blue-500"></i>
                    الاسم الكامل
                  </label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                    value={formData.fullName} 
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                    required
                    placeholder="مثال: أحمد محمد"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-envelope ml-1 text-green-500"></i>
                    البريد الإلكتروني
                  </label>
                  <input 
                    type="email" 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    required
                    placeholder="example@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-phone ml-1 text-purple-500"></i>
                    رقم الهاتف
                  </label>
                  <input 
                    type="tel" 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    required
                    placeholder="09xxxxxxxx"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-id-card ml-1 text-amber-500"></i>
                    الدور الوظيفي
                  </label>
                  <select 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                    value={formData.role} 
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    disabled={isEditMode && editingUserId === localStorage.getItem('id')}
                  >
                    <option value="Employee">موظف</option>
                    <option value="CompanyManager">مدير</option>
                    <option value="Driver">سائق</option>
                  </select>
                  {isEditMode && editingUserId === localStorage.getItem('id') && (
                    <p className="text-xs text-amber-600 mt-1">لا يمكن تغيير دور المستخدم الحالي</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-lock ml-1 text-red-500"></i>
                    {isEditMode ? "كلمة المرور الجديدة (اختياري)" : "كلمة المرور"}
                  </label>
                  <input 
                    type="password" 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    required={!isEditMode}
                    placeholder="********"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-check-circle ml-1 text-green-500"></i>
                    تأكيد كلمة المرور
                  </label>
                  <input 
                    type="password" 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                    value={formData.confirmPassword} 
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                    required={!isEditMode && !!formData.password}
                    placeholder="********"
                  />
                </div>
              </div>

              {/* حالة المستخدم - تظهر فقط في وضع التعديل */}
              {isEditMode && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-toggle-on ml-1 text-gray-500"></i>
                    حالة المستخدم
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="true"
                        checked={formData.isActive === true}
                        onChange={() => setFormData({...formData, isActive: true})}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">نشط</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="false"
                        checked={formData.isActive === false}
                        onChange={() => setFormData({...formData, isActive: false})}
                        className="w-4 h-4 text-red-600"
                      />
                      <span className="text-sm">غير نشط</span>
                    </label>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-bold hover:shadow-lg transition"
                >
                  <i className="fas fa-save ml-2"></i>
                  {isEditMode ? "تحديث" : "حفظ"}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); resetForm(); }} 
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">
              هل أنت متأكد من حذف {userToDelete?.role === "Driver" ? "السائق" : "الموظف"} 
              "<span className="font-bold">{userToDelete?.fullName}</span>"؟
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold hover:bg-red-700 transition">
                حذف
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl font-bold hover:bg-gray-200 transition">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

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
        .dir-ltr {
          direction: ltr;
        }
      `}</style>
    </div>
  );
};

export default EmployeesManagement;