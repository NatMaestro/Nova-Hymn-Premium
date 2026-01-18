import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import {
  FlatList,
  SafeAreaView,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Platform,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { getHymnById } from "@/lib/api";
import { mockHymns } from "@/lib/mockData";
import { Hymn } from "@/types";
import { usePremium } from "@/contexts/PremiumContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useDenomination } from "@/contexts/DenominationContext";
import DenominationSidebar from "@/components/DenominationSidebar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchHymns, fetchHymnById } from "@/store/slices/hymnsSlice";
import { fetchCategories } from "@/store/slices/categoriesSlice";
import { fetchDailyHymn } from "@/store/slices/dailyHymnSlice";
import {
  selectHymnsByDenomination,
  selectHymnsLoading,
  selectAllCategories,
  selectCategoriesLoading,
  selectDailyHymn,
  selectDailyHymnLoading,
} from "@/store/selectors";

const FAVORITES_KEY = "favorite_hymns";
const FREE_FAVORITES_LIMIT = 10;

// Use exported sample data
const sampleData = mockHymns;

const HomeScreen = () => {
  const router = useRouter();
  const { isPremium } = usePremium();
  const { theme } = useTheme();
  const { selectedDenomination, selectedPeriod } = useDenomination();
  const dispatch = useAppDispatch();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [favorites, setFavorites] = useState<Hymn[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redux selectors
  const allHymns = useAppSelector((state) =>
    selectHymnsByDenomination(
      state,
      selectedDenomination?.id,
      selectedDenomination?.slug === "catholic" ? selectedPeriod : undefined
    )
  );
  const loadingHymns = useAppSelector(selectHymnsLoading);
  const categories = useAppSelector(selectAllCategories);
  const loadingCategories = useAppSelector(selectCategoriesLoading);
  const randomHymn = useAppSelector(selectDailyHymn);
  const loadingDailyHymn = useAppSelector(selectDailyHymnLoading);

  // Fetch categories from Redux
  React.useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Fetch hymns from Redux (with caching)
  React.useEffect(() => {
    if (selectedDenomination) {
      const params: any = {
        denomination: selectedDenomination.id,
      };
      if (selectedDenomination.slug === "catholic" && selectedPeriod) {
        params.hymn_period = selectedPeriod;
      }
      dispatch(fetchHymns(params));
    }
  }, [dispatch, selectedDenomination, selectedPeriod]);

  useFocusEffect(
    useCallback(() => {
      const fetchFavorites = async () => {
        try {
          const stored = await AsyncStorage.getItem(FAVORITES_KEY);
          const favoriteIds = stored ? JSON.parse(stored) : [];

          if (favoriteIds.length === 0) {
            setFavorites([]);
            return;
          }

          // Limit favorites for free users
          const limitedIds = isPremium
            ? favoriteIds
            : favoriteIds.slice(0, FREE_FAVORITES_LIMIT);

          // Use Redux hymns and sample data for lookup
          const allAvailableHymns = [...allHymns, ...sampleData];

          // Remove duplicates by id
          const uniqueHymns = allAvailableHymns.reduce(
            (acc: Hymn[], hymn: Hymn) => {
              if (!acc.find((h: Hymn) => h.id === hymn.id)) {
                acc.push(hymn);
              }
              return acc;
            },
            [] as Hymn[]
          );

          // Find favorite hymns from all available data
          // Normalize IDs to numbers for comparison
          const normalizedLimitedIds = limitedIds.map((id: any) => Number(id));
          console.log("Fetching favorites - IDs:", normalizedLimitedIds);
          console.log("Available hymns count:", uniqueHymns.length);

          let favoriteHymns = uniqueHymns.filter((hymn: Hymn) => {
            const hymnId = Number(hymn.id);
            const isFavorite = normalizedLimitedIds.includes(hymnId);
            if (isFavorite) {
              console.log("Found favorite hymn:", hymn.id, hymn.title);
            }
            return isFavorite;
          });

          console.log(
            "Found favorites from available data:",
            favoriteHymns.length
          );

          // If some favorites are missing, try to fetch them individually
          const missingIds = normalizedLimitedIds.filter(
            (id: number) =>
              !favoriteHymns.find((h: Hymn) => Number(h.id) === id)
          );

          console.log("Missing favorite IDs:", missingIds);

          if (missingIds.length > 0) {
            try {
              const fetchedHymns = await Promise.all(
                missingIds.map((id: number) =>
                  getHymnById(id).catch((err) => {
                    console.error(`Error fetching hymn ${id}:`, err);
                    return null;
                  })
                )
              );

              const validHymns = fetchedHymns.filter(
                (hymn): hymn is any => hymn !== null
              );

              // Transform fetched hymns (HymnDetailResponse) to Hymn format
              const transformedHymns: Hymn[] = validHymns.map((h: any) => ({
                id: h.id,
                number: h.number,
                title: h.title,
                slug: h.slug,
                author: h.author,
                author_name: h.author_name,
                author_biography: h.author_biography || undefined,
                category: h.category,
                category_name: h.category_name,
                language: h.language,
                verses: h.verses || [],
                sheetMusicUrl: h.sheet_music_url || null,
                audioUrls: h.audio_urls || null,
                scriptureReferences: h.scripture_references || [],
                history: h.history || null,
                meter: h.meter || null,
                key_signature: h.key_signature || null,
                time_signature: h.time_signature || null,
                is_premium: h.is_premium,
                is_featured: h.is_featured,
                view_count: h.view_count,
                created_at: h.created_at,
                updated_at: h.updated_at,
              }));

              console.log(
                "Transformed fetched hymns:",
                transformedHymns.length
              );
              favoriteHymns = [...favoriteHymns, ...transformedHymns];
            } catch (error) {
              console.error("Error fetching individual favorite hymns:", error);
            }
          }

          // Sort by favorite order (most recently added first)
          favoriteHymns.sort((a: Hymn, b: Hymn) => {
            const indexA = normalizedLimitedIds.indexOf(Number(a.id));
            const indexB = normalizedLimitedIds.indexOf(Number(b.id));
            return indexA - indexB;
          });

          console.log("Final favorites count:", favoriteHymns.length);
          console.log(
            "Final favorites:",
            favoriteHymns.map((h) => ({ id: h.id, title: h.title }))
          );
          setFavorites(favoriteHymns);
        } catch (error) {
          console.error("Error fetching favorites:", error);
          setFavorites([]);
        }
      };
      fetchFavorites();
    }, [isPremium, allHymns])
  );

  const handleAllHymnPress = () => {
    router.push("/(tabs)/all-hymns");
  };

  const handleCategorySort = (category: string) => {
    setSelectedCategory(category);
    router.push(`/(tabs)/all-hymns?category=${encodeURIComponent(category)}`);
  };

  // Fetch daily hymn from Redux (with caching - only fetches once per day)
  React.useEffect(() => {
    dispatch(fetchDailyHymn());
  }, [dispatch]);

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.colors.background }}
    >
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className={`${Platform.OS === "android" ? "mt-8" : "mt-5"} px-5`}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <TouchableOpacity onPress={() => setSidebarOpen(true)}>
                <Image
                  source={require("../../assets/icons/book.png")}
                  className="h-7 w-7"
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text
                className="text-3xl font-bold"
                style={{ color: theme.colors.text }}
              >
                Hymns
              </Text>
              {selectedDenomination && (
                <TouchableOpacity
                  onPress={() => setSidebarOpen(true)}
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: theme.colors.card }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: theme.colors.text }}
                  >
                    {selectedDenomination.name}
                    {selectedDenomination.slug === "catholic" && selectedPeriod
                      ? ` (${selectedPeriod === "new" ? "New" : "Old"})`
                      : ""}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {/* <TouchableOpacity onPress={handleAllHymnPress}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>View all</Text>
          </TouchableOpacity> */}
          </View>

          {/* Denomination Sidebar */}
          <DenominationSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <View
            className="border-2 min-h-[400px] mt-10 rounded-3xl p-5"
            style={{ borderColor: theme.colors.border }}
          >
            <Text
              className="text-xl font-semibold"
              style={{ color: theme.colors.text }}
            >
              Hymn of the Day
            </Text>
            <View
              className="border min-h-[265px] rounded-3xl mt-5 p-5 flex-1"
              style={{
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.card,
              }}
            >
              {loadingDailyHymn ? (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="large" color={theme.colors.navy} />
                  <Text
                    className="text-lg mt-4 text-center"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Loading hymn of the day...
                  </Text>
                </View>
              ) : randomHymn ? (
                <View className="flex flex-col flex-1">
                  <View className="flex-1">
                    <Text
                      className="font-bold text-xl"
                      style={{ color: theme.colors.text }}
                    >
                      {randomHymn.number}
                    </Text>
                    <Text
                      className="font-bold mt-3 text-xl"
                      style={{ color: theme.colors.text }}
                    >
                      {randomHymn.title}
                    </Text>
                    <Text
                      className="text-lg mt-3"
                      style={{ color: theme.colors.text }}
                    >
                      {(randomHymn.verses && randomHymn.verses[0]?.text) ||
                        "No lyrics available"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    className="mt-auto pt-4"
                    onPress={() =>
                      router.push({
                        pathname: "/all-hymns/[id]",
                        params: { id: randomHymn.id },
                      })
                    }
                  >
                    <Text
                      className="text-xl font-bold"
                      style={{ color: theme.colors.text }}
                    >
                      Read More...
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-1 justify-center items-center">
                  <Text
                    className="text-xl text-center"
                    style={{ color: theme.colors.text }}
                  >
                    No hymn available today.
                  </Text>
                  <Text
                    className="text-lg text-center mt-3 opacity-70"
                    style={{ color: theme.colors.text }}
                  >
                    Check back later or browse all hymns.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-5 my-8"
          >
            {loadingCategories ? (
              <View className="flex-row items-center px-4">
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text
                  className="ml-2 text-base"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Loading categories...
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity onPress={() => handleCategorySort("all")}>
                  <Text
                    className={`px-4 py-2 rounded-full font-semibold mr-3 ${
                      selectedCategory === "all" || selectedCategory === ""
                        ? "text-white"
                        : ""
                    }`}
                    style={{
                      backgroundColor:
                        selectedCategory === "all" || selectedCategory === ""
                          ? theme.colors.navy
                          : theme.colors.accent,
                      color:
                        selectedCategory === "all" || selectedCategory === ""
                          ? "white"
                          : theme.colors.text,
                    }}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {categories.map((cat) => {
              const isSelected = selectedCategory === String(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => handleCategorySort(String(cat.id))}
                >
                  <Text
                    className={`px-4 py-2 rounded-full font-semibold mr-3 ${
                      isSelected ? "text-white" : ""
                    }`}
                    style={{
                      backgroundColor: isSelected
                        ? theme.colors.navy
                        : theme.colors.accent,
                      color: isSelected ? "white" : theme.colors.text,
                    }}
                  >
                    {cat?.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
              </>
            )}
          </ScrollView>
        </View>

        <View className="px-5 mt-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text
              className="text-xl font-semibold"
              style={{ color: theme.colors.text }}
            >
              Recently Favorite
            </Text>
            {!isPremium && favorites.length >= FREE_FAVORITES_LIMIT && (
              <TouchableOpacity onPress={() => router.push("/premium")}>
                <Text
                  className="text-xs"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Upgrade for unlimited
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {favorites.length === 0 ? (
            <Text
              className="text-center mt-4"
              style={{ color: theme.colors.text }}
            >
              No favorite hymns yet. Start adding some!
            </Text>
          ) : (
            favorites.map((item, index) => (
              <TouchableOpacity
                key={item?.id ? item.id.toString() : index.toString()}
                onPress={() =>
                  router.push({
                    pathname: "/all-hymns/[id]",
                    params: { id: item?.id },
                  })
                }
                className="flex-row items-center justify-between py-3 border-b"
                style={{ borderBottomColor: theme.colors.border }}
              >
                <View className="flex-row items-center gap-6">
                  <Text
                    className="text-lg"
                    style={{ color: theme.colors.text }}
                  >
                    {item?.number}
                  </Text>
                  <Text
                    className="text-lg"
                    style={{ color: theme.colors.text }}
                  >
                    {item?.title}
                  </Text>
                </View>
                <Image
                  source={require("../../assets/icons/favorite.png")}
                  className="h-6 w-6"
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
