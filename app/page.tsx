"use client"

import Header from "@/components/header"
import HeroContent from "@/components/hero-content"
import ShaderBackground from "@/components/shader-background"
import EventsTimeline from "@/components/events-timeline"
import eventsData from "@/lib/scraped-events.json"

export default function ShaderShowcase() {
  // Support both old and new data format
  const upcomingEvents = eventsData.upcoming_events || eventsData.events
  const pastEvents = eventsData.past_events || []

  return (
    <ShaderBackground>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-1 flex flex-col pb-8">
          <div className="relative z-20 px-8 pt-4 flex-1 flex flex-col">
            <EventsTimeline 
              events={upcomingEvents} 
              pastEvents={pastEvents}
              discordUrl="https://discord.gg/your-server" 
            />
          </div>
          
          <HeroContent />
        </div>
      </div>
    </ShaderBackground>
  )
}
