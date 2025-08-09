import { useState } from "react";

import ProfileForm from '../../components/ProfileForm.js';


export default function Profile() {

    const [mode, setMode] = useState("profile");

    return (
        <div className="container">




            <ProfileForm mode={mode} />
            

        </div>

    );
}
