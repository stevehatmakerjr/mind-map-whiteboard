// ── Color palette ──────────────────────────────────────────────
const COLORS = {
  purple: { bg: '#EEEDFE', border: '#7F77DD', text: '#3C3489' },
  teal:   { bg: '#E1F5EE', border: '#1D9E75', text: '#085041' },
  coral:  { bg: '#FAECE7', border: '#D85A30', text: '#712B13' },
  amber:  { bg: '#FAEEDA', border: '#BA7517', text: '#633806' },
  blue:   { bg: '#E6F1FB', border: '#378ADD', text: '#0C447C' },
  pink:   { bg: '#FBEAF0', border: '#D4537E', text: '#72243E' },
  gray:   { bg: '#F1EFE8', border: '#888780', text: '#444441' },
};

// ── State ───────────────────────────────────────────────────────
let nodes         = [];
let edges         = [];
let selectedColor = 'purple';
let selectedNode  = null;
let connectMode   = false;
let connectFrom   = null;
let scale         = 1;
let ox            = 0;
let oy            = 0;
let isDraggingCanvas = false;
let dragStart        = null;
let draggingNode     = null;
let dragNodeStart    = null;
let nextId           = 1;

// ── DOM refs ────────────────────────────────────────────────────
const wrap     = document.getElementById('canvas-wrap');
const gridCvs  = document.getElementById('grid-canvas');
const mainCvs  = document.getElementById('main-canvas');
const interact = document.getElementById('interact');
const connHint = document.getElementById('conn-hint');

// ── Canvas resize ───────────────────────────────────────────────
function resize() {
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  gridCvs.width  = mainCvs.width  = w;
  gridCvs.height = mainCvs.height = h;
  drawGrid();
  drawEdges();
}

// ── Grid background ─────────────────────────────────────────────
function drawGrid() {
  const w   = gridCvs.width;
  const h   = gridCvs.height;
  const ctx = gridCvs.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  const step = 28 * scale;
  const offX = ((ox % step) + step) % step;
  const offY = ((oy % step) + step) % step;

  ctx.strokeStyle = 'rgba(128,128,128,0.13)';
  ctx.lineWidth   = 0.5;

  for (let x = offX; x < w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = offY; y < h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
}

// ── Coordinate helpers ──────────────────────────────────────────
function worldToScreen(x, y) {
  return { x: x * scale + ox, y: y * scale + oy };
}

function screenToWorld(x, y) {
  return { x: (x - ox) / scale, y: (y - oy) / scale };
}

function getNodeCenter(n) {
  const el = document.getElementById('n' + n.id);
  if (!el) return { x: n.x, y: n.y };
  return {
    x: n.x + el.offsetWidth  / 2 / scale,
    y: n.y + el.offsetHeight / 2 / scale,
  };
}

// ── Draw edges (curved bezier arrows) ──────────────────────────
function drawEdges() {
  const ctx = mainCvs.getContext('2d');
  ctx.clearRect(0, 0, mainCvs.width, mainCvs.height);

  edges.forEach(e => {
    const a = nodes.find(n => n.id === e.from);
    const b = nodes.find(n => n.id === e.to);
    if (!a || !b) return;

    const ca = getNodeCenter(a);
    const cb = getNodeCenter(b);
    const sx = ca.x * scale + ox;
    const sy = ca.y * scale + oy;
    const ex = cb.x * scale + ox;
    const ey = cb.y * scale + oy;

    const col = COLORS[a.color]?.border || '#999';
    const mx  = (sx + ex) / 2;
    const my  = (sy + ey) / 2;

    // Curved line
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(
      sx + (mx - sx) * 0.5, sy,
      ex + (mx - ex) * 0.5, ey,
      ex, ey
    );
    ctx.strokeStyle   = col;
    ctx.lineWidth     = 2;
    ctx.globalAlpha   = 0.6;
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(ey - sy, ex - sx);
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - 10 * Math.cos(angle - 0.4), ey - 10 * Math.sin(angle - 0.4));
    ctx.lineTo(ex - 10 * Math.cos(angle + 0.4), ey - 10 * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fillStyle   = col;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

// ── Position a node element on the canvas ──────────────────────
function positionNode(n) {
  const el = document.getElementById('n' + n.id);
  if (!el) return;
  el.style.left            = n.x * scale + ox + 'px';
  el.style.top             = n.y * scale + oy + 'px';
  el.style.transform       = `scale(${scale})`;
  el.style.transformOrigin = 'top left';
}

// ── Refresh all positions + redraws ────────────────────────────
function updateAllPositions() {
  nodes.forEach(n => positionNode(n));
  drawGrid();
  drawEdges();
}

// ── Create a node DOM element ───────────────────────────────────
function createNodeEl(n) {
  const c  = COLORS[n.color] || COLORS.purple;
  const el = document.createElement('div');
  el.className      = 'node-el';
  el.id             = 'n' + n.id;
  el.style.background  = c.bg;
  el.style.borderColor = c.border;
  el.style.color       = c.text;

  // Delete badge
  const del = document.createElement('div');
  del.className = 'node-del';
  del.textContent = '✕';
  del.title = 'Delete node';
  del.addEventListener('mousedown', e => {
    e.stopPropagation();
    deleteNode(n.id);
  });
  el.appendChild(del);

  // Editable text area
  const ta = document.createElement('textarea');
  ta.value = n.label;
  ta.rows  = 1;
  ta.style.color = c.text;
  ta.addEventListener('input', () => {
    n.label = ta.value;
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
    setTimeout(() => { positionNode(n); drawEdges(); }, 0);
  });
  ta.addEventListener('mousedown', e => e.stopPropagation());
  ta.addEventListener('focus', () => selectNode(n.id));
  el.appendChild(ta);

  // Node mouse interactions
  el.addEventListener('mousedown', e => {
    if (e.target === del) return;

    // Connect mode: pick source then destination
    if (connectMode) {
      if (connectFrom === null) {
        connectFrom = n.id;
        connHint.textContent = 'Now click the destination node';
        el.style.outline = '2px solid ' + c.border;
      } else if (connectFrom !== n.id) {
        const exists = edges.find(e2 =>
          (e2.from === connectFrom && e2.to === n.id) ||
          (e2.from === n.id && e2.to === connectFrom)
        );
        if (!exists) edges.push({ from: connectFrom, to: n.id });
        const fromEl = document.getElementById('n' + connectFrom);
        if (fromEl) fromEl.style.outline = '';
        connectFrom = null;
        connHint.textContent = 'Click source node to start a connection';
        drawEdges();
      }
      return;
    }

    // Drag mode
    selectNode(n.id);
    draggingNode = n.id;
    const r  = wrap.getBoundingClientRect();
    const wp = screenToWorld(e.clientX - r.left, e.clientY - r.top);
    dragNodeStart = { mx: wp.x, my: wp.y, nx: n.x, ny: n.y };
    e.preventDefault();
  });

  interact.appendChild(el);
  positionNode(n);

  setTimeout(() => { ta.focus(); ta.select(); }, 50);
}

// ── Add a new node ──────────────────────────────────────────────
function addNode(wx, wy, label = 'New idea') {
  const n = { id: nextId++, x: wx, y: wy, label, color: selectedColor };
  nodes.push(n);
  createNodeEl(n);
  selectNode(n.id);
  drawEdges();
}

// ── Select / deselect ───────────────────────────────────────────
function selectNode(id) {
  selectedNode = id;
  document.querySelectorAll('.node-el').forEach(el => el.classList.remove('selected'));
  if (id !== null) {
    const el = document.getElementById('n' + id);
    if (el) el.classList.add('selected');
  }
}

// ── Delete a node and its edges ─────────────────────────────────
function deleteNode(id) {
  nodes = nodes.filter(n => n.id !== id);
  edges = edges.filter(e => e.from !== id && e.to !== id);
  const el = document.getElementById('n' + id);
  if (el) el.remove();
  if (selectedNode === id) selectedNode = null;
  drawEdges();
}

// ── Canvas interactions ─────────────────────────────────────────

// Double-click empty canvas → add node
interact.addEventListener('dblclick', e => {
  if (connectMode) return;
  const r  = wrap.getBoundingClientRect();
  const wp = screenToWorld(e.clientX - r.left, e.clientY - r.top);
  addNode(wp.x - 60, wp.y - 20);
});

// Mousedown on empty canvas → start pan OR deselect
interact.addEventListener('mousedown', e => {
  if (e.target !== interact) return;

  if (connectMode) {
    connectFrom = null;
    connHint.textContent = 'Click source node to start a connection';
    return;
  }

  selectNode(null);
  isDraggingCanvas = true;
  interact.style.cursor = 'grabbing';
  dragStart = { x: e.clientX - ox, y: e.clientY - oy };
});

window.addEventListener('mousemove', e => {
  // Pan canvas
  if (isDraggingCanvas && dragStart) {
    ox = e.clientX - dragStart.x;
    oy = e.clientY - dragStart.y;
    updateAllPositions();
  }

  // Drag node
  if (draggingNode !== null && dragNodeStart) {
    const r  = wrap.getBoundingClientRect();
    const wp = screenToWorld(e.clientX - r.left, e.clientY - r.top);
    const n  = nodes.find(n => n.id === draggingNode);
    if (n) {
      n.x = dragNodeStart.nx + (wp.x - dragNodeStart.mx);
      n.y = dragNodeStart.ny + (wp.y - dragNodeStart.my);
      positionNode(n);
      drawEdges();
    }
  }
});

window.addEventListener('mouseup', () => {
  isDraggingCanvas = false;
  draggingNode     = null;
  dragNodeStart    = null;
  interact.style.cursor = connectMode ? 'crosshair' : 'default';
});

// Scroll to zoom
wrap.addEventListener('wheel', e => {
  e.preventDefault();
  const r     = wrap.getBoundingClientRect();
  const mx    = e.clientX - r.left;
  const my    = e.clientY - r.top;
  const delta = e.deltaY < 0 ? 1.1 : 0.91;
  const newScale = Math.min(3, Math.max(0.2, scale * delta));
  ox    = mx - (mx - ox) * (newScale / scale);
  oy    = my - (my - oy) * (newScale / scale);
  scale = newScale;
  updateAllPositions();
}, { passive: false });

// ── Toolbar buttons ─────────────────────────────────────────────
document.getElementById('btn-add').addEventListener('click', () => {
  const r  = wrap.getBoundingClientRect();
  const wp = screenToWorld(r.width / 2 - 60, r.height / 2 - 20);
  addNode(wp.x, wp.y);
});

document.getElementById('btn-connect').addEventListener('click', () => {
  connectMode  = !connectMode;
  connectFrom  = null;
  document.getElementById('btn-connect').classList.toggle('active', connectMode);
  interact.style.cursor = connectMode ? 'crosshair' : 'default';
  connHint.textContent  = connectMode ? 'Click source node to start a connection' : '';
});

document.getElementById('btn-delete').addEventListener('click', () => {
  if (selectedNode !== null) deleteNode(selectedNode);
});

document.getElementById('btn-zin').addEventListener('click', () => {
  scale = Math.min(3, scale * 1.2);
  updateAllPositions();
});

document.getElementById('btn-zout').addEventListener('click', () => {
  scale = Math.max(0.2, scale * 0.83);
  updateAllPositions();
});

document.getElementById('btn-fit').addEventListener('click', () => {
  if (!nodes.length) { scale = 1; ox = 0; oy = 0; updateAllPositions(); return; }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(n => {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + 160);
    maxY = Math.max(maxY, n.y + 60);
  });

  const pw = wrap.clientWidth  - 80;
  const ph = wrap.clientHeight - 80;
  scale = Math.min(pw / (maxX - minX), ph / (maxY - minY), 1.5);
  ox    = (wrap.clientWidth  - (maxX - minX) * scale) / 2 - minX * scale;
  oy    = (wrap.clientHeight - (maxY - minY) * scale) / 2 - minY * scale;
  updateAllPositions();
});

document.getElementById('btn-clear').addEventListener('click', () => {
  if (!confirm('Clear the entire board?')) return;
  nodes = []; edges = []; selectedNode = null; connectFrom = null;
  interact.innerHTML = '';
  drawEdges();
  drawGrid();
});

// ── Color picker ────────────────────────────────────────────────
document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    selectedColor = dot.dataset.color;
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
    dot.classList.add('selected');

    // Recolor selected node if one is active
    if (selectedNode !== null) {
      const n = nodes.find(n => n.id === selectedNode);
      if (n) {
        n.color = selectedColor;
        const el = document.getElementById('n' + n.id);
        const c  = COLORS[selectedColor];
        el.style.background  = c.bg;
        el.style.borderColor = c.border;
        el.style.color       = c.text;
        el.querySelector('textarea').style.color = c.text;
        drawEdges();
      }
    }
  });
});

// ── Keyboard shortcuts ──────────────────────────────────────────
window.addEventListener('keydown', e => {
  const isTyping = document.activeElement.tagName === 'TEXTAREA';

  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode !== null && !isTyping) {
    deleteNode(selectedNode);
  }

  if (e.key === 'Escape') {
    selectNode(null);
    connectMode  = false;
    connectFrom  = null;
    document.getElementById('btn-connect').classList.remove('active');
    interact.style.cursor = 'default';
    connHint.textContent  = '';
    document.querySelectorAll('.node-el').forEach(el => el.style.outline = '');
  }
});

// ── Init ────────────────────────────────────────────────────────
new ResizeObserver(resize).observe(wrap);
resize();

// Start with one node in the center
ox = wrap.clientWidth  / 2 - 100;
oy = wrap.clientHeight / 2 - 30;
addNode(0, 0, 'Main topic');
