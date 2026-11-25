import { useEffect, useState } from 'react';

// 안드로이드/크롬은 설치 버튼, 아이폰 사파리는 '공유 → 홈 화면에 추가' 안내.
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const standalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);
  const isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return { canInstall: !!deferred && !standalone, showIosHint: isIos && !standalone, install };
}
