/**
 * Shared Type Definitions
 * Centralized types for better type safety across the application
 */

export interface Hotspot {
  id: string;
  pitch: number;
  yaw: number;
  type: 'navigate' | 'info';
  label: string;
  targetSceneIndex?: number;
  sceneIndex?: number; // which scene this hotspot belongs to (defaults to 0)
  info?: string;
}

// Strapi API Response Types
export interface StrapiImageAttribute {
  id: number;
  name: string;
  alternativeText?: string;
  caption?: string;
  width: number;
  height: number;
  formats?: {
    small?: { url: string };
    medium?: { url: string };
    large?: { url: string };
    thumbnail?: { url: string };
  };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl?: string | null;
  provider: string;
  provider_metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface StrapiComponentRichText {
  type: string;
  children?: Array<{
    text: string;
    type?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  }>;
}

export interface StrapiBlocksContent {
  type: string;
  children?: Array<{
    text: string;
    type?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  }>;
}

export interface StrapiMeta {
  pagination?: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}

export interface StrapiResponse<T> {
  data: T extends (infer U)[] ? T : T;
  meta?: StrapiMeta;
}

// Attraction Types
export interface AttractionAttribute {
  name: string;
  description: string;
  location: string;
  category?: string;
  rating?: number;
  images?: StrapiImageAttribute[];
  photos?: StrapiImageAttribute[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface Attraction {
  id: string | number;
  attributes: AttractionAttribute;
  type?: 'heritage' | 'spot' | 'attraction';
}

// Heritage Site Types
export interface HeritageSiteAttribute {
  name: string;
  description: string;
  historicalSignificance?: string;
  yearBuilt?: number;
  location: string;
  rating?: number;
  images?: StrapiImageAttribute[];
  google_place_id?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  has_virtual_tour?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface HeritageSite {
  id: number | string;
  attributes: HeritageSiteAttribute;
}

// Tourist Spot Types
export interface TouristSpotAttribute {
  name: string;
  description: string;
  location: string;
  category?: string;
  rating?: number;
  images?: StrapiImageAttribute[];
  google_place_id?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  has_virtual_tour?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface TouristSpot {
  id: number | string;
  attributes: TouristSpotAttribute;
}

// Dining & Food Types
export interface DiningPlaceAttribute {
  name: string;
  description: string;
  location: string;
  cuisine?: string;
  priceRange?: string;
  rating?: number;
  images?: StrapiImageAttribute[];
  google_place_id?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  has_virtual_tour?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface DiningPlace {
  id: number | string;
  attributes: DiningPlaceAttribute;
}

// Event Types
export interface EventAttribute {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  category?: string;
  images?: StrapiImageAttribute[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface Event {
  id: number | string;
  attributes: EventAttribute;
}

// FAQ Types
export interface FAQAttribute {
  question: string;
  answer: string;
  category?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface FAQ {
  id: number | string;
  attributes: FAQAttribute;
}

// Itinerary Types
export interface ItineraryAttribute {
  title: string;
  description: string;
  duration: number; // in hours or days
  difficulty?: 'easy' | 'moderate' | 'hard';
  price?: number;
  groupSize?: number;
  highlights?: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface Itinerary {
  id: number | string;
  attributes: ItineraryAttribute;
}

// Rating/Review Types
export interface Rating {
  id: string;
  author: string;
  rating: number; // 1-5
  comment?: string;
  date?: string;
  verified?: boolean;
  email?: string;
}

export interface RatingSubmission {
  itemId: string;
  itemName: string;
  author: string;
  email: string;
  rating: number;
  comment?: string;
}

// Search Result Types
export interface SearchResult {
  objectID: string;
  name: string;
  description: string;
  type: 'heritage' | 'spot' | 'faq' | 'event' | 'itinerary' | 'attraction';
  category?: string;
  location?: string;
  rating?: number;
  url?: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'assistant';
  text: string;
  timestamp: Date;
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
  timestamp: Date;
}

export interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  avgSessionTime: string;
  bounceRate: string;
  topPages?: Array<{
    path: string;
    views: number;
  }>;
  referrers?: Array<{
    source: string;
    count: number;
  }>;
  deviceBreakdown?: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

// Form Submission Types
export interface FormSubmission {
  name: string;
  email: string;
  message: string;
  category?: string;
  subject?: string;
}

export interface NewsletterSubscription {
  email: string;
  subscribedAt: Date;
  verified: boolean;
}

// Error Types
export interface APIError {
  status: number;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Utility Types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Async<T> = Promise<T>;
export type AsyncResult<T> = Promise<T | null>;

// Async State Type
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}
