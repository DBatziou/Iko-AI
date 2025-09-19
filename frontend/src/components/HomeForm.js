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
    const [currentUser, setCurrentUser] = useState(null);

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
    }, [router]);

    // Fetch chat threads
    useEffect(() => {
        const fetchThreads = async () => {
            if (!currentUser) return;

            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    router.push("/login");
                    return;
                }

                // Fetch chats for the current user
                const res = await axios.get(`${API_URL}/chats?userId=${currentUser.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setThreads(res.data);
                if (res.data.length > 0) setActiveThreadId(res.data[0].id);
            } catch (err) {
                console.error("Error loading chats:", err);

                if (err.response?.status === 401) {
                    console.log("Authentication failed, redirecting to login");
                    localStorage.removeItem("token");
                    router.push("/login");
                } else {
                    console.error("Other error:", err.response?.data || err.message);
                }
            }
        };

        if (currentUser) {
            fetchThreads();
        }
    }, [currentUser, router]);

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
                    setMessages([]);
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

            if (!token || !currentUser) {
                router.push("/login");
                return;
            }

            const res = await axios.post(`${API_URL}/chats`, {
                title: "New Chat",
                userId: currentUser.id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newChat = res.data;
            setThreads(prev => [newChat, ...prev]);
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
        if (!draft.trim() || !activeThreadId || isLoading || !currentUser) return;

        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        const userMessage = {
            content: draft.trim(),
            chatId: activeThreadId,
            createdByUserId: currentUser.id
        };

        const currentDraft = draft.trim();

        // Clear input and add user message immediately to UI
        setDraft("");
        setMessages(prev => [...prev, {
            ...userMessage,
            fromSelf: true,
            id: Date.now(), // temporary ID for UI
            createdAt: new Date().toISOString()
        }]);
        setIsLoading(true);

        try {
            console.log("Sending message:", userMessage);

            // Send message to backend - this will save user message and return AI response
            const resp = await axios.post(`${API_URL}/messages`, userMessage, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("AI response received:", resp.data);

            // Add the AI response to messages
            setMessages(prev => [...prev, {
                ...resp.data,
                fromSelf: false
            }]);

            // Refresh messages to ensure we have the latest from database
            setTimeout(() => {
                if (activeThreadId) {
                    fetchMessagesForThread(activeThreadId);
                }
            }, 500);

        } catch (err) {
            console.error("Error sending message:", err);
            console.error("Error response:", err.response);

            // Remove the optimistic user message
            setMessages(prev => prev.slice(0, -1));

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
            } else {
                // Show error message to user
                setMessages(prev => [...prev, {
                    content: "Sorry, I couldn't process your message. Please try again.",
                    fromSelf: false,
                    chatId: activeThreadId,
                    id: Date.now(),
                    createdAt: new Date().toISOString()
                }]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to fetch messages for a specific thread
    const fetchMessagesForThread = async (threadId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await axios.get(`${API_URL}/messages/${threadId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessages(res.data);
        } catch (err) {
            console.error("Error fetching messages:", err);
        }
    };

    // New function to handle hint button clicks
    const handleHintClick = async (hintText) => {
        if (!currentUser) return;

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            // Create a new chat first
            const chatRes = await axios.post(`${API_URL}/chats`, {
                title: hintText.length > 50 ? hintText.substring(0, 50) + "..." : hintText,
                userId: currentUser.id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const newChat = chatRes.data;

            // Update threads and set active
            setThreads(prev => [newChat, ...prev]);
            setActiveThreadId(newChat.id);
            setMessages([]);

            // Send the hint text as the first message
            const userMessage = {
                content: hintText,
                chatId: newChat.id,
                createdByUserId: currentUser.id
            };

            // Add user message immediately
            setMessages(prev => [...prev, { ...userMessage, fromSelf: true }]);
            setIsLoading(true);

            // Send message to backend
            const resp = await axios.post(`${API_URL}/messages`, userMessage, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Add AI response
            setMessages(prev => [...prev, resp.data]);

        } catch (err) {
            console.error("Error creating chat with hint:", err);
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

    const handleLogout = () => {
        localStorage.removeItem("token");
        setCurrentUser(null);
        router.push("/login");
    };

    const activeThread = threads.find(t => t.id === activeThreadId);

    if (!currentUser) {
        return <div>Loading...</div>; // or redirect to login
    }

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
                            <button className="logout-btn" onClick={handleLogout}>
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
                            <div
                                className="hint-card"
                                onClick={() => handleHintClick("Tell me a cyberpunk story")}
                                style={{ cursor: 'pointer' }}
                            >
                                ⚡ "Tell me a cyberpunk story"
                            </div>
                            <div
                                className="hint-card"
                                onClick={() => handleHintClick("Hack into the neon grid")}
                                style={{ cursor: 'pointer' }}
                            >
                                ⚡ "Hack into the neon grid"
                            </div>
                            <div
                                className="hint-card"
                                onClick={() => handleHintClick("Explain quantum AI")}
                                style={{ cursor: 'pointer' }}
                            >
                                ⚡ "Explain quantum AI"
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}