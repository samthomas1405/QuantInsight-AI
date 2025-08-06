import React from 'react';
import { motion } from 'framer-motion';

export default function QuantInsightLogo({ className = "", size = "default", animate = true }) {
  const sizes = {
    small: { width: 120, height: 40 },
    default: { width: 180, height: 60 },
    large: { width: 240, height: 80 }
  };

  const currentSize = sizes[size] || sizes.default;

  return (
    <div className={`flex items-center ${className}`}>
      <svg 
        width={currentSize.width} 
        height={currentSize.height} 
        viewBox="0 0 240 80" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>

          <motion.circle
            cx="40"
            cy="40"
            r="30"
            stroke="url(#logoGradient)"
            strokeWidth="4"
            fill="none"
            initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
            animate={animate ? { pathLength: 1 } : {}}
            transition={{ duration: 1, ease: "easeInOut" }}
          />

          <motion.path
            d="M 55 55 L 65 65"
            stroke="url(#logoGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
            animate={animate ? { pathLength: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
          />

          <g opacity="0.8">
            <motion.circle
              cx="40"
              cy="40"
              r="4"
              fill="#3B82F6"
              initial={animate ? { scale: 0 } : { scale: 1 }}
              animate={animate ? { scale: 1 } : {}}
              transition={{ duration: 0.3, delay: 1 }}
            />

            {[
              { x: 30, y: 30, delay: 1.1 },
              { x: 50, y: 30, delay: 1.2 },
              { x: 30, y: 50, delay: 1.3 },
              { x: 50, y: 50, delay: 1.4 },
              { x: 25, y: 40, delay: 1.5 },
              { x: 55, y: 40, delay: 1.6 }
            ].map((node, index) => (
              <motion.circle
                key={index}
                cx={node.x}
                cy={node.y}
                r="2.5"
                fill="#6366F1"
                initial={animate ? { scale: 0 } : { scale: 1 }}
                animate={animate ? { scale: 1 } : {}}
                transition={{ duration: 0.3, delay: node.delay }}
              />
            ))}

            {[
              "M40,40 L30,30",
              "M40,40 L50,30",
              "M40,40 L30,50",
              "M40,40 L50,50",
              "M40,40 L25,40",
              "M40,40 L55,40",
              "M30,30 L50,30",
              "M30,50 L50,50"
            ].map((path, index) => (
              <motion.path
                key={index}
                d={path}
                stroke="#94A3B8"
                strokeWidth="1"
                initial={animate ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 0.5 }}
                animate={animate ? { pathLength: 1, opacity: 0.5 } : {}}
                transition={{ duration: 0.5, delay: 1.7 + index * 0.1 }}
              />
            ))}
          </g>

          <g>
            <motion.text
              x="80"
              y="45"
              fontFamily="Inter, system-ui, -apple-system, sans-serif"
              fontSize="24"
              fontWeight="600"
              fill="#1E293B"
              initial={animate ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
              animate={animate ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 1 }}
            >
              QuantInsight
            </motion.text>

            <motion.text
              x="80"
              y="62"
              fontFamily="Inter, system-ui, -apple-system, sans-serif"
              fontSize="16"
              fontWeight="500"
              fill="url(#logoGradient2)"
              initial={animate ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
              animate={animate ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              AI TRADING INTELLIGENCE
            </motion.text>
          </g>
        </g>
      </svg>
    </div>
  );
}

export function QuantInsightLogoMark({ size = 40, className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 80 80" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="markGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>

      <circle
        cx="40"
        cy="40"
        r="30"
        stroke="url(#markGradient)"
        strokeWidth="4"
        fill="none"
      />

      <path
        d="M 55 55 L 65 65"
        stroke="url(#markGradient)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <g opacity="0.8">
        <circle cx="40" cy="40" r="4" fill="#3B82F6" />
        <circle cx="30" cy="30" r="2.5" fill="#6366F1" />
        <circle cx="50" cy="30" r="2.5" fill="#6366F1" />
        <circle cx="30" cy="50" r="2.5" fill="#6366F1" />
        <circle cx="50" cy="50" r="2.5" fill="#6366F1" />
        <path d="M40,40 L30,30 M40,40 L50,30 M40,40 L30,50 M40,40 L50,50" 
              stroke="#94A3B8" strokeWidth="1" opacity="0.5" />
      </g>
    </svg>
  );
}