import { useEffect, useState } from "react";
import axios from "../utils/axios.js";
import { Link } from "react-router-dom";

export default function Dashboard() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all posts
    const fetchPosts = () => {
        setLoading(true);
        axios.get("/api/posts/")
            .then(res => {
                const postData = Array.isArray(res.data) ? res.data : [];
                setPosts(postData);
            })
            .catch(err => console.error("Error fetching posts:", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    // Delete post
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        try {
            await axios.delete(`/api/posts/${id}/delete/`);
            fetchPosts(); // Refresh list
        } catch (err) {
            console.error("Error deleting post:", err);
            alert("Failed to delete post. Check console for details.");
        }
    };

    if (loading) return <div className="mt-28 text-center text-gray-600">Loading...</div>;

    return (
        <div className="container mx-auto px-4 mt-28">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            <Link
                to="/create-post"
                className="text-white bg-blue-600 px-4 py-2 rounded mb-4 inline-block hover:bg-blue-700 transition"
            >
                Create New Post
            </Link>

            {posts.length === 0 ? (
                <p className="text-gray-500 mt-4">No posts available.</p>
            ) : (
                <ul>
                    {posts.map(post => (
                        <li key={post.id} className="p-2 border-b flex justify-between items-center">
                            <div>
                                <strong>{post.title}</strong>
                                <span className="ml-2 text-gray-500">
                                    {post.published ? "Published" : "Draft"}
                                </span>
                                {post.category && (
                                    <span className="ml-2 text-gray-400">
                                        [{post.category.name}]
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    to={`/edit-post/${post.id}`}
                                    className="text-blue-600 hover:underline"
                                >
                                    Edit
                                </Link>
                                <button
                                    onClick={() => handleDelete(post.id)}
                                    className="text-red-600 hover:underline"
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
