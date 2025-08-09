import React, { useState } from "react";

export default function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [firstMessageSent, setFirstMessageSent] = useState(false);

    const handleSend = () => {
        if (!input.trim()) return;

        setMessages((prev) => [...prev, { text: input, sender: "user" }]);
        setInput("");
        if (!firstMessageSent) setFirstMessageSent(true);

        // You can add AI response logic here or just demo for now
    };

    return (
        <div className="chatgpt-layout">
            <aside className="sidebar">
                <div className="menu">
                    <h2>Menu</h2>
                    <ul>
                        <li>Ready Question 1</li>
                        <li>Ready Question 2</li>
                        <li>Ready Question 3</li>
                    </ul>
                </div>
            </aside>

            <main className="main-chat">
                {!firstMessageSent && (
                    <div className="welcome-screen">
                        <h1 className="neon-title">Welcome to ChatGPT</h1>
                        <p className="neon-sub">Start your conversation below</p>
                    </div>
                )}

                <div className="chat-messages">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.sender}`}>
                            {msg.text}
                        </div>
                    ))}
                </div>

                <div
                    className="chat-input"
                    style={{ marginTop: firstMessageSent ? "auto" : undefined }}
                >
                    <input
                        type="text"
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSend();
                        }}
                    />
                    <button className="neon-btn" onClick={handleSend}>
                        Send
                    </button>
                </div>
            </main>
        </div>
    );
}
