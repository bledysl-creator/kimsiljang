import { useEffect, useState } from 'react';

const KEY = 'kimsiljang:favorites';

// 즐겨찾기는 이 기기(브라우저)에만 저장돼요.
export function useFavorites() {
  const [favs, setFavs] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify([...favs]));
  }, [favs]);

  const toggle = (id) =>
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return { favs, toggle };
}
