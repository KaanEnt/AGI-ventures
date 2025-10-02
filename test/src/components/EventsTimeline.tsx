'use client';

import Image from 'next/image';
import { Event, EventsTimelineProps } from '@/lib/types';
import { formatEventDate, cn } from '@/lib/utils';

interface EventCardProps {
  event: Event;
}

function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.start_at);
  const month = eventDate.toLocaleDateString('en-US', { month: 'long' });
  const day = eventDate.getDate().toString().padStart(2, '0');
  const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="relative mb-16 md:mb-20">
      {/* Timeline circle and date */}
      <div className="relative z-10 flex items-center mb-4">
        {/* Simple white circle */}
        <div className="bg-white rounded-full w-3 h-3 md:w-4 md:h-4 shadow-sm border border-gray-200"></div>
        
        {/* Date next to circle */}
        <div className="ml-4 md:ml-6 text-white">
          <div className="text-base md:text-lg font-medium">{month} {day}</div>
          <div className="text-xs md:text-sm text-gray-400">{weekday}</div>
        </div>
      </div>

      {/* Event card - positioned below the date */}
      <div className="ml-6 md:ml-8">
        {/* Event container - responsive with consistent aspect ratio */}
        <a 
          href={event.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block bg-gray-900 rounded-2xl overflow-hidden hover:bg-gray-800 transition-all duration-300 cursor-pointer border border-gray-700 w-80 md:w-96 lg:w-[420px] hover:border-gray-600"
        >
          {/* Event image - proper aspect ratio and positioning */}
          <div className="relative w-full aspect-[4/3] bg-gray-800 overflow-hidden">
            <Image
              src={event.cover_url}
              alt={event.name}
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 320px, (max-width: 1024px) 384px, 420px"
              priority={true}
              quality={95}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/.specstory/references/Frame1468.png';
              }}
            />
          </div>
          
          {/* Event name - better padding, left aligned */}
          <div className="px-5 py-4">
            <h3 className="text-sm md:text-base font-medium text-white leading-snug">
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

  console.log('Timeline rendering with events:', futureEvents.length);

  if (futureEvents.length === 0) {
    console.log('No future events found, showing fallback message');
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-4xl mx-auto py-12 px-6">
          <div className="text-center">
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-700">
              <p className="text-gray-300 mb-6 text-lg">More Events coming soon...</p>
              <a 
                href={discordUrl}
                className="inline-flex items-center px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-all duration-200 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join our Discord to keep connected
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto py-8 md:py-12 px-4 md:px-6">
        {/* Timeline header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">Upcoming Events</h1>
          <div className="flex gap-3 md:gap-4">
            <button className="px-3 md:px-4 py-2 bg-white text-black rounded-full text-xs md:text-sm font-medium">
              Upcoming
            </button>
            <button className="px-3 md:px-4 py-2 bg-gray-800 text-gray-400 rounded-full text-xs md:text-sm font-medium hover:bg-gray-700">
              Past
            </button>
          </div>
        </div>

        {/* Timeline container */}
        <div className="relative">
          {/* Continuous vertical line */}
          <div className="absolute left-1.5 md:left-2 top-2 bottom-2 w-px bg-gray-700"></div>
          
          {/* Events */}
          <div>
            {futureEvents.map((event, index) => (
              <EventCard 
                key={event.id} 
                event={event}
              />
            ))}
            
            {/* Discord link on timeline - no date */}
            <div className="relative mb-16 md:mb-20">
              {/* Timeline circle only */}
              <div className="relative z-10 flex items-center mb-4">
                <div className="bg-white rounded-full w-3 h-3 md:w-4 md:h-4 shadow-sm border border-gray-200"></div>
              </div>

              {/* Discord card - positioned below circle */}
              <div className="ml-6 md:ml-8">
                <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 text-center w-80 md:w-96 lg:w-[420px]">
                  <p className="text-gray-300 mb-4 text-lg">More Events coming soon...</p>
                  <a 
                    href={discordUrl}
                    className="inline-flex items-center px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-all duration-200 font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join our Discord to keep connected
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