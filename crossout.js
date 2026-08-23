(function () {
  "use strict";

  const PREFIX = "sat-tbx";
  const CHOICE_SELECTOR = [
    'ul[data-widget="radio"] > li[role="listitem"]',
    'ul[data-widget="checkbox"] > li[role="listitem"]',
    '[role="radio"]',
    '[data-testid*="choice" i]',
    '[data-test-id*="choice" i]',
    '[class*="answer-choice" i]',
    '[class*="radio-option" i]',
  ].join(",");

  function processChoices() {
    const choices = document.querySelectorAll(CHOICE_SELECTOR);
    choices.forEach((choice) => {
      if (choice.dataset.satTbxCrossout) return;
      if (choice.closest(`[data-sat-tbx-crossout="true"]`)) return;
      attachCrossOut(choice);
    });
  }

  function getChoiceLabel(choice, letterBtn) {
    const letter = letterBtn?.querySelector("span")?.textContent?.trim();
    return letter ? `Cross out option ${letter}` : "Cross out this option";
  }

  function attachCrossOut(choice) {
    choice.dataset.satTbxCrossout = "true";
    choice.classList.add(`${PREFIX}-choice`);

    const letterBtn = choice.querySelector('button[aria-label*="Choice" i]');
    const label = getChoiceLabel(choice, letterBtn);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `${PREFIX}-strike-btn`;
    btn.textContent = "\u2715"; // ✕
    btn.title = label;
    btn.dataset.label = label;
    btn.setAttribute("aria-label", label);
    choice.appendChild(btn);

    if (letterBtn) {
      if (getComputedStyle(choice).position === "static") {
        choice.style.position = "relative";
      }

      btn.style.position = "absolute";
      btn.style.right = "10px";
      btn.style.top = "50%";
      btn.style.transform = "translateY(-50%)";

      const contentEl = letterBtn.nextElementSibling;
      if (contentEl && contentEl !== btn) {
        const existingPad =
          parseFloat(getComputedStyle(contentEl).paddingRight) || 0;
        contentEl.style.paddingRight = `${existingPad + 40}px`;
      }
    }
  }

    const INTERCEPT_EVENTS = [
    "pointerdown",
    "pointerup",
    "mousedown",
    "mouseup",
    "touchstart",
    "touchend",
    "click",
  ];

  INTERCEPT_EVENTS.forEach((type) => {
    document.addEventListener(
      type,
      (e) => {
        const btn = e.target.closest(`.${PREFIX}-strike-btn`);
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") {
          e.stopImmediatePropagation();
        }
        if (type === "click") toggleStrike(btn);
      },
      true,
    );
  });

  function toggleStrike(btn) {
    const choice = btn.closest(`.${PREFIX}-choice`);
    if (!choice) return;
    const struck = choice.classList.toggle(`${PREFIX}-struck`);
    btn.classList.toggle(`${PREFIX}-strike-active`, struck);
    const base = btn.dataset.label || "this option";
    btn.title = struck ? `Un-cross ${base.replace(/^Cross out /, "")}` : base;
  }

  const observer = new MutationObserver(() => {
    processChoices();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  processChoices();
})();
