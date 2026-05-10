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
// Simple component to protect routes (Protected Route)
// Prevents access to admin page unless there is a token and correct admin rank
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
        {/* Default route redirects to login page */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login page */}
        <Route path="/login" element={<UserLogin />} />
        <Route path="/AdminLogin" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Protected admin routes */}
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
        {/* You can add remaining dashboards here later in the same way */}
        {/* <Route path="/manager-dashboard" element={<ProtectedRoute allowedRole="CompanyManager">...</ProtectedRoute>} /> */}

        {/* Route to handle non-existent pages */}
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
