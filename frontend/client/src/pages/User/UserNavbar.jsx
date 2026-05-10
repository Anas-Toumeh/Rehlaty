import { useContext, useEffect, useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import logo from "../../assets/logo.png";
import preson from "../../assets/Accaount_Logo.png";

export default function UserNavbar() {
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const navigate = useNavigate();
  const location = useLocation();
  const [activeLog, setActiveLog] = useState(false);
  
  const userId = localStorage.getItem('userId') || user?._id;
  
  console.log('User:', user);
  console.log('User ID:', userId);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const homeLink = userId ? `/user/${userId}` : '/user/dashboard';
  const myBookingsLink = userId ? `/user/mybookings` : '/user/my-bookings';

  return (
    <div>
      <div className="w-full ml-0 max-w-full flex flex-nowrap bg-white h-16 rounded-2xl shadow-xl font-Tajawal place-content-start">
        
        {/* الشعار */}
        <div className="lg:w-1/4 w-1/6 place-items-end place-content-center">
          <img src={logo} alt="Logo" className="w-30 flex-initial grow-0 xl:mr-20 cursor-pointer" onClick={() => navigate(homeLink)} />
        </div>
        
        {/* الروابط الرئيسية للمستخدم */}
        <div className="hidden md:flex flex-initial grow flex-nowrap md:justify-center lg:ml-10 place-content-center w-1/2 text-center">
          
          {/* ✅ رابط الرئيسية */}
          <NavLink 
            to={homeLink} 
            className={({ isActive }) => 
              `flex-initial place-content-center w-[120px] transition-colors duration-200 ${
                isActive ? 'text-[#3E92CC] border-b-2 border-[#3E92CC]' : 'text-gray-600 hover:text-[#3E92CC]'
              }`
            }
          >
            <p className="h-full place-content-center">الرئيسية</p>
          </NavLink>
          
          {/* ✅ رابط رحلاتي */}
          <NavLink 
            to={myBookingsLink} 
            className={({ isActive }) => 
              `flex-initial place-content-center w-[120px] transition-colors duration-200 ${
                isActive ? 'text-[#3E92CC] border-b-2 border-[#3E92CC]' : 'text-gray-600 hover:text-[#3E92CC]'
              }`
            }
          >
            <p className="h-full place-content-center">رحلاتي</p>
          </NavLink>
          
          {/* روابط إضافية */}
          <NavLink 
            to="/services" 
            className={({ isActive }) => 
              `flex-initial place-content-center w-[120px] transition-colors duration-200 ${
                isActive ? 'text-[#3E92CC] border-b-2 border-[#3E92CC]' : 'text-gray-600 hover:text-[#3E92CC]'
              }`
            }
          >
            <p className="h-full place-content-center">الخدمات</p>
          </NavLink>
          
          <NavLink 
            to="/about" 
            className={({ isActive }) => 
              `flex-initial place-content-center w-[120px] transition-colors duration-200 ${
                isActive ? 'text-[#3E92CC] border-b-2 border-[#3E92CC]' : 'text-gray-600 hover:text-[#3E92CC]'
              }`
            }
          >
            <p className="h-full place-content-center">عن الشركة</p>
          </NavLink>
          
          <NavLink 
            to="/contactUs" 
            className={({ isActive }) => 
              `flex-initial place-content-center w-[120px] transition-colors duration-200 ${
                isActive ? 'text-[#3E92CC] border-b-2 border-[#3E92CC]' : 'text-gray-600 hover:text-[#3E92CC]'
              }`
            }
          >
            <p className="h-full place-content-center">تواصل معنا</p>
          </NavLink>
        </div>

        {/* الجزء الأيمن: معلومات المستخدم أو تسجيل الدخول */}
        <div className="flex-initial place-content-center w-1/4 flex items-center justify-center gap-3 px-4">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 -ml-10"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  تسجيل الخروج
                </button>
                <div className="flex flex-col items-end">
                  <p className="font-bold text-gray-800 text-sm">{user.fullName}</p>
                </div>
                <img 
                  src={preson} 
                  alt="User Avatar" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#3E92CC] cursor-pointer hover:opacity-80 transition"
                  onClick={() => navigate(homeLink)}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <NavLink 
                to="/login" 
                className="hidden xl:flex px-4 py-2 bg-[#3E92CC] text-white rounded-lg hover:bg-[#2E7AB3] transition"
              >
                تسجيل الدخول
              </NavLink>
              <NavLink 
                to="/register" 
                className="hidden xl:flex px-4 py-2 border border-[#3E92CC] text-[#3E92CC] rounded-lg hover:bg-[#3E92CC] hover:text-white transition"
              >
                إنشاء حساب
              </NavLink>
              <img 
                src={preson} 
                alt="User Avatar" 
                className="w-10 h-10 rounded-full border-2 border-gray-300 cursor-pointer hover:border-[#3E92CC] transition"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}