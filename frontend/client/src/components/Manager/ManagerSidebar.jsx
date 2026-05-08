// components/Manager/ManagerSidebar.jsx
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/logo.png"; // استخدم نفس اللوجو أو غيره

const ManagerSidebar = ({ closeSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "إدارة الرحلات", path: "/manager-dashboard", icon: "fa-route" },
    { name: "أسطول الحافلات", path: "/manager/buses", icon: "fa-bus" },
    { name: "موظفي الشركة", path: "/manager/employees", icon: "fa-users-gear" },
    { name: "التقارير المالية", path: "/manager/reports", icon: "fa-chart-pie" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <aside className="w-80 h-full bg-white border-l border-gray-100 flex flex-col shadow-2xl lg:shadow-none">
      {/* Header: Logo & App Name */}
      <div className="p-8 border-b border-gray-50 flex flex-col items-center relative">
        {/* زر الإغلاق للموبايل */}
        <button
          onClick={closeSidebar}
          className="lg:hidden absolute left-4 top-4 w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
        >
          <i className="fas fa-times"></i>
        </button>
        
        <img src={logo} alt="Logo" className=" object-contain mb-3" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
          نظام إدارة النقل الذكي
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-8 overflow-y-auto space-y-2 custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                closeSidebar(); // يغلق السايد بار في الموبايل بعد الضغط
              }}
              className={`
                w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all duration-300 group
                ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/30"
                    : "text-gray-500 hover:bg-amber-50 hover:text-blue-500"
                }
              `}
            >
              <i
                className={`fas ${item.icon} text-lg ${isActive ? "scale-110" : "group-hover:scale-110"} transition-transform`}
              ></i>
              <span className="text-sm">{item.name}</span>
              {isActive && (
                <div className="mr-auto w-1.5 h-6 bg-white/40 rounded-full animate-pulse"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User & Logout Section */}
      <div className="p-6 border-t border-gray-50 bg-gray-50/50">
        

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-3 text-red-500 font-black text-xs hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
        >
          <i className="fas fa-sign-out-alt"></i>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
};

export default ManagerSidebar;