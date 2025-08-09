import { useEffect, useRef } from "react";

export default function MovingRobot() {
    const robotRef = useRef(null);

    useEffect(() => {
        const robot = robotRef.current;

        // function to move robot randomly
        const moveRobot = () => {
            const randomSpeed = 1 + Math.random() * 2; // 1-3 seconds
            robot.style.transition = `transform ${randomSpeed}s ease-in-out`;

            const randomRotation = Math.random() * 20 - 10; // tilt -10 to +10 deg
            robot.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${randomRotation}deg)`;
            const maxX = window.innerWidth - 150; // avoid going off screen
            const maxY = window.innerHeight - 150;

            const randomX = Math.random() * maxX;
            const randomY = Math.random() * maxY;


            robot.style.transform = `translate(${randomX}px, ${randomY}px)`;
        };

        // move every 3 seconds
        const interval = setInterval(moveRobot, 3000);

        // initial move
        moveRobot();

        return () => clearInterval(interval);
    }, []);

    return (
        <img
            ref={robotRef}
            src="/image-removebg-preview.png"
            alt="Robot"
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "120px",
                height: "auto",
                transition: "transform 2s ease-in-out", // smooth motion
                zIndex: 9999,
            }}
        />
    );
}
