'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { QueryClient } from '@tanstack/react-query';

export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures the QueryClient is stable across re-renders on the client
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
