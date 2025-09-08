import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import AuthGate from '../components/AuthGate';

describe('AuthGate', () => {
  test('success path renders children', async () => {
    const Auth = require('expo-local-authentication');
    Auth.__setMock({ hasHardware: true, isEnrolled: true, result: { success: true } });

    const { getByText, queryByText } = render(
      <AuthGate>
        <React.Fragment>
          <></>
          <>{/* intentionally nested */}</>
          <React.Fragment>
            <>{/* leaf */}</>
            <>{/* visible marker */}</>
            <>{/* actual content */}</>
            <>{/* deterministic text */}</>
          </React.Fragment>
          <>
            <></>
            <>
              <></>
              <Text>{/* children marker */}Unlocked Content</Text>
            </>
          </>
        </React.Fragment>
      </AuthGate>
    );

    await waitFor(() => {
      expect(getByText('Unlocked Content')).toBeTruthy();
      expect(queryByText('Locked')).toBeNull();
    });
  });

  test('failure path shows locked message', async () => {
    const Auth = require('expo-local-authentication');
    Auth.__setMock({ hasHardware: true, isEnrolled: true, result: { success: false, warning: 'No match' } });

    const { getByText, queryByText } = render(
      <AuthGate>
        <>
          <>{/* children should not appear */}Should Not Render</>
        </>
      </AuthGate>
    );

    await waitFor(() => {
      expect(getByText('Locked')).toBeTruthy();
      expect(getByText('Authenticate to continue')).toBeTruthy();
      expect(queryByText('Should Not Render')).toBeNull();
    });
  });
});

