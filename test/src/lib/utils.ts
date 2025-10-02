export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const day = date.getDate().toString().padStart(2, '0');
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  
  return `${month} - ${day} - ${weekday}`;
}

export function cn(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}
