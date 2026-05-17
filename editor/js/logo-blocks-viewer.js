'use strict';
import * as Blockly from 'blockly';
import { BLOCKLY_BASE_OPTIONS } from './turtle-blocks-defs.js'; // also registers all blocks + locale
import { logoToBlocklyState } from './logo-to-blockly.js';

// Map from container element → Blockly workspace (for cleanup/resize)
const _workspaces = new WeakMap();

function mount(container, code) {
  // Tear down any previous workspace in this container
  unmount(container);

  let state;
  try {
    state = logoToBlocklyState(code);
  } catch (err) {
    container.innerHTML =
      `<div style="padding:20px;color:#c0392b;font-size:13px;font-family:monospace;">
        Erro ao converter: ${err.message}
       </div>`;
    return null;
  }

  const ws = Blockly.inject(container, {
    ...BLOCKLY_BASE_OPTIONS,
    readOnly: true,
    zoom: { ...BLOCKLY_BASE_OPTIONS.zoom, startScale: 0.65 },
  });

  Blockly.serialization.workspaces.load(state, ws);

  // Fit all blocks in view after layout settles
  requestAnimationFrame(() => {
    Blockly.svgResize(ws);
    ws.scrollCenter();
  });

  _workspaces.set(container, ws);
  return ws;
}

function unmount(container) {
  const ws = _workspaces.get(container);
  if (ws) { ws.dispose(); _workspaces.delete(container); }
}

function resize(container) {
  const ws = _workspaces.get(container);
  if (ws) Blockly.svgResize(ws);
}

window.LogoBlocksViewer = { mount, unmount, resize };
