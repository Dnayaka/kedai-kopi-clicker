// icons.js — flat two-tone SVG icon system for Kedai Kopi Clicker.
// Zero DOM access at import time; elements are only created inside createIcon().
// All nodes are built with document.createElementNS + setAttribute only.

var SVG_NS = "http://www.w3.org/2000/svg";

var PRIMARY = "#6d4c41";
var DARK = "#4e342e";
var ACCENT = "#ffd54f";
var CREAM = "#fdf6ec";
var PINK = "#f48fb1";
var PINK_DARK = "#c2537d";

function el(svg, tag, attrs) {
  var node = document.createElementNS(SVG_NS, tag);
  for (var key in attrs) {
    if (Object.prototype.hasOwnProperty.call(attrs, key)) {
      node.setAttribute(key, String(attrs[key]));
    }
  }
  svg.appendChild(node);
  return node;
}

var ICONS = {
  // steaming coffee cup — brand icon
  cup: function (svg) {
    el(svg, "path", { d: "M8.3 2.2c-.9 1.2.9 1.9 0 3.4", fill: "none", stroke: ACCENT, "stroke-width": 1.5, "stroke-linecap": "round" });
    el(svg, "path", { d: "M11.8 2.2c-.9 1.2.9 1.9 0 3.4", fill: "none", stroke: ACCENT, "stroke-width": 1.5, "stroke-linecap": "round" });
    el(svg, "path", { d: "M15.8 10.6h1.1a2.6 2.6 0 0 1 0 5.2h-1.1", fill: "none", stroke: DARK, "stroke-width": 1.6 });
    el(svg, "rect", { x: 4.6, y: 8.4, width: 11.6, height: 1.7, rx: 0.85, fill: DARK });
    el(svg, "rect", { x: 5.4, y: 10, width: 10, height: 7.6, rx: 1.6, fill: PRIMARY });
    el(svg, "rect", { x: 4, y: 18.6, width: 12.8, height: 1.8, rx: 0.9, fill: DARK });
  },

  // cafe table + chair with a cup on top
  table: function (svg) {
    el(svg, "rect", { x: 2.6, y: 4.8, width: 1.9, height: 9.4, rx: 0.9, fill: DARK });
    el(svg, "rect", { x: 2.6, y: 12.4, width: 6.2, height: 1.9, rx: 0.9, fill: PRIMARY });
    el(svg, "rect", { x: 6.9, y: 14, width: 1.7, height: 6.6, fill: DARK });
    el(svg, "rect", { x: 13.2, y: 6.6, width: 4.4, height: 2.9, rx: 0.7, fill: ACCENT });
    el(svg, "rect", { x: 9.4, y: 9.5, width: 12, height: 1.9, rx: 0.95, fill: PRIMARY });
    el(svg, "rect", { x: 14.5, y: 11.4, width: 1.9, height: 8.2, fill: DARK });
    el(svg, "rect", { x: 11.9, y: 19.2, width: 7.1, height: 1.7, rx: 0.85, fill: DARK });
  },

  // person with apron
  barista: function (svg) {
    el(svg, "circle", { cx: 12, cy: 5.6, r: 3.1, fill: CREAM, stroke: DARK, "stroke-width": 1 });
    el(svg, "rect", { x: 7.2, y: 9.3, width: 9.6, height: 9.6, rx: 3, fill: PRIMARY });
    el(svg, "rect", { x: 11.1, y: 9.8, width: 1.8, height: 2.6, fill: CREAM });
    el(svg, "rect", { x: 9.5, y: 12.2, width: 5, height: 6.7, rx: 1, fill: CREAM });
    el(svg, "circle", { cx: 12, cy: 14.4, r: 0.9, fill: ACCENT });
  },

  // espresso machine
  espresso: function (svg) {
    el(svg, "rect", { x: 5, y: 2.8, width: 14, height: 2.3, rx: 1, fill: DARK });
    el(svg, "rect", { x: 4, y: 5, width: 16, height: 7.4, rx: 1, fill: PRIMARY });
    el(svg, "circle", { cx: 8, cy: 8.7, r: 1.8, fill: ACCENT });
    el(svg, "circle", { cx: 13, cy: 8.7, r: 1, fill: CREAM });
    el(svg, "circle", { cx: 16.2, cy: 8.7, r: 1, fill: CREAM });
    el(svg, "rect", { x: 10, y: 12.4, width: 4, height: 1.9, fill: DARK });
    el(svg, "rect", { x: 11.3, y: 14.3, width: 1.4, height: 1.3, fill: DARK });
    el(svg, "rect", { x: 10.1, y: 16.1, width: 3.8, height: 3.1, rx: 0.6, fill: CREAM, stroke: DARK, "stroke-width": 0.9 });
    el(svg, "rect", { x: 6, y: 19.6, width: 12, height: 1.7, rx: 0.85, fill: DARK });
  },

  // person with chef hat
  barista2: function (svg) {
    el(svg, "rect", { x: 8.5, y: 1.8, width: 7, height: 4.4, rx: 2.1, fill: CREAM, stroke: DARK, "stroke-width": 0.9 });
    el(svg, "rect", { x: 8.5, y: 6, width: 7, height: 1.5, fill: DARK });
    el(svg, "circle", { cx: 12, cy: 10.1, r: 2.7, fill: CREAM, stroke: DARK, "stroke-width": 1 });
    el(svg, "rect", { x: 7.6, y: 13.1, width: 8.8, height: 7.2, rx: 3, fill: DARK });
    el(svg, "circle", { cx: 12, cy: 15.6, r: 0.75, fill: ACCENT });
    el(svg, "circle", { cx: 12, cy: 17.9, r: 0.75, fill: ACCENT });
  },

  // small shop / house
  house: function (svg) {
    el(svg, "polygon", { points: "12,2.6 3.4,10 20.6,10", fill: DARK });
    el(svg, "rect", { x: 5.4, y: 10, width: 13.2, height: 9.6, fill: PRIMARY });
    el(svg, "rect", { x: 5.4, y: 10, width: 13.2, height: 1.6, fill: CREAM });
    el(svg, "rect", { x: 10.4, y: 13.4, width: 3.2, height: 6.2, rx: 0.5, fill: DARK });
    el(svg, "rect", { x: 6.8, y: 13.2, width: 2.7, height: 2.7, rx: 0.4, fill: ACCENT });
    el(svg, "rect", { x: 14.5, y: 13.2, width: 2.7, height: 2.7, rx: 0.4, fill: ACCENT });
  },

  // delivery / food truck
  truck: function (svg) {
    el(svg, "rect", { x: 1.8, y: 6.4, width: 12.8, height: 8.7, rx: 1, fill: PRIMARY });
    el(svg, "circle", { cx: 8.2, cy: 10.4, r: 2.1, fill: CREAM });
    el(svg, "circle", { cx: 8.2, cy: 10.4, r: 1, fill: DARK });
    el(svg, "polygon", { points: "14.6,8.8 18.6,8.8 21.8,12.4 21.8,15.1 14.6,15.1", fill: DARK });
    el(svg, "polygon", { points: "15.6,10 18,10 19.9,12.2 15.6,12.2", fill: ACCENT });
    el(svg, "circle", { cx: 6.4, cy: 16.9, r: 2.2, fill: DARK });
    el(svg, "circle", { cx: 6.4, cy: 16.9, r: 0.9, fill: CREAM });
    el(svg, "circle", { cx: 17.4, cy: 16.9, r: 2.2, fill: DARK });
    el(svg, "circle", { cx: 17.4, cy: 16.9, r: 0.9, fill: CREAM });
  },

  // multi-window office building
  office: function (svg) {
    el(svg, "rect", { x: 4.8, y: 2, width: 14.4, height: 1.5, rx: 0.75, fill: DARK });
    el(svg, "rect", { x: 5.6, y: 3.5, width: 12.8, height: 18, fill: PRIMARY });
    var rows = [5.4, 8.9, 12.4];
    for (var r = 0; r < rows.length; r++) {
      el(svg, "rect", { x: 7.6, y: rows[r], width: 3, height: 2.3, rx: 0.3, fill: ACCENT });
      el(svg, "rect", { x: 13.4, y: rows[r], width: 3, height: 2.3, rx: 0.3, fill: ACCENT });
    }
    el(svg, "rect", { x: 10.4, y: 16.8, width: 3.2, height: 4.7, fill: DARK });
  },

  // factory with chimney
  factory: function (svg) {
    el(svg, "rect", { x: 16.4, y: 3, width: 3.1, height: 8, fill: DARK });
    el(svg, "circle", { cx: 18, cy: 2.5, r: 1.4, fill: CREAM, stroke: DARK, "stroke-width": 0.7 });
    el(svg, "polygon", { points: "2.5,12.5 8,8 8,12.5 13.5,8 13.5,12.5 19,8 19,12.5", fill: DARK });
    el(svg, "rect", { x: 2.5, y: 12.5, width: 19, height: 8.5, fill: PRIMARY });
    el(svg, "rect", { x: 4.5, y: 14.5, width: 3, height: 2.6, rx: 0.4, fill: ACCENT });
    el(svg, "rect", { x: 9.5, y: 14.5, width: 3, height: 2.6, rx: 0.4, fill: ACCENT });
    el(svg, "rect", { x: 15.5, y: 15.5, width: 3.6, height: 5.5, rx: 0.4, fill: DARK });
  },

  // building slice / stack; opts.number overlays the floor number
  floor: function (svg, opts) {
    el(svg, "rect", { x: 4.5, y: 15.6, width: 15, height: 4.2, rx: 0.8, fill: DARK });
    el(svg, "rect", { x: 4.5, y: 10.4, width: 15, height: 4.4, rx: 0.8, fill: PRIMARY });
    el(svg, "rect", { x: 4.5, y: 5.2, width: 15, height: 4.4, rx: 0.8, fill: PRIMARY });
    el(svg, "rect", { x: 5.6, y: 3.6, width: 12.8, height: 1.2, rx: 0.6, fill: ACCENT });
    if (opts && opts.number !== undefined && opts.number !== null) {
      el(svg, "circle", { cx: 12, cy: 12.4, r: 5.4, fill: DARK, stroke: CREAM, "stroke-width": 1.1 });
      var label = el(svg, "text", {
        x: 12,
        y: 12.6,
        "text-anchor": "middle",
        "dominant-baseline": "central",
        "font-size": 7.5,
        "font-weight": 700,
        "font-family": "inherit",
        fill: CREAM
      });
      label.textContent = String(opts.number);
    }
  },

  // coffee grinder / mill
  grinder: function (svg) {
    el(svg, "rect", { x: 12, y: 2.4, width: 4.6, height: 1.3, rx: 0.65, fill: DARK });
    el(svg, "circle", { cx: 17, cy: 3, r: 1.4, fill: ACCENT, stroke: DARK, "stroke-width": 0.7 });
    el(svg, "polygon", { points: "8,4.4 16,4.4 14.4,9 9.6,9", fill: DARK });
    el(svg, "rect", { x: 7, y: 9, width: 10, height: 8.4, rx: 1, fill: PRIMARY });
    el(svg, "rect", { x: 8.6, y: 13.2, width: 6.8, height: 3.4, rx: 0.6, fill: DARK });
    el(svg, "circle", { cx: 12, cy: 14.9, r: 0.8, fill: ACCENT });
    el(svg, "rect", { x: 6, y: 19, width: 12, height: 1.8, rx: 0.9, fill: DARK });
  },

  // robot head
  robot: function (svg) {
    el(svg, "rect", { x: 11.2, y: 2.6, width: 1.6, height: 3.4, fill: DARK });
    el(svg, "circle", { cx: 12, cy: 2.6, r: 1.3, fill: ACCENT });
    el(svg, "rect", { x: 2.8, y: 10, width: 1.8, height: 4.4, rx: 0.9, fill: DARK });
    el(svg, "rect", { x: 19.4, y: 10, width: 1.8, height: 4.4, rx: 0.9, fill: DARK });
    el(svg, "rect", { x: 4.6, y: 6, width: 14.8, height: 12.6, rx: 2.6, fill: PRIMARY });
    el(svg, "circle", { cx: 9, cy: 11, r: 1.8, fill: ACCENT });
    el(svg, "circle", { cx: 15, cy: 11, r: 1.8, fill: ACCENT });
    el(svg, "circle", { cx: 9, cy: 11, r: 0.7, fill: DARK });
    el(svg, "circle", { cx: 15, cy: 11, r: 0.7, fill: DARK });
    el(svg, "rect", { x: 8.6, y: 14.6, width: 6.8, height: 1.7, rx: 0.85, fill: CREAM });
  },

  // prestige star
  star: function (svg) {
    el(svg, "polygon", {
      points: "12,2 14.95,8.3 21.5,9.2 16.7,13.9 17.9,20.5 12,17.3 6.1,20.5 7.3,13.9 2.5,9.2 9.05,8.3",
      fill: ACCENT,
      stroke: DARK,
      "stroke-width": 1,
      "stroke-linejoin": "round"
    });
  },

  // settings gear
  gear: function (svg) {
    el(svg, "path", {
      d: "M12 2.5l1.5 2.2 2.6-.5.6 2.6 2.4 1.1-.9 2.5.9 2.5-2.4 1.1-.6 2.6-2.6-.5L12 21.5l-1.5-2.3-2.6.5-.6-2.6-2.4-1.1.9-2.5-.9-2.5 2.4-1.1.6-2.6 2.6.5z",
      fill: ACCENT,
      stroke: DARK,
      "stroke-width": 1,
      "stroke-linejoin": "round"
    });
    el(svg, "circle", { cx: 12, cy: 12, r: 3, fill: CREAM, stroke: DARK, "stroke-width": 1 });
  },

  // rounded kawaii heart with a soft shine
  heart: function (svg) {
    el(svg, "path", {
      d: "M12 20.4C6.2 16.2 2.8 12.7 2.8 9.1 2.8 6.3 5 4.2 7.6 4.2c1.7 0 3.3.9 4.4 2.5 1.1-1.6 2.7-2.5 4.4-2.5 2.6 0 4.8 2.1 4.8 4.9 0 3.6-3.4 7.1-9.2 11.3z",
      fill: PINK,
      stroke: PINK_DARK,
      "stroke-width": 1.3,
      "stroke-linejoin": "round"
    });
    el(svg, "ellipse", { cx: 8.1, cy: 8.6, rx: 1.5, ry: 2.1, fill: CREAM, opacity: 0.75, transform: "rotate(-28 8.1 8.6)" });
  },

  // cat paw print: big pad + 4 toes on a cream badge
  paw: function (svg) {
    el(svg, "circle", { cx: 12, cy: 12, r: 9.6, fill: CREAM, stroke: PRIMARY, "stroke-width": 1 });
    el(svg, "ellipse", { cx: 12, cy: 14.6, rx: 3.6, ry: 3, fill: PRIMARY });
    el(svg, "ellipse", { cx: 6.9, cy: 10.4, rx: 1.55, ry: 2.05, transform: "rotate(-22 6.9 10.4)", fill: PRIMARY });
    el(svg, "ellipse", { cx: 10.3, cy: 7.6, rx: 1.6, ry: 2.1, transform: "rotate(-7 10.3 7.6)", fill: PRIMARY });
    el(svg, "ellipse", { cx: 13.9, cy: 7.7, rx: 1.6, ry: 2.1, transform: "rotate(8 13.9 7.7)", fill: PRIMARY });
    el(svg, "ellipse", { cx: 17.1, cy: 10.5, rx: 1.55, ry: 2.05, transform: "rotate(23 17.1 10.5)", fill: PRIMARY });
  },

  // chibi neko-barista mascot: cream face, brown ears with pink inner,
  // sparkly eyes, w-mouth, rosy cheeks, gold bowtie
  neko: function (svg) {
    el(svg, "polygon", { points: "4.4,8.6 5.3,2.2 10.3,5.4", fill: PRIMARY, stroke: DARK, "stroke-width": 0.9, "stroke-linejoin": "round" });
    el(svg, "polygon", { points: "19.6,8.6 18.7,2.2 13.7,5.4", fill: PRIMARY, stroke: DARK, "stroke-width": 0.9, "stroke-linejoin": "round" });
    el(svg, "polygon", { points: "5.9,7.1 6.3,4.1 8.7,5.7", fill: PINK });
    el(svg, "polygon", { points: "18.1,7.1 17.7,4.1 15.3,5.7", fill: PINK });
    el(svg, "circle", { cx: 12, cy: 12.4, r: 7.9, fill: CREAM, stroke: DARK, "stroke-width": 1 });
    el(svg, "ellipse", { cx: 7.2, cy: 13.9, rx: 1.35, ry: 0.9, fill: PINK, opacity: 0.85 });
    el(svg, "ellipse", { cx: 16.8, cy: 13.9, rx: 1.35, ry: 0.9, fill: PINK, opacity: 0.85 });
    el(svg, "circle", { cx: 9.1, cy: 11.3, r: 1.7, fill: DARK });
    el(svg, "circle", { cx: 14.9, cy: 11.3, r: 1.7, fill: DARK });
    el(svg, "circle", { cx: 9.7, cy: 10.7, r: 0.55, fill: CREAM });
    el(svg, "circle", { cx: 15.5, cy: 10.7, r: 0.55, fill: CREAM });
    el(svg, "circle", { cx: 8.6, cy: 11.9, r: 0.3, fill: CREAM, opacity: 0.9 });
    el(svg, "circle", { cx: 14.4, cy: 11.9, r: 0.3, fill: CREAM, opacity: 0.9 });
    el(svg, "polygon", { points: "11.4,13.4 12.6,13.4 12,14.3", fill: PINK_DARK });
    el(svg, "path", { d: "M10.2 15.3c.55.75 1.25.75 1.8 0 .55.75 1.25.75 1.8 0", fill: "none", stroke: DARK, "stroke-width": 0.85, "stroke-linecap": "round" });
    el(svg, "path", { d: "M3.4 11.6l2.2.5M3.6 14.3l2.1-.3", fill: "none", stroke: DARK, "stroke-width": 0.7, "stroke-linecap": "round", opacity: 0.65 });
    el(svg, "path", { d: "M20.6 11.6l-2.2.5M20.4 14.3l-2.1-.3", fill: "none", stroke: DARK, "stroke-width": 0.7, "stroke-linecap": "round", opacity: 0.65 });
    el(svg, "polygon", { points: "8.4,20 11.1,21.2 8.4,22.4", fill: ACCENT, stroke: DARK, "stroke-width": 0.8, "stroke-linejoin": "round" });
    el(svg, "polygon", { points: "15.6,20 12.9,21.2 15.6,22.4", fill: ACCENT, stroke: DARK, "stroke-width": 0.8, "stroke-linejoin": "round" });
    el(svg, "circle", { cx: 12, cy: 21.2, r: 1, fill: ACCENT, stroke: DARK, "stroke-width": 0.8 });
  },

  // sun: gold circle + 8 short rays (day indicator for the game clock)
  sun: function (svg) {
    for (var i = 0; i < 8; i++) {
      var a = (Math.PI / 4) * i;
      el(svg, "line", {
        x1: (12 + Math.cos(a) * 6.6).toFixed(2),
        y1: (12 + Math.sin(a) * 6.6).toFixed(2),
        x2: (12 + Math.cos(a) * 9.6).toFixed(2),
        y2: (12 + Math.sin(a) * 9.6).toFixed(2),
        stroke: ACCENT,
        "stroke-width": 1.8,
        "stroke-linecap": "round"
      });
    }
    el(svg, "circle", { cx: 12, cy: 12, r: 4.6, fill: ACCENT });
  },

  // moon: cream crescent (night indicator for the game clock)
  moon: function (svg) {
    el(svg, "path", {
      d: "M14.6 2.8a9.6 9.6 0 1 0 6.9 16.2 8.1 8.1 0 0 1-6.9-16.2z",
      fill: CREAM
    });
  },

  // two coffee beans with curved creases (bean stock / supplier shop)
  beans: function (svg) {
    el(svg, "ellipse", { cx: 9.2, cy: 13.8, rx: 4.6, ry: 6.1, transform: "rotate(-27 9.2 13.8)", fill: PRIMARY, stroke: DARK, "stroke-width": 1.1 });
    el(svg, "path", { d: "M6.4 8.9c3.5 2.7 3.7 7.2 0.7 10", fill: "none", stroke: DARK, "stroke-width": 1.2, "stroke-linecap": "round" });
    el(svg, "ellipse", { cx: 17, cy: 9, rx: 3.2, ry: 4.4, transform: "rotate(24 17 9)", fill: PRIMARY, stroke: DARK, "stroke-width": 1 });
    el(svg, "path", { d: "M15.4 5.9c2.5 1.8 2.8 4.8 0.8 6.9", fill: "none", stroke: DARK, "stroke-width": 1, "stroke-linecap": "round" });
    el(svg, "circle", { cx: 18.6, cy: 16.6, r: 1.1, fill: ACCENT });
    el(svg, "circle", { cx: 20.4, cy: 14.2, r: 0.7, fill: ACCENT, opacity: 0.8 });
  },

  // coin with shine (coffee-bean emboss)
  coin: function (svg) {
    el(svg, "circle", { cx: 12, cy: 12, r: 9.4, fill: ACCENT, stroke: DARK, "stroke-width": 1.2 });
    el(svg, "circle", { cx: 12, cy: 12, r: 6.9, fill: "none", stroke: DARK, "stroke-width": 1 });
    el(svg, "ellipse", { cx: 12, cy: 12, rx: 2.9, ry: 4.1, fill: DARK });
    el(svg, "path", { d: "M12 8.6c1.4 2.1 1.4 4.7 0 6.8", fill: "none", stroke: ACCENT, "stroke-width": 1, "stroke-linecap": "round" });
    el(svg, "polygon", { points: "7.6,4.6 9.3,4.6 5.9,9.4 4.7,8.1", fill: CREAM, opacity: 0.85 });
  }
};

export function createIcon(name, opts) {
  opts = opts || {};
  var size = opts.size || 26;
  var svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  var builder = ICONS[name] || ICONS.cup;
  builder(svg, opts);
  return svg;
}
