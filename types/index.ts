// types/index.ts

// Backend API Response Types
export interface HymnListResponse {
  id: number;
  number: number;
  title: string;
  slug: string;
  category: number;
  category_name: string;
  author: number;
  author_name: string;
  language: string;
  is_premium: boolean;
  is_featured: boolean;
  view_count: number;
  created_at: string;
}

export interface HymnDetailResponse extends HymnListResponse {
  verses: Verse[];
  scripture_references: string[];
  history: string | null;
  meter: string | null;
  key_signature: string | null;
  time_signature: string | null;
  sheet_music_url: string | null;
  sheet_music_thumbnail: string | null;
  audio_urls: {
    piano?: string;
    soprano?: string;
    alto?: string;
    tenor?: string;
    bass?: string;
    full?: string;
  } | null;
  author_biography: string | null;
  updated_at: string;
}

// Frontend-friendly Hymn interface (transformed from API)
export interface Hymn {
  id: number;
  number: number;
  title: string;
  slug?: string;
  author: number | string; // Can be ID or name
  author_name?: string;
  author_biography?: string;
  language: string;
  category: number | string; // Can be ID or name
  category_name?: string;
  verses?: Verse[];
  // Support both camelCase (frontend) and snake_case (backend) for sheet music
  sheetMusicUrl?: string | null;
  sheet_music_url?: string | null;
  sheet_music_thumbnail?: string | null;
  // Support both camelCase (frontend) and snake_case (backend) for audio
  audioUrls?: {
    piano?: string;
    soprano?: string;
    alto?: string;
    tenor?: string;
    bass?: string;
    full?: string;
  } | null;
  audio_urls?: {
    piano?: string;
    soprano?: string;
    alto?: string;
    tenor?: string;
    bass?: string;
    full?: string;
  } | null;
  // Support both camelCase (frontend) and snake_case (backend) for scripture references
  scriptureReferences?: string[];
  scripture_references?: string[];
  history?: string | null;
  meter?: string | null;
  key_signature?: string | null;
  time_signature?: string | null;
  is_premium?: boolean;
  is_featured?: boolean;
  view_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Verse {
  id?: number;
  verse_number: number;
  is_chorus: boolean;
  text: string;
  order?: number;
}

export interface Category {
  id: number | string;
  name: string;
  slug?: string;
  description?: string;
  hymn_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Author {
  id: number;
  name: string;
  slug?: string;
  biography?: string;
  birth_year?: number;
  death_year?: number;
  hymn_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SheetMusic {
  id: number;
  hymnId?: number;
  hymn_id?: number; // Backend format
  hymn_title?: string;
  hymn_number?: number;
  title: string;
  composer?: string;
  url: string;
  file_url?: string;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  page_count?: number;
  is_premium?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AudioFile {
  id: number;
  hymn: number;
  hymn_id?: number; // Backend format
  hymn_title?: string;
  hymn_number?: number;
  audio_type: 'piano' | 'soprano' | 'alto' | 'tenor' | 'bass' | 'full';
  audio_type_display?: string;
  file_url: string;
  duration?: number;
  bitrate?: number;
  is_premium?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Playlist {
  id: string;
  name: string;
  hymns: Hymn[];
  createdAt: string;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Denomination types
export interface Denomination {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  hymn_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DenominationHymn {
  id: number;
  hymn: number;
  hymn_title: string;
  denomination: number;
  denomination_name: string;
  number: number;
  hymn_period?: "new" | "old";
  verses?: Verse[];
  created_at?: string;
  updated_at?: string;
}
