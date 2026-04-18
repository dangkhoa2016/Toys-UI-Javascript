import { TOY_ALLOWED_IMAGE_PROTOCOLS, TOY_PREVIEW_STATUS, TOY_VALIDATION_LIMITS } from "./config.js";

export const TOY_NAME_MIN_LENGTH = TOY_VALIDATION_LIMITS.NAME_MIN_LENGTH;
export const TOY_NAME_MAX_LENGTH = TOY_VALIDATION_LIMITS.NAME_MAX_LENGTH;
export const IMAGE_PREVIEW_DEBOUNCE_MS = 300;
export const DEFAULT_PREVIEW_PLACEHOLDER = "Preview will appear here after the image URL is checked.";
export const INVALID_PREVIEW_PLACEHOLDER = "Enter a valid image URL or local toy image path to preview it.";
export const ERROR_PREVIEW_PLACEHOLDER = "This image could not be loaded in preview.";
export const CHECKING_PREVIEW_PLACEHOLDER = "Checking image preview.";
export const CHECKING_PREVIEW_MESSAGE = "Checking whether this image can be loaded...";
export const READY_PREVIEW_MESSAGE = "Image preview is ready. This is what the toy card will use.";
export const LOCKED_PREVIEW_MESSAGE = "The image could not be loaded, so submit stays locked.";
export const CREATE_PREVIEW_MESSAGE = "Enter an image URL to verify it before submitting.";
export const UPDATE_PREVIEW_MESSAGE = "The save button unlocks after the new image is verified.";

export const TOY_IMAGE_VALIDATION_MESSAGES = Object.freeze({
  required: "Image URL is required.",
  invalidPath: "Enter an absolute URL or a local toy image path.",
  previewLoadError: "Image preview could not be loaded. Please check the URL or use another image.",
});

const ALLOWED_IMAGE_PROTOCOLS = new Set(TOY_ALLOWED_IMAGE_PROTOCOLS);

export function createValidationErrors() {
  return {
    name: "",
    image: "",
  };
}

export function createToyFormValues({ toy = null, includeLikes = false } = {}) {
  const values = {
    name: String(toy?.name ?? ""),
    image: String(toy?.image ?? ""),
  };

  if (includeLikes) {
    values.likes = Number.isFinite(toy?.likes) ? Number(toy.likes) : 0;
  }

  return values;
}

export function createPreviewState({
  message = CREATE_PREVIEW_MESSAGE,
  placeholderMessage = DEFAULT_PREVIEW_PLACEHOLDER,
} = {}) {
  return {
    status: TOY_PREVIEW_STATUS.IDLE,
    src: "",
    source: "",
    message,
    placeholderMessage,
    token: 0,
  };
}

export function createToyFormLifecycleState({
  toy = null,
  includeLikes = false,
  previewMessage = CREATE_PREVIEW_MESSAGE,
  previewPlaceholderMessage = DEFAULT_PREVIEW_PLACEHOLDER,
} = {}) {
  return {
    form: createToyFormValues({ toy, includeLikes }),
    localSubmitting: false,
    preview: createPreviewState({
      message: previewMessage,
      placeholderMessage: previewPlaceholderMessage,
    }),
    validationErrors: createValidationErrors(),
  };
}

function isSupportedImageUrl(imageUrl) {
  try {
    const parsedUrl = new URL(imageUrl, window.location.origin);
    return ALLOWED_IMAGE_PROTOCOLS.has(parsedUrl.protocol);
  } catch {
    return false;
  }
}

export function getNameError(value) {
  if (!value) {
    return "Toy name is required.";
  }

  if (value.length < TOY_NAME_MIN_LENGTH) {
    return `Toy name must have at least ${TOY_NAME_MIN_LENGTH} characters.`;
  }

  if (value.length > TOY_NAME_MAX_LENGTH) {
    return `Toy name must be ${TOY_NAME_MAX_LENGTH} characters or fewer.`;
  }

  return "";
}

export function getPreviewLoadError({ normalizedImageUrl = "", preview = null } = {}) {
  if (!normalizedImageUrl || !preview) {
    return "";
  }

  if (preview.status === TOY_PREVIEW_STATUS.ERROR && preview.source === normalizedImageUrl) {
    return TOY_IMAGE_VALIDATION_MESSAGES.previewLoadError;
  }

  return "";
}

export function getImageError({ value, normalizedImageUrl = "", preview = null } = {}) {
  if (!value) {
    return TOY_IMAGE_VALIDATION_MESSAGES.required;
  }

  if (!normalizedImageUrl || !isSupportedImageUrl(normalizedImageUrl)) {
    return TOY_IMAGE_VALIDATION_MESSAGES.invalidPath;
  }

  return getPreviewLoadError({ normalizedImageUrl, preview });
}

export function getSubmitDisableReason({
  isFormBusy = false,
  formBusyMessage = "",
  nameError = "",
  imageError = "",
  unchangedSubmitMessage = "",
  normalizedImageUrl = "",
  preview = null,
} = {}) {
  if (isFormBusy) {
    return formBusyMessage || "Please wait...";
  }

  if (nameError || imageError) {
    return "Complete the required fields with valid values.";
  }

  if (unchangedSubmitMessage) {
    return unchangedSubmitMessage;
  }

  if (!normalizedImageUrl) {
    return "Enter a valid image URL or local toy image path.";
  }

  if (!preview) {
    return "";
  }

  if (preview.status === TOY_PREVIEW_STATUS.ERROR && preview.source === normalizedImageUrl) {
    return "Use an image that can be loaded in preview.";
  }

  if (preview.source !== normalizedImageUrl || preview.status === TOY_PREVIEW_STATUS.PENDING) {
    return "Wait until the image preview finishes loading.";
  }

  if (preview.status !== TOY_PREVIEW_STATUS.READY) {
    return "Wait until the image preview is ready.";
  }

  return "";
}

export function loadImagePreview(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.decoding = "async";
    image.onload = () => resolve(source);
    image.onerror = () => reject(new Error("Image preview could not be loaded."));
    image.src = source;
  });
}
