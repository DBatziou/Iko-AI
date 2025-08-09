import { useState, useEffect } from "react";
import { useRouter } from 'next/router';

export default function HomePage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const router = useRouter();
    const [sidebarExpanded, setSidebarExpanded] = useState(true); // track expanded state
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    const sendMessage = () => {
        if (!input.trim()) return;
        const newMsg = { role: "user", text: input.trim() };
        setMessages([...messages, newMsg]);
        setInput("");
    };

    // When sidebarOpen changes, trigger expanded toggle after transition duration (300ms)
    useEffect(() => {
        if (sidebarOpen) {
            // When opening, first set expanded false to hide text, then after 300ms show it
            setSidebarExpanded(false);
            const timer = setTimeout(() => setSidebarExpanded(true), 80);
            return () => clearTimeout(timer);
        } else {
            // When closing, immediately hide expanded (hide text)
            setSidebarExpanded(false);
        }
    }, [sidebarOpen]);

    return (
        <div className="chatgpt-layout">
            <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
                <button
                    className="toggle-btn"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? "⟨⟨" : "⟩⟩"}
                </button>

                {/* Render menu only if sidebarExpanded true (fully open) */}
                {sidebarExpanded && (
                    <div className="menu">
                        <h2>🤖 IKO AI</h2>
                        <ul>
                            <li>
                                <span className="icon">➕</span>
                                <span className="text-wrapper">New Chat</span>
                            </li>
                            <li>
                                <span className="icon">📜</span>
                                <span className="text-wrapper">History</span>
                            </li>
                            <li>
                                <span className="icon">⚙</span>
                                <span className="text-wrapper">Settings</span>
                            </li>
                        </ul>
                        <div className="profile-section">
                            <button
                                className="profile-image-btn"
                                onClick={() => router.push("/profile")}
                            >
                                <img src="/ai-technology-robot-cute-design.png" alt="Profile" />
                                <span>Profile</span>
                            </button>
                            <button
                                className="logout-btn"
                                onClick={() => console.log("Log out clicked!")}
                            >
                                <img src="/5565392-200.png" alt="Log out" />
                                <span>Log out</span>
                            </button>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Chat */}
            <main className="main-chat">
                {messages.length === 0 ? (
                    <div className="welcome-screen">
                        <h1 className="neon-title">WELCOME TO IKO</h1>
                        <p className="neon-sub">Your AI informant</p>
                        <div className="prompt-hints">
                            <div className="hint-card">⚡ “Tell me a cyberpunk story”</div>
                            <div className="hint-card">⚡ “Hack into the neon grid”</div>
                            <div className="hint-card">⚡ “Explain quantum AI”</div>
                        </div>
                    </div>
                ) : (
                    <div className="chat-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`message ${msg.role}`}>
                                {msg.text}
                            </div>
                        ))}
                    </div>
                )}

                {/* Input Bar */}
                <div className="chat-input glass-input">
                    <input
                        type="text"
                        placeholder="> Type your command..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <button className="neon-btn" onClick={sendMessage}>SEND</button>
                </div>
            </main>
        </div>
    );
}
