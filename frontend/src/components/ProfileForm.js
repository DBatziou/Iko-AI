"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function ProfileForm() {
    const router = useRouter();
    const API_URL = "http://localhost:8080";

    const [currentUser, setCurrentUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editData, setEditData] = useState({
        name: '',
        username: '',
        email: ''
    });

    // Helper function to decode JWT and extract user info
    const getCurrentUserFromToken = () => {
        const token = localStorage.getItem("token");
        if (!token) return null;

        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);
            return {
                id: payload.id,
                username: payload.sub,
                email: payload.email,
                name: payload.name,
                role: payload.role
            };
        } catch (error) {
            console.error("Error decoding token:", error);
            return null;
        }
    };

    // Check authentication and set current user
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.log("No authentication token found, redirecting to login");
            router.push("/login");
            return;
        }

        const user = getCurrentUserFromToken();
        if (!user) {
            console.log("Invalid token, redirecting to login");
            localStorage.removeItem("token");
            router.push("/login");
            return;
        }

        setCurrentUser(user);
        setEditData({
            name: user.name || '',
            username: user.username || '',
            email: user.email || ''
        });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setCurrentUser(null);
        router.push("/login");
    };

    const handleEditToggle = () => {
        if (isEditing) {
            // Reset to original data if canceling
            setEditData({
                name: currentUser.name || '',
                username: currentUser.username || '',
                email: currentUser.email || ''
            });
        }
        setIsEditing(!isEditing);
    };

    const handleInputChange = (field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveProfile = async () => {
        if (!editData.name.trim() || !editData.username.trim() || !editData.email.trim()) {
            alert("All fields are required!");
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");

            // Update user profile via API
            const response = await axios.put(`${API_URL}/users/${currentUser.id}`, {
                name: editData.name.trim(),
                username: editData.username.trim(),
                email: editData.email.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update current user state with new data
            setCurrentUser(prev => ({
                ...prev,
                name: editData.name.trim(),
                username: editData.username.trim(),
                email: editData.email.trim()
            }));

            setIsEditing(false);
            console.log("Profile updated successfully");

        } catch (error) {
            console.error("Error updating profile:", error);

            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
            } else if (error.response?.status === 409) {
                alert("Username or email already exists!");
            } else {
                alert("Failed to update profile. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formatJoinDate = (userId) => {
        // Simple date format based on user ID or you can store actual join date
        return "July 2024";
    };

    if (!currentUser) {
        return (
            <div className="profile-page">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    color: '#00ffd6',
                    fontSize: '1.2rem',
                    fontFamily: 'Courier New, monospace'
                }}>
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            {/* Banner Section */}
            <div className="profile-banner"></div>

            {/* Profile Content */}
            <div className="profile-card">
                <div className="avatar-section">
                    <img
                        className="avatar"
                        src="/ai-technology-robot-cute-design.png"
                        alt="User Avatar"
                    />
                </div>

                <div className="profile-info">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="username"
                            style={{
                                background: 'rgba(0, 0, 0, 0.7)',
                                border: '2px solid #00ffd6',
                                borderRadius: '8px',
                                color: '#00ffd6',
                                fontSize: '1.8rem',
                                textAlign: 'center',
                                padding: '8px 12px',
                                margin: '10px 0 5px',
                                outline: 'none',
                                textShadow: '0 0 8px cyan'
                            }}
                        />
                    ) : (
                        <h2 className="username">{currentUser.name}</h2>
                    )}

                    {isEditing ? (
                        <input
                            type="text"
                            value={editData.username}
                            onChange={(e) => handleInputChange('username', e.target.value)}
                            style={{
                                background: 'rgba(0, 0, 0, 0.7)',
                                border: '2px solid #00ffd6',
                                borderRadius: '8px',
                                color: '#aaa',
                                fontSize: '0.9rem',
                                textAlign: 'center',
                                padding: '4px 8px',
                                outline: 'none',
                                marginBottom: '10px'
                            }}
                        />
                    ) : (
                        <span className="user-tag">@{currentUser.username}</span>
                    )}

                    <p className="user-status">"Living in the neon grid ✨"</p>
                </div>

                {/* Divider */}
                <hr className="divider" />

                {/* Extra Info like Discord */}
                <div className="profile-details">
                    <div>
                        <strong>Email:</strong>
                        {isEditing ? (
                            <input
                                type="email"
                                value={editData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                            />
                        ) : (
                            ` ${currentUser.email}`
                        )}
                    </div>
                    <div>
                        <strong>Member since:</strong> {formatJoinDate(currentUser.id)}
                    </div>
                    <div>
                        <strong>Status:</strong> Online ✅
                    </div>
                    <div>
                        <strong>Role:</strong> {currentUser.role || 'User'}
                    </div>
                </div>

                {/* Buttons */}
                <div className="profile-actions">
                    {isEditing ? (
                        <>
                            <button
                                className="neon-btn"
                                onClick={handleSaveProfile}
                                disabled={isLoading}
                            >
                                {isLoading ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                className="neon-btn"
                                onClick={handleEditToggle}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button className="neon-btn" onClick={handleEditToggle}>
                            Edit Profile
                        </button>
                    )}

                    <button className="neon-btn danger" onClick={handleLogout}>
                        Logout
                    </button>

                    <button
                        className="neon-btn"
                        onClick={() => router.push("/")}
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}