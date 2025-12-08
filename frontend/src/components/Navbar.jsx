import { Link, useNavigate } from 'react-router-dom';
import { clearTokens, getAccessToken } from '../utils/auth.js';

function Navbar() {
    const navigate = useNavigate();
    const isLoggedIn = !!getAccessToken();

    const handleLogout = () => {
        clearTokens();
        navigate('/login');
    };

    return (
        <nav className='bg-white shadow-md px-6 py-6 flex justify-between items-center fixed w-full top-0 z-50'>
            <Link to='/' className='text-2xl font-bold text-gray-800'>
                BLOG
            </Link>

            <div className='flex items-center gap-6'>
                {/* Always visible links */}
                <Link to='/HomePage' className='text-gray-800 hover:text-gray-600 font-medium'>
                    Home
                </Link>
                <Link to='/blog' className='text-gray-800 hover:text-gray-600 font-medium'>
                    Blog
                </Link>

                {/* Login/SignUp or Dashboard/Logout */}
                {!isLoggedIn ? (
                    <>
                        <Link to='/login' className='text-gray-800 hover:text-gray-600 font-medium'>
                            Login
                        </Link>
                        <Link to='/signup' className='text-gray-800 hover:text-gray-600 font-medium'>
                            Sign Up
                        </Link>
                    </>
                ) : (
                    <>
                        <Link to='/dashboard' className='text-gray-800 hover:text-gray-600 font-medium'>
                            Dashboard
                        </Link>
                        <button onClick={handleLogout} className='text-gray-800 hover:text-gray-600 font-medium'>
                            Logout
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
