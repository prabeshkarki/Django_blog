// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { clearTokens, getCurrentUser } from "../utils/auth.js";
import { UsersAPI } from "../utils/axios.js";

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState(null);       // basic info from JWT/localStorage
    const [profile, setProfile] = useState(null); // full profile from backend

    // Load user & profile on route change
    useEffect(() => {
        const currentUser = getCurrentUser();
        setUser(currentUser);

        if (currentUser && currentUser.token) {
            UsersAPI.current()
                .then((res) => {
                    setProfile(res.data);
                })
                .catch((err) => {
                    console.error("Error fetching profile for navbar:", err);
                    if (err.response?.status === 401) {
                        clearTokens();
                        navigate("/login");
                    }
                });
        } else {
            setProfile(null);
        }
    }, [location.pathname, navigate]);

    // Scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        clearTokens();
        setUser(null);
        setProfile(null);
        navigate("/login");
        setIsMobileMenuOpen(false);
    };

    const isLoggedIn = user && user.token;

    // Derived display data
    const displayUsername = profile?.username || user?.username || "User";
    const displayEmail = profile?.email || "";
    const avatarLetter = displayUsername.charAt(0).toUpperCase() || "U";
    const avatarUrl = profile?.profile_picture_url || null;

    const isActive = (path) => {
        if (path === "/") {
            return location.pathname === "/";
        }
        return location.pathname.startsWith(path);
    };

    return (
        <>
            <nav
                className={`
                    fixed w-full top-0 z-50 transition-all duration-300
                    ${
                        isScrolled
                            ? "bg-white/95 backdrop-blur-md shadow-lg"
                            : "bg-white/80 backdrop-blur-sm"
                    }
                    border-b border-white/20
                `}
            >
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                    B
                                </span>
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                BlogSpace
                            </span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-1">
                            <Link
                                to="/"
                                className={`
                                    px-4 py-2 rounded-lg font-medium transition-all duration-200
                                    ${
                                        isActive("/")
                                            ? "text-blue-600 bg-blue-50"
                                            : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                                    }
                                `}
                            >
                                Home
                            </Link>

                            <Link
                                to="/blog"
                                className={`
                                    px-4 py-2 rounded-lg font-medium transition-all duration-200
                                    ${
                                        isActive("/blog")
                                            ? "text-blue-600 bg-blue-50"
                                            : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                                    }
                                `}
                            >
                                Blog
                            </Link>

                            {!isLoggedIn ? (
                                <>
                                    <Link
                                        to="/login"
                                        className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="ml-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/dashboard"
                                        className={`
                                            px-4 py-2 rounded-lg font-medium transition-all.duration-200
                                            ${
                                                isActive("/dashboard")
                                                    ? "text-blue-600 bg-blue-50"
                                                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                                            }
                                        `}
                                    >
                                        Dashboard
                                    </Link>

                                    {/* User dropdown (desktop) */}
                                    <div className="relative group ml-1">
                                        <button className="flex items-center space-x-2 px-2 py-1.5 rounded-full font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200">
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl}
                                                    alt={displayUsername}
                                                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                                    onError={(e) => {
                                                        e.target.src =
                                                            "/images/default-profile.png";
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                                                    {avatarLetter}
                                                </div>
                                            )}
                                            {/* Show name on large screens, truncated */}
                                            <span className="hidden lg:inline-block max-w-[120px] truncate text-sm">
                                                {displayUsername}
                                            </span>
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </button>
                                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                            <div className="py-2">
                                                <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                                                    Signed in as{" "}
                                                    <span className="font-semibold">
                                                        {displayUsername}
                                                    </span>
                                                </div>
                                                <Link
                                                    to="/profile"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    Your Profile
                                                </Link>
                                                <Link
                                                    to="/settings"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    Settings
                                                </Link>
                                                <button
                                                    onClick={handleLogout}
                                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                                                >
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() =>
                                setIsMobileMenuOpen(!isMobileMenuOpen)
                            }
                            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
                        >
                            {isMobileMenuOpen ? (
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100">
                        <div className="container mx-auto px-4 py-4">
                            <div className="space-y-2">
                                <Link
                                    to="/"
                                    className={`
                                        block px-4 py-3 rounded-lg font-medium transition-all duration-200
                                        ${
                                            isActive("/")
                                                ? "text-blue-600 bg-blue-50"
                                                : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                                        }
                                    `}
                                >
                                    Home
                                </Link>
                                <Link
                                    to="/blog"
                                    className={`
                                        block px-4 py-3 rounded-lg font-medium transition-all duration-200
                                        ${
                                            isActive("/blog")
                                                ? "text-blue-600 bg-blue-50"
                                                : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                                        }
                                    `}
                                >
                                    Blog
                                </Link>

                                {!isLoggedIn ? (
                                    <>
                                        <Link
                                            to="/login"
                                            className="block px-4 py-3 rounded-lg font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            to="/signup"
                                            className="block px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium text-center"
                                        >
                                            Sign Up
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/dashboard"
                                            className={`
                                                block px-4 py-3 rounded-lg font-medium transition-all duration-200
                                                ${
                                                    isActive("/dashboard")
                                                        ? "text-blue-600 bg-blue-50"
                                                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                                                }
                                            `}
                                        >
                                            Dashboard
                                        </Link>
                                        <Link
                                            to="/create-post"
                                            className="block px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium text-center"
                                        >
                                            Create New Post
                                        </Link>

                                        {/* User info (mobile) */}
                                        <div className="px-4 py-3 flex items-center space-x-3">
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl}
                                                    alt={displayUsername}
                                                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                                    onError={(e) => {
                                                        e.target.src =
                                                            "/images/default-profile.png";
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                                                    {avatarLetter}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {displayUsername}
                                                </div>
                                                {displayEmail && (
                                                    <div className="text-sm text-gray-500 truncate">
                                                        {displayEmail}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50"
                                        >
                                            Logout
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Spacer */}
            <div className="h-16" />
        </>
    );
}

export default Navbar;