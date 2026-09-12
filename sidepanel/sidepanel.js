"use strict";

const input = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const clearButton = document.getElementById("clearButton");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const status = document.getElementById("status");
const timer = document.getElementById("timer");
const resultsDiv = document.getElementById("results");
const historyDiv = document.getElementById("history");

const MAX_HISTORY = 10;

searchButton.addEventListener("click", searchAllTabs);
clearButton.addEventListener("click", clearSearch);
clearHistoryButton.addEventListener("click", clearHistory);

input.addEventListener("keydown", event => {
  if (event.key === "Enter") searchAllTabs();
  if (event.key === "Escape") clearSearch();
});

loadSavedState();

async function loadSavedState() {
  const data = await chrome.storage.local.get(["searchHistory", "lastQuery"]);
  renderHistory(Array.isArray(data.searchHistory) ? data.searchHistory : []);
  if (data.lastQuery) input.value = data.lastQuery;
}

async function searchAllTabs() {
  const query = input.value.trim();
  if (!query) {
    status.textContent = "Please enter something to search.";
    timer.textContent = "";
    resultsDiv.innerHTML = `<div class="empty-message">Enter a word or phrase to search all open tabs.</div>`;
    return;
  }

  const start = performance.now();
  searchButton.disabled = true;
  searchButton.textContent = "...";
  status.textContent = "Searching open tabs...";
  timer.textContent = "";
  resultsDiv.innerHTML = `<div class="empty-message">Searching...</div>`;

  try {
    await saveHistory(query);
    const tabs = await chrome.tabs.query({});
    const searchableTabs = tabs.filter(tab => tab.id && isSearchableUrl(tab.url));

    const responses = await Promise.all(searchableTabs.map(async tab => {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "SEARCH_AND_HIGHLIGHT",
          query
        });
        if (response?.count > 0) {
          return {
            tabId: tab.id,
            windowId: tab.windowId,
            title: response.title || tab.title || "Untitled",
            url: response.url || tab.url || "",
            count: response.count
          };
        }
      } catch (_) {
        // Chrome pages such as chrome:// and restricted pages cannot receive content-script messages.
      }
      return null;
    }));

    const results = responses.filter(Boolean).sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
    displayResults(results);

    const total = results.reduce((sum, item) => sum + item.count, 0);
    const elapsed = Math.round(performance.now() - start);
    status.textContent = `${total} match(es) in ${results.length} tab(s)`;
    timer.textContent = `${elapsed} ms`;
  } catch (error) {
    console.error(error);
    status.textContent = "Search failed. Please try again.";
    resultsDiv.innerHTML = `<div class="empty-message error">${escapeHTML(error.message || "Unknown error")}</div>`;
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Search";
  }
}

function displayResults(results) {
  resultsDiv.innerHTML = "";
  if (!results.length) {
    resultsDiv.innerHTML = `<div class="empty-message">No matches found in searchable tabs.</div>`;
    return;
  }

  results.forEach((result, index) => {
    const card = document.createElement("div");
    card.className = "result";
    card.innerHTML = `
      <div class="result-title">${escapeHTML(result.title)}</div>
      <div class="result-url">${escapeHTML(result.url)}</div>
      <div class="result-bottom">
        <span class="match-count">${result.count} match${result.count === 1 ? "" : "es"}</span>
        <span class="rank">Rank #${index + 1}</span>
      </div>
    `;

    card.addEventListener("click", async () => {
      try {
        await chrome.windows.update(result.windowId, { focused: true });
        await chrome.tabs.update(result.tabId, { active: true });
        await chrome.tabs.sendMessage(result.tabId, { action: "FOCUS_MATCH", index: 0 });
      } catch (error) {
        console.error("Could not focus result:", error);
      }
    });

    resultsDiv.appendChild(card);
  });
}

async function saveHistory(query) {
  const data = await chrome.storage.local.get(["searchHistory"]);
  let history = Array.isArray(data.searchHistory) ? data.searchHistory : [];
  history = [query, ...history.filter(item => item.toLowerCase() !== query.toLowerCase())].slice(0, MAX_HISTORY);
  await chrome.storage.local.set({ searchHistory: history, lastQuery: query });
  renderHistory(history);
}

async function clearHistory() {
  await chrome.storage.local.set({ searchHistory: [] });
  renderHistory([]);
}

function renderHistory(history) {
  historyDiv.innerHTML = "";
  if (!history.length) {
    historyDiv.innerHTML = `<span style="font-size:11px;color:#999">No recent searches</span>`;
    return;
  }

  history.forEach(query => {
    const button = document.createElement("button");
    button.textContent = query;
    button.title = `Search for ${query}`;
    button.addEventListener("click", () => {
      input.value = query;
      searchAllTabs();
    });
    historyDiv.appendChild(button);
  });
}

async function clearSearch() {
  input.value = "";
  status.textContent = "Ready to search";
  timer.textContent = "";
  resultsDiv.innerHTML = `<div class="empty-message">Enter a word or phrase to search all open tabs.</div>`;

  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.filter(tab => tab.id && isSearchableUrl(tab.url)).map(async tab => {
    try { await chrome.tabs.sendMessage(tab.id, { action: "CLEAR_SEARCH" }); } catch (_) {}
  }));
}

function isSearchableUrl(url = "") {
  return /^(https?|file):/i.test(url);
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = String(text ?? "");
  return div.innerHTML;
}
