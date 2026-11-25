import { useEffect, useRef, useState } from 'react';
import { MapPinOff, RefreshCw } from 'lucide-react';
import type { CorkageStatus, Restaurant } from '@/types';
import { CORKAGE_META, STATUS_HEX } from '@/lib/constants';
import { useStore } from '@/store/AppStore';
import { useFilters } from '@/store/filters';
import { cx } from './ui';

const KEY = import.meta.env.VITE_KAKAO_JS_KEY;
let sdk: Promise<void> | null = null;
function loadSdk() {
  sdk ??= new Promise<void>((resolve, reject) => {
    if (window.kakao?.maps) return window.kakao.maps.load(() => resolve());
    const s = document.createElement('script');
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false&libraries=clusterer`;
    s.onload = () => window.kakao.maps.load(() => resolve());
    s.onerror = () => {
      sdk = null;
      reject(new Error('카카오맵을 불러오지 못했어요. 도메인 등록과 카카오맵 사용 설정을 확인해 주세요.'));
    };
    document.head.appendChild(s);
  });
  return sdk;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** 와인잔 모양 마커 (상태색 + 아이콘) */
function pinHtml(status: CorkageStatus) {
  const c = STATUS_HEX[status];
  return `<svg width="30" height="38" viewBox="0 0 30 38" aria-hidden="true"><path d="M15 37s13-11.6 13-22A13 13 0 0 0 2 15c0 10.4 13 22 13 22z" fill="${c}" stroke="#fff" stroke-width="2"/><path d="M10.5 8h9c0 4.6-1.6 7-4.5 7.4C12.1 15 10.5 12.6 10.5 8z" fill="#fff"/><rect x="14.3" y="15" width="1.4" height="4.5" fill="#fff"/><rect x="12" y="19.2" width="6" height="1.4" rx=".7" fill="#fff"/></svg>`;
}

export function MapLegend({ className }: { className?: string }) {
  return (
    <div className={cx('rounded-xl border border-line bg-card/95 p-3 text-xs shadow-md', className)} aria-label="지도 범례">
      {(Object.keys(CORKAGE_META) as CorkageStatus[]).map((k) => (
        <p key={k} className="flex items-center gap-2 py-0.5">
          <span className="grid size-4 place-items-center rounded-full text-[9px] font-bold text-white" style={{ background: STATUS_HEX[k] }} aria-hidden>
            {CORKAGE_META[k].icon}
          </span>
          콜키지 {CORKAGE_META[k].label}
        </p>
      ))}
    </div>
  );
}

export function KakaoMap({ items, className }: { items: Restaurant[]; className?: string }) {
  const { selectedId, openDetail } = useStore();
  const { filters, set } = useFilters();
  const box = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cluster = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const popup = useRef<any>(null);
  const [err, setErr] = useState<string | null>(KEY ? null : 'nokey');
  const [ready, setReady] = useState(false);
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    if (!KEY) return;
    loadSdk()
      .then(() => {
        const k = window.kakao.maps;
        map.current = new k.Map(box.current, { center: new k.LatLng(37.42, 127.07), level: 10 });
        map.current.addControl(new k.ZoomControl(), k.ControlPosition.RIGHT);
        cluster.current = new k.MarkerClusterer({
          map: map.current,
          averageCenter: true,
          minLevel: 7,
          gridSize: 50,
          styles: [{ width: '44px', height: '44px', background: 'rgba(128,31,60,.92)', borderRadius: '50%', color: '#fff', textAlign: 'center', lineHeight: '44px', fontWeight: '700', border: '3px solid rgba(255,255,255,.85)' }],
        });
        // 사용자가 지도를 움직였을 때만 '이 지역에서 재검색' 버튼을 보여줘요
        k.event.addListener(map.current, 'dragend', () => setMoved(true));
        k.event.addListener(map.current, 'zoom_changed', () => setMoved(true));
        setReady(true);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  // 컨테이너 크기가 바뀌면 relayout (중심 유지)
  useEffect(() => {
    if (!ready || !box.current) return;
    const ro = new ResizeObserver(() => {
      const c = map.current.getCenter();
      map.current.relayout();
      map.current.setCenter(c);
    });
    ro.observe(box.current);
    return () => ro.disconnect();
  }, [ready]);

  const located = items.filter((r) => r.lat != null && r.lng != null);

  // 마커 + 클러스터
  useEffect(() => {
    if (!ready) return;
    const k = window.kakao.maps;
    cluster.current.clear();
    const bounds = new k.LatLngBounds();
    const overlays = located.map((r) => {
      const pos = new k.LatLng(r.lat, r.lng);
      bounds.extend(pos);
      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', `${r.name}, 콜키지 ${CORKAGE_META[r.corkage.status].label}`);
      el.style.cssText = 'background:none;border:0;padding:0;cursor:pointer';
      el.innerHTML = pinHtml(r.corkage.status);
      el.onclick = () => openDetail(r.id);
      return new k.CustomOverlay({ position: pos, content: el, yAnchor: 1, zIndex: 2 });
    });
    cluster.current.addMarkers(overlays);
    // 지도 영역 필터 중에는 화면을 그대로 둬요
    if (located.length && !filters.bounds) {
      map.current.setBounds(bounds, 48, 48, 48, 48);
      setMoved(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, items]);

  // 선택된 가게 팝업 (상호명 + 콜키지 상태)
  useEffect(() => {
    if (!ready) return;
    const k = window.kakao.maps;
    popup.current?.setMap(null);
    const r = located.find((x) => x.id === selectedId);
    if (!r) return;
    const m = CORKAGE_META[r.corkage.status];
    const el = document.createElement('div');
    el.innerHTML = `<div style="background:#fff;border:1px solid #E9DFDA;border-radius:12px;padding:8px 12px;box-shadow:0 4px 14px rgba(41,28,32,.18);font:600 13px system-ui;color:#291C20;white-space:nowrap;margin-bottom:44px"><div>${esc(r.name)}</div><div style="color:${STATUS_HEX[r.corkage.status]};font-size:12px">${m.icon} 콜키지 ${m.label}</div></div>`;
    popup.current = new k.CustomOverlay({ position: new k.LatLng(r.lat, r.lng), content: el, yAnchor: 1, zIndex: 20 });
    popup.current.setMap(map.current);
    if (map.current.getLevel() > 6) map.current.setLevel(6);
    map.current.panTo(new k.LatLng(r.lat, r.lng));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, selectedId]);

  const researchHere = () => {
    const b = map.current.getBounds();
    const sw = b.getSouthWest();
    const ne = b.getNorthEast();
    set('bounds', { sw: [sw.getLat(), sw.getLng()], ne: [ne.getLat(), ne.getLng()] });
    setMoved(false);
  };

  if (err)
    return (
      <div className={cx('relative grid place-items-center rounded-[var(--radius-card)] border border-line bg-card2 p-8 text-center', className)}>
        <div className="max-w-sm">
          <MapPinOff className="mx-auto text-brand" size={36} aria-hidden />
          <p className="mt-3 font-bold">{err === 'nokey' ? '지도 키가 아직 연결되지 않았어요' : '지도를 불러오지 못했어요'}</p>
          <p className="mt-1 text-sm text-muted">{err === 'nokey' ? '카카오 지도 JavaScript 키(VITE_KAKAO_JS_KEY)를 넣으면 실제 지도가 나와요. 그동안은 목록으로 볼 수 있어요.' : err}</p>
          {err !== 'nokey' && (
            <button onClick={() => location.reload()} className="mt-3 inline-flex min-h-11 items-center gap-1 rounded-xl border border-line px-4 text-sm">
              <RefreshCw size={14} aria-hidden /> 다시 시도
            </button>
          )}
          <p className="mt-3 text-xs text-muted">위치 정보가 있는 곳 {located.length}곳</p>
        </div>
      </div>
    );

  return (
    <div className={cx('relative overflow-hidden rounded-[var(--radius-card)] border border-line', className)}>
      <div ref={box} className="absolute inset-0" />
      {moved && (
        <button onClick={researchHere} className="absolute left-1/2 top-3 z-10 inline-flex min-h-11 -translate-x-1/2 items-center gap-1.5 rounded-full border border-line bg-card px-4 text-sm font-semibold shadow-md hover:border-brand">
          <RefreshCw size={15} aria-hidden /> 이 지역에서 재검색
        </button>
      )}
      <MapLegend className="absolute bottom-8 right-3 z-10 hidden sm:block" />
    </div>
  );
}
