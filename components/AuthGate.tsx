import React, { PropsWithChildren } from 'react';

// Stub gate for initial router wiring. Replaced with biometric logic later.
export default function AuthGate({ children }: PropsWithChildren): JSX.Element {
  return <>{children}</>;
}

