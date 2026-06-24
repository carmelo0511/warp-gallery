/* ============================================================
   Bankai — moodboard warp gallery
   Authentic recreation of the system.studio horizontal "rail":
   a row of tiles that fan vertically toward the left/right edges
   (vertex warp) with chromatic aberration there (fragment).
   Shaders mirror the live site (uFan edge-fan + vertical R/B split).
   Pure WebGL, no dependencies.
   ============================================================ */
(function () {
  "use strict";

  var BASE = "../assets/moodboard/";

  // The rail, in order. type: image | video | text
  // A personal Midjourney moodboard — soft to loud, kept just for me.
  var TILES = [
    { type: "image", src: "01-cherry-blossom.png" },
    { type: "text", label: "Just for me", body: [
      "This isn't for a client or a pitch. It's my own Midjourney moodboard.",
      "Images I generated or saved because they made me feel something.",
      "No brief, no deadline. Just taste."
    ]},
    { type: "image", src: "08-swimmers.png" },
    { type: "image", src: "02-croissant.png" },
    { type: "image", src: "05-student-books.png" },
    { type: "text", label: "Soft & loud", body: [
      "Some of it is soft — paint, warm light, quiet mornings.",
      "Some of it is loud — deep colour, old anime, hard light.",
      "That's the point. Everything I like, in one place."
    ]},
    { type: "image", src: "07-red-robes.png" },
    { type: "image", src: "03-lineman.png" },
    { type: "image", src: "04-gameboy.png" },
    { type: "video", src: "06-space-opera.mp4" }
  ];

  var canvas = document.getElementById("gl");
  if (!canvas) return;
  var gl = canvas.getContext("webgl", { antialias: true, premultipliedAlpha: false, alpha: false });
  if (!gl) { document.body.classList.add("no-webgl"); return; }

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- shaders (mirror live site) ---------- */
  var VERT = [
    "attribute vec2 aUv;",
    "uniform vec2 uResolution;",
    "uniform vec4 uRect;",            // x,y,w,h (css px, y-down)
    "uniform float uBandCenter, uFan, uEdgeZone, uEdgePow, uLeftGate, uRightGate;",
    "varying vec2 vUv;",
    "varying float vEdge;",
    "void main(){",
    "  vUv = aUv;",
    "  vec2 screen = uRect.xy + vec2(aUv.x, 1.0 - aUv.y) * uRect.zw;",
    "  float sx = screen.x / uResolution.x;",
    "  float dist = min(sx, 1.0 - sx);",
    "  float edge = pow(smoothstep(uEdgeZone, 0.0, dist), uEdgePow);",
    "  edge *= mix(uLeftGate, uRightGate, step(0.5, sx));",
    "  float blend = smoothstep(0.0, 0.35, edge);",
    "  float y = uBandCenter + (screen.y - uBandCenter) * (1.0 + uFan * edge * blend);",
    "  float nx = sx * 2.0 - 1.0;",
    "  float ny = 1.0 - y / uResolution.y * 2.0;",
    "  gl_Position = vec4(nx, ny, 0.0, 1.0);",
    "  vEdge = edge;",
    "}"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "uniform sampler2D tMap;",
    "uniform float uChroma;",
    "uniform vec2 uUvScale, uUvOffset, uTileSize;",
    "uniform float uRadius;",
    "varying vec2 vUv;",
    "varying float vEdge;",
    "void main(){",
    "  vec2 uv = uUvOffset + vUv * uUvScale;",
    "  vec4 base = texture2D(tMap, uv);",
    "  float fx = smoothstep(0.05, 0.5, vEdge);",
    "  float ca = uChroma * fx * (0.4 + vEdge);",
    "  float r = texture2D(tMap, uv + vec2(0.0, ca)).r;",
    "  float b = texture2D(tMap, uv - vec2(0.0, ca)).b;",
    "  vec3 rgb = mix(base.rgb, vec3(r, base.g, b), fx);",
    "  float mask = 1.0;",
    "  if (uRadius > 0.0) {",
    "    vec2 q = abs(vUv * uTileSize - uTileSize * 0.5) - uTileSize * 0.5 + uRadius;",
    "    float d = min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - uRadius;",
    "    mask *= 1.0 - smoothstep(0.0, 1.5, d);",
    "  }",
    "  gl_FragColor = vec4(rgb, base.a * mask);",
    "}"
  ].join("\n");

  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  var prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // Subdivided grid mesh — many columns so the per-vertex edge-fan renders as a
  // SMOOTH curve, not a flat trapezoid (a 4-vertex quad can only interpolate straight).
  var COLS = 80, ROWS = 4, mesh = [];
  for (var iy = 0; iy < ROWS; iy++) {
    for (var ix = 0; ix < COLS; ix++) {
      var x0 = ix / COLS, x1 = (ix + 1) / COLS, y0 = iy / ROWS, y1 = (iy + 1) / ROWS;
      mesh.push(x0,y0, x1,y0, x0,y1,  x0,y1, x1,y0, x1,y1);
    }
  }
  var VCOUNT = mesh.length / 2;
  var quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh), gl.STATIC_DRAW);
  var aUv = gl.getAttribLocation(prog, "aUv");
  gl.enableVertexAttribArray(aUv);
  gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

  var U = {};
  ["uResolution","uRect","uBandCenter","uFan","uEdgeZone","uEdgePow","uLeftGate","uRightGate",
   "uChroma","uUvScale","uUvOffset","uTileSize","uRadius"].forEach(function (n) {
    U[n] = gl.getUniformLocation(prog, n);
  });

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(1, 1, 1, 1);

  /* ---------- textures ---------- */
  function makeTex() {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([230,230,228,255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return t;
  }

  function textCanvas(t) {
    var c = document.createElement("canvas");
    var w = 760, h = 980; c.width = w; c.height = h;
    var x = c.getContext("2d");
    x.fillStyle = "#ffffff"; x.fillRect(0, 0, w, h);
    var pad = 70, top = 120;
    x.fillStyle = "#0a0a0a";
    x.font = "700 46px 'Helvetica Neue', Helvetica, Arial, sans-serif";
    x.fillText(t.label, pad, top);
    x.fillStyle = "#8c8c8c";
    x.font = "400 27px 'Helvetica Neue', Helvetica, Arial, sans-serif";
    var y = top + 70, maxw = w - pad * 2, lh = 38;
    t.body.forEach(function (para) {
      var words = para.split(" "), line = "";
      for (var i = 0; i < words.length; i++) {
        var test = line ? line + " " + words[i] : words[i];
        if (x.measureText(test).width > maxw && line) { x.fillText(line, pad, y); line = words[i]; y += lh; }
        else line = test;
      }
      x.fillText(line, pad, y); y += lh + 22;
    });
    return c;
  }

  var tiles = TILES.map(function (def) {
    var tile = { def: def, tex: makeTex(), aspect: def.type === "text" ? 760 / 980 : 1, ready: def.type === "text", video: null, w: 0, h: 0 };
    if (def.type === "text") {
      var c = textCanvas(def);
      gl.bindTexture(gl.TEXTURE_2D, tile.tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    } else if (def.type === "image") {
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        tile.aspect = img.naturalWidth / img.naturalHeight;
        tile.w = img.naturalWidth; tile.h = img.naturalHeight;
        gl.bindTexture(gl.TEXTURE_2D, tile.tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        tile.ready = true;
      };
      img.src = BASE + def.src;
    } else if (def.type === "video") {
      var v = document.createElement("video");
      v.src = BASE + def.src; v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute("playsinline", ""); v.autoplay = true; v.preload = "auto";
      v.addEventListener("loadeddata", function () {
        tile.aspect = v.videoWidth / v.videoHeight || 1;
        tile.video = v; tile.ready = true;
        v.play().catch(function () {});
      });
      tile.video = v;
    }
    return tile;
  });

  /* ---------- layout + scroll ---------- */
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, tileH = 0, gap = 0, bandCenter = 0, startPad = 0, railW = 0, maxScroll = 0;
  var scroll = 0, target = 0, prev = 0, vel = 0;

  function layout() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    gl.viewport(0, 0, canvas.width, canvas.height);
    tileH = H * 0.6;
    gap = H * 0.035;
    bandCenter = H * 0.585;
    measure();
  }
  function measure() {
    var x = 0;
    for (var i = 0; i < tiles.length; i++) {
      tiles[i].x = x;
      tiles[i].width = tileH * tiles[i].aspect;
      x += tiles[i].width + gap;
    }
    railW = x; // period includes one trailing gap → seamless wrap
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function render() {
    measure();
    scroll += (target - scroll) * (reduce ? 1 : 0.085);
    vel = scroll - prev; prev = scroll;
    // keep scroll/target bounded so floats never drift over long sessions
    if (railW > 0) {
      if (scroll > railW && target > railW) { scroll -= railW; target -= railW; prev -= railW; }
      else if (scroll < -railW && target < -railW) { scroll += railW; target += railW; prev += railW; }
    }
    // wrap the scroll into [0, railW) — the rail repeats infinitely
    var s = railW > 0 ? ((scroll % railW) + railW) % railW : 0;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.uResolution, W, H);
    gl.uniform1f(U.uBandCenter, bandCenter);
    // Warp only the outer sliver of each edge into a smooth curve; keep the
    // centre flat/upright. Narrow zone + sharp power = a soft bend, not a rigid skew.
    gl.uniform1f(U.uFan, reduce ? 0.0 : 0.9);
    gl.uniform1f(U.uEdgeZone, 0.13);
    gl.uniform1f(U.uEdgePow, 3.2);
    var chroma = reduce ? 0.0 : (0.02 + Math.min(Math.abs(vel) * 0.00006, 0.022));
    gl.uniform1f(U.uChroma, chroma);
    // infinite loop: content always exists past both edges, so both warp
    gl.uniform1f(U.uLeftGate, 1.0);
    gl.uniform1f(U.uRightGate, 1.0);

    var top = bandCenter - tileH / 2;
    for (var i = 0; i < tiles.length; i++) {
      var t = tiles[i];
      var base = t.x - s;

      // visible if any wrapped copy intersects the viewport
      var visK = null;
      for (var k = -1; k <= 1; k++) {
        var px = base + k * railW;
        if (px + t.width >= -60 && px <= W + 60) { visK = visK || []; visK.push(px); }
      }
      if (!visK) continue;

      // object-fit cover crop (same for every wrapped copy)
      var tileA = t.width / tileH, sX = 1, sY = 1, oX = 0, oY = 0;
      var fit = t.def.fit || "cover";
      if (fit === "cover") {
        if (t.aspect > tileA) { sX = tileA / t.aspect; oX = (1 - sX) / 2; }
        else { sY = t.aspect / tileA; oY = (1 - sY) / 2; }
      }

      gl.bindTexture(gl.TEXTURE_2D, t.tex);
      if (t.def.type === "video" && t.video && t.video.readyState >= 2) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, t.video); } catch (e) {}
      }
      gl.uniform2f(U.uUvScale, sX, sY);
      gl.uniform2f(U.uUvOffset, oX, oY);
      gl.uniform2f(U.uTileSize, t.width, tileH);
      gl.uniform1f(U.uRadius, 7.0);
      for (var j = 0; j < visK.length; j++) {
        gl.uniform4f(U.uRect, visK[j], top, t.width, tileH);
        gl.drawArrays(gl.TRIANGLES, 0, VCOUNT);
      }
    }
    requestAnimationFrame(render);
  }

  /* ---------- input ---------- */
  function onWheel(e) {
    e.preventDefault();
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    target += d * 1.0; // unbounded — the rail loops
  }
  canvas.addEventListener("wheel", onWheel, { passive: false });

  var down = false, lastX = 0, dragV = 0;
  function pdown(e) { down = true; lastX = e.clientX; dragV = 0; canvas.classList.add("grabbing"); }
  function pmove(e) {
    if (!down) return;
    var dx = e.clientX - lastX; lastX = e.clientX;
    dragV = -dx;
    target -= dx * 1.6;
  }
  function pup() { down = false; canvas.classList.remove("grabbing"); target += dragV * 8; }
  canvas.addEventListener("pointerdown", pdown);
  window.addEventListener("pointermove", pmove);
  window.addEventListener("pointerup", pup);

  // keyboard
  window.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") target += W * 0.5;
    if (e.key === "ArrowLeft") target -= W * 0.5;
  });

  window.addEventListener("resize", layout);
  layout();
  requestAnimationFrame(render);

  // hide scroll hint after first interaction
  var hint = document.getElementById("hint");
  function hideHint() { if (hint) hint.classList.add("gone"); window.removeEventListener("wheel", hideHint); window.removeEventListener("pointerdown", hideHint); }
  window.addEventListener("wheel", hideHint, { passive: true });
  window.addEventListener("pointerdown", hideHint);
})();
