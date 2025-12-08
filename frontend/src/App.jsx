import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import BlogPage from './pages/BlogPage';
import Dashboard from './pages/Dashboard';
import CreatePost from './pages/CreatePost';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PrivateRouter from './components/PrivateRouter';

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                {/* Public Pages */}
                <Route path="/" element={<HomePage />} />
                <Route path="/homepage" element={<HomePage />} />
                <Route path="/blog/:slug" element={<BlogPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Routes */}
                <Route element={<PrivateRouter />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/create-post" element={<CreatePost />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
