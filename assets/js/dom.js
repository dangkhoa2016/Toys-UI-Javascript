const activeAnimations = new WeakMap();

function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (typeof textContent === "string") {
    element.textContent = textContent;
  }

  return element;
}

function playAnimation(element, keyframes, options) {
  if (typeof element.animate !== "function") {
    return null;
  }

  const existingAnimation = activeAnimations.get(element);

  if (existingAnimation) {
    try {
      existingAnimation.cancel();
    } catch {
      // Ignore finished animations.
    }
  }

  const animation = element.animate(keyframes, options);

  activeAnimations.set(element, animation);

  const clearAnimation = () => {
    if (activeAnimations.get(element) === animation) {
      activeAnimations.delete(element);
    }
  };

  animation.addEventListener("finish", clearAnimation, { once: true });
  animation.addEventListener("cancel", clearAnimation, { once: true });

  return animation;
}

function getCards(container) {
  return Array.from(container.querySelectorAll("[data-id]")).filter(
    (card) => !card.classList.contains("toy-card-ghost")
  );
}

function getCardsById(container) {
  return new Map(getCards(container).map((card) => [card.dataset.id, card]));
}

function animateCardEntry(card) {
  requestAnimationFrame(() => {
    card.classList.remove("is-entering");

    playAnimation(
      card,
      [
        { opacity: 0, transform: "translateY(18px) scale(0.98)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      {
        duration: 280,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      }
    );
  });
}

function captureCardRects(container) {
  return new Map(getCards(container).map((card) => [card.dataset.id, card.getBoundingClientRect()]));
}

function cleanupRemovalGhosts() {
  document.querySelectorAll(".toy-card-ghost").forEach((ghost) => {
    ghost.remove();
  });
}

function createRemovalGhost(card) {
  const rect = card.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return null;
  }

  const ghost = card.cloneNode(true);

  ghost.classList.remove("is-entering", "is-reordering", "is-removing");
  ghost.classList.add("toy-card-ghost");
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  ghost.style.top = `${rect.top}px`;
  ghost.style.left = `${rect.left}px`;
  document.body.append(ghost);

  return ghost;
}

function animateRemovalGhosts(ghosts) {
  ghosts.forEach((ghost) => {
    const finish = () => {
      ghost.remove();
    };

    const animation = playAnimation(
      ghost,
      [
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(16px) scale(0.97)" },
      ],
      {
        duration: 300,
        easing: "ease",
        fill: "forwards",
      }
    );

    if (animation) {
      animation.addEventListener("finish", finish, { once: true });
      window.setTimeout(finish, 340);
      return;
    }

    requestAnimationFrame(() => {
      ghost.classList.add("is-removing");
    });

    ghost.addEventListener(
      "transitionend",
      (event) => {
        if (event.propertyName !== "transform" && event.propertyName !== "opacity") {
          return;
        }

        finish();
      },
      { once: true }
    );

    window.setTimeout(finish, 320);
  });
}

function animateCardMove(card, previousRect) {
  if (!previousRect) {
    return;
  }

  const nextRect = card.getBoundingClientRect();
  const deltaX = previousRect.left - nextRect.left;
  const deltaY = previousRect.top - nextRect.top;

  if (!deltaX && !deltaY) {
    return;
  }

  const animation = playAnimation(
    card,
    [
      { transform: `translate(${deltaX}px, ${deltaY}px)` },
      { transform: "translate(0, 0)" },
    ],
    {
      duration: 320,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    }
  );

  if (animation) {
    return;
  }

  card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  card.getBoundingClientRect();
  card.classList.add("is-reordering");

  requestAnimationFrame(() => {
    card.style.transform = "";
  });

  card.addEventListener(
    "transitionend",
    (event) => {
      if (event.propertyName !== "transform") {
        return;
      }

      card.classList.remove("is-reordering");
    },
    { once: true }
  );
}

function animateCardMoves(container, previousRects) {
  getCards(container).forEach((card) => {
    animateCardMove(card, previousRects.get(card.dataset.id));
  });
}

function animateLikesCountChange(likesCount) {
  const animation = playAnimation(
    likesCount,
    [
      { transform: "scale(1)", opacity: 1 },
      { transform: "scale(1.2)", opacity: 1 },
      { transform: "scale(1)", opacity: 1 },
    ],
    {
      duration: 360,
      easing: "ease",
    }
  );

  if (animation) {
    return;
  }

  likesCount.classList.remove("likes-count-updated");
  likesCount.getBoundingClientRect();
  likesCount.classList.add("likes-count-updated");
  likesCount.addEventListener(
    "animationend",
    () => {
      likesCount.classList.remove("likes-count-updated");
    },
    { once: true }
  );
}

function createToyCard(toy) {
  const column = createElement("div", "col toy-card-shell is-entering");
  column.dataset.id = String(toy.id);

  const card = createElement("article", "card toy-card");
  const image = createElement("img", "my-1");
  image.src = toy.image;
  image.alt = toy.name;
  image.loading = "lazy";

  const cardBody = createElement("div", "card-body");
  const title = createElement("h5", "card-title", toy.name);
  const likeText = createElement("p", "card-text");
  const likeCount = createElement("span", "likes-count", String(toy.likes));
  likeText.append(likeCount, document.createTextNode(" likes"));

  const buttonRow = createElement("div", "d-flex gap-2 flex-wrap toy-card-actions");
  const likeButton = createElement("button", "btn btn-success");
  likeButton.type = "button";
  likeButton.dataset.action = "like";
  likeButton.textContent = "Like <3";

  const editButton = createElement("button", "btn btn-outline-primary");
  editButton.type = "button";
  editButton.dataset.action = "edit";
  editButton.textContent = "Edit";

  const deleteButton = createElement("button", "btn btn-danger");
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";
  deleteButton.textContent = "Delete";

  buttonRow.append(likeButton, editButton, deleteButton);
  cardBody.append(title, likeText, buttonRow);
  card.append(image, cardBody);
  column.append(card);

  return column;
}

function syncToyCard(card, toy) {
  const image = card.querySelector("img");
  const title = card.querySelector(".card-title");
  const likesCount = card.querySelector(".likes-count");

  if (image) {
    if (image.getAttribute("src") !== toy.image) {
      image.src = toy.image;
    }

    image.alt = toy.name;
  }

  if (title) {
    title.textContent = toy.name;
  }

  if (likesCount) {
    likesCount.textContent = String(toy.likes);
  }
}

function createCollectionStatus(message, variant = "info") {
  const wrapper = createElement("div", "col-12 toy-status-shell");
  const alertClassName =
    variant === "error"
      ? "alert alert-danger toy-status-alert"
      : "alert alert-light toy-status-alert toy-status-alert-info";
  const state = createElement("div", alertClassName);
  const messageElement = createElement("p", "mb-0", message);

  state.setAttribute("role", "alert");

  if (variant === "error") {
    const actionRow = createElement("div", "toy-status-actions mt-3");
    const reloadButton = createElement("button", "btn btn-danger toy-status-reload");

    reloadButton.type = "button";
    reloadButton.dataset.action = "reload";
    reloadButton.textContent = "Reload data";

    actionRow.append(reloadButton);
    state.append(messageElement, actionRow);
  } else {
    state.append(messageElement);
  }

  wrapper.append(state);
  return wrapper;
}

export function renderToyList(container, toys, options = {}) {
  const { emptyMessage = "No toys available yet." } = options;
  const previousRects = captureCardRects(container);
  cleanupRemovalGhosts();

  if (!toys.length) {
    const ghosts = Array.from(container.querySelectorAll("[data-id]"))
      .map((card) => createRemovalGhost(card))
      .filter(Boolean);

    container.replaceChildren(createCollectionStatus(emptyMessage));
    animateRemovalGhosts(ghosts);
    return;
  }

  container.querySelector(".toy-status-shell")?.remove();

  const nextToyIds = new Set(toys.map((toy) => String(toy.id)));
  const existingCards = getCardsById(container);
  const ghosts = [];

  Array.from(existingCards.entries()).forEach(([toyId, card]) => {
    if (!nextToyIds.has(toyId)) {
      const ghost = createRemovalGhost(card);

      if (ghost) {
        ghosts.push(ghost);
      }

      card.remove();
      existingCards.delete(toyId);
    }
  });

  const nextCards = [];

  toys.forEach((toy) => {
    const toyId = String(toy.id);
    const existingCard = existingCards.get(toyId);

    if (existingCard) {
      syncToyCard(existingCard, toy);
      nextCards.push(existingCard);
      return;
    }

    const nextCard = createToyCard(toy);

    nextCards.push(nextCard);
  });

  nextCards.forEach((card) => {
    container.append(card);
  });

  animateRemovalGhosts(ghosts);
  animateCardMoves(container, previousRects);
  nextCards.forEach((card) => {
    if (card.classList.contains("is-entering")) {
      animateCardEntry(card);
    }
  });
}

export function updateToyLikes(container, toyId, likes) {
  const likesCount = container.querySelector(`[data-id="${toyId}"] .likes-count`);

  if (likesCount) {
    likesCount.textContent = String(likes);
    animateLikesCountChange(likesCount);
  }
}

export function reorderToyCards(container, toys) {
  const cardsById = getCardsById(container);

  for (const toy of toys) {
    if (!cardsById.has(String(toy.id))) {
      return false;
    }
  }

  const previousRects = new Map(Array.from(cardsById.entries()).map(([toyId, card]) => [toyId, card.getBoundingClientRect()]));

  toys.forEach((toy) => {
    const card = cardsById.get(String(toy.id));

    if (card) {
      container.append(card);
    }
  });

  animateCardMoves(container, previousRects);

  return true;
}

export function setDeleteTarget(modalElement, toy) {
  const toyInfo = modalElement.querySelector(".toy-info");

  if (toyInfo) {
    toyInfo.textContent = `[${toy.id}] ${toy.name}`;
  }
}

export function setEditTarget(modalElement, toy) {
  const toyInfo = modalElement.querySelector(".toy-edit-info");
  const nameInput = modalElement.querySelector("[name='name']");
  const imageInput = modalElement.querySelector("[name='image']");

  if (toyInfo) {
    toyInfo.textContent = `#${toy.id} ${toy.name}`;
  }

  if (nameInput) {
    nameInput.value = toy.name;
  }

  if (imageInput) {
    imageInput.value = toy.image;
  }
}

export function setFieldError(form, fieldName, message) {
  const field = form.querySelector(`[name="${fieldName}"]`);
  const feedback = form.querySelector(`[data-field-error="${fieldName}"]`);
  const hasError = Boolean(message);

  if (field) {
    field.classList.toggle("is-invalid", hasError);

    if (hasError) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
  }

  if (feedback) {
    feedback.textContent = message || "";
  }
}

export function resetFormValidation(form) {
  form.querySelectorAll("[name]").forEach((field) => {
    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
  });

  form.querySelectorAll("[data-field-error]").forEach((feedback) => {
    feedback.textContent = "";
  });

  setFormError(form, "");
}

export function setImagePreview(
  form,
  {
    status = "idle",
    src = "",
    alt = "Toy image preview",
    message = "",
    placeholderMessage = "Preview will appear here after the image URL is checked.",
  } = {}
) {
  const previewFrame = form.querySelector("[data-image-preview]");
  const previewImage = form.querySelector("[data-image-preview-image]");
  const previewLoader = form.querySelector("[data-image-preview-loader]");
  const previewPlaceholder = form.querySelector("[data-image-preview-placeholder]");
  const previewStatus = form.querySelector("[data-image-preview-status]");

  if (!previewFrame || !previewImage || !previewLoader || !previewPlaceholder || !previewStatus) {
    return;
  }

  previewFrame.dataset.previewState = status;
  previewStatus.textContent = message;
  previewLoader.classList.toggle("d-none", status !== "pending");
  previewPlaceholder.classList.toggle("d-none", status === "pending");

  if (status === "ready" && src) {
    previewImage.src = src;
    previewImage.alt = alt;
    previewImage.classList.remove("d-none");
    previewPlaceholder.classList.add("d-none");
    previewPlaceholder.textContent = placeholderMessage;
    return;
  }

  previewImage.removeAttribute("src");
  previewImage.alt = alt;
  previewImage.classList.add("d-none");
  if (status !== "pending") {
    previewPlaceholder.classList.remove("d-none");
  }
  previewPlaceholder.textContent = placeholderMessage;
}

export function setFormError(form, message) {
  const alert = form.querySelector(".alert");

  if (!alert) {
    return;
  }

  if (message) {
    alert.textContent = message;
    alert.classList.remove("d-none");
    alert.classList.add("d-block");
    return;
  }

  alert.textContent = "";
  alert.classList.remove("d-block");
  alert.classList.add("d-none");
}

export function setLoaderVisibility(loader, isVisible) {
  loader.classList.toggle("d-none", !isVisible);
  loader.classList.toggle("d-block", isVisible);
}

export function toggleVisibility(element, isVisible, displayClass = "d-block") {
  element.classList.toggle("d-none", !isVisible);
  element.classList.toggle(displayClass, isVisible);
}

export function setToyCardBusy(container, toyId, isBusy) {
  const toyCard = container.querySelector(`[data-id="${toyId}"] .toy-card`);

  if (!toyCard) {
    return;
  }

  toyCard.classList.toggle("is-busy", isBusy);
  toyCard.querySelectorAll("button").forEach((button) => {
    button.disabled = isBusy;
  });
}

export function markToyCardUpdated(container, toyId) {
  const toyCard = container.querySelector(`[data-id="${toyId}"] .toy-card`);

  if (!toyCard) {
    return;
  }

  toyCard.classList.remove("toy-card-updated");
  toyCard.getBoundingClientRect();
  toyCard.classList.add("toy-card-updated");
  toyCard.addEventListener(
    "animationend",
    () => {
      toyCard.classList.remove("toy-card-updated");
    },
    { once: true }
  );
}

export function animateToyRemoval(container, toyId) {
  const toyCard = container.querySelector(`[data-id="${toyId}"]`);

  if (!toyCard) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const previousRects = captureCardRects(container);
    const ghost = createRemovalGhost(toyCard);

    toyCard.remove();
    animateCardMoves(container, previousRects);

    if (!ghost) {
      resolve(true);
      return;
    }

    animateRemovalGhosts([ghost]);
    window.setTimeout(() => {
      resolve(true);
    }, 320);
  });
}

export function createToast({ title, message, variant = "primary" }) {
  const toast = createElement("div", `toast toy-toast toy-toast-${variant}`);
  const layout = createElement("div", "d-flex justify-content-between");
  const body = createElement("div", "toast-body");
  const titleElement = createElement("div", "toy-toast-title", title);
  const messageElement = createElement("div", "toy-toast-message", message);
  const dismissButton = createElement("button", "btn-close me-2 mt-2");

  toast.role = "status";
  toast.ariaLive = "polite";
  toast.ariaAtomic = "true";

  dismissButton.type = "button";
  dismissButton.dataset.bsDismiss = "toast";
  dismissButton.ariaLabel = "Close";

  body.append(titleElement, messageElement);
  layout.append(body, dismissButton);
  toast.append(layout);

  return toast;
}

export function showCollectionMessage(container, message) {
  container.replaceChildren(createCollectionStatus(message, "error"));
}

export function showSeedingMessage(container) {
  const wrapper = createElement("div", "col-12 toy-status-shell");
  const state = createElement("div", "alert alert-info toy-status-alert");
  const message = createElement("p", "mb-0");

  message.innerHTML = "<strong>Server has no data yet.</strong> Initializing sample data, please wait...";
  state.setAttribute("role", "status");
  state.append(message);
  wrapper.append(state);
  container.replaceChildren(wrapper);
}
