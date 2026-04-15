import {
  DEMO_DATA_PATH,
  TOY_API_URL,
  normalizeToy,
  toApiImageUrl,
} from "./config.js";

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

async function requestJson(resource, options) {
  const response = await fetch(resource, options);
  const payload = await parseJson(response).catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || `${response.status} ${response.statusText}`.trim());
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