// ======================
// CONFIG LOADER
// ======================
export async function loadGameConfig() {
  const urlParams = new URLSearchParams(window.location.search);
  const gameUrl = urlParams.get("game");

  // If no URL param, load the local sample file
  const fetchUrl = gameUrl || "data/ru.json";

  try {
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error("Config fetch failed");
    return await response.json();
  } catch (error) {
    console.error(
      "Failed to load game config, falling back to emergency defaults:",
      error
    );
    // Return a minimal structure to prevent crash if fetch fails entirely
    return null;
  }
}
