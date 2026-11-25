import { useEffect, useRef, useState } from 'react';
import { CATEGORY_EMOJI, CORKAGE } from '../constants.js';

const JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY;
let sdkPromise = null;

function loadSdk() {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    if (window.kakao?.maps) return window.kakao.maps.load(() => resolve(window.kakao));
    const s = document.createElement('script');
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${JS_KEY}&autoload=false`;
    s.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
    s.onerror = () => reject(new Error('카카오맵을 불러오지 못했어요'));
    document.head.appendChild(s);
  });
  return sdkPromise;
}

export default function KakaoMap({ places, selectedId, onSelect }) {
  const box = useRef(null);
  const map = useRef(null);
  const overlays = useRef([]);
  const [error, setError] = useState(JS_KEY ? '' : 'no-key');

  useEffect(() => {
    if (!JS_KEY) return;
    loadSdk()
      .then((kakao) => {
        map.current = new kakao.maps.Map(box.current, {
          center: new kakao.maps.LatLng(37.45, 127.05),
          level: 9,
        });
        map.current.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, []);

  // 마커 다시 그리기
  useEffect(() => {
    const kakao = window.kakao;
    if (!map.current || !kakao) return;
    overlays.current.forEach((o) => o.setMap(null));
    overlays.current = [];
    const bounds = new kakao.maps.LatLngBounds();
    places
      .filter((p) => p.lat && p.lng)
      .forEach((p) => {
        const pos = new kakao.maps.LatLng(p.lat, p.lng);
        const el = document.createElement('button');
        el.className = `pin${p.id === selectedId ? ' pin--on' : ''}`;
        el.style.borderColor = CORKAGE[p.corkage?.type || 'unknown'].color;
        el.textContent = `${CATEGORY_EMOJI[p.category] || '🍶'} ${p.name.replace('[샘플] ', '')}`;
        el.onclick = () => onSelect(p.id);
        const o = new kakao.maps.CustomOverlay({ position: pos, content: el, yAnchor: 1.2, zIndex: p.id === selectedId ? 10 : 1 });
        o.setMap(map.current);
        overlays.current.push(o);
        bounds.extend(pos);
      });
    if (!selectedId && overlays.current.length) map.current.setBounds(bounds);
  }, [places, selectedId, error]);

  // 선택된 가게로 이동
  useEffect(() => {
    const kakao = window.kakao;
    const p = places.find((x) => x.id === selectedId);
    if (!map.current || !kakao || !p?.lat) return;
    map.current.panTo(new kakao.maps.LatLng(p.lat, p.lng));
  }, [selectedId]);

  if (error === 'no-key') {
    return (
      <div className="map map--empty">
        <p>🗺️ 카카오 지도 키(<code>VITE_KAKAO_JS_KEY</code>)가 아직 없어서 지도를 띄울 수 없어요.</p>
        <p>키를 GitHub Secrets 에 넣으면 다음 배포부터 지도가 나와요. 목록은 지금도 쓸 수 있어요.</p>
      </div>
    );
  }
  return (
    <div className="map">
      <div ref={box} className="map__canvas" />
      {error && <div className="map__error">{error}</div>}
    </div>
  );
}
