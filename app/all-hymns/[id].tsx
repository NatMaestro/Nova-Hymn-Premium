import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  Image,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { getHymnById } from "@/lib/api";
import { mockHymns } from "@/lib/mockData";
import { Hymn } from "@/types";
import { usePremium } from "@/contexts/PremiumContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useDenomination } from "@/contexts/DenominationContext";
import { PremiumGate } from "@/components/PremiumGate";
import { AudioPlayer } from "@/components/AudioPlayer";
import { CompactAudioPlayer } from "@/components/CompactAudioPlayer";
import { SheetMusicViewer } from "@/components/SheetMusicViewer";
import { HymnNotes } from "@/components/HymnNotes";
import { VocalMixer } from "@/components/VocalMixer";
import { AddToPlaylist } from "@/components/AddToPlaylist";
import { ShareHymn } from "@/components/ShareHymn";
import { useAudioManager } from "@/contexts/AudioManagerContext";

const FAVORITES_KEY = "favorite_hymns";
const FREE_FAVORITES_LIMIT = 10;

// Use exported sample data
const sampleHymns = mockHymns;

// Helper function to get mock media for a hymn
const getMockHymnWithMedia = (hymnId: number) => {
  const hymn = mockHymns.find((h) => h.id === hymnId);
  if (!hymn) {
    return { sheetMusicUrl: null, audioUrls: null };
  }
  return {
    sheetMusicUrl: hymn.sheetMusicUrl || hymn.sheet_music_url || null,
    audioUrls: hymn.audioUrls || hymn.audio_urls || null,
  };
};

export default function HymnDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isPremium } = usePremium();
  const { theme } = useTheme();
  const { selectedDenomination, selectedPeriod } = useDenomination();
  const { currentlyPlaying } = useAudioManager();
  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "lyrics" | "sheet" | "audio" | "split"
  >("lyrics");
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Determine if any audio is currently playing
  const isAudioPlaying = currentlyPlaying !== null;

  useEffect(() => {
    fetchHymn();
    checkIfFavorite();
  }, [id, selectedDenomination, selectedPeriod]);

  const fetchHymn = async () => {
    try {
      setLoading(true);
      let hymnData;
      try {
        const params: any = {};
        if (selectedDenomination) {
          params.denomination = selectedDenomination.id;
          if (selectedDenomination.slug === "catholic" && selectedPeriod) {
            params.hymn_period = selectedPeriod;
          }
        }
        hymnData = await getHymnById(Number(id), params);
      } catch (error) {
        console.warn(`Hymn ${id} not found, trying to find in sample data`);
        // Try to find in sample data as fallback
        const sampleHymn = sampleHymns.find(
          (h: Hymn) => h.id === Number(id) || h.number === Number(id)
        );
        if (sampleHymn) {
          // Transform sample hymn to HymnDetailResponse format
          const categoryId =
            typeof sampleHymn.category === "number" ? sampleHymn.category : 0;
          const authorId =
            typeof sampleHymn.author === "number" ? sampleHymn.author : 0;
          hymnData = {
            id: sampleHymn.id,
            number: sampleHymn.number,
            title: sampleHymn.title,
            slug:
              sampleHymn.slug ||
              `${sampleHymn.number}-${sampleHymn.title
                .toLowerCase()
                .replace(/\s+/g, "-")}`,
            category: categoryId,
            category_name:
              sampleHymn.category_name || String(sampleHymn.category),
            author: authorId,
            author_name: sampleHymn.author_name || String(sampleHymn.author),
            author_biography: sampleHymn.author_biography || null,
            language: sampleHymn.language,
            verses: sampleHymn.verses || [],
            scripture_references:
              sampleHymn.scripture_references ||
              sampleHymn.scriptureReferences ||
              [],
            history: sampleHymn.history || null,
            meter: sampleHymn.meter || null,
            key_signature: sampleHymn.key_signature || null,
            time_signature: sampleHymn.time_signature || null,
            sheet_music_url:
              sampleHymn.sheetMusicUrl || sampleHymn.sheet_music_url || null,
            sheet_music_thumbnail: sampleHymn.sheet_music_thumbnail || null,
            audio_urls: sampleHymn.audioUrls || sampleHymn.audio_urls || null,
            is_premium: sampleHymn.is_premium ?? false,
            is_featured: sampleHymn.is_featured ?? false,
            view_count: sampleHymn.view_count ?? 0,
            created_at: sampleHymn.created_at || new Date().toISOString(),
            updated_at: sampleHymn.updated_at || new Date().toISOString(),
          };
        } else {
          throw new Error(`Hymn with id ${id} not found`);
        }
      }

      // Transform HymnDetailResponse to Hymn format
      const mockMedia = getMockHymnWithMedia(Number(id));
      const hymnWithMedia: Hymn = {
        id: hymnData.id,
        number: hymnData.number,
        title: hymnData.title,
        slug: hymnData.slug,
        author: hymnData.author,
        author_name: hymnData.author_name,
        author_biography: hymnData.author_biography || undefined,
        category: hymnData.category,
        category_name: hymnData.category_name,
        language: hymnData.language,
        verses: hymnData.verses,
        sheetMusicUrl:
          hymnData.sheet_music_url || mockMedia.sheetMusicUrl || null,
        sheet_music_url: hymnData.sheet_music_url || null,
        sheet_music_thumbnail: hymnData.sheet_music_thumbnail || null,
        audioUrls: hymnData.audio_urls || mockMedia.audioUrls || null,
        audio_urls: hymnData.audio_urls || null,
        scriptureReferences: hymnData.scripture_references || [],
        scripture_references: hymnData.scripture_references || [],
        history: hymnData.history || null,
        meter: hymnData.meter || null,
        key_signature: hymnData.key_signature || null,
        time_signature: hymnData.time_signature || null,
        is_premium: hymnData.is_premium,
        is_featured: hymnData.is_featured,
        view_count: hymnData.view_count,
        created_at: hymnData.created_at,
        updated_at: hymnData.updated_at,
      };

      console.log("Hymn with media:", {
        id: hymnWithMedia.id,
        title: hymnWithMedia.title,
        hasSheetMusic: !!hymnWithMedia.sheetMusicUrl,
        sheetMusicUrl: hymnWithMedia.sheetMusicUrl,
      });

      // Ensure verses exists
      if (hymnWithMedia && !hymnWithMedia.verses) {
        // Try to find in sample data as fallback
        const sampleHymn = sampleHymns.find((h: Hymn) => h.id === Number(id));
        if (sampleHymn) {
          setHymn({ ...hymnWithMedia, verses: sampleHymn.verses });
        } else {
          setHymn(hymnWithMedia);
        }
      } else {
        setHymn(hymnWithMedia);
      }
    } catch (error) {
      console.error("Error fetching hymn:", error);
      // Try to use sample data as fallback
      const sampleHymn = sampleHymns.find((h) => h.id === Number(id));
      if (sampleHymn) {
        const mockMedia = getMockHymnWithMedia(Number(id));
        setHymn({
          ...sampleHymn,
          sheetMusicUrl: mockMedia.sheetMusicUrl,
          audioUrls: mockMedia.audioUrls,
        });
      } else {
        Alert.alert("Error", "Failed to load hymn");
      }
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      const favorites = stored ? JSON.parse(stored) : [];
      // Ensure both are numbers for comparison
      const hymnId = Number(id);
      const isFav = favorites.some((favId: number) => Number(favId) === hymnId);
      setIsFavorite(isFav);
    } catch (err) {
      console.error("Error checking favorite", err);
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      const favorites: number[] = stored ? JSON.parse(stored) : [];
      const hymnId = Number(id);

      // Normalize all favorite IDs to numbers for comparison
      const normalizedFavorites = favorites.map((favId: any) => Number(favId));
      const isCurrentlyFavorite = normalizedFavorites.some(
        (favId: number) => favId === hymnId
      );

      // Check limit for free users
      if (
        !isPremium &&
        !isCurrentlyFavorite &&
        normalizedFavorites.length >= FREE_FAVORITES_LIMIT
      ) {
        Alert.alert(
          "Favorite Limit Reached",
          `Free users can save up to ${FREE_FAVORITES_LIMIT} favorites. Upgrade to Premium for unlimited favorites!`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Upgrade",
              onPress: () => router.push("/premium"),
            },
          ]
        );
        return;
      }

      let updatedFavorites: number[];
      if (isCurrentlyFavorite) {
        // Remove from favorites
        updatedFavorites = normalizedFavorites.filter(
          (favId: number) => favId !== hymnId
        );
        setIsFavorite(false);
      } else {
        // Add to favorites (add to the end to maintain order)
        updatedFavorites = [...normalizedFavorites, hymnId];
        setIsFavorite(true);
      }

      await AsyncStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(updatedFavorites)
      );

      console.log("Favorite updated:", {
        hymnId,
        isFavorite: !isCurrentlyFavorite,
        totalFavorites: updatedFavorites.length,
      });
    } catch (err) {
      console.error("Error updating favorite", err);
      Alert.alert("Error", "Failed to update favorite");
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.text, marginTop: 16 }]}
          >
            Loading hymn...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hymn) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Hymn not found
          </Text>
          <TouchableOpacity onPress={handleBack} style={{ marginTop: 16 }}>
            <Text style={{ color: theme.colors.textSecondary }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          { marginTop: 40, marginRight: 12, paddingHorizontal: 20 },
        ]}
      >
        <TouchableOpacity onPress={handleBack}>
          <Image
            source={require("../../assets/icons/back.png")}
            style={styles.icon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={{ flexDirection: "row", gap: 12 }}>
          {isPremium && (
            <>
              <TouchableOpacity onPress={() => setShowShareModal(true)}>
                <Text
                  style={{ fontSize: 20, color: theme.colors.textSecondary }}
                >
                  📤
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowAddToPlaylist(true)}>
                <Text
                  style={{ fontSize: 20, color: theme.colors.textSecondary }}
                >
                  📋
                </Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={toggleFavorite}>
            <Image
              source={
                isFavorite
                  ? require("../../assets/icons/favorite.png")
                  : require("../../assets/icons/favorite-filled.png")
              }
              style={styles.icon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Hymn Info */}
        <View style={styles.hymnInfo}>
          <Text style={[styles.hymnTitle, { color: theme.colors.text }]}>
            {hymn.title}
          </Text>
          <View style={styles.hymnMeta}>
            <Text style={[styles.metaText, { color: theme.colors.text }]}>
              {hymn.category_name ||
                (typeof hymn.category === "object" && hymn.category !== null
                  ? (hymn.category as any)?.name || String(hymn.category)
                  : String(hymn.category || ""))}
            </Text>
            <Text style={[styles.metaText, { color: theme.colors.text }]}>
              {String(hymn.language || "")}
            </Text>
            <Text style={[styles.metaText, { color: theme.colors.text }]}>
              {hymn.author_name || String(hymn.author || "")}
            </Text>
          </View>
        </View>
        <View
          style={[styles.divider, { borderBottomColor: theme.colors.border }]}
        />

        {/* Tabs for Premium Features */}
        {isPremium && (
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              onPress={() => setActiveTab("lyrics")}
              style={[
                styles.tab,
                activeTab === "lyrics" && {
                  backgroundColor: theme.colors.text,
                },
                { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === "lyrics" ? "white" : theme.colors.text,
                  },
                ]}
              >
                Lyrics
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("sheet")}
              style={[
                styles.tab,
                activeTab === "sheet" && { backgroundColor: theme.colors.text },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === "sheet" ? "white" : theme.colors.text,
                  },
                ]}
              >
                Sheet Music
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("split")}
              style={[
                styles.tab,
                activeTab === "split" && {
                  backgroundColor: theme.colors.textSecondary,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === "split" ? "white" : theme.colors.text,
                  },
                ]}
              >
                Split View
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("audio")}
              style={[
                styles.tab,
                activeTab === "audio" && { backgroundColor: theme.colors.text },
                { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === "audio" ? "white" : theme.colors.text,
                  },
                ]}
              >
                Audio
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content based on active tab */}
        {activeTab === "lyrics" || !isPremium ? (
          <View>
            {hymn.verses && hymn.verses.length > 0 ? (
              hymn.verses.map((verse, index) => (
                <View key={index} style={{ marginTop: 20 }}>
                  <View style={{ marginLeft: 20 }}>
                    <Text
                      style={[styles.verseNumber, { color: theme.colors.text }]}
                    >
                      {verse.is_chorus ? "Chorus" : `${verse.verse_number}.`}
                    </Text>
                    <Text
                      style={[styles.verseText, { color: theme.colors.text }]}
                    >
                      {verse.text}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                  Lyrics not available for this hymn.
                </Text>
              </View>
            )}

            {/* Scripture References (Premium) */}
            {hymn.scriptureReferences &&
              hymn.scriptureReferences.length > 0 && (
                <PremiumGate featureName="Scripture References">
                  <View
                    style={[
                      styles.card,
                      { backgroundColor: theme.colors.card, marginTop: 24 },
                    ]}
                  >
                    <Text
                      style={[styles.cardTitle, { color: theme.colors.text }]}
                    >
                      Scripture References
                    </Text>
                    {hymn.scriptureReferences.map((ref, index) => (
                      <Text
                        key={index}
                        style={[styles.cardText, { color: theme.colors.text }]}
                      >
                        {ref}
                      </Text>
                    ))}
                  </View>
                </PremiumGate>
              )}

            {/* Hymn History (Premium) */}
            {hymn.history && (
              <PremiumGate featureName="Hymn History">
                <View
                  style={[
                    styles.card,
                    { backgroundColor: theme.colors.card, marginTop: 24 },
                  ]}
                >
                  <Text
                    style={[styles.cardTitle, { color: theme.colors.text }]}
                  >
                    History
                  </Text>
                  <Text style={[styles.cardText, { color: theme.colors.text }]}>
                    {hymn.history}
                  </Text>
                </View>
              </PremiumGate>
            )}

            {/* Hymn Notes/Annotations (Premium) */}
            <HymnNotes hymnId={hymn.id} hymnTitle={hymn.title} />
          </View>
        ) : activeTab === "split" ? (
          <PremiumGate featureName="Split-Screen Mode">
            <View style={{ flex: 1, minHeight: 600 }}>
              {hymn.sheetMusicUrl ? (
                <>
                  <View style={{ flex: 1, flexDirection: "row" }}>
                    {/* Lyrics Side */}
                    <View style={{ flex: 1, paddingRight: 8, maxHeight: 600 }}>
                      <ScrollView
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={true}
                      >
                        <Text
                          style={[
                            styles.sectionTitle,
                            {
                              color: theme.colors.text,
                              marginBottom: 16,
                              fontSize: 18,
                              fontWeight: "600",
                            },
                          ]}
                        >
                          Lyrics
                        </Text>
                        {hymn.verses && hymn.verses.length > 0 ? (
                          hymn.verses.map((verse, index) => (
                            <View key={index} style={{ marginBottom: 16 }}>
                              <View>
                                <Text
                                  style={[
                                    styles.verseNumber,
                                    { color: theme.colors.text, fontSize: 16 },
                                  ]}
                                >
                                  {verse.is_chorus
                                    ? "Chorus"
                                    : `${verse.verse_number}.`}
                                </Text>
                                <Text
                                  style={[
                                    styles.verseText,
                                    { color: theme.colors.text, fontSize: 14 },
                                  ]}
                                >
                                  {verse.text}
                                </Text>
                              </View>
                            </View>
                          ))
                        ) : (
                          <View
                            style={[
                              styles.emptyCard,
                              { backgroundColor: theme.colors.card },
                            ]}
                          >
                            <Text
                              style={[
                                styles.emptyText,
                                { color: theme.colors.text },
                              ]}
                            >
                              Lyrics not available for this hymn.
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>

                    {/* Divider */}
                    <View
                      style={{
                        width: 1,
                        backgroundColor: theme.colors.border,
                        marginHorizontal: 8,
                      }}
                    />

                    {/* Sheet Music Side */}
                    <View style={{ flex: 1, paddingLeft: 8, maxHeight: 600 }}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          {
                            color: theme.colors.text,
                            marginBottom: 16,
                            fontSize: 18,
                            fontWeight: "600",
                          },
                        ]}
                      >
                        Sheet Music
                      </Text>
                      <View style={{ flex: 1, minHeight: 500 }}>
                        <SheetMusicViewer
                          sheetMusicUrl={hymn.sheetMusicUrl}
                          hymnTitle={hymn.title}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Compact Audio Players in Split View - Show all available audio */}
                  <View
                    style={{ marginTop: 16, paddingHorizontal: 16, gap: 12 }}
                  >
                    {hymn.audioUrls?.piano && (
                      <CompactAudioPlayer
                        audioUrl={hymn.audioUrls.piano}
                        title={hymn.title}
                        type="piano"
                        hymnId={String(hymn.id)}
                      />
                    )}
                    {hymn.audioUrls?.soprano && (
                      <CompactAudioPlayer
                        audioUrl={hymn.audioUrls.soprano}
                        title={`${hymn.title} - Soprano`}
                        type="soprano"
                        hymnId={String(hymn.id)}
                      />
                    )}
                    {hymn.audioUrls?.alto && (
                      <CompactAudioPlayer
                        audioUrl={hymn.audioUrls.alto}
                        title={`${hymn.title} - Alto`}
                        type="alto"
                        hymnId={String(hymn.id)}
                      />
                    )}
                  </View>
                </>
              ) : (
                <View
                  style={[
                    styles.emptyCard,
                    { backgroundColor: theme.colors.card, margin: 16 },
                  ]}
                >
                  <Text
                    style={[styles.emptyText, { color: theme.colors.text }]}
                  >
                    Sheet music not available for this hymn.
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtext,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Split-screen mode requires sheet music to be available.
                  </Text>
                </View>
              )}
            </View>
          </PremiumGate>
        ) : activeTab === "sheet" ? (
          <View style={{ height: 600 }}>
            {hymn.sheetMusicUrl ? (
              <View style={{ flex: 1 }}>
                <SheetMusicViewer
                  sheetMusicUrl={hymn.sheetMusicUrl}
                  hymnTitle={hymn.title}
                />
              </View>
            ) : (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: theme.colors.card, margin: 16 },
                ]}
              >
                <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                  Sheet music not available for this hymn.
                </Text>
                <Text
                  style={[
                    styles.emptySubtext,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Hymn ID: {hymn.id}, URL: {hymn.sheetMusicUrl || "not set"}
                </Text>
              </View>
            )}
          </View>
        ) : isPremium && activeTab === "audio" ? (
          <View>
            {/* Piano Accompaniment */}
            {hymn.audioUrls?.piano && (
              <View style={{ marginBottom: 16 }}>
                <AudioPlayer
                  audioUrl={hymn.audioUrls.piano}
                  title={hymn.title}
                  type="piano"
                />
              </View>
            )}

            {/* Vocal Mixer (Premium) */}
            {(hymn.audioUrls?.soprano ||
              hymn.audioUrls?.alto ||
              hymn.audioUrls?.tenor ||
              hymn.audioUrls?.bass) && (
              <VocalMixer
                audioUrls={hymn.audioUrls || {}}
                hymnTitle={hymn.title}
                hymnId={String(hymn.id)}
              />
            )}

            {/* Individual Vocal Parts */}
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text, marginTop: 24, marginBottom: 12 },
              ]}
            >
              Individual Parts
            </Text>
            {hymn.audioUrls?.soprano && (
              <View style={{ marginBottom: 16 }}>
                <AudioPlayer
                  audioUrl={hymn.audioUrls.soprano}
                  title={`${hymn.title} - Soprano`}
                  type="soprano"
                  hymnId={String(hymn.id)}
                />
              </View>
            )}
            {hymn.audioUrls?.alto && (
              <View style={{ marginBottom: 16 }}>
                <AudioPlayer
                  audioUrl={hymn.audioUrls.alto}
                  title={`${hymn.title} - Alto`}
                  type="alto"
                  hymnId={String(hymn.id)}
                />
              </View>
            )}
            {hymn.audioUrls?.tenor && (
              <View style={{ marginBottom: 16 }}>
                <AudioPlayer
                  audioUrl={hymn.audioUrls.tenor}
                  title={`${hymn.title} - Tenor`}
                  type="tenor"
                  hymnId={String(hymn.id)}
                />
              </View>
            )}
            {hymn.audioUrls?.bass && (
              <View style={{ marginBottom: 16 }}>
                <AudioPlayer
                  audioUrl={hymn.audioUrls.bass}
                  title={`${hymn.title} - Bass`}
                  type="bass"
                  hymnId={String(hymn.id)}
                />
              </View>
            )}

            {!hymn.audioUrls && (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                  Audio not available for this hymn.
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Premium Feature Prompts for Free Users */}
        {!isPremium && (
          <View style={{ marginTop: 24 }}>
            {hymn.sheetMusicUrl && (
              <PremiumGate featureName="Sheet Music">
                <View />
              </PremiumGate>
            )}
            {hymn.audioUrls && (
              <PremiumGate featureName="Audio Playback">
                <View />
              </PremiumGate>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add to Playlist Modal */}
      {showAddToPlaylist && hymn && (
        <AddToPlaylist
          hymn={hymn}
          onClose={() => setShowAddToPlaylist(false)}
        />
      )}

      {/* Share Hymn Modal */}
      {showShareModal && hymn && (
        <ShareHymn hymn={hymn} onClose={() => setShowShareModal(false)} />
      )}

      {/* Persistent Mini Audio Players - Shows all available audio when not on audio tab */}
      {isPremium && activeTab !== "audio" && hymn?.audioUrls && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.colors.card,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            paddingBottom: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
            maxHeight: 200,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 8, gap: 8 }}
          >
            {/* Show all available audio parts as compact players */}
            {hymn.audioUrls?.piano && (
              <View style={{ width: 280 }}>
                <CompactAudioPlayer
                  audioUrl={hymn.audioUrls.piano}
                  title={hymn.title}
                  type="piano"
                  hymnId={String(hymn.id)}
                />
              </View>
            )}
            {hymn.audioUrls?.soprano && (
              <View style={{ width: 280 }}>
                <CompactAudioPlayer
                  audioUrl={hymn.audioUrls.soprano}
                  title={`${hymn.title} - Soprano`}
                  type="soprano"
                  hymnId={String(hymn.id)}
                />
              </View>
            )}
            {hymn.audioUrls?.alto && (
              <View style={{ width: 280 }}>
                <CompactAudioPlayer
                  audioUrl={hymn.audioUrls.alto}
                  title={`${hymn.title} - Alto`}
                  type="alto"
                  hymnId={String(hymn.id)}
                />
              </View>
            )}
            {hymn.audioUrls?.tenor && (
              <View style={{ width: 280 }}>
                <CompactAudioPlayer
                  audioUrl={hymn.audioUrls.tenor}
                  title={`${hymn.title} - Tenor`}
                  type="tenor"
                  hymnId={String(hymn.id)}
                />
              </View>
            )}
            {hymn.audioUrls?.bass && (
              <View style={{ width: 280 }}>
                <CompactAudioPlayer
                  audioUrl={hymn.audioUrls.bass}
                  title={`${hymn.title} - Bass`}
                  type="bass"
                  hymnId={String(hymn.id)}
                />
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  icon: {
    height: 24,
    width: 24,
  },
  hymnInfo: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  hymnTitle: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
  },
  hymnMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    width: "100%",
    paddingHorizontal: 16,
  },
  metaText: {
    fontSize: 18,
    fontWeight: "600",
  },
  divider: {
    borderBottomWidth: 1,
    marginHorizontal: 8,
    marginTop: 12,
  },
  tabsContainer: {
    flexDirection: "row",
    marginTop: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#E4E4E4",
    alignItems: "center",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  verseNumber: {
    fontSize: 20,
    fontWeight: "600",
  },
  verseText: {
    fontSize: 18,
    marginTop: 8,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 18,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  card: {
    padding: 16,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
});
