// Renders USGS streamgage cameras from the shared camera API on chrisizworski.com.
//
// This project deliberately does NOT carry its own copy of the camera registry and image proxy.
// The hub's /api/field-camera sets Access-Control-Allow-Origin *, so one allowlist serves both
// sites and there is nothing to drift. If the hub is unreachable the block degrades to a single
// line of text, so a hub outage can never break a zone page.
//
// Every image states its age. A camera that quietly froze three days ago looks exactly like a
// working one, and on a page people use to decide whether to hook up a boat that matters.
(function () {
  var API = "https://chrisizworski.com/api/field-camera";
  var nodes = document.querySelectorAll("[data-field-camera]");
  if (!nodes.length) return;

  function ago(minutes) {
    if (minutes == null) return "time unknown";
    if (minutes < 2) return "just now";
    if (minutes < 90) return minutes + " minutes ago";
    var h = Math.round(minutes / 60);
    if (h < 36) return h + (h === 1 ? " hour ago" : " hours ago");
    return Math.round(h / 24) + " days ago";
  }

  nodes.forEach(function (node) {
    var id = node.getAttribute("data-field-camera");
    fetch(API + "?id=" + encodeURIComponent(id) + "&meta=1")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (meta) {
        if (!meta || !meta.available) {
          node.innerHTML = '<p class="camera-out">This camera is not publishing right now.</p>';
          return;
        }
        var stale = meta.fresh === false;
        var img = document.createElement("img");
        img.src = API + "?id=" + encodeURIComponent(id);
        img.alt = "USGS camera looking at the water at " + meta.label;
        img.loading = "lazy";
        img.decoding = "async";
        img.width = 720;
        img.height = 405;
        img.className = "camera-shot";
        img.addEventListener("error", function () {
          node.innerHTML = '<p class="camera-out">This camera is not publishing right now.</p>';
        });

        var cap = document.createElement("p");
        cap.className = "camera-caption";
        cap.textContent = meta.label + ". " + (stale ? "Last image " : "Updated ") + ago(meta.age_minutes) +
          (stale ? ", this camera may have stopped." : ".");

        var credit = document.createElement("p");
        credit.className = "camera-credit";
        var a = document.createElement("a");
        a.href = meta.credit_url; a.rel = "noopener"; a.textContent = meta.credit;
        credit.appendChild(document.createTextNode("Image: "));
        credit.appendChild(a);

        node.innerHTML = "";
        node.setAttribute("data-state", stale ? "stale" : "live");
        node.appendChild(img);
        node.appendChild(cap);
        node.appendChild(credit);
      })
      .catch(function () {
        node.innerHTML = '<p class="camera-out">This camera is not publishing right now.</p>';
      });
  });
})();
