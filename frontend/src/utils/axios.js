// src/utils/axios.js
// JWT-enabled Axios for Django backend

import axios from "axios";

// Create an Axios instance
const instance = axios.create({
    baseURL: "http://localhost:8000", // Django backend root
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// Attach JWT token automatically on every request
instance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("access_token");
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle token refresh on 401 responses
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refresh_token");
                if (!refreshToken) throw new Error("No refresh token found");

                // Refresh token endpoint
                const refreshResponse = await axios.post(
                    `${instance.defaults.baseURL}/api/token/refresh/`,
                    { refresh: refreshToken }
                );

                const { access } = refreshResponse.data;
                localStorage.setItem("access_token", access);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return instance(originalRequest);
            } catch (refreshError) {
                // Refresh failed: logout client-side
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("user_id");
                localStorage.removeItem("username");
                localStorage.removeItem("token");
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Posts API
 */
export const PostsAPI = {
    // data: FormData (title, content, category_id, image, etc.)
    create: (data, onUploadProgress) =>
        instance.post("/api/posts/", data, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress,
        }),
    list: (params) => instance.get("/api/posts/", { params }), // e.g. { category, mine }
    detail: (id) => instance.get(`/api/posts/${id}/`),
    update: (id, data) => instance.put(`/api/posts/${id}/`, data),
    delete: (id) => instance.delete(`/api/posts/${id}/`),
};

/**
 * Categories API
 */
export const CategoriesAPI = {
    list: () => instance.get("/api/categories/"),
    create: (data) => instance.post("/api/categories/", data),
    delete: (id) => instance.delete(`/api/categories/${id}/delete/`),
};

/**
 * Users / Profile API
 */
export const UsersAPI = {
    // GET /api/users/me/ → profile data
    current: () => instance.get("/api/users/me/"),

    // PUT /api/users/me/ → update profile data (multipart for image upload)
    updateProfile: (data) =>
        instance.put("/api/users/me/", data, {
            headers: { "Content-Type": "multipart/form-data" },
        }),
};

export default instance;