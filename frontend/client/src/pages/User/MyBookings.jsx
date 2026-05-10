// pages/User/MyBookings.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../../api/axiosConfig';
import UserNavbar from './UserNavbar';

export default function MyBookings() {
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const  id  =localStorage.getItem('userId');
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await API.get('/bookings/my-bookings');
        if (response.data.success) {
          setBookings(response.data.bookings);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBookings();
    }
  }, [id]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا الحجز؟')) return;
    
    setCancelling(bookingId);
    
    try {
      const response = await API.patch(`/bookings/${bookingId}/cancel`);
      if (response.data.success) {
        console.log(bookingId);
        
        setBookings(prev => prev.map(booking => 
          booking._id === bookingId 
            ? { ...booking, paymentStatus: 'Cancelled' }
            : booking
        ));
        alert('تم إلغاء الحجز بنجاح');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(error.response?.data?.message || 'حدث خطأ في إلغاء الحجز');
      console.log(bookingId);
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserNavbar />
        <div className="flex justify-center items-center h-96">
          <i className="fas fa-spinner fa-pulse text-4xl text-[#3E92CC]"></i>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* عنوان الصفحة */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-right text-gray-800">{user?.fullName || 'My Trips'}</h1>
          <p className="text-right text-gray-500 mt-1">رحلاتي</p>
        </div>
        
        {bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <i className="fas fa-ticket-alt text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-400">لا توجد حجوزات حالياً</p>
            <Link
              to={`/user/${id}`}
              className="inline-block mt-4 px-6 py-2 bg-[#3E92CC] text-white rounded-lg hover:bg-[#2E7AB3] transition"
            >
              استكشاف الرحلات
            </Link>
          </div>
        ) : (
          <div className="space-y-6 flex gap-8">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white h-120 w-120 rounded-3xl shadow-lg overflow-hidden" dir='rtl'>
                {/* شريط العنوان مع معلومات الشركة */}
                <div className="bg-gradient-to-r from-[#1A5276] to-[#2E7AB3] p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {booking.tripDetails?.companyLogo ? (
                      <img 
                        src={`http://localhost:5000${booking.tripDetails.companyLogo}`} 
                        alt="Logo" 
                        className="w-10 h-10 rounded-full bg-white p-5/6"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <i className="fas fa-bus text-[#1A5276]"></i>
                      </div>
                    )}
                    <span className="text-white font-bold text-lg">
                      {booking.tripDetails?.companyName || "شركة النقل"}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm">رقم الحافلة</p>
                    <p className="text-white font-bold">{booking.tripDetails?.busNumber || "BUS001"}</p>
                  </div>
                </div>
                
                {/* محتوى البطاقة */}
                <div className="p-6">
                  {/* نقطة الانطلاق ونقطة الوصول */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-center flex-1">
                      <p className="text-gray-500 text-sm">نقطة الانطلاق</p>
                      <p className="text-2xl font-bold text-[#1A5276]">{booking.tripDetails?.from}</p>
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-arrow-left text-gray-400"></i>
                      </div>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-gray-500 text-sm">نقطة الوصول</p>
                      <p className="text-2xl font-bold text-[#1A5276]">{booking.tripDetails?.to}</p>
                    </div>
                  </div>
                  
                  {/* معلومات المقعد */}
                  <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-2xl">
                    <div className="text-center flex-1">
                      <p className="text-gray-500 text-sm">رقم المقعد</p>
                      <p className="text-xl font-bold text-gray-800">
                        {booking.selectedSeats?.map(s => s.seatNumber).join(', ') || "1"}
                      </p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-gray-500 text-sm">التاريخ</p>
                      <p className="text-lg font-bold text-gray-800">
                        {formatDate(booking.tripDetails?.departureTime)}
                      </p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-gray-500 text-sm">الوقت</p>
                      <p className="text-xl font-bold text-[#3E92CC]">
                        {formatTime(booking.tripDetails?.departureTime)}
                      </p>
                    </div>
                  </div>
                  
                  {/* سياسة الإلغاء والسعر */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-500 text-sm">إلغاء التذكرة</p>
                      <p className="text-sm text-gray-400 max-w-[200px]">
                        يمكنك إلغاء التذكرة خلال 48 ساعة من موعد الحجز.
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-sm">السعر</p>
                      <p className="text-2xl font-bold text-[#3E92CC]">
                        {booking.totalPrice?.toLocaleString()} ل.س
                      </p>
                    </div>
                  </div>
                  
                  {/* زر إلغاء الحجز */}
                  {booking.paymentStatus !== 'Cancelled' && (
                    <div className="mt-6">
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        disabled={cancelling === booking._id}
                        className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {cancelling === booking._id ? (
                          <>
                            <i className="fas fa-spinner fa-pulse"></i>
                            جاري الإلغاء...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-times-circle"></i>
                            إلغاء الحجز
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* حالة الحجز */}
                  {booking.paymentStatus === 'Cancelled' && (
                    <div className="mt-6 p-3 bg-red-50 rounded-xl text-center">
                      <p className="text-red-600 font-bold">
                        <i className="fas fa-ban ml-2"></i>
                        تم إلغاء هذا الحجز
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}