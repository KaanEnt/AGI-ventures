"use client"

import Header from "@/components/header"
import HeroContent from "@/components/hero-content"
import ShaderBackground from "@/components/shader-background"
import EventsTimeline from "@/components/events-timeline"
import eventsData from "@/lib/scraped-events.json"

export default function ShaderShowcase() {
  const events = eventsData.events

  return (
    <ShaderBackground>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-1 flex flex-col justify-between">
          <div className="relative z-20 px-8 pt-8 pb-20">
            <EventsTimeline events={events} discordUrl="https://discord.gg/your-server" />
          </div>
          
          <HeroContent />
        </div>
      </div>
    </ShaderBackground>
  )
}
