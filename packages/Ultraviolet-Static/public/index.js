"use strict";
/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("uv-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("uv-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("uv-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("uv-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("uv-error-code");

/**
 * Gets the current URL of the UV Frame
 * @returns {*|boolean|string}
 */
function getUvUrl() {
  return document.getElementById("uv-frame").src;
}

/**
 * Setups up Ultraviolet for use & sets page to URL
 * @param {string} url
 */
async function setUvUrl(url) {
  try {
    await registerSW();
  } catch (err) {
    error.textContent = "Failed to register service worker.";
    errorCode.textContent = err.toString();
    throw err;
  }

  let frameHolder = document.getElementById("uv-frame-holder");
  frameHolder.style.display = "block";
  let frame = document.getElementById("uv-frame");
  frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
}

document.addEventListener("DOMContentLoaded", async () => {
  const maybeSetUrl = Cookies.get("singlePageProxy");
  if (maybeSetUrl && !getUvUrl()) {
    await setUvUrl(maybeSetUrl);
  }
});
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = search(address.value, searchEngine.value);
  await setUvUrl(url);
});
