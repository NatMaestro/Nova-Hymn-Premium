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
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import SearchComponent from "@/components/Search";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Hymn } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";
import { useDenomination } from "@/contexts/DenominationContext";
import DenominationSidebar from "@/components/DenominationSidebar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchHymns } from "@/store/slices/hymnsSlice";
import { fetchCategories } from "@/store/slices/categoriesSlice";
import { RootState } from "@/store";
import {
  selectHymnsByDenomination,
  selectHymnsLoading,
  selectAllCategories,
  selectCategoriesLoading,
} from "@/store/selectors";

const AllHymns = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { selectedDenomination, selectedPeriod } = useDenomination();
  const { category } = useLocalSearchParams<{ category: string }>();
  const dispatch = useAppDispatch();
  const [searchedData, setSearchedData] = useState<Hymn[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(category || "all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterAuthor, setFilterAuthor] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redux selectors
  const dataItem = useAppSelector((state: RootState) =>
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

  // Update searchedData when dataItem changes
  React.useEffect(() => {
    setSearchedData(dataItem);
  }, [dataItem]);

  // Fetch categories from Redux (with caching)
  React.useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  React.useEffect(() => {
    if (!dataItem || dataItem.length === 0) return;

    if (category && category !== "all") {
      // Convert category param to number for comparison
      const categoryId = Number(category);
      if (!isNaN(categoryId)) {
        const filtered = dataItem.filter((item: Hymn) => {
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
        const filtered = dataItem.filter((item: Hymn) => {
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
    if (!dataItem || dataItem.length === 0) {
      setSearchedData([]);
      return;
    }

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

        filteredItem = dataItem.filter((item: Hymn) => {
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
    if (!dataItem || dataItem.length === 0) {
      setSearchedData([]);
      return;
    }

    let filteredData = dataItem;

    // Text search
    if (searchQuery.trim()) {
      filteredData = filteredData.filter(
        (item: Hymn) =>
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
        (item: Hymn) =>
          item.author &&
          String(item.author).toLowerCase().includes(filterAuthor.toLowerCase())
      );
    }

    if (filterLanguage) {
      filteredData = filteredData.filter(
        (item: Hymn) =>
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

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.colors.background }}
    >
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />

      <View className="mt-7 px-5">
        <View className="flex-row items-center justify-between">
          <Text
            className="text-4xl font-bold"
            style={{ color: theme.colors.text }}
          >
            All Hymns
          </Text>
          <TouchableOpacity
            onPress={() => setSidebarOpen(true)}
            className="flex-row items-center gap-2 px-3 py-2 rounded-full"
            style={{ backgroundColor: theme.colors.card }}
          >
            <Image
              source={require("../../assets/icons/book.png")}
              className="h-5 w-5"
              resizeMode="contain"
            />
            <Text
              className="text-xs font-semibold"
              style={{ color: theme.colors.text }}
            >
              {selectedDenomination
                ? `${selectedDenomination.name}${
                    selectedDenomination.slug === "catholic" && selectedPeriod
                      ? ` (${selectedPeriod === "new" ? "New" : "Old"})`
                      : ""
                  }`
                : "Select"}
            </Text>
          </TouchableOpacity>
        </View>
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
          className="mt-4 px-5"
        >
          {loadingCategories ? (
            <View className="flex-row items-center px-4">
              <ActivityIndicator size="small" color={theme.colors.navy} />
              <Text
                className="ml-2 text-base"
                style={{ color: theme.colors.textSecondary }}
              >
                Loading categories...
              </Text>
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={() => categorySort("all")}>
                <Text
                  className={`px-4 py-2 rounded-full font-semibold mr-3 ${
                    selectedCategory === "all" ? "text-white" : ""
                  }`}
                  style={{
                    backgroundColor:
                      selectedCategory === "all"
                        ? theme.colors.navy
                        : theme.colors.accent,
                    color:
                      selectedCategory === "all" ? "white" : theme.colors.text,
                  }}
                >
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((cat: any) => {
                const catIdString = String(cat.id);
                const isSelected = selectedCategory === catIdString;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => categorySort(catIdString)}
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

      <SearchComponent onSearch={handleSearch} />

      {/* Advanced Filters (Premium) */}
      <View className="px-5 mt-2">
        <TouchableOpacity
          onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex-row items-center justify-between py-2"
        >
          <Text
            className="font-semibold"
            style={{ color: theme.colors.textSecondary }}
          >
            {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
          </Text>
          <Text
            className="text-xs opacity-75"
            style={{ color: theme.colors.text }}
          >
            Premium
          </Text>
        </TouchableOpacity>

        {showAdvancedFilters && (
          <View
            className="p-4 rounded-lg mt-2 border"
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            }}
          >
            <Text
              className="text-lg font-semibold mb-3"
              style={{ color: theme.colors.text }}
            >
              Filter by:
            </Text>

            <View className="mb-3">
              <Text
                className="text-sm mb-1"
                style={{ color: theme.colors.text }}
              >
                Author
              </Text>
              <TextInput
                placeholder="Search by author..."
                placeholderTextColor={theme.colors.textSecondary}
                value={filterAuthor}
                onChangeText={(text) => {
                  setFilterAuthor(text);
                  setTimeout(() => applyFilters(), 0);
                }}
                className="bg-white px-3 py-2 rounded border"
                style={{
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  fontSize: 16,
                }}
              />
            </View>

            <View className="mb-3">
              <Text
                className="text-sm mb-1"
                style={{ color: theme.colors.text }}
              >
                Language
              </Text>
              <TextInput
                placeholder="Search by language..."
                placeholderTextColor={theme.colors.textSecondary}
                value={filterLanguage}
                onChangeText={(text) => {
                  setFilterLanguage(text);
                  setTimeout(() => applyFilters(), 0);
                }}
                className="bg-white px-3 py-2 rounded border"
                style={{
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  fontSize: 16,
                }}
              />
            </View>

            {(filterAuthor || filterLanguage) && (
              <TouchableOpacity
                onPress={clearFilters}
                className="py-2 rounded mt-2"
                style={{ backgroundColor: theme.colors.border }}
              >
                <Text
                  className="text-center font-semibold"
                  style={{ color: theme.colors.text }}
                >
                  Clear Filters
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View className="flex-1 px-5 mt-4">
        {loadingHymns ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color={theme.colors.navy} />
            <Text
              className="text-lg mt-4 text-center"
              style={{ color: theme.colors.textSecondary }}
            >
              Loading hymns...
            </Text>
          </View>
        ) : (
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
                className="flex-row items-center justify-between py-3 border-b"
                style={{ borderBottomColor: theme.colors.border }}
              >
                <View className="flex-row items-center">
                  <Text
                    className="text-xl w-12"
                    style={{ color: theme.colors.text }}
                  >
                    {item.number}
                  </Text>
                  <Text
                    className="text-xl font-semibold ml-6"
                    style={{ color: theme.colors.text }}
                  >
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
              <Text
                className="text-center mt-4"
                style={{ color: theme.colors.text }}
              >
                No hymns found.
              </Text>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default AllHymns;
