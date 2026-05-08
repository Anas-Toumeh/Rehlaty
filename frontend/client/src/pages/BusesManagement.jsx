// pages/Manager/BusesManagement.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ManagerSidebar from "../components/Manager/ManagerSidebar";
import API from "../api/axiosConfig";

const BusesManagement = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBusId, setEditingBusId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [busToDelete, setBusToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [buses, setBuses] = useState([]);
  const companyId = localStorage.getItem('companyId');

  // خيارات نوع الباص
  const BUS_TYPES = [
    { value: "VIP", label: "VIP", color: "bg-purple-100 text-purple-700" },
    { value: "Normal", label: "عادي", color: "bg-blue-100 text-blue-700" },
    { value: "Luxury", label: "فاخر", color: "bg-amber-100 text-amber-700" }
  ];

  // خيارات الميزات الإضافية
  const FEATURES_OPTIONS = [
    { value: "مكيف", label: "مكيف", icon: "fa-snowflake" },
    { value: "واي فاي", label: "واي فاي", icon: "fa-wifi" },
    { value: "شاشات", label: "شاشات", icon: "fa-tv" },
    { value: "مرحاض", label: "مرحاض", icon: "fa-toilet" },
    { value: "مشروبات", label: "مشروبات", icon: "fa-coffee" },
    { value: "شاحن", label: "شاحن", icon: "fa-charging-station" },
    { value: "موسيقى", label: "موسيقى", icon: "fa-headphones" },
    { value: "إنترنت", label: "إنترنت", icon: "fa-globe" }
  ];

  const [formData, setFormData] = useState({
    busNumber: "",
    plateNumber: "",
    capacity: "",
    busType: "Normal",
    features: [],
    isActive: true
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // جلب الباصات
  const fetchBuses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      
      const response = await API.get("/company/buses", { params });
      
      if (response.data.success) {
        setBuses(response.data.buses || []);
      } else {
        setBuses([]);
      }
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || "حدث خطأ في تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  // إنشاء باص جديد
  const handleCreateBus = async (e) => {
    e.preventDefault();
    try {
      const busData = {
        busNumber: formData.busNumber,
        plateNumber: formData.plateNumber,
        capacity: Number(formData.capacity),
        busType: formData.busType,
        features: formData.features,
        companyId: companyId,
        isActive: true
      };
      
      const response = await API.post("/company/buses", busData);
      
      if (response.data.success) {
        showToast("تم إضافة الحافلة بنجاح", "success");
        setIsModalOpen(false);
        resetForm();
        fetchBuses();
      }
    } catch (error) {
      showToast(error.response?.data?.message || "فشل في إنشاء الحافلة", "error");
    }
  };

  // تعديل باص
  const handleUpdateBus = async (e) => {
    e.preventDefault();
    try {
      const busData = {
        busNumber: formData.busNumber,
        plateNumber: formData.plateNumber,
        capacity: Number(formData.capacity),
        busType: formData.busType,
        features: formData.features,
        isActive: formData.isActive
      };
      
      const response = await API.put(`/company/buses/${editingBusId}`, busData);
      
      if (response.data.success) {
        showToast("تم تعديل الحافلة بنجاح", "success");
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingBusId(null);
        resetForm();
        fetchBuses();
      }
    } catch (error) {
      showToast(error.response?.data?.message || "فشل في تعديل الحافلة", "error");
    }
  };

  // حذف باص
  const handleDelete = async () => {
    try {
      const response = await API.delete(`/company/buses/${busToDelete._id}`);
      
      if (response.data.success) {
        showToast("تم حذف الحافلة بنجاح", "success");
        setShowDeleteConfirm(false);
        fetchBuses();
      }
    } catch (error) {
      showToast(error.response?.data?.message || "فشل في الحذف", "error");
    }
  };

  // فتح مودال التعديل
  const openEditModal = async (bus) => {
    setIsEditMode(true);
    setEditingBusId(bus._id);
    setFormData({
      busNumber: bus.busNumber || "",
      plateNumber: bus.plateNumber || "",
      capacity: bus.capacity || "",
      busType: bus.busType || "Normal",
      features: bus.features || [],
      isActive: bus.isActive !== undefined ? bus.isActive : true
    });
    setIsModalOpen(true);
  };

  // تبديل حالة الباص (نشط/غير نشط)
  const toggleBusStatus = async (busId, currentStatus) => {
    try {
      const response = await API.patch(`/company/buses/${busId}/toggle-status`, {
        isActive: !currentStatus
      });
      
      if (response.data.success) {
        showToast(`تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} الحافلة بنجاح`, "success");
        fetchBuses();
      }
    } catch (error) {
      showToast(error.response?.data?.message || "فشل في تغيير حالة الحافلة", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      busNumber: "",
      plateNumber: "",
      capacity: "",
      busType: "Normal",
      features: [],
      isActive: true
    });
    setIsEditMode(false);
    setEditingBusId(null);
  };

  const getBusTypeBadge = (type) => {
    const typeConfig = BUS_TYPES.find(t => t.value === type) || BUS_TYPES[1];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${typeConfig.color}`}>
        {typeConfig.label}
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

  // تبديل اختيار الميزات
  const toggleFeature = (feature) => {
    setFormData(prev => {
      if (prev.features.includes(feature)) {
        return { ...prev, features: prev.features.filter(f => f !== feature) };
      } else {
        return { ...prev, features: [...prev.features, feature] };
      }
    });
  };

  useEffect(() => {
    fetchBuses();
  }, [searchTerm]);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen]);

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
    <div className="min-h-screen flex bg-gray-50" dir="rtl">
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
      <div className="lg:mr-10 transition-all duration-300">
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
                      إدارة الحافلات
                    </h1>
                    <p className="text-gray-500 text-xs md:text-sm mt-1">
                      إضافة وتعديل وإدارة أسطول الحافلات
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => { resetForm(); setIsModalOpen(true); }}
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                >
                  <i className="fas fa-plus-circle group-hover:rotate-90 transition-transform duration-300"></i>
                  <span>حافلة جديدة</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Search */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
              <div className="relative">
                <i className="fas fa-search absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="بحث عن حافلة (رقم الحافلة، لوحة السيارة)..."
                  className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Buses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {buses.map((bus) => (
                <div key={bus._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  {/* Header with bus number and status */}
                  <div className="bg-gradient-to-r from-blue-800 to-blue-700 p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-bus text-white text-xl"></i>
                        <span className="text-white font-bold text-lg">{bus.busNumber}</span>
                      </div>
                      {getStatusBadge(bus.isActive)}
                    </div>
                  </div>
                  
                  {/* Body */}
                  <div className="p-4 space-y-3">
                    {/* Plate Number */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">لوحة السيارة:</span>
                      <span className="font-bold text-gray-800">{bus.plateNumber || '---'}</span>
                    </div>
                    
                    {/* Capacity */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">عدد المقاعد:</span>
                      <span className="font-bold text-gray-800">
                        <i className="fas fa-chair ml-1 text-gray-400"></i>
                        {bus.capacity} مقعد
                      </span>
                    </div>
                    
                    {/* Bus Type */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">نوع الحافلة:</span>
                      {getBusTypeBadge(bus.busType)}
                    </div>
                    
                    {/* Features */}
                    {bus.features && bus.features.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-gray-500 text-xs mb-2">الميزات:</p>
                        <div className="flex flex-wrap gap-1">
                          {bus.features.map((feature, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                              <i className={`fas ${
                                feature === 'مكيف' ? 'fa-snowflake' :
                                feature === 'واي فاي' ? 'fa-wifi' :
                                feature === 'شاشات' ? 'fa-tv' :
                                feature === 'مرحاض' ? 'fa-toilet' :
                                feature === 'مشروبات' ? 'fa-coffee' :
                                feature === 'شاحن' ? 'fa-charging-station' :
                                feature === 'موسيقى' ? 'fa-headphones' :
                                'fa-star'
                              } text-[10px]`}></i>
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="border-t border-gray-100 p-3 flex justify-between gap-2">
                    <button
                      onClick={() => toggleBusStatus(bus._id, bus.isActive)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
                        bus.isActive 
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      <i className={`fas ${bus.isActive ? 'fa-ban' : 'fa-check-circle'}`}></i>
                      {bus.isActive ? 'تعطيل' : 'تفعيل'}
                    </button>
                    
                    <button
                      onClick={() => openEditModal(bus)}
                      className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-edit"></i>
                      تعديل
                    </button>
                    
                    <button
                      onClick={() => { setBusToDelete(bus); setShowDeleteConfirm(true); }}
                      className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-trash-alt"></i>
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {buses.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl">
                <i className="fas fa-bus text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-400 font-bold">لا توجد حافلات</p>
                <button 
                  onClick={() => { resetForm(); setIsModalOpen(true); }}
                  className="mt-4 text-blue-600 font-bold hover:text-blue-700 transition"
                >
                  <i className="fas fa-plus-circle ml-1"></i>
                  أضف حافلة جديدة
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add/Edit Bus Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {isEditMode ? "تعديل الحافلة" : "إضافة حافلة جديدة"}
                </h2>
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>
            
            <form onSubmit={isEditMode ? handleUpdateBus : handleCreateBus} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-bus ml-1 text-blue-500"></i>
                    رقم الحافلة
                  </label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                    value={formData.busNumber} 
                    onChange={(e) => setFormData({...formData, busNumber: e.target.value})} 
                    required
                    placeholder="مثال: BUS001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-id-card ml-1 text-green-500"></i>
                    لوحة السيارة
                  </label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                    value={formData.plateNumber} 
                    onChange={(e) => setFormData({...formData, plateNumber: e.target.value})} 
                    required
                    placeholder="مثال: ABC 123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-chair ml-1 text-purple-500"></i>
                    عدد المقاعد
                  </label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                    value={formData.capacity} 
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})} 
                    required
                    min="10"
                    max="60"
                    placeholder="مثال: 45"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-tag ml-1 text-amber-500"></i>
                    نوع الحافلة
                  </label>
                  <select 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                    value={formData.busType} 
                    onChange={(e) => setFormData({...formData, busType: e.target.value})}
                  >
                    {BUS_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* الميزات الإضافية */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  <i className="fas fa-star ml-1 text-yellow-500"></i>
                  الميزات الإضافية
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {FEATURES_OPTIONS.map(feature => (
                    <button
                      key={feature.value}
                      type="button"
                      onClick={() => toggleFeature(feature.value)}
                      className={`p-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
                        formData.features.includes(feature.value)
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <i className={`fas ${feature.icon}`}></i>
                      {feature.label}
                    </button>
                  ))}
                </div>
                {formData.features.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    <i className="fas fa-check-circle text-green-500 ml-1"></i>
                    تم اختيار {formData.features.length} ميزة
                  </p>
                )}
              </div>

              {/* حالة الحافلة - تظهر فقط في وضع التعديل */}
              {isEditMode && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-toggle-on ml-1 text-gray-500"></i>
                    حالة الحافلة
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
                  {isEditMode ? "تحديث الحافلة" : "حفظ الحافلة"}
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
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف الحافلة "{busToDelete?.busNumber}"؟</p>
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

      <style jsx={true}>{`
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

export default BusesManagement;