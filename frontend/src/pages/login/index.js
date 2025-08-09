import { useState } from "react";
import LoginForm from "../../components/LoginForm.js";


export default function Login() {

    const [mode, setMode] = useState("login");

    return (
        <div className="container">
            <div className="toggle-buttons">


            </div>
            <LoginForm mode={mode} />

        </div>

    );
}
