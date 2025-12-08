import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../utils/axios.js";

export default function BlogPage() {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        axios.get(`/api/posts/${slug}/`)
            .then(res => {
                setPost(res.data);
            })
            .catch(err => {
                console.error("Error fetching post:", err);
                setError("Failed to load post.");
                setPost(null);
            })
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) return <div className="mt-28 text-center text-gray-600">Loading...</div>;
    if (error) return <div className="mt-28 text-center text-red-500">{error}</div>;
    if (!post) return <div className="mt-28 text-center text-red-500">Post not found.</div>;

    return (
        <div className="container mx-auto px-4 mt-28">
            <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
            <p className="text-gray-500 mb-4">
                By {post.author} | {new Date(post.created_at).toLocaleDateString()} 
                {post.category && <> | Category: {post.category.name}</>}
            </p>
            <div className="text-gray-800 whitespace-pre-line">{post.content}</div>
        </div>
    );
}
