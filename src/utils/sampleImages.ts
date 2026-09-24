export interface SamplePhoto {
  id: string;
  name: string;
  url: string;
}

export const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    id: 'balloons',
    name: 'Hot Air Balloons',
    url: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'puppy',
    name: 'Golden Puppy',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sunset',
    name: 'Mountain Sunset',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  },
];
