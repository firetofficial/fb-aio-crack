(async () => {
  console.log("FB AIO: FB add download video button ENABLED");

  const { onElementsAdded, closest } = await import("./helper/helper.js");

  onElementsAdded("video", (videos) => {
    const className = "fb-aio-video-control-btn";
    for (let video of videos) {
      const container =
        closest(video, "[data-video-id]") ||
        closest(video, '[data-visualcompletion="ignore"]') ||
        video.parentElement;

      if (container.querySelector(`.${className}`)) continue;

      const overlay = closest(video, "[data-instancekey]");
      const overlay2 = closest(video, "[data-video-id]")?.parentElement
        ?.nextElementSibling;

      let btn = document.createElement("button");
      btn.className = className;
      btn.textContent = "🕹️";
      btn.title = "FB AOI: Toggle video controls";
      btn.style.cssText = `
          position: absolute;
          top: 60px;
          right: 55px;
          width: 40px;
          height: 40px;
          background-color: #333;
          color: #fff;
          border-radius: 5px;
          border: none;
          cursor: pointer;
          opacity: 0.3;
          z-index: 2147483647;`;
      btn.addEventListener("mouseenter", () => {
        btn.style.opacity = 1;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.opacity = 0.5;
      });
      btn.onclick = (e) => {
        console.log(video, overlay);
        if (video.hasAttribute("controls")) {
          video.removeAttribute("controls");
          [overlay, overlay2].forEach((el) => {
            if (el) el.style.display = "block";
          });
        } else {
          video.setAttribute("controls", "");
          [overlay, overlay2].forEach((el) => {
            if (el) el.style.display = "none";
          });
        }
        e.stopPropagation();
      };

      container.appendChild(btn);
    }
  });
})();
