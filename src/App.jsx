import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES, CORKAGE, REGIONS } from './constants.js';
import { useFavorites } from './useFavorites.js';
import { useInstallPrompt } from './useInstallPrompt.js';
import KakaoMap from './components/KakaoMap.jsx';
import PlaceCard from './components/PlaceCard.jsx';
import PlaceDetail from './components/PlaceDetail.jsx';

const base = import.meta.env.BASE_URL;

export default function App() {
  const [places, setPlaces] = useState([]);
  const [reviews, setReviews] = useState({});
  const [region, setRegion] = useState('전체');
  const [category, setCategory] = useState('전체');
  const [freeOnly, setFreeOnly] = useState(false);
  const [favOnly, setFavOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('map'); // 모바일: map | list
  const { favs, toggle } = useFavorites();
  const { canInstall, showIosHint, install } = useInstallPrompt();
  const [hideIosHint, setHideIosHint] = useState(() => localStorage.getItem('kimsiljang:iosHint') === '1');

  useEffect(() => {
    fetch(`${base}data/places.json`)
      .then((r) => r.json())
      .then((d) => setPlaces(d.places || []));
    fetch(`${base}data/reviews.json`)
      .then((r) => r.json())
      .then((d) => setReviews(d.byPlace || {}))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return places.filter((p) => {
      if (region !== '전체') {
        if (region === '기타 경기' ? ['서울', '성남', '수원'].includes(p.region) : p.region !== region) return false;
      }
      if (category !== '전체' && p.category !== category) return false;
      if (freeOnly && !['free', 'conditional'].includes(p.corkage?.type)) return false;
      if (favOnly && !favs.has(p.id)) return false;
      if (q && !`${p.name} ${p.district} ${p.tags?.join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [places, region, category, freeOnly, favOnly, query, favs]);

  const selected = places.find((p) => p.id === selectedId);
  const select = (id) => setSelectedId(id);

  return (
    <div className="app">
      <header className="top">
        <h1>🍷 김실장 <small>콜키지 프리 지도</small></h1>
        {canInstall && (
          <button className="install" onClick={install}>
            홈 화면에 추가
          </button>
        )}
      </header>

      {showIosHint && !hideIosHint && (
        <div className="hint">
          아이폰은 Safari 아래쪽 <b>공유 버튼 → 홈 화면에 추가</b>로 앱처럼 쓸 수 있어요.
          <button
            onClick={() => {
              localStorage.setItem('kimsiljang:iosHint', '1');
              setHideIosHint(true);
            }}
          >
            닫기
          </button>
        </div>
      )}

      <div className="filters">
        <input
          className="search"
          placeholder="가게 이름, 동네, 태그 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chips">
          {REGIONS.map((r) => (
            <button key={r} className={`chip${region === r ? ' chip--on' : ''}`} onClick={() => setRegion(r)}>
              {r}
            </button>
          ))}
        </div>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button key={c} className={`chip${category === c ? ' chip--on' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="chips">
          <button className={`chip${freeOnly ? ' chip--on' : ''}`} onClick={() => setFreeOnly(!freeOnly)}>
            무료·조건부만
          </button>
          <button className={`chip${favOnly ? ' chip--on' : ''}`} onClick={() => setFavOnly(!favOnly)}>
            ★ 즐겨찾기만
          </button>
        </div>
      </div>

      <nav className="tabs">
        <button className={tab === 'map' ? 'on' : ''} onClick={() => setTab('map')}>
          지도
        </button>
        <button className={tab === 'list' ? 'on' : ''} onClick={() => setTab('list')}>
          목록 ({filtered.length})
        </button>
      </nav>

      <main className={`main main--${tab}`}>
        <aside className="list">
          <p className="count">{filtered.length}곳</p>
          <ul>
            {filtered.map((p) => (
              <PlaceCard
                key={p.id}
                place={p}
                selected={p.id === selectedId}
                fav={favs.has(p.id)}
                onToggleFav={() => toggle(p.id)}
                onClick={() => select(p.id)}
              />
            ))}
          </ul>
          {filtered.length === 0 && <p className="muted">조건에 맞는 곳이 없어요.</p>}
          <div className="legend">
            {Object.entries(CORKAGE).map(([k, v]) => (
              <span key={k}>
                <i style={{ background: v.color }} /> {v.label}
              </span>
            ))}
          </div>
        </aside>
        <KakaoMap places={filtered} selectedId={selectedId} onSelect={select} />
      </main>

      {selected && (
        <div className="sheet">
          <PlaceDetail
            place={selected}
            reviews={reviews[selected.id]}
            fav={favs.has(selected.id)}
            onToggleFav={() => toggle(selected.id)}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  );
}
