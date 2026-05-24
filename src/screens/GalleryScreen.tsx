import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';

const GalleryScreen = () => {
  const [images] = useState([
    'https://via.placeholder.com/150',
    'https://via.placeholder.com/150/0000FF',
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📸 Event Gallery</Text>

      <FlatList
        data={images}
        numColumns={2}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.image} />
        )}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>➕ Add Photo</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  image: {
    width: '48%',
    height: 150,
    margin: '1%',
    borderRadius: 10,
  },
  button: {
    marginTop: 15,
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default GalleryScreen;