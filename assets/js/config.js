const isLocalDevelopmentHost = ["127.0.0.1", "localhost"].includes(window.location.hostname);

export const TOY_API_URL =
  window.TOY_API_URL ||
  (isLocalDevelopmentHost
    ? "http://localhost:8080/api/toys"
    : "https://humble-space-happiness-946x5q996j276rv-8080.app.github.dev/api/toys");

export const DEMO_DATA_PATH = "/assets/db.json";
export const TOY_IMAGE_DIRECTORY = "/assets/images/toys/";

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
