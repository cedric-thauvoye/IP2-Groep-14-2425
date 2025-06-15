import { useRouter } from 'vue-router';

/**
 * Composable for smart back navigation
 * Goes back in browser history if possible, otherwise falls back to a default route
 */
export function useBackNavigation(fallbackRoute = '/') {
  const router = useRouter();

  const goBack = (customFallback = null) => {
    const fallback = customFallback || fallbackRoute;

    // Check if there's actual history to go back to
    // window.history.length > 2 means there's at least one page before current
    if (window.history.length > 2) {
      router.go(-1);
    } else {
      router.push(fallback);
    }
  };

  return { goBack };
}
