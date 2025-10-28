(async () => {
  console.log("FB AIO: FB add download video button ENABLED");

  const { onElementsAdded, closest, getFBAIODashboard } = await import(
    "./helper/helper.js"
  );

  function getVideoId(videoEle) {
    try {
      let key = "";
      for (let k in videoEle.parentElement) {
        if (k.startsWith("__reactProps")) {
          key = k;
          break;
        }
      }
      const props = videoEle.parentElement[key].children.props;
      return props.videoFBID || props.coreVideoPlayerMetaData?.videoFBID;
    } catch (e) {
      console.log("ERROR on get videoFBID: ", e);
      return null;
    }
  }

  onElementsAdded("video", (videos) => {
    const className = "fb-aio-video-download-btn";
    for (let video of videos) {
      const container =
        closest(video, "[data-video-id]") ||
        closest(video, '[data-visualcompletion="ignore"]') ||
        video.parentElement;

      if (container.querySelector(`.${className}`)) continue;

      let btn = document.createElement("button");
      btn.className = className;
      btn.textContent = "⬇️";
      btn.title = "FB AIO: Download video";
      btn.style.cssText = `
        position: absolute;
        top: 60px;
        right: 10px;
        width: 40px;
        height: 40px;
        background-color: #333;
        color: #fff;
        border-radius: 5px;
        border: none;
        opacity: 0.3;
        cursor: pointer;
        z-index: 2147483647;`;
      btn.addEventListener("mouseenter", () => {
        btn.style.opacity = 1;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.opacity = 0.5;
      });
      btn.onclick = (e) => {
        const id = getVideoId(video);
        window.open(
          getFBAIODashboard() + `/#/video-downloader?url=https://www.fb.com/videos/${id}`,
          "_blank"
        );
        e.stopPropagation();
      };

      container.appendChild(btn);
    }
  });
})();
