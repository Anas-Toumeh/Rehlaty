import { useState } from "react";
import axios from "axios";
import bg from "../../assets/SingBus.png";
import logo from "../../assets/SingLogo.png";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // حالة الحقول
  const [formData, setFormData] = useState({
    fullName: "",      // ✅ دمج الاسم الأول والكنية
    email: "",
    phone: "",         // ✅ إضافة رقم الهاتف
    password: "",
    confirmPassword: "" // ✅ تأكيد كلمة المرور
  });

  // تحديث حالة الحقول عند التغيير
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // مسح الخطأ عند تغيير الحقول
    if (error) setError("");
  };

  // التحقق من صحة البيانات
  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError("الرجاء إدخال الاسم الكامل");
      return false;
    }
    if (!formData.email.trim()) {
      setError("الرجاء إدخال البريد الإلكتروني");
      return false;
    }
    if (!formData.phone.trim()) {
      setError("الرجاء إدخال رقم الهاتف");
      return false;
    }
    if (formData.phone.length < 9) {
      setError("رقم الهاتف يجب أن يكون 9 أرقام على الأقل");
      return false;
    }
    if (!formData.password) {
      setError("الرجاء إدخال كلمة المرور");
      return false;
    }
    if (formData.password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("كلمة المرور غير متطابقة");
      return false;
    }
    return true;
  };

  // إرسال البيانات إلى السيرفر
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError("");
    
    // ✅ تجهيز البيانات للإرسال حسب ما يطلبه الـ API
    const requestData = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    };
    
    console.log("📤 Sending registration data:", requestData);
    
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register", 
        requestData
      );
      
      if (response.data.success) {
        alert("✅ تم إنشاء الحساب بنجاح!");
        console.log("✅ Registration response:", response.data);
        
        // تخزين التوكن إذا أردت تسجيل الدخول تلقائياً
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        // التوجيه إلى صفحة تسجيل الدخول
        navigate('/login');
      } else {
        setError(response.data.message || "حدث خطأ في إنشاء الحساب");
      }
    } catch (error) {
      console.error("❌ Registration error:", error);
      const errorMessage = error.response?.data?.message || "فشل في إنشاء الحساب. يرجى المحاولة مرة أخرى";
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex font-Tajawal min-h-screen" >
      {/* القسم الأيمن - الصورة */}
      <div className="w-[80%] h-screen bg-center hidden lg:block">
        <img src={bg} alt="Background" className="h-screen w-full" />
      </div>
      
      {/* القسم الأيسر - نموذج التسجيل */}
      <form 
        className="pt-4 place-items-center bg-white lg:-ml-20 pl-10 w-full lg:w-[50%] rounded-bl-[80px] shadow-xl lg:shadow-none overflow-y-auto max-h-screen"
        onSubmit={handleSubmit}
      >
        <div className="w-[80%] md:w-[60%] lg:w-[70%] xl:w-[50%] mb-8">
          <img src={logo} alt="Logo" className="w-full max-w-[200px] mx-auto" />
          <p className="text-3xl md:text-4xl text-[#1A5276] text-center w-full mt-8 font-bold">
            إنشاء حساب جديد
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 w-[80%] md:w-[70%] lg:w-[80%] xl:w-[70%]">
          
          {/* رسالة الخطأ */}
          {error && (
            <div className="col-span-1 md:col-span-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-right">
              <i className="fas fa-exclamation-circle ml-2"></i>
              {error}
            </div>
          )}
          
          {/* الاسم الكامل (دمج الاسم الأول والكنية) */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-right font-medium text-gray-700">
              : الاسم الكامل
            </label>
            <div className="relative mt-2">
              <input
                className="w-full h-12 border text-right pr-4 pl-10 rounded-lg shadow-sm text-[#1A5276] border-[#596a745e] placeholder:text-[#8f9ea8d8] focus:outline-none focus:border-[#1A5276] focus:ring-1 focus:ring-[#1A5276] transition"
                placeholder="أحمد محمد"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <i className="fas fa-user absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
          
          {/* البريد الإلكتروني */}
          <div>
            <label className="block text-right font-medium text-gray-700">
              : البريد الإلكتروني
            </label>
            <div className="relative mt-2">
              <input
                className="w-full h-12 border text-right pr-4 pl-10 rounded-lg shadow-sm text-[#1A5276] border-[#596a745e] placeholder:text-[#8f9ea8d8] focus:outline-none focus:border-[#1A5276] transition"
                placeholder="example@email.com"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <i className="fas fa-envelope absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
          
          {/* رقم الهاتف */}
          <div>
            <label className="block text-right font-medium text-gray-700">
              : رقم الهاتف
            </label>
            <div className="relative mt-2">
              <input
                className="w-full h-12 border text-right pr-4 pl-10 rounded-lg shadow-sm text-[#1A5276] border-[#596a745e] placeholder:text-[#8f9ea8d8] focus:outline-none focus:border-[#1A5276] transition"
                placeholder="09xxxxxxxx"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <i className="fas fa-phone absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
          
          {/* كلمة المرور */}
          <div>
            <label className="block text-right font-medium text-gray-700">
              : كلمة المرور
            </label>
            <div className="relative mt-2">
              <input
                className="w-full h-12 border text-right pr-4 pl-12 rounded-lg shadow-sm text-[#1A5276] border-[#596a745e] placeholder:text-[#8f9ea8d8] focus:outline-none focus:border-[#1A5276] transition"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <i className="fas fa-lock absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#1A5276] transition"
              >
                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
          </div>
          
          {/* تأكيد كلمة المرور */}
          <div>
            <label className="block text-right font-medium text-gray-700">
              : تأكيد كلمة المرور
            </label>
            <div className="relative mt-2">
              <input
                className="w-full h-12 border text-right pr-4 pl-10 rounded-lg shadow-sm text-[#1A5276] border-[#596a745e] placeholder:text-[#8f9ea8d8] focus:outline-none focus:border-[#1A5276] transition"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <i className="fas fa-check-circle absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
          
          {/* زر التسجيل */}
          <div className="col-span-1 md:col-span-2 mt-4">
            <button 
              className="w-full h-14 rounded-xl cursor-pointer text-white text-xl font-bold bg-[#3E92CC] hover:bg-[#2E7AB3] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-pulse"></i>
                  جاري إنشاء الحساب...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  إنشاء حساب
                </>
              )}
            </button>
          </div>
          
          {/* رابط تسجيل الدخول */}
          <div className="col-span-1 md:col-span-2 text-center mt-4">
            <p className="text-gray-500">
              لديك حساب بالفعل؟ 
              <Link to="/login" className="text-[#1A5276] font-bold mr-1 hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </div>
          
          {/* الشروط والأحكام */}
          <div className="col-span-1 md:col-span-2 text-center mt-2">
            <p className="text-gray-400 text-sm">
              بالضغط على إنشاء حساب، أنت توافق على{' '}
              <Link to="/privacy" className="text-[#1A5276] hover:underline">
                سياسة الخصوصية
              </Link>{' '}
              و{' '}
              <Link to="/terms" className="text-[#1A5276] hover:underline">
                شروط الاستخدام
              </Link>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Register;