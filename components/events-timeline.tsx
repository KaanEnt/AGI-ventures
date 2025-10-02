'use client';

import Image from 'next/image';
import { Event, EventsTimelineProps } from '@/lib/types';

interface EventCardProps {
  event: Event;
}

function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.start_at);
  const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
  const day = eventDate.getDate().toString().padStart(2, '0');

  return (
    <div className="relative mb-8">
      <div className="relative z-10 flex items-center mb-2">
        <div className="bg-white rounded-full w-2 h-2 shadow-sm border border-white/30"></div>
        
        <div className="ml-3 text-white">
          <div className="text-xs font-medium">{month} {day}</div>
        </div>
      </div>

      <div className="ml-4">
        <a 
          href={event.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 cursor-pointer border border-white/20 hover:border-white/40"
        >
          <div className="relative w-full aspect-[4/3] bg-black/40 overflow-hidden">
            <Image
              src={event.cover_url}
              alt={event.name}
              fill
              className="object-cover object-center"
              sizes="320px"
              quality={85}
            />
          </div>
          
          <div className="px-3 py-2.5">
            <h3 className="text-xs font-medium text-white leading-snug line-clamp-2">
              {event.name}
            </h3>
          </div>
        </a>
      </div>
    </div>
  );
}

export default function EventsTimeline({ events, discordUrl = "https://discord.gg/your-server" }: EventsTimelineProps) {
  const now = new Date();
  const futureEvents = events
    .filter(event => new Date(event.start_at) > now)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  if (futureEvents.length === 0) {
    return (
      <div className="w-full">
        <div className="text-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <p className="text-white/70 mb-4 text-sm">More Events coming soon...</p>
            <a 
              href={discordUrl}
              className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-all duration-200 font-medium text-xs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join our Discord
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div>
        <div className="mb-6">
          <h2 className="text-lg md:text-xl font-light text-white mb-3">Upcoming Events</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white text-black rounded-full text-xs font-medium">
              Upcoming
            </button>
            <button className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white/60 rounded-full text-xs font-medium hover:bg-white/20">
              Past
            </button>
          </div>
        </div>

        <div className="relative max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          <div className="absolute left-1 top-2 bottom-2 w-px bg-white/20"></div>
          
          <div>
            {futureEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={event}
              />
            ))}
            
            <div className="relative mb-8">
              <div className="relative z-10 flex items-center mb-2">
                <div className="bg-white rounded-full w-2 h-2 shadow-sm border border-white/30"></div>
              </div>

              <div className="ml-4">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 p-4 text-center">
                  <p className="text-white/70 mb-3 text-xs">More Events coming soon...</p>
                  <a 
                    href={discordUrl}
                    className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-all duration-200 font-medium text-xs"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join our Discord
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

