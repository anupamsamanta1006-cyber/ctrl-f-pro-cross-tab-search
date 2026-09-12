 CTRL+F Pro – Cross-Tab Browser Search

CTRL+F Pro is an advanced Chrome Extension that allows users to search for text across multiple open browser tabs from a single interface.

Unlike the standard browser `Ctrl + F` search, CTRL+F Pro provides cross-tab searching, KMP-based string matching, text highlighting, match navigation, search history, and result ranking.

## 🚀 Features

* 🔎 Search text across multiple open Chrome tabs
* ⚡ KMP (Knuth-Morris-Pratt) string matching
* 🧠 LPS (Longest Prefix Suffix) preprocessing
* 📄 DOM text traversal using TreeWalker
* 🟨 Highlight all matching text
* ⬆️ Navigate to the next match
* ⬇️ Navigate to the previous match
* 🔢 Display current match position
* 📜 Search history
* 📊 Rank tabs based on number of matches
* 🔗 Click a result to switch directly to the corresponding tab
* 💾 Persistent search history using Chrome Storage API
* 🛡️ Handles restricted/unsupported browser pages
* ⚡ Searches multiple tabs efficiently
* 🎨 Chrome Side Panel based user interface

## 🛠️ Technologies Used

* JavaScript
* HTML5
* CSS3
* Chrome Extensions API
* Manifest V3
* Chrome Side Panel API
* Chrome Tabs API
* Chrome Storage API
* Service Worker
* DOM TreeWalker
* KMP String Matching Algorithm
* LPS Array

## 📁 Project Structure

```text
CTRL-F-Pro/
│
├── manifest.json
│
├── background/
│   └── service-worker.js
│
├── content/
│   └── content.js
│
└── sidepanel/
    ├── sidepanel.html
    ├── sidepanel.css
    └── sidepanel.js
```

## 🔄 How It Works

```text
User enters search query
          ↓
CTRL+F Pro Side Panel
          ↓
Get all open browser tabs
          ↓
Send search request to content scripts
          ↓
TreeWalker scans webpage text
          ↓
KMP algorithm searches for matches
          ↓
Match count calculated
          ↓
Matching text is highlighted
          ↓
Results are ranked by match count
          ↓
User selects a result
          ↓
Corresponding tab becomes active
          ↓
User navigates between matches
```

## 🧮 KMP Algorithm

CTRL+F Pro uses the **Knuth-Morris-Pratt (KMP)** algorithm instead of repeatedly using basic string-search operations.

KMP preprocesses the search pattern and creates an **LPS (Longest Prefix Suffix)** array.

### Why KMP?

For a text of length `n` and a pattern of length `m`:

```text
Naive String Search:
Worst Case → O(n × m)

KMP:
Time → O(n + m)
```

This makes KMP useful when searching large amounts of text.

## 🌳 TreeWalker

The extension uses the browser's DOM `TreeWalker` API to traverse text nodes.

This allows CTRL+F Pro to:

* Search actual webpage text
* Avoid unnecessary HTML parsing
* Identify individual text nodes
* Highlight matching portions of the page

Script, style, input, and other unsuitable elements are excluded from the search.

## 📊 Result Ranking

Each open tab is searched independently.

For example:

```text
Tab 1 → 12 matches
Tab 2 → 5 matches
Tab 3 → 0 matches
Tab 4 → 21 matches
```

The extension can rank results according to the number of matches:

```text
Tab 4 → 21 matches
Tab 1 → 12 matches
Tab 2 → 5 matches
Tab 3 → 0 matches
```

This helps users identify the most relevant tab quickly.

## 📜 Search History

Previous searches are stored using the Chrome Storage API.

This allows users to:

* View recent searches
* Reuse previous queries
* Maintain search history between sessions

## ⬆️ Next / Previous Navigation

After a search, matching elements are tracked by the content script.

The user can navigate through them:

```text
← Previous    3 / 15    Next →
```

The selected match is automatically scrolled into view.

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ctrl-f-pro-cross-tab-search.git
```

### 2. Open Chrome Extensions

Open:

```text
chrome://extensions
```

### 3. Enable Developer Mode

Turn on:

```text
Developer mode
```

### 4. Load the extension

Click:

```text
Load unpacked
```

Select the project folder containing:

```text
manifest.json
```

### 5. Start using CTRL+F Pro

Open multiple webpages in different tabs and use the CTRL+F Pro extension.

## 🧪 Example

Suppose five tabs are open:

```text
Google
Wikipedia
GitHub
Stack Overflow
Documentation
```

Search:

```text
JavaScript
```

CTRL+F Pro searches all supported tabs and displays results such as:

```text
GitHub              18 matches
Documentation       14 matches
Stack Overflow       9 matches
Wikipedia            4 matches
Google               0 matches
```

Selecting a result activates the corresponding tab.

## 🔐 Permissions

The extension uses the following permissions:

### `tabs`

Used to access information about open browser tabs and coordinate cross-tab searching.

### `storage`

Used to store search history.

### `sidePanel`

Used to provide the CTRL+F Pro interface through Chrome's Side Panel.

### `<all_urls>`

Allows the content script to operate on supported webpages so that their visible text can be searched.

## ⚠️ Limitations

CTRL+F Pro is intended for supported webpages.

Some Chrome-internal or restricted pages cannot be accessed by extensions, such as:

```text
chrome://
Chrome Web Store pages
Other browser-restricted pages
```

Search results may also vary on pages whose content is dynamically generated.

## 🔮 Future Improvements

Possible future enhancements include:

* Fuzzy search
* Regular-expression search
* Search filters
* Search within selected tabs
* Keyboard shortcuts
* Dark mode
* Match preview snippets
* Export search results
* Advanced relevance ranking
* Search analytics
* Web Worker based processing for extremely large pages

## 🎯 Project Highlights

This project demonstrates practical knowledge of:

* Chrome Extension development
* Manifest V3
* JavaScript
* DOM manipulation
* Browser APIs
* Service Workers
* Data Structures and Algorithms
* KMP string matching
* LPS preprocessing
* Tree traversal
* Asynchronous programming
* Cross-tab communication
* Local data persistence
* UI/UX development



## 📄 License

This project is created for educational and portfolio purposes.
