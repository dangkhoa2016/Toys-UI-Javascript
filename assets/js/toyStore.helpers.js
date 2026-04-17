import { normalizeToy } from './config.js';

export function createHighlightedToyState({ id = null, nonce = 0 } = {}) {
  return {
    id: id ? String(id) : null,
    nonce,
  };
}

export function createToyStoreState() {
  return {
    confirmDeleteToyId: null,
    editingToyId: null,
    highlightedToy: createHighlightedToyState(),
    searchTerm: '',
    sortOrder: 'default',
    toasts: [],
    toys: new Map(),
  };
}

export function normalizeSortOrder(payload) {
  return ['default', 'likes-desc', 'likes-asc'].includes(payload) ? payload : 'default';
}

export function setSearchTerm(state, payload) {
  state.searchTerm = payload || '';
}

export function setSortOrder(state, payload) {
  state.sortOrder = normalizeSortOrder(payload);
}

export function setHighlightedToyState(state, payload) {
  state.highlightedToy = createHighlightedToyState(payload);
  return state.highlightedToy;
}

export function flashToyState(state, toyId, { nonce = Date.now() } = {}) {
  return setHighlightedToyState(state, {
    id: toyId,
    nonce,
  });
}

export function clearHighlightedToyState(state) {
  return setHighlightedToyState(state);
}

export function getHighlightedToySignature(state) {
  const highlightedToy = state?.highlightedToy || createHighlightedToyState();
  return `${highlightedToy.id || ''}:${highlightedToy.nonce || 0}`;
}

export function syncToyState(state, toys) {
  const normalizedToys = Array.isArray(toys) ? toys.map((toy) => normalizeToy(toy)) : [];
  state.toys = new Map(normalizedToys.map((toy) => [String(toy.id), toy]));
}

export function prependToyState(state, payload) {
  const toy = normalizeToy(payload);
  state.toys = new Map([[String(toy.id), toy], ...state.toys.entries()]);
}

export function updateToyState(state, payload) {
  const toy = normalizeToy(payload);
  state.toys.set(String(toy.id), toy);
}

export function removeToyState(state, toyId) {
  state.toys.delete(String(toyId));
}

export function getVisibleToys(state) {
  const normalizedSearchTerm = (state.searchTerm || '').trim().toLowerCase();
  const toys = Array.from(state.toys.values()).filter((toy) => {
    if (!normalizedSearchTerm) {
      return true;
    }

    return (toy.name || '').toLowerCase().includes(normalizedSearchTerm);
  });

  if (state.sortOrder === 'likes-desc') {
    return toys.sort((left, right) => right.likes - left.likes || left.name.localeCompare(right.name));
  }

  if (state.sortOrder === 'likes-asc') {
    return toys.sort((left, right) => left.likes - right.likes || left.name.localeCompare(right.name));
  }

  return toys;
}

export function createToastPayload(payload) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: payload && payload.title ? payload.title : 'Toy Tale',
    message: payload && payload.message ? payload.message : '',
    variant: payload && payload.variant ? payload.variant : 'primary',
    delay: payload && payload.delay ? payload.delay : 5000,
  };
}

export function addToastState(state, payload) {
  const toast = createToastPayload(payload);
  state.toasts = [...state.toasts, toast];
  return toast;
}

export function removeToastState(state, payload) {
  state.toasts = state.toasts.filter((toast) => toast.id !== payload);
}

export function getToastMessage(error, fallbackMessage) {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (error && typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }

  if (error && typeof error.error === 'string' && error.error.trim()) {
    return error.error;
  }

  return fallbackMessage;
}
