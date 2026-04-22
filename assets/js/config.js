const isLocalDevelopmentHost = ["127.0.0.1", "localhost"].includes(window.location.hostname);

export const TOY_API_URL =
  window.TOY_API_URL ||
  (isLocalDevelopmentHost
    ? "http://localhost:8080/api/toys"
    : "https://toy-api-server-nodejs.dangkhoa.dev/api/toys");

export const DEMO_DATA_PATH = "/assets/db.json";
export const TOY_IMAGE_DIRECTORY = "/assets/images/toys/";

export const TOY_FORM_FIELD_NAMES = Object.freeze({
  NAME: "name",
  IMAGE: "image",
});

export const TOY_FORM_EDITABLE_FIELDS = Object.freeze([
  TOY_FORM_FIELD_NAMES.NAME,
  TOY_FORM_FIELD_NAMES.IMAGE,
]);

export const TOY_SORT_ORDERS = Object.freeze({
  DEFAULT: "default",
  LIKES_DESC: "likes-desc",
  LIKES_ASC: "likes-asc",
});

export const TOY_SORT_ORDER_VALUES = Object.freeze([
  TOY_SORT_ORDERS.DEFAULT,
  TOY_SORT_ORDERS.LIKES_DESC,
  TOY_SORT_ORDERS.LIKES_ASC,
]);

export const TOY_ACTIONS = Object.freeze({
  LIKE: "like",
  EDIT: "edit",
  DELETE: "delete",
  RELOAD: "reload",
});

export const TOY_PREVIEW_STATUS = Object.freeze({
  IDLE: "idle",
  PENDING: "pending",
  READY: "ready",
  ERROR: "error",
});

export const TOY_COLLECTION_STATUS_VARIANTS = Object.freeze({
  INFO: "info",
  ERROR: "error",
});

export const TOY_TOAST_VARIANTS = Object.freeze({
  PRIMARY: "primary",
  SUCCESS: "success",
  WARNING: "warning",
  DANGER: "danger",
});

export const TOY_VALIDATION_LIMITS = Object.freeze({
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 120,
});

export const TOY_FORM_TIMINGS = Object.freeze({
  IMAGE_PREVIEW_DEBOUNCE_MS: 300,
});

export const TOY_ALLOWED_IMAGE_PROTOCOLS = Object.freeze(["http:", "https:"]);

export const TOY_UI_LIMITS = Object.freeze({
  SCROLL_TOP_VISIBLE_OFFSET_PX: 300,
});

export const TOY_UI_DELAYS = Object.freeze({
  HIGHLIGHT_RESET_MS: 700,
  RELOAD_AFTER_MS: 500,
});

export const TOY_TOAST_SETTINGS = Object.freeze({
  DEFAULT_DELAY_MS: 5000,
  ERROR_DELAY_MS: 3600,
  DEFAULT_TITLE: "Toy Tale",
});

export const TOY_TEMPLATE_SETTINGS = Object.freeze({
  SKELETON_CARD_COUNT: 4,
});

export const TOY_ANIMATION_SETTINGS = Object.freeze({
  CARD_ENTRY_DURATION_MS: 280,
  CARD_MOVE_DURATION_MS: 320,
  CARD_REMOVE_DURATION_MS: 300,
  CARD_REMOVE_FINISH_BUFFER_MS: 340,
  CARD_REMOVE_FALLBACK_MS: 320,
  TOY_REMOVE_RESOLVE_MS: 320,
  LIKES_POP_DURATION_MS: 360,
  CARD_ENTRY_OFFSET_Y_PX: 18,
  CARD_ENTRY_START_SCALE: 0.98,
  CARD_REMOVE_OFFSET_Y_PX: 16,
  CARD_REMOVE_END_SCALE: 0.97,
  CARD_ENTRY_EASING: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  CARD_MOVE_EASING: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  DEFAULT_EASING: "ease",
  LIKES_POP_PEAK_SCALE: 1.2,
});

const REMOTE_IMAGE_PATTERN = /^(?:https?:)?\/\//i;
const TOY_IMAGE_PREFIX_PATTERN =
  /^(?:\/?assets\/images\/toys\/|\/?images\/toys\/|\/?toys\/|\/?imgs\/)+/i;

export function normalizeToyImageUrl(image) {
  if (typeof image !== "string") {
    return "";
  }

  const trimmedImage = image.trim();

  if (!trimmedImage) {
    return "";
  }

  if (
    REMOTE_IMAGE_PATTERN.test(trimmedImage) ||
    trimmedImage.startsWith(TOY_IMAGE_DIRECTORY) ||
    trimmedImage.startsWith("/assets/")
  ) {
    return trimmedImage;
  }

  const normalizedRelativePath = trimmedImage
    .replace(/^\/+/, "")
    .replace(TOY_IMAGE_PREFIX_PATTERN, "");

  if (!normalizedRelativePath) {
    return TOY_IMAGE_DIRECTORY;
  }

  return `${TOY_IMAGE_DIRECTORY}${normalizedRelativePath}`;
}

export function toApiImageUrl(image) {
  const normalizedImage = normalizeToyImageUrl(image);

  if (!normalizedImage || REMOTE_IMAGE_PATTERN.test(normalizedImage)) {
    return normalizedImage;
  }

  return new URL(normalizedImage, window.location.origin).href;
}

export function normalizeToy(toy) {
  const likes = Number.parseInt(toy?.likes ?? 0, 10);

  return {
    ...toy,
    name: String(toy?.name ?? "").trim(),
    image: normalizeToyImageUrl(toy?.image),
    likes: Number.isFinite(likes) ? Math.max(likes, 0) : 0,
  };
}
