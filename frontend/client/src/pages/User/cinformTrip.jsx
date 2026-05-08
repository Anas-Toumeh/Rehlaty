import { React, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axiosConfig";

export default function Cinform() {
  const params = useParams();
  const navigate = useNavigate();
  const { tripId } = params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [trip, setTrip] = useState(null);
  const [seatsCount, setSeatsCount] = useState(1);
  
  // ✅ تغيير هيكل بيانات الركاب إلى مصفوفة
  const [passengers, setPassengers] = useState([
    { fullName: "", nationalId: "", phone: "" }
  ]);

  // جلب بيانات الرحلة من الـ API
  useEffect(() => {
    const fetchTripData = async () => {
      if (!tripId) {
        console.error("No ID found in URL");
        alert("معرّف الرحلة غير موجود");
        navigate('/user/dashboard');
        return;
      }

      try {
        setLoading(true);
        const response = await API.get(`/trips/${tripId}`);
        
        if (response.data.success) {
          const tripData = response.data.trip;
          setTrip({
            _id: tripData._id,
            companyName: tripData.companyId?.name || "شركة النقل",
            logo: tripData.companyId?.logo,
            from: tripData.from,
            to: tripData.to,
            departureTime: tripData.departureTime,
            arrivalTime: tripData.arrivalTime,
            price: tripData.price,
            availableSeats: tripData.availableSeats || tripData.totalSeats || 45,
            totalSeats: tripData.totalSeats
          });
        } else {
          alert("حدث خطأ في تحميل بيانات الرحلة");
          navigate('/user/dashboard');
        }
      } catch (error) {
        console.error("Error fetching trip:", error);
        alert("فشل في تحميل بيانات الرحلة");
        navigate('/user/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId, navigate]);

  // ✅ تحديث عدد المقاعد وإضافة/إزالة مربعات الركاب
  const handleSeatsChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= (trip?.availableSeats || 10)) {
      setSeatsCount(value);
      
      // تحديث عدد الركاب في المصفوفة
      const newPassengers = [...passengers];
      if (value > passengers.length) {
        // إضافة راكب جديد
        for (let i = passengers.length; i < value; i++) {
          newPassengers.push({ fullName: "", nationalId: "", email: "", phone: "" });
        }
      } else if (value < passengers.length) {
        // حذف راكب زائد
        newPassengers.splice(value, passengers.length - value);
      }
      setPassengers(newPassengers);
    }
  };

  // ✅ زيادة عدد المقاعد
  const incrementSeats = () => {
    if (seatsCount < (trip?.availableSeats || 10)) {
      setSeatsCount(seatsCount + 1);
      setPassengers([...passengers, { fullName: "", nationalId: "", email: "", phone: "" }]);
    }
  };

  // ✅ تقليل عدد المقاعد
  const decrementSeats = () => {
    if (seatsCount > 1) {
      setSeatsCount(seatsCount - 1);
      const newPassengers = [...passengers];
      newPassengers.pop();
      setPassengers(newPassengers);
    }
  };

  // ✅ تحديث معلومات راكب معين
  const handlePassengerChange = (index, field, value) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index][field] = value;
    setPassengers(updatedPassengers);
  };

  const calculateTotalPrice = () => {
    return (trip?.price || 0) * seatsCount;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "غير محدد";
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من بيانات جميع الركاب
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.fullName.trim()) {
        alert(`الرجاء إدخال الاسم الثلاثي للراكب رقم ${i + 1}`);
        return;
      }
      if (!p.nationalId.trim()) {
        alert(`الرجاء إدخال الرقم الوطني للراكب رقم ${i + 1}`);
        return;
      }
      if (!p.phone.trim()) {
        alert(`الرجاء إدخال رقم الهاتف للراكب رقم ${i + 1}`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const bookingData = {
        tripId: trip._id,
        seatsCount: seatsCount,
        passengers: passengers, // ✅ إرسال بيانات جميع الركاب
        totalPrice: calculateTotalPrice()
      };

      const response = await API.post('/bookings', bookingData);
      
      if (response.data.success) {
        alert(`تم إتمام الحجز بنجاح لـ ${seatsCount} راكب!`);
        navigate('/user/my-bookings', { 
          state: { booking: response.data.booking }
        });
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert(error.response?.data?.message || "حدث خطأ في إتمام الحجز");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen font-Tajawal">
        <div className="text-center">
          <i className="fas fa-spinner fa-pulse text-4xl text-[#3E92CC] mb-4"></i>
          <p className="text-gray-500">جاري تحميل بيانات الرحلة...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex justify-center items-center h-screen font-Tajawal">
        <div className="text-center">
          <p className="text-gray-500">الرحلة غير موجودة</p>
          <button 
            onClick={() => navigate('/user/dashboard')}
            className="mt-4 bg-[#3E92CC] text-white px-6 py-2 rounded-lg"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-Tajawal bg-gray-50 min-h-screen pb-10">
      {/* Header */}
      <div className="w-full text-right pr-[11%] bg-[#1A5276] h-[86px] text-white text-3xl font-bold flex items-center">
        <p>إكمال عملية الحجز</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mx-[11%] w-[78%] mt-[80px] grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* العمود الأيمن - معلومات الركاب */}
          <div className="order-2 lg:order-1">
            {/* ✅ معلومات كل راكب على حدة */}
            {passengers.map((passenger, index) => (
              <div key={index} className="bg-white text-right rounded-2xl shadow-lg p-5 mb-6">
                <p className="text-xl border-b-2 pb-3 font-bold text-[#1A5276]">
                  معلومات الراكب رقم {index + 1}
                </p>
                
                <div className="mt-4">
                  <label className="block text-gray-700 mb-2">الاسم الثلاثي</label>
                  <input
                    type="text"
                    value={passenger.fullName}
                    onChange={(e) => handlePassengerChange(index, "fullName", e.target.value)}
                    className="w-full h-[50px] border-2 border-gray-200 rounded-xl px-4 focus:border-[#3E92CC] focus:outline-none"
                    placeholder="أحمد محمد علي"
                    required
                  />
                </div>
                
                <div className="mt-4">
                  <label className="block text-gray-700 mb-2">الرقم الوطني</label>
                  <input
                    type="text"
                    value={passenger.nationalId}
                    onChange={(e) => handlePassengerChange(index, "nationalId", e.target.value)}
                    className="w-full h-[50px] border-2 border-gray-200 rounded-xl px-4 focus:border-[#3E92CC] focus:outline-none"
                    placeholder="12345678901"
                    required
                  />
                </div>
                
                
                <div className="mt-4">
                  <label className="block text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={passenger.phone}
                    onChange={(e) => handlePassengerChange(index, "phone", e.target.value)}
                    className="w-full h-[50px] border-2 border-gray-200 rounded-xl px-4 focus:border-[#3E92CC] focus:outline-none"
                    placeholder="09xxxxxxxx"
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          {/* العمود الأيسر - ملخص الرحلة */}
          <div className="order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-lg p-5 sticky top-5">
              {/* معلومات الشركة */}
              <div className="flex items-center gap-4 border-b-2 pb-4">
                {trip.logo ? (
                  <img 
                    src={`http://localhost:5000${trip.logo}`} 
                    alt="Logo" 
                    className="w-16 h-16 rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-16 h-16 bg-[#3E92CC] rounded-full flex items-center justify-center">
                    <i className="fas fa-bus text-white text-2xl"></i>
                  </div>
                )}
                <p className="text-xl font-bold text-[#1A5276]">
                  {trip.companyName}
                </p>
              </div>

              {/* نقاط الرحلة */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-gray-500 text-sm">نقطة الانطلاق</p>
                  <p className="text-xl font-bold text-[#1A5276]">{trip.from}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-sm">نقطة الوصول</p>
                  <p className="text-xl font-bold text-[#1A5276]">{trip.to}</p>
                </div>
              </div>

              {/* وقت المغادرة */}
              <div className="mt-6">
                <p className="text-gray-700 font-bold">وقت المغادرة</p>
                <p className="text-gray-600">{formatDate(trip.departureTime)}</p>
                <p className="text-[#3E92CC] font-bold">{formatTime(trip.departureTime)}</p>
              </div>

              {/* وقت الوصول */}
              <div className="mt-4">
                <p className="text-gray-700 font-bold">وقت الوصول</p>
                <p className="text-gray-600">{formatDate(trip.arrivalTime)}</p>
                <p className="text-[#3E92CC] font-bold">{formatTime(trip.arrivalTime)}</p>
              </div>

              {/* عدد المقاعد */}
              <div className="mt-6">
                <p className="text-gray-700 font-bold mb-2">عدد المقاعد المحجوزة</p>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={decrementSeats}
                    className="w-10 h-10 bg-gray-100 rounded-full text-xl font-bold hover:bg-gray-200 transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={seatsCount}
                    onChange={handleSeatsChange}
                    className="w-24 h-12 text-center border-2 border-gray-200 rounded-xl text-xl font-bold"
                    min="1"
                    max={trip.availableSeats}
                  />
                  <button
                    type="button"
                    onClick={incrementSeats}
                    className="w-10 h-10 bg-gray-100 rounded-full text-xl font-bold hover:bg-gray-200 transition"
                  >
                    +
                  </button>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  * الحد الأقصى المتاح: {trip.availableSeats} مقعد
                </p>
              </div>

              {/* سياسة الإلغاء */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-gray-700 font-bold">سياسة الإلغاء</p>
                <p className="text-gray-500 text-sm mt-1">
                  يمكنك إلغاء أو تعديل حجزك قبل 6 ساعات من موعد المغادرة. لا يمكن استرداد المبلغ بعد هذا الوقت.
                </p>
              </div>

              {/* السعر الإجمالي */}
              <div className="mt-6 pt-4 border-t-2 border-gray-200">
                <div className="flex justify-between items-center">
                  <p className="text-gray-500">السعر للفرد</p>
                  <p className="text-lg font-bold">{trip.price?.toLocaleString()} ل.س</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-gray-500">عدد المقاعد</p>
                  <p className="text-lg font-bold">× {seatsCount}</p>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-gray-200">
                  <p className="text-xl font-bold text-[#1A5276]">السعر الإجمالي</p>
                  <p className="text-2xl font-bold text-[#3E92CC]">{calculateTotalPrice().toLocaleString()} ل.س</p>
                </div>
              </div>

              {/* زر إتمام الحجز */}
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#3E92CC] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#2E7AB3] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-pulse"></i>
                      جاري الحجز...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle"></i>
                      إتمام عملية الحجز
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}