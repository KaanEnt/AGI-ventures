import EventsTimeline from '@/components/EventsTimeline';
import { getAGIVCEvents } from '@/lib/agicEvents';

export default async function Home() {
  // Fetch real AGIVC events with multiple fallbacks
  const events = await getAGIVCEvents();

  return (
    <EventsTimeline 
      events={events} 
      discordUrl="https://discord.gg/your-server" 
    />
  );
}
