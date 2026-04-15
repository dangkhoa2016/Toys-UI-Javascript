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

function animateCardEntry(card) {
  requestAnimationFrame(() => {
    card.classList.remove("is-entering");
  });
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

  if (!toys.length) {
    container.replaceChildren(createCollectionStatus(emptyMessage));
    return;
  }

  container.querySelector(".toy-status-shell")?.remove();

  const nextToyIds = new Set(toys.map((toy) => String(toy.id)));
  const existingCards = new Map(
    Array.from(container.querySelectorAll("[data-id]")).map((card) => [card.dataset.id, card])
  );

  existingCards.forEach((card, toyId) => {
    if (!nextToyIds.has(toyId)) {
      card.remove();
      existingCards.delete(toyId);
    }
  });

  toys.forEach((toy) => {
    const toyId = String(toy.id);
    const existingCard = existingCards.get(toyId);

    if (existingCard) {
      syncToyCard(existingCard, toy);
      container.append(existingCard);
      return;
    }

    const nextCard = createToyCard(toy);

    container.append(nextCard);
    animateCardEntry(nextCard);
  });
}

export function updateToyLikes(container, toyId, likes) {
  const likesCount = container.querySelector(`[data-id="${toyId}"] .likes-count`);

  if (likesCount) {
    likesCount.textContent = String(likes);
  }
}

export function reorderToyCards(container, toys) {
  const cardsById = new Map(
    Array.from(container.querySelectorAll("[data-id]")).map((card) => [card.dataset.id, card])
  );

  for (const toy of toys) {
    if (!cardsById.has(String(toy.id))) {
      return false;
    }
  }

  const previousRects = new Map(
    Array.from(cardsById.entries()).map(([toyId, card]) => [toyId, card.getBoundingClientRect()])
  );

  toys.forEach((toy) => {
    const card = cardsById.get(String(toy.id));

    if (card) {
      container.append(card);
    }
  });

  cardsById.forEach((card, toyId) => {
    const previousRect = previousRects.get(toyId);
    const nextRect = card.getBoundingClientRect();
    const deltaX = previousRect.left - nextRect.left;
    const deltaY = previousRect.top - nextRect.top;

    if (!deltaX && !deltaY) {
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
  });

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
    let completed = false;

    const finish = () => {
      if (completed) {
        return;
      }

      completed = true;
      toyCard.remove();
      resolve(true);
    };

    toyCard.classList.add("is-removing");
    toyCard.addEventListener("animationend", finish, { once: true });
    window.setTimeout(finish, 260);
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