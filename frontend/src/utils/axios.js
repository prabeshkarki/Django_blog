// utils/axios.js - UPDATED FOR JWT
import axios from "axios";

// Create an Axios instance with Django backend URL
const instance = axios.create({
    baseURL: "http://localhost:8000", // Django backend URL
    headers: {
        "Content-Type": "application/json",
    },
});

// Automatically attach JWT token to every request
instance.interceptors.request.use(config => {
    const accessToken = localStorage.getItem("access_token");
    
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`; // JWT uses "Bearer"
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Handle token refresh automatically
instance.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem("refresh_token");
                if (!refreshToken) {
                    throw new Error("No refresh token");
                }
                
                // Try to refresh the token
                const response = await axios.post(
                    `${instance.defaults.baseURL}/api/token/refresh/`,
                    { refresh: refreshToken }
                );
                
                const { access } = response.data;
                localStorage.setItem("access_token", access);
                
                // Update the original request with new token
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return instance(originalRequest);
                
            } catch (refreshError) {
                // Refresh failed, redirect to login
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("user");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default instance;