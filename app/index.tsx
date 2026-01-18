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
import { useResponsive } from "@/hooks/useResponsive";
import DenominationSelector from "@/components/DenominationSelector";
import { useDenomination } from "@/contexts/DenominationContext";
import DenominationSidebar from "@/components/DenominationSidebar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchHymns } from "@/store/slices/hymnsSlice";
import { fetchCategories } from "@/store/slices/categoriesSlice";
import { fetchDailyHymn } from "@/store/slices/dailyHymnSlice";
import { RootState } from "@/store";
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
  const responsive = useResponsive();

  // Redux selectors
  const allHymns = useAppSelector((state: RootState) =>
    selectHymnsByDenomination(
      state,
      selectedDenomination?.id,
      selectedDenomination?.slug === "catholic" && selectedPeriod
        ? selectedPeriod
        : undefined
    )
  );
  const loadingHymns = useAppSelector(selectHymnsLoading);
  const categories = useAppSelector(selectAllCategories);
  const loadingCategories = useAppSelector(selectCategoriesLoading);
  const randomHymn = useAppSelector(selectDailyHymn);
  const loadingDailyHymn = useAppSelector(selectDailyHymnLoading);

  // Fetch categories from Redux (with caching)
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

          // Combine API hymns and sample data for lookup
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
            favoriteHymns.map((h: Hymn) => ({ id: h.id, title: h.title }))
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
    router.push("/all-hymns");
  };

  const handleCategorySort = (category: string | number) => {
    const categoryStr = String(category);
    setSelectedCategory(categoryStr);
    router.push(`/all-hymns/index?category=${encodeURIComponent(categoryStr)}`);
  };

  // Fetch daily hymn from Redux (with caching - only fetches once per day)
  React.useEffect(() => {
    dispatch(fetchDailyHymn());
  }, [dispatch]);

  return (
    <>
      {Platform.OS === "android" && (
        <SafeAreaView className="flex-1 bg-[#FCF7E7]">
          <StatusBar barStyle="dark-content" backgroundColor="#FCF7E7" />
          <View className="mt-8 px-5">
            <View className="flex flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-4">
                <TouchableOpacity onPress={() => setSidebarOpen(true)}>
                  <Image
                    source={require("../assets/icons/book.png")}
                    className="h-7 w-7"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <Text className="text-3xl text-[#062958]">Hymns</Text>
                {selectedDenomination && (
                  <TouchableOpacity
                    onPress={() => setSidebarOpen(true)}
                    className="bg-[#F6F1DA] px-3 py-1 rounded-full"
                  >
                    <Text className="text-sm text-[#062958] font-semibold">
                      {selectedDenomination.name}
                      {selectedDenomination.slug === "catholic" &&
                      selectedPeriod
                        ? ` (${selectedPeriod === "new" ? "New" : "Old"})`
                        : ""}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={handleAllHymnPress}>
                  <Text className="text-[#0B489A] text-lg">View all</Text>
                </TouchableOpacity>
                {isPremium && (
                  <TouchableOpacity onPress={() => router.push("/premium")}>
                    <Text className="text-[#0B489A] text-lg font-semibold">
                      Sheet Library
                    </Text>
                  </TouchableOpacity>
                )}
                {!isPremium && (
                  <TouchableOpacity onPress={() => router.push("/premium")}>
                    <Text className="text-[#0B489A] text-lg font-semibold">
                      Premium
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Denomination Sidebar */}
            <DenominationSidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />

            <View className=" flex flex-col border-2 border-[#E4E4E4] min-h-[400px] mt-10 rounded-3xl p-5">
              <Text className="text-2xl font-semibold text-[#062958]">
                Hymn of the Day
              </Text>
              <View className="border bg-[#FFFEF1] min-h-[300px] rounded-3xl mt-5 p-5">
                {loadingDailyHymn ? (
                  <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#062958" />
                    <Text className="text-lg mt-4 text-center text-[#062958] opacity-70">
                      Loading hymn of the day...
                    </Text>
                  </View>
                ) : randomHymn ? (
                  <View className="flex flex-col flex-1">
                    <View className="flex-1">
                      <Text className="font-bold text-[#062958] text-xl">
                        {randomHymn.number}
                      </Text>
                      <Text className="font-bold mt-3 text-[#062958] text-xl">
                        {randomHymn.title}
                      </Text>
                      <Text className="text-xl mt-3 text-[#062958]">
                        {(randomHymn.verses && randomHymn.verses[0]?.text) ||
                          "No lyrics available"}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View className="flex-1 justify-center items-center">
                    <Text className="text-xl text-[#062958] text-center">
                      No hymn available today.
                    </Text>
                    <Text className="text-lg text-[#062958] text-center mt-3 opacity-70">
                      Check back later or browse all hymns.
                    </Text>
                  </View>
                )}
              </View>
              <View className="mt-auto">
                <TouchableOpacity
                  className="shadow-md "
                  onPress={() =>
                    router.push({
                      pathname: "/all-hymns/[id]",
                      params: { id: randomHymn?.id || "" },
                    })
                  }
                >
                  <Text className="mt-12 text-2xl font-bold text-[#062958]">
                    Read More...
                  </Text>
                </TouchableOpacity>
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
                  <ActivityIndicator size="small" color="#062958" />
                  <Text className="ml-2 text-base text-[#062958] opacity-70">
                    Loading categories...
                  </Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity onPress={() => handleCategorySort("all")}>
                    <Text
                      className={`flex items-center justify-center px-4 py-2 rounded-full font-semibold mr-3 ${
                        selectedCategory === "all" || selectedCategory === ""
                          ? "bg-[#071c49] text-white"
                          : "bg-[#F6F1DA] text-[#062958]"
                      }`}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                  {categories.map((cat: any) => {
                    const isSelected = selectedCategory === String(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => handleCategorySort(cat.id)}
                      >
                        <Text
                          className={`flex items-center justify-center px-4 py-2 rounded-full font-semibold mr-3 ${
                            isSelected
                              ? "bg-[#071c49] text-white"
                              : "bg-[#F6F1DA] text-[#062958]"
                          }`}
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

          <View className="flex-1 px-5 mt-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-2xl font-semibold text-[#062958]">
                Recently Favorite
              </Text>
              {!isPremium && favorites.length >= FREE_FAVORITES_LIMIT && (
                <TouchableOpacity onPress={() => router.push("/premium")}>
                  <Text className="text-sm text-[#0B489A]">
                    Upgrade for unlimited
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={favorites}
              keyExtractor={(item, index) =>
                item?.id ? item.id.toString() : index.toString()
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/all-hymns/[id]",
                      params: { id: item?.id },
                    })
                  }
                  className="flex flex-row items-center justify-between py-3 border-b border-[#E4E4E4]"
                >
                  <View className="flex flex-row items-center gap-6">
                    <Text className="text-lg text-[#062958]">
                      {item?.number}
                    </Text>
                    <Text className="text-lg text-[#062958]">
                      {item?.title}
                    </Text>
                  </View>
                  <Image
                    source={require("../assets/icons/favorite.png")}
                    className="h-6 w-6"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={() => (
                <Text className="text-center text-[#062958] mt-4">
                  No favorite hymns yet. Start adding some!
                </Text>
              )}
            />
          </View>
        </SafeAreaView>
      )}

      {Platform.OS === "ios" && (
        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.colors.background }}
        >
          <StatusBar
            barStyle={theme.isDark ? "light-content" : "dark-content"}
            backgroundColor={theme.colors.background}
          />
          <View className="mt-5 px-5">
            <View className="flex flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-4">
                <TouchableOpacity onPress={() => setSidebarOpen(true)}>
                  <Image
                    source={require("../assets/icons/book.png")}
                    className="h-7 w-7"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <Text style={{ color: theme.colors.text }} className="text-3xl">
                  Hymns
                </Text>
                {selectedDenomination && (
                  <TouchableOpacity
                    onPress={() => setSidebarOpen(true)}
                    style={{
                      backgroundColor: theme.colors.card,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 20,
                    }}
                  >
                    <Text
                      style={{ color: theme.colors.text }}
                      className="text-sm font-semibold"
                    >
                      {selectedDenomination.name}
                      {selectedDenomination.slug === "catholic" &&
                      selectedPeriod
                        ? ` (${selectedPeriod === "new" ? "New" : "Old"})`
                        : ""}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={handleAllHymnPress}>
                  <Text
                    style={{ color: theme.colors.textSecondary }}
                    className="text-lg"
                  >
                    View all
                  </Text>
                </TouchableOpacity>
                {isPremium && (
                  <TouchableOpacity
                    onPress={() => router.push("/(tabs)/settings")}
                  >
                    <Text
                      style={{ color: theme.colors.textSecondary }}
                      className="text-lg font-semibold"
                    >
                      ⚙️
                    </Text>
                  </TouchableOpacity>
                )}
                {isPremium && (
                  <TouchableOpacity onPress={() => router.push("/premium")}>
                    <Text
                      style={{ color: theme.colors.textSecondary }}
                      className="text-lg font-semibold"
                    >
                      Sheet Library
                    </Text>
                  </TouchableOpacity>
                )}
                {!isPremium && (
                  <TouchableOpacity onPress={() => router.push("/premium")}>
                    <Text
                      style={{ color: theme.colors.textSecondary }}
                      className="text-lg font-semibold"
                    >
                      Premium
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Denomination Sidebar */}
            <DenominationSidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />

            {randomHymn && (
              <View
                className={`flex flex-col border-2 border-[#E4E4E4] ${
                  responsive.isSmallPhone ? "h-[280px]" : "h-[340px]"
                } mt-5 rounded-3xl p-5`}
              >
                <Text className="text-2xl font-semibold text-[#062958]">
                  Hymn of the Day
                </Text>
                <View
                  className={`border bg-[#FFFEF1] ${
                    responsive.isSmallPhone ? "h-[185px]" : "h-[245px]"
                  } rounded-3xl mt-3 p-5`}
                >
                  <View className="flex flex-col h-full">
                    <Text className="font-bold text-[#062958] text-xl">
                      {randomHymn.number}
                    </Text>
                    <Text className="font-bold mt-3 text-[#062958] text-xl">
                      {randomHymn.title}
                    </Text>
                    <Text className="text-xl mt-3 text-[#062958]">
                      {(randomHymn.verses && randomHymn.verses[0]?.text) ||
                        "No lyrics available"}
                    </Text>
                    <TouchableOpacity
                      className="shadow-md"
                      onPress={() =>
                        router.push({
                          pathname: "/all-hymns/[id]",
                          params: { id: randomHymn.id },
                        })
                      }
                    >
                      <Text
                        className={`mt-${
                          responsive.isSmallPhone ? "10" : "4"
                        } text-2xl font-bold text-[#062958]`}
                      >
                        Read More...
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-5 my-6"
            >
              {categories.map((cat: any) => {
                const isSelected = selectedCategory === String(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => handleCategorySort(cat.id)}
                  >
                    <Text
                      className={`flex items-center justify-center px-4 py-2 rounded-full font-semibold mr-3 ${
                        isSelected
                          ? "bg-[#071c49] text-white"
                          : "bg-[#F6F1DA] text-[#062958]"
                      }`}
                    >
                      {cat?.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View className="flex-1 px-5 mt-2">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-2xl font-semibold text-[#062958]">
                Recently Favorite
              </Text>
              {!isPremium && favorites.length >= FREE_FAVORITES_LIMIT && (
                <TouchableOpacity onPress={() => router.push("/premium")}>
                  <Text className="text-sm text-[#0B489A]">
                    Upgrade for unlimited
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={favorites}
              keyExtractor={(item, index) =>
                item?.id ? item.id.toString() : index.toString()
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/all-hymns/[id]",
                      params: { id: item?.id },
                    })
                  }
                  className="flex flex-row items-center justify-between py-3 border-b border-[#E4E4E4]"
                >
                  <View className="flex flex-row items-center gap-6">
                    <Text className="text-lg text-[#062958]">
                      {item?.number}
                    </Text>
                    <Text className="text-lg text-[#062958]">
                      {item?.title}
                    </Text>
                  </View>
                  <Image
                    source={require("../assets/icons/favorite.png")}
                    className="h-6 w-6"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={() => (
                <Text className="text-center text-[#062958] mt-4">
                  No favorite hymns yet. Start adding some!
                </Text>
              )}
            />
          </View>
        </SafeAreaView>
      )}
    </>
  );
};

export default HomeScreen;
