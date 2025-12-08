import { useState, useEffect } from "react";
import axios from "../utils/axios.js";
import { useNavigate } from "react-router-dom";

export default function CreatePost() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("");
    const [categories, setCategories] = useState([
        { id: 1, name: "Technology" },
        { id: 2, name: "Health" },
        { id: 3, name: "Travel" },
        { id: 4, name: "Education" },
        { id: 5, name: "Lifestyle" },
        { id: 6, name: "Sports" },
    ]);
    const navigate = useNavigate();

    // Merge backend categories with default ones
    useEffect(() => {
        axios.get("/api/categories/")
            .then(res => {
                const backendCategories = res.data;
                const merged = [...categories];
                backendCategories.forEach(cat => {
                    if (!merged.some(c => c.id === cat.id)) {
                        merged.push(cat);
                    }
                });
                setCategories(merged);
            })
            .catch(err => console.error("Error fetching categories:", err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("/api/posts/create/", { title, content, category });
            navigate("/dashboard");
        } catch (err) {
            console.error("Error creating post:", err);
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
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                    Create Post
                </button>
            </form>
        </div>
    );
}
