import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput } from "react-native-paper";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        label="Search"
        value={searchQuery}
        onChangeText={(text) => setSearchQuery(text)}
        style={styles.input}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  input: {
    backgroundColor: "white",
  },
});

export default SearchBar;
