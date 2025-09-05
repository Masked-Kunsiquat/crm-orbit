import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';

export default function PeopleListScreen(): JSX.Element {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.header}>People</Text>
      <Text style={styles.emptyText}>No people yet.</Text>
      <Link asChild href="/people/new">
        <Pressable accessibilityRole="button" style={styles.button}>
          <Text style={styles.buttonText}>Add Person</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
  },
  emptyText: {
    color: '#555',
  },
  button: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

