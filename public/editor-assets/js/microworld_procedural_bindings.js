/*******
 *
 * This file makes a procedural binding between the Microworld object and the JS-Interpreter.
 * This is necessary since JS-Interpreter runs the js code in a separated environemnt from the browser, and
 * exchanging objects between the two environemnts is only possible through seriablization, which wouldn't work
 * for our needs.
 *
 * Author: Juliano Bittencourt <juliano@hardfunstudios.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 **/

/*****

LIST OF COMMANDS Supported by the Microwold canvas. One * means it's mapped to procedural, two ** means it's implemented in blocks.

move  **
turn  **
penup **
pendown **
setpenmode **
getpenmode **
setturtlemode **
getturtlemode **
ispendown  **
setcolor **
getcolor **
setwidth **
getwidth **
setfontsize **
getfontsize **
setposition **
towards **
setheading  **
clearscreen **
clear **
home **
showturtle **
hideturtle **
isturtlevisible **
getheading **
getxy **
drawtext **
beginpath *
fillpath *
fill **
arc **
getstate **
setstate **
**/


function moveCT(d) {
  currentworld.move(d);
}

function turnCT(v) {
  currentworld.turn(v);
}

function penupCT() {
  currentworld.penup() ;
}
function pendownCT() {
  currentworld.pendown() ;
}

function setpenmodeCT(v) {
  currentworld.setpenmode(v);
}

function getpenmodeCT() {
  return currentworld.getpenmode();
}

function setturtlemodeCT(v) {
  return currentworld.setturtlemode(v);
}

function getturtlemodeCT() {
  return currentworld.getturtlemode();
}

function ispendownCT() {
  return currentworld.ispendown();
}

function setcolorCT(color) {
  return currentworld.setcolor(color);
}

function getcolorCT() {
  return currentworld.getcolor();
}


function setwidthCT(w) {
  return currentworld.setwidth(w);
}

function getwidthCT() {
  return currentworld.getwidth();
}

function setfontsizeCT(size) {
  return currentworld.setfontsize(size);
}

function getfontsizeCT() {
  return currentworld.getfontsize();
}

function setpositionCT(x,y) {
  return currentworld.setposition(x,y);
}

function towardsCT(x,y) {
  return currentworld.towards(x,y);
}

function setheadingCT(angle) {
  return currentworld.setheading(angle);
}

function clearscreenCT() {
  return currentworld.clearscreen();
}

function clearCT() {
  return currentworld.clear();
}

function homeCT() {
  return currentworld.home();
}


function showCT() {
  currentworld.showturtle()
}

function hideCT() {
  currentworld.hideturtle()
}

function isturtlevisibleCT() {
  return currentworld.isturtlevisible();
}
function getheadingCT() {
  return Math.round(currentworld.getheading());
}
function getxyCT() {
  return currentworld.getxy();
}
function drawtextCT(text) {
  return currentworld.drawtext(text);
}
function beginpathCT() {
  return currentworld.beginpath();
}
function fillpathCT() {
  return currentworld.fillpath();
}
function fillCT() {
  return currentworld.fill();
}
function arcCT(angle, radius) {
  return currentworld.arc(angle, radius);
}
function getstateCT() {
  return currentworld.getstate();
}
function setstateCT(state) {
  return currentworld.setstate(state);
}
