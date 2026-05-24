import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  TextInput,
} from 'react-native';

const LibraryScreen = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('engineering');

  useEffect(() => {
    fetchBooks('engineering');
  }, []);

  const fetchBooks = async (search: string) => {
    try {
      setLoading(true);

      const response = await fetch(
        `https://openlibrary.org/search.json?q=${search}`
      );
      const data = await response.json();

      const formatted = data.docs.slice(0, 20).map((item: any) => ({
        id: item.key,
        title: item.title,
        author: item.author_name ? item.author_name[0] : 'Unknown',
        link: `https://openlibrary.org${item.key}`,
      }));

      setBooks(formatted);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const openBook = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📚 E-Library</Text>

      {/* 🔍 SEARCH BAR */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search books..."
          value={query}
          onChangeText={setQuery}
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => fetchBooks(query)}
        >
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* 📦 LOADING */}
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" />
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => openBook(item.link)}
            >
              <Text style={styles.bookTitle}>{item.title}</Text>
              <Text style={styles.bookAuthor}>{item.author}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  title: {
    fontSize: 22,
    marginBottom: 10,
    fontWeight: 'bold',
  },

  searchContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },

  input: {
    flex: 1,
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },

  searchButton: {
    backgroundColor: '#2563EB',
    padding: 10,
    marginLeft: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },

  card: {
    padding: 15,
    backgroundColor: '#f3f4f6',
    marginBottom: 10,
    borderRadius: 8,
  },

  bookTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },

  bookAuthor: {
    color: '#555',
  },

  buttonText: {
    color: '#fff',
  },
});

export default LibraryScreen;