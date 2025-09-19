import {useState, useMemo, useEffect} from "react";
import userService from "@/services/userService";

export default function LoginForm() {
    const [mode, setMode] = useState("login");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [login, setLogin] = useState({username: "", password: ""});
    const [signup, setSignup] = useState({
        name: "", email: "", username: "", password: "", confirm: ""
    });

    // ✅ Generate particles only ONCE
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
        // Check if user is already logged in
        const token = localStorage.getItem("token");
        if (token) {
            // Redirect to home page if token exists
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
            console.log("Logging in with:", login.username);
            let token = await userService.loginApi(login.username, login.password);
            console.log(`Token received: ${token}`);

            // Store token in localStorage
            localStorage.setItem("token", token);

            // Redirect to home page
            window.location.href = "/";
        } catch (error) {
            console.error("Login error:", error);

            // Better error handling
            let errorMessage = "❌ Login failed. Please try again.";
            if (error.response?.status === 401) {
                errorMessage = "❌ Invalid username or password.";
            } else if (error.response?.status === 500) {
                errorMessage = "❌ Server error. Please try again later.";
            } else if (error.message) {
                errorMessage = `❌ ${error.message}`;
            }

            setMessage(errorMessage);
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

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(signup.email)) {
            setMessage("❌ Please enter a valid email address.");
            return;
        }

        setIsLoading(true);
        setMessage("");

        try {
            console.log("Signing up with:", signup.username);
            let token = await userService.signupApi(
                signup.username,
                signup.password,
                signup.name,
                signup.email,
                'SIMPLE_USER'
            );
            console.log(`Token received: ${token}`);

            // Store token in localStorage
            localStorage.setItem("token", token);

            // Redirect to home page
            window.location.href = "/";
        } catch (error) {
            console.error("Signup error:", error);

            // Better error handling for signup
            let errorMessage = "❌ Signup failed. Please try again.";

            if (error.response?.status === 400) {
                const responseData = error.response.data;
                if (typeof responseData === 'string') {
                    if (responseData.includes('username') && responseData.includes('already exists')) {
                        errorMessage = "❌ Username already exists. Please choose another.";
                    } else if (responseData.includes('email') && responseData.includes('already exists')) {
                        errorMessage = "❌ Email already exists. Please use another email.";
                    } else {
                        errorMessage = `❌ ${responseData}`;
                    }
                } else if (responseData?.message) {
                    errorMessage = `❌ ${responseData.message}`;
                }
            } else if (error.response?.status === 409) {
                errorMessage = "❌ Username or email already exists. Please try different credentials.";
            } else if (error.response?.status === 500) {
                errorMessage = "❌ Server error. Please try again later.";
            } else if (error.message) {
                errorMessage = `❌ ${error.message}`;
            }

            setMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }

    const handleModeChange = (newMode) => {
        setMode(newMode);
        setMessage(""); // Clear any existing messages
        // Reset forms
        setLogin({username: "", password: ""});
        setSignup({name: "", email: "", username: "", password: "", confirm: ""});
    };

    return (
        <div className="login-container">
            {/* ✅ Particles (persist without reset) */}
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

            {/* ✅ Actual Login Form */}
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