(() => {
  console.log("FB AIO: content script INJECTED");

  let utils;

  // communication between page-script and content-script
  function sendToPageScript(event, uuid, data) {
    // console.log("sendToPageScript", event, uuid, data);
    window.dispatchEvent(
      new CustomEvent("aio-contentscript-sendto-pagescript" + uuid, {
        detail: { event, data },
      })
    );
  }

  async function getUtils() {
    if (!utils) utils = await import("../utils/index.js");
    return utils;
  }

  getUtils(); // import and save utils

  // listen page script (web page, cannot listen iframes ...)
  window.addEventListener("aio-pagescript-sendto-contentscript", async (e) => {
    let { event, data, uuid } = e?.detail || {};
    try {
      switch (event) {
        case "aio-runInContentScript": {
          const { params = [], fnPath = "" } = data || {};
          // console.log("runInContentScript", fnPath, params);
          const utils = await getUtils();
          const res = await utils.runFunc(fnPath, params, utils);
          sendToPageScript(event, uuid, res);
          break;
        }
        case "aio-runInBackground": {
          chrome.runtime.sendMessage(
            // TODO: hardcode for now
            "ncncagnhhigemlgiflfgdhcdpipadmmm",
            { action: "aio-runInBackground", data },
            function (response) {
              // console.log("Response from background script:", response);
              sendToPageScript(event, uuid, response);
            }
          );
          break;
        }
      }
    } catch (e) {
      console.log("ERROR: ", e);
      sendToPageScript(event, uuid, null);
    }
  });
})();
