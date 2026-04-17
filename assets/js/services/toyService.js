import {
  DEMO_DATA_PATH,
  TOY_API_URL,
  normalizeToy,
  toApiImageUrl,
} from "../config.js";

class ApiError extends Error {
  constructor(message, { statusCode, details, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function buildJsonOptions(method, body) {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  };
}

async function parseJson(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function formatServerErrorMessage(message, details) {
  if (typeof message !== "string") {
    return "Request failed.";
  }

  const normalizedMessage = message.trim();

  if (!normalizedMessage) {
    return "Request failed.";
  }

  if (/must have required property 'name'/i.test(normalizedMessage)) {
    return "Toy name is required.";
  }

  if (/must have required property 'image'/i.test(normalizedMessage)) {
    return "Image URL is required.";
  }

  if (/name/i.test(normalizedMessage) && /fewer than 2 characters/i.test(normalizedMessage)) {
    return "Toy name must have at least 2 characters.";
  }

  if (/name/i.test(normalizedMessage) && /more than|longer than/i.test(normalizedMessage)) {
    return "Toy name is too long.";
  }

  if (/image/i.test(normalizedMessage) && /format "uri"/i.test(normalizedMessage)) {
    return "Image URL must be a valid absolute URL starting with http:// or https://.";
  }

  if (/likes/i.test(normalizedMessage) && /must be >= 0/i.test(normalizedMessage)) {
    return "Likes must be 0 or greater.";
  }

  if (/toy quota exceeded/i.test(normalizedMessage) && details?.limit) {
    return `Toy quota exceeded. You can keep up to ${details.limit} active toys right now.`;
  }

  return normalizedMessage
    .replace(/^body\//i, "")
    .replace(/^body\s+/i, "")
    .replace(/^params\//i, "")
    .replace(/^querystring\//i, "")
    .replace(/^response\//i, "");
}

function getErrorPayload(payload) {
  if (payload?.error && typeof payload.error === "object") {
    return payload.error;
  }

  return payload;
}

async function requestJson(resource, options) {
  const response = await fetch(resource, options);
  const payload = await parseJson(response).catch(() => null);

  if (!response.ok) {
    const errorPayload = getErrorPayload(payload);
    const fallbackMessage = `${response.status} ${response.statusText}`.trim() || `Request failed with status ${response.status}`;
    const message = formatServerErrorMessage(errorPayload?.message || payload?.message || fallbackMessage, errorPayload?.details);

    throw new ApiError(message, {
      statusCode: errorPayload?.statusCode || response.status,
      details: errorPayload?.details,
    });
  }

  return payload;
}

export async function fetchToys() {
  const toys = await requestJson(TOY_API_URL);
  return Array.isArray(toys) ? toys.map(normalizeToy) : [];
}

export async function seedDemoToys() {
  const demoData = await requestJson(DEMO_DATA_PATH);
  const toys = Array.isArray(demoData?.toys) ? demoData.toys.map(normalizeToy) : [];

  await Promise.all(
    toys.map((toy) =>
      requestJson(
        TOY_API_URL,
        buildJsonOptions("POST", {
          name: toy.name,
          image: toApiImageUrl(toy.image),
          likes: toy.likes,
        })
      )
    )
  );

  return toys;
}

export async function fetchOrSeedToys() {
  const toys = await fetchToys();

  if (toys.length > 0) {
    return toys;
  }

  await seedDemoToys();
  return fetchToys();
}

export async function createToy({ name, image }) {
  const toy = await requestJson(
    TOY_API_URL,
    buildJsonOptions("POST", {
      name: String(name ?? "").trim(),
      image: toApiImageUrl(image),
      likes: 0,
    })
  );

  return normalizeToy(toy);
}

export async function updateToy(toyId, { name, image, likes }) {
  const toy = await requestJson(
    `${TOY_API_URL}/${toyId}`,
    buildJsonOptions("PUT", {
      name: String(name ?? "").trim(),
      image: toApiImageUrl(image),
      likes: Number.isFinite(Number(likes)) ? Math.max(0, Number(likes)) : 0,
    })
  );

  return normalizeToy(toy);
}

export async function likeToy(toy) {
  const updatedToy = await requestJson(
    `${TOY_API_URL}/${toy.id}/likes`,
    buildJsonOptions("PATCH", {
      likes: Number(toy.likes ?? 0) + 1,
    })
  );

  return normalizeToy({
    ...toy,
    ...updatedToy,
  });
}

export async function deleteToy(toyId) {
  await requestJson(`${TOY_API_URL}/${toyId}`, {
    method: "DELETE",
  });

  return toyId;
}

export const toyService = {
  fetchToys,
  seedDemoToys,
  fetchOrSeedToys,
  createToy,
  updateToy,
  likeToy,
  deleteToy,
};
