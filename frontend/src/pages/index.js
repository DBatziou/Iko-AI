import { useState } from "react";
import HomeForm from "../components/HomeForm.js";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import Chat from '../components/ChatPage';


export default function Home() {

    const [mode, setMode] = useState("home");

    return (
        <div className="container">




            <HomeForm mode={mode} />
            <Chat mode={mode} />

        </div>

    );
}
