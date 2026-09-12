/**
 * 部署窗口的静态资源守卫。
 *
 * 背景：EdgeOne Pages 发布时，新的 HTML 会先上线，`/_next/static/*` 的资源可能还没就绪。
 * 此时浏览器拿到的静态资源 404 带着 `Cache-Control: public, max-age=31536000, immutable`，
 * 会被浏览器缓存住；等资源补齐后，普通刷新仍然命中那份缓存的 404，页面就会一直是无样式的。
 *
 * 这里做三件事：
 * 1. 检测样式表是否真的生效，没生效就给 <html> 打上 data-asset-degraded，启用一份极简兜底样式；
 * 2. 用带缓存击穿参数的 URL 重试样式表，绕开被缓存的 404；
 * 3. 对 404 的 /_next/static/* 脚本用同样方式补拉一次。
 */
export const ASSET_GUARD_SCRIPT = `
(function () {
  var STATIC_PREFIX = "/_next/static/";
  var CSS_PREFIX = "/_next/static/css/";
  var MAX_TRIES = 15;
  var INTERVAL = 2000;
  var RETRY_PARAM = "asset-retry";
  var replayed = {};

  function bust(url) {
    var base = stripRetry(url);
    var sep = base.indexOf("?") === -1 ? "?" : "&";
    return base + sep + RETRY_PARAM + "=" + Date.now();
  }

  function stripRetry(url) {
    var at = url.indexOf(RETRY_PARAM + "=");
    if (at === -1) return url;
    var cut = at;
    if (url.charAt(at - 1) === "?" || url.charAt(at - 1) === "&") cut = at - 1;
    return url.slice(0, cut);
  }

  function cssLinks() {
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    var found = [];
    for (var i = 0; i < links.length; i++) {
      if ((links[i].getAttribute("href") || "").indexOf(CSS_PREFIX) !== -1) {
        found.push(links[i]);
      }
    }
    return found;
  }

  function cssApplied() {
    var links = cssLinks();
    for (var i = 0; i < links.length; i++) {
      var sheet = links[i].sheet;
      if (!sheet) continue;
      try {
        if (sheet.cssRules && sheet.cssRules.length > 0) return true;
      } catch (error) {
        return true;
      }
    }
    return false;
  }

  function setDegraded(on) {
    var root = document.documentElement;
    if (on) root.setAttribute("data-asset-degraded", "1");
    else root.removeAttribute("data-asset-degraded");
  }

  function retryCss() {
    var links = cssLinks();
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var href = link.getAttribute("href") || "";
      if (href.indexOf(CSS_PREFIX) === -1) continue;
      link.setAttribute("href", bust(href));
    }
  }

  function staticPath(url) {
    var at = url.indexOf(STATIC_PREFIX);
    if (at === -1) return "";
    return stripRetry(url.slice(at).split("?")[0]);
  }

  function replayScript(path) {
    if (!path || replayed[path]) return;
    replayed[path] = 1;
    var script = document.createElement("script");
    script.src = bust(path);
    script.async = false;
    var host = document.body || document.head;
    if (host) host.appendChild(script);
  }

  function replayFailedScripts() {
    if (!window.performance || !performance.getEntriesByType) return;
    var entries = performance.getEntriesByType("resource");
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      if (entry.responseStatus !== 404) continue;
      var path = staticPath(entry.name || "");
      if (!path || path.indexOf(CSS_PREFIX) !== -1) continue;
      replayScript(path);
    }
  }

  var tries = 0;
  function tick() {
    var applied = cssApplied();
    setDegraded(!applied);
    replayFailedScripts();
    if (applied || tries >= MAX_TRIES) return;
    tries += 1;
    retryCss();
    window.setTimeout(tick, INTERVAL);
  }

  document.addEventListener(
    "error",
    function (event) {
      var target = event.target;
      if (!target || target.tagName !== "SCRIPT") return;
      var path = staticPath(target.getAttribute("src") || "");
      if (!path || path.indexOf(CSS_PREFIX) !== -1) return;
      replayScript(path);
    },
    true
  );

  function start() {
    window.setTimeout(tick, 400);
  }

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
})();
`;

/**
 * 样式表没加载成功时的极简兜底：让页面还能读，且不让大块 SVG 撑爆整屏。
 * 只在 <html data-asset-degraded="1"> 时生效，正常加载时完全不参与。
 */
export const ASSET_GUARD_CSS = `
html[data-asset-degraded="1"] body {
  max-width: 44rem;
  margin: 0 auto;
  padding: 1.25rem 1rem 3rem;
  font: 16px/1.7 -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #1c1f24;
  background: #f6f7f9;
}
html[data-asset-degraded="1"] svg {
  max-width: 64px;
  max-height: 64px;
}
html[data-asset-degraded="1"] img,
html[data-asset-degraded="1"] video {
  max-width: 100%;
  height: auto;
}
html[data-asset-degraded="1"] input,
html[data-asset-degraded="1"] textarea,
html[data-asset-degraded="1"] select,
html[data-asset-degraded="1"] button {
  font: inherit;
  max-width: 100%;
}
`;
