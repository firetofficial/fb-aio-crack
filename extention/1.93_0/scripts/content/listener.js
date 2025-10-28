(async () => {
  console.log("FB AIO: listener script INJECTED");

  window.addEventListener("message", async (event) => {
    const { from, origin, uuid, fnPath, params } = event.data || {};
    if (uuid && from === "fbaio" && (!origin || origin === location.origin)) {
      console.log("Message received:", event);
      const utils = await import("../utils/index.js");
      const helpers = await import("./helper/helper.js");
      const GLOBAL = {
        window,
        utils,
        helpers,
        fetch: (url, options) =>
          fetch(url, options || {})
            .then((res) => res.text())
            .catch((e) => null),
      };
      const data = await utils.runFunc(fnPath, params, GLOBAL);
      event.source.postMessage({ uuid, data }, event.origin);
    }
  });
})();
