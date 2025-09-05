import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PeopleListScreen from '../app/index';
import { initDb, insertPerson } from '../lib/db';

describe('People list screen', () => {
  beforeEach(async () => {
    await initDb();
  });

  test('when empty, shows empty state; adding person appears', async () => {
    const { getByText, queryByText, rerender } = render(<PeopleListScreen />);

    await waitFor(() => {
      expect(getByText('No people yet.')).toBeTruthy();
    });

    await insertPerson({ firstName: 'Ada', lastName: 'Lovelace' });

    // Trigger reload (useEffect runs again on rerender)
    rerender(<PeopleListScreen />);

    await waitFor(() => {
      expect(queryByText('No people yet.')).toBeNull();
      expect(getByText('Ada Lovelace')).toBeTruthy();
    });
  });
});

