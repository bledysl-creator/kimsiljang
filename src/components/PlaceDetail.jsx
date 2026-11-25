import { CORKAGE, kakaoMapUrl, naverBlogSearchUrl, naverMapUrl } from '../constants.js';
import { CorkageBadge } from './PlaceCard.jsx';

export default function PlaceDetail({ place, reviews, fav, onToggleFav, onClose }) {
  const c = CORKAGE[place.corkage?.type || 'unknown'];
  return (
    <section className="detail">
      <header className="detail__head">
        <h2>{place.name}</h2>
        <div className="detail__actions">
          <button className={`fav${fav ? ' fav--on' : ''}`} onClick={onToggleFav} aria-label="즐겨찾기">
            {fav ? '★' : '☆'}
          </button>
          <button className="close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
      </header>

      <p className="detail__corkage">
        <CorkageBadge type={place.corkage?.type} /> {c.label}
        {place.corkage?.note && ` · ${place.corkage.note}`}
      </p>
      <p className="muted">
        {place.category} · {place.address || `${place.region} ${place.district}`}
        {place.corkage?.checkedAt && ` · ${place.corkage.checkedAt} 확인`}
      </p>
      {place.phone && (
        <p>
          <a href={`tel:${place.phone}`}>📞 {place.phone}</a>
        </p>
      )}
      {place.tags?.length > 0 && (
        <p className="tags">
          {place.tags.map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </p>
      )}
      {place.memo && <p className="memo">📝 {place.memo}</p>}

      <div className="links">
        <a href={naverMapUrl(place)} target="_blank" rel="noreferrer" className="link link--naver">
          네이버 리뷰·메뉴
        </a>
        <a href={kakaoMapUrl(place)} target="_blank" rel="noreferrer" className="link link--kakao">
          카카오맵 리뷰·사진
        </a>
      </div>

      <h3>최근 블로그 후기</h3>
      {reviews?.length ? (
        <ul className="reviews">
          {reviews.map((r) => (
            <li key={r.link}>
              <a href={r.link} target="_blank" rel="noreferrer">
                {r.title}
              </a>
              <p>{r.description}</p>
              <small>
                {r.blogger} · {r.date}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">
          아직 모은 후기가 없어요.{' '}
          <a href={naverBlogSearchUrl(place)} target="_blank" rel="noreferrer">
            네이버 블로그에서 보기
          </a>
        </p>
      )}
    </section>
  );
}
