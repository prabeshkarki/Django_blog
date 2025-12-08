import { useState, useEffect } from "react";
import axios from "../utils/axios.js";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/auth.js";

export default function CreatePost() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("");
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [characterCount, setCharacterCount] = useState(0);
    const [wordCount, setWordCount] = useState(0);
    const navigate = useNavigate();

    // Fetch categories from backend
    useEffect(() => {
        axios.get("/api/categories/")
            .then(res => {
                const categoryData = Array.isArray(res.data) ? res.data : [];
                setCategories(categoryData);
                
                // Auto-select first category if only one exists
                if (categoryData.length === 1) {
                    setCategory(categoryData[0].id);
                }
            })
            .catch(err => {
                console.error("Error fetching categories:", err);
                setError("Failed to load categories. Please refresh the page.");
            });
    }, []);

    // Track content changes for character/word count
    useEffect(() => {
        setCharacterCount(content.length);
        setWordCount(content.trim() ? content.trim().split(/\s+/).length : 0);
    }, [content]);

    // Check if user is authenticated
    useEffect(() => {
        const user = getCurrentUser();
        if (!user || !user.token) {
            setError("You must be logged in to create a post.");
            setTimeout(() => navigate("/login"), 2000);
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        // Validation
        const validationErrors = [];
        
        if (!title.trim()) {
            validationErrors.push("Title is required");
        } else if (title.trim().length < 5) {
            validationErrors.push("Title must be at least 5 characters");
        } else if (title.trim().length > 200) {
            validationErrors.push("Title must be less than 200 characters");
        }
        
        if (!content.trim()) {
            validationErrors.push("Content is required");
        } else if (content.trim().length < 50) {
            validationErrors.push("Content must be at least 50 characters");
        } else if (content.trim().length > 10000) {
            validationErrors.push("Content must be less than 10,000 characters");
        }
        
        if (!category) {
            validationErrors.push("Please select a category");
        }

        if (validationErrors.length > 0) {
            setError(validationErrors.join("\n"));
            setLoading(false);
            return;
        }

        try {
            const postData = {
                title: title.trim(),
                content: content.trim(),
                category_id: category,
                published: true
            };

            console.log("Creating post with data:", postData);
            
            const response = await axios.post("/api/posts/", postData);

            // Success
            setSuccess("🎉 Post published successfully! Redirecting...");
            
            // Clear form
            setTitle("");
            setContent("");
            setCategory("");
            
            // Redirect to the new post after 1.5 seconds
            setTimeout(() => {
                if (response.data.slug) {
                    navigate(`/post/${response.data.slug}`);
                } else if (response.data.id) {
                    navigate(`/post/${response.data.id}`);
                } else {
                    navigate("/");
                }
            }, 1500);

        } catch (err) {
            console.error("Error creating post:", err);
            
            if (err.response?.status === 401) {
                setError("Session expired. Please login again.");
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                setTimeout(() => navigate("/login"), 2000);
            } else if (err.response?.status === 400) {
                const errors = err.response.data;
                let errorMessages = [];
                
                if (errors.title) errorMessages.push(`Title: ${Array.isArray(errors.title) ? errors.title.join(', ') : errors.title}`);
                if (errors.content) errorMessages.push(`Content: ${Array.isArray(errors.content) ? errors.content.join(', ') : errors.content}`);
                if (errors.category_id) errorMessages.push(`Category: ${Array.isArray(errors.category_id) ? errors.category_id.join(', ') : errors.category_id}`);
                if (errors.detail) errorMessages.push(errors.detail);
                
                setError(errorMessages.length > 0 ? errorMessages.join('\n') : "Invalid data submitted.");
            } else if (err.response?.status === 404) {
                setError("API endpoint not found. Please check if server is running.");
            } else if (err.response?.status === 405) {
                setError("Server doesn't accept POST requests at this endpoint.");
            } else if (err.response?.status === 500) {
                setError("Server error. Please try again later.");
            } else if (!err.response) {
                setError("Network error. Check if Django server is running on http://localhost:8000");
            } else {
                setError(`Error: ${err.response.status} - ${err.response.statusText}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDraft = () => {
        // Optional: Save as draft functionality
        alert("Draft functionality coming soon!");
    };

    const handlePreview = () => {
        // Optional: Preview functionality
        alert("Preview functionality coming soon!");
    };

    return (
        <div className="container mx-auto px-4 mt-20 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Post</h1>
                <p className="text-gray-600">Share your knowledge and ideas with the community</p>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{success}</span>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <strong className="block font-medium mb-1">Error creating post:</strong>
                            <div className="whitespace-pre-line text-sm">{error}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Bar */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Title Length</div>
                    <div className="text-2xl font-bold text-blue-700">{title.length}/200</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Content Stats</div>
                    <div className="text-2xl font-bold text-green-700">{wordCount} words</div>
                    <div className="text-sm text-green-500">{characterCount} characters</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium">Categories</div>
                    <div className="text-2xl font-bold text-purple-700">{categories.length}</div>
                    <div className="text-sm text-purple-500">available</div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                {/* Title Input */}
                <div className="mb-6">
                    <label className="block mb-2 font-semibold text-gray-700">
                        Post Title *
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            {title.length >= 5 && title.length <= 200 ? "✓ Good" : "5-200 characters"}
                        </span>
                    </label>
                    <input
                        type="text"
                        placeholder="Enter a compelling title for your post..."
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                        required
                        disabled={loading}
                        maxLength={200}
                    />
                    <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">Make it descriptive and engaging</span>
                        <span className={`text-xs ${title.length > 180 ? "text-red-500" : "text-gray-500"}`}>
                            {title.length}/200
                        </span>
                    </div>
                </div>

                {/* Category Selection */}
                <div className="mb-6">
                    <label className="block mb-2 font-semibold text-gray-700">
                        Category *
                        {categories.length > 0 && category && (
                            <span className="ml-2 text-sm font-normal text-green-600">
                                ✓ Selected
                            </span>
                        )}
                    </label>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        disabled={loading || categories.length === 0}
                    >
                        <option value="">Choose a category for your post...</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name} {cat.post_count > 0 && `(${cat.post_count})`}
                            </option>
                        ))}
                    </select>
                    {categories.length === 0 ? (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-yellow-700 text-sm">
                                No categories available. Please contact administrator or create one via admin panel.
                            </p>
                        </div>
                    ) : (
                        <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-500">Helps readers find your content</span>
                            <span className="text-xs text-gray-500">
                                {category ? "✓ Selected" : "Required"}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content Editor */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="font-semibold text-gray-700">
                            Content *
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                {content.length >= 50 ? "✓ Good" : "Minimum 50 characters"}
                            </span>
                        </label>
                        <div className="text-sm text-gray-500">
                            {wordCount} words • {characterCount} characters
                        </div>
                    </div>
                    <textarea
                        placeholder="Write your post content here... You can use Markdown for formatting."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono min-h-[300px] resize-y"
                        rows={12}
                        required
                        disabled={loading}
                        maxLength={10000}
                    />
                    <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">
                            Tip: Use paragraphs, headings, and lists for better readability
                        </span>
                        <span className={`text-xs ${content.length > 9500 ? "text-red-500" : "text-gray-500"}`}>
                            {characterCount}/10000
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={loading || categories.length === 0}
                        className={`px-6 py-3 rounded-lg font-medium transition-all flex-1 ${
                            loading || categories.length === 0
                                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                        }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Publishing...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                Publish Post
                            </span>
                        )}
                    </button>
                    
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handlePreview}
                            disabled={loading || !title || !content}
                            className="px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Preview
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            disabled={loading}
                            className="px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Help Text */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="text-sm text-gray-500 space-y-2">
                        <p className="flex items-start">
                            <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span><strong>Note:</strong> Author, timestamp, and excerpt will be automatically generated.</span>
                        </p>
                        <p className="flex items-start">
                            <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span><strong>Tip:</strong> A good title increases visibility. Aim for 50-150 words for optimal engagement.</span>
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}