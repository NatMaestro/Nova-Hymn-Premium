// Helper functions to transform API responses to frontend-friendly format
import { HymnDetailResponse, HymnListResponse, Hymn } from "@/types";

/**
 * Transform API hymn list response to frontend Hymn format
 */
export const transformHymnList = (apiHymn: HymnListResponse): Hymn => {
  return {
    id: apiHymn.id,
    number: apiHymn.number,
    title: apiHymn.title,
    slug: apiHymn.slug,
    author: apiHymn.author,
    author_name: apiHymn.author_name,
    category: apiHymn.category,
    category_name: apiHymn.category_name,
    language: apiHymn.language,
    is_premium: apiHymn.is_premium,
    is_featured: apiHymn.is_featured,
    view_count: apiHymn.view_count,
    verses: [], // Will be populated in detail view
  };
};

/**
 * Transform API hymn detail response to frontend Hymn format
 */
export const transformHymnDetail = (apiHymn: HymnDetailResponse): Hymn => {
  return {
    id: apiHymn.id,
    number: apiHymn.number,
    title: apiHymn.title,
    slug: apiHymn.slug,
    author: apiHymn.author,
    author_name: apiHymn.author_name,
    author_biography: apiHymn.author_biography || undefined,
    category: apiHymn.category,
    category_name: apiHymn.category_name,
    language: apiHymn.language,
    verses: apiHymn.verses,
    sheetMusicUrl: apiHymn.sheet_music_url || undefined,
    audioUrls: apiHymn.audio_urls || undefined,
    scriptureReferences: apiHymn.scripture_references || [],
    history: apiHymn.history || undefined,
    meter: apiHymn.meter || undefined,
    key_signature: apiHymn.key_signature || undefined,
    time_signature: apiHymn.time_signature || undefined,
    is_premium: apiHymn.is_premium,
    is_featured: apiHymn.is_featured,
    view_count: apiHymn.view_count,
  };
};

