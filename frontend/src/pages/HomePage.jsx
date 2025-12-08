import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../utils/axios.js";
import { getCurrentUser } from "../utils/auth.js";

export default function HomePage() {
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [showAllPosts, setShowAllPosts] = useState(false);
    const [featuredPost, setFeaturedPost] = useState(null);

    // Get current user on load
    useEffect(() => {
        const user = getCurrentUser();
        setCurrentUser(user);
    }, []);

    // Fetch posts with filters
    useEffect(() => {
        fetchPosts();
    }, [selectedCategory, sortBy]);

    // Fetch categories
    useEffect(() => {
        axios.get("/api/categories/")
            .then(res => {
                setCategories(Array.isArray(res.data) ? res.data : []);
            })
            .catch(err => console.error("Error fetching categories:", err));
    }, []);

    const fetchPosts = () => {
        setLoading(true);
        setError(null);
        
        let url = "/api/posts/";
        
        // Add category filter if not "all"
        if (selectedCategory !== "all" && selectedCategory !== "") {
            url += `?category=${selectedCategory}`;
        }

        axios.get(url)
            .then(res => {
                let postData = Array.isArray(res.data) ? res.data : [];
                
                // Sort posts
                postData = sortPosts(postData, sortBy);
                
                // Set featured post (most recent with featured flag or first post)
                if (postData.length > 0) {
                    const featured = postData.find(p => p.featured) || postData[0];
                    setFeaturedPost(featured);
                }
                
                setPosts(postData);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching posts:", err);
                setError(err.response?.data?.detail || err.message);
                setLoading(false);
            });
    };

    const sortPosts = (posts, sortOption) => {
        const sortedPosts = [...posts];
        
        switch(sortOption) {
            case "newest":
                return sortedPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            case "oldest":
                return sortedPosts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            case "popular":
                return sortedPosts.sort((a, b) => (b.views || 0) - (a.views || 0));
            case "title-asc":
                return sortedPosts.sort((a, b) => a.title.localeCompare(b.title));
            case "title-desc":
                return sortedPosts.sort((a, b) => b.title.localeCompare(a.title));
            default:
                return sortedPosts;
        }
    };

    const filterPostsBySearch = (posts) => {
        if (!searchQuery.trim()) return posts;
        
        const query = searchQuery.toLowerCase();
        return posts.filter(post => 
            post.title.toLowerCase().includes(query) || 
            post.content.toLowerCase().includes(query) ||
            post.author?.toLowerCase().includes(query) ||
            post.category?.name?.toLowerCase().includes(query)
        );
    };

    const handleRefresh = () => {
        fetchPosts();
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            fetchPosts();
        }
    };

    // Calculate reading time
    const getReadingTime = (content) => {
        const words = content ? content.split(/\s+/).length : 0;
        return Math.max(1, Math.ceil(words / 200)); // 200 words per minute
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    const filteredPosts = filterPostsBySearch(posts);
    const displayedPosts = showAllPosts ? filteredPosts : filteredPosts.slice(0, 6);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Hero Section with Search */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: '60px 60px'
                    }}></div>
                </div>
                
                <div className="relative container mx-auto px-4 py-16 md:py-24">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Welcome Message */}
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                            Welcome to 
                            <span className="block bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                                BlogSpace
                            </span>
                        </h1>
                        
                        <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                            Discover amazing articles, tutorials, and insights from our community of writers
                        </p>

                        {/* Stats */}
                        <div className="flex flex-wrap justify-center gap-6 mb-10">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">{posts.length}</div>
                                <div className="text-blue-200 text-sm">Total Articles</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">{categories.length}</div>
                                <div className="text-blue-200 text-sm">Categories</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">
                                    {new Set(posts.map(p => p.author)).size}
                                </div>
                                <div className="text-blue-200 text-sm">Writers</div>
                            </div>
                        </div>

                        {/* Enhanced Search Bar */}
                        <div className="max-w-2xl mx-auto">
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative">
                                    <div className="flex">
                                        <input
                                            type="text"
                                            placeholder="Search articles by title, topic, or author..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={handleSearch}
                                            className="flex-grow p-4 pl-12 pr-16 rounded-l-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={() => fetchPosts()}
                                            className="px-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-r-2xl font-medium hover:opacity-90 transition-opacity flex items-center"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            Search
                                        </button>
                                    </div>
                                    <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-blue-200 text-sm mt-3">
                                Try searching for topics like "technology", "travel", or "lifestyle"
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                            {currentUser ? (
                                <Link
                                    to="/create-post"
                                    className="px-8 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
                                >
                                    ✍️ Write an Article
                                </Link>
                            ) : (
                                <Link
                                    to="/signup"
                                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
                                >
                                    Join Our Community
                                </Link>
                            )}
                            <Link
                                to="#featured"
                                className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
                            >
                                📚 Browse Articles
                            </Link>
                        </div>
                    </div>
                </div>
                
                {/* Wave Divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg className="w-full h-16 text-white" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 50C840 40 960 30 1080 20C1200 10 1320 0 1380 0H1440V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="currentColor"/>
                    </svg>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                {/* Featured Post */}
                {featuredPost && (
                    <div id="featured" className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">🌟 Featured Story</h2>
                            <span className="text-sm text-gray-500">Editor's Pick</span>
                        </div>
                        <div className="bg-gradient-to-r from-white to-blue-50 rounded-2xl shadow-xl overflow-hidden border border-blue-100">
                            <div className="md:flex">
                                <div className="md:w-2/3 p-8">
                                    <div className="flex items-center mb-4">
                                        {featuredPost.category && (
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                {featuredPost.category.name}
                                            </span>
                                        )}
                                        <span className="mx-3 text-gray-400">•</span>
                                        <span className="text-gray-500">{formatDate(featuredPost.created_at)}</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                                        <Link to={`/blog/${featuredPost.slug || featuredPost.id}`} className="hover:text-blue-600">
                                            {featuredPost.title}
                                        </Link>
                                    </h3>
                                    <p className="text-gray-600 text-lg mb-6 line-clamp-3">
                                        {featuredPost.excerpt || featuredPost.content?.slice(0, 200) + '...'}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold mr-3">
                                                {featuredPost.author?.charAt(0) || 'A'}
                                            </div>
                                            <div>
                                                <div className="font-medium">{featuredPost.author || 'Anonymous'}</div>
                                                <div className="text-sm text-gray-500">{getReadingTime(featuredPost.content)} min read</div>
                                            </div>
                                        </div>
                                        <Link
                                            to={`/blog/${featuredPost.slug || featuredPost.id}`}
                                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90"
                                        >
                                            Read Full Story
                                        </Link>
                                    </div>
                                </div>
                                <div className="md:w-1/3 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-8">
                                    <div className="text-center text-white">
                                        <div className="text-5xl mb-4">📖</div>
                                        <h4 className="font-bold text-xl mb-2">Featured Article</h4>
                                        <p className="text-blue-100">Selected by our editors for exceptional quality</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Controls Section */}
                <div className="mb-8 bg-white rounded-2xl shadow p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                Latest Articles {selectedCategory !== "all" && categories.find(c => c.id == selectedCategory) && 
                                    <span className="text-blue-600"> in "{categories.find(c => c.id == selectedCategory).name}"</span>
                                }
                            </h2>
                            <p className="text-gray-600">
                                {displayedPosts.length} of {filteredPosts.length} articles shown
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            {/* Category Filter */}
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">📁 All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name} ({cat.post_count || 0})
                                    </option>
                                ))}
                            </select>

                            {/* Sort Options */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="newest">🕐 Newest First</option>
                                <option value="oldest">🕚 Oldest First</option>
                                <option value="popular">🔥 Popular</option>
                                <option value="title-asc">🔤 A to Z</option>
                                <option value="title-desc">🔤 Z to A</option>
                            </select>

                            {/* Create Post Button */}
                            {currentUser && (
                                <Link
                                    to="/create-post"
                                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:opacity-90 font-medium text-center flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Write Article
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-16">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading Articles</h3>
                        <p className="text-gray-500">Fetching the latest content...</p>
                    </div>
                ) : error ? (
                    // Error State
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                        <div className="text-red-500 text-5xl mb-4">⚠️</div>
                        <h3 className="text-xl font-semibold text-red-700 mb-2">Unable to Load Articles</h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={handleRefresh}
                            className="mt-6 px-6 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredPosts.length === 0 ? (
                    // Empty State
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-12 text-center">
                        <div className="text-yellow-500 text-5xl mb-4">📝</div>
                        <h3 className="text-2xl font-bold text-yellow-700 mb-3">No Articles Found</h3>
                        <p className="text-yellow-600 mb-6 max-w-md mx-auto">
                            {searchQuery 
                                ? `No articles found matching "${searchQuery}". Try a different search term.`
                                : selectedCategory !== "all" 
                                    ? `No articles found in this category. Be the first to write one!`
                                    : "No articles have been published yet. Start the conversation!"
                            }
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="px-6 py-3 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-200 font-medium"
                                >
                                    Clear Search
                                </button>
                            )}
                            {selectedCategory !== "all" && (
                                <button
                                    onClick={() => setSelectedCategory("all")}
                                    className="px-6 py-3 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-200 font-medium"
                                >
                                    View All Categories
                                </button>
                            )}
                            {currentUser && (
                                <Link
                                    to="/create-post"
                                    className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium"
                                >
                                    Create First Article
                                </Link>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Posts Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {displayedPosts.map(post => (
                                <article 
                                    key={post.id} 
                                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 border border-gray-100 group"
                                >
                                    {/* Category Badge */}
                                    {post.category && (
                                        <div className="px-6 pt-6">
                                            <span className="inline-block px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 rounded-full border border-blue-100">
                                                {post.category.name}
                                            </span>
                                        </div>
                                    )}

                                    {/* Post Content */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            <Link to={`/blog/${post.slug || post.id}`}>
                                                {post.title}
                                            </Link>
                                        </h3>
                                        
                                        {/* Excerpt */}
                                        <p className="text-gray-600 mb-4 line-clamp-3">
                                            {post.excerpt || (post.content 
                                                ? post.content.slice(0, 120) + (post.content.length > 120 ? '...' : '')
                                                : 'No content available'
                                            )}
                                        </p>

                                        {/* Author and Metadata */}
                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-semibold mr-2">
                                                    {post.author?.charAt(0) || 'U'}
                                                </div>
                                                <span className="font-medium">{post.author || 'Anonymous'}</span>
                                            </div>
                                            <span>{formatDate(post.created_at)}</span>
                                        </div>

                                        {/* Stats and Actions */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <span className="flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {getReadingTime(post.content)} min
                                                </span>
                                            </div>
                                            <Link
                                                to={`/blog/${post.slug || post.id}`}
                                                className="text-blue-600 hover:text-blue-800 font-medium flex items-center group"
                                            >
                                                Read
                                                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* Show More/Less Button */}
                        {filteredPosts.length > 6 && (
                            <div className="text-center mt-12">
                                <button
                                    onClick={() => setShowAllPosts(!showAllPosts)}
                                    className="px-8 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 rounded-xl font-bold hover:from-gray-200 hover:to-gray-300 transition-all shadow-lg hover:shadow-xl flex items-center mx-auto"
                                >
                                    {showAllPosts ? (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                            </svg>
                                            Show Less Articles
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                            Show More Articles ({filteredPosts.length - 6} more)
                                        </>
                                    )}
                                </button>
                                <p className="text-gray-500 text-sm mt-3">
                                    {showAllPosts 
                                        ? `Showing all ${filteredPosts.length} articles` 
                                        : `Showing 6 of ${filteredPosts.length} articles`
                                    }
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}