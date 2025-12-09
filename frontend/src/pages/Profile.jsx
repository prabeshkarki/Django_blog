// src/pages/Profile.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UsersAPI } from "../utils/axios.js";
import { getCurrentUser, logout } from "../utils/auth.js";

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [bio, setBio] = useState("");
    const [previewImage, setPreviewImage] = useState("");
    const [imageFile, setImageFile] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Redirect to login if not authenticated
    useEffect(() => {
        const user = getCurrentUser();
        if (!user || !user.token) {
            navigate("/login");
        }
    }, [navigate]);

    // Fetch profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await UsersAPI.current();
                const data = res.data;
                setProfile(data);
                setFirstName(data.first_name || "");
                setLastName(data.last_name || "");
                setBio(data.bio || "");
                setPreviewImage(data.profile_picture_url || "");
            } catch (err) {
                console.error("Error fetching profile:", err);
                if (err.response?.status === 401) {
                    logout();
                    navigate("/login");
                } else {
                    setError("Failed to load profile. Please try again.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        if (!validTypes.includes(file.type)) {
            setError("Please select a valid image file (JPEG, PNG, GIF, WebP).");
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setError("Image size should be less than 5MB.");
            return;
        }

        setError("");
        setImageFile(file);
        setPreviewImage(URL.createObjectURL(file));
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const formData = new FormData();
            formData.append("first_name", firstName.trim());
            formData.append("last_name", lastName.trim());
            formData.append("bio", bio.trim());

            if (imageFile) {
                formData.append("profile_picture", imageFile);
            }

            const res = await UsersAPI.updateProfile(formData);
            const data = res.data;

            setProfile(data);
            setFirstName(data.first_name || "");
            setLastName(data.last_name || "");
            setBio(data.bio || "");
            setPreviewImage(data.profile_picture_url || "");
            setImageFile(null);

            setSuccess("Profile updated successfully.");
        } catch (err) {
            console.error("Error updating profile:", err);
            if (err.response?.status === 400) {
                setError("Invalid data submitted. Please check your inputs.");
            } else if (err.response?.status === 401) {
                logout();
                navigate("/login");
            } else {
                setError("Failed to update profile. Please try again.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    if (loading || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
                        <p className="text-gray-600 text-sm mt-1">
                            Manage your personal information and public profile.
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium"
                    >
                        Logout
                    </button>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                        {success}
                    </div>
                )}

                {/* Profile Card */}
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-600">
                                {previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt={profile.username}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = "/images/default-profile.png";
                                        }}
                                    />
                                ) : (
                                    (profile.username || "U").charAt(0).toUpperCase()
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={triggerFileInput}
                                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 shadow hover:bg-blue-700"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15.232 5.232l3.536 3.536M4 17.5V20h2.5l9.768-9.768a1.5 1.5 0 10-2.121-2.121L4 17.5z"
                                    />
                                </svg>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>

                        {/* Basic info */}
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {profile.username}
                            </h2>
                            <p className="text-gray-600 text-sm">{profile.email}</p>
                        </div>

                        {/* Posts count */}
                        <div className="text-center sm:text-right">
                            <p className="text-2xl font-bold text-blue-600">
                                {profile.post_count ?? 0}
                            </p>
                            <p className="text-xs text-gray-500">Posts written</p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSave}
                        className="space-y-4 pt-4 border-t border-gray-100"
                    >
                        {/* Name fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First name
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last name
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Username & email (read-only) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={profile.username}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={profile.email || ""}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bio
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                                placeholder="Tell readers a bit about yourself..."
                                maxLength={500}
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                {bio.length}/500 characters
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => navigate(-1)}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className={`px-5 py-2 text-sm rounded-lg font-medium text-white ${
                                    saving
                                        ? "bg-blue-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700"
                                }`}
                            >
                                {saving ? "Saving..." : "Save changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}