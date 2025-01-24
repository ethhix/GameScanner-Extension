const targetSite = "https://twitch.tv/";

let previousGameTitle = null;
const hoverContainer = document.createElement("div");
hoverContainer.style.position = "absolute";
hoverContainer.style.backgroundColor = "#583994";
hoverContainer.style.border = "1px solid #ccc";
hoverContainer.style.padding = "10px";
hoverContainer.style.borderRadius = "5px";
hoverContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
hoverContainer.style.display = "none";
hoverContainer.style.zIndex = "1000";
document.body.appendChild(hoverContainer);

function retrieveGameTitle() {
  const gameTitleElement = document.querySelector(
    'a[data-a-target="stream-game-link"]'
  );

  if (gameTitleElement) {
    const currentGameTitle = gameTitleElement.textContent;

    if (currentGameTitle !== previousGameTitle) {
      console.log(`Game title changed: ${currentGameTitle}`);
      previousGameTitle = currentGameTitle;

      chrome.runtime.sendMessage(
        { action: "getAppId", gameName: currentGameTitle },
        (response) => {
          console.log("Received response from background:", response);
          if (response.appId) {
            chrome.runtime.sendMessage(
              { action: "getGameData", appId: response.appId },
              (gameDataResponse) => {
                console.log("Received game data:", gameDataResponse);
                if (gameDataResponse.gameData) {
                  const gameData = gameDataResponse.gameData;
                  const { name, is_free, price_overview } = gameData;

                  let priceInfo = "Price not available";
                  if (is_free) {
                    priceInfo = "Free to Play";
                  } else if (price_overview) {
                    priceInfo = price_overview.final_formatted;
                  }
                  hoverContainer.innerHTML = `
                    <strong>${name}</strong>
                    <p>Price: ${priceInfo}</p>
                    <p>Genres: ${
                      gameData.genres
                        ?.map((genre) => genre.description)
                        .join(", ") || "N/A"
                    }</p>
                    <p><a href="https://store.steampowered.com/app/${
                      response.appId
                    }" target="_blank">View on Steam</a></p>
                  `;
                } else {
                  hoverContainer.innerHTML = `<strong>Game data not found</strong>`;
                }
              }
            );
          } else {
            hoverContainer.innerHTML = `<strong>Game Not Found</strong>`;
          }
        }
      );
    }
  }
}

function positionHoverContainer(targetElement) {
  const rect = targetElement.getBoundingClientRect();
  hoverContainer.style.top = `${rect.bottom + window.scrollY}px`;
  hoverContainer.style.left = `${rect.left + window.scrollX}px`;
}

const observer = new MutationObserver(() => {
  const gameTitleElement = document.querySelector(
    'a[data-a-target="stream-game-link"]'
  );

  if (gameTitleElement) {
    retrieveGameTitle();

    gameTitleElement.addEventListener("mouseenter", () => {
      positionHoverContainer(gameTitleElement);
      hoverContainer.style.display = "block";
    });

    hoverContainer.addEventListener("mouseenter", () => {
      positionHoverContainer(gameTitleElement);
      hoverContainer.style.display = "block";
    });

    gameTitleElement.addEventListener("mouseleave", () => {
      hoverContainer.style.display = "none";
    });

    hoverContainer.addEventListener("mouseleave", () => {
      hoverContainer.style.display = "none";
    });
  }
});

observer.observe(document.body, { childList: true, subtree: true });
