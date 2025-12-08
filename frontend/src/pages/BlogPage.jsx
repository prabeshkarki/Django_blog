import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../utils/axios.js";
import { getCurrentUser } from "../utils/auth.js";

export default function BlogPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [user, setUser] = useState(null);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [viewCount, setViewCount] = useState(0);
    const [readingProgress, setReadingProgress] = useState(0);
    const [showToc, setShowToc] = useState(false);

    // Get current user
    useEffect(() => {
        const currentUser = getCurrentUser();
        setUser(currentUser);
    }, []);

    // Fetch post data
    useEffect(() => {
        fetchPost();
    }, [slug]);

    // Track reading progress
    useEffect(() => {
        const handleScroll = () => {
            if (!post?.content) return;
            
            const contentHeight = document.querySelector('.post-content')?.scrollHeight || 1;
            const scrollPosition = window.scrollY - (document.querySelector('.post-content')?.offsetTop || 0);
            const progress = Math.min(100, Math.max(0, (scrollPosition / contentHeight) * 100));
            setReadingProgress(progress);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [post]);

    const fetchPost = () => {
        setLoading(true);
        setError(null);

        axios.get(`/api/posts/${slug}/`)
            .then(res => {
                setPost(res.data);
                setLikeCount(res.data.likes || 0);
                setViewCount(res.data.views || 0);
                
                // Fetch related posts
                fetchRelatedPosts(res.data.category?.id);
                
                // Increment view count
                incrementViewCount();
            })
            .catch(err => {
                console.error("Error fetching post:", err);
                if (err.response?.status === 404) {
                    setError("Post not found. It may have been deleted or the link is incorrect.");
                } else {
                    setError("Failed to load post. Please try again later.");
                }
            })
            .finally(() => setLoading(false));
    };

    const fetchRelatedPosts = (categoryId) => {
        if (!categoryId) return;
        
        axios.get(`/api/posts/?category=${categoryId}`)
            .then(res => {
                const allPosts = Array.isArray(res.data) ? res.data : [];
                // Filter out current post and limit to 3
                const related = allPosts
                    .filter(p => p.id !== post?.id)
                    .slice(0, 3);
                setRelatedPosts(related);
            })
            .catch(err => console.error("Error fetching related posts:", err));
    };

    const incrementViewCount = () => {
        // Simulate view count increment (you might want to implement this on backend)
        setTimeout(() => {
            setViewCount(prev => prev + 1);
        }, 2000);
    };

    const handleLike = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const newLikeStatus = !isLiked;
            setIsLiked(newLikeStatus);
            setLikeCount(prev => newLikeStatus ? prev + 1 : prev - 1);
            
            // Here you would call your API to update likes
            // await axios.post(`/api/posts/${post.id}/like/`);
        } catch (err) {
            console.error("Error liking post:", err);
            // Revert on error
            setIsLiked(!isLiked);
            setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        const title = post?.title || 'Check out this post!';
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: post?.excerpt || '',
                    url: url,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(url).then(() => {
                alert('Link copied to clipboard!');
            });
        }
    };

    const handleEdit = () => {
        if (user && post && (user.id === post.author_id || user.username === post.author)) {
            navigate(`/edit-post/${post.id}`);
        } else {
            alert("You can only edit your own posts.");
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
            return;
        }

        try {
            await axios.delete(`/api/posts/${post.id}/`);
            alert("Post deleted successfully!");
            navigate('/');
        } catch (err) {
            console.error("Error deleting post:", err);
            if (err.response?.status === 403) {
                alert("You don't have permission to delete this post.");
            } else {
                alert("Failed to delete post. Please try again.");
            }
        }
    };

    // Extract headings for table of contents
    const extractHeadings = (content) => {
        if (!content) return [];
        const headingRegex = /<h[2-3]>(.*?)<\/h[2-3]>/gi;
        const matches = content.match(headingRegex);
        return matches ? matches.map(heading => 
            heading.replace(/<[^>]+>/g, '').trim()
        ) : [];
    };

    const headings = extractHeadings(post?.content || '');

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-24">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                        <div className="h-64 bg-gray-200 rounded mb-8"></div>
                        <div className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 pt-24">
                <div className="container mx-auto px-4 max-w-4xl text-center py-16">
                    <div className="text-6xl mb-4">😔</div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Post Not Found</h1>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                        >
                            Go Back
                        </button>
                        <Link
                            to="/"
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            Browse Posts
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!post) return null;

    const isAuthor = user && (user.id === post.author_id || user.username === post.author);
    const readingTime = post.reading_time || Math.ceil((post.content?.length || 0) / 1000);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Reading Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-1 bg-blue-100 z-40">
                <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                    style={{ width: `${readingProgress}%` }}
                ></div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 max-w-6xl pt-24 pb-16">
                {/* Back Button */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 hover:text-blue-600 font-medium"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Posts
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Article */}
                    <article className="lg:col-span-8">
                        {/* Post Header */}
                        <header className="mb-8">
                            {/* Category */}
                            {post.category && (
                                <Link 
                                    to={`/?category=${post.category.id}`}
                                    className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4 hover:bg-blue-200"
                                >
                                    {post.category.name}
                                </Link>
                            )}
                            
                            {/* Title */}
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                                {post.title}
                            </h1>

                            {/* Meta Information */}
                            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold mr-3">
                                        {post.author?.charAt(0)?.toUpperCase() || 'A'}
                                    </div>
                                    <div>
                                        <div className="font-medium">{post.author || 'Anonymous'}</div>
                                        <div className="text-sm">
                                            {new Date(post.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 ml-auto">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-800">{readingTime}</div>
                                        <div className="text-xs text-gray-500">min read</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-800">{viewCount}</div>
                                        <div className="text-xs text-gray-500">views</div>
                                    </div>
                                </div>
                            </div>

                            {/* Featured Image (if available) */}
                            {post.image && (
                                <div className="mb-8 rounded-2xl overflow-hidden shadow-xl">
                                    <img 
                                        src={post.image} 
                                        alt={post.title}
                                        className="w-full h-auto object-cover"
                                    />
                                </div>
                            )}
                        </header>

                        {/* Table of Contents (Mobile) */}
                        {headings.length > 0 && (
                            <div className="lg:hidden mb-8">
                                <button
                                    onClick={() => setShowToc(!showToc)}
                                    className="w-full p-4 bg-white border border-gray-200 rounded-lg flex items-center justify-between hover:bg-gray-50"
                                >
                                    <span className="font-medium">Table of Contents</span>
                                    <svg className={`w-5 h-5 transform transition-transform ${showToc ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {showToc && (
                                    <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg">
                                        <ul className="space-y-2">
                                            {headings.map((heading, index) => (
                                                <li key={index}>
                                                    <a 
                                                        href={`#heading-${index}`}
                                                        className="text-gray-600 hover:text-blue-600 block py-1"
                                                        onClick={() => setShowToc(false)}
                                                    >
                                                        {heading}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Post Content */}
                        <div className="post-content bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
                            {/* Excerpt */}
                            {post.excerpt && (
                                <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-lg text-gray-700 italic">{post.excerpt}</p>
                                </div>
                            )}

                            {/* Content */}
                            <div className="prose prose-lg max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: post.content }} />
                            </div>
                        </div>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="mb-8">
                                <h3 className="font-semibold text-gray-700 mb-3">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {post.tags.map((tag, index) => (
                                        <span 
                                            key={index}
                                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 cursor-pointer"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 mb-8">
                            <button
                                onClick={handleLike}
                                className={`px-6 py-3 rounded-lg font-medium flex items-center ${
                                    isLiked 
                                        ? 'bg-red-50 text-red-600 border border-red-200' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <svg className={`w-5 h-5 mr-2 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                {isLiked ? 'Liked' : 'Like'} ({likeCount})
                            </button>
                            
                            <button
                                onClick={handleShare}
                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Share
                            </button>

                            {isAuthor && (
                                <>
                                    <button
                                        onClick={handleEdit}
                                        className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 flex items-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="px-6 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 flex items-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </article>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4">
                        {/* Author Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                            <h3 className="font-bold text-gray-800 mb-4">About the Author</h3>
                            <div className="flex items-center mb-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold mr-4">
                                    {post.author?.charAt(0)?.toUpperCase() || 'A'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{post.author || 'Anonymous'}</h4>
                                    <p className="text-gray-600 text-sm">Blog Contributor</p>
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm">
                                {post.author_bio || 'This author hasn\'t written a bio yet.'}
                            </p>
                        </div>

                        {/* Table of Contents (Desktop) */}
                        {headings.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 hidden lg:block">
                                <h3 className="font-bold text-gray-800 mb-4">Table of Contents</h3>
                                <ul className="space-y-2">
                                    {headings.map((heading, index) => (
                                        <li key={index}>
                                            <a 
                                                href={`#heading-${index}`}
                                                className="text-gray-600 hover:text-blue-600 block py-1.5 pl-2 border-l-2 border-gray-200 hover:border-blue-500"
                                            >
                                                {heading}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Related Posts */}
                        {relatedPosts.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="font-bold text-gray-800 mb-4">Related Posts</h3>
                                <div className="space-y-4">
                                    {relatedPosts.map(relatedPost => (
                                        <Link 
                                            key={relatedPost.id} 
                                            to={`/post/${relatedPost.slug || relatedPost.id}`}
                                            className="block group"
                                        >
                                            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                                                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
                                                        {relatedPost.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {new Date(relatedPost.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Newsletter Signup */}
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white mt-6">
                            <h3 className="font-bold text-xl mb-2">Stay Updated</h3>
                            <p className="text-blue-100 mb-4">Get the latest posts delivered right to your inbox.</p>
                            <div className="space-y-3">
                                <input
                                    type="email"
                                    placeholder="Your email address"
                                    className="w-full px-4 py-3 rounded-lg text-gray-800"
                                />
                                <button className="w-full bg-white text-blue-600 font-medium py-3 rounded-lg hover:bg-gray-100">
                                    Subscribe
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}