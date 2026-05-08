import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import bg from "../../assets/SingBus.png";
import logo from "../../assets/SingLogo.png";

const UserLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // مسح الخطأ عند تغيير الحقول
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
        setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
        return;
    }
    
    setLoading(true);
    setError('');
    
    try {
        // ✅ استخدام مسار customer-login بدلاً من login
        const response = await axios.post('http://localhost:5000/api/auth/customer-login', {
            email: formData.email,
            password: formData.password
        });
        
        if (response.data.success) {
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('userId', user._id);
            localStorage.setItem('userRole', user.role);
            
            console.log('✅ Customer login successful!', response.data);
            
            // توجيه العميل إلى صفحته
            navigate(`/user/${user._id}`);
        }
    } catch (err) {
        console.error('❌ Login error:', err);
        const errorMessage = err.response?.data?.message || 'فشل في تسجيل الدخول';
        setError(errorMessage);
    } finally {
        setLoading(false);
    }
};

  return (
    <div className="flex font-Tajawal min-h-screen" >
      {/* القسم الأيمن - الصورة */}
      <div className="w-[80%] h-screen bg-center   hidden lg:block">
        <img src={bg} alt="Background" className="h-screen w-full" />
      </div>
      
      {/* القسم الأيسر - نموذج تسجيل الدخول */}
      <form 
        className="pt-25 place-items-center bg-white lg:-ml-20 pl-10 w-full lg:w-[50%] rounded-bl-[80px] shadow-xl lg:shadow-none"
        onSubmit={handleSubmit}
      >
        <div className="w-[80%] md:w-[60%] lg:w-[70%] xl:w-[50%] mb-8">
          <img src={logo} alt="Logo" className="w-full max-w-[200px] mx-auto" />
         
        </div>
        
        <div className="grid grid-cols-1 gap-x-3 gap-y-6 w-[80%] md:w-[60%] lg:w-[80%] xl:w-[70%]">
          
          {/* رسالة الخطأ */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-right">
              <i className="fas fa-exclamation-circle ml-2"></i>
              {error}
            </div>
          )}
          
          {/* حقل البريد الإلكتروني */}
          <div>
            <label className="block text-right font-medium text-gray-700">
              : البريد الإلكتروني
            </label>
            <div className="relative mt-2">
              <input
                placeholder="example@email.com"
                className="w-full h-12 border text-right pr-4 pl-10 rounded-lg shadow-sm text-[#1A5276] border-[#596a745e] placeholder:text-[#8f9ea8d8] focus:outline-none focus:border-[#1A5276] focus:ring-1 focus:ring-[#1A5276] transition"
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
          
          {/* حقل كلمة المرور */}
          <div>
            <label className="block text-right font-medium text-gray-700">
              : كلمة المرور
            </label>
            <div className="relative mt-2">
              <input
                placeholder="••••••••"
                className="w-full h-12 border text-right pr-4 pl-12 rounded-lg shadow-sm text-[#1A5276] border-[#596a745e] placeholder:text-[#8f9ea8d8] focus:outline-none focus:border-[#1A5276] focus:ring-1 focus:ring-[#1A5276] transition"
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
          
          {/* خيارات إضافية */}
          <div className="flex justify-between items-center text-sm">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="ml-2 w-4 h-4 text-[#3E92CC] rounded"
              />
              <span className="text-gray-600">تذكرني</span>
            </label>
            <Link to="/forgot-password" className="text-[#3E92CC] hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </div>
          
          {/* زر تسجيل الدخول */}
          <button 
            className="w-full h-14 place-self-center mt-5 text-white text-xl font-bold bg-[#3E92CC] rounded-lg hover:bg-[#2E7AB3] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-pulse"></i>
                جاري تسجيل الدخول...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i>
                تسجيل الدخول
              </>
            )}
          </button>
          
          {/* رابط إنشاء حساب جديد */}
          <div className="text-center">
            <p className="text-gray-500">
              ليس لديك حساب؟ 
              <Link to="/register" className="text-[#1A5276] font-bold mr-1 hover:underline">
                إنشاء حساب جديد
              </Link>
            </p>
          </div>
          
          {/* الشروط والأحكام */}
          <p className="text-gray-400 text-center text-sm mt-4">
            بالضغط على تسجيل الدخول، أنت توافق على{' '}
            <Link to="/privacy" className="text-[#1A5276] hover:underline">
              سياسة الخصوصية
            </Link>{' '}
            و{' '}
            <Link to="/terms" className="text-[#1A5276] hover:underline">
              شروط الاستخدام
            </Link>
          </p>
          
          {/* رابط تسجيل دخول الشركات */}
          
        </div>
      </form>
    </div>
  );
};

export default UserLogin;