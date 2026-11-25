import { useEffect, useRef, useState } from 'react';
import { MapPinOff } from 'lucide-react';
import type { CorkageStatus, Restaurant } from '@/types';
import { useStore } from '@/store/AppStore';
import { cx } from './ui';

const KEY = import.meta.env.VITE_KAKAO_JS_KEY;
let sdk: Promise<void> | null = null;
function loadSdk() {
  sdk ??= new Promise<void>((resolve, reject) => {
    if (window.kakao?.maps) return window.kakao.maps.load(() => resolve());
    const s = document.createElement('script');
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false`;
    s.onload = () => window.kakao.maps.load(() => resolve());
    s.onerror = () => reject(new Error('카카오맵을 불러오지 못했어요. 도메인 등록과 카카오맵 사용 설정을 확인해 주세요.'));
    document.head.appendChild(s);
  });
  return sdk;
}

const PIN: Record<CorkageStatus, { bg: string; icon: string }> = {
  free: { bg: '#7a1f3d', icon: '🍷' },
  conditional: { bg: '#b7791f', icon: '🍷' },
  paid: { bg: '#8b8b8b', icon: '🍷' },
  unknown: { bg: '#e0a100', icon: '?' },
};

export function MapLegend({ className }: { className?: string }) {
  return (
    <div className={cx('rounded-xl border border-line bg-card/95 p-3 text-xs shadow-md backdrop-blur', className)}>
      {(
        [
          ['free', '콜키지 프리'],
          ['conditional', '조건부 무료'],
          ['paid', '콜키지 유료'],
          ['unknown', '확인 필요'],
        ] as const
      ).map(([k, l]) => (
        <p key={k} className="flex items-center gap-2 py-0.5">
          <span className="grid size-5 place-items-center rounded-full text-[10px] text-white" style={{ background: PIN[k].bg }}>
            {PIN[k].icon}
          </span>
          {l}
        </p>
      ))}
    </div>
  );
}

export function KakaoMap({ items, className }: { items: Restaurant[]; className?: string }) {
  const { selectedId, openDetail } = useStore();
  const box = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlays = useRef<any[]>([]);
  const [err, setErr] = useState<string | null>(KEY ? null : 'nokey');
  const [ready, setReady] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);

  useEffect(() => {
    if (!KEY) return;
    loadSdk()
      .then(() => {
        const k = window.kakao.maps;
        map.current = new k.Map(box.current, { center: new k.LatLng(37.42, 127.07), level: 10 });
        map.current.addControl(new k.ZoomControl(), k.ControlPosition.RIGHT);
        setReady(true);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  const located = items.filter((r) => r.lat != null && r.lng != null);

  useEffect(() => {
    if (!ready) return;
    const k = window.kakao.maps;
    overlays.current.forEach((o) => o.setMap(null));
    overlays.current = [];
    const bounds = new k.LatLngBounds();
    located.forEach((r) => {
      const pos = new k.LatLng(r.lat, r.lng);
      const big = r.id === selectedId || r.id === hoverId;
      const el = document.createElement('div');
      const pin = PIN[r.corkage.status];
      const img = r.images[0]?.thumb;
      el.innerHTML = big
        ? `<button style="display:flex;align-items:center;gap:8px;background:#fff;border:2px solid ${pin.bg};border-radius:12px;padding:4px 10px 4px 4px;box-shadow:0 4px 14px rgba(0,0,0,.25);font:600 13px system-ui;color:#2a1a1f;white-space:nowrap">${
            img ? `<img src="${img}" referrerpolicy="no-referrer" style="width:44px;height:36px;object-fit:cover;border-radius:8px"/>` : `<span style="font-size:22px">${r.emoji}</span>`
          }<span><b style="display:block">${r.name.replace(/</g, '')}</b><span style="color:${pin.bg};font-size:11px">${
            { free: '콜키지 FREE', conditional: '조건부 무료', paid: '콜키지 유료', unknown: '확인 필요' }[r.corkage.status]
          }</span></span></button>`
        : `<button title="${r.name.replace(/"/g, '')}" style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${pin.bg};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:grid;place-items:center"><span style="transform:rotate(45deg);font-size:13px;color:#fff">${pin.icon}</span></button>`;
      el.onclick = () => openDetail(r.id);
      el.onmouseenter = () => setHoverId(r.id);
      el.onmouseleave = () => setHoverId(null);
      const o = new k.CustomOverlay({ position: pos, content: el, yAnchor: big ? 1.3 : 1, zIndex: big ? 10 : 1 });
      o.setMap(map.current);
      overlays.current.push(o);
      bounds.extend(pos);
    });
    if (located.length && !hoverId) map.current.setBounds(bounds, 40, 40, 40, 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, items, selectedId, hoverId]);

  if (err)
    return (
      <div className={cx('relative grid place-items-center rounded-2xl border border-line bg-gradient-to-br from-hero-1 to-hero-2 p-8 text-center', className)}>
        <div className="max-w-sm">
          <MapPinOff className="mx-auto text-brand" size={36} />
          <p className="mt-3 font-bold">{err === 'nokey' ? '지도 키가 아직 연결되지 않았어요' : '지도를 불러오지 못했어요'}</p>
          <p className="mt-1 text-sm text-muted">
            {err === 'nokey'
              ? '환경변수 VITE_KAKAO_JS_KEY 를 넣으면 콜키지 상태별 마커가 표시돼요. 가짜 좌표 지도는 보여주지 않아요.'
              : err}
          </p>
          <p className="mt-3 text-xs text-muted">위치 정보가 있는 곳 {located.length}곳</p>
        </div>
        <MapLegend className="absolute bottom-3 right-3 hidden sm:block" />
      </div>
    );

  return (
    <div className={cx('relative overflow-hidden rounded-2xl border border-line', className)}>
      <div ref={box} className="absolute inset-0" />
      <MapLegend className="absolute bottom-3 right-3 z-10" />
    </div>
  );
}
