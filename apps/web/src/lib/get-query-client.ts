import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

// React.cache() ensures one QueryClient per request on the server,
// preventing data leakage between users.
const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute — avoids refetch on client mount after SSR
        },
      },
    })
);

export default getQueryClient;
