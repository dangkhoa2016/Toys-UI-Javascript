import { createToy, deleteToy, fetchOrSeedToys, likeToy, updateToy } from "./api.js";
import {
  animateToyRemoval,
  createToast,
  markToyCardUpdated,
  reorderToyCards,
  renderToyList,
  setDeleteTarget,
  setEditTarget,
  setFormError,
  setLoaderVisibility,
  setToyCardBusy,
  showCollectionMessage,
  toggleVisibility,
  updateToyLikes,
} from "./dom.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requireElement(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

function syncToyState(state, toys) {
  state.toys = new Map(toys.map((toy) => [String(toy.id), toy]));
}

function prependToyState(state, toy) {
  state.toys = new Map([[String(toy.id), toy], ...state.toys.entries()]);
}

function getVisibleToys(state) {
  const normalizedSearchTerm = state.searchTerm.trim().toLowerCase();
  const toys = Array.from(state.toys.values()).filter((toy) => {
    if (!normalizedSearchTerm) {
      return true;
    }

    return toy.name.toLowerCase().includes(normalizedSearchTerm);
  });

  if (state.sortOrder === "likes-desc") {
    return toys.sort((left, right) => right.likes - left.likes || left.name.localeCompare(right.name));
  }

  if (state.sortOrder === "likes-asc") {
    return toys.sort((left, right) => left.likes - right.likes || left.name.localeCompare(right.name));
  }

  return toys;
}

function shouldRerenderAfterLike(state) {
  return state.sortOrder !== "default";
}

function shouldReorderAfterLike(state) {
  return state.sortOrder === "likes-desc" || state.sortOrder === "likes-asc";
}

function getErrorMessage(error, fallbackMessage) {
  return error instanceof Error && error.message ? error.message : fallbackMessage;
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

  const state = {
    confirmDeleteToyId: null,
    editingToyId: null,
    searchTerm: "",
    sortOrder: "default",
    toys: new Map(),
  };

  const addToyModal = new bootstrap.Modal(elements.addToyModal);
  const editToyModal = new bootstrap.Modal(elements.editToyModal);
  const modalConfirm = new bootstrap.Modal(elements.deleteModal);

  function showAppToast({ title, message, variant = "primary", delay = 5000 }) {
    const toastElement = createToast({ title, message, variant });
    const toast = new bootstrap.Toast(toastElement, {
      autohide: true,
      delay,
    });

    elements.toastRegion.append(toastElement);
    toastElement.addEventListener(
      "hidden.bs.toast",
      () => {
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

  async function handleCreateToy(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setFormError(form, "");
    setLoaderVisibility(elements.loader, true);

    try {
      const toy = await createToy({
        name: formData.get("name"),
        image: formData.get("image"),
      });

      if (!toy?.id) {
        throw new Error("The API did not return a new toy record.");
      }

      prependToyState(state, toy);
      renderVisibleToys();
      form.reset();
      addToyModal.hide();
      showAppToast({
        title: "Toy created",
        message: `${toy.name} is now on the shelf.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to create toy", error);
      setFormError(form, getErrorMessage(error, "Unable to create toy. Check the values and try again."));
      showAppToast({
        title: "Create failed",
        message: getErrorMessage(error, "The toy could not be created."),
        variant: "danger",
        delay: 3600,
      });
    } finally {
      setLoaderVisibility(elements.loader, false);
    }
  }

  async function handleEditToy(event) {
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
    const formData = new FormData(form);

    setFormError(form, "");
    setToyCardBusy(elements.collection, toyId, true);
    setLoaderVisibility(elements.loader, true);

    try {
      const updatedToy = await updateToy(toyId, {
        name: formData.get("name"),
        image: formData.get("image"),
        likes: currentToy.likes,
      });

      state.toys.set(toyId, updatedToy);
      renderVisibleToys();
      markToyCardUpdated(elements.collection, toyId);
      editToyModal.hide();
      showAppToast({
        title: "Toy updated",
        message: `${updatedToy.name} was saved successfully.`,
        variant: "primary",
      });
    } catch (error) {
      console.error(`Failed to update toy ${toyId}`, error);
      setFormError(form, getErrorMessage(error, "Unable to update toy. Check the values and try again."));
      showAppToast({
        title: "Update failed",
        message: getErrorMessage(error, "The toy could not be updated."),
        variant: "danger",
        delay: 3600,
      });
    } finally {
      setToyCardBusy(elements.collection, toyId, false);
      setLoaderVisibility(elements.loader, false);
    }
  }

  function beginEditToy(toyId) {
    const toy = state.toys.get(String(toyId));

    if (!toy) {
      return;
    }

    state.editingToyId = String(toyId);
    setFormError(elements.editToyForm, "");
    setEditTarget(elements.editToyModal, toy);
    editToyModal.show();
  }

  async function handleLikeToy(toyId) {
    const toy = state.toys.get(String(toyId));

    if (!toy) {
      return;
    }

    setToyCardBusy(elements.collection, toyId, true);

    try {
      const updatedToy = await likeToy(toy);
      state.toys.set(String(updatedToy.id), updatedToy);
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

      markToyCardUpdated(elements.collection, toyId);
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
        message: getErrorMessage(error, "The like count could not be updated."),
        variant: "danger",
        delay: 5000,
      });
    } finally {
      setToyCardBusy(elements.collection, toyId, false);
    }
  }

  async function handleDeleteToy() {
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
      state.toys.delete(toyId);
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
        message: getErrorMessage(error, "The toy could not be deleted."),
        variant: "danger",
        delay: 3600,
      });
    }
  }

  function handleCollectionClick(event) {
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
      beginEditToy(toyId);
      return;
    }

    if (actionButton.dataset.action === "like") {
      handleLikeToy(toyId);
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
    elements.addToyForm.querySelector("[name='name']")?.focus();
  });
  elements.addToyModal.addEventListener("hidden.bs.modal", () => {
    elements.addToyForm.reset();
    setFormError(elements.addToyForm, "");
  });
  elements.editToyModal.addEventListener("shown.bs.modal", () => {
    elements.editToyForm.querySelector("[name='name']")?.focus();
  });
  elements.editToyModal.addEventListener("hidden.bs.modal", () => {
    state.editingToyId = null;
    elements.editToyForm.reset();
    setFormError(elements.editToyForm, "");
  });
  elements.deleteModal.addEventListener("hidden.bs.modal", () => {
    state.confirmDeleteToyId = null;
  });
  elements.addToyForm.addEventListener("submit", handleCreateToy);
  elements.editToyForm.addEventListener("submit", handleEditToy);
  elements.searchInput.addEventListener("input", (event) => {
    state.searchTerm = event.currentTarget.value;
    renderVisibleToys();
  });
  elements.sortSelect.addEventListener("change", (event) => {
    state.sortOrder = event.currentTarget.value;
    renderVisibleToys();
  });
  elements.collection.addEventListener("click", handleCollectionClick);
  elements.deleteConfirmButton.addEventListener("click", handleDeleteToy);

  handleScroll();
  await loadInitialToys();
}