import React from 'react';
import { motion } from 'framer-motion';

export const FloatingTeaLeaves: React.FC = () => {
  const leaves = [
    { top: '15%', left: '10%', size: 28, delay: 0, duration: 7, rot: 15 },
    { top: '35%', left: '85%', size: 34, delay: 1.5, duration: 8.5, rot: -25 },
    { top: '65%', left: '8%', size: 24, delay: 0.8, duration: 6.5, rot: 40 },
    { top: '75%', left: '80%', size: 30, delay: 2.2, duration: 9, rot: -10 },
    { top: '20%', left: '70%', size: 22, delay: 3, duration: 7.2, rot: 30 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10" aria-hidden="true">
      {leaves.map((leaf, idx) => (
        <motion.div
          key={idx}
          className="absolute opacity-40 hover:opacity-75 transition-opacity"
          style={{ top: leaf.top, left: leaf.left }}
          animate={{
            y: [0, -18, 0],
            rotate: [leaf.rot, leaf.rot + 12, leaf.rot],
          }}
          transition={{
            duration: leaf.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: leaf.delay,
          }}
        >
          <svg
            width={leaf.size}
            height={leaf.size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
          >
            <path
              d="M20 36 C12 24, 6 18, 6 10 C18 8, 28 18, 20 36 Z"
              fill="url(#leafGrad)"
            />
            <path
              d="M20 36 C22 22, 34 16, 34 8 C22 8, 14 22, 20 36 Z"
              fill="#22c55e"
              opacity="0.8"
            />
            <path
              d="M20 36 Q19 22 20 12"
              stroke="#15803d"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="leafGrad" x1="6" y1="10" x2="28" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4ade80" />
                <stop offset="1" stopColor="#15803d" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      ))}
    </div>
  );
};
