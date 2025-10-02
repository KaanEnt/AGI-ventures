"use client"

import Header from "@/components/header"
import HeroContent from "@/components/hero-content"
import PulsingCircle from "@/components/pulsing-circle"
import ShaderBackground from "@/components/shader-background"
import EventsTimeline from "@/components/events-timeline"
import eventsData from "@/lib/scraped-events.json"

export default function ShaderShowcase() {
  const events = eventsData.events

  return (
    <ShaderBackground>
      <Header />
      <HeroContent />
      <PulsingCircle />
      
      <div className="absolute top-[30vh] right-8 z-20 w-[320px] md:w-[380px]">
        <EventsTimeline events={events} discordUrl="https://discord.gg/your-server" />
      </div>
    </ShaderBackground>
  )
}
