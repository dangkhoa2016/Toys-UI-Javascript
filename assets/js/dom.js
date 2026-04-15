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

function createToyCard(toy) {
  const column = createElement("div", "col");
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

  const buttonRow = createElement("div", "d-flex gap-2 flex-wrap");
  const likeButton = createElement("button", "btn btn-success");
  likeButton.type = "button";
  likeButton.dataset.action = "like";
  likeButton.textContent = "Like <3";

  const deleteButton = createElement("button", "btn btn-danger");
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";
  deleteButton.textContent = "Delete";

  buttonRow.append(likeButton, deleteButton);
  cardBody.append(title, likeText, buttonRow);
  card.append(image, cardBody);
  column.append(card);

  return column;
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

export function renderToyList(container, toys) {
  if (!toys.length) {
    container.replaceChildren(createCollectionStatus("No toys available yet."));
    return;
  }

  container.replaceChildren(...toys.map(createToyCard));
}

export function prependToyCard(container, toy) {
  const card = createToyCard(toy);
  const statusState = container.querySelector(".toy-status-shell");

  if (statusState) {
    container.replaceChildren(card);
    return;
  }

  container.prepend(card);
}

export function updateToyLikes(container, toyId, likes) {
  const likeCount = container.querySelector(`[data-id="${toyId}"] .likes-count`);

  if (likeCount) {
    likeCount.textContent = String(likes);
  }
}

export function removeToyCard(container, toyId) {
  const card = container.querySelector(`[data-id="${toyId}"]`);
  card?.remove();

  if (!container.children.length) {
    container.append(createCollectionStatus("No toys available yet."));
  }
}

export function setDeleteTarget(modalElement, toy) {
  const toyInfo = modalElement.querySelector(".toy-info");

  if (toyInfo) {
    toyInfo.textContent = `[${toy.id}] ${toy.name}`;
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

export function showCollectionMessage(container, message) {
  container.replaceChildren(createCollectionStatus(message, "error"));
}