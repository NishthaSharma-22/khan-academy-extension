const button = document.createElement("button");
const desmos = document.createElement("button");
button.id = "ref-btn";
desmos.id = "desmos";
button.textContent = "XY";
desmos.textContent = "DM";
document.body.appendChild(button);
document.body.appendChild(desmos);

function createRefWin() {
  if (document.getElementById("ref-win")) return;
  const win = document.createElement("div");
  win.id = "ref-win";
  const img = document.createElement("img");
  img.src = chrome.runtime.getURL("image.png");
  const minimize = document.createElement("button");
  minimize.className = "minimize-btn";
  minimize.textContent = "x";
  minimize.onclick = () => win.remove();
  win.appendChild(minimize);
  win.appendChild(img);
  document.body.appendChild(win);
}

button.addEventListener("click", createRefWin);
function createDesmosWindow() {
  if (document.getElementById("desmosWin")) return;
  const desmosWin = document.createElement("div");
  desmosWin.id = "desmosWin";
  const closeDesmos = document.createElement("button");
  closeDesmos.className = "closeDesmos";
  closeDesmos.textContent = "X";
  const minimizeDesmos = document.createElement("button");
  minimizeDesmos.className = "minimizeDesmos";
  minimizeDesmos.textContent = "M";
  const iframe = document.createElement("iframe");
  iframe.src = "https://www.desmos.com/calculator";

  closeDesmos.onclick = () => desmosWin.remove();
  desmosWin.append(iframe);
  desmosWin.appendChild(closeDesmos);
  document.body.append(desmosWin);
}
desmos.addEventListener("click", createDesmosWindow);
