import axios from 'axios';

// 1. Create a custom instance of Axios
const API = axios.create({
    baseURL: 'http://localhost:5000/api', // Make sure this is your Backend URL
    headers: {
        'Content-Type': 'application/json'
    },
});

// 2. Setup Interceptor to automatically add token to each request
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Retrieve the token saved at login
        if (token) {
            config.headers['x-auth-token'] = token; // Add it to the header as expected by the backend
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. Handle common errors (such as token expiration)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // If the token is invalid, redirect the user to the login page
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;