"use client"

import { PulsingBorder } from "@paper-design/shaders-react"
import { motion } from "framer-motion"

export default function Header() {
  return (
    <header className="relative z-20 flex items-center justify-between px-8 py-6">
      <div className="flex items-center">
        <span className="text-white font-bold text-xl">AGIVC</span>
      </div>

      <nav className="flex items-center space-x-2">
        <a
          href="#"
          className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          Calendar
        </a>
        <a
          href="#"
          className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          Community
        </a>
        <a
          href="#"
          className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          Blog
        </a>
        
        <div className="relative w-12 h-12 flex items-center justify-center ml-2">
          <PulsingBorder
            colors={["#BEECFF", "#E77EDC", "#FF4C3E", "#00FF88", "#FFD700", "#FF6B35", "#8A2BE2"]}
            colorBack="#00000000"
            speed={1.5}
            roundness={1}
            thickness={0.1}
            softness={0.2}
            intensity={5}
            spotsPerColor={5}
            spotSize={0.1}
            pulse={0.1}
            smoke={0.5}
            smokeSize={4}
            scale={0.65}
            rotation={0}
            frame={9161408.251009725}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
            }}
          />

          <motion.svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            style={{ transform: "scale(1.4)" }}
          >
            <defs>
              <path id="circle" d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
            </defs>
            <text className="text-[6px] fill-white/80 instrument">
              <textPath href="#circle" startOffset="0%">
                Build the future Build the future Build the future
              </textPath>
            </text>
          </motion.svg>
        </div>
      </nav>
    </header>
  )
}
