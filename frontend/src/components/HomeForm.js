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
    const [selectedModel, setSelectedModel] = useState("llama-3.1-8b-instant");
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editingMessageContent, setEditingMessageContent] = useState("");

    // Updated AI models with current Groq models
    const availableModels = [
        { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B" },
        { id: "llama-3.1-70b-versatile", name: "Llama 3.1 70B" },
        { id: "llama3-8b-8192", name: "Llama 3 8B" },
        { id: "llama3-70b-8192", name: "Llama 3 70B" },
        { id: "gemma2-9b-it", name: "Gemma 2 9B" },
        { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" }
    ];

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

    // Function to render markdown-like content
    const renderMessageContent = (content) => {
        if (!content) return "";

        // Simple markdown-like rendering
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold**
            .replace(/\*(.*?)\*/g, '<em>$1</em>')              // *italic*
            .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')  // `code`
            .replace(/```([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>') // ```code blocks```
            .replace(/\n/g, '<br>');  // line breaks
    };

    // Function to handle hint button clicks
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
                headers: {Authorization: `Bearer ${token}`}
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
            setMessages(prev => [...prev, {...userMessage, fromSelf: true}]);
            setIsLoading(true);

            // Send message to backend with selected model
            const resp = await axios.post(`${API_URL}/messages/with-model`, {
                content: hintText,
                chatId: newChat.id,
                model: selectedModel
            }, {
                headers: {Authorization: `Bearer ${token}`}
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

    // FIXED: Move handler functions inside component
    const handleEditMessage = async (messageId, newContent) => {
        if (!newContent.trim()) return;

        try {
            const token = localStorage.getItem("token");
            setIsLoading(true);

            // Update the message
            await axios.put(`${API_URL}/messages/${messageId}`, {
                content: newContent
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state
            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, content: newContent } : m
            ));

            // Find the AI response that follows this user message and regenerate it
            const messageIndex = messages.findIndex(m => m.id === messageId);
            if (messageIndex !== -1 && messageIndex < messages.length - 1) {
                const nextMessage = messages[messageIndex + 1];
                if (!nextMessage.fromSelf) {
                    // Regenerate the AI response with the new user input
                    const resp = await axios.post(`${API_URL}/messages/${nextMessage.id}/regenerate`, {
                        model: selectedModel,
                        newUserInput: newContent
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    // Update the AI response in local state
                    setMessages(prev => prev.map(m =>
                        m.id === nextMessage.id ? { ...m, content: resp.data.content, createdAt: resp.data.createdAt } : m
                    ));
                }
            }

            setEditingMessageId(null);
            setEditingMessageContent("");
        } catch (err) {
            console.error("Error updating message:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerateMessage = async (messageId) => {
        try {
            const token = localStorage.getItem("token");
            setIsLoading(true);

            const resp = await axios.post(`${API_URL}/messages/${messageId}/regenerate`, {
                model: selectedModel
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update the message in local state
            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, content: resp.data.content, createdAt: resp.data.createdAt } : m
            ));

        } catch (err) {
            console.error("Error regenerating message:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
            }
        } finally {
            setIsLoading(false);
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

    const handleDeleteChat = async (chatId) => {
        if (!window.confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/chats/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Remove from local state
            setThreads(prev => prev.filter(t => t.id !== chatId));

            // If deleted chat was active, switch to another chat or clear messages
            if (activeThreadId === chatId) {
                const remainingThreads = threads.filter(t => t.id !== chatId);
                if (remainingThreads.length > 0) {
                    setActiveThreadId(remainingThreads[0].id);
                } else {
                    setActiveThreadId(null);
                    setMessages([]);
                }
            }
        } catch (err) {
            console.error("Error deleting chat:", err);
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
            console.log("Sending message with model:", selectedModel);

            // Send message to backend with selected model
            const resp = await axios.post(`${API_URL}/messages/with-model`, {
                content: currentDraft,
                chatId: activeThreadId,
                model: selectedModel
            }, {
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

    const startEditingMessage = (message) => {
        setEditingMessageId(message.id);
        setEditingMessageContent(message.content);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setCurrentUser(null);
        router.push("/login");
    };

    const activeThread = threads.find(t => t.id === activeThreadId);

    if (!currentUser) {
        return <div>Loading...</div>;
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

                        {/* Model Selector */}
                        <div className="model-selector">
                            <label className="model-label">AI Model:</label>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="model-select"
                            >
                                {availableModels.map(model => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Scrollable chat list container */}
                        <div className="chat-list-container">
                            <div className="chat-list-scroll">
                                <ul className="w-48 bg-gray-100">
                                    <li onClick={handleNewChat} className="cursor-pointer p-2 hover:bg-gray-200 new-chat-btn">
                                        ➕ New Chat
                                    </li>
                                    {threads.map(t => (
                                        <li key={t.id}
                                            className={`cursor-pointer p-2 ml-4 flex items-center justify-between group chat-item ${t.id === activeThreadId ? "active bg-blue-100" : "hover:bg-gray-200"}`}>

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
                                                    className="flex-1 bg-white border rounded px-1 text-sm chat-title-input"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div onClick={() => setActiveThreadId(t.id)} className="flex-1">
                                                    <span className="text-sm truncate chat-title">
                                                        {t.title || `Chat #${t.id}`}
                                                    </span>
                                                </div>
                                            )}

                                            {editingChatId !== t.id && (
                                                <div className="chat-controls">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startEditingChat(t);
                                                        }}
                                                        className="chat-control-btn edit-btn"
                                                        title="Edit chat title"
                                                    >
                                                        ✏
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteChat(t.id);
                                                        }}
                                                        className="chat-control-btn delete-btn"
                                                        title="Delete chat"
                                                    >
                                                        🗑
                                                    </button>
                                                </div>
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
                                    {editingMessageId === m.id ? (
                                        <div className="message-edit-container">
                                            <textarea
                                                value={editingMessageContent}
                                                onChange={(e) => setEditingMessageContent(e.target.value)}
                                                onBlur={() => handleEditMessage(m.id, editingMessageContent)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && e.ctrlKey) {
                                                        handleEditMessage(m.id, editingMessageContent);
                                                    }
                                                    if (e.key === 'Escape') {
                                                        setEditingMessageId(null);
                                                        setEditingMessageContent("");
                                                    }
                                                }}
                                                className="message-edit-textarea"
                                                autoFocus
                                            />
                                            <div className="message-edit-actions">
                                                <button
                                                    onClick={() => handleEditMessage(m.id, editingMessageContent)}
                                                    className="save-edit-btn"
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? "Saving..." : "Save"}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingMessageId(null);
                                                        setEditingMessageContent("");
                                                    }}
                                                    className="cancel-edit-btn"
                                                    disabled={isLoading}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div
                                                className="message-content"
                                                dangerouslySetInnerHTML={{ __html: renderMessageContent(m.content) }}
                                            />
                                            <div className="message-actions">
                                                {m.fromSelf && (
                                                    <button
                                                        onClick={() => startEditingMessage(m)}
                                                        className="message-action-btn edit-message-btn"
                                                        title="Edit message"
                                                        disabled={isLoading}
                                                    >
                                                        ✏
                                                    </button>
                                                )}
                                                {!m.fromSelf && (
                                                    <button
                                                        onClick={() => handleRegenerateMessage(m.id)}
                                                        className="message-action-btn regenerate-btn"
                                                        title="Regenerate response"
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? "..." : "🔄"}
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
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
                        <div className="model-info">
                            <p>Current Model: <span className="current-model">{availableModels.find(m => m.id === selectedModel)?.name}</span></p>
                        </div>
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