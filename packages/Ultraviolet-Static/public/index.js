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
  return getFrame().src;
}

function getDecodedUrl() {
  return __uv$config.decodeUrl(getUvUrl().slice(__uv$config.prefix));
}

function getFrameHolder() {
  return document.getElementById("uv-frame-holder");
}

function getFrame() {
  return document.getElementById("uv-frame");
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
  console.log("Navigating", url);
  let frameHolder = getFrameHolder();
  frameHolder.style.display = "block";
  let frame = getFrame();
  frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
}

/*
 * Messages from the UV frame to operate the UV frame
 */
window.onmessage = async (event) => {
  // this is essentially our own bootleg https://www.jsonrpc.org/specification
  const data = event.data;

  if (!(data.hasOwnProperty("type") && data.type === "uv")) {
    return; // not for us
  }

  const {
    opcode,
    payload
  } = data;

  console.log("Received message", opcode, payload);

  // example:
  // window.top.postMessage({type:"uv",opcode:"search",payload:"amazon.com"}, "*");

  switch (opcode) {
    case "getUrl":
      event.source.postMessage({
        type: "uv",
        opcode: "getUrlRet",
        payload: getDecodedUrl(),
      });
      break;
    case "navigate":
      await setUvUrl(payload);
      break;
    case "search":
      const url = search(payload, searchEngine.value);
      await setUvUrl(url);
      break;
    // purposely no method to leave the iframe, once we are here we are here for the long haul
  }
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
