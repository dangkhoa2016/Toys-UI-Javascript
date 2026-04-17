export function normalizeBackdrop(backdrop) {
  if (!backdrop || !backdrop.classList) {
    return;
  }

  backdrop.classList.add('fade', 'show');
}

export function findBackdrop(node) {
  if (!(node instanceof HTMLElement)) {
    return null;
  }

  if (node.classList.contains('modal-backdrop')) {
    return node;
  }

  return node.querySelector('.modal-backdrop');
}

export function stopModalBackdropObserver(target) {
  if (!target || !target.backdropObserver) {
    return;
  }

  target.backdropObserver.disconnect();
  target.backdropObserver = null;
}

export function armModalBackdropObserver(target) {
  if (!target) {
    return;
  }

  stopModalBackdropObserver(target);

  const existingBackdrop = document.querySelector('.modal-backdrop');
  if (existingBackdrop) {
    normalizeBackdrop(existingBackdrop);
    return;
  }

  target.backdropObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        const backdrop = findBackdrop(node);
        if (!backdrop) {
          continue;
        }

        normalizeBackdrop(backdrop);
        stopModalBackdropObserver(target);
        return;
      }
    }
  });

  target.backdropObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

export function focusFormField(root, selector = "[name='name']") {
  root?.querySelector(selector)?.focus();
}

export function resetManagedForm({
  form,
  stopObserver = null,
  clearBusyState = null,
  resetValidation = null,
  resetPreview = null,
  afterReset = null,
} = {}) {
  if (typeof stopObserver === 'function') {
    stopObserver();
  }

  form?.reset?.();

  if (typeof clearBusyState === 'function') {
    clearBusyState();
  }

  if (typeof resetValidation === 'function') {
    resetValidation();
  }

  if (typeof resetPreview === 'function') {
    resetPreview();
  }

  if (typeof afterReset === 'function') {
    afterReset();
  }
}
