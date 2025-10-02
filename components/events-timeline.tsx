'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Event, EventsTimelineProps } from '@/lib/types';

interface DateItem {
  date: Date;
  event?: Event;
  isMock: boolean;
}

export default function EventsTimeline({ events, discordUrl = "https://discord.gg/your-server" }: EventsTimelineProps) {
  const now = new Date();
  const futureEvents = events
    .filter(event => new Date(event.start_at) > now)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const createMockDates = (): DateItem[] => {
    const dateItems: DateItem[] = futureEvents.map(event => ({
      date: new Date(event.start_at),
      event,
      isMock: false
    }));

    while (dateItems.length < 7) {
      const lastDate = dateItems.length > 0 ? dateItems[dateItems.length - 1].date : now;
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + 7);
      dateItems.push({
        date: nextDate,
        isMock: true
      });
    }

    return dateItems;
  };

  const allDates = createMockDates();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const selectedDate = allDates[selectedIndex];

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) return;

      e.preventDefault();
      setIsScrolling(true);

      if (e.deltaY > 0) {
        setSelectedIndex(prev => Math.min(prev + 1, allDates.length - 1));
      } else {
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      }

      setTimeout(() => setIsScrolling(false), 300);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [allDates.length, isScrolling]);

  const getVisibleDates = () => {
    const visible = [];
    for (let i = -1; i <= 1; i++) {
      const index = selectedIndex + i;
      if (index >= 0 && index < allDates.length) {
        visible.push({ item: allDates[index], offset: i, index });
      }
    }
    return visible;
  };

  const canScrollUp = selectedIndex > 0;
  const canScrollDown = selectedIndex < allDates.length - 1;

  return (
    <div className="flex justify-between w-full">
      {/* Left side - Date selector */}
      <div className="flex-shrink-0">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-4">Upcoming Events</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white text-black rounded-full text-xs font-medium">
              Upcoming
            </button>
            <button className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white/60 rounded-full text-xs font-medium hover:bg-white/20">
              Past
            </button>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="relative group"
        >
          {/* Hover glow effect */}
          <div className="absolute -left-4 -right-4 top-1/2 -translate-y-1/2 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute left-0 w-1 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent blur-sm"></div>
            <div className="absolute right-0 w-1 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent blur-sm"></div>
          </div>

          {/* Top arrow indicator */}
          {canScrollUp && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex justify-center z-10">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </motion.div>
            </div>
          )}

          <div className="relative h-[150px] flex flex-col justify-center">
            <div className="relative h-full flex flex-col items-start justify-center">
              {getVisibleDates().map(({ item, offset, index }) => {
                const isSelected = offset === 0;
                const month = item.date.toLocaleDateString('en-US', { month: 'long' });
                const day = item.date.getDate().toString().padStart(2, '0');
                
                const scale = 1 - Math.abs(offset) * 0.2;
                const opacity = isSelected ? 1 : Math.max(0.3, 1 - Math.abs(offset) * 0.4);
                const translateY = offset * 45;

                return (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedIndex(index)}
                    className="absolute text-left whitespace-nowrap"
                    initial={false}
                    animate={{
                      y: translateY,
                      scale,
                      opacity,
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    style={{
                      transformOrigin: 'left center',
                    }}
                  >
                    {item.isMock ? (
                      <div className={`text-2xl ${isSelected ? 'text-white' : 'text-white/40'}`}>•</div>
                    ) : (
                      <div className={`text-xl font-light ${isSelected ? 'text-white' : 'text-white/40'}`}>
                        {month} {day}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Bottom arrow indicator */}
          {canScrollDown && (
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex justify-center z-10">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Event display (anchored to right) */}
      <div className="flex-shrink-0 w-[500px]">
        <AnimatePresence mode="wait">
          {selectedDate.isMock ? (
            <motion.div
              key="mock"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 p-10 text-center"
            >
              <p className="text-white/70 mb-5 text-lg">More Events coming soon...</p>
              <a 
                href={discordUrl}
                className="inline-flex items-center px-6 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-all duration-200 font-medium text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join our Discord
              </a>
            </motion.div>
          ) : selectedDate.event ? (
            <motion.div
              key={selectedDate.event.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
              className="relative"
            >
              <a 
                href={selectedDate.event.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 cursor-pointer border border-white/20 hover:border-white/40 group"
              >
                <div className="relative w-full aspect-[16/10] bg-black/40 overflow-hidden">
                  <Image
                    src={selectedDate.event.cover_url}
                    alt={selectedDate.event.name}
                    fill
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    sizes="500px"
                    quality={90}
                  />
                </div>
                
                <div className="px-6 py-5">
                  <h3 className="text-base md:text-lg font-medium text-white leading-snug">
                    {selectedDate.event.name}
                  </h3>
                </div>
              </a>

              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: -15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute top-full left-0 right-0 -mt-3 bg-white/5 backdrop-blur-sm rounded-b-xl border border-t-0 border-white/20 pt-5 pb-5 px-6 z-50"
                  >
                    <div className="space-y-3 text-white">
                      <div className="flex items-center gap-3 text-sm">
                        <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-white/90">45 attending</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-white/90">Toronto, ON</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-white/90">5:00 PM - 9:00 PM EST</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

