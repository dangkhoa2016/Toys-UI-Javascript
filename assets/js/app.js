import { createToy, deleteToy, fetchOrSeedToys, likeToy } from "./api.js";
import {
  reorderToyCards,
  renderToyList,
  setDeleteTarget,
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

export async function initApp() {
  const elements = {
    collection: requireElement("#toy-collection"),
    loader: requireElement(".loader"),
    toTopButton: requireElement("#to-top"),
    addToyButton: requireElement("#new-toy-btn"),
    addToyModal: requireElement("#modal-add-toy"),
    addToyForm: requireElement("#add-toy-form"),
    searchInput: requireElement("#toy-search"),
    sortSelect: requireElement("#toy-sort"),
    deleteModal: requireElement("#modal-delete-toy"),
    deleteConfirmButton: requireElement("#modal-delete-toy .btn-confirm"),
  };

  const state = {
    confirmDeleteToyId: null,
    searchTerm: "",
    sortOrder: "default",
    toys: new Map(),
  };

  const addToyModal = new bootstrap.Modal(elements.addToyModal);
  const modalConfirm = new bootstrap.Modal(elements.deleteModal);

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
    } catch (error) {
      console.error("Failed to create toy", error);
      setFormError(form, "Unable to create toy. Check the values and try again.");
    } finally {
      setLoaderVisibility(elements.loader, false);
    }
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
    } catch (error) {
      console.error(`Failed to like toy ${toyId}`, error);
    } finally {
      setToyCardBusy(elements.collection, toyId, false);
    }
  }

  async function handleDeleteToy() {
    if (!state.confirmDeleteToyId) {
      return;
    }

    const toyId = String(state.confirmDeleteToyId);
    setToyCardBusy(elements.collection, toyId, true);

    try {
      await deleteToy(toyId);
      state.toys.delete(toyId);
      renderVisibleToys();
      state.confirmDeleteToyId = null;
      modalConfirm.hide();
    } catch (error) {
      console.error(`Failed to delete toy ${toyId}`, error);
      setToyCardBusy(elements.collection, toyId, false);
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
  elements.addToyForm.addEventListener("submit", handleCreateToy);
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