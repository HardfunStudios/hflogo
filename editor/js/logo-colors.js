'use strict';

// Central color palette — shared by Blockly blocks and Logo syntax highlighter.
// Change here to update everywhere.
export const COLORS = {
  turtle:     '#4FC3F7', // motion commands  (lighter for dark bg)
  control:    '#CE93D8', // control flow     (lighter for dark bg)
  number:     '#FFB74D', // numbers/data     (lighter for dark bg)
  pen:        '#81C784', // pen/drawing      (lighter for dark bg)
  screen:     '#4DD0E1', // screen commands  (lighter for dark bg)
  proc:       '#F48FB1', // procedure def/call (lighter for dark bg)
  variable:   '#FFD54F', // variables/make
  boolean:    '#CE93D8', // verdade/falso
  comment:    '#6A9955', // ; comments
  string:     '#CE9178', // quoted strings
  operator:   '#D4D4D4', // operators
  punctuation:'#808080', // brackets
  varref:     '#9CDCFE', // :varname references
};

// Blockly block colours (HSV hue or hex) — used by TurtleBlocks.js / LPBlocks.js.
// Keep in sync with COLORS above (these are the saturated on-block versions).
export const BLOCK_COLORS = {
  turtle:  '#0081A6',
  control: '#8B5CF6',
  number:  '#F07D00',
  pen:     '#2ECC71',
  screen:  '#00607e',
  start:   '#D51414',
};
