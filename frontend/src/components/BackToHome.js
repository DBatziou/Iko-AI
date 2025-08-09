import { useRouter } from "next/router";

export default function BackToHome() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push("/")}
            style={{
                padding: "10px 20px",
                backgroundColor: "#0ff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                margin: "20px 0"
            }}
        >
            Go Back Home
        </button>
    );
}
