import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../utils/axios.js";

export default function HomePage() {
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");

    // Fetch all posts
    useEffect(() => {
        const url = selectedCategory
            ? `/api/posts/?category=${selectedCategory}`
            : "/api/posts/";

        axios
            .get(url)
            .then(res => {
                // Ensure we have an array
                const postData = Array.isArray(res.data) ? res.data : [];
                setPosts(postData);
            })
            .catch(err => console.error("Error fetching posts:", err));
    }, [selectedCategory]);

    // Fetch categories for filter dropdown
    useEffect(() => {
        axios
            .get("/api/categories/")
            .then(res => {
                // Ensure we have an array
                const categoryData = Array.isArray(res.data) ? res.data : [];
                setCategories(categoryData);
            })
            .catch(err => console.error("Error fetching categories:", err));
    }, []);

    return (
        <div className="container mx-auto px-4 mt-28">
            <h1 className="text-3xl font-bold mb-6">Latest Posts</h1>

            {/* Category Filter */}
            <div className="mb-6">
                <label className="mr-2 font-medium">Filter by Category:</label>
                <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="border p-2 rounded"
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map(post => (
                    <div
                        key={post.id}
                        className="p-4 border rounded shadow hover:shadow-lg transition"
                    >
                        <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                        <p className="text-gray-700 mb-2">{post.content?.slice(0, 120)}...</p>
                        <Link
                            to={`/blog/${post.slug}`}
                            className="text-blue-600 hover:underline"
                        >
                            Read more
                        </Link>
                    </div>
                ))}

                {/* Show message if no posts */}
                {posts.length === 0 && (
                    <p className="text-gray-500 col-span-full">
                        No posts found for this category.
                    </p>
                )}
            </div>
        </div>
    );
}
