function getBgmNode() {
  return document.getElementById('bgm') as HTMLAudioElement | null;
}

function syncBgmControl() {
  const bgm = getBgmNode();
  const control = document.getElementById("bgm-control");
  if (!bgm || !control) {
    return;
  }
  if (bgm.paused) {
    control.setAttribute("fill", "currentColor");
    control.style.transform = "scaleY(.5)";
  } else {
    control.setAttribute("fill", "#18d1ff");
    control.style.transform = "scaleY(1)";
  }
}

function BgmControl() {
  const bgm = getBgmNode();
  if (!bgm) {
    return;
  }
  if (bgm.paused) {
    void bgm.play();
  } else {
    bgm.pause();
  }
  syncBgmControl();
}

function persistBgmNodeOnPjax() {
  const globalWindow = window as Window & { __arknightsBgm?: HTMLAudioElement };
  let wasPlaying = false;

  document.addEventListener('pjax:send', () => {
    const bgm = getBgmNode();
    if (!bgm) {
      return;
    }
    wasPlaying = !bgm.paused;
    globalWindow.__arknightsBgm = bgm;
    document.body.appendChild(bgm);
  });

  document.addEventListener('pjax:complete', () => {
    const bgm = globalWindow.__arknightsBgm;
    if (!bgm) {
      syncBgmControl();
      return;
    }
    const placeholder = getBgmNode();
    if (placeholder && placeholder !== bgm) {
      placeholder.replaceWith(bgm);
    } else if (!getBgmNode()) {
      document.getElementById('bgm-control')?.parentElement?.appendChild(bgm);
    }
    if (wasPlaying && bgm.paused) {
      void bgm.play().catch(() => {
        console.warn('BGM 自动播放被浏览器阻止，需要用户交互');
      });
    }
    syncBgmControl();
  });

  document.addEventListener('DOMContentLoaded', syncBgmControl);
}

persistBgmNodeOnPjax();