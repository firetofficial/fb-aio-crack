(async () => {
  console.log("FB AIO: Tiktok add download video button ENABLED");

  const { hookFetch } = await import("./helper/ajax-hook.js");
  const {
    notify,
    downloadData,
    closest,
    sanitizeName,
    injectCssCode,
    getFBAIODashboard
  } = await import("./helper/helper.js");

  const videoById = new Map();

  // reference to Cached
  window.fbaio_tiktok_addDownloadVideoBtn = () => videoById;

  notify({
    msg: "FB AIO: Tiktok add download button ENABLED",
  });

  hookFetch({
    onAfter: async (url, options, response) => {
      const isItemList = url.includes("item_list/");
      const isSearch = url.includes("api/search");
      // const isExplore = url.includes("api/explore/item_list");

      if (isItemList || isSearch) {
        let count = 0;

        const res = response.clone();
        const json = await res.json();
        console.log(json);

        const list = json?.itemList || json?.item_list || json?.data;

        if (list?.length) {
          list.forEach((_) => {
            const item = _?.item || _;
            if (item?.video?.id) {
              videoById.set(item.video.id, item);
              count++;
            }
          });
        }

        if (count > 0) {
          notify({
            msg: `FB AIO: Found ${count} videos (Total: ${videoById.size})`,
          });
        }
      }
    },
  });

  const id = "fb-aio-tiktok-download-btn";
  function hasDownloadBtn(ele, vidId) {
    const target = ele.querySelector(`.${id}`);
    return target && (!vidId || target.dataset.id === vidId);
  }
  function removeDownloadBtn(ele) {
    const target = ele.querySelector(`.${id}`);
    if (target) {
      target.remove();
    }
  }

  injectCssCode(`
      .fb-aio-trigger {
        position: relative;
        color: white;
        z-index: 2;
      }
      .fb-aio-trigger button {
        background: #ffffff1f;
        color: white;
      }
      .fb-aio-trigger button:hover {
        background: #ffffff3f !important;
      }
      .fb-aio-content {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        border-radius: 10px;
        padding: 5px;
        background-color: #333;
        min-width: 200px;
      }
      .fb-aio-content button {
        width: 100%;
        padding: 5px;
        text-align: left;
      }
      .fb-aio-trigger:hover .fb-aio-content,
      .fb-aio-content:hover {
        display: block;
      }`);

  function createDownloadButton({
    video,
    btnStyle = "",
    containerStyle = "",
    contentStyle = "",
  }) {
    const container = document.createElement("div");
    container.style.cssText = containerStyle;
    container.dataset.id = video?.id;
    container.classList.add("fb-aio-trigger", id);

    const btn = document.createElement("button");
    btn.style.cssText = btnStyle;
    btn.textContent = "⬇️";
    btn.title = "FB AIO: Download video";
    btn.addEventListener("click", () => {});
    container.appendChild(btn);

    const content = document.createElement("div");
    content.style.cssText = contentStyle;
    content.classList.add("fb-aio-content");

    const fbaio = document.createElement("p");
    fbaio.textContent = "FB AIO";
    content.appendChild(fbaio);

    const filename = sanitizeName(
      video.desc?.slice?.(0, 50) || video?.id || "tiktok_video"
    );

    const title = document.createElement("p");
    title.textContent = filename;
    content.appendChild(title);

    const btns = [
      {
        text: "🎬 Video - no watermark",
        onClick: () => {
          window.open(video?.video?.playAddr, "_blank");
        },
      },
      {
        text: "🎬 Video - watermark",
        onClick: () => {
          const url = video?.video?.downloadAddr;
          window.open(url, "_blank");
        },
      },
      video?.music?.id
        ? {
            text: "🎧 Music: " + video?.music?.title,
            onClick: () => {
              const url = video?.music?.playUrl;
              if (url) window.open(url, "_blank");
              else alert("Can not download this music (no URL)");
            },
          }
        : null,
      {
        text: "📝 JSON Data",
        onClick: () => {
          downloadData(JSON.stringify(video, null, 4), filename + ".json");
        },
      },
      {
        text: "📝 ALL " + videoById.size + " videos (JSON)",
        onClick: () => {
          const data = Array.from(videoById.values());
          downloadData(
            JSON.stringify(data, null, 4),
            data.length + "_tiktok_videos.json"
          );
        },
      },
    ].filter(Boolean);

    btns.forEach((_) => {
      const btn = document.createElement("button");
      btn.textContent = _.text;
      btn.addEventListener("click", _.onClick);
      content.appendChild(btn);
    });
    container.appendChild(content);

    return container;
  }

  const allId = "fb-aio-tiktok-download-all-btn";
  const downloadAllBtn = document.createElement("button");
  downloadAllBtn.id = allId;
  downloadAllBtn.textContent = "⬇️ Download all";
  downloadAllBtn.title = "FB AIO: Download all videos";
  downloadAllBtn.style.cssText = `
    padding: 10px;
    background: #2c68dc;
    border-radius: 5px;
    color: white;
  `;
  downloadAllBtn.addEventListener("click", () => {
    window.open(
      getFBAIODashboard() +
        `/#/bulk-downloader?platform=Tiktok&targetId=${location.href}`,
      "_blank"
    );
  });

  setInterval(() => {
    // add download all user videos btn
    const user_btn_row = document.querySelector(
      '[data-e2e="user-page"] [class*="DivButtonPanelWrapper"]'
    );
    if (user_btn_row && !user_btn_row.querySelector(`#${allId}`)) {
      user_btn_row.append(downloadAllBtn);
    }

    // feed
    const feed_videos = Array.from(
      document.querySelectorAll('[data-e2e="feed-video"]')
    );
    for (const feed of feed_videos) {
      const actionBar = closest(feed, '[class*="SectionActionBarContainer"]');
      if (actionBar && !hasDownloadBtn(actionBar)) {
        const vidId = feed
          .querySelector("[id*=xgwrapper-0]")
          ?.id?.split("-")
          ?.at(-1);

        if (vidId && videoById.has(vidId)) {
          const btn = createDownloadButton({
            video: videoById.get(vidId),
            btnStyle: `
              width: 48px;
              height: 48px;
              border-radius: 50%;`,
            containerStyle: `
              margin-bottom: 15px;`,
          });
          actionBar.prepend(btn);
        }
      }
    }

    // search + explore
    const search_videos = Array.from(
      document.querySelectorAll(
        '[data-e2e="search_top-item"], [data-e2e="search_video-item"]'
      )
    );
    const explore_videos = Array.from(
      document.querySelectorAll('[data-e2e="explore-item"]')
    );
    for (const item of [...explore_videos, ...search_videos]) {
      if (!hasDownloadBtn(item)) {
        const vidId = item
          .querySelector('a[href*="tiktok.com"][href*="/video/"]')
          ?.href?.split("video/")
          ?.at(-1);
        if (vidId && videoById.has(vidId)) {
          console.log("explore", item);
          const btn = createDownloadButton({
            video: videoById.get(vidId),
            btnStyle: `
              width: 48px;
              height: 48px;
              border-radius: 10px;`,
            containerStyle: `
              position: absolute;
              top: 0;
              right: 0;`,
            contentStyle: `
              right: 0;
              left: auto;`,
          });
          item.appendChild(btn);
        }
      }
    }

    // detail vid
    const detail_vids = Array.from(
      document.querySelectorAll('[data-e2e="detail-video"]')
    );
    for (const detail of detail_vids) {
      const vidId = detail
        .querySelector('[id*="xgwrapper"]')
        ?.id?.split("-")
        ?.at(-1);

      if (!hasDownloadBtn(detail, vidId)) {
        if (vidId && videoById.has(vidId)) {
          removeDownloadBtn(detail);

          console.log("detail", detail);
          const btn = createDownloadButton({
            video: videoById.get(vidId),
            btnStyle: `
              width: 48px;
              height: 48px;
              border-radius: 10px;`,
            containerStyle: `
              position: absolute;
              top: 0;
              left: 0;`,
            contentStyle: `
              z-index: 100;
            `,
          });
          detail.appendChild(btn);
        }
      }
    }

    // You may like (beside detail vid) + user post videos
    const you_may_like_vids = Array.from(
      document.querySelectorAll(
        '[class*="DivItemContainer"], [class*="DivItemContainerV2"]'
      )
    );
    for (const vid of you_may_like_vids) {
      if (!hasDownloadBtn(vid)) {
        const vidId = vid
          .querySelector('a[href*="/video/"]')
          ?.href?.split("video/")
          ?.at(-1);

        if (vidId && videoById.has(vidId)) {
          console.log("you may like", vid);
          const btn = createDownloadButton({
            video: videoById.get(vidId),
            btnStyle: `
              width: 48px;
              height: 48px;
              border-radius: 10px;`,
            containerStyle: `
              position: absolute;
              top: 0;
              right: 0;`,
            contentStyle: `
              right: 0;
              left: auto;`,
          });
          vid.style.position = "relative";
          vid.appendChild(btn);
        }
      }
    }

    // fullscreen vid
    const fullscreen_vids = Array.from(
      document.querySelectorAll(
        '[role="dialog"][class*="DivBrowserModeContainer"]'
      )
    );
    for (const full of fullscreen_vids) {
      const vidId = full
        .querySelector('[data-e2e="browse-video"] [id*="xgwrapper"]')
        ?.id?.split("-")
        ?.at(-1);
      if (!hasDownloadBtn(full, vidId)) {
        const row = full.querySelector('[data-e2e="browse-like-icon"]')
          ?.parentElement?.parentElement;

        if (vidId && row && videoById.has(vidId)) {
          removeDownloadBtn(full);

          console.log("full", full);
          const btn = createDownloadButton({
            video: videoById.get(vidId),
            btnStyle: `
                width: 32px;
                height: 32px;
                border-radius: 10px;`,
            containerStyle: ``,
            contentStyle: `
                z-index: 100;`,
          });
          row.prepend(btn);
        }
      }
    }
  }, 1000);

  // get video detail from rehydrate data
  window.addEventListener("load", () => {
    const interval = setInterval(() => {
      if (window?.__UNIVERSAL_DATA_FOR_REHYDRATION__) {
        const data = JSON.parse(
          window.__UNIVERSAL_DATA_FOR_REHYDRATION__.textContent
        );
        const vidData =
          data?.__DEFAULT_SCOPE__?.["webapp.video-detail"]?.itemInfo
            ?.itemStruct;
        const id = vidData?.video?.id || vidData?.id;

        if (id) {
          videoById.set(id, vidData);
          clearInterval(interval);
        }
      }
    }, 1000);
  });
})();
