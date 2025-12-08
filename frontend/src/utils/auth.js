// utils/auth.js - COMPLETE WITH ALL EXPORTS
export const saveTokens = (data) => {
    // JWT returns: { access: "...", refresh: "..." }
    console.log("Login response data:", data);
    
    if (data.access && data.refresh) {
        // JWT format
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        
        try {
            const payload = JSON.parse(atob(data.access.split('.')[1]));
            localStorage.setItem("user_id", payload.user_id || payload.id);
            localStorage.setItem("username", payload.username);
        } catch (e) {
            console.log("Could not decode JWT:", e);
        }
    } else if (data.token) {
        // Fallback for Token auth
        localStorage.setItem("access_token", data.token);
        localStorage.setItem("token", data.token);
        if (data.user_id) localStorage.setItem("user_id", data.user_id);
        if (data.username) localStorage.setItem("username", data.username);
    }
    
    console.log("Tokens saved to localStorage");
};

export const getAccessToken = () => {
    return localStorage.getItem("access_token");
};

export const clearTokens = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("token");
};

export const isAuthenticated = () => {
    const token = localStorage.getItem("access_token");
    return !!token;
};

export const logout = () => {
    clearTokens(); // Now uses clearTokens function
    window.location.href = "/login";
};

// Optional: Add more common exports
export const getCurrentUser = () => {
    return {
        id: localStorage.getItem("user_id"),
        username: localStorage.getItem("username"),
        token: localStorage.getItem("access_token")
    };
};

export const hasToken = () => {
    return !!localStorage.getItem("access_token");
};