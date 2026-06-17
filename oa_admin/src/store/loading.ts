import { reactive } from 'vue';

interface LoadingState {
  global: boolean;
  page: Record<string, boolean>;
  component: Record<string, boolean>;
}

export const loadingState = reactive<LoadingState>({
  global: false,
  page: {},
  component: {}
});

export const Loading = {
  show(key = 'global') {
    if (key === 'global') {
      loadingState.global = true;
    } else if (key.startsWith('page-')) {
      loadingState.page[key] = true;
    } else {
      loadingState.component[key] = true;
    }
  },

  hide(key = 'global') {
    if (key === 'global') {
      loadingState.global = false;
    } else if (key.startsWith('page-')) {
      delete loadingState.page[key];
    } else {
      delete loadingState.component[key];
    }
  },

  isLoading(key = 'global') {
    if (key === 'global') {
      return loadingState.global;
    } else if (key.startsWith('page-')) {
      return loadingState.page[key] || false;
    } else {
      return loadingState.component[key] || false;
    }
  },

  async wrap<T>(promise: Promise<T>, key = 'global'): Promise<T> {
    this.show(key);
    try {
      return await promise;
    } finally {
      this.hide(key);
    }
  }
};
