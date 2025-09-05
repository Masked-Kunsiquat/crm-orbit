import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import PersonForm from '../../components/PersonForm';
import { insertPerson, type NewPerson } from '../../lib/db';

export default function NewPersonScreen(): React.ReactElement {
  const router = useRouter();

  async function handleSubmit(input: NewPerson): Promise<void> {
    try {
      const id = await insertPerson(input);
      router.replace(`/people/${id}`);
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message);
    }
  }

  return (
    <View style={styles.container}>
      <PersonForm onSubmit={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
});
