(async () => {
  console.log("FB AIO: download video button for Threads ENABLED");

  const { onElementsAdded, closest } = await import("./helper/helper.js");

  onElementsAdded("video", (videos) => {
    const className = "fb-aio-threads-video-download-btn";
    for (let video of videos) {
      const container =
        closest(video, "img")?.parentElement || video.parentElement;

      if (container?.querySelector(`.${className}`)) continue;

      let btn = document.createElement("button");
      btn.className = className;
      btn.textContent = "⬇️";
      btn.title = "FB AIO: Download video";
      btn.style.cssText = `
          position: absolute;
          top: 10px;
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
        window.open(video.src, "_blank");
        e.stopPropagation();
      };

      container.appendChild(btn);
    }
  });
})();
