"use client";
import React from "react";

interface SaraAvatarProps {
  isTalking: boolean;
}

export default function SaraAvatar({ isTalking }: SaraAvatarProps) {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 to-black">
      <style>{`
        /* Core animations */
        @keyframes avatar-breathe {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.01); }
        }
        @keyframes avatar-sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(1deg); }
        }
        @keyframes avatar-blink {
          0%, 45%, 48%, 55%, 100% { transform: scaleY(1); }
          46.5%, 52% { transform: scaleY(0.1); }
        }
        @keyframes avatar-talk {
          0%, 100% { transform: scaleY(0.2); border-radius: 50%; }
          50% { transform: scaleY(1.2); border-radius: 40%; }
          75% { transform: scaleY(0.8) scaleX(1.1); border-radius: 45%; }
        }
        @keyframes hair-swish {
          0%, 100% { transform: skewX(0deg); }
          50% { transform: skewX(-2deg); }
        }

        /* Applied classes */
        .avatar-container {
          animation: avatar-breathe 4s ease-in-out infinite, avatar-sway 8s ease-in-out infinite;
          transform-origin: bottom center;
        }
        .avatar-eyes {
          animation: avatar-blink 5s infinite;
          transform-origin: center;
        }
        .avatar-hair-back {
          animation: hair-swish 6s ease-in-out infinite;
          transform-origin: top center;
        }
        .avatar-hair-front {
          animation: hair-swish 5s ease-in-out infinite;
          transform-origin: top center;
        }
        .avatar-mouth-talking {
          animation: avatar-talk 0.2s infinite;
          transform-origin: center;
        }
      `}</style>

      {/* SVG Canvas */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full max-w-[300px] max-h-[300px] drop-shadow-2xl avatar-container"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <linearGradient id="skin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fcdbb4" />
            <stop offset="100%" stopColor="#e2b78b" />
          </linearGradient>
          <linearGradient id="hair" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a1a24" />
            <stop offset="100%" stopColor="#0d0d14" />
          </linearGradient>
          <linearGradient id="coat" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#222" />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
          <filter id="glow">
             <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
             <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
             </feMerge>
          </filter>
        </defs>

        {/* Back Hair */}
        <path
          className="avatar-hair-back"
          d="M 40,100 C 30,160 20,200 20,200 L 180,200 C 180,200 170,160 160,100 Z"
          fill="url(#hair)"
        />

        {/* Body / Shoulders */}
        <g id="body" transform="translate(0, 140)">
          {/* Coat */}
          <path
            d="M 60,0 C 30,10 10,40 0,80 L 200,80 C 190,40 170,10 140,0 Z"
            fill="url(#coat)"
          />
          {/* White Shirt / Collar */}
          <path d="M 80,0 L 120,0 L 100,30 Z" fill="#fff" />
          {/* Advocate Band (Two white strips) */}
          <path d="M 95,20 L 90,50 L 98,50 L 100,20 Z" fill="#eee" />
          <path d="M 105,20 L 110,50 L 102,50 L 100,20 Z" fill="#eee" />
        </g>

        {/* Head / Face */}
        <g id="head" transform="translate(100, 90)">
          {/* Neck */}
          <path d="M -15,40 L 15,40 L 15,60 L -15,60 Z" fill="#d9ad81" />
          
          {/* Face Shape */}
          <path
            d="M -45,-30 C -45,10 -35,50 0,60 C 35,50 45,10 45,-30 C 45,-70 -45,-70 -45,-30 Z"
            fill="url(#skin)"
          />
          
          {/* Cheeks (Blush) */}
          <ellipse cx="-25" cy="15" rx="8" ry="4" fill="#ff9999" opacity="0.3" filter="url(#glow)" />
          <ellipse cx="25" cy="15" rx="8" ry="4" fill="#ff9999" opacity="0.3" filter="url(#glow)" />

          {/* Eyes Group (Blinks together) */}
          <g className="avatar-eyes">
            {/* Left Eye */}
            <g transform="translate(-22, -5)">
              {/* Sclera */}
              <ellipse cx="0" cy="0" rx="10" ry="12" fill="#fff" />
              {/* Iris */}
              <ellipse cx="0" cy="0" rx="5" ry="8" fill="#5c3a21" />
              {/* Pupil */}
              <circle cx="0" cy="0" r="2.5" fill="#000" />
              {/* Highlight */}
              <circle cx="2" cy="-3" r="1.5" fill="#fff" opacity="0.8" />
              {/* Eyelash / Liner */}
              <path d="M -12,-5 C -5,-15 5,-15 12,-5" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </g>

            {/* Right Eye */}
            <g transform="translate(22, -5)">
              {/* Sclera */}
              <ellipse cx="0" cy="0" rx="10" ry="12" fill="#fff" />
              {/* Iris */}
              <ellipse cx="0" cy="0" rx="5" ry="8" fill="#5c3a21" />
              {/* Pupil */}
              <circle cx="0" cy="0" r="2.5" fill="#000" />
              {/* Highlight */}
              <circle cx="2" cy="-3" r="1.5" fill="#fff" opacity="0.8" />
              {/* Eyelash / Liner */}
              <path d="M -12,-5 C -5,-15 5,-15 12,-5" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </g>
          </g>

          {/* Nose */}
          <path d="M 0,10 L 2,15 L -2,15 Z" fill="#c79b71" opacity="0.6" />

          {/* Mouth */}
          <g transform="translate(0, 30)">
            {isTalking ? (
              <ellipse
                cx="0"
                cy="0"
                rx="6"
                ry="3"
                fill="#8a2e2e"
                className="avatar-mouth-talking"
              />
            ) : (
              <path d="M -5,0 Q 0,2 5,0" stroke="#8a2e2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            )}
          </g>
        </g>

        {/* Front Hair (Bangs & sides) */}
        <g id="hair-front" transform="translate(100, 90)" className="avatar-hair-front">
          {/* Main bangs */}
          <path
            d="M -50,-20 C -50,-80 50,-80 50,-20 C 40,-40 20,-30 10,-20 C 0,-40 -20,-30 -30,-20 C -40,-40 -50,-20 -50,-20 Z"
            fill="url(#hair)"
          />
          {/* Side lock left */}
          <path d="M -45,-30 Q -60,10 -40,60 Q -35,30 -40,-30" fill="url(#hair)" />
          {/* Side lock right */}
          <path d="M 45,-30 Q 60,10 40,60 Q 35,30 40,-30" fill="url(#hair)" />
          {/* Highlight */}
          <path d="M -30,-55 Q 0,-65 30,-55" stroke="#333344" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
        </g>

        {/* Glasses (Optional, gives lawyer/smart look) */}
        <g id="glasses" transform="translate(100, 85)" opacity="0.8">
          <rect x="-35" y="-12" width="26" height="16" rx="4" fill="none" stroke="#e81c1c" strokeWidth="1.5" />
          <rect x="9" y="-12" width="26" height="16" rx="4" fill="none" stroke="#e81c1c" strokeWidth="1.5" />
          <path d="M -9,-4 Q 0,-6 9,-4" fill="none" stroke="#e81c1c" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}
