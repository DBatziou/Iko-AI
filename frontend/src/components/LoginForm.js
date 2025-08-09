import {useState, useMemo, useEffect} from "react";
import userService from "@/services/userService";

export default function LoginForm() {
    const [mode, setMode] = useState("login");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
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

//    const handleSubmit = () => {
//        if (mode === "login") {
//            handleLogin();
  //      } else {
  //          handleSignUp();
//        }
 //   };

  //  async function handleLogin(e) {
    //    e.preventDefault();

    //    console.log("Logging in with:", login);

     //   console.log("UserService: ", userService)
     //   let token = await userService.loginApi(login.username, login.password);

      //  console.log(`Token received: ${token}`);

        // store token in localStorage
    //    localStorage.setItem("token", token);

        // redirect to home page
    //    window.location.href = "/";

   //     if (users[username] && users[username].password === password) {
     //       setMessage(`✅ Welcome back, ${username}!`);
      //  } else {
     //       setMessage("❌ Invalid username or password.");
     //   }


   // }




  //  const handleSignUp = () => {
 ///       if (!username || !email || !password || !confirmPassword) {
 //           setMessage("❌ Please fill all fields.");
 //           return;
 //       }
  //      if (password !== confirmPassword) {
 //           setMessage("❌ Passwords do not match.");
  //          return;
 //       }

   //     const users = JSON.parse(localStorage.getItem("users") || "{}");
   //     if (users[username]) {
  //          setMessage("❌ Username already exists.");
  //          return;
  ////      }

   //     users[username] = { email, password };
   //     localStorage.setItem("users", JSON.stringify(users));
   //     setMessage(`✅ Account created for ${username}! You can now log in.`);

   //     setEmail("");
  //      setPassword("");
   //     setConfirmPassword("");
  //  };
    async function handleLogin(e) {
        e.preventDefault();

        console.log("Logging in with:", login);

        console.log("UserService: ", userService)
        let token = await userService.loginApi(login.username, login.password);

        console.log(`Token received: ${token}`);

        // store token in localStorage
        localStorage.setItem("token", token);

        // redirect to home page
        window.location.href = "/";


    }

    const handleSignup = e => {
        e.preventDefault();
        console.log("Signing up with:", signup);

        // Create a new user with POST /users API

        // On success, Change tab to login

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
                        onClick={() => setMode("login")}

                    >
                        Login
                    </button>
                    <button
                        className={`tabButton ${mode === "signup" ? "active" : ""}`}
                        onClick={() => setMode("signup")}
                    >
                        Sign up
                    </button>
                </div>

                {mode ==="login" &&(
                    <form >
                        <input
                            placeholder="Username"
                            required
                            value={login.username}
                            onChange={e => setLogin({...login, username: e.target.value})}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            value={login.password}
                            onChange={e => setLogin({...login, password: e.target.value})}
                        />
                        <button className="loginButton" onClick={handleLogin}>
                            {mode === "login" ? "Log in" : "Sign up"}
                        </button>
                    </form>
                )}

                {mode ==="signup" && (
                    <form>
                        <input
                            placeholder="Name"
                            required
                            value={signup.name}
                            onChange={e => setSignup({...signup, name: e.target.value})}
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            required
                            value={signup.email}
                            onChange={e => setSignup({...signup, email: e.target.value})}
                        />
                        <input
                            placeholder="Username"
                            required
                            value={signup.username}
                            onChange={e => setSignup({...signup, username: e.target.value})}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            value={signup.password}
                            onChange={e => setSignup({...signup, password: e.target.value})}
                        />
                        <input
                            type="password"
                            placeholder="Confirm password"
                            required
                            value={signup.confirm}
                            onChange={e => setSignup({...signup, confirm: e.target.value})}
                        />
                        <button className="loginButton" onClick={handleSignup}>
                            {mode === "login" ? "Log in" : "Sign up"}
                        </button>
                    </form>
                )}





                {message && <p className="message">{message}</p>}
            </div>
        </div>
    );
}
