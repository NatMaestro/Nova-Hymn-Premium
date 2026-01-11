import {
  View,
  Text,
  Image,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import React, { useState } from "react";
import SearchComponent from "@/components/Search";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getCategories, getHymns } from "@/lib/api";
import { Hymn } from "@/types";
import { useDenomination } from "@/contexts/DenominationContext";
import { useTheme } from "@/contexts/ThemeContext";
import DenominationSidebar from "@/components/DenominationSidebar";

const AllHymns = () => {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const { selectedDenomination, selectedPeriod } = useDenomination();
  const { theme } = useTheme();
  const [categories, setCategories] = useState<Array<any>>([]);
  const [dataItem, setDataItem] = useState<Hymn[]>([]);
  const [searchedData, setSearchedData] = useState<Hymn[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(category || "all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterAuthor, setFilterAuthor] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const params: any = {};
        if (selectedDenomination) {
          params.denomination = selectedDenomination.id;
          if (selectedDenomination.slug === "catholic" && selectedPeriod) {
            params.hymn_period = selectedPeriod;
          }
        }
        const response = await getHymns(params);
        // Transform HymnListResponse[] to Hymn[]
        const hymns: Hymn[] = response.results.map((h) => ({
          id: h.id,
          number: h.number,
          title: h.title,
          slug: h.slug,
          author: h.author,
          author_name: h.author_name,
          category: h.category,
          category_name: h.category_name,
          language: h.language,
          is_premium: h.is_premium,
          is_featured: h.is_featured,
          view_count: h.view_count,
          created_at: h.created_at,
        }));
        setDataItem(hymns);
        setSearchedData(hymns);
      } catch (error) {
        console.error("Error fetching hymns:", error);
      }
    };
    fetchData();
  }, [selectedDenomination, selectedPeriod]);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await getCategories();
        setCategories(categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  React.useEffect(() => {
    if (!dataItem || dataItem.length === 0) return;

    if (category && category !== "all") {
      // Convert category param to number for comparison
      const categoryId = Number(category);
      if (!isNaN(categoryId)) {
        const filtered = dataItem.filter((item) => {
          const itemCategoryId =
            typeof item.category === "number"
              ? item.category
              : typeof item.category === "string"
              ? Number(item.category)
              : 0;
          return itemCategoryId === categoryId;
        });
        setSearchedData(filtered);
        setSelectedCategory(String(categoryId)); // Ensure it's a string for comparison
      } else {
        // If category is a string (name), find by name
        const filtered = dataItem.filter((item) => {
          const itemCategoryName = item.category_name || String(item.category);
          return itemCategoryName.toLowerCase() === category.toLowerCase();
        });
        setSearchedData(filtered);
        // Try to find the category ID from the name
        const matchedCat = categories.find(
          (cat: any) => cat.name?.toLowerCase() === category.toLowerCase()
        );
        setSelectedCategory(matchedCat ? String(matchedCat.id) : category);
      }
    } else {
      setSearchedData(dataItem);
      setSelectedCategory("all");
    }
  }, [category, dataItem, categories]);

  const categorySort = (categoryId: string | number) => {
    let filteredItem: Hymn[];
    const categoryIdStr = String(categoryId).toLowerCase();

    if (categoryIdStr === "all" || categoryId === "ALL") {
      filteredItem = dataItem;
      setSelectedCategory("all");
    } else {
      // Find the category by ID (can be number or string)
      const matchedCategory = categories.find((cat: any) => {
        const catId = String(cat.id).toLowerCase();
        const searchId = categoryIdStr;
        return catId === searchId;
      });

      if (matchedCategory) {
        // Filter by category ID (number comparison)
        const categoryIdNum =
          typeof matchedCategory.id === "number"
            ? matchedCategory.id
            : Number(matchedCategory.id);

        filteredItem = dataItem.filter((item) => {
          const itemCategoryId =
            typeof item.category === "number"
              ? item.category
              : typeof item.category === "string"
              ? Number(item.category)
              : 0;
          return itemCategoryId === categoryIdNum;
        });
        setSelectedCategory(String(matchedCategory.id));
      } else {
        filteredItem = [];
        setSelectedCategory(String(categoryId));
      }
    }

    setSearchedData(filteredItem);
  };

  const applyFilters = (searchQuery: string = "") => {
    let filteredData = dataItem;

    // Text search
    if (searchQuery.trim()) {
      filteredData = filteredData.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.number.toString().includes(searchQuery.toLowerCase()) ||
          (item.author &&
            String(item.author)
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
      );
    }

    // Advanced filters
    if (filterAuthor) {
      filteredData = filteredData.filter(
        (item) =>
          item.author &&
          String(item.author).toLowerCase().includes(filterAuthor.toLowerCase())
      );
    }

    if (filterLanguage) {
      filteredData = filteredData.filter(
        (item) =>
          item.language &&
          item.language.toLowerCase().includes(filterLanguage.toLowerCase())
      );
    }

    setSearchedData(filteredData);
  };

  const handleSearch = (query: string) => {
    applyFilters(query);
  };

  const clearFilters = () => {
    setFilterAuthor("");
    setFilterLanguage("");
    applyFilters();
  };

  const truncateTitle = (title: string, maxLength = 25): string => {
    return title.length > maxLength
      ? title.slice(0, maxLength - 3) + "..."
      : title;
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      {Platform.OS === "android" && (
        <SafeAreaView className="flex-1 bg-[#FFFEF1] px-5">
          <StatusBar barStyle="dark-content" backgroundColor="#FFFEF1" />

          <View className="mt-7">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={handleBack}>
                <Image
                  source={require("../../assets/icons/back.png")}
                  className="h-6 w-6"
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSidebarOpen(true)}
                className="flex-row items-center gap-2 bg-[#F6F1DA] px-3 py-2 rounded-full"
              >
                <Image
                  source={require("../../assets/icons/book.png")}
                  className="h-5 w-5"
                  resizeMode="contain"
                />
                <Text className="text-sm text-[#062958] font-semibold">
                  {selectedDenomination
                    ? `${selectedDenomination.name}${
                        selectedDenomination.slug === "catholic" &&
                        selectedPeriod
                          ? ` (${selectedPeriod === "new" ? "New" : "Old"})`
                          : ""
                      }`
                    : "Select Denomination"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mt-5">
            <Text className="text-4xl text-[#062958] text-start mt-5 font-onest font-bold">
              All Hymns
            </Text>
          </View>

          {/* Denomination Sidebar */}
          <DenominationSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-4"
            >
              <TouchableOpacity onPress={() => categorySort("all")}>
                <Text
                  className={`flex items-center justify-center px-4 py-2 rounded-full font-semibold mr-3 ${
                    selectedCategory === "all"
                      ? "bg-navy text-white"
                      : "bg-[#F6F1DA] text-[#062958]"
                  }`}
                >
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => {
                const catIdStr = String(cat.id);
                const isSelected = selectedCategory === catIdStr;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => categorySort(catIdStr)}
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

          <SearchComponent onSearch={handleSearch} />

          {/* Advanced Filters (Premium) */}
          <View className="px-5 mt-2">
            <TouchableOpacity
              onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex-row items-center justify-between py-2"
            >
              <Text className="text-[#0B489A] font-semibold">
                {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
              </Text>
              <Text className="text-xs text-[#062958] opacity-75">Premium</Text>
            </TouchableOpacity>

            {showAdvancedFilters && (
              <View className="bg-[#FFFEF1] p-4 rounded-lg mt-2 border border-[#E4E4E4]">
                <Text className="text-lg font-semibold text-[#062958] mb-3">
                  Filter by:
                </Text>

                <View className="mb-3">
                  <Text className="text-sm text-[#062958] mb-1">Author</Text>
                  <TextInput
                    placeholder="Search by author..."
                    value={filterAuthor}
                    onChangeText={(text) => {
                      setFilterAuthor(text);
                      setTimeout(() => applyFilters(), 0);
                    }}
                    className="bg-white px-3 py-2 rounded border border-[#E4E4E4] text-[#062958]"
                    style={{ fontSize: 16 }}
                  />
                </View>

                <View className="mb-3">
                  <Text className="text-sm text-[#062958] mb-1">Language</Text>
                  <TextInput
                    placeholder="Search by language..."
                    value={filterLanguage}
                    onChangeText={(text) => {
                      setFilterLanguage(text);
                      setTimeout(() => applyFilters(), 0);
                    }}
                    className="bg-white px-3 py-2 rounded border border-[#E4E4E4] text-[#062958]"
                    style={{ fontSize: 16 }}
                  />
                </View>

                {(filterAuthor || filterLanguage) && (
                  <TouchableOpacity
                    onPress={clearFilters}
                    className="bg-[#E4E4E4] py-2 rounded mt-2"
                  >
                    <Text className="text-center text-[#062958] font-semibold">
                      Clear Filters
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View className="flex-1 px-5 mt-4">
            <FlatList
              data={searchedData}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/all-hymns/[id]",
                      params: { id: item.id },
                    })
                  }
                  className="flex flex-row items-center justify-between py-3 border-b border-[#E4E4E4]"
                >
                  <View className="flex flex-row items-center">
                    <Text className="text-xl text-[#062958] w-12">
                      {item.number}
                    </Text>
                    <Text className="text-2xl text-[#062958] font-semibold ml-6">
                      {truncateTitle(item.title)}
                    </Text>
                  </View>
                  <Image
                    source={require("../../assets/icons/forward.png")}
                    className="h-6 w-6"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={() => (
                <Text className="text-center text-[#062958] mt-4">
                  No hymns found.
                </Text>
              )}
            />
          </View>
        </SafeAreaView>
      )}

      {Platform.OS === "ios" && (
        <SafeAreaView className="flex-1 bg-[#FFFEF1] px-10">
          <StatusBar barStyle="dark-content" backgroundColor="#FFFEF1" />

          <View className="mt-7 px-3">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={handleBack}>
                <Image
                  source={require("../../assets/icons/back.png")}
                  className="h-6 w-6"
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSidebarOpen(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: theme.colors.card,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
              >
                <Image
                  source={require("../../assets/icons/book.png")}
                  className="h-5 w-5"
                  resizeMode="contain"
                />
                <Text
                  style={{ color: theme.colors.text }}
                  className="text-sm font-semibold"
                >
                  {selectedDenomination
                    ? `${selectedDenomination.name}${
                        selectedDenomination.slug === "catholic" &&
                        selectedPeriod
                          ? ` (${selectedPeriod === "new" ? "New" : "Old"})`
                          : ""
                      }`
                    : "Select Denomination"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mt-5 px-3">
            <Text className="text-4xl text-[#062958] text-start mt-5 font-onest font-bold">
              All Hymns
            </Text>
          </View>

          {/* Denomination Sidebar */}
          <DenominationSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <View className="px-3">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-4"
            >
              <TouchableOpacity onPress={() => categorySort("all")}>
                <Text
                  className={`flex items-center justify-center px-4 py-2 rounded-full font-semibold mr-3 ${
                    selectedCategory === "all"
                      ? "bg-navy text-white"
                      : "bg-[#F6F1DA] text-[#062958]"
                  }`}
                >
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => {
                const catIdStr = String(cat.id);
                const isSelected = selectedCategory === catIdStr;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => categorySort(catIdStr)}
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

          <View className="px-3">
            <SearchComponent onSearch={handleSearch} />
          </View>

          <View className="px-10 mt-2"></View>

          {/* Advanced Filters (Premium) */}
          <View className="px-5 mt-2">
            <TouchableOpacity
              onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex-row items-center justify-between py-2"
            >
              <Text className="text-[#0B489A] font-semibold">
                {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
              </Text>
              <Text className="text-xs text-[#062958] opacity-75">Premium</Text>
            </TouchableOpacity>

            {showAdvancedFilters && (
              <View className="bg-[#FFFEF1] p-4 rounded-lg mt-2 border border-[#E4E4E4]">
                <Text className="text-lg font-semibold text-[#062958] mb-3">
                  Filter by:
                </Text>

                <View className="mb-3">
                  <Text className="text-sm text-[#062958] mb-1">Author</Text>
                  <TextInput
                    placeholder="Search by author..."
                    value={filterAuthor}
                    onChangeText={(text) => {
                      setFilterAuthor(text);
                      setTimeout(() => applyFilters(), 0);
                    }}
                    className="bg-white px-3 py-2 rounded border border-[#E4E4E4] text-[#062958]"
                    style={{ fontSize: 16 }}
                  />
                </View>

                <View className="mb-3">
                  <Text className="text-sm text-[#062958] mb-1">Language</Text>
                  <TextInput
                    placeholder="Search by language..."
                    value={filterLanguage}
                    onChangeText={(text) => {
                      setFilterLanguage(text);
                      setTimeout(() => applyFilters(), 0);
                    }}
                    className="bg-white px-3 py-2 rounded border border-[#E4E4E4] text-[#062958]"
                    style={{ fontSize: 16 }}
                  />
                </View>

                {(filterAuthor || filterLanguage) && (
                  <TouchableOpacity
                    onPress={clearFilters}
                    className="bg-[#E4E4E4] py-2 rounded mt-2"
                  >
                    <Text className="text-center text-[#062958] font-semibold">
                      Clear Filters
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View className="flex-1 px-5 mt-4">
            <FlatList
              data={searchedData}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/all-hymns/[id]",
                      params: { id: item.id },
                    })
                  }
                  className="flex flex-row items-center justify-between py-3 border-b border-[#E4E4E4]"
                >
                  <View className="flex flex-row items-center">
                    <Text className="text-xl text-[#062958] w-12">
                      {item.number}
                    </Text>
                    <Text className="text-2xl text-[#062958] font-semibold ml-6">
                      {truncateTitle(item.title)}
                    </Text>
                  </View>
                  <Image
                    source={require("../../assets/icons/forward.png")}
                    className="h-6 w-6"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={() => (
                <Text className="text-center text-[#062958] mt-4">
                  No hymns found.
                </Text>
              )}
            />
          </View>
        </SafeAreaView>
      )}
    </>
  );
};

export default AllHymns;
