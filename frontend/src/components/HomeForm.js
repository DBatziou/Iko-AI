"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function HomeForm() {
    const router = useRouter();
    const API_URL = "http://localhost:8080";
    const messagesRef = useRef(null);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [threads, setThreads] = useState([]);
    const [activeThreadId, setActiveThreadId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const [editingChatId, setEditingChatId] = useState(null);
    const [editingTitle, setEditingTitle] = useState("");

    // Fetch chat threads
    useEffect(() => {
        const fetchThreads = async () => {
            try {
                const token = localStorage.getItem("token");

                // Debug: Check if token exists
                console.log("Token from localStorage:", token ? "Token exists" : "No token found");

                if (!token) {
                    console.log("No authentication token found, redirecting to login");
                    router.push("/login"); // Adjust this path to your login route
                    return;
                }

                const res = await axios.get(`${API_URL}/chats`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setThreads(res.data);
                if (res.data.length > 0) setActiveThreadId(res.data[0].id);
            } catch (err) {
                console.error("Error loading chats:", err);

                // Handle 401 specifically
                if (err.response?.status === 401) {
                    console.log("Authentication failed, redirecting to login");
                    localStorage.removeItem("token"); // Clear invalid token
                    router.push("/login"); // Adjust this path to your login route
                } else {
                    console.error("Other error:", err.response?.data || err.message);
                }
            }
        };
        fetchThreads();
    }, [router]);

    // Fetch messages for the active thread
    useEffect(() => {
        const fetchMessages = async () => {
            if (!activeThreadId) return;
            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    router.push("/login");
                    return;
                }

                console.log("Fetching messages for thread:", activeThreadId);
                const res = await axios.get(`${API_URL}/messages/${activeThreadId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("Messages received:", res.data);
                setMessages(res.data);
            } catch (err) {
                console.error("Error loading messages:", err);
                console.error("Error response:", err.response?.data);
                console.error("Error status:", err.response?.status);

                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    router.push("/login");
                } else if (err.response?.status === 500) {
                    console.error("Server error - check backend logs");
                    // You might want to show an error message to the user
                    setMessages([]); // Clear messages on error
                }
            }
        };
        fetchMessages();
    }, [activeThreadId, router]);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    // Sidebar toggle
    useEffect(() => {
        if (sidebarOpen) {
            setSidebarExpanded(false);
            const timer = setTimeout(() => setSidebarExpanded(true), 80);
            return () => clearTimeout(timer);
        } else {
            setSidebarExpanded(false);
        }
    }, [sidebarOpen]);

    // Handlers
    const handleNewChat = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                router.push("/login");
                return;
            }

            // You'll need to get the current user ID somehow - this is just a placeholder
            const userId = 1; // Replace with actual user ID from your auth system

            const res = await axios.post(`${API_URL}/chats`, {
                title: "New Chat",
                userId: userId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newChat = res.data;
            setThreads(prev => [newChat, ...prev]); // Add to beginning of array
            setActiveThreadId(newChat.id);
            setMessages([]);
        } catch (err) {
            console.error("Error creating chat:", err);

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
            }
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!draft.trim() || !activeThreadId || isLoading) return;

        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        const userMessage = { content: draft, chatId: activeThreadId };

        // Clear input and add user message immediately
        setDraft("");
        setMessages(prev => [...prev, { ...userMessage, fromSelf: true }]);
        setIsLoading(true);

        try {
            // Send message to backend - this will create both user message and AI response
            const resp = await axios.post(`${API_URL}/messages`, userMessage, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // The response contains the AI message, add it to the messages
            setMessages(prev => [...prev, resp.data]);

        } catch (err) {
            console.error("Error sending message:", err);
            // Remove the user message if there was an error
            setMessages(prev => prev.slice(0, -1));

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle chat title editing
    const handleEditChatTitle = async (chatId, newTitle) => {
        if (!newTitle.trim()) return;

        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/chats/${chatId}`, {
                title: newTitle.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state
            setThreads(prev => prev.map(t =>
                t.id === chatId ? { ...t, title: newTitle.trim() } : t
            ));

            setEditingChatId(null);
            setEditingTitle("");
        } catch (err) {
            console.error("Error updating chat title:", err);
        }
    };

    const startEditingChat = (chat) => {
        setEditingChatId(chat.id);
        setEditingTitle(chat.title);
    };

    const activeThread = threads.find(t => t.id === activeThreadId);

    return (
        <div className="chatgpt-layout">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
                <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? "⟨⟨" : "⟩⟩"}
                </button>
                {sidebarExpanded && (
                    <div className="menu">
                        <h2>🤖 IKO AI</h2>

                        {/* Scrollable chat list container */}
                        <div className="chat-list-container">
                            <div className="chat-list-scroll">
                                <ul className="w-48 bg-gray-100">
                                    <li onClick={handleNewChat} className="cursor-pointer p-2 hover:bg-gray-200">
                                        ➕ New Chat
                                    </li>
                                    {threads.map(t => (
                                        <li key={t.id}
                                            className={`cursor-pointer p-2 ml-4 flex items-center justify-between group ${t.id === activeThreadId ? "active bg-blue-100" : "hover:bg-gray-200"}`}>

                                            {editingChatId === t.id ? (
                                                <input
                                                    type="text"
                                                    value={editingTitle}
                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                    onBlur={() => handleEditChatTitle(t.id, editingTitle)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleEditChatTitle(t.id, editingTitle);
                                                        if (e.key === 'Escape') {setEditingChatId(null); setEditingTitle("");}
                                                    }}
                                                    className="flex-1 bg-white border rounded px-1 text-sm"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div onClick={() => setActiveThreadId(t.id)} className="flex-1">
                                                    <span className="text-sm truncate">
                                                        {t.title || `Chat #${t.id}`}
                                                    </span>
                                                </div>
                                            )}

                                            {editingChatId !== t.id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startEditingChat(t);
                                                    }}
                                                    className="ml-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700 text-xs"
                                                >
                                                    ✏️
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Fixed profile section at bottom */}
                        <div className="profile-section">
                            <button className="profile-image-btn" onClick={() => router.push("/profile")}>
                                <img src="/ai-technology-robot-cute-design.png" alt="Profile" />
                                <span>Profile</span>
                            </button>
                            <button className="logout-btn" onClick={() => console.log("Log out clicked!")}>
                                <img src="/5565392-200.png" alt="Log out" />
                                <span>Log out</span>
                            </button>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main chat */}
            <main className="main-chat">
                {activeThread ? (
                    <>
                        <h2>{activeThread.title}</h2>
                        <div ref={messagesRef} className="chat-messages border overflow-y-auto p-2 flex-1">
                            {messages.map((m, idx) => (
                                <div key={idx} className={`chat-bubble ${m.fromSelf ? "self" : "other"}`}>
                                    <p>{m.content}</p>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="chat-bubble other">
                                    <p>Thinking...</p>
                                </div>
                            )}
                        </div>

                        <form className="chat-input glass-input" onSubmit={handleSend}>
                            <input
                                type="text"
                                placeholder="> Type your command..."
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                disabled={isLoading}
                            />
                            <button className="neon-btn" type="submit" disabled={isLoading || !draft.trim()}>
                                {isLoading ? "SENDING..." : "SEND"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="welcome-screen">
                        <h1 className="neon-title">WELCOME TO IKO</h1>
                        <p className="neon-sub">Your AI informant</p>
                        <div className="prompt-hints">
                            <div className="hint-card">⚡ "Tell me a cyberpunk story"</div>
                            <div className="hint-card">⚡ "Hack into the neon grid"</div>
                            <div className="hint-card">⚡ "Explain quantum AI"</div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}