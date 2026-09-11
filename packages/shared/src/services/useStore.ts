import { useSyncExternalStore } from 'react';
import { globalStore, AppState } from './appStore';

export function useTeaNestStore(): {
  state: AppState;
  store: typeof globalStore;
} {
  const state = useSyncExternalStore(
    (callback) => globalStore.subscribe(callback),
    () => globalStore.getState()
  );

  return { state, store: globalStore };
}
