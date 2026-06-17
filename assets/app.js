/* Hover preview for Work items + tiny page polish.
   The preview SVG is inlined in the HTML; this only toggles + positions it. */
(function () {
  "use strict";

  var preview = document.getElementById("preview");
  if (!preview) return;

  var raf = null, tx = 0, ty = 0;
  function apply() {
    raf = null;
    preview.style.left = tx + "px";
    preview.style.top = ty + "px";
  }
  function move(e) {
    tx = e.clientX; ty = e.clientY;
    if (!raf) raf = requestAnimationFrame(apply);
  }

  document.querySelectorAll("[data-preview]").forEach(function (el) {
    el.addEventListener("mouseenter", function (e) {
      tx = e.clientX; ty = e.clientY; apply();
      preview.classList.add("is-on");
      window.addEventListener("mousemove", move);
    });
    el.addEventListener("mouseleave", function () {
      preview.classList.remove("is-on");
      window.removeEventListener("mousemove", move);
    });
  });
})();
