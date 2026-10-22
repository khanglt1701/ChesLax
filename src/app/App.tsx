import { QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './router';
import { queryClient } from './queryClient';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  );
}
