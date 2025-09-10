"use client"

export default function HeroContent() {
  return (
    <main className="absolute bottom-8 left-8 z-20 max-w-lg">
      <div className="text-left">
        <div
          className="inline-flex items-center px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm mb-4 relative border border-blue-500/20"
          style={{
            filter: "url(#glass-effect)",
          }}
        >
          <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent rounded-full" />
          <span className="text-blue-400 text-xs font-light relative z-10">✨Free In-person audit</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl md:leading-16 tracking-tight font-light text-white mb-4">
          <span className="font-medium italic instrument">Intellegence that runs your buildings</span>
          <br />
          <span className="font-light tracking-tight text-white"></span>
        </h1>

        {/* Description */}
        <p className="text-xs font-light text-white/70 mb-4 leading-relaxed">
          Thred is the multi-family operating system that knows your tenants, makes intelligent decisions and reduces delinquencies.&nbsp;
        </p>
      </div>
    </main>
  )
}
