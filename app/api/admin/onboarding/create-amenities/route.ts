import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Smart standard images mapping - High-quality Pexels images for all amenity types (WORKING IN PRODUCTION)
// NOTE: Order matters! More specific keywords FIRST (e.g., "badminton" before "court")
// PROTECTED (DO NOT CHANGE): Swimming Pool, Gym, Community Clubhouse, Tennis Court - these are PERFECT
const standardImages: Record<string, string> = {
  // Swimming & Water Activities - High Quality Pexels (PROTECTED - PERFECT)
  "swimming pool": "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1200",
  swimming: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1200",
  pool: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1200",
  swim: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1200",
  jacuzzi: "https://images.pexels.com/photos/221457/pexels-photo-221457.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "hot tub": "https://images.pexels.com/photos/221457/pexels-photo-221457.jpeg?auto=compress&cs=tinysrgb&w=1200",
  spa: "https://images.pexels.com/photos/3757946/pexels-photo-3757946.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // Fitness & Sports - High Quality Pexels (Tennis Court PROTECTED - PERFECT)
  "badminton court": "https://images.pexels.com/photos/3660204/pexels-photo-3660204.jpeg?auto=compress&cs=tinysrgb&w=1200",
  badminton: "https://images.pexels.com/photos/3660204/pexels-photo-3660204.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "tennis court": "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=1200",
  tennis: "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "basketball court": "https://images.pexels.com/photos/1080875/pexels-photo-1080875.jpeg?auto=compress&cs=tinysrgb&w=1200",
  basketball: "https://images.pexels.com/photos/1080875/pexels-photo-1080875.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "volleyball court": "https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg?auto=compress&cs=tinysrgb&w=1200",
  volleyball: "https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "squash court": "https://images.pexels.com/photos/6253913/pexels-photo-6253913.jpeg?auto=compress&cs=tinysrgb&w=1200",
  squash: "https://images.pexels.com/photos/6253913/pexels-photo-6253913.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "cricket pitch": "https://images.pexels.com/photos/1510960/pexels-photo-1510960.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "cricket ground": "https://images.pexels.com/photos/1510960/pexels-photo-1510960.jpeg?auto=compress&cs=tinysrgb&w=1200",
  cricket: "https://images.pexels.com/photos/1510960/pexels-photo-1510960.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "football field": "https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=1200",
  football: "https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "soccer field": "https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=1200",
  soccer: "https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "fitness center": "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200",
  gym: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200",
  fitness: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200",
  workout: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200",
  court: "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=1200", // Generic fallback for any court
  
  // Community Spaces - High Quality Pexels (Community Clubhouse PROTECTED - PERFECT)
  "community clubhouse": "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "community center": "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1200",
  clubhouse: "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1200",
  club: "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "banquet hall": "https://images.pexels.com/photos/1395964/pexels-photo-1395964.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "party hall": "https://images.pexels.com/photos/1395964/pexels-photo-1395964.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "event hall": "https://images.pexels.com/photos/1395964/pexels-photo-1395964.jpeg?auto=compress&cs=tinysrgb&w=1200",
  hall: "https://images.pexels.com/photos/1395964/pexels-photo-1395964.jpeg?auto=compress&cs=tinysrgb&w=1200",
  community: "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "meeting room": "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1200",
  meeting: "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1200",
  event: "https://images.pexels.com/photos/1395964/pexels-photo-1395964.jpeg?auto=compress&cs=tinysrgb&w=1200",
  banquet: "https://images.pexels.com/photos/1395964/pexels-photo-1395964.jpeg?auto=compress&cs=tinysrgb&w=1200",
  party: "https://images.pexels.com/photos/1395964/pexels-photo-1395964.jpeg?auto=compress&cs=tinysrgb&w=1200",
  multipurpose: "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // Children & Family - High Quality Pexels
  playground: "https://images.pexels.com/photos/1210489/pexels-photo-1210489.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "play area": "https://images.pexels.com/photos/1210489/pexels-photo-1210489.jpeg?auto=compress&cs=tinysrgb&w=1200",
  kids: "https://images.pexels.com/photos/1210489/pexels-photo-1210489.jpeg?auto=compress&cs=tinysrgb&w=1200",
  children: "https://images.pexels.com/photos/1210489/pexels-photo-1210489.jpeg?auto=compress&cs=tinysrgb&w=1200",
  play: "https://images.pexels.com/photos/1210489/pexels-photo-1210489.jpeg?auto=compress&cs=tinysrgb&w=1200",
  daycare: "https://images.pexels.com/photos/8612990/pexels-photo-8612990.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // Outdoor & Nature - High Quality Pexels
  park: "https://images.pexels.com/photos/2152/sky-earth-space-working.jpg?auto=compress&cs=tinysrgb&w=1200",
  garden: "https://images.pexels.com/photos/2132227/pexels-photo-2132227.jpeg?auto=compress&cs=tinysrgb&w=1200",
  lawn: "https://images.pexels.com/photos/2132227/pexels-photo-2132227.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "walking track": "https://images.pexels.com/photos/2310/road-path-walking-track.jpg?auto=compress&cs=tinysrgb&w=1200",
  walking: "https://images.pexels.com/photos/2310/road-path-walking-track.jpg?auto=compress&cs=tinysrgb&w=1200",
  "jogging track": "https://images.pexels.com/photos/2310/road-path-walking-track.jpg?auto=compress&cs=tinysrgb&w=1200",
  jogging: "https://images.pexels.com/photos/2310/road-path-walking-track.jpg?auto=compress&cs=tinysrgb&w=1200",
  trail: "https://images.pexels.com/photos/2310/road-path-walking-track.jpg?auto=compress&cs=tinysrgb&w=1200",
  "bbq area": "https://images.pexels.com/photos/1105325/pexels-photo-1105325.jpeg?auto=compress&cs=tinysrgb&w=1200",
  bbq: "https://images.pexels.com/photos/1105325/pexels-photo-1105325.jpeg?auto=compress&cs=tinysrgb&w=1200",
  barbecue: "https://images.pexels.com/photos/1105325/pexels-photo-1105325.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "picnic area": "https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?auto=compress&cs=tinysrgb&w=1200",
  picnic: "https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // Parking & Transportation - High Quality Pexels
  "parking lot": "https://images.pexels.com/photos/63294/autos-taxis-park-parking-63294.jpeg?auto=compress&cs=tinysrgb&w=1200",
  parking: "https://images.pexels.com/photos/63294/autos-taxis-park-parking-63294.jpeg?auto=compress&cs=tinysrgb&w=1200",
  garage: "https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=1200",
  car: "https://images.pexels.com/photos/63294/autos-taxis-park-parking-63294.jpeg?auto=compress&cs=tinysrgb&w=1200",
  vehicle: "https://images.pexels.com/photos/63294/autos-taxis-park-parking-63294.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // Security & Safety - High Quality Pexels
  security: "https://images.pexels.com/photos/430208/pexels-photo-430208.jpeg?auto=compress&cs=tinysrgb&w=1200",
  gate: "https://images.pexels.com/photos/277593/pexels-photo-277593.jpeg?auto=compress&cs=tinysrgb&w=1200",
  entrance: "https://images.pexels.com/photos/277593/pexels-photo-277593.jpeg?auto=compress&cs=tinysrgb&w=1200",
  guard: "https://images.pexels.com/photos/430208/pexels-photo-430208.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // Learning & Study - High Quality Pexels
  library: "https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg?auto=compress&cs=tinysrgb&w=1200",
  study: "https://images.pexels.com/photos/159844/cellular-education-classroom-159844.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "study room": "https://images.pexels.com/photos/159844/cellular-education-classroom-159844.jpeg?auto=compress&cs=tinysrgb&w=1200",
  reading: "https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "reading room": "https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg?auto=compress&cs=tinysrgb&w=1200",
  books: "https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg?auto=compress&cs=tinysrgb&w=1200",
  classroom: "https://images.pexels.com/photos/159844/cellular-education-classroom-159844.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "computer lab": "https://images.pexels.com/photos/1181622/pexels-photo-1181622.jpeg?auto=compress&cs=tinysrgb&w=1200",
  computer: "https://images.pexels.com/photos/1181622/pexels-photo-1181622.jpeg?auto=compress&cs=tinysrgb&w=1200",
  internet: "https://images.pexels.com/photos/1181622/pexels-photo-1181622.jpeg?auto=compress&cs=tinysrgb&w=1200",
  lab: "https://images.pexels.com/photos/1181622/pexels-photo-1181622.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // Wellness & Meditation - High Quality Pexels
  "massage room": "https://images.pexels.com/photos/3865792/pexels-photo-3865792.jpeg?auto=compress&cs=tinysrgb&w=1200",
  massage: "https://images.pexels.com/photos/3865792/pexels-photo-3865792.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "sauna room": "https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=1200",
  sauna: "https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "steam room": "https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=1200",
  steam: "https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "yoga studio": "https://images.pexels.com/photos/3822621/pexels-photo-3822621.jpeg?auto=compress&cs=tinysrgb&w=1200",
  yoga: "https://images.pexels.com/photos/3822621/pexels-photo-3822621.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "meditation room": "https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&cs=tinysrgb&w=1200",
  meditation: "https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&cs=tinysrgb&w=1200",
  wellness: "https://images.pexels.com/photos/3865792/pexels-photo-3865792.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // Entertainment & Recreation - High Quality Pexels
  "movie theater": "https://images.pexels.com/photos/109669/pexels-photo-109669.jpeg?auto=compress&cs=tinysrgb&w=1200",
  cinema: "https://images.pexels.com/photos/109669/pexels-photo-109669.jpeg?auto=compress&cs=tinysrgb&w=1200",
  theater: "https://images.pexels.com/photos/109669/pexels-photo-109669.jpeg?auto=compress&cs=tinysrgb&w=1200",
  theatre: "https://images.pexels.com/photos/109669/pexels-photo-109669.jpeg?auto=compress&cs=tinysrgb&w=1200",
  movie: "https://images.pexels.com/photos/109669/pexels-photo-109669.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "game room": "https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "games room": "https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=1200",
  games: "https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=1200",
  gaming: "https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=1200",
  arcade: "https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "billiards table": "https://images.pexels.com/photos/3049121/pexels-photo-3049121.jpeg?auto=compress&cs=tinysrgb&w=1200",
  billiards: "https://images.pexels.com/photos/3049121/pexels-photo-3049121.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "pool table": "https://images.pexels.com/photos/3049121/pexels-photo-3049121.jpeg?auto=compress&cs=tinysrgb&w=1200",
  pool_table: "https://images.pexels.com/photos/3049121/pexels-photo-3049121.jpeg?auto=compress&cs=tinysrgb&w=1200",
  snooker: "https://images.pexels.com/photos/3049121/pexels-photo-3049121.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "chess room": "https://images.pexels.com/photos/1040157/pexels-photo-1040157.jpeg?auto=compress&cs=tinysrgb&w=1200",
  chess: "https://images.pexels.com/photos/1040157/pexels-photo-1040157.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "table tennis": "https://images.pexels.com/photos/1432039/pexels-photo-1432039.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "ping pong": "https://images.pexels.com/photos/1432039/pexels-photo-1432039.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // Business & Work - High Quality Pexels
  "business center": "https://images.pexels.com/photos/380768/pexels-photo-380768.jpeg?auto=compress&cs=tinysrgb&w=1200",
  office: "https://images.pexels.com/photos/380768/pexels-photo-380768.jpeg?auto=compress&cs=tinysrgb&w=1200",
  workspace: "https://images.pexels.com/photos/380768/pexels-photo-380768.jpeg?auto=compress&cs=tinysrgb&w=1200",
  coworking: "https://images.pexels.com/photos/380768/pexels-photo-380768.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "conference room": "https://images.pexels.com/photos/260931/pexels-photo-260931.jpeg?auto=compress&cs=tinysrgb&w=1200",
  conference: "https://images.pexels.com/photos/260931/pexels-photo-260931.jpeg?auto=compress&cs=tinysrgb&w=1200",
  boardroom: "https://images.pexels.com/photos/260931/pexels-photo-260931.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // Food & Dining - High Quality Pexels
  restaurant: "https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "dining hall": "https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1200",
  dining: "https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1200",
  cafe: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "coffee shop": "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=1200",
  coffee: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=1200",
  kitchen: "https://images.pexels.com/photos/1599791/pexels-photo-1599791.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "community kitchen": "https://images.pexels.com/photos/1599791/pexels-photo-1599791.jpeg?auto=compress&cs=tinysrgb&w=1200",
  food: "https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // Special Facilities - High Quality Pexels
  "laundry room": "https://images.pexels.com/photos/3746839/pexels-photo-3746839.jpeg?auto=compress&cs=tinysrgb&w=1200",
  laundry: "https://images.pexels.com/photos/3746839/pexels-photo-3746839.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "medical center": "https://images.pexels.com/photos/127873/pexels-photo-127873.jpeg?auto=compress&cs=tinysrgb&w=1200",
  medical: "https://images.pexels.com/photos/127873/pexels-photo-127873.jpeg?auto=compress&cs=tinysrgb&w=1200",
  clinic: "https://images.pexels.com/photos/127873/pexels-photo-127873.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "beauty salon": "https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=1200",
  salon: "https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=1200",
  beauty: "https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "barber shop": "https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?auto=compress&cs=tinysrgb&w=1200",
  barber: "https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // Music & Arts - High Quality Pexels
  "music room": "https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=1200",
  music: "https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "dance studio": "https://images.pexels.com/photos/3723635/pexels-photo-3723635.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "dance room": "https://images.pexels.com/photos/3723635/pexels-photo-3723635.jpeg?auto=compress&cs=tinysrgb&w=1200",
  dance: "https://images.pexels.com/photos/3723635/pexels-photo-3723635.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "art studio": "https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "art room": "https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=1200",
  art: "https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=1200",
  studio: "https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // Pet Facilities - High Quality Pexels
  "pet park": "https://images.pexels.com/photos/58997/pexels-photo-58997.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "dog park": "https://images.pexels.com/photos/58997/pexels-photo-58997.jpeg?auto=compress&cs=tinysrgb&w=1200",
  pet: "https://images.pexels.com/photos/58997/pexels-photo-58997.jpeg?auto=compress&cs=tinysrgb&w=1200",
  dog: "https://images.pexels.com/photos/58997/pexels-photo-58997.jpeg?auto=compress&cs=tinysrgb&w=1200",
  animal: "https://images.pexels.com/photos/58997/pexels-photo-58997.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // Default fallback - Modern community (USING CLUBHOUSE - PROTECTED)
  default: "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1200",
};

function getSmartImage(amenityName: string, providedUrl?: string): string {
  // If user provided an image URL, use it
  if (providedUrl && providedUrl.trim() !== '') {
    return providedUrl;
  }

  // Convert name to lowercase and remove extra spaces for robust matching
  const normalizedName = amenityName.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Sort keywords by length (longest first) to match "badminton court" before "court"
  const sortedKeywords = Object.keys(standardImages)
    .filter(k => k !== 'default')
    .sort((a, b) => b.length - a.length);
  
  // Check for keyword matches - handles variations like "Badminton", "badminton court", "BADMINTON COURT"
  for (const keyword of sortedKeywords) {
    if (normalizedName.includes(keyword)) {
      console.log(`✅ Image matched: "${amenityName}" → keyword: "${keyword}"`);
      return standardImages[keyword];
    }
  }
  
  // Return default image if no keywords match
  console.log(`⚠️ No keyword match for "${amenityName}", using default image`);
  return standardImages.default;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { communityId, amenities } = await request.json();

    if (!communityId || !amenities || !Array.isArray(amenities)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the user belongs to this community
    if (session.user.communityId !== communityId) {
      return NextResponse.json(
        { error: 'Unauthorized - Community mismatch' },
        { status: 401 }
      );
    }

    // Validate amenities
    for (const amenity of amenities) {
      if (!amenity.name || !amenity.description) {
        return NextResponse.json(
          { error: 'Each amenity must have a name and description' },
          { status: 400 }
        );
      }
      
      // Validate booking rules
      if (amenity.maxPeople && (amenity.maxPeople < 1 || amenity.maxPeople > 100)) {
        return NextResponse.json(
          { error: 'Max people must be between 1 and 100' },
          { status: 400 }
        );
      }
      
      if (amenity.slotDuration && (amenity.slotDuration < 0.5 || amenity.slotDuration > 8)) {
        return NextResponse.json(
          { error: 'Slot duration must be between 0.5 and 8 hours' },
          { status: 400 }
        );
      }
    }

    // Create amenities with smart image assignment
    const createdAmenities = [];
    
    console.log('Creating amenities for community:', communityId);
    console.log('Amenities to create:', amenities);
    
    for (const amenity of amenities) {
      const amenityData = {
        name: amenity.name.trim(),
        description: amenity.description.trim(),
        imageUrl: getSmartImage(amenity.name, amenity.imageUrl),
        communityId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        rules: {
          maxSlotsPerFamily: amenity.maxPeople || 2,
          blackoutDates: [],
        },
        booking: {
          maxPeople: amenity.maxPeople || 6,
          slotDuration: amenity.slotDuration || 2,
          weekdayHours: {
            startTime: amenity.weekdayStartTime || '09:00',
            endTime: amenity.weekdayEndTime || '21:00',
          },
          weekendHours: {
            startTime: amenity.weekendStartTime || '08:00',
            endTime: amenity.weekendEndTime || '22:00',
          },
        },
      };

      console.log('Creating amenity document:', amenityData);
      
      const docRef = await addDoc(collection(db, 'amenities'), amenityData);
      console.log('Created amenity with ID:', docRef.id);
      
      createdAmenities.push({
        id: docRef.id,
        ...amenityData,
      });
    }

    console.log('All amenities created successfully:', createdAmenities);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdAmenities.length} amenities`,
      amenities: createdAmenities,
    });
  } catch (error) {
    console.error('Error creating amenities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}