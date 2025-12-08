// Login.js - WITH DEBUGGING
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveTokens } from "../utils/auth";
import axios from "../utils/axios"; // Import axios

function Login() {
  const BASE = import.meta.env.VITE_DJANGO_BASE_URL || "http://localhost:8000";
  const [form, setForm] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState("");
  const nav = useNavigate();

  const handleChange = e => setForm({...form, [e.target.name]: e.target.value});

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg("");
    console.log("Attempting login with:", { ...form, password: "***" });
    
    try {
      const res = await fetch(`${BASE}/api/token/`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      console.log("Login response:", data);
      console.log("Response status:", res.status);
      
      if (res.ok) {
        saveTokens(data);
        setMsg("Login successful!");
        
        // Test if token works by fetching posts
        setTimeout(async () => {
          try {
            // Use axios to test authenticated request
            const testResponse = await axios.get("/api/posts/");
            console.log("Post-fetch test successful:", testResponse.data.length, "posts");
            nav("/");
          } catch (error) {
            console.error("Post-login test failed:", error);
            setMsg("Login ok but cannot fetch posts. Check token.");
          }
        }, 800);
      } else {
        setMsg(data.detail || "Invalid credentials");
      }
    } catch(err) {
      console.error("Login error:", err);
      setMsg("Network error. Is Django running?");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input 
            name="username" 
            onChange={handleChange} 
            value={form.username} 
            placeholder="Username" 
            required 
            className="w-full p-2 border rounded"
          />
          <input 
            name="password" 
            type="password" 
            onChange={handleChange} 
            value={form.password} 
            placeholder="Password" 
            required 
            className="w-full p-2 border rounded"
          />
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>
        {msg && (
          <p className={`mt-3 text-sm ${msg.includes("successful") ? "text-green-600" : "text-red-600"}`}>
            {msg}
          </p>
        )}
        <div className="mt-4 text-sm text-center">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <a href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </a>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Test credentials: admin/admin (if available)
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;