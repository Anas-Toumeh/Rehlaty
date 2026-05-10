import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/logo.png";
const AdminSidebar = ({ closeSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "إدارة الشركات", path: "/admin-dashboard", icon: "fa-building" },
    { name: "الرحلات والجدولة", path: "/admin/trips", icon: "fa-bus" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <aside className="w-80 h-full bg-white border-l border-gray-100 flex flex-col shadow-2xl lg:shadow-none">
      {/* Header: Logo & App Name */}
      <div className="p-8 border-b border-gray-50 flex flex-col items-center relative">
        {/* Close button for mobile */}
        <button
          onClick={closeSidebar}
          className="lg:hidden absolute left-4 top-4 w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:text-red-500 transition-colors"
        >
          <i className="fas fa-times">X</i>
        </button>
        <img src={logo} alt="" />

        
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
                closeSidebar(); // Close sidebar on mobile after click
              }}
              className={`
                w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all duration-300 group
                ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-500/30"
                    : "text-gray-500 hover:bg-blue-50 hover:text-blue-600"
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
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black">
            A
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-black text-gray-800 truncate">
              مدير النظام
            </p>
            <p className="text-[10px] text-gray-400 font-bold truncate">
              admin@rehlati.com
            </p>
          </div>
        </div>

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

export default AdminSidebar;
