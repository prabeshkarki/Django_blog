import axios from "axios";

// Create an Axios instance with Django backend URL
const instance = axios.create({
baseURL: "[http://localhost:8000](http://localhost:8000)", // Django backend URL
headers: {
"Content-Type": "application/json",
},
});

// Automatically attach JWT token to every request if available
instance.interceptors.request.use(config => {
const token = localStorage.getItem("access_token"); // or your auth storage key
if (token) {
config.headers.Authorization = `Bearer ${token}`;
}
return config;
}, error => {
return Promise.reject(error);
});

export default instance;
