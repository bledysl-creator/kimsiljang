import { CATEGORY_EMOJI, CORKAGE } from '../constants.js';

export function CorkageBadge({ type = 'unknown' }) {
  const c = CORKAGE[type] || CORKAGE.unknown;
  return (
    <span className="badge" style={{ background: c.color }}>
      {c.short}
    </span>
  );
}

export default function PlaceCard({ place, selected, fav, onToggleFav, onClick }) {
  return (
    <li className={`card${selected ? ' card--on' : ''}`} onClick={onClick}>
      <div className="card__top">
        <span className="card__name">
          {CATEGORY_EMOJI[place.category] || '🍶'} {place.name}
        </span>
        <button
          className={`fav${fav ? ' fav--on' : ''}`}
          aria-label="즐겨찾기"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav();
          }}
        >
          {fav ? '★' : '☆'}
        </button>
      </div>
      <div className="card__meta">
        <CorkageBadge type={place.corkage?.type} />
        <span>
          {place.region} · {place.district}
        </span>
      </div>
      {place.corkage?.note && <div className="card__note">{place.corkage.note}</div>}
    </li>
  );
}
