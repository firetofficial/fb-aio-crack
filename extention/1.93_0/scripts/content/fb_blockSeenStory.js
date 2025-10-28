(async () => {
  console.log("FB AIO: FB block seen story ENABLED");

  const { notify } = await import("./helper/helper.js");
  const { hookXHR } = await import("./helper/ajax-hook.js");

  hookXHR({
    onBeforeSend: ({ method, url, async, user, password }, dataSend) => {
      if (
        method === "POST" &&
        dataSend?.toString?.()?.includes?.("storiesUpdateSeenStateMutation")
      ) {
        notify({ msg: "👀 FB AIO: facebook story seen BLOCKED" });
        return null;
      }
    },
  });
})();
