export function sendToContentScript(event, data) {
  return new Promise((resolve, reject) => {
    let uuid = Math.random().toString(36); // uuid to distinguish events
    let listenerKey = "aio-contentscript-sendto-pagescript" + uuid;
    window.addEventListener(listenerKey, (evt) => resolve(evt.detail.data), {
      once: true,
    });
    window.dispatchEvent(
      new CustomEvent("aio-pagescript-sendto-contentscript", {
        detail: { event, data, uuid },
      })
    );
  });
}

export function runInContentScript(fnPath, params) {
  // WARNING: can only transfer serializable data
  return sendToContentScript("aio-runInContentScript", {
    fnPath,
    params,
  });
}

export function runInBackground(fnPath, params) {
  return sendToContentScript("aio-runInBackground", {
    fnPath,
    params,
  });
}

export function getURL(filePath) {
  return runInContentScript("chrome.runtime.getURL", [filePath]);
}

export async function getExtStorage(key) {
  return runInContentScript("utils.Storage.get", [key]);
}

export async function setExtStorage(key, value) {
  return runInContentScript("utils.Storage.set", [key, value]);
}

export function notify({
  msg = "",
  x = window.innerWidth / 2,
  y = window.innerHeight - 100,
  align = "center",
  styleText = "",
  duration = 3000,
  id = "aio_notify_div",
} = {}) {
  let exist = document.getElementById(id);
  if (exist) exist.remove();

  // create notify msg in website at postion, fade out animation, auto clean up
  let div = document.createElement("div");
  div.id = id;
  div.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        padding: 10px;
        background-color: #333;
        color: #fff;
        border-radius: 5px;
        z-index: 2147483647;
        transition: all 1s ease-out;
        ${
          align === "right"
            ? "transform: translateX(-100%);"
            : align === "center"
            ? "transform: translateX(-50%);"
            : ""
        }
        ${styleText || ""}
      `;
  div.innerHTML = createTrustedHtml(msg);
  (document.body || document.documentElement).appendChild(div);

  let timeouts = [];
  function closeAfter(_time) {
    timeouts.forEach((t) => clearTimeout(t));
    timeouts = [
      setTimeout(() => {
        if (div) {
          div.style.opacity = 0;
          div.style.top = `${y - 50}px`;
        }
      }, _time - 1000),
      setTimeout(() => {
        div?.remove();
      }, _time),
    ];
  }

  if (duration > 0) closeAfter(duration);

  return {
    closeAfter: closeAfter,
    remove() {
      if (div) {
        div.remove();
        div = null;
        return true;
      }
      return false;
    },
    setText(text, duration) {
      if (div) {
        div.innerHTML = createTrustedHtml(text);
        if (duration) closeAfter(duration);
        return true;
      }
      return false;
    },
    setPosition(x, y) {
      if (div) {
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        return true;
      }
      return false;
    },
  };
}

export function loadingFullScreen(text = "") {
  const noti = notify({
    msg: text,
    styleText: `
        position: fixed;
        left: 0;
        top: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #0006;
    `,
    align: "",
    duration: 0,
    id: "aio_loading_fullscreen",
  });
  return noti;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const numberFormatCached = {};
/**
 * Get number formatter
 * @param {string} optionSelect "compactLong", "standard", "compactShort"
 * @param {string|undefined} locale Browser locale
 * @return {Intl.NumberFormat}
 */
export function getNumberFormatter(optionSelect, locale) {
  if (!locale) {
    if (document.documentElement.lang) {
      locale = document.documentElement.lang;
    } else if (navigator.language) {
      locale = navigator.language;
    } else {
      try {
        locale = new URL(
          Array.from(document.querySelectorAll("head > link[rel='search']"))
            ?.find((n) => n?.getAttribute("href")?.includes("?locale="))
            ?.getAttribute("href")
        )?.searchParams?.get("locale");
      } catch {
        console.log(
          "Cannot find browser locale. Use en as default for number formatting."
        );
        locale = "en";
      }
    }
  }
  let formatterNotation;
  let formatterCompactDisplay;
  switch (optionSelect) {
    case "compactLong":
      formatterNotation = "compact";
      formatterCompactDisplay = "long";
      break;
    case "standard":
      formatterNotation = "standard";
      formatterCompactDisplay = "short";
      break;
    case "compactShort":
    default:
      formatterNotation = "compact";
      formatterCompactDisplay = "short";
  }

  let key = locale + formatterNotation + formatterCompactDisplay;
  if (!numberFormatCached[key]) {
    const formatter = Intl.NumberFormat(locale, {
      notation: formatterNotation,
      compactDisplay: formatterCompactDisplay,
    });
    numberFormatCached[key] = formatter;
  }
  return numberFormatCached[key];
}

export function onElementsAdded(selector, callback, once) {
  let nodes = document.querySelectorAll(selector);
  if (nodes?.length) {
    callback(nodes);
    if (once) return;
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (!mutation.addedNodes) return;

      for (let node of mutation.addedNodes) {
        if (node.nodeType != 1) continue; // only process Node.ELEMENT_NODE

        let n = node.matches(selector)
          ? [node]
          : Array.from(node.querySelectorAll(selector));

        if (n?.length) {
          callback(n);
          if (once) observer.disconnect();
        }
      }
    });
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false,
  });

  // return disconnect function
  return () => observer.disconnect();
}

export function onElementRemoved(element, callback) {
  if (!element.parentElement) throw new Error("element must have parent");

  let observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === "childList") {
        if (mutation.removedNodes.length > 0) {
          for (let node of mutation.removedNodes) {
            if (node === element) {
              callback?.(node);
              observer.disconnect();
            }
          }
        }
      }
    });
  });

  observer.observe(element.parentElement, {
    childList: true,
  });

  return () => observer.disconnect();
}

export function closest(element, selector) {
  let el = element;
  while (el !== null) {
    if (el.matches(selector)) return el;

    let found = el.querySelector(selector);
    if (found) return found;

    el = el.parentElement;
  }
  return el;
}

export function deepFind(obj, path, once = true, exactPath = false) {
  if (!obj || typeof obj !== "object") return once ? null : [];

  const paths = Array.isArray(path) ? path : path.split("."); // Split path into segments
  const result = [];
  const stack = [
    {
      currentObj: obj,
      currentPathIndex: 0,
      correctPath: false,
    },
  ]; // Stack for traversal

  let foundFirstPath = false;

  while (stack.length) {
    const { currentObj, currentPathIndex, correctPath } = stack.pop();
    if (currentPathIndex === paths.length) {
      // Fully matched path, collect the value
      const res = !exactPath ? currentObj : correctPath ? currentObj : null;
      // console.log(path, res, currentObj);
      if (once) return res;
      result.push(res);
      continue;
    }

    const key = paths[currentPathIndex];
    if (typeof currentObj === "object" && currentObj !== null) {
      if (key in currentObj) {
        foundFirstPath = true;
        // Continue matching the next segment
        stack.push({
          currentObj: currentObj[key],
          currentPathIndex: currentPathIndex + 1,
          correctPath: true,
        });
      }

      // Traverse all properties if exactPath is false
      if (!exactPath || !foundFirstPath) {
        Object.entries(currentObj).forEach(([_key, value]) => {
          if (_key !== key && typeof value === "object" && value !== null) {
            stack.push({
              currentObj: value,
              currentPathIndex: currentPathIndex,
              correctPath: false,
            });
          }
        });
      }
    }
  }

  return once ? null : result;
}

export function parseSafe(str = "", defaultValue = {}) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.log("Cannot parse JSON", e, str);
    return defaultValue;
  }
}

export function downloadUrl(url, filename) {
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    a.click();
    a.remove();
  } catch (e) {
    window.open(url, "_blank");
  }
}

export function downloadData(data, filename, type = "text/plain") {
  let file = new Blob([data], { type: type });
  if (window.navigator.msSaveOrOpenBlob)
    window.navigator.msSaveOrOpenBlob(file, filename);
  else {
    let a = document.createElement("a"),
      url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
}

export function sanitizeName(name, modifyIfPosible = true) {
  if (typeof name !== "string") {
    throw new Error("Input must be string");
  }
  const replacement = "";
  const illegalRe = /[\/\?<>\\:\*\|"]/g;
  const controlRe = /[\x00-\x1f\x80-\x9f]/g;
  const reservedRe = /^\.+$/;
  const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
  const windowsTrailingRe = /[\. ]+$/;
  if (modifyIfPosible) {
    name = name
      .replaceAll("<", "‹")
      .replaceAll(">", "›")
      .replaceAll(":", "∶")
      .replaceAll('"', "″")
      .replaceAll("/", "∕")
      .replaceAll("\\", "∖")
      .replaceAll("|", "¦")
      .replaceAll("?", "¿");
  }
  const sanitized = name
    .replace(illegalRe, replacement)
    .replace(controlRe, replacement)
    .replace(reservedRe, replacement)
    .replace(windowsReservedRe, replacement)
    .replace(windowsTrailingRe, replacement);
  return sanitized; // TODO truncates to length of 255
}
export function injectCssCode(code) {
  let css = document.createElement("style");
  if ("textContent" in css) css.textContent = code;
  else css.innerText = code;
  (document.head || document.documentElement).appendChild(css);
  return css;
}
export function injectCssFile(filePath, id) {
  let css = document.createElement("link");
  css.setAttribute("rel", "stylesheet");
  css.setAttribute("type", "text/css");
  css.setAttribute("href", filePath);
  if (id) css.setAttribute("id", id);
  (document.head || document.documentElement).appendChild(css);
  return css;
}

export function executeScript(code) {
  let script = document.createElement("script");
  script.textContent = createTrustedScript(code);
  (document.head || document.documentElement).appendChild(script);
  script.onload = function () {
    script.remove();
  };
}
export function getTrustedPolicy() {
  let policy = window.trustedTypes?.ufsTrustedTypesPolicy || null;
  if (!policy) {
    policy = window.trustedTypes.createPolicy("ufsTrustedTypesPolicy", {
      createHTML: (string, sink) => string,
      createScriptURL: (string) => string,
      createScript: (string) => string,
    });
  }
  return policy;
}
export function createTrustedHtml(html) {
  let policy = getTrustedPolicy();
  return policy.createHTML(html);
}
export function createTrustedScript(code) {
  let policy = getTrustedPolicy();
  return policy.createScript(code);
}
export function injectScriptSrc(src, callback) {
  let policy = getTrustedPolicy();
  let jsSrc = policy.createScriptURL(src);
  let script = document.createElement("script");
  script.onload = function () {
    callback?.(true);
  };
  script.onerror = function (e) {
    callback?.(false, e);
  };
  script.src = jsSrc; // Assigning the TrustedScriptURL to src
  (document.head || document.documentElement).appendChild(script);
  return script;
}
export function injectScriptSrcAsync(src) {
  return new Promise((resolve) => {
    injectScriptSrc(src, (success) => {
      resolve(success);
    });
  });
}
export const getFBAIODashboard = () => {
  return "https://aio.firet.io/?rand=" + Math.random() * 10000;
};