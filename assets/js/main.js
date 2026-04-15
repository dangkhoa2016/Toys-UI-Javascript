import { initApp } from "./app.js";
import { registerComponents } from "./components.js";

async function bootstrapApp() {
  await registerComponents();
  await initApp();
}

bootstrapApp().catch((error) => {
  console.error("Unable to start Toy Tale", error);
});