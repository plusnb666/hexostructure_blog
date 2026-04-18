// 获取全局 BGM 节点（audio 已在 layout 中全局挂载）
function getBgmNode() {
  return document.getElementById('bgm') as HTMLAudioElement | null;
}

// 同步图标状态，使按钮外观与真实播放状态保持一致
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

// 在 PJAX 过程中复用同一个 audio 节点，避免切页后从头播放
function persistBgmNodeOnPjax() {
  const globalWindow = window as Window & { __arknightsBgm?: HTMLAudioElement };
  let wasPlaying = false;

  document.addEventListener('pjax:send', () => {
    const bgm = getBgmNode();
    if (!bgm) {
      return;
    }
    // 记录切页前是否正在播放，用于切页后尝试恢复
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
    // 若新 DOM 中有占位节点则替换；若没有则回挂到音乐按钮附近
    const placeholder = getBgmNode();
    if (placeholder && placeholder !== bgm) {
      placeholder.replaceWith(bgm);
    } else if (!getBgmNode()) {
      document.getElementById('bgm-control')?.parentElement?.appendChild(bgm);
    }
    if (wasPlaying && bgm.paused) {
      // 生产环境可能被自动播放策略拦截，因此捕获错误避免中断主逻辑
      void bgm.play().catch(() => {
        console.warn('BGM 自动播放被浏览器阻止，需要用户交互');
      });
    }
    syncBgmControl();
  });

  document.addEventListener('DOMContentLoaded', syncBgmControl);
}

persistBgmNodeOnPjax();