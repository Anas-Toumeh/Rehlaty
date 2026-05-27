// pages/Manager/TripsManagement.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ManagerSidebar from "../components/Manager/ManagerSidebar";
import API from "../api/axiosConfig";

// List of cities
const CITIES = [
  { value: "دمشق", label: "دمشق" },
  { value: "حلب", label: "حلب" },
  { value: "حماه", label: "حماه" },
  { value: "إدلب", label: "إدلب" },
  { value: "حمص", label: "حمص" },
  { value: "اللاذقية", label: "اللاذقية" },
  { value: "طرطوس", label: "طرطوس" },
  { value: "الرقة", label: "الرقة" },
  { value: "القامشلي", label: "القامشلي" },
  { value: "الحسكة", label: "الحسكة" },
  { value: "دير الزور", label: "دير الزور" }
];

const TripsManagement = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTripId, setEditingTripId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [trips, setTrips] = useState([]);
  const companyId = localStorage.getItem('companyId');
  const id = localStorage.getItem('id');
  
  // Available resources for adding
  const [availableBuses, setAvailableBuses] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  
  // Store current trip driver and bus
  const [currentTripDetails, setCurrentTripDetails] = useState({
    currentDriverId: null,
    currentDriverName: "",
    currentBusId: null,
    currentBusNumber: ""
  });

  const [formData, setFormData] = useState({
    from: "",
    to: "",
    departureTime: "",
    arrivalTime: "",
    driverId: "",
    busId: "",
    price: "",
    notes: "",
    status: "Scheduled"
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch trips
  const fetchTrips = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (searchTerm) params.search = searchTerm;
      
      const response = await API.get("/trips", { params });
      
      if (response.data.success) {
        const formattedTrips = response.data.trips.map(trip => ({
          _id: trip._id,
          from: trip.from,
          to: trip.to,
          date: trip.departureTime ? new Date(trip.departureTime).toISOString().split('T')[0] : '',
          time: trip.departureTime ? new Date(trip.departureTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '',
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          driverId: trip.driverId?._id,
          driverName: trip.driverId?.fullName || trip.driverName || 'غير محدد',
          busId: trip.busId?._id,
          busNumber: trip.busId?.busNumber || '',
          plateNumber: trip.busId?.plateNumber,
          price: trip.price,
          totalSeats: trip.totalSeats,
          availableSeats: trip.availableSeatsCount || trip.availableSeats,
          notes: trip.notes,
          status: trip.status || 'Scheduled',
          route: trip.route
        }));
        setTrips(formattedTrips);
      } else {
        setTrips([]);
      }
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || "حدث خطأ في تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch available resources (to add new trip)
  const fetchAvailableResources = async (departureTime, from) => {
    if (!departureTime || !from) {
      return;
    }
    
    try {
      setLoadingResources(true);
      const formattedTime = new Date(departureTime).toISOString();
      
      const response = await API.get("/trips/available-resources", {
        params: { 
          companyId: companyId,
          departureTime: formattedTime,
          from: from 
        }
      });
      
      if (response.data.success) {
        setAvailableDrivers(response.data.drivers || []);
        setAvailableBuses(response.data.buses || []);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setAvailableDrivers([]);
      setAvailableBuses([]);
    } finally {
      setLoadingResources(false);
    }
  };

  // ✅ Fetch trip for editing (ensuring display of current driver and bus)
  const fetchTripForEdit = async (tripId) => {
    try {
      setLoadingResources(true);
      const response = await API.get(`/trips/${tripId}`);
      
      if (response.data.success) {
        const trip = response.data.trip;
        
        // Store current driver information
        const currentDriverId = trip.driverId?._id || null;
        const currentDriverName = trip.driverId?.fullName || trip.driverName || 'غير محدد';
        const currentDriverPhone = trip.driverId?.phone || '';
        
        // Store current bus information
        const currentBusId = trip.busId?._id || null;
        const currentBusNumber = trip.busId?.busNumber || trip.busNumber || 'غير محدد';
        const currentBusPlate = trip.busId?.plateNumber || '';
        const currentBusCapacity = trip.busId?.capacity || trip.totalSeats || 45;
        
        setCurrentTripDetails({
          currentDriverId: currentDriverId,
          currentDriverName: currentDriverName,
          currentBusId: currentBusId,
          currentBusNumber: currentBusNumber
        });
        
        // ✅ Build driver list - add current driver first
        let driversList = [];
        
        // Add current driver if found
        if (currentDriverId) {
          driversList.push({
            _id: currentDriverId,
            name: currentDriverName,
            fullName: currentDriverName,
            phone: currentDriverPhone,
            isCurrent: true
          });
        }
        
        // Attempt to fetch other drivers
        try {
          const formattedTime = trip.departureTime ? new Date(trip.departureTime).toISOString() : null;
          const resourcesResponse = await API.get("/trips/available-resources", {
            params: { 
              companyId: companyId,
              departureTime: formattedTime,
              from: trip.from 
            }
          });
          
          if (resourcesResponse.data.success) {
            const otherDrivers = resourcesResponse.data.drivers || [];
            otherDrivers.forEach(driver => {
              // Don't add the current driver again
              if (driver._id !== currentDriverId) {
                driversList.push({
                  ...driver,
                  name: driver.name || driver.fullName,
                  isCurrent: false
                });
              }
            });
          }
        } catch (err) {
          console.log('No other drivers available');
        }
        
        // ✅ Build bus list - add current bus first
        let busesList = [];
        
        // Add current bus if found
        if (currentBusId) {
          busesList.push({
            _id: currentBusId,
            busNumber: currentBusNumber,
            plateNumber: currentBusPlate,
            capacity: currentBusCapacity,
            totalSeats: currentBusCapacity,
            isCurrent: true
          });
        }
        
        // Attempt to fetch other buses
        try {
          const formattedTime = trip.departureTime ? new Date(trip.departureTime).toISOString() : null;
          const resourcesResponse = await API.get("/trips/available-resources", {
            params: { 
              companyId: companyId,
              departureTime: formattedTime,
              from: trip.from 
            }
          });
          
          if (resourcesResponse.data.success) {
            const otherBuses = resourcesResponse.data.buses || [];
            otherBuses.forEach(bus => {
              // Don't add the current bus again
              if (bus._id !== currentBusId) {
                busesList.push({
                  ...bus,
                  isCurrent: false
                });
              }
            });
          }
        } catch (err) {
          console.log('No other buses available');
        }
        
        // Assign lists
        setAvailableDrivers(driversList);
        setAvailableBuses(busesList);
        
        // Fill form with current data
        setFormData({
          from: trip.from || "",
          to: trip.to || "",
          departureTime: trip.departureTime ? new Date(trip.departureTime).toISOString().slice(0, 16) : "",
          arrivalTime: trip.arrivalTime ? new Date(trip.arrivalTime).toISOString().slice(0, 16) : "",
          driverId: currentDriverId || "",
          busId: currentBusId || "",
          price: trip.price || "",
          notes: trip.notes || "",
          status: trip.status || "Scheduled"
        });
      }
    } catch (error) {
      console.error('Error fetching trip for edit:', error);
      showToast("فشل في تحميل بيانات الرحلة", "error");
    } finally {
      setLoadingResources(false);
    }
  };

  // Update trip status
  const updateTripStatus = async (tripId, newStatus) => {
    try {
      const response = await API.patch(`/company/${tripId}/status`, { 
        status: newStatus 
      });
      
      if (response.data.success) {
        const statusText = newStatus === 'OnWay' ? 'في الطريق' : 
                          newStatus === 'Completed' ? 'مكتملة' : 
                          newStatus === 'Scheduled' ? 'مجدولة' : 'ملغية';
        showToast(`تم تغيير حالة الرحلة إلى ${statusText}`, "success");
        fetchTrips();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast(error.response?.data?.message || "فشل في تحديث الحالة", "error");
    }
  };

  // Create new trip
  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      const tripData = {
        from: formData.from,
        to: formData.to,
        departureTime: formData.departureTime,
        arrivalTime: formData.arrivalTime,
        driverId: formData.driverId || null,
        busId: formData.busId,
        price: Number(formData.price),
        notes: formData.notes,
        status: "Scheduled",
        companyId: companyId,
        createdBy: id
      };
      
      const response = await API.post("/trips", tripData);
      
      if (response.data.success) {
        showToast("تم إضافة الرحلة بنجاح", "success");
        setIsModalOpen(false);
        resetForm();
        fetchTrips();
      }
    } catch (error) {
      showToast(error.response?.data?.message || "فشل في إنشاء الرحلة", "error");
    }
  };

  // Update trip
  const handleUpdateTrip = async (e) => {
    e.preventDefault();
    try {
      const tripData = {
        from: formData.from,
        to: formData.to,
        departureTime: formData.departureTime,
        arrivalTime: formData.arrivalTime,
        driverId: formData.driverId || null,
        busId: formData.busId,
        price: Number(formData.price),
        notes: formData.notes,
        status: formData.status
      };
      
      const response = await API.put(`/trips/${editingTripId}`, tripData);
      
      if (response.data.success) {
        showToast("تم تعديل الرحلة بنجاح", "success");
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingTripId(null);
        resetForm();
        fetchTrips();
      } else {
        showToast(response.data.message || "فشل في تعديل الرحلة", "error");
      }
    } catch (error) {
      showToast(error.response?.data?.message || "فشل في تعديل الرحلة", "error");
    }
  };

  // Delete trip
  const handleDelete = async () => {
    try {
      const response = await API.delete(`/trips/${tripToDelete._id}`);
      
      if (response.data.success) {
        showToast("تم حذف الرحلة بنجاح", "success");
        setShowDeleteConfirm(false);
        fetchTrips();
      } else {
        showToast(response.data.message || "فشل في الحذف", "error");
      }
    } catch (error) {
      showToast(error.response?.data?.message || "فشل في الحذف", "error");
    }
  };

  // Open edit modal
  const openEditModal = async (trip) => {
    setIsEditMode(true);
    setEditingTripId(trip._id);
    await fetchTripForEdit(trip._id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      from: "",
      to: "",
      departureTime: "",
      arrivalTime: "",
      driverId: "",
      busId: "",
      price: "",
      notes: "",
      status: "Scheduled"
    });
    setAvailableBuses([]);
    setAvailableDrivers([]);
    setCurrentTripDetails({
      currentDriverId: null,
      currentDriverName: "",
      currentBusId: null,
      currentBusNumber: ""
    });
    setIsEditMode(false);
    setEditingTripId(null);
  };

  const getStatusText = (status) => {
    const statusMap = {
      'Scheduled': "مجدولة",
      'OnWay': "في الطريق",
      'Completed': "مكتملة",
      'Cancelled': "ملغية",
      'scheduled': "مجدولة",
      'ongoing': "في الطريق",
      'completed': "مكتملة",
      'cancelled': "ملغية"
    };
    return statusMap[status] || status;
  };

  const getStatusBadge = (status) => {
    const normalizedStatus = status === 'OnWay' ? 'ongoing' : 
                            status === 'Scheduled' ? 'scheduled' :
                            status === 'Completed' ? 'completed' : 'cancelled';
    
    const styles = {
      scheduled: "bg-amber-100 text-amber-700",
      ongoing: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700"
    };
    const icons = {
      scheduled: "fa-clock",
      ongoing: "fa-play-circle",
      completed: "fa-check-circle",
      cancelled: "fa-times-circle"
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${styles[normalizedStatus]}`}>
        <i className={`fas ${icons[normalizedStatus]} text-[10px]`}></i>
        {getStatusText(status)}
      </span>
    );
  };

  useEffect(() => {
    fetchTrips();
  }, [filterStatus, searchTerm]);

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

  useEffect(() => {
    if (formData.departureTime && formData.from && !isEditMode) {
      const timer = setTimeout(() => {
        fetchAvailableResources(formData.departureTime, formData.from);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.departureTime, formData.from, isEditMode]);

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
    <div className="min-h-screen bg-gray-50 flex font-tajawal w-full" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed w-full top-5 left-1/2 transform -translate-x-1/2 z-[99999] animate-slide-down">
          <div className={`mx-auto max-w-md px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 ${
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
                      إدارة الرحلات
                    </h1>
                    <p className="text-gray-500 text-xs md:text-sm mt-1">
                      إضافة وتعديل وجدولة رحلات النقل
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => { resetForm(); setIsModalOpen(true); }}
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                >
                  <i className="fas fa-plus-circle group-hover:rotate-90 transition-transform duration-300"></i>
                  <span>رحلة جديدة</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <i className="fas fa-search absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="بحث عن رحلة (من، إلى)..."
                      className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                  {["all", "Scheduled", "OnWay", "Completed"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status === "all" ? "all" : status)}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition whitespace-nowrap ${
                        filterStatus === status || (status === "all" && filterStatus === "all")
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {status === "all" ? "الكل" : getStatusText(status)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Trips Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right min-w-[900px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500">الخط</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500">التاريخ والوقت</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500">السائق</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500">الحافلة</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500">السعر</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500">المقاعد</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500">الحالة</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trips.map((trip) => (
                      <tr key={trip._id} className="hover:bg-gray-50 transition group">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-gray-800">{trip.from} → {trip.to}</p>
                            {trip.notes && (
                              <p className="text-xs text-gray-500 mt-1">{trip.notes}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-800">{trip.date}</p>
                          <p className="text-xs text-gray-500 mt-1">{trip.time}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-800">{trip.driverName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-800">{trip.busNumber || trip.plateNumber || '---'}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800">
                          {trip.price} ل.س
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-gray-800">{trip.availableSeats || trip.totalSeats} / {trip.totalSeats}</p>
                            <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1">
                              <div 
                                className="h-1.5 bg-blue-600 rounded-full"
                                style={{ width: `${((trip.totalSeats - (trip.availableSeats || trip.totalSeats)) / trip.totalSeats) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(trip.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            {trip.status === "Scheduled" && (
                              <button
                                onClick={() => updateTripStatus(trip._id, "OnWay")}
                                className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition"
                                title="بدء الرحلة"
                              >
                                <i className="fas fa-play"></i>
                              </button>
                            )}
                            
                            {trip.status === "OnWay" && (
                              <button
                                onClick={() => updateTripStatus(trip._id, "Completed")}
                                className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition"
                                title="إنهاء الرحلة"
                              >
                                <i className="fas fa-flag-checkered"></i>
                              </button>
                            )}
                            
                            {trip.status == "Scheduled"  && (
                              <button
                                onClick={() => openEditModal(trip)}
                                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                title="تعديل الرحلة"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            )}
                            
                            {trip.status === "Scheduled" && (
                              <button
                                onClick={() => { setTripToDelete(trip); setShowDeleteConfirm(true); }}
                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                                title="حذف الرحلة"
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {trips.length === 0 && (
                <div className="text-center py-16">
                  <i className="fas fa-bus text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-400 font-bold">لا توجد رحلات</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add/Edit Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {isEditMode ? "تعديل الرحلة" : "إضافة رحلة جديدة"}
                </h2>
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>
            
            <form onSubmit={isEditMode ? handleUpdateTrip : handleCreateTrip} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-location-dot ml-1 text-blue-500"></i>
                    من
                  </label>
                  <select 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                    value={formData.from} 
                    onChange={(e) => setFormData({...formData, from: e.target.value})} 
                    required
                  >
                    <option value="">اختر مدينة المغادرة</option>
                    {CITIES.map(city => (
                      <option key={city.value} value={city.value}>
                        {city.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-location-dot ml-1 text-red-500"></i>
                    إلى
                  </label>
                  <select 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                    value={formData.to} 
                    onChange={(e) => setFormData({...formData, to: e.target.value})} 
                    required
                  >
                    <option value="">اختر مدينة الوصول</option>
                    {CITIES.map(city => (
                      <option key={city.value} value={city.value}>
                        {city.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-calendar-alt ml-1 text-blue-500"></i>
                    وقت المغادرة
                  </label>
                  <input 
                    type="datetime-local" 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                    value={formData.departureTime} 
                    onChange={(e) => setFormData({...formData, departureTime: e.target.value})} 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-calendar-check ml-1 text-green-500"></i>
                    وقت الوصول
                  </label>
                  <input 
                    type="datetime-local" 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                    value={formData.arrivalTime} 
                    onChange={(e) => setFormData({...formData, arrivalTime: e.target.value})} 
                    required
                  />
                </div>
              </div>

              {/* Display current driver and bus information in edit mode */}
              {isEditMode && (
                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-sm font-bold text-blue-800 mb-2">📋 المعلومات الحالية:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-600">السائق الحالي:</span>
                      <p className="font-bold text-gray-800">{currentTripDetails.currentDriverName}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">الباص الحالي:</span>
                      <p className="font-bold text-gray-800">{currentTripDetails.currentBusNumber || 'غير محدد'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">يمكنك تغيير السائق أو الباص من القوائم أدناه</p>
                </div>
              )}

              {/* Available resources statistics - only for adding */}
              {(availableDrivers.length > 0 || availableBuses.length > 0) && !isEditMode && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div className="text-center flex-1">
                      <div className="text-2xl font-bold text-blue-600">{availableDrivers.length}</div>
                      <div className="text-xs text-gray-600">
                        <i className="fas fa-user ml-1"></i>
                        سائق متاح
                      </div>
                    </div>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div className="text-center flex-1">
                      <div className="text-2xl font-bold text-indigo-600">{availableBuses.length}</div>
                      <div className="text-xs text-gray-600">
                        <i className="fas fa-bus ml-1"></i>
                        باص متاح
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Drivers list */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-user-circle ml-1 text-green-500"></i>
                    السائق
                    {isEditMode && <span className="text-xs text-gray-400 mr-2">(اختر سائق جديد أو اترك الحالي)</span>}
                  </label>
                  <select 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                    value={formData.driverId || ""} 
                    onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                    disabled={loadingResources}
                  >
                    <option value="">-- اختر السائق --</option>
                    {/* Display current driver first in edit mode */}
                    {isEditMode && currentTripDetails.currentDriverId && (
                      <option value={currentTripDetails.currentDriverId} className="text-blue-600 font-bold">
                        {currentTripDetails.currentDriverName} (الحالي)
                      </option>
                    )}
                    {/* Display remaining drivers */}
                    {availableDrivers
                      .filter(driver => !isEditMode || driver._id !== currentTripDetails.currentDriverId)
                      .map(driver => (
                        <option key={driver._id} value={driver._id}>
                          {driver.name || driver.fullName} 
                          {driver.phone && ` - ${driver.phone}`}
                        </option>
                      ))}
                  </select>
                  {loadingResources && (
                    <p className="text-xs text-gray-400 mt-1">جاري تحميل السائقين...</p>
                  )}
                </div>

                {/* Buses list */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-bus ml-1 text-purple-500"></i>
                    الحافلة
                    {isEditMode && <span className="text-xs text-gray-400 mr-2">(اختر باص جديد أو اترك الحالي)</span>}
                  </label>
                  <select 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                    value={formData.busId || ""} 
                    onChange={(e) => {
                      const bus = availableBuses.find(b => b._id === e.target.value);
                      setFormData({
                        ...formData, 
                        busId: e.target.value,
                      });
                    }}
                    required
                    disabled={loadingResources}
                  >
                    <option value="">-- اختر الحافلة --</option>
                    {/* Display current bus first in edit mode */}
                    {isEditMode && currentTripDetails.currentBusId && (
                      <option value={currentTripDetails.currentBusId} className="text-blue-600 font-bold">
                        {currentTripDetails.currentBusNumber} (الحالي)
                      </option>
                    )}
                    {/* Display remaining buses */}
                    {availableBuses
                      .filter(bus => !isEditMode || bus._id !== currentTripDetails.currentBusId)
                      .map(bus => (
                        <option key={bus._id} value={bus._id}>
                          {bus.busNumber} - {bus.plateNumber} ({bus.totalSeats || bus.capacity} مقعد)
                        </option>
                      ))}
                  </select>
                  {loadingResources && (
                    <p className="text-xs text-gray-400 mt-1">جاري تحميل الحافلات...</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-tag ml-1 text-yellow-500"></i>
                    سعر التذكرة (ل.س)
                  </label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})} 
                    required
                    placeholder="مثال: 50000"
                  />
                </div>
                
                {isEditMode && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      <i className="fas fa-info-circle ml-1 text-gray-500"></i>
                      الحالة
                    </label>
                    <select 
                      className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                      value={formData.status} 
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Scheduled">مجدولة</option>
                      <option value="OnWay">في الطريق</option>
                      <option value="Completed">مكتملة</option>
                      <option value="Cancelled">ملغية</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <i className="fas fa-pen ml-1 text-gray-500"></i>
                  ملاحظات
                </label>
                <textarea 
                  className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition outline-none"
                  rows="3"
                  value={formData.notes} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="ملاحظات إضافية عن الرحلة..."
                ></textarea>
              </div>

              {!isEditMode && (
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.departureTime && formData.from) {
                        fetchAvailableResources(formData.departureTime, formData.from);
                      } else {
                        showToast("الرجاء إدخال مدينة المغادرة ووقت المغادرة أولاً", "warning");
                      }
                    }}
                    className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
                  >
                    <i className="fas fa-sync-alt ml-2"></i>
                    تحديث الباصات والسائقين المتاحين
                  </button>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-bold hover:shadow-lg transition"
                  disabled={loadingResources}
                >
                  <i className="fas fa-save ml-2"></i>
                  {isEditMode ? "تحديث الرحلة" : "حفظ الرحلة"}
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
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف رحلة "{tripToDelete?.from} → {tripToDelete?.to}"؟</p>
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
      `}</style>
    </div>
  );
};

export default TripsManagement;