(async () => {
  console.log("FB AIO: stop new feed facebook ENABLED");

  const { hookXHR } = await import("./helper/ajax-hook.js");
  const { notify } = await import("./helper/helper.js");

  const blackList = {
    story: [
      // "StoriesSuspenseNavigationPaneRootWithEntryPointQuery",
      // "StoriesSuspenseContentPaneRootWithEntryPointQuery",
      "StoriesTrayRectangularQuery",
      // "StoriesTrayRectangularRootQuery",
      "useStoriesViewerBucketsPaginationQuery",
    ],
    "video tab": [
      "CometVideoHomeFeedRootQuery",
      "CometVideoHomeFeedSectionPaginationQuery",
    ],
    "home tab": ["CometModernHomeFeedQuery", "CometNewsFeedPaginationQuery"],
    "group tab": [
      "GroupsCometCrossGroupFeedPaginationQuery",
      "GroupsCometCrossGroupFeedContainerQuery",
    ],
    "group feed": ["GroupsCometFeedRegularStoriesPaginationQuery"],
    "marketplace tab": [
      // "CometMarketplaceRootQuery",
      // "MarketplaceCometBrowseFeedLightContainerQuery",
      // "MarketplaceCometBrowseFeedLightPaginationQuery",
      "MarketplaceBannerContainerQuery",
      "CometMarketplaceLeftRailNavigationContainerQuery",
    ],
    "event tab": [
      // "EventCometHomeDiscoverContentRefetchQuery"
    ],
    "online status": [
      // "UpdateUserLastActiveMutation"
    ],
  };

  let enabled = true;
  hookXHR({
    onBeforeSend: ({ method, url, async, user, password }, dataSend) => {
      let s = dataSend?.toString() || "";

      let inBlackList = false;
      for (const [key, value] of Object.entries(blackList)) {
        if (value.find((item) => s.includes(item))) {
          inBlackList = key;
          break;
        }
      }

      if (enabled && inBlackList) {
        notify({
          msg: "🚫 FB AIO: Stopped new feed facebook '" + inBlackList + "'",
        });
        return null;
      }
    },
  });

  return (value = !enabled) => {
    enabled = value;
    notify({
      msg:
        "FB AIO:" +
        (enabled ? "ENABLED" : "DISABLED") +
        " Stop new feed facebook ",
    });
  };
})();
