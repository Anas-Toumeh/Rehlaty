import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role);
      if(res.data.user.companyId)
      localStorage.setItem('companyId',res.data.user.companyId)
    localStorage.setItem('id',res.data.user.id)
    
    

      const role = res.data.user.role;
      console.log(role);
      console.log(res);
      
      
      if (role === 'Admin') navigate('/admin-dashboard');
      else if (role === 'CompanyManager') navigate('/manager-dashboard');
      else if (role === 'Employee') navigate('/employee/trips');
      else navigate('/user-home');

    } catch (err) {
      setError(err.response?.data?.msg || "حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // الخلفية الخارجية: رمادي فاتح جداً (Neutral 100) يعطي راحة للعين
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      
      {/* الكارت الأساسي الأبيض مع الإطار السفلي الناعم */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border-b-[6px] border-b-[#1D4ED8] transition-all duration-300">
        
        <div className="p-10">
          {/* قسم الشعار */}
          <div className="flex flex-col items-center mb-8">
            <img 
              src={logo} 
              alt="رحلتي - Bus" 
              className="h-20 w-auto mb-6"
            />
            {/* خط فاصل ناعم جداً */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 border-r-4 border-red-500 text-red-700 p-3 rounded text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">البريد الإلكتروني</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] outline-none transition-all"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">كلمة المرور</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] outline-none transition-all"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full mt-4 ${isLoading ? 'bg-gray-400': 'bg-kadmous-blue hover:bg-[#163da3] hover:text-white'} text-[#163da3] font-bold py-4 rounded-xl shadow-lg shadow-kadmous-blue/20 transform transition active:scale-95 flex items-center justify-center`}
            >
              {isLoading ? 'جاري التحقق...' : 'دخول للنظام'}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
              نظام إدارة الرحلات الذكي
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;