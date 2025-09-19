"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Pen, RefreshCw } from "lucide-react";

// Create axios instance with custom error handling
const apiClient = axios.create({
    baseURL: "http://localhost:8080",
    validateStatus: function (status) {
        // Don't throw errors for any status code - let us handle them
        return status < 500; // Only throw for 5xx server errors
    }
});

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

            const res = await apiClient.get(`/messages/${threadId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
                return;
            }

            setMessages(res.data);
        } catch (err) {
            console.error("Error fetching messages:", err);
        }
    };

    // Function to render markdown-like content
    const renderMessageContent = (content) => {
        if (!content) return "";

        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
            .replace(/```([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>')
            .replace(/\n/g, '<br>');
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

            const chatRes = await apiClient.post(`/chats`, {
                title: hintText.length > 50 ? hintText.substring(0, 50) + "..." : hintText,
                userId: currentUser.id
            }, {
                headers: {Authorization: `Bearer ${token}`}
            });

            if (chatRes.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
                return;
            }

            const newChat = chatRes.data;

            setThreads(prev => [newChat, ...prev]);
            setActiveThreadId(newChat.id);
            setMessages([]);

            const userMessage = {
                content: hintText,
                chatId: newChat.id,
                createdByUserId: currentUser.id
            };

            setMessages(prev => [...prev, {...userMessage, fromSelf: true}]);
            setIsLoading(true);

            const resp = await apiClient.post(`/messages/with-model`, {
                content: hintText,
                chatId: newChat.id,
                model: selectedModel
            }, {
                headers: {Authorization: `Bearer ${token}`}
            });

            if (resp.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
                return;
            }

            setMessages(prev => [...prev, resp.data]);

        } catch (err) {
            console.error("Error creating chat with hint:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditMessage = async (messageId, newContent) => {
        if (!newContent.trim()) return;

        try {
            const token = localStorage.getItem("token");
            setIsLoading(true);

            const updateRes = await apiClient.put(`/messages/${messageId}`, {
                content: newContent
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (updateRes.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
                return;
            }

            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, content: newContent } : m
            ));

            const messageIndex = messages.findIndex(m => m.id === messageId);
            if (messageIndex !== -1 && messageIndex < messages.length - 1) {
                const nextMessage = messages[messageIndex + 1];
                if (!nextMessage.fromSelf) {
                    const resp = await apiClient.post(`/messages/${nextMessage.id}/regenerate`, {
                        model: selectedModel,
                        newUserInput: newContent
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (resp.status === 401) {
                        localStorage.removeItem("token");
                        router.push("/login");
                        return;
                    }

                    setMessages(prev => prev.map(m =>
                        m.id === nextMessage.id ? { ...m, content: resp.data.content, createdAt: resp.data.createdAt } : m
                    ));
                }
            }

            setEditingMessageId(null);
            setEditingMessageContent("");
        } catch (err) {
            console.error("Error updating message:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerateMessage = async (messageId) => {
        try {
            const token = localStorage.getItem("token");
            setIsLoading(true);

            const resp = await apiClient.post(`/messages/${messageId}/regenerate`, {
                model: selectedModel
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (resp.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
                return;
            }

            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, content: resp.data.content, createdAt: resp.data.createdAt } : m
            ));

        } catch (err) {
            console.error("Error regenerating message:", err);
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

                const res = await apiClient.get(`/chats?userId=${currentUser.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.status === 401) {
                    localStorage.removeItem("token");
                    router.push("/login");
                    return;
                }

                setThreads(res.data);
                if (res.data.length > 0) setActiveThreadId(res.data[0].id);
            } catch (err) {
                console.error("Error loading chats:", err);
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

                const res = await apiClient.get(`/messages/${activeThreadId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.status === 401) {
                    localStorage.removeItem("token");
                    router.push("/login");
                    return;
                }

                setMessages(res.data);
            } catch (err) {
                console.error("Error loading messages:", err);
                setMessages([]);
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

    const handleNewChat = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token || !currentUser) {
                router.push("/login");
                return;
            }

            const res = await apiClient.post(`/chats`, {
                title: "New Chat",
                userId: currentUser.id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
                return;
            }

            const newChat = res.data;
            setThreads(prev => [newChat, ...prev]);
            setActiveThreadId(newChat.id);
            setMessages([]);
        } catch (err) {
            console.error("Error creating chat:", err);
        }
    };

    const handleDeleteChat = async (chatId) => {
        if (!window.confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await apiClient.delete(`/chats/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
                return;
            }

            setThreads(prev => prev.filter(t => t.id !== chatId));

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

        setDraft("");
        setMessages(prev => [...prev, {
            ...userMessage,
            fromSelf: true,
            id: Date.now(),
            createdAt: new Date().toISOString()
        }]);
        setIsLoading(true);

        try {
            const resp = await apiClient.post(`/messages/with-model`, {
                content: currentDraft,
                chatId: activeThreadId,
                model: selectedModel
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (resp.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
                return;
            }

            setMessages(prev => [...prev, {
                ...resp.data,
                fromSelf: false
            }]);

            setTimeout(() => {
                if (activeThreadId) {
                    fetchMessagesForThread(activeThreadId);
                }
            }, 500);

        } catch (err) {
            console.error("Error sending message:", err);
            setMessages(prev => prev.slice(0, -1));
            setMessages(prev => [...prev, {
                content: "Sorry, I couldn't process your message. Please try again.",
                fromSelf: false,
                chatId: activeThreadId,
                id: Date.now(),
                createdAt: new Date().toISOString()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditChatTitle = async (chatId, newTitle) => {
        if (!newTitle.trim()) return;

        try {
            const token = localStorage.getItem("token");
            const res = await apiClient.put(`/chats/${chatId}`, {
                title: newTitle.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
                return;
            }

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
            <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
                <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? "⟨⟨" : "⟩⟩"}
                </button>
                {sidebarExpanded && (
                    <div className="menu">
                        <h2>🤖 IKO AI</h2>

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
                                                        <Pen size={16} />
                                                    </button>
                                                )}
                                                {!m.fromSelf && (
                                                    <button
                                                        onClick={() => handleRegenerateMessage(m.id)}
                                                        className="message-action-btn regenerate-btn"
                                                        title="Regenerate response"
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? "..." : "⟳"}
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