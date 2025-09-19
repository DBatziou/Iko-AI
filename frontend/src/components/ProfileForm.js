"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import axios from 'axios';

// Create axios instance with custom error handling
const apiClient = axios.create({
    baseURL: "http://localhost:8080",
    validateStatus: function (status) {
        return status < 500; // Only throw for 5xx server errors
    }
});

export default function ProfileForm() {
    const router = useRouter();

    const [currentUser, setCurrentUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editData, setEditData] = useState({
        name: '',
        username: '',
        email: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

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

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        const user = getCurrentUserFromToken();
        if (!user) {
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

    const handlePasswordInputChange = (field, value) => {
        setPasswordData(prev => ({
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

            const response = await apiClient.put(`/users/${currentUser.id}`, {
                name: editData.name.trim(),
                username: editData.username.trim(),
                email: editData.email.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
                return;
            }

            if (response.status === 409) {
                alert("Username or email already exists!");
                return;
            }

            if (response.status !== 200) {
                alert("Failed to update profile. Please try again.");
                return;
            }

            setCurrentUser(prev => ({
                ...prev,
                name: editData.name.trim(),
                username: editData.username.trim(),
                email: editData.email.trim()
            }));

            setIsEditing(false);
            alert("Profile updated successfully!");

        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            alert("All password fields are required!");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("New password and confirmation don't match!");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            alert("New password must be at least 6 characters long!");
            return;
        }

        if (passwordData.currentPassword === passwordData.newPassword) {
            alert("New password must be different from current password!");
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");

            const response = await apiClient.put(`/users/${currentUser.id}/password`, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
                return;
            }

            if (response.status === 400) {
                alert("Current password is incorrect!");
                return;
            }

            if (response.status !== 200) {
                alert("Failed to update password. Please try again.");
                return;
            }

            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setShowPasswordChange(false);
            alert("Password updated successfully!");

        } catch (error) {
            console.error("Error updating password:", error);
            alert("Failed to update password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== currentUser.username) {
            alert(`Please type "${currentUser.username}" to confirm account deletion!`);
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");

            const response = await apiClient.delete(`/users/${currentUser.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
                return;
            }

            if (response.status !== 200) {
                alert("Failed to delete account. Please try again.");
                return;
            }

            localStorage.removeItem("token");
            alert("Your account has been permanently deleted.");
            router.push("/login");

        } catch (error) {
            console.error("Error deleting account:", error);
            alert("Failed to delete account. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const formatJoinDate = (userId) => {
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
            <div className="profile-banner"></div>

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

                <hr className="divider" />

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

                {showPasswordChange && (
                    <div className="password-change-section">
                        <hr className="divider" />
                        <h3 style={{ color: '#ff00ff', textAlign: 'center', marginBottom: '15px' }}>Change Password</h3>

                        <div className="password-form">
                            <input
                                type="password"
                                placeholder="Current Password"
                                value={passwordData.currentPassword}
                                onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                                className="password-input"
                            />
                            <input
                                type="password"
                                placeholder="New Password (min 6 characters)"
                                value={passwordData.newPassword}
                                onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                                className="password-input"
                            />
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                                className="password-input"
                            />
                        </div>

                        <div className="password-actions">
                            <button
                                className="neon-btn"
                                onClick={handlePasswordChange}
                                disabled={isLoading}
                            >
                                {isLoading ? "Updating..." : "Update Password"}
                            </button>
                            <button
                                className="neon-btn"
                                onClick={() => {
                                    setShowPasswordChange(false);
                                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                }}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {showDeleteConfirm && (
                    <div className="delete-account-section">
                        <hr className="divider" />
                        <h3 style={{ color: '#ff3b3b', textAlign: 'center', marginBottom: '15px' }}>⚠️ Delete Account</h3>

                        <div className="delete-warning">
                            <p style={{ color: '#ff6b6b', textAlign: 'center', marginBottom: '15px' }}>
                                This action cannot be undone. All your chats and data will be permanently deleted.
                            </p>

                            <p style={{ color: '#ccc', textAlign: 'center', marginBottom: '10px' }}>
                                Type "<strong>{currentUser.username}</strong>" to confirm:
                            </p>

                            <input
                                type="text"
                                placeholder={`Type "${currentUser.username}" here`}
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                className="delete-confirm-input"
                            />
                        </div>

                        <div className="delete-actions">
                            <button
                                className="neon-btn danger"
                                onClick={handleDeleteAccount}
                                disabled={isLoading || deleteConfirmText !== currentUser.username}
                            >
                                {isLoading ? "Deleting..." : "DELETE ACCOUNT"}
                            </button>
                            <button
                                className="neon-btn"
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeleteConfirmText('');
                                }}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

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

                    {!showPasswordChange && !showDeleteConfirm && (
                        <button
                            className="neon-btn"
                            onClick={() => setShowPasswordChange(true)}
                            disabled={isEditing}
                        >
                            Change Password
                        </button>
                    )}

                    {!showPasswordChange && !showDeleteConfirm && (
                        <button
                            className="neon-btn danger"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isEditing}
                        >
                            Delete Account
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