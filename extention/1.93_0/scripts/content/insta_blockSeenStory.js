(async () => {
  console.log("FB AIO: Insta block seen story ENABLED");

  const { notify } = await import("./helper/helper.js");
  const { hookXHR } = await import("./helper/ajax-hook.js");
  hookXHR({
    onBeforeSend: ({ method, url, async, user, password }, dataSend) => {
      let s = dataSend?.toString() || "";
      if (s.includes("viewSeenAt") || s.includes("SeenMutation")) {
        notify({
          msg: "👀 FB AIO: instagram story seen BLOCKED",
        });
        return null;
      }
    },
  });
})();
