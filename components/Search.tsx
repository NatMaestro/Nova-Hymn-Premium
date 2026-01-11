import { View, TextInput, Image, TouchableOpacity } from "react-native";
import { XMarkIcon } from "react-native-heroicons/outline";
import { useState } from "react";

export default function SearchComponent({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState("");

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  const handleChange = (text: string) => {
    setQuery(text);
    onSearch(text);
  };

  return (
    <View className="flex-row items-center w-full bg-[#FCF7E7] px-4 py-2 rounded-full shadow-md my-2 mt-5">
      <Image
        source={require("../assets/icons/searchIcon.png")}
        className="h-6 w-6"
        resizeMode="contain"
      />
      <TextInput
        className="flex-1 ml-2 text-2xl text-[#062958] font-onest font-bold"
        placeholder="Search hymns..."
        value={query}
        onChangeText={handleChange}
        onSubmitEditing={() => onSearch(query)}
        returnKeyType="search"
      />
      {query.length > 0 && (
        <TouchableOpacity onPress={handleClear}>
          <XMarkIcon size={20} color="gray" />
        </TouchableOpacity>
      )}
    </View>
  );
}


