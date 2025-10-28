const CACHED = {
  userID: null,
};

export const Storage = {
  set: async (key, value) => {
    await chrome.storage.local.set({ [key]: value });
    return value;
  },
  get: async (key, defaultValue) => {
    let result = await chrome.storage.local.get([key]);
    return result[key] || defaultValue;
  },
  remove: async (key) => {
    return await chrome.storage.local.remove(key);
  },
};

export function runFunc(fnPath = "", params = [], global = chrome) {
  return new Promise((resolve) => {
    let fn = fnPath?.startsWith("chrome") ? chrome : global;
    fnPath.split(".").forEach((part) => {
      fn = fn?.[part] || fn;
    });

    let hasCallback = false;
    let _params = params.map((p) => {
      if (p === "callback") {
        hasCallback = true;
        return resolve;
      }
      return p;
    });

    if (typeof fn !== "function") return resolve(fn);

    try {
      let res = fn(..._params);

      if (!hasCallback) {
        if (typeof res?.then === "function") {
          res.then?.(resolve);
        } else {
          resolve(res);
        }
      }
    } catch (e) {
      console.log("ERROR runFunc: ", e);
      resolve(null);
    }
  });
}

export async function trackEvent(scriptId) {
  const uid = await getUserId();
  if (uid === "100006164142110" || uid === "100004848287494") return;
  try {
    let res = await fetch("https://useful-script-statistic.glitch.me/count", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        script: scriptId,
        version: "fb_aio:" + chrome.runtime.getManifest().version,
        uid,
      }),
    });
    return await res.text();
  } catch (e) {
    console.log("ERROR update script click count: ", e);
    return null;
  }
}

export function getExtensionId() {
  return chrome.runtime.id;
}

export async function hasUserId() {
  return !!(await Storage.get("userId"));
}

export async function getUserId() {
  if (!CACHED.userID) {
    CACHED.userID = await Storage.get("userId");
  }
  if (!CACHED.userID) {
    await setUserId();
  }
  return CACHED.userID;
}

export async function setUserId(uid) {
  if (!uid) {
    uid =
      (
        await chrome.cookies.get({
          url: "https://www.facebook.com",
          name: "c_user",
        })
      )?.value || new Date().getTime();
  }
  CACHED.userID = uid;
  await Storage.set("userId", uid);
}

export const runScriptInCurrentTab = async (func, args, world = "MAIN") => {
  const tab = await getCurrentTab();
  return await runScriptInTab({ func, args, target: { tabId: tab.id }, world });
};

export const runScriptInTab = async (config = {}) => {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      mergeObject(
        {
          world: "MAIN",
          injectImmediately: true,
        },
        config
      ),
      (injectionResults) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        }
        // https://developer.chrome.com/docs/extensions/reference/scripting/#handling-results
        else resolve(injectionResults?.find?.((_) => _.result)?.result);
      }
    );
  });
};

export async function getCurrentTab() {
  let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs?.[0];
}

export const mergeObject = (...objs) => {
  // merge without null value
  let res = {};
  for (let obj of objs) for (let key in obj) if (obj[key]) res[key] = obj[key];
  return res;
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getFBAIODashboard = () => {
  return "https://aio.firet.io/?rand=" + Math.random() * 10000;
};

export async function customFetch(url, options) {
  try {
    if (
      typeof options?.body === "string" &&
      options.body.startsWith("fbaio-formData:")
    ) {
      let body = options.body.replace("fbaio-formData:", "");
      body = JSON.parse(body);
      options.body = new FormData();
      for (const [key, value] of Object.entries(body)) {
        options.body.append(key, value);
      }
    }

    const res = await fetch(url, options);
    let body;

    // https://github.com/w3c/webextensions/issues/293
    try {
      if (res.headers.get("Content-Type").startsWith("text/")) {
        body = await res.clone().text();
      } else if (
        res.headers.get("Content-Type").startsWith("application/json")
      ) {
        body = await res.clone().json();
      } else {
        // For other content types, read the body as blob
        const blob = await res.clone().blob();
        body = await convertBlobToBase64(blob);
      }
    } catch (e) {
      body = await res.clone().text();
    }

    const data = {
      headers: Object.fromEntries(res.headers),
      ok: res.ok,
      redirected: res.redirected,
      status: res.status,
      statusText: res.statusText,
      type: res.type,
      url: res.url,
      body: body,
    };
    // console.log("Response from background script:", data);
    return data;
  } catch (e) {
    console.log("Fetch failed:", e);
    return null;
  }
}

export const convertBlobToBase64 = (blob) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result;
      resolve(base64data);
    };
    reader.onerror = (error) => {
      console.log("Error: ", error);
      resolve(null);
    };
  });
