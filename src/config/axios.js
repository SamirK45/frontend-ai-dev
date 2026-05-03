// import axios from "axios";

// const axiosInstance = axios.create({
//     baseURL:import.meta.env.VITE_API_URL,
//     headers:{
//         "Authorization":`bearer ${localStorage.getItem('token')}`
//     }
// })

// export default axiosInstance;

import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

// Add request interceptor to dynamically add token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;