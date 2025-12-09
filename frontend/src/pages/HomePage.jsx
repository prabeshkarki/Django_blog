// src/pages/HomePage.jsx
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

    // Fetch posts when category or sort changes
    useEffect(() => {
        fetchPosts();
    }, [selectedCategory, sortBy]);

    // Fetch categories once
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
        if (selectedCategory !== "all" && selectedCategory !== "") {
            url += `?category=${selectedCategory}`;
        }

        axios.get(url)
            .then(res => {
                let postData = Array.isArray(res.data) ? res.data : [];

                // Sort posts
                postData = sortPosts(postData, sortBy);

                // Pick featured post
                if (postData.length > 0) {
                    const featured = postData.find(p => p.featured) || postData[0];
                    setFeaturedPost(featured);
                } else {
                    setFeaturedPost(null);
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
        const sorted = [...posts];
        switch (sortOption) {
            case "newest":
                return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            case "oldest":
                return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            case "popular":
                return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
            default:
                return sorted;
        }
    };

    const filterPostsBySearch = (posts) => {
        if (!searchQuery.trim()) return posts;
        const q = searchQuery.toLowerCase();
        return posts.filter(post =>
            post.title.toLowerCase().includes(q) ||
            post.content.toLowerCase().includes(q) ||
            post.author?.toLowerCase().includes(q) ||
            post.category?.name?.toLowerCase().includes(q)
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getReadingTime = (content) => {
        const words = content ? content.split(/\s+/).length : 0;
        return Math.max(1, Math.ceil(words / 200));
    };

    const filteredPosts = filterPostsBySearch(posts);
    const displayedPosts = showAllPosts ? filteredPosts : filteredPosts.slice(0, 6);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Simple Hero */}
            <section className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                                Welcome to <span className="text-blue-600">BlogSpace</span>
                            </h1>
                            <p className="text-gray-600 max-w-xl">
                                Read and share articles on any topic. Discover new ideas from our community.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Search by title, author, or topic..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                                <svg
                                    className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                            {currentUser && (
                                <Link
                                    to="/create-post"
                                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 text-center"
                                >
                                    Write a post
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Controls */}
            <section className="bg-gray-50 border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <div className="flex gap-2 flex-wrap items-center">
                        <span className="text-sm text-gray-600 font-medium">Category:</span>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name} ({cat.post_count || 0})
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={fetchPosts}
                            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100"
                        >
                            Refresh
                        </button>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                        <span className="text-sm text-gray-600 font-medium">Sort:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                            <option value="popular">Most views</option>
                        </select>
                    </div>
                </div>
            </section>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Loading / Error / Empty states */}
                {loading && (
                    <div className="py-12 text-center text-gray-600">
                        <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                        <p>Loading posts...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="py-12 text-center">
                        <p className="text-red-600 font-medium mb-2">Failed to load articles.</p>
                        <p className="text-gray-500 text-sm mb-4">{error}</p>
                        <button
                            onClick={fetchPosts}
                            className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !error && filteredPosts.length === 0 && (
                    <div className="py-12 text-center text-gray-600">
                        <p className="text-lg font-medium mb-2">No posts found</p>
                        <p className="text-sm text-gray-500 mb-4">
                            Try a different search term or category.
                        </p>
                        {currentUser && (
                            <Link
                                to="/create-post"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                            >
                                Create the first post
                            </Link>
                        )}
                    </div>
                )}

                {/* Featured post */}
                {!loading && !error && featuredPost && (
                    <section className="mb-10">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3">Featured</h2>
                        <Link
                            to={`/blog/${featuredPost.slug}`}
                            className="block bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition"
                        >
                            <div className="grid md:grid-cols-3 gap-0">
                                <div className="md:col-span-1">
                                    <img
                                        src={
                                            featuredPost.image_url ||
                                            featuredPost.image ||
                                            "/images/default-post.jpg"
                                        }
                                        alt={featuredPost.title}
                                        className="w-full h-52 md:h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = "/images/default-post.jpg";
                                        }}
                                    />
                                </div>
                                <div className="md:col-span-2 p-4 md:p-6 flex flex-col justify-between">
                                    <div>
                                        {featuredPost.category && (
                                            <span className="inline-block px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full mb-2">
                                                {featuredPost.category.name}
                                            </span>
                                        )}
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                            {featuredPost.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                                            {featuredPost.excerpt ||
                                                (featuredPost.content
                                                    ? featuredPost.content.slice(0, 160) +
                                                      (featuredPost.content.length > 160 ? "..." : "")
                                                    : "")}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-2">
                                                {featuredPost.author?.charAt(0) || "A"}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-800 text-sm">
                                                    {featuredPost.author || "Anonymous"}
                                                </div>
                                                <div>
                                                    {formatDate(featuredPost.created_at)} ·{" "}
                                                    {getReadingTime(featuredPost.content)} min read
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </section>
                )}

                {/* Posts Grid */}
                {!loading && !error && filteredPosts.length > 0 && (
                    <>
                        <section className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    All articles
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Showing {displayedPosts.length} of {filteredPosts.length}
                                </p>
                            </div>
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {displayedPosts.map((post) => {
                                    const imageUrl =
                                        post.image_url ||
                                        post.image ||
                                        "/images/default-post.jpg";
                                    return (
                                        <article
                                            key={post.id}
                                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
                                        >
                                            <Link to={`/blog/${post.slug}`}>
                                                <img
                                                    src={imageUrl}
                                                    alt={post.title}
                                                    className="w-full h-44 object-cover"
                                                    onError={(e) => {
                                                        e.target.src = "/images/default-post.jpg";
                                                    }}
                                                />
                                            </Link>
                                            <div className="p-4 flex flex-col h-full">
                                                {post.category && (
                                                    <span className="inline-block px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 rounded-full mb-2">
                                                        {post.category.name}
                                                    </span>
                                                )}
                                                <Link to={`/blog/${post.slug}`}>
                                                    <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600">
                                                        {post.title}
                                                    </h3>
                                                </Link>
                                                <p className="text-sm text-gray-600 mb-3 line-clamp-3 flex-1">
                                                    {post.excerpt ||
                                                        (post.content
                                                            ? post.content.slice(0, 120) +
                                                              (post.content.length > 120 ? "..." : "")
                                                            : "")}
                                                </p>
                                                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                                    <div className="flex items-center">
                                                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-2">
                                                            {post.author?.charAt(0) || "U"}
                                                        </div>
                                                        <span className="font-medium text-gray-800">
                                                            {post.author || "Anonymous"}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div>{formatDate(post.created_at)}</div>
                                                        <div>{getReadingTime(post.content)} min read</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>

                        {filteredPosts.length > 6 && (
                            <div className="text-center mt-4">
                                <button
                                    onClick={() => setShowAllPosts(!showAllPosts)}
                                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    {showAllPosts
                                        ? "Show less"
                                        : `Show more (${filteredPosts.length - 6} more)`}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}