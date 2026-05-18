# Mind Map Whiteboard

An infinite-canvas mind mapping tool built with pure HTML, CSS, and JavaScript. No frameworks, no libraries, no build tools — just three files you can open straight in a browser.

![License](https://img.shields.io/badge/license-MIT-blue) 

---

## Features

- **Infinite canvas** — pan freely in any direction
- **Add nodes** — click the toolbar button or double-click anywhere on the canvas
- **Drag nodes** — reposition any node by dragging it
- **Connect nodes** — draw curved bezier arrows between nodes to show relationships
- **Color coding** — 7 color themes to categorize your ideas
- **Zoom** — scroll wheel or toolbar buttons to zoom in and out
- **Fit all** — auto-zoom to show every node at once
- **Edit in place** — click any node's text to edit it directly
- **Delete** — hover a node for the ✕ badge, or select and press Delete
- **Keyboard shortcuts** — see below
- **Zero dependencies** — no npm, no framework, no internet connection required

---

## Getting Started

1. Download or clone this repository
2. Open `index.html` in any modern browser
3. Start mapping!

```bash
git clone https://github.com/your-username/mind-map-whiteboard.git
cd mind-map-whiteboard
# Then open index.html in your browser
```

No server required. Works in Chrome, Firefox, Edge, and Safari.

---

## File Structure

```
mind-map-whiteboard/
├── index.html   # Page structure and toolbar markup
├── style.css    # All visual styling
└── app.js       # All canvas logic and interactivity
```

---

## How to Use

### Adding nodes
- **Double-click** anywhere on the canvas to drop a node at that spot
- Click **+ Add node** in the toolbar to place one at the center

### Connecting nodes
1. Click **Connect** in the toolbar to enter connection mode
2. Click the **source** node
3. Click the **destination** node — a curved arrow is drawn between them
4. Click **Connect** again (or press Escape) to exit connection mode

### Changing colors
- Pick a color from the toolbar before adding a node
- Or select an existing node first, then click a color to recolor it

### Panning and zooming
- **Drag** the empty canvas to pan
- **Scroll** to zoom in and out
- Click **Fit all** to zoom to show all nodes at once

### Deleting
- Hover a node and click the **✕** badge
- Select a node and click **Delete** in the toolbar
- Select a node and press `Delete` or `Backspace` on your keyboard

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Delete` / `Backspace` | Delete the selected node |
| `Escape` | Deselect / exit connect mode |
| Double-click canvas | Add a new node at that position |

---

## Color Themes

| Color | Use case idea |
|-------|--------------|
| Purple | Main topics |
| Teal | Subtopics |
| Coral | Action items |
| Amber | Warnings / cautions |
| Blue | Information / notes |
| Pink | Questions |
| Gray | Supporting details |

---

## Roadmap / Ideas for Future Features

- [ ] Save and load boards (localStorage or JSON export)
- [ ] Undo / redo
- [ ] Delete individual connections
- [ ] Label arrows with text
- [ ] Mobile / touch support
- [ ] Dark mode toggle
- [ ] Export as PNG or SVG

---

## License

MIT — free to use, modify, and share.
