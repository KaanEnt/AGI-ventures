# Events Timeline Component

A beautiful vertical timeline component for displaying upcoming events, designed to work with Luma events.

## Features

- 📅 **Date Formatting**: Displays dates in "Month - dd - Weekday" format
- 🎨 **Beautiful Design**: Rounded corners, shadows, hover effects
- 📱 **Responsive**: Works great on all device sizes
- 🔗 **Luma Integration**: Ready to connect to Luma API
- ⚡ **Performance**: Optimized images with Next.js Image component
- 🎯 **Future Events Only**: Automatically filters past events

## Usage

### Basic Usage with Mock Data

```tsx
import EventsTimeline from '@/components/EventsTimeline';
import { mockEvents } from '@/lib/mockData';

export default function Home() {
  return (
    <EventsTimeline 
      events={mockEvents} 
      discordUrl="https://discord.gg/your-server" 
    />
  );
}
```

### Integration with Luma API

1. **Get Luma Plus Subscription**: You need an active Luma Plus subscription to use the API
2. **Get API Key**: 
   - Go to your Luma calendar
   - Navigate to Settings → Options
   - Find the API Keys section and copy your key
3. **Set Environment Variable**:
   ```bash
   LUMA_API_KEY=your_api_key_here
   ```
4. **Use Real Data**:
   ```tsx
   import { fetchLumaEvents } from '@/lib/lumaApi';
   
   export default async function Home() {
     const events = await fetchLumaEvents('your-calendar-id');
     
     return (
       <EventsTimeline 
         events={events.length > 0 ? events : mockEvents} 
         discordUrl="https://discord.gg/your-server" 
       />
     );
   }
   ```

## Component Structure

- **Date Display**: Above each event container
- **Event Image**: Square images converted to rectangular containers (aspect ratio maintained)
- **Event Name**: Below the image in clean typography
- **Timeline Line**: Vertical gradient line connecting all events
- **Timeline Dots**: Circular indicators with glow effects
- **Footer**: "More Events coming soon" message with Discord link

## Styling

The component uses Tailwind CSS with:
- Rounded corners (`rounded-2xl`)
- Subtle shadows and hover effects
- Gradient timeline line
- Responsive design patterns
- Clean typography hierarchy

## Integration into Existing Pages

Since this component is designed to be integrated into existing pages:

1. **Remove the background**: The component has minimal background styling
2. **No navbar/hero**: Focus purely on the timeline functionality
3. **Easy to embed**: Just import and use the `<EventsTimeline />` component
4. **Customizable**: Pass your own Discord URL and events data

## Example Event Data Structure

```tsx
interface Event {
  id: string;
  name: string;
  start_at: string; // ISO 8601 date string
  cover_url: string;
  url?: string;
}
```
