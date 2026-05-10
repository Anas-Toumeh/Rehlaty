import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTrips from "./pages/AdminTrips";
import ManagerDashboard from "./pages/TripsManagement";
import BusesManagement from "./pages/BusesManagement";
import EmployeesManagement from "./pages/EmployeesManagement";
import ReportsDashboard from "./pages/ReportsDashboard";
import EmployeeTripsManagement from "./pages/EmployeeTripsManagement";
import UserLogin from "./pages/User/UserLogin";
import Register from "./pages/User/Register";
import User_dashboard from "./pages/User/User_dashboard";
import Cinform from "./pages/User/cinformTrip";
import MyBookings from "./pages/User/MyBookings";
// مكوّن بسيط لحماية المسارات (Protected Route)
// يمنع الدخول لصفحة الأدمن إلا إذا كان هناك توكن ورتبة الأدمن صحيحة
const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* المسار الافتراضي يوجه لصفحة تسجيل الدخول */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* صفحة تسجيل الدخول */}
        <Route path="/login" element={<UserLogin />} />
        <Route path="/AdminLogin" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* مسارات الأدمن المحمية */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRole="Admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/trips"
          element={
            <ProtectedRoute allowedRole="Admin">
              <AdminTrips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager-dashboard"
          element={
            <ProtectedRoute allowedRole="CompanyManager">
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/buses"
          element={
            <ProtectedRoute allowedRole="CompanyManager">
              <BusesManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/employees"
          element={
            <ProtectedRoute allowedRole="CompanyManager">
              <EmployeesManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/reports"
          element={
            <ProtectedRoute allowedRole="CompanyManager">
              <ReportsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/trips"
          element={
            <ProtectedRoute allowedRole="Employee">
              <EmployeeTripsManagement />
            </ProtectedRoute>
          }
        />
        <Route path="/user/:id" element={<User_dashboard />}></Route>
        <Route path="/cinformTrip/:tripId" element={<Cinform />}></Route>
        <Route path="/user/myBookings" element={<MyBookings />}></Route>
        {/* يمكنك إضافة باقي اللوحات هنا لاحقاً بنفس الطريقة */}
        {/* <Route path="/manager-dashboard" element={<ProtectedRoute allowedRole="CompanyManager">...</ProtectedRoute>} /> */}

        {/* مسار للتعامل مع الصفحات غير الموجودة */}
        <Route
          path="*"
          element={
            <div className="flex h-screen items-center justify-center font-bold">
              404 - الصفحة غير موجودة
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
