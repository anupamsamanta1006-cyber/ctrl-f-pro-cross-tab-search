// CTRL+F Pro - Advanced Content Script
// Features: TreeWalker, KMP/LPS, highlighting, current-match navigation,
// next/previous, floating navigation bar, clear/close, and focus from side panel.

(() => {
  "use strict";

  const HIGHLIGHT_CLASS = "ctrl-f-pro-highlight";
  const CURRENT_CLASS = "ctrl-f-pro-current";
  const NAV_ID = "ctrl-f-pro-navigation";
  const STYLE_ID = "ctrl-f-pro-style";

  let matches = [];
  let currentIndex = -1;
  let currentQuery = "";

  function buildLPS(pattern) {
    const lps = new Array(pattern.length).fill(0);
    let length = 0;
    let i = 1;

    while (i < pattern.length) {
      if (pattern[i] === pattern[length]) {
        lps[i] = ++length;
        i++;
      } else if (length > 0) {
        length = lps[length - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
    return lps;
  }

  function kmpFindAll(text, pattern) {
    if (!pattern || !text || pattern.length > text.length) return [];

    const lps = buildLPS(pattern);
    const found = [];
    let i = 0;
    let j = 0;

    while (i < text.length) {
      if (text[i] === pattern[j]) {
        i++;
        j++;
        if (j === pattern.length) {
          found.push(i - j);
          // Non-overlapping matches keep highlighting predictable and match normal Ctrl+F behavior.
          j = 0;
        }
      } else if (j > 0) {
        j = lps[j - 1];
      } else {
        i++;
      }
    }
    return found;
  }

  function shouldSkipElement(element) {
    if (!element) return true;
    if (element.closest(`#${NAV_ID}`)) return true;

    const tag = element.tagName;
    return [
      "SCRIPT", "STYLE", "NOSCRIPT", "INPUT", "TEXTAREA", "SELECT",
      "OPTION", "BUTTON", "VIDEO", "AUDIO", "CANVAS", "SVG"
    ].includes(tag);
  }

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .${HIGHLIGHT_CLASS} {
        background: #ffeb3b !important;
        color: #111 !important;
        border-radius: 3px !important;
        padding: 0 2px !important;
        box-decoration-break: clone !important;
        -webkit-box-decoration-break: clone !important;
      }
      .${CURRENT_CLASS} {
        background: #ff9800 !important;
        color: #111 !important;
        outline: 2px solid #e65100 !important;
        outline-offset: 1px !important;
      }
      #${NAV_ID} {
        position: fixed !important;
        top: 16px !important;
        right: 16px !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        gap: 7px !important;
        padding: 8px !important;
        border: 1px solid rgba(0,0,0,.16) !important;
        border-radius: 10px !important;
        background: rgba(255,255,255,.97) !important;
        box-shadow: 0 5px 20px rgba(0,0,0,.18) !important;
        font: 13px Arial, sans-serif !important;
        color: #222 !important;
        user-select: none !important;
      }
      #${NAV_ID} button {
        border: 0 !important;
        border-radius: 7px !important;
        padding: 7px 10px !important;
        background: #222 !important;
        color: #fff !important;
        cursor: pointer !important;
        font: 12px Arial, sans-serif !important;
      }
      #${NAV_ID} button:hover { background: #444 !important; }
      #${NAV_ID} .ctrl-f-pro-count {
        min-width: 55px !important;
        text-align: center !important;
        font-weight: 700 !important;
      }
      #${NAV_ID} .ctrl-f-pro-close {
        background: #eee !important;
        color: #222 !important;
        padding: 7px 9px !important;
      }
      #${NAV_ID} .ctrl-f-pro-close:hover { background: #ddd !important; }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function createNavigationBar() {
    let bar = document.getElementById(NAV_ID);
    if (bar) return bar;

    bar = document.createElement("div");
    bar.id = NAV_ID;
    bar.innerHTML = `
      <button type="button" data-action="prev" title="Previous match">← Previous</button>
      <span class="ctrl-f-pro-count" id="ctrl-f-pro-position">0 / 0</span>
      <button type="button" data-action="next" title="Next match">Next →</button>
      <button type="button" class="ctrl-f-pro-close" data-action="close" title="Clear search">✕</button>
    `;

    (document.body || document.documentElement).appendChild(bar);

    bar.addEventListener("click", event => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      if (action === "next") nextMatch();
      if (action === "prev") previousMatch();
      if (action === "close") clearSearch();
    });

    return bar;
  }

  function updateNavigation() {
    const position = document.getElementById("ctrl-f-pro-position");
    if (!position) return;
    position.textContent = matches.length
      ? `${currentIndex + 1} / ${matches.length}`
      : "0 / 0";
  }

  function showCurrentMatch() {
    matches.forEach(element => element.classList.remove(CURRENT_CLASS));

    if (!matches.length) {
      currentIndex = -1;
      updateNavigation();
      return;
    }

    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= matches.length) currentIndex = matches.length - 1;

    const current = matches[currentIndex];
    current.classList.add(CURRENT_CLASS);
    current.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    updateNavigation();
  }

  function nextMatch() {
    if (!matches.length) return;
    currentIndex = (currentIndex + 1) % matches.length;
    showCurrentMatch();
  }

  function previousMatch() {
    if (!matches.length) return;
    currentIndex = (currentIndex - 1 + matches.length) % matches.length;
    showCurrentMatch();
  }

  function removeHighlights() {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach(highlight => {
      const parent = highlight.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    });
    matches = [];
    currentIndex = -1;
  }

  function clearSearch() {
    removeHighlights();
    currentQuery = "";
    const bar = document.getElementById(NAV_ID);
    if (bar) bar.remove();
  }

  function searchAndHighlight(query) {
    removeHighlights();
    currentQuery = query;

    if (!query) {
      const bar = document.getElementById(NAV_ID);
      if (bar) bar.remove();
      return 0;
    }

    const pattern = query.toLocaleLowerCase();
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;
          if (!node.nodeValue || !node.nodeValue.toLocaleLowerCase().includes(pattern)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) textNodes.push(node);

    for (const textNode of textNodes) {
      if (!textNode.parentNode) continue;

      const original = textNode.nodeValue;
      const lower = original.toLocaleLowerCase();
      const positions = kmpFindAll(lower, pattern);
      if (!positions.length) continue;

      const fragment = document.createDocumentFragment();
      let cursor = 0;

      for (const index of positions) {
        if (index > cursor) {
          fragment.appendChild(document.createTextNode(original.slice(cursor, index)));
        }

        const highlight = document.createElement("span");
        highlight.className = HIGHLIGHT_CLASS;
        highlight.textContent = original.slice(index, index + pattern.length);
        fragment.appendChild(highlight);
        matches.push(highlight);
        cursor = index + pattern.length;
      }

      if (cursor < original.length) {
        fragment.appendChild(document.createTextNode(original.slice(cursor)));
      }

      textNode.parentNode.replaceChild(fragment, textNode);
    }

    createNavigationBar();
    currentIndex = matches.length ? 0 : -1;
    showCurrentMatch();
    return matches.length;
  }

  function focusMatch(index = 0) {
    if (!matches.length) return false;
    currentIndex = Math.max(0, Math.min(index, matches.length - 1));
    showCurrentMatch();
    return true;
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message?.action === "SEARCH_AND_HIGHLIGHT") {
        const query = String(message.query || "").trim();
        const count = searchAndHighlight(query);
        sendResponse({ count, title: document.title, url: location.href });
      } else if (message?.action === "FOCUS_MATCH") {
        sendResponse({ success: focusMatch(Number(message.index) || 0), count: matches.length });
      } else if (message?.action === "NEXT_MATCH") {
        nextMatch();
        sendResponse({ success: true, index: currentIndex, count: matches.length });
      } else if (message?.action === "PREVIOUS_MATCH") {
        previousMatch();
        sendResponse({ success: true, index: currentIndex, count: matches.length });
      } else if (message?.action === "CLEAR_SEARCH") {
        clearSearch();
        sendResponse({ success: true });
      } else if (message?.action === "GET_SEARCH_STATE") {
        sendResponse({ query: currentQuery, index: currentIndex, count: matches.length });
      }
    } catch (error) {
      console.error("CTRL+F Pro error:", error);
      sendResponse({ error: error.message || "Search failed" });
    }
    return true;
  });

  addStyle();
})();
