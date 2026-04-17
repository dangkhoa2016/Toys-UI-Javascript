import { createToy, deleteToy, fetchOrSeedToys, likeToy, updateToy } from "./services/toyService.js";
import {
  addToastState,
  clearHighlightedToyState,
  createToyStoreState,
  flashToyState,
  getToastMessage,
  getVisibleToys,
  prependToyState,
  removeToastState,
  removeToyState,
  setSearchTerm,
  setSortOrder,
  syncToyState,
  updateToyState,
} from "./toyStore.helpers.js";
import {
  CHECKING_PREVIEW_MESSAGE,
  CHECKING_PREVIEW_PLACEHOLDER,
  CREATE_PREVIEW_MESSAGE,
  DEFAULT_PREVIEW_PLACEHOLDER,
  ERROR_PREVIEW_PLACEHOLDER,
  getImageError,
  getNameError,
  getPreviewLoadError,
  getSubmitDisableReason,
  IMAGE_PREVIEW_DEBOUNCE_MS,
  INVALID_PREVIEW_PLACEHOLDER,
  loadImagePreview,
  LOCKED_PREVIEW_MESSAGE,
  READY_PREVIEW_MESSAGE,
  TOY_IMAGE_VALIDATION_MESSAGES,
  UPDATE_PREVIEW_MESSAGE,
} from "./toyForm.js";
import {
  armModalBackdropObserver,
  focusFormField,
  resetManagedForm,
  stopModalBackdropObserver,
} from "./modalForm.js";
import {
  animateToyRemoval,
  createToast,
  markToyCardUpdated,
  reorderToyCards,
  renderToyList,
  setDeleteTarget,
  setEditTarget,
  setFieldError,
  setFormError,
  setImagePreview,
  setLoaderVisibility,
  resetFormValidation,
  setToyCardBusy,
  showCollectionMessage,
  toggleVisibility,
  updateToyLikes,
} from "./dom.js";
import { toApiImageUrl } from "./config.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const previewStateByForm = new WeakMap();
const formBusyStateByForm = new WeakMap();
let highlightedToyTimer = 0;

function requireElement(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

function shouldRerenderAfterLike(state) {
  return state.sortOrder !== "default";
}

function shouldReorderAfterLike(state) {
  return state.sortOrder === "likes-desc" || state.sortOrder === "likes-asc";
}

function getFormBusyState(form) {
  return formBusyStateByForm.get(form) || { isBusy: false, label: "" };
}

function setFormBusyState(form, isBusy, label = "") {
  formBusyStateByForm.set(form, {
    isBusy,
    label,
  });

  const submitButton = getFormSubmitButton(form);

  if (submitButton) {
    if (!submitButton.dataset.defaultLabel) {
      submitButton.dataset.defaultLabel = submitButton.textContent.trim();
    }

    submitButton.textContent = isBusy ? label || submitButton.dataset.defaultLabel : submitButton.dataset.defaultLabel;
  }

  form.querySelectorAll("input, button").forEach((field) => {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLButtonElement)) {
      return;
    }

    if (field === submitButton) {
      return;
    }

    field.disabled = isBusy;
  });
}

function getPreviewState(form) {
  const currentState = previewStateByForm.get(form);

  if (currentState) {
    return currentState;
  }

  const nextState = {
    source: "",
    status: "idle",
    timeoutId: 0,
    token: 0,
  };

  previewStateByForm.set(form, nextState);
  return nextState;
}

function patchPreviewState(form, updates) {
  const nextState = { ...getPreviewState(form), ...updates };

  previewStateByForm.set(form, nextState);
  return nextState;
}

function clearPreviewTimer(form) {
  const previewState = getPreviewState(form);

  if (previewState.timeoutId) {
    window.clearTimeout(previewState.timeoutId);
    patchPreviewState(form, { timeoutId: 0 });
  }
}

function readToyFormValues(form) {
  const formData = new FormData(form);

  return {
    name: String(formData.get("name") ?? "").trim(),
    image: String(formData.get("image") ?? "").trim(),
  };
}

function validateToyField(fieldName, values) {
  if (fieldName === "name") {
    return getNameError(values.name);
  }

  if (fieldName === "image") {
    const normalizedImageUrl = toApiImageUrl(values.image);

    return getImageError({
      value: values.image,
      normalizedImageUrl,
    });
  }

  return "";
}

function inspectToyForm(form, { currentToy = null } = {}) {
  const values = readToyFormValues(form);
  const fieldNames = ["name", "image"];
  const fieldErrors = new Map(
    fieldNames.map((fieldName) => [fieldName, validateToyField(fieldName, values)])
  );
  const hasFieldErrors = Array.from(fieldErrors.values()).some(Boolean);
  const normalizedImageUrl = values.image && !fieldErrors.get("image") ? toApiImageUrl(values.image) : "";
  let isUnchanged = false;

  if (currentToy && !hasFieldErrors) {
    const currentName = String(currentToy.name ?? "").trim();
    const currentImage = toApiImageUrl(currentToy.image);
    isUnchanged = values.name === currentName && normalizedImageUrl === currentImage;
  }

  return {
    fieldErrors,
    hasFieldErrors,
    isUnchanged,
    normalizedImageUrl,
    values,
  };
}

function getPreviewErrorMessage(formState, previewState) {
  if (formState.fieldErrors.get("image") || !formState.normalizedImageUrl) {
    return "";
  }

  return getPreviewLoadError({
    normalizedImageUrl: formState.normalizedImageUrl,
    preview: previewState,
  });
}

function getFormSubmitButton(form) {
  return form.querySelector(".toy-form-submit");
}

function validateToyForm(form, { currentToy = null } = {}) {
  const formState = inspectToyForm(form, { currentToy });
  const previewState = getPreviewState(form);
  const previewErrorMessage = getPreviewErrorMessage(formState, previewState);

  resetFormValidation(form);

  formState.fieldErrors.forEach((message, fieldName) => {
    if (message) {
      setFieldError(form, fieldName, message);
    }
  });

  if (previewErrorMessage) {
    setFieldError(form, "image", previewErrorMessage);
  }

  if (!formState.hasFieldErrors && !previewErrorMessage && formState.isUnchanged) {
    setFormError(form, "Update the name or image before saving.");
    return { isValid: false, values: formState.values };
  }

  if (!formState.hasFieldErrors && !previewErrorMessage) {
    const disableReason = getSubmitDisableReason({
      nameError: formState.fieldErrors.get("name"),
      imageError: formState.fieldErrors.get("image"),
      unchangedSubmitMessage: formState.isUnchanged ? "Update the name or image to enable save." : "",
      normalizedImageUrl: formState.normalizedImageUrl,
      preview: previewState,
    });

    if (disableReason) {
      setFormError(form, disableReason);
      return { isValid: false, values: formState.values };
    }
  }

  return {
    isValid: !formState.hasFieldErrors && !previewErrorMessage,
    values: formState.values,
  };
}

function updateFieldValidation(form, fieldName) {
  const values = readToyFormValues(form);
  const message = validateToyField(fieldName, values);

  setFieldError(form, fieldName, message);

  return !message;
}

function focusFirstInvalidField(form) {
  form.querySelector(".is-invalid")?.focus();
}

function resetImagePreview(form) {
  clearPreviewTimer(form);
  patchPreviewState(form, {
    source: "",
    status: "idle",
    timeoutId: 0,
    token: getPreviewState(form).token + 1,
  });
  setImagePreview(form, {
    status: "idle",
    message: CREATE_PREVIEW_MESSAGE,
    placeholderMessage: DEFAULT_PREVIEW_PLACEHOLDER,
  });
}

export async function initApp() {
  const elements = {
    collection: requireElement("#toy-collection"),
    loader: requireElement(".loader"),
    toTopButton: requireElement("#to-top"),
    addToyButton: requireElement("#new-toy-btn"),
    addToyModal: requireElement("#modal-add-toy"),
    addToyForm: requireElement("#add-toy-form"),
    editToyModal: requireElement("#modal-edit-toy"),
    editToyForm: requireElement("#edit-toy-form"),
    searchInput: requireElement("#toy-search"),
    sortSelect: requireElement("#toy-sort"),
    deleteModal: requireElement("#modal-delete-toy"),
    deleteConfirmButton: requireElement("#modal-delete-toy .btn-confirm"),
    toastRegion: requireElement("#toast-region"),
  };

  const state = createToyStoreState();

  const addToyModal = new bootstrap.Modal(elements.addToyModal);
  const editToyModal = new bootstrap.Modal(elements.editToyModal);
  const modalConfirm = new bootstrap.Modal(elements.deleteModal);

  function showAppToast({ title, message, variant = "primary", delay = 5000 }) {
    const toastPayload = addToastState(state, { title, message, variant, delay });
    const toastElement = createToast(toastPayload);
    const toast = new bootstrap.Toast(toastElement, {
      autohide: true,
      delay: toastPayload.delay,
    });

    elements.toastRegion.append(toastElement);
    toastElement.addEventListener(
      "hidden.bs.toast",
      () => {
        removeToastState(state, toastPayload.id);
        toastElement.remove();
      },
      { once: true }
    );

    toast.show();
  }

  function renderVisibleToys() {
    const visibleToys = getVisibleToys(state);
    const emptyMessage = state.toys.size
      ? "No toys match the current search or sort view."
      : "No toys available yet.";

    renderToyList(elements.collection, visibleToys, { emptyMessage });
  }

  function flashToyCard(toyId) {
    if (highlightedToyTimer) {
      window.clearTimeout(highlightedToyTimer);
    }

    flashToyState(state, toyId);
    markToyCardUpdated(elements.collection, toyId);
    highlightedToyTimer = window.setTimeout(() => {
      clearHighlightedToyState(state);
      highlightedToyTimer = 0;
    }, 700);
  }

  function getCurrentToyForForm(form) {
    if (form !== elements.editToyForm || !state.editingToyId) {
      return null;
    }

    return state.toys.get(String(state.editingToyId)) || null;
  }

  function syncFormSubmitState(form) {
    const submitButton = getFormSubmitButton(form);

    if (!submitButton) {
      return;
    }

    const formBusyState = getFormBusyState(form);
    const formState = inspectToyForm(form, { currentToy: getCurrentToyForForm(form) });
    const previewState = getPreviewState(form);
    const disableReason = formBusyState.isBusy
      ? formBusyState.label || "Submitting your request..."
      : getSubmitDisableReason({
          nameError: formState.fieldErrors.get("name"),
          imageError: formState.fieldErrors.get("image"),
          unchangedSubmitMessage: formState.isUnchanged ? "Update the name or image to enable save." : "",
          normalizedImageUrl: formState.normalizedImageUrl,
          preview: previewState,
        });
    const isDisabled = Boolean(disableReason);

    submitButton.disabled = isDisabled;
    submitButton.setAttribute("aria-disabled", String(isDisabled));
    submitButton.title = disableReason;
  }

  function queueImagePreview(form, { immediate = false } = {}) {
    const formState = inspectToyForm(form, { currentToy: getCurrentToyForForm(form) });
    const previewState = getPreviewState(form);

    clearPreviewTimer(form);

    if (formState.fieldErrors.get("image")) {
      patchPreviewState(form, {
        source: "",
        status: "idle",
        timeoutId: 0,
      });
      setImagePreview(form, {
        status: "idle",
        alt: `${formState.values.name || "Toy"} image preview`,
        message: "Enter a valid image URL or local toy image path to unlock submit.",
        placeholderMessage: INVALID_PREVIEW_PLACEHOLDER,
      });
      syncFormSubmitState(form);
      return;
    }

    if (!formState.normalizedImageUrl) {
      resetImagePreview(form);
      syncFormSubmitState(form);
      return;
    }

    if (
      previewState.source === formState.normalizedImageUrl &&
      (previewState.status === "pending" || previewState.status === "ready")
    ) {
      syncFormSubmitState(form);
      return;
    }

    const nextToken = previewState.token + 1;
    const schedulePreviewCheck = () => {
      patchPreviewState(form, {
        source: formState.normalizedImageUrl,
        status: "pending",
        timeoutId: 0,
        token: nextToken,
      });
      setImagePreview(form, {
        status: "pending",
        alt: `${formState.values.name || "Toy"} image preview`,
        message: CHECKING_PREVIEW_MESSAGE,
        placeholderMessage: CHECKING_PREVIEW_PLACEHOLDER,
      });
      syncFormSubmitState(form);

      loadImagePreview(formState.normalizedImageUrl)
        .then(() => {
          const latestPreviewState = getPreviewState(form);

          if (
            latestPreviewState.token !== nextToken ||
            latestPreviewState.source !== formState.normalizedImageUrl
          ) {
            return;
          }

          patchPreviewState(form, {
            status: "ready",
            timeoutId: 0,
          });
          setFieldError(form, "image", validateToyField("image", readToyFormValues(form)));
          setImagePreview(form, {
            status: "ready",
            src: formState.normalizedImageUrl,
            alt: `${formState.values.name || "Toy"} image preview`,
            message: READY_PREVIEW_MESSAGE,
          });
          syncFormSubmitState(form);
        })
        .catch(() => {
          const latestPreviewState = getPreviewState(form);

          if (
            latestPreviewState.token !== nextToken ||
            latestPreviewState.source !== formState.normalizedImageUrl
          ) {
            return;
          }

          patchPreviewState(form, {
            status: "error",
            timeoutId: 0,
          });
          setFieldError(
            form,
            "image",
            TOY_IMAGE_VALIDATION_MESSAGES.previewLoadError
          );
          setImagePreview(form, {
            status: "error",
            alt: `${formState.values.name || "Toy"} image preview`,
            message: LOCKED_PREVIEW_MESSAGE,
            placeholderMessage: ERROR_PREVIEW_PLACEHOLDER,
          });
          syncFormSubmitState(form);
        });
    };

    if (immediate) {
      schedulePreviewCheck();
      return;
    }

    const timeoutId = window.setTimeout(schedulePreviewCheck, IMAGE_PREVIEW_DEBOUNCE_MS);

    patchPreviewState(form, {
      source: formState.normalizedImageUrl,
      status: "pending",
      timeoutId,
      token: nextToken,
    });
    setImagePreview(form, {
      status: "pending",
      alt: `${formState.values.name || "Toy"} image preview`,
      message: CHECKING_PREVIEW_MESSAGE,
      placeholderMessage: CHECKING_PREVIEW_PLACEHOLDER,
    });
    syncFormSubmitState(form);
  }

  function handleScroll() {
    toggleVisibility(elements.toTopButton, window.scrollY > 300);
  }

  async function loadInitialToys() {
    setLoaderVisibility(elements.loader, true);

    try {
      const toys = await fetchOrSeedToys();
      syncToyState(state, toys);
      renderVisibleToys();
    } catch (error) {
      console.error("Failed to load toys", error);
      showCollectionMessage(elements.collection, "Unable to load toys right now.");
      showAppToast({
        title: "Unable to load toys",
        message: "The collection could not be loaded from the API.",
        variant: "danger",
        delay: 5000,
      });
    } finally {
      setLoaderVisibility(elements.loader, false);
    }
  }

  async function submitCreateToy(event) {
    event.preventDefault();
    const form = event.currentTarget;

    if (getFormBusyState(form).isBusy) {
      return;
    }

    const { isValid, values } = validateToyForm(form);

    if (!isValid) {
      focusFirstInvalidField(form);
      return;
    }

    setFormBusyState(form, true, "Creating toy...");
    syncFormSubmitState(form);
    setLoaderVisibility(elements.loader, true);

    try {
      const toy = await createToy(values);

      if (!toy?.id) {
        throw new Error("The API did not return a new toy record.");
      }

      prependToyState(state, toy);
      renderVisibleToys();
      form.reset();
      resetFormValidation(form);
      addToyModal.hide();
      showAppToast({
        title: "Toy created",
        message: `${toy.name} is now on the shelf.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to create toy", error);
      setFormError(form, getToastMessage(error, "Unable to create toy. Check the values and try again."));
      showAppToast({
        title: "Create failed",
        message: getToastMessage(error, "The toy could not be created."),
        variant: "danger",
        delay: 3600,
      });
    } finally {
      setFormBusyState(form, false);
      syncFormSubmitState(form);
      setLoaderVisibility(elements.loader, false);
    }
  }

  async function submitUpdateToy(event) {
    event.preventDefault();

    if (!state.editingToyId) {
      return;
    }

    const toyId = String(state.editingToyId);
    const currentToy = state.toys.get(toyId);

    if (!currentToy) {
      return;
    }

    const form = event.currentTarget;

    if (getFormBusyState(form).isBusy) {
      return;
    }

    const { isValid, values } = validateToyForm(form, { currentToy });

    if (!isValid) {
      focusFirstInvalidField(form);
      return;
    }

    setFormBusyState(form, true, "Saving changes...");
    syncFormSubmitState(form);
    setToyCardBusy(elements.collection, toyId, true);
    setLoaderVisibility(elements.loader, true);

    try {
      const updatedToy = await updateToy(toyId, {
        name: values.name,
        image: values.image,
        likes: currentToy.likes,
      });

      updateToyState(state, updatedToy);
      renderVisibleToys();
      flashToyCard(toyId);
      editToyModal.hide();
      showAppToast({
        title: "Toy updated",
        message: `${updatedToy.name} was saved successfully.`,
        variant: "primary",
      });
    } catch (error) {
      console.error(`Failed to update toy ${toyId}`, error);
      setFormError(form, getToastMessage(error, "Unable to update toy. Check the values and try again."));
      showAppToast({
        title: "Update failed",
        message: getToastMessage(error, "The toy could not be updated."),
        variant: "danger",
        delay: 3600,
      });
    } finally {
      setFormBusyState(form, false);
      syncFormSubmitState(form);
      setToyCardBusy(elements.collection, toyId, false);
      setLoaderVisibility(elements.loader, false);
    }
  }

  function openEditToy(toyId) {
    const toy = state.toys.get(String(toyId));

    if (!toy) {
      return;
    }

    state.editingToyId = String(toyId);
    setFormError(elements.editToyForm, "");
    setEditTarget(elements.editToyModal, toy);
    queueImagePreview(elements.editToyForm, { immediate: true });
    syncFormSubmitState(elements.editToyForm);
    editToyModal.show();
  }

  async function incrementToyLikes(toyId) {
    const toy = state.toys.get(String(toyId));

    if (!toy) {
      return;
    }

    setToyCardBusy(elements.collection, toyId, true);

    try {
      const updatedToy = await likeToy(toy);
      updateToyState(state, updatedToy);
      updateToyLikes(elements.collection, toyId, updatedToy.likes);

      if (shouldReorderAfterLike(state)) {
        const reorderedToys = getVisibleToys(state);
        const reordered = reorderToyCards(elements.collection, reorderedToys);

        if (!reordered) {
          renderVisibleToys();
        }
      } else if (shouldRerenderAfterLike(state)) {
        renderVisibleToys();
      }

      flashToyCard(toyId);
      showAppToast({
        title: "Likes updated",
        message: `${updatedToy.name} now has ${updatedToy.likes} likes.`,
        variant: "success",
        delay: 5000,
      });
    } catch (error) {
      console.error(`Failed to like toy ${toyId}`, error);
      showAppToast({
        title: "Like failed",
        message: getToastMessage(error, "The like count could not be updated."),
        variant: "danger",
        delay: 5000,
      });
    } finally {
      setToyCardBusy(elements.collection, toyId, false);
    }
  }

  async function submitDeleteToy() {
    if (!state.confirmDeleteToyId) {
      return;
    }

    const toyId = String(state.confirmDeleteToyId);
    const toy = state.toys.get(toyId);

    if (!toy) {
      state.confirmDeleteToyId = null;
      modalConfirm.hide();
      return;
    }

    setToyCardBusy(elements.collection, toyId, true);

    try {
      await deleteToy(toyId);
      modalConfirm.hide();
      await animateToyRemoval(elements.collection, toyId);
      removeToyState(state, toyId);
      renderVisibleToys();
      state.confirmDeleteToyId = null;
      showAppToast({
        title: "Toy deleted",
        message: `${toy.name} was removed from the shelf.`,
        variant: "warning",
      });
    } catch (error) {
      console.error(`Failed to delete toy ${toyId}`, error);
      setToyCardBusy(elements.collection, toyId, false);
      showAppToast({
        title: "Delete failed",
        message: getToastMessage(error, "The toy could not be deleted."),
        variant: "danger",
        delay: 3600,
      });
    }
  }

  function handleToyAction(event) {
    const actionButton = event.target.closest("button[data-action]");

    if (!actionButton) {
      return;
    }

    if (actionButton.dataset.action === "reload") {
      setLoaderVisibility(elements.loader, true);
      sleep(500).then(() => loadInitialToys());
      return;
    }

    const toyId = actionButton.closest("[data-id]")?.dataset.id;

    if (!toyId) {
      return;
    }

    if (actionButton.dataset.action === "edit") {
      openEditToy(toyId);
      return;
    }

    if (actionButton.dataset.action === "like") {
      incrementToyLikes(toyId);
      return;
    }

    const toy = state.toys.get(String(toyId));

    if (!toy) {
      return;
    }

    state.confirmDeleteToyId = toyId;
    setDeleteTarget(elements.deleteModal, toy);
    modalConfirm.show();
  }

  window.addEventListener("scroll", handleScroll);
  elements.toTopButton.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  elements.addToyButton.addEventListener("click", () => {
    addToyModal.show();
  });
  elements.addToyModal.addEventListener("shown.bs.modal", () => {
    armModalBackdropObserver(elements.addToyModal);
    focusFormField(elements.addToyForm);
    syncFormSubmitState(elements.addToyForm);
  });
  elements.addToyModal.addEventListener("hidden.bs.modal", () => {
    resetManagedForm({
      form: elements.addToyForm,
      stopObserver: () => stopModalBackdropObserver(elements.addToyModal),
      clearBusyState: () => setFormBusyState(elements.addToyForm, false),
      resetValidation: () => resetFormValidation(elements.addToyForm),
      resetPreview: () => resetImagePreview(elements.addToyForm),
      afterReset: () => syncFormSubmitState(elements.addToyForm),
    });
  });
  elements.editToyModal.addEventListener("shown.bs.modal", () => {
    armModalBackdropObserver(elements.editToyModal);
    focusFormField(elements.editToyForm);
    queueImagePreview(elements.editToyForm, { immediate: true });
    syncFormSubmitState(elements.editToyForm);
  });
  elements.editToyModal.addEventListener("hidden.bs.modal", () => {
    state.editingToyId = null;
    resetManagedForm({
      form: elements.editToyForm,
      stopObserver: () => stopModalBackdropObserver(elements.editToyModal),
      clearBusyState: () => setFormBusyState(elements.editToyForm, false),
      resetValidation: () => resetFormValidation(elements.editToyForm),
      resetPreview: () => resetImagePreview(elements.editToyForm),
      afterReset: () => syncFormSubmitState(elements.editToyForm),
    });
  });
  elements.deleteModal.addEventListener("shown.bs.modal", () => {
    armModalBackdropObserver(elements.deleteModal);
  });
  elements.deleteModal.addEventListener("hidden.bs.modal", () => {
    stopModalBackdropObserver(elements.deleteModal);
    state.confirmDeleteToyId = null;
  });
  elements.addToyForm.addEventListener("input", (event) => {
    const field = event.target;

    if (!(field instanceof HTMLInputElement) || !["name", "image"].includes(field.name)) {
      return;
    }

    setFormError(elements.addToyForm, "");
    updateFieldValidation(elements.addToyForm, field.name);

    if (field.name === "image") {
      queueImagePreview(elements.addToyForm);
    } else {
      syncFormSubmitState(elements.addToyForm);
    }
  });
  elements.addToyForm.addEventListener("submit", submitCreateToy);
  elements.editToyForm.addEventListener("input", (event) => {
    const field = event.target;

    if (!(field instanceof HTMLInputElement) || !["name", "image"].includes(field.name)) {
      return;
    }

    setFormError(elements.editToyForm, "");
    updateFieldValidation(elements.editToyForm, field.name);

    if (field.name === "image") {
      queueImagePreview(elements.editToyForm);
    } else {
      syncFormSubmitState(elements.editToyForm);
    }
  });
  elements.editToyForm.addEventListener("submit", submitUpdateToy);
  elements.searchInput.addEventListener("input", (event) => {
    setSearchTerm(state, event.currentTarget.value);
    renderVisibleToys();
  });
  elements.sortSelect.addEventListener("change", (event) => {
    setSortOrder(state, event.currentTarget.value);
    renderVisibleToys();
  });
  elements.collection.addEventListener("click", handleToyAction);
  elements.deleteConfirmButton.addEventListener("click", submitDeleteToy);

  resetImagePreview(elements.addToyForm);
  resetImagePreview(elements.editToyForm);
  setFormBusyState(elements.addToyForm, false);
  setFormBusyState(elements.editToyForm, false);
  syncFormSubmitState(elements.addToyForm);
  syncFormSubmitState(elements.editToyForm);

  handleScroll();
  await loadInitialToys();
}
