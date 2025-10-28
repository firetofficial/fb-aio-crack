import * as utils from "../utils/index.js";

const GLOBAL = {
  utils,
  fetch: (url, options) =>
    fetch(url, options || {})
      .then((res) => res.text())
      .catch((e) => null),
  customFetch: utils.customFetch,
  getSupportedAutoRunFeatures() {
    return [
      "fb_blockSeenStory",
      "fb_showTotalPostReactions",
      "fb_addDownloadVideoBtn",
      "fb_addVideoControlBtn",
      "insta_blockSeenStory",
      "threads_addDownloadVideoBtn",
      "fb_stopNewFeed",
      "tiktok_addDownloadVideoBtn",
      "block_open_urls",
      "web_timer",
    ];
  },
};

function main() {
  chrome.runtime.onInstalled.addListener(async function (data) {
    const { id, previousVersion, reason } = data || {};

    // reasons: shared_module_update / chrome_update / update / install
    if (reason === "install") {
      const url = utils.getFBAIODashboard();
      chrome.tabs.create({ url });

      if (await utils.hasUserId()) {
        await utils.trackEvent("fb-aio-RE-INSTALLED");
      }
      // create new unique id and save it
      await utils.setUserId();
      utils.trackEvent("fb-aio-INSTALLED");
    } else if (reason == "update" || reason == "chrome_update") {
      const url = utils.getFBAIODashboard();
      chrome.tabs.create({
        url:
          url +
          // "http://localhost:5173/" +
          `#/ext-updated?previousVersion=${previousVersion}&reason=${reason}`,
      });
    }
  });

  chrome.runtime.onMessageExternal.addListener(
    (request, sender, sendResponse) => {
      if (request.action === "fb_allInOne_runFunc") {
        utils
          .runFunc(request.fnPath, request.params, GLOBAL)
          .then(sendResponse)
          .catch(sendResponse);
        return true;
      }
    }
  );

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
      if (request.action === "aio-runInBackground") {
        const { params = [], fnPath = "" } = request.data || {};
        utils
          .runFunc(fnPath, params, GLOBAL)
          .then(sendResponse)
          .catch(sendResponse);
        return true;
      }
    } catch (e) {
      console.log("ERROR:", e);
      sendResponse({ error: e.message });
    }
  });
}

main();
