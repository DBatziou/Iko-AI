import {useState, useMemo, useEffect} from "react";
import userService from "@/services/userService";

// Create axios instance with custom error handling
import axios from 'axios';

const apiClient = axios.create({
    baseURL: "http://localhost:8080",
    validateStatus: function (status) {
        return status < 500; // Only throw for 5xx server errors
    }
});

export default function LoginForm() {
    const [mode, setMode] = useState("login");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [login, setLogin] = useState({username: "", password: ""});
    const [signup, setSignup] = useState({
        name: "", email: "", username: "", password: "", confirm: ""
    });

    const particles = useMemo(
        () =>
            Array.from({ length: 20 }).map((_, i) => ({
                id: i,
                top: `${Math.random() * 100}vh`,
                left: `${Math.random() * 100}vw`,
                duration: `${6 + Math.random() * 5}s`,
                delay: `${Math.random() * 5}s`,
                color: Math.random() > 0.5 ? "#00ffd6" : "#ff00ff",
            })),
        []
    );

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            window.location.href = "/";
        }
    }, []);

    async function handleLogin(e) {
        e.preventDefault();
        if (!login.username.trim() || !login.password.trim()) {
            setMessage("❌ Please fill all fields.");
            return;
        }

        setIsLoading(true);
        setMessage("");

        try {
            // Use custom apiClient to avoid Next.js error popups
            console.log("Logging in with:", login.username);

            // Create Basic Auth header
            const credentials = btoa(`${login.username}:${login.password}`);
            const response = await apiClient.get("/login", {
                headers: {
                    'Authorization': `Basic ${credentials}`
                }
            });

            if (response.status === 401) {
                setMessage("❌ Invalid username or password.");
                return;
            }

            if (response.status === 400) {
                setMessage("❌ Please check your credentials.");
                return;
            }

            if (response.status !== 200) {
                setMessage("❌ Login failed. Please try again.");
                return;
            }

            const token = response.data.token;
            console.log(`Token received: ${token}`);

            // Store token in localStorage
            localStorage.setItem("token", token);

            // Redirect to home page
            window.location.href = "/";
        } catch (error) {
            console.error("Login error:", error);
            setMessage("❌ Server error. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSignup(e) {
        e.preventDefault();
        if (!signup.username?.trim() || !signup.email?.trim() || !signup.name?.trim() ||
            !signup.password?.trim() || !signup.confirm?.trim()) {
            setMessage("❌ Please fill all fields.");
            return;
        }

        if (signup.password !== signup.confirm) {
            setMessage("❌ Passwords do not match.");
            return;
        }

        if (signup.password.length < 4) {
            setMessage("❌ Password must be at least 4 characters long.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(signup.email)) {
            setMessage("❌ Please enter a valid email address.");
            return;
        }

        setIsLoading(true);
        setMessage("");

        try {
            console.log("Signing up with:", signup.username);

            // Create user account
            const signupResponse = await apiClient.post("/users", {
                name: signup.name.trim(),
                email: signup.email.trim(),
                username: signup.username.trim(),
                password: signup.password,
                role: 'SIMPLE_USER'
            });

            if (signupResponse.status === 400) {
                const responseData = signupResponse.data;
                if (responseData?.message) {
                    if (responseData.message.includes('username') && responseData.message.includes('already exists')) {
                        setMessage("❌ Username already exists. Please choose another.");
                    } else if (responseData.message.includes('email') && responseData.message.includes('already exists')) {
                        setMessage("❌ Email already exists. Please use another email.");
                    } else {
                        setMessage(`❌ ${responseData.message}`);
                    }
                } else {
                    setMessage("❌ Invalid signup data. Please check your information.");
                }
                return;
            }

            if (signupResponse.status === 409) {
                setMessage("❌ Username or email already exists. Please try different credentials.");
                return;
            }

            if (signupResponse.status !== 200) {
                setMessage("❌ Signup failed. Please try again.");
                return;
            }

            // After successful signup, login the user
            const credentials = btoa(`${signup.username}:${signup.password}`);
            const loginResponse = await apiClient.get("/login", {
                headers: {
                    'Authorization': `Basic ${credentials}`
                }
            });

            if (loginResponse.status === 200) {
                const token = loginResponse.data.token;
                console.log(`Token received: ${token}`);
                localStorage.setItem("token", token);
                window.location.href = "/";
            } else {
                setMessage("✅ Account created successfully! Please login.");
                setMode("login");
                setLogin({username: signup.username.trim(), password: ""});
            }

        } catch (error) {
            console.error("Signup error:", error);
            setMessage("❌ Server error. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }

    const handleModeChange = (newMode) => {
        setMode(newMode);
        setMessage("");
        setLogin({username: "", password: ""});
        setSignup({name: "", email: "", username: "", password: "", confirm: ""});
    };

    return (
        <div className="login-container">
            <div className="particles-container">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="particle"
                        style={{
                            top: p.top,
                            left: p.left,
                            animationDuration: p.duration,
                            animationDelay: p.delay,
                            background: p.color,
                        }}
                    />
                ))}
            </div>

            <div className="wrapper">
                <div className="title">
                    <h1>
                        IKO<span className="blinking-cursor"></span>
                    </h1>
                </div>

                <div className="tabButtons">
                    <button
                        className={`tabButton ${mode === "login" ? "active" : ""}`}
                        onClick={() => handleModeChange("login")}
                        disabled={isLoading}
                    >
                        Login
                    </button>
                    <button
                        className={`tabButton ${mode === "signup" ? "active" : ""}`}
                        onClick={() => handleModeChange("signup")}
                        disabled={isLoading}
                    >
                        Sign up
                    </button>
                </div>

                {mode === "login" && (
                    <form onSubmit={handleLogin} className="auth-form">
                        <input
                            className="neon-input"
                            placeholder="Username"
                            required
                            value={login.username}
                            onChange={e => setLogin({...login, username: e.target.value})}
                            disabled={isLoading}
                        />
                        <input
                            className="neon-input"
                            type="password"
                            placeholder="Password"
                            required
                            value={login.password}
                            onChange={e => setLogin({...login, password: e.target.value})}
                            disabled={isLoading}
                        />
                        <button
                            className="loginButton"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? "LOGGING IN..." : "LOG IN"}
                        </button>
                    </form>
                )}

                {mode === "signup" && (
                    <form onSubmit={handleSignup} className="auth-form">
                        <input
                            className="neon-input"
                            placeholder="Full Name"
                            required
                            value={signup.name}
                            onChange={e => setSignup({...signup, name: e.target.value})}
                            disabled={isLoading}
                        />
                        <input
                            className="neon-input"
                            type="email"
                            placeholder="Email"
                            required
                            value={signup.email}
                            onChange={e => setSignup({...signup, email: e.target.value})}
                            disabled={isLoading}
                        />
                        <input
                            className="neon-input"
                            placeholder="Username"
                            required
                            value={signup.username}
                            onChange={e => setSignup({...signup, username: e.target.value})}
                            disabled={isLoading}
                        />
                        <input
                            className="neon-input"
                            type="password"
                            placeholder="Password"
                            required
                            value={signup.password}
                            onChange={e => setSignup({...signup, password: e.target.value})}
                            disabled={isLoading}
                        />
                        <input
                            className="neon-input"
                            type="password"
                            placeholder="Confirm Password"
                            required
                            value={signup.confirm}
                            onChange={e => setSignup({...signup, confirm: e.target.value})}
                            disabled={isLoading}
                        />
                        <button
                            className="loginButton"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? "SIGNING UP..." : "SIGN UP"}
                        </button>
                    </form>
                )}

                {message && <p className="message">{message}</p>}
            </div>
        </div>
    );
}