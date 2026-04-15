import { createToy, deleteToy, fetchOrSeedToys, likeToy } from "./api.js";
import {
  prependToyCard,
  removeToyCard,
  renderToyList,
  setDeleteTarget,
  setFormError,
  setLoaderVisibility,
  setToyCardBusy,
  showCollectionMessage,
  toggleVisibility,
  updateToyLikes,
} from "./dom.js";

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

export async function initApp() {
  const elements = {
    collection: requireElement("#toy-collection"),
    loader: requireElement(".loader"),
    toTopButton: requireElement("#to-top"),
    addToyButton: requireElement("#new-toy-btn"),
    addToyForm: requireElement("#add-toy-form"),
    deleteModal: requireElement("#modal-delete-toy"),
    deleteConfirmButton: requireElement("#modal-delete-toy .btn-confirm"),
  };

  const state = {
    confirmDeleteToyId: null,
    isAddToyVisible: false,
    toys: new Map(),
  };

  const modalConfirm = new bootstrap.Modal(elements.deleteModal);

  function handleScroll() {
    toggleVisibility(elements.toTopButton, window.scrollY > 300);
  }

  async function loadInitialToys() {
    setLoaderVisibility(elements.loader, true);

    try {
      const toys = await fetchOrSeedToys();
      syncToyState(state, toys);
      renderToyList(elements.collection, toys);
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

      state.toys.set(String(toy.id), toy);
      prependToyCard(elements.collection, toy);
      form.reset();
      state.isAddToyVisible = false;
      toggleVisibility(elements.addToyForm, false);
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
      removeToyCard(elements.collection, toyId);
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
    state.isAddToyVisible = !state.isAddToyVisible;
    toggleVisibility(elements.addToyForm, state.isAddToyVisible);

    if (state.isAddToyVisible) {
      elements.addToyForm.querySelector("[name='name']")?.focus();
    }
  });
  elements.addToyForm.addEventListener("submit", handleCreateToy);
  elements.collection.addEventListener("click", handleCollectionClick);
  elements.deleteConfirmButton.addEventListener("click", handleDeleteToy);

  handleScroll();
  await loadInitialToys();
}