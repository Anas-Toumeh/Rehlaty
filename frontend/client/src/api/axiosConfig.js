import axios from 'axios';

// 1. إنشاء نسخة مخصصة من Axios
const API = axios.create({
    baseURL: 'http://localhost:5000/api', // تأكد أن هذا هو رابط الـ Backend الخاص بك
    headers: {
        'Content-Type': 'application/json'
    },
});

// 2. إعداد "Interceptor" لإضافة التوكن تلقائياً لكل طلب
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // جلب التوكن الذي حفظناه عند تسجيل الدخول
        if (token) {
            config.headers['x-auth-token'] = token; // وضعه في الهيدر كما يتوقع الباكيند
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. معالجة الأخطاء الشائعة (مثل انتهاء صلاحية التوكن)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // إذا كان التوكن غير صالح، وجه المستخدم لصفحة تسجيل الدخول
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;