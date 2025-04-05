import React from 'react'
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css'; // Create this CSS file for animations

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // Matrix animation effect
    const canvas = document.getElementById('matrix');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
      const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const nums = '0123456789';
      const alphabet = katakana + latin + nums;

      const fontSize = 16;
      const columns = canvas.width / fontSize;
      const rainDrops = Array(Math.floor(columns)).fill(1);

      const draw = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#64ffda';
        ctx.font = fontSize + 'px monospace';

        rainDrops.forEach((y, i) => {
          const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
          ctx.fillText(text, i * fontSize, y * fontSize);
          
          if (y * fontSize > canvas.height && Math.random() > 0.975) {
            rainDrops[i] = 0;
          }
          rainDrops[i]++;
        });
      };

      const interval = setInterval(draw, 30);
      return () => clearInterval(interval);
    }
  }, []);

  const handleExplore = () => {
    navigate('/challenges'); // Or '/login' if you prefer
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-[#64ffda] overflow-hidden relative">
      {/* Matrix background */}
      <canvas 
        id="matrix" 
        className="absolute top-0 left-0 w-full h-full opacity-20 z-0"
      ></canvas>

      <section className="relative z-10 py-32 text-center">
        {/* Cipher text animation */}
        <div className="cipher-text mb-12">
          <h1 className="text-6xl md:text-5xl font-bold mb-6 font-mono tracking-wider">
            WELCOME_TO_CTF<span className="text-white">PLATFORM</span>
          </h1>
          <div className="cipher-line h-1 bg-[#64ffda] w-1/2 mx-auto mb-8"></div>
        </div>

        <p className="text-xl md:text-2xl text-[#ccd6f6] max-w-3xl mx-auto mb-12 px-4">
          Test your cybersecurity skills with our capture-the-flag challenges.
          <span className="block mt-4 text-[#64ffda]">Hack the planet.</span>
        </p>

        {/* Animated button */}
        <button 
          onClick={handleExplore}
          className="explore-btn relative overflow-hidden px-8 py-4 border-2 border-[#64ffda] text-[#64ffda] text-lg font-mono tracking-wider group"
        >
          <span className="relative z-10 group-hover:text-[#0a192f] transition-colors duration-300">
            EXPLORE_CHALLENGES
          </span>
          <span className="absolute inset-0 bg-[#64ffda] transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
        </button>

        {/* Binary code animation at bottom */}
        <div className="binary-animation absolute bottom-10 left-0 right-0 text-xs opacity-30">
          {Array(100).fill(0).map((_, i) => (
            <span key={i} className="animate-pulse">
              {Math.random() > 0.5 ? '1' : '0'}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}