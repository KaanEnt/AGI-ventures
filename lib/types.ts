export interface Event {
  id: string;
  name: string;
  start_at: string;
  cover_url: string;
  url?: string;
}

export interface EventsTimelineProps {
  events: Event[];
  pastEvents?: Event[];
  discordUrl?: string;
}

