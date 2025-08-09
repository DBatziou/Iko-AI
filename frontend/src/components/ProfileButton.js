import { useRouter } from "next/router";
export default function ProfileButton() {
    const router = useRouter();
    return ( <button onClick={() => router.push("/profile")}
    className="profile-image-btn">
        <img src="/ai-technology-robot-cute-design.png" alt="Profile" />
        <span>Profile</span>
    </button> ); }