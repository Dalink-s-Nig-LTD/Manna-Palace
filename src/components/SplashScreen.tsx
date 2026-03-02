import { useState, useEffect } from "react";
import logo from "@/assets/logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

const DURATION = 30000; // 30 seconds
const INTERVAL = 100; // update every 100ms

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timer);
        setFading(true);
        setTimeout(onComplete, 600);
      }
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-700 bg-white ${fading ? "opacity-0" : "opacity-100"}`}
    >
      {/* Subtle gold radial glow behind logo */}
      <div
        className="absolute rounded-full"
        style={{
          width: 380,
          height: 380,
          background:
            "radial-gradient(circle, hsl(42 78% 55% / 0.15) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -65%)",
        }}
      />

      <img
        src={logo}
        alt="Manna Palace"
        className="w-[340px] h-[340px] object-contain mb-6 animate-pulse-slow drop-shadow-2xl relative z-10"
      />

      {/* Progress bar */}
      <div className="w-96 h-3 rounded-full overflow-hidden relative z-10 bg-gray-200 shadow-lg">
        <div
          className="h-full rounded-full transition-all duration-100 ease-linear"
          style={{
            width: `${progress}%`,
            background:
              "linear-gradient(90deg, hsl(42 78% 55%) 0%, hsl(42 85% 65%) 100%)",
          }}
        />
      </div>
    </div>
  );
};

export default SplashScreen;
