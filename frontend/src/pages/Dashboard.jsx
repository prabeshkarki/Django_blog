import { useEffect, useState } from "react";
import axios from "../utils/axios.js";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../utils/auth.js";

export default function Dashboard() {
    const [myPosts, setMyPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        published: 0,
        drafts: 0,
        views: 0
    });
    const navigate = useNavigate();

    // Get current user
    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.token) {
            navigate("/login");
            return;
        }
        setUser(currentUser);
    }, [navigate]);

    // Fetch user's posts only
    const fetchMyPosts = () => {
        if (!user) return;
        
        setLoading(true);
        axios.get("/api/posts/")
            .then(res => {
                const allPosts = Array.isArray(res.data) ? res.data : [];
                
                // Filter posts created by current user
                const userPosts = allPosts.filter(post => 
                    post.author_id === user.id || 
                    post.author === user.username ||
                    (typeof post.author === 'object' && post.author.id === user.id)
                );
                
                setMyPosts(userPosts);
                calculateStats(userPosts);
            })
            .catch(err => {
                console.error("Error fetching posts:", err);
                if (err.response?.status === 401) {
                    logout();
                    navigate("/login");
                }
            })
            .finally(() => setLoading(false));
    };

    // Calculate user's post statistics
    const calculateStats = (posts) => {
        const published = posts.filter(p => p.published).length;
        const drafts = posts.filter(p => !p.published).length;
        const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
        
        setStats({
            total: posts.length,
            published,
            drafts,
            views: totalViews
        });
    };

    useEffect(() => {
        if (user) {
            fetchMyPosts();
        }
    }, [user]);

    // Delete post
    const handleDelete = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;

        try {
            await axios.delete(`/api/posts/${postId}/`);
            alert("Post deleted successfully!");
            fetchMyPosts(); // Refresh list
        } catch (err) {
            console.error("Error deleting post:", err);
            
            if (err.response?.status === 403) {
                alert("You don't have permission to delete this post.");
            } else if (err.response?.status === 401) {
                alert("Session expired. Please login again.");
                logout();
                navigate("/login");
            } else {
                alert("Failed to delete post. Please try again.");
            }
        }
    };

    // Toggle post published status
    const handleTogglePublish = async (postId, currentStatus) => {
        try {
            await axios.put(`/api/posts/${postId}/`, {
                published: !currentStatus
            });
            fetchMyPosts(); // Refresh list
        } catch (err) {
            console.error("Error toggling publish status:", err);
            alert("Failed to update post status.");
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Loading user information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
                            <p className="text-gray-600 mt-1">
                                Welcome back, <span className="font-semibold text-blue-600">{user.username}</span>
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Manage your posts and track your writing activity
                            </p>
                        </div>
                        <Link
                            to="/create-post"
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:opacity-90 font-medium flex items-center shadow-md hover:shadow-lg transition-all"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Create New Post
                        </Link>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                            <div className="text-sm text-gray-600">Total Posts</div>
                            <div className="text-xs text-gray-400 mt-1">Posts you've created</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
                            <div className="text-sm text-gray-600">Published</div>
                            <div className="text-xs text-gray-400 mt-1">Visible to everyone</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="text-2xl font-bold text-yellow-600">{stats.drafts}</div>
                            <div className="text-sm text-gray-600">Drafts</div>
                            <div className="text-xs text-gray-400 mt-1">Only visible to you</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="text-2xl font-bold text-purple-600">{stats.views}</div>
                            <div className="text-sm text-gray-600">Total Views</div>
                            <div className="text-xs text-gray-400 mt-1">Across all your posts</div>
                        </div>
                    </div>
                </div>

                {/* My Posts Section */}
                <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden mb-8">
                    <div className="border-b border-gray-200">
                        <div className="px-6 py-4">
                            <h2 className="text-xl font-bold text-gray-900">My Posts ({myPosts.length})</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                All posts you've created. Only you can edit or delete these posts.
                            </p>
                        </div>
                    </div>

                    {/* Posts List */}
                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                                <p className="text-gray-600">Loading your posts...</p>
                            </div>
                        ) : myPosts.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-5xl mb-4">📝</div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Posts Yet</h3>
                                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                    You haven't created any posts yet. Start sharing your ideas with the community!
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Link
                                        to="/create-post"
                                        className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:opacity-90 font-medium"
                                    >
                                        Create Your First Post
                                    </Link>
                                    <Link
                                        to="/"
                                        className="inline-block px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                    >
                                        Browse Posts
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myPosts.map(post => (
                                    <div 
                                        key={post.id} 
                                        className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            {/* Post Info */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-lg mb-2 hover:text-blue-600">
                                                            <Link 
                                                                to={`/post/${post.slug || post.id}`}
                                                                className="hover:text-blue-600"
                                                            >
                                                                {post.title}
                                                            </Link>
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-3">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                                post.published 
                                                                    ? "bg-green-100 text-green-800 border border-green-200" 
                                                                    : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                                            }`}>
                                                                {post.published ? "Published" : "Draft"}
                                                            </span>
                                                            {post.category && (
                                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200 rounded-full text-xs">
                                                                    {post.category.name}
                                                                </span>
                                                            )}
                                                            <span className="text-gray-400">•</span>
                                                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                                            <span className="text-gray-400">•</span>
                                                            <span className="flex items-center">
                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                                {post.views || 0} views
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Excerpt */}
                                                <p className="text-gray-600 text-sm line-clamp-2">
                                                    {post.excerpt || (post.content?.slice(0, 120) + '...')}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Link
                                                    to={`/post/${post.slug || post.id}`}
                                                    className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                                >
                                                    View
                                                </Link>
                                                
                                                <Link
                                                    to={`/edit-post/${post.id}`}
                                                    className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleTogglePublish(post.id, post.published)}
                                                    className={`px-4 py-2 text-sm rounded-lg font-medium ${
                                                        post.published
                                                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                                            : "bg-green-100 text-green-700 hover:bg-green-200"
                                                    }`}
                                                >
                                                    {post.published ? "Unpublish" : "Publish"}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-6 text-lg">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Link
                            to="/create-post"
                            className="p-5 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">Create New Post</div>
                                    <div className="text-sm text-gray-500 mt-1">Start writing a new article</div>
                                </div>
                            </div>
                        </Link>
                        
                        <Link
                            to="/"
                            className="p-5 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all group"
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">Browse Blog</div>
                                    <div className="text-sm text-gray-500 mt-1">See all published posts</div>
                                </div>
                            </div>
                        </Link>
                        
                        <button
                            onClick={fetchMyPosts}
                            className="p-5 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group text-left"
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">Refresh Posts</div>
                                    <div className="text-sm text-gray-500 mt-1">Update your posts list</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* User Info */}
                <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold mr-4">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{user.username}</h3>
                            <p className="text-gray-600">{user.email || 'No email provided'}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Member since {new Date().toLocaleDateString()} • {stats.total} posts created
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                logout();
                                navigate("/login");
                            }}
                            className="ml-auto px-4 py-2 text-sm bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}