// src/App.jsx
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import BlogPage from './pages/BlogPage';
import Dashboard from './pages/Dashboard';
import CreatePost from './pages/CreatePost';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PrivateRouter from './components/PrivateRouter';
import Profile from './pages/Profile';

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                {/* Public Pages */}
                <Route path="/" element={<HomePage />} />
                {/* /blog as alias for the main listing */}
                <Route path="/blog" element={<HomePage />} />
                <Route path="/homepage" element={<HomePage />} />

                {/* Post detail pages (slug-based) */}
                <Route path="/blog/:slug" element={<BlogPage />} />
                <Route path="/post/:slug" element={<BlogPage />} />

                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Routes */}
                <Route element={<PrivateRouter />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/create-post" element={<CreatePost />} />
                    <Route path="/profile" element={<Profile />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;