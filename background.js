let gameMap;

// Load games.json
fetch(chrome.runtime.getURL("assets/games.json"))
  .then((response) => response.json())
  .then((data) => {
    gameMap = data;
    console.log("Game map loaded successfully");
  })
  .catch((error) => console.error("Failed to load game map:", error));

// Normalize game names
function normalizeGameName(name) {
  return name
    .toLowerCase()
    .replace(/™/g, "")
    .replace(/®/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Get AppID for a game
function getAppId(gameName) {
  const normalized = normalizeGameName(gameName);
  console.log("Normalized name:", normalized);
  return gameMap[normalized] || null;
}

// Fetch game data from Steam API
async function getGameData(appId) {
  const apiURL = `https://store.steampowered.com/api/appdetails?appids=${appId}`;

  try {
    const response = await fetch(apiURL);
    const data = await response.json();
    if (data[appId]?.success) {
      return data[appId].data; // Return the game data
    } else {
      console.error("Steam API request failed:", data[appId]);
      return null;
    }
  } catch (error) {
    console.error("Error fetching game data:", error);
    return null;
  }
}

// Listen for messages from content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getAppId") {
    console.log("Received request for game:", request.gameName);
    if (!gameMap) {
      console.error("Game map not loaded yet!");
      sendResponse({ appId: null });
      return true;
    }
    const appId = getAppId(request.gameName);
    console.log("Sending AppID:", appId);
    sendResponse({ appId });
  } else if (request.action === "getGameData") {
    console.log("Received request for game data:", request.appId);
    getGameData(request.appId).then((gameData) => {
      sendResponse({ gameData });
    });
    return true;
  }
});
