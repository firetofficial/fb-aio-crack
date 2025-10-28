(() => {
  console.log("FB AIO: Block open urls ENABLED");

  let regexs = [];

  window.addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
      confirmOpen(event.target.href, event);
    }
  });

  window.fbaio_originalOpen = window.fbaio_originalOpen || window.open;
  window.open = (url, target, features) => {
    const confirmed = confirmOpen(url, null);
    return confirmed
      ? window.fbaio_originalOpen?.(url, target, features)
      : null;
  };

  function confirmOpen(url, event) {
    const inBlacklist = regexs.some((_) => _.test(url));
    if (!inBlacklist) return true;

    const value = prompt(
      "FB AIO: Ads link detected. Are you sure you want to open this link?",
      url
    );
    const confirmed = value != null;
    if (!confirmed && event) {
      event.preventDefault();
      event.stopPropagation?.();
      event.stopImmediatePropagation?.();
    }
    return confirmed;
  }

  // get cache
  (async () => {
    const { getExtStorage } = await import("./helper/helper.js");
    regexs = ((await getExtStorage("block_open_urls_regexs")) || [])
      .map((_) => {
        try {
          return new RegExp(_);
        } catch (e) {
          return null;
        }
      })
      .filter((_) => _ != null);

    console.log("FB AIO: block_open_urls_regexs", regexs);

    if (regexs.some((_) => _.test(window.location.href))) {
      const confirmed = confirm(
        "FB AIO: Ads link detected.\n\nConfirm: to close website.\nCancel: to continue browsing this website"
      );
      if (confirmed) {
        window.stop();
        window.close();
      }
    }
  })();
})();
