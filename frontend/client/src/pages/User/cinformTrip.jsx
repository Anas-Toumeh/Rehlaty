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
  const [bookedSeats, setBookedSeats] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState('form'); // form, checking, processing
  
  const [paymentInfo, setPaymentInfo] = useState({
    phone: "",
    password: "",
    rememberMe: false
  });
  const [paymentError, setPaymentError] = useState("");
  const [balanceInfo, setBalanceInfo] = useState(null);
  
  const [passengers, setPassengers] = useState([
    { 
      seatNumber: null,
      passengerName: "", 
      passengerGender: "Male",
      passengerPhone: "",
      passengerNationalId: ""
    }
  ]);

  const fetchBookedSeats = async (tripId) => {
    try {
      const response = await API.get(`/bookings/booked-seats/${tripId}`);
      if (response.data.success) {
        setBookedSeats(response.data.bookedSeats);
        return response.data.bookedSeats;
      }
      return [];
    } catch (error) {
      console.error("Error fetching booked seats:", error);
      return [];
    }
  };

  const findNextAvailableSeat = (bookedSeatsList, totalSeats) => {
    for (let i = 1; i <= totalSeats; i++) {
      if (!bookedSeatsList.includes(i)) {
        return i;
      }
    }
    return null;
  };

  const updateSeatNumbers = (count, bookedSeatsList, totalSeats, currentPassengers) => {
    const newPassengers = [];
    const usedSeats = [...bookedSeatsList];
    
    for (let i = 0; i < count; i++) {
      const nextSeat = findNextAvailableSeat(usedSeats, totalSeats);
      
      if (nextSeat) {
        const existingPassenger = currentPassengers[i];
        newPassengers.push({
          seatNumber: nextSeat,
          passengerName: existingPassenger?.passengerName || "",
          passengerGender: existingPassenger?.passengerGender || "Male",
          passengerPhone: existingPassenger?.passengerPhone || "",
          passengerNationalId: existingPassenger?.passengerNationalId || ""
        });
        usedSeats.push(nextSeat);
      }
    }
    return newPassengers;
  };

  useEffect(() => {
    const fetchTripData = async () => {
      if (!tripId) {
        alert("معرّف الرحلة غير موجود");
        navigate('/user/dashboard');
        return;
      }

      try {
        setLoading(true);
        
        const tripResponse = await API.get(`/trips/details/${tripId}`);
        
        if (tripResponse.data.success) {
          const tripData = tripResponse.data.trip;
          const totalSeats = tripData.totalSeats || 45;
          const bookedSeatsList = await fetchBookedSeats(tripId);
          
          setTrip({
            _id: tripData._id,
            companyName: tripData.companyId?.name || "شركة النقل",
            logo: tripData.companyId?.logo,
            from: tripData.from,
            to: tripData.to,
            departureTime: tripData.departureTime,
            arrivalTime: tripData.arrivalTime,
            price: tripData.price,
            availableSeats: (totalSeats - bookedSeatsList.length),
            totalSeats: totalSeats
          });
          
          const initialSeats = [];
          const usedSeats = [...bookedSeatsList];
          for (let i = 0; i < seatsCount; i++) {
            const nextSeat = findNextAvailableSeat(usedSeats, totalSeats);
            if (nextSeat) {
              initialSeats.push(nextSeat);
              usedSeats.push(nextSeat);
            }
          }
          
          setPassengers(initialSeats.map(seatNum => ({
            seatNumber: seatNum,
            passengerName: "",
            passengerGender: "Male",
            passengerPhone: "",
            passengerNationalId: ""
          })));
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

  useEffect(() => {
    if (trip && trip.totalSeats) {
      const updatedPassengers = updateSeatNumbers(
        seatsCount, 
        bookedSeats, 
        trip.totalSeats, 
        passengers
      );
      setPassengers(updatedPassengers);
    }
  }, [seatsCount, bookedSeats, trip?.totalSeats]);

  const incrementSeats = () => {
    if (seatsCount < (trip?.availableSeats || 10)) {
      setSeatsCount(seatsCount + 1);
    }
  };

  const decrementSeats = () => {
    if (seatsCount > 1) {
      setSeatsCount(seatsCount - 1);
    }
  };

  const handlePassengerChange = (index, field, value) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index][field] = value;
    setPassengers(updatedPassengers);
  };

  const handleSeatNumberChange = (index, newSeatNumber) => {
    const seatNum = parseInt(newSeatNumber);
    if (isNaN(seatNum)) return;
    
    if (seatNum < 1 || seatNum > (trip?.totalSeats || 45)) {
      alert(`رقم المقعد يجب أن يكون بين 1 و ${trip?.totalSeats}`);
      return;
    }
    
    const allBookedSeats = [...bookedSeats];
    for (let i = 0; i < passengers.length; i++) {
      if (i !== index && passengers[i].seatNumber) {
        allBookedSeats.push(passengers[i].seatNumber);
      }
    }
    
    if (allBookedSeats.includes(seatNum)) {
      alert(`المقعد رقم ${seatNum} محجوز بالفعل. الرجاء اختيار مقعد آخر.`);
      return;
    }
    
    const updatedPassengers = [...passengers];
    updatedPassengers[index].seatNumber = seatNum;
    setPassengers(updatedPassengers);
  };

  const handlePaymentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPaymentInfo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setPaymentError("");
  };

  const checkBalance = async () => {
    if (!paymentInfo.phone || !paymentInfo.password) {
      setPaymentError("الرجاء إدخال رقم الهاتف وكلمة المرور");
      return false;
    }
    
    setPaymentStep('checking');
    
    try {
      const response = await API.post('/cash/check-balance', {
        phone: paymentInfo.phone,
        password: paymentInfo.password
      });
      
      if (response.data.success) {
        setBalanceInfo({
          balance: response.data.balance,
          name: response.data.name
        });
        setPaymentStep('processing');
        return true;
      }
    } catch (error) {
      console.error("Balance check error:", error);
      const message = error.response?.data?.message || "فشل في التحقق من الرصيد";
      setPaymentError(message);
      setPaymentStep('form');
      return false;
    }
    return false;
  };

  const processPayment = async () => {
    setPaymentStep('processing');

    try {
      const bookingData = {
        tripId: trip._id,
        selectedSeats: passengers.map(p => ({
          seatNumber: p.seatNumber,
          passengerName: p.passengerName,
          passengerGender: p.passengerGender,
          passengerPhone: p.passengerPhone,
          passengerNationalId: p.passengerNationalId
        })),
        phone: paymentInfo.phone,
        password: paymentInfo.password
      };

      const response = await API.post('/bookings/pay', bookingData);

      if (response.data && response.data.success) {
        setPaymentStep('form');
        return { success: true, balance: response.data.accountBalance, booking: response.data.booking };
      } else {
        const msg = response.data?.message || 'فشل في عملية الدفع';
        setPaymentError(msg);
        setPaymentStep('form');
        return { success: false, message: msg };
      }
    } catch (error) {
      console.error("Payment error:", error);
      const message = error.response?.data?.message || error.response?.data?.msg || "فشل في عملية الدفع";
      setPaymentError(message);
      setPaymentStep('form');
      return { success: false, message };
    }
  };

  const completeBooking = async () => {
    try {
      const bookingData = {
        tripId: trip._id,
        selectedSeats: passengers.map(p => ({
          seatNumber: p.seatNumber,
          passengerName: p.passengerName,
          passengerGender: p.passengerGender,
          passengerPhone: p.passengerPhone,
          passengerNationalId: p.passengerNationalId
        })),
        totalPrice: calculateTotalPrice(),
        paymentPhone: paymentInfo.phone
      };

      const response = await API.post('/bookings', bookingData);
      
      if (response.data.success) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Booking error:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.seatNumber) {
        alert(`الرجاء تحديد رقم مقعد للراكب رقم ${i + 1}`);
        return;
      }
      if (!p.passengerName.trim()) {
        alert(`الرجاء إدخال اسم الراكب رقم ${i + 1}`);
        return;
      }
      if (!p.passengerPhone.trim()) {
        alert(`الرجاء إدخال رقم الهاتف للراكب رقم ${i + 1}`);
        return;
      }
      if (!p.passengerNationalId.trim()) {
        alert(`الرجاء إدخال الرقم الوطني للراكب رقم ${i + 1}`);
        return;
      }
    }

    if (!paymentInfo.phone || !paymentInfo.password) {
      setPaymentError("الرجاء إدخال رقم الهاتف وكلمة المرور للدفع");
      setShowPayment(true);
      return;
    }

    setSubmitting(true);

    try {
      // 1. (Optional) check quick balance for UX — backend will re-verify during payment.
      const balanceValid = await checkBalance();
      if (!balanceValid) {
        setSubmitting(false);
        return;
      }

      const totalAmount = calculateTotalPrice();

      const confirmMessage = `تأكيد الدفع\n\nالمبلغ: ${totalAmount.toLocaleString()} ل.س\nالرصيد المتاح: ${balanceInfo?.balance?.toLocaleString() || 'غير معروف'} ل.س\n\nهل تريد تأكيد الدفع؟`;
      if (!window.confirm(confirmMessage)) {
        setSubmitting(false);
        return;
      }

      const paymentResult = await processPayment();

      if (!paymentResult.success) {
        setSubmitting(false);
        return;
      }

      alert(`✅ تم الحجز بنجاح!\n\nالمبلغ المدفوع: ${totalAmount.toLocaleString()} ل.س\nالرصيد المتبقي: ${paymentResult.balance?.toLocaleString() || 'غير معروف'} ل.س\n\nتم إرسال تفاصيل الحجز إلى بريدك الإلكتروني.`);
      navigate('/user/my-bookings');

    } catch (error) {
      console.error("Payment process error:", error);
      alert("حدث خطأ في عملية الدفع. يرجى المحاولة مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
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
      <div className="w-full text-right pr-[11%] bg-[#1A5276] h-[86px] text-white text-3xl font-bold flex items-center" dir="rtl">
        <p>إكمال عملية الحجز</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mx-[11%] w-[78%] mt-[80px] grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* العمود الأيمن - معلومات الركاب والدفع */}
          <div className="order-2 lg:order-1" dir="rtl">
            {/* معلومات الركاب */}
            {passengers.map((passenger, index) => (
              <div key={index} className="bg-white text-right rounded-2xl shadow-lg p-5 mb-6">
                <p className="text-xl border-b-2 pb-3 font-bold text-[#1A5276]">
                  معلومات الراكب رقم {index + 1}
                </p>
                
                <div className="mt-4">
                  <label className="block text-gray-700 mb-2">رقم المقعد</label>
                  <input
                    type="number"
                    value={passenger.seatNumber || ""}
                    onChange={(e) => handleSeatNumberChange(index, e.target.value)}
                    className="w-full h-[50px] border-2 border-gray-200 rounded-xl px-4 focus:border-[#3E92CC] focus:outline-none"
                    placeholder="يتحدد تلقائياً"
                    min="1"
                    max={trip.totalSeats}
                    required
                  />
                </div>
                
                <div className="mt-4">
                  <label className="block text-gray-700 mb-2">الاسم الكامل</label>
                  <input
                    type="text"
                    value={passenger.passengerName}
                    onChange={(e) => handlePassengerChange(index, "passengerName", e.target.value)}
                    className="w-full h-[50px] border-2 border-gray-200 rounded-xl px-4 focus:border-[#3E92CC] focus:outline-none"
                    placeholder="أحمد محمد علي"
                    required
                  />
                </div>
                
                <div className="mt-4">
                  <label className="block text-gray-700 mb-2">الجنس</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`gender_${index}`}
                        value="Male"
                        checked={passenger.passengerGender === "Male"}
                        onChange={(e) => handlePassengerChange(index, "passengerGender", e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>ذكر</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`gender_${index}`}
                        value="Female"
                        checked={passenger.passengerGender === "Female"}
                        onChange={(e) => handlePassengerChange(index, "passengerGender", e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>أنثى</span>
                    </label>
                  </div>
                </div>
                
                <div className="mt-4" >
                  <label className="block text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={passenger.passengerPhone}
                    onChange={(e) => handlePassengerChange(index, "passengerPhone", e.target.value)}
                    className="w-full h-[50px] border-2 border-gray-200 rounded-xl px-4 focus:border-[#3E92CC] focus:outline-none"
                    placeholder="09xxxxxxxx"
                    required
                    dir="rtl"
                  />
                </div>
                
                <div className="mt-4">
                  <label className="block text-gray-700 mb-2">الرقم الوطني</label>
                  <input
                    type="text"
                    value={passenger.passengerNationalId}
                    onChange={(e) => handlePassengerChange(index, "passengerNationalId", e.target.value)}
                    className="w-full h-[50px] border-2 border-gray-200 rounded-xl px-4 focus:border-[#3E92CC] focus:outline-none"
                    placeholder="12345678901"
                    required
                  />
                </div>
              </div>
            ))}

            {/* مربع معلومات الدفع */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 text-right rounded-2xl shadow-lg p-5 mb-6 border border-blue-100">
              <div className="flex items-center justify-between border-b-2 pb-3 mb-4">
                <button
                  type="button"
                  onClick={() => setShowPayment(!showPayment)}
                  className="text-[#3E92CC] hover:text-[#1A5276] transition"
                >
                  <i className={`fas ${showPayment ? "fa-chevron-up" : "fa-chevron-down"} ml-2`}></i>
                </button>
                <p className="text-xl font-bold text-[#1A5276] flex items-center gap-2">
                  <i className="fas fa-credit-card text-[#3E92CC]"></i>
                  معلومات الدفع
                </p>
              </div>
              
              {showPayment && (
                <div className="space-y-4">
                  <div className="bg-blue-100 rounded-xl p-3 text-center">
                    <p className="text-sm text-blue-800">
                      <i className="fas fa-shield-alt ml-2"></i>
                      سيتم خصم المبلغ من رصيد محفظتك الإلكترونية
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">
                      <i className="fas fa-phone ml-2 text-[#3E92CC]"></i>
                      رقم الهاتف المرتبط بالدفع
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={paymentInfo.phone}
                      onChange={handlePaymentChange}
                      className="w-full h-[50px] border-2 border-gray-200 rounded-xl px-4 focus:border-[#3E92CC] focus:outline-none"
                      placeholder="09xxxxxxxx"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">
                      <i className="fas fa-lock ml-2 text-[#3E92CC]"></i>
                      كلمة المرور
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={paymentInfo.password}
                      onChange={handlePaymentChange}
                      className="w-full h-[50px] border-2 border-gray-200 rounded-xl px-4 focus:border-[#3E92CC] focus:outline-none"
                      placeholder="••••••"
                      required
                    />
                  </div>
                  
                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-red-600 text-sm text-center">
                        <i className="fas fa-exclamation-circle ml-2"></i>
                        {paymentError}
                      </p>
                    </div>
                  )}
                  
                  {balanceInfo && paymentStep === 'processing' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                      <p className="text-green-600 text-sm text-center">
                        <i className="fas fa-check-circle ml-2"></i>
                        الرصيد المتاح: {balanceInfo.balance.toLocaleString()} ل.س
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* العمود الأيسر - ملخص الرحلة */}
          <div className="order-1 lg:order-2" dir="rtl">
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

              {/* المقاعد المحجوزة */}
              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 font-bold">المقاعد المحجوزة مسبقاً:</p>
                <p className="text-sm text-gray-500">
                  {bookedSeats.length > 0 ? bookedSeats.join(", ") : "لا يوجد مقاعد محجوزة"}
                </p>
              </div>

              {/* عدد المقاعد */}
              <div className="mt-4">
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
                    onChange={(e) => setSeatsCount(parseInt(e.target.value))}
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
                  * المقاعد المتاحة: {trip.availableSeats} من {trip.totalSeats}
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
                      جاري معالجة الدفع...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle"></i>
                      تأكيد وإتمام الحجز
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