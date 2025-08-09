import { useState, useMemo } from "react";
import { useRouter } from 'next/router';
export default function ProfileForm() {
    const router = useRouter();
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
                    <h2 className="username">John Doe</h2>
                    <span className="user-tag">@johndoe</span>
                    <p className="user-status">“Living in the neon grid ✨”</p>
                </div>

                {/* Divider */}
                <hr className="divider" />

                {/* Extra Info like Discord */}
                <div className="profile-details">
                    <div>
                        <strong>Email:</strong> johndoe@email.com
                    </div>
                    <div>
                        <strong>Member since:</strong> July 2024
                    </div>
                    <div>
                        <strong>Status:</strong> Online ✅
                    </div>
                </div>

                {/* Buttons like Edit Profile */}
                <div className="profile-actions">
                    <button className="neon-btn">Edit Profile</button>
                    <button className="neon-btn danger">Logout</button>
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
