import { useState, useEffect } from "react";
import axios from "../utils/axios.js";
import { useNavigate } from "react-router-dom";

export default function CreatePost() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("");
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();

    // Fetch categories from backend
    useEffect(() => {
        axios.get("/api/categories/")
            .then(res => {
                const categoryData = Array.isArray(res.data) ? res.data : [];
                setCategories(categoryData);
            })
            .catch(err => console.error("Error fetching categories:", err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!category) {
            alert("Please select a category.");
            return;
        }

        try {
            await axios.post("/api/posts/create/", {
                title,
                content,
                category_id: category  // match serializer write_only field
            });
            navigate("/dashboard");
        } catch (err) {
            console.error("Error creating post:", err);
            alert("Failed to create post. Check console for details.");
        }
    };

    return (
        <div className="container mx-auto px-4 mt-28">
            <h1 className="text-3xl font-bold mb-6">Create Post</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="border p-2 rounded"
                    required
                />
                <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="border p-2 rounded"
                    required
                >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                <textarea
                    placeholder="Content"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="border p-2 rounded"
                    rows={6}
                    required
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    Create Post
                </button>
            </form>
        </div>
    );
}
