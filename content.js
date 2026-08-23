(function () {
  "use strict";

  const PREFIX = "sat-tbx";

  const launcherBar = document.createElement("div");
  launcherBar.id = `${PREFIX}-launcher`;
  launcherBar.style.position = "fixed";
  launcherBar.style.zIndex = "999999";

  const refBtn = document.createElement("button");
  refBtn.id = `${PREFIX}-ref-btn`;
  refBtn.className = `${PREFIX}-launch-btn`;
  refBtn.textContent = "XY";
  refBtn.title = "Open SAT Math Reference Sheet";


  const desmosBtn = document.createElement("button");
  desmosBtn.id = `${PREFIX}-desmos-btn`;
  desmosBtn.className = `${PREFIX}-launch-btn`;
  desmosBtn.textContent = "DESMOS";
  desmosBtn.title = "Open Desmos Calculator";

  launcherBar.append(refBtn, desmosBtn);
  document.body.appendChild(launcherBar);

  const hasStorage =
    typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

  function setDefaultGeometry(win) {
    const offset = document.querySelectorAll(`.${PREFIX}-win`).length * 24;
    win.style.left = `${80 + offset}px`;
    win.style.top = `${80 + offset}px`;
  }

  function saveGeometry(win, id) {
    if (!hasStorage) return;
    const { left, top, width, height } = win.style;
    try {
      chrome.storage.local.set({
        [`${PREFIX}-geo-${id}`]: { left, top, width, height },
      });
    } catch (err) {
      console.warn("SAT Toolbox: couldn't save window geometry.", err);
    }
  }

  function restoreGeometry(win, id) {
    if (!hasStorage) {
      setDefaultGeometry(win);
      return;
    }
    try {
      chrome.storage.local.get([`${PREFIX}-geo-${id}`], (result) => {
        const saved = result[`${PREFIX}-geo-${id}`];
        if (saved && saved.left && saved.top) {
          win.style.left = saved.left;
          win.style.top = saved.top;
          if (saved.width) win.style.width = saved.width;
          if (saved.height) win.style.height = saved.height;
        } else {
          setDefaultGeometry(win);
        }
      });
    } catch (err) {
      console.warn("SAT Toolbox: couldn't restore window geometry.", err);
      setDefaultGeometry(win);
    }
  }

  function createFloatingWindow({ id, title, buildBody, onClose }) {
    const win = document.createElement("div");
    win.id = id;
    win.className = `${PREFIX}-win`;
    win.style.position = "fixed";
    win.style.zIndex = "999998";

    const header = document.createElement("div");
    header.className = `${PREFIX}-win-header`;

    const titleEl = document.createElement("span");
    titleEl.className = `${PREFIX}-win-title`;
    titleEl.textContent = title;

    const hideBtn = document.createElement("button");
    hideBtn.className = `${PREFIX}-win-hide`;
    hideBtn.textContent = "–";
    hideBtn.title = "Hide";

    const closeBtn = document.createElement("button");
    closeBtn.className = `${PREFIX}-win-close`;
    closeBtn.textContent = "×";
    closeBtn.title = "Close";

    header.append(titleEl, hideBtn, closeBtn);

    const body = document.createElement("div");
    body.className = `${PREFIX}-win-body`;

    const overlay = document.createElement("div");
    overlay.className = `${PREFIX}-interaction-overlay`;
    overlay.style.display = "none";

    win.append(header, body, overlay);
    document.body.appendChild(win);

    win.addEventListener("mousedown", () => {
      document.querySelectorAll(`.${PREFIX}-win`).forEach((otherWin) => {
        otherWin.style.zIndex = "999998";
      });

      win.style.zIndex = "999999";
    });

    buildBody(body);
    restoreGeometry(win, id);
    makeDraggable(win, header, overlay, id);
    makeResizable(win, overlay, id);

    hideBtn.addEventListener("click", () => {
      const collapsed = win.classList.toggle(`${PREFIX}-collapsed`);
      hideBtn.textContent = collapsed ? "+" : "–";
      hideBtn.title = collapsed ? "Show" : "Hide";
    });

    closeBtn.addEventListener("click", () => {
      win.remove();
      if (onClose) onClose();
    });

    return win;
  }

  function openRefWindow() {
    const existing = document.getElementById(`${PREFIX}-ref-win`);
    if (existing) {
      existing.classList.remove(`${PREFIX}-collapsed`);
      return;
    }
    createFloatingWindow({
      id: `${PREFIX}-ref-win`,
      title: "Reference Sheet",
      buildBody: (body) => {
        const img = document.createElement("img");
        img.className = `${PREFIX}-ref-img`;
        img.src = chrome.runtime.getURL("image.png");
        img.alt = "SAT Math reference sheet";
        body.appendChild(img);
      },
    });
  }
  refBtn.addEventListener("click", openRefWindow);

  function openDesmosWindow() {
    const existing = document.getElementById(`${PREFIX}-desmos-win`);
    if (existing) {
      existing.classList.remove(`${PREFIX}-collapsed`);
      return;
    }
    createFloatingWindow({
      id: `${PREFIX}-desmos-win`,
      title: "Desmos",
      buildBody: (body) => {
        const iframe = document.createElement("iframe");
        iframe.className = `${PREFIX}-desmos-frame`;
        iframe.src = "https://www.desmos.com/calculator";
        iframe.allow = "clipboard-write";
        body.appendChild(iframe);
      },
    });
  }
  desmosBtn.addEventListener("click", openDesmosWindow);

  function makeDraggable(win, handle, overlay, id) {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    handle.addEventListener("mousedown", (e) => {
      if (e.target.closest("button")) return;

      dragging = true;
      const rect = win.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      win.style.zIndex = 99999;
      overlay.style.display = "block";
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const x = clamp(
        e.clientX - offsetX,
        0,
        window.innerWidth - win.offsetWidth,
      );
      const y = clamp(
        e.clientY - offsetY,
        0,
        window.innerHeight - win.offsetHeight,
      );
      win.style.left = `${x}px`;
      win.style.top = `${y}px`;
    });

    document.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false;
      overlay.style.display = "none";
      saveGeometry(win, id);
    });
  }

  function makeResizable(win, overlay, id) {
    let resizeTimer = null;
    let watchingResize = false;

    win.addEventListener("mousedown", (e) => {
      const rect = win.getBoundingClientRect();
      const nearCorner =
        rect.right - e.clientX < 18 && rect.bottom - e.clientY < 18;
      if (!nearCorner) return;
      overlay.style.display = "block";
      watchingResize = true;
    });

    document.addEventListener("mouseup", () => {
      if (!watchingResize) return;
      watchingResize = false;
      overlay.style.display = "none";
    });

    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => saveGeometry(win, id), 300);
    });
    observer.observe(win);
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(val, max));
  }
})();
