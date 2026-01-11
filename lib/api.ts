// API service with mock data support
import axios, { AxiosInstance, AxiosError } from "axios";
import { USE_MOCK_DATA, API_CONFIG } from "./config";
import {
  mockHymns,
  mockCategories,
  mockAuthors,
  mockSheetMusic,
  getDailyHymn as getDailyHymnFromMock,
  delay,
} from "./mockData";
import { Hymn, Category, Author, SheetMusic } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token if available
api.interceptors.request.use(
  async (config) => {
    // Get token from AsyncStorage
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // AsyncStorage not available or error reading token
      console.warn("Could not get auth token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("auth_refresh_token");

        if (refreshToken) {
          // Try to refresh the token
          const response = await axios.post(
            `${API_CONFIG.BASE_URL}/auth/refresh/`,
            { refresh: refreshToken }
          );

          const { access } = response.data;
          await AsyncStorage.setItem("auth_token", access);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        try {
          await AsyncStorage.removeItem("auth_token");
          await AsyncStorage.removeItem("auth_refresh_token");
          await AsyncStorage.removeItem("user_data");
        } catch (e) {
          // Ignore storage errors
        }
        
        // You might want to trigger a logout event here
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors with better messages
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
      const errorInfo = {
        url: error.config?.url,
        baseURL: error.config?.baseURL || API_CONFIG.BASE_URL,
        message: 'Cannot connect to backend. Is the server running?',
        useMockData: USE_MOCK_DATA,
      };
      
      console.error('🌐 Network Error:', errorInfo);
      
      // If using real API but can't connect, provide troubleshooting tips
      if (!USE_MOCK_DATA) {
        console.warn('💡 Troubleshooting Network Error:');
        console.warn('   1. ✅ Backend must run on: python manage.py runserver 0.0.0.0:8000');
        console.warn('   2. ✅ For Android: Create .env with EXPO_PUBLIC_DEV_API_URL=http://YOUR_IP:8000/api/v1');
        console.warn('   3. ✅ Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)');
        console.warn('   4. ✅ Check firewall: Temporarily disable to test');
        console.warn('   5. ✅ Test backend: curl http://localhost:8000/api/v1/');
        console.warn('   6. ⚠️  Or use mock data: Set EXPO_PUBLIC_USE_MOCK_DATA=true in .env');
        console.warn('');
        console.warn('   Current API URL:', API_CONFIG.BASE_URL);
        console.warn('   If using Android emulator and 10.0.2.2 doesn\'t work,');
        console.warn('   use your computer\'s IP address instead!');
      }
    } else {
      // Log HTTP errors with response details
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      const responseData = error.response?.data;
      const requestUrl = error.config?.url;
      const requestParams = error.config?.params;
      
      // Suppress 404 errors for daily hymn endpoint (expected when no hymns exist)
      if (status === 404 && requestUrl?.includes('/hymns/daily/')) {
        // Silently handle - this is expected when database is empty
        return Promise.reject(error);
      }
      
      console.error(`❌ HTTP ${status} ${statusText}:`, {
        url: requestUrl,
        params: requestParams,
        response: responseData,
      });
      
      // Provide specific guidance for 400 errors
      if (status === 400) {
        console.warn('💡 Bad Request (400) - Possible causes:');
        console.warn('   • Invalid query parameters');
        console.warn('   • Missing required parameters');
        console.warn('   • Parameter type mismatch (e.g., string vs number)');
        console.warn('   • Backend validation failed');
        console.warn('');
        console.warn('   Response details:', JSON.stringify(responseData, null, 2));
      }
    }

    return Promise.reject(error);
  }
);

// Response types matching backend structure
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface HymnListResponse {
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

interface HymnDetailResponse extends HymnListResponse {
  verses: Array<{
    id: number;
    verse_number: number;
    is_chorus: boolean;
    text: string;
    order: number;
  }>;
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

// Mock API functions
const mockApi = {
  async getHymns(params?: {
    category?: string;
    author?: string;
    language?: string;
    search?: string;
    page?: number;
    denomination?: number;
    hymn_period?: "new" | "old";
  }): Promise<PaginatedResponse<HymnListResponse>> {
    await delay(500); // Simulate network delay

    let filtered = [...mockHymns];

    // Apply filters
    if (params?.category) {
      const categoryId = mockCategories.find(
        (c) => c.id.toString() === params.category || c.slug === params.category
      )?.id;
      if (categoryId) {
        filtered = filtered.filter((h) => h.category === categoryId);
      }
    }

    if (params?.author) {
      const authorId = mockAuthors.find(
        (a) => a.id.toString() === params.author || a.slug === params.author
      )?.id;
      if (authorId) {
        filtered = filtered.filter((h) => h.author === authorId);
      }
    }

    if (params?.language) {
      filtered = filtered.filter((h) => h.language === params.language);
    }

    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(
        (h) =>
          h.title.toLowerCase().includes(searchLower) ||
          h.number.toString().includes(searchLower)
      );
    }

    // Transform to API response format
    const results: HymnListResponse[] = filtered.map((hymn) => {
      let categoryId: number;
      if (typeof hymn.category === 'number') {
        categoryId = hymn.category;
      } else {
        const foundCategory = mockCategories.find(c => c.name === hymn.category);
        const catId = foundCategory?.id;
        categoryId = typeof catId === 'number' ? catId : (typeof catId === 'string' ? parseInt(catId, 10) || 0 : 0);
      }
      
      let authorId: number;
      if (typeof hymn.author === 'number') {
        authorId = hymn.author;
      } else {
        const foundAuthor = mockAuthors.find(a => a.name === hymn.author);
        const authId = foundAuthor?.id;
        authorId = typeof authId === 'number' ? authId : 0;
      }
      
      return {
        id: hymn.id,
        number: hymn.number,
        title: hymn.title,
        slug: hymn.slug || `${hymn.number}-${hymn.title.toLowerCase().replace(/\s+/g, '-')}`,
        category: categoryId,
        category_name: mockCategories.find((c) => c.id === categoryId)?.name || "",
        author: authorId,
        author_name: mockAuthors.find((a) => a.id === authorId)?.name || "",
        language: hymn.language,
        is_premium: hymn.is_premium ?? false,
        is_featured: hymn.is_featured ?? false,
        view_count: hymn.view_count ?? 0,
        created_at: hymn.created_at || new Date().toISOString(),
      };
    });

    return {
      count: results.length,
      next: null,
      previous: null,
      results,
    };
  },

  async getHymnById(
    id: number,
    params?: {
      denomination?: number;
      hymn_period?: "new" | "old";
    }
  ): Promise<HymnDetailResponse> {
    await delay(300);
    let hymn = mockHymns.find((h) => h.id === id);
    
    // If hymn not found, try to find by number instead
    if (!hymn) {
      hymn = mockHymns.find((h) => h.number === id);
    }
    
    // If still not found, return the first hymn as a fallback
    if (!hymn) {
      console.warn(`Hymn with id ${id} not found in mock data, using fallback`);
      hymn = mockHymns[0];
      if (!hymn) {
        throw new Error("No hymns available in mock data");
      }
    }

    let categoryId: number;
    if (typeof hymn.category === 'number') {
      categoryId = hymn.category;
    } else {
      const foundCategory = mockCategories.find(c => c.name === hymn.category);
      const catId = foundCategory?.id;
      categoryId = typeof catId === 'number' ? catId : (typeof catId === 'string' ? parseInt(catId, 10) || 0 : 0);
    }
    
    let authorId: number;
    if (typeof hymn.author === 'number') {
      authorId = hymn.author;
    } else {
      const foundAuthor = mockAuthors.find(a => a.name === hymn.author);
      const authId = foundAuthor?.id;
      authorId = typeof authId === 'number' ? authId : 0;
    }
    const category = mockCategories.find((c) => c.id === categoryId);
    const author = mockAuthors.find((a) => a.id === authorId);

    return {
      id: hymn.id,
      number: hymn.number,
      title: hymn.title,
      slug: hymn.slug || `${hymn.number}-${hymn.title.toLowerCase().replace(/\s+/g, '-')}`,
      category: categoryId,
      category_name: category?.name || "",
      author: authorId,
      author_name: author?.name || "",
      author_biography: author?.biography || null,
      language: hymn.language,
      verses: (hymn.verses || []).map((v, idx) => ({
        id: idx + 1,
        verse_number: v.verse_number,
        is_chorus: v.is_chorus,
        text: v.text,
        order: v.order ?? idx + 1,
      })),
      scripture_references: hymn.scripture_references || hymn.scriptureReferences || [],
      history: hymn.history || null,
      meter: hymn.meter || null,
      key_signature: hymn.key_signature || null,
      time_signature: hymn.time_signature || null,
      is_premium: hymn.is_premium ?? false,
      is_featured: hymn.is_featured ?? false,
      view_count: hymn.view_count ?? 0,
      sheet_music_url: hymn.sheetMusicUrl || hymn.sheet_music_url || null,
      sheet_music_thumbnail: hymn.sheet_music_thumbnail || null,
      audio_urls: hymn.audioUrls || hymn.audio_urls || null,
      created_at: hymn.created_at || new Date().toISOString(),
      updated_at: hymn.updated_at || new Date().toISOString(),
    };
  },

  async getCategories(): Promise<Category[]> {
    await delay(200);
    return mockCategories;
  },

  async getAuthors(): Promise<Author[]> {
    await delay(200);
    return mockAuthors;
  },

  async getDenominations(): Promise<any[]> {
    await delay(200);
    return [
      {
        id: 1,
        name: "Catholic",
        slug: "catholic",
        description: "Catholic Church Hymns",
        is_active: true,
        display_order: 1,
        hymn_count: 0,
      },
      {
        id: 2,
        name: "Methodist",
        slug: "methodist",
        description: "Methodist Church Hymns",
        is_active: true,
        display_order: 2,
        hymn_count: 0,
      },
      {
        id: 3,
        name: "Baptist",
        slug: "baptist",
        description: "Baptist Church Hymns",
        is_active: true,
        display_order: 3,
        hymn_count: 0,
      },
    ];
  },

  async getSubscriptionStatus(): Promise<{ has_premium: boolean; subscription: any }> {
    await delay(300);
    return {
      has_premium: false,
      subscription: null,
    };
  },

  async verifySubscription(data: {
    transaction_id: string;
    product_id: string;
    receipt_data: string;
    platform: "ios" | "android";
  }): Promise<any> {
    await delay(500);
    return {
      id: 1,
      status: "active",
      subscription_type: "monthly",
    };
  },

  async getDailyHymn(): Promise<HymnDetailResponse> {
    await delay(300);
    const dailyHymn = getDailyHymnFromMock();
    return this.getHymnById(dailyHymn.id);
  },

  async getFeaturedHymns(): Promise<HymnListResponse[]> {
    await delay(300);
    const featured = mockHymns.filter((h) => h.is_featured);
    return featured.map((hymn) => {
      let categoryId: number;
      if (typeof hymn.category === 'number') {
        categoryId = hymn.category;
      } else {
        const foundCategory = mockCategories.find(c => c.name === hymn.category);
        const catId = foundCategory?.id;
        categoryId = typeof catId === 'number' ? catId : (typeof catId === 'string' ? parseInt(catId, 10) || 0 : 0);
      }
      
      let authorId: number;
      if (typeof hymn.author === 'number') {
        authorId = hymn.author;
      } else {
        const foundAuthor = mockAuthors.find(a => a.name === hymn.author);
        const authId = foundAuthor?.id;
        authorId = typeof authId === 'number' ? authId : 0;
      }
      
      return {
        id: hymn.id,
        number: hymn.number,
        title: hymn.title,
        slug: hymn.slug || `${hymn.number}-${hymn.title.toLowerCase().replace(/\s+/g, '-')}`,
        category: categoryId,
        category_name: mockCategories.find((c) => c.id === categoryId)?.name || "",
        author: authorId,
        author_name: mockAuthors.find((a) => a.id === authorId)?.name || "",
        language: hymn.language,
        is_premium: hymn.is_premium ?? false,
        is_featured: hymn.is_featured ?? false,
        view_count: hymn.view_count ?? 0,
        created_at: hymn.created_at || new Date().toISOString(),
      };
    });
  },

  async getHymnSheetMusic(hymnId: number): Promise<any> {
    await delay(300);
    const sheetMusic = mockSheetMusic.find((sm) => sm.hymnId === hymnId);
    if (!sheetMusic) {
      throw new Error("Sheet music not found");
    }
    return {
      id: sheetMusic.id,
      hymn: hymnId,
      hymn_title: mockHymns.find((h) => h.id === hymnId)?.title || "",
      hymn_number: mockHymns.find((h) => h.id === hymnId)?.number || 0,
      file_url: sheetMusic.url,
      thumbnail_url: sheetMusic.thumbnailUrl || null,
      page_count: 1,
      is_premium: true,
    };
  },

  async getHymnAudio(
    hymnId: number,
    type: "piano" | "soprano" | "alto" | "tenor" | "bass"
  ): Promise<any> {
    await delay(300);
    const hymn = mockHymns.find((h) => h.id === hymnId);
    if (!hymn || !hymn.audioUrls?.[type]) {
      throw new Error(`${type} audio not found`);
    }
    return {
      id: hymnId,
      hymn: hymnId,
      hymn_title: hymn.title,
      hymn_number: hymn.number,
      audio_type: type,
      audio_type_display: type.charAt(0).toUpperCase() + type.slice(1),
      file_url: hymn.audioUrls[type],
      duration: 180, // Mock duration in seconds
      bitrate: 128,
      is_premium: true,
    };
  },

  async getSheetMusicLibrary(): Promise<SheetMusic[]> {
    await delay(300);
    return mockSheetMusic;
  },

  async getSheetMusicById(sheetMusicId: number): Promise<any> {
    await delay(300);
    const sheetMusic = mockSheetMusic.find((sm) => sm.id === sheetMusicId);
    if (!sheetMusic) {
      throw new Error("Sheet music not found");
    }
    return {
      id: sheetMusic.id,
      hymn: sheetMusic.hymnId || null,
      hymn_title: sheetMusic.hymnId 
        ? mockHymns.find((h) => h.id === sheetMusic.hymnId)?.title || ""
        : null,
      hymn_number: sheetMusic.hymnId
        ? mockHymns.find((h) => h.id === sheetMusic.hymnId)?.number || 0
        : null,
      title: sheetMusic.title,
      composer: sheetMusic.composer || null,
      file_url: sheetMusic.url,
      url: sheetMusic.url,
      thumbnail_url: sheetMusic.thumbnailUrl || null,
      page_count: 1,
      is_premium: true,
    };
  },
};

// Real API functions
const realApi = {
  async getHymns(params?: {
    category?: string;
    author?: string;
    language?: string;
    search?: string;
    page?: number;
    denomination?: number;
    hymn_period?: "new" | "old";
  }): Promise<PaginatedResponse<HymnListResponse>> {
    // Convert params to query string format expected by Django
    const queryParams: any = {};
    if (params) {
      if (params.category) queryParams.category = params.category;
      if (params.author) queryParams.author = params.author;
      if (params.language) queryParams.language = params.language;
      if (params.search) queryParams.search = params.search;
      if (params.page) queryParams.page = params.page.toString();
      if (params.denomination !== undefined) queryParams.denomination = params.denomination.toString();
      if (params.hymn_period) queryParams.hymn_period = params.hymn_period;
    }
    const response = await api.get("/hymns/", { params: queryParams });
    return response.data;
  },

  async getHymnById(
    id: number,
    params?: {
      denomination?: number;
      hymn_period?: "new" | "old";
    }
  ): Promise<HymnDetailResponse> {
    // Convert params to query string format expected by Django
    const queryParams: any = {};
    if (params) {
      if (params.denomination !== undefined) queryParams.denomination = params.denomination.toString();
      if (params.hymn_period) queryParams.hymn_period = params.hymn_period;
    }
    const response = await api.get(`/hymns/${id}/`, { params: queryParams });
    return response.data;
  },

  async getCategories(): Promise<Category[]> {
    const response = await api.get("/categories/");
    return response.data.results || response.data;
  },

  async getAuthors(): Promise<Author[]> {
    const response = await api.get("/authors/");
    return response.data.results || response.data;
  },

  async getDenominations(): Promise<any[]> {
    const response = await api.get("/denominations/");
    return response.data.results || response.data;
  },

  async getSubscriptionStatus(): Promise<{ has_premium: boolean; subscription: any }> {
    const response = await api.get("/subscriptions/status/");
    return response.data;
  },

  async verifySubscription(data: {
    transaction_id: string;
    product_id: string;
    receipt_data: string;
    platform: "ios" | "android";
  }): Promise<any> {
    const response = await api.post("/subscriptions/verify/", data);
    return response.data;
  },

  async getDailyHymn(): Promise<HymnDetailResponse> {
    const response = await api.get("/hymns/daily/");
    return response.data;
  },

  async getFeaturedHymns(): Promise<HymnListResponse[]> {
    const response = await api.get("/hymns/featured/");
    return response.data.results || response.data;
  },

  async getHymnSheetMusic(hymnId: number): Promise<any> {
    const response = await api.get(`/hymns/${hymnId}/sheet_music/`);
    return response.data;
  },

  async getHymnAudio(
    hymnId: number,
    type: "piano" | "soprano" | "alto" | "tenor" | "bass"
  ): Promise<any> {
    const response = await api.get(`/hymns/${hymnId}/audio/${type}/`);
    return response.data;
  },

  async getSheetMusicLibrary(): Promise<SheetMusic[]> {
    const response = await api.get("/sheet-music/");
    return response.data.results || response.data;
  },

  async getSheetMusicById(sheetMusicId: number): Promise<any> {
    const response = await api.get(`/sheet-music/${sheetMusicId}/`);
    return response.data;
  },
};

// Export API functions (use mock or real based on config)
export const getHymns = USE_MOCK_DATA ? mockApi.getHymns : realApi.getHymns;
export const getHymnById = USE_MOCK_DATA ? mockApi.getHymnById : realApi.getHymnById;
export const getCategories = USE_MOCK_DATA ? mockApi.getCategories : realApi.getCategories;
export const getAuthors = USE_MOCK_DATA ? mockApi.getAuthors : realApi.getAuthors;
export const getDenominations = USE_MOCK_DATA ? mockApi.getDenominations : realApi.getDenominations;
export const getSubscriptionStatus = USE_MOCK_DATA ? mockApi.getSubscriptionStatus : realApi.getSubscriptionStatus;
export const verifySubscription = USE_MOCK_DATA ? mockApi.verifySubscription : realApi.verifySubscription;
export const getDailyHymn = USE_MOCK_DATA ? mockApi.getDailyHymn : realApi.getDailyHymn;
export const getFeaturedHymns = USE_MOCK_DATA
  ? mockApi.getFeaturedHymns
  : realApi.getFeaturedHymns;
export const getHymnSheetMusic = USE_MOCK_DATA
  ? mockApi.getHymnSheetMusic
  : realApi.getHymnSheetMusic;
export const getHymnAudio = USE_MOCK_DATA ? mockApi.getHymnAudio : realApi.getHymnAudio;
export const getSheetMusicLibrary = USE_MOCK_DATA
  ? mockApi.getSheetMusicLibrary
  : realApi.getSheetMusicLibrary;
export const getSheetMusicById = USE_MOCK_DATA
  ? mockApi.getSheetMusicById
  : realApi.getSheetMusicById;

// Error handling helper
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      const data = axiosError.response.data as { detail?: string } | undefined;
      return data?.detail || "An error occurred";
    } else if (axiosError.request) {
      return "Network error. Please check your connection.";
    }
  }
  return error instanceof Error ? error.message : "An unknown error occurred";
};

export default api;
