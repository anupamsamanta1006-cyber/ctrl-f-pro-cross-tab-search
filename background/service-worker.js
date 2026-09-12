// CTRL+F Pro - Manifest V3 Service Worker

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  const data = await chrome.storage.local.get(["searchHistory"]);
  if (!Array.isArray(data.searchHistory)) {
    await chrome.storage.local.set({ searchHistory: [] });
  }
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === "GET_ACTIVE_TAB") {
    chrome.tabs.query({ active: true, lastFocusedWindow: true })
      .then(tabs => sendResponse({ tab: tabs[0] || null }))
      .catch(() => sendResponse({ tab: null }));
    return true;
  }
});
