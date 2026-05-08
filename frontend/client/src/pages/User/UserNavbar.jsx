import { useContext, useEffect, useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import logo from "../../assets/logo.png";
import preson from "../../assets/Accaount_Logo.png";

export default function Nav() {
  const user =localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const navigate = useNavigate();
  const location = useLocation(); // الحصول على موقع الـ URL الحالي
  const {ActiveLog,setActiveLog}=useState(false)
  console.log(user);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // التحقق مما إذا كان المسار الحالي هو /admin-dashboard أو /manager-dashboard
  const isDashboard = location.pathname === '/admin-dashboard' || location.pathname === '/Owner-dashboard' || location.pathname === '/Staff-dashboard' ;

  return (
    <div>
      
      <div
        className={`${isDashboard ? 'w-[80%] ml-6 mt-4' : 'w-full'} ml-0 max-w-full flex flex-nowrap bg-white h-16 rounded-2xl shadow-xl  font-Tajawal place-content-end`}
      ><div className="lg:w-1/4 w-1/6   place-items-end  place-content-center">
           <img src={logo} alt=""  className=" w-30 flex-initial grow-0  xl:mr-20"/>
           </div>
        
        {!isDashboard && (
          <div className=" hidden md:flex flex-initial grow flex-nowrap md:justify-center lg:ml-30 place-content-center w-1/2">
            <NavLink to="/contactUs" className="flex-initial place-content-center w-[120px]">
              <p className="h-full place-content-center">تواصل معنا</p>
            </NavLink>
            <NavLink to="/about" className="flex-initial place-content-center  w-[120px]">
              <p className="h-full place-content-center">عن الشركة</p>
            </NavLink>
            <NavLink to="/services" className="flex-initial place-content-center  w-[120px]">
              <p className="h-full place-content-center">الخدمات</p>
            </NavLink>
            <NavLink to="/faq" className="flex-initial place-content-center  w-[120px]">
              <p className="h-full place-content-center">الأسئلة الشائعة</p>
            </NavLink>
          </div>
        )}

        {/* الجزء الأيمن: معلومات المستخدم أو تسجيل الدخول */}
        <div className="flex-initial place-content-center w-1/4 flex">
          {user ? (
            <div className="flex items-center space-x-4">
              <p className="flex-initial place-content-center">{user.fullName}</p>
              <img src={preson} alt="" className="flex-initial w-10 h-10 rounded-full place-self-center" />
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <NavLink to="/login" className=" hidden xl:flex flex-initial text-nowrap place-content-center">
                تسجيل الدخول / إنشاء حساب
              </NavLink>
              <img src={preson} alt="" oncl className="flex-initial w-10 h-10 rounded-full place-self-center" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}