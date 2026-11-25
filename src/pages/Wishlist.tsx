import { PageHeader } from '@/components/Layout';
import { RestaurantRow } from '@/components/RestaurantCard';
import { Empty } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { rank } from '@/lib/score';

export default function Wishlist() {
  const { restaurants, wishes, prefs, storage } = useStore();
  const list = rank(restaurants.filter((r) => wishes.has(r.id)), prefs);
  return (
    <div className="space-y-4">
      <PageHeader title="위시리스트" subtitle={storage === 'supabase' ? '두 사람이 함께 보는 찜 목록이에요.' : '하트를 누른 곳이에요. 지금은 이 브라우저에만 저장돼요 (Supabase 연결 시 두 사람 공유).'} />
      {list.length === 0 ? (
        <Empty>아직 담은 곳이 없어요. 카드의 하트를 눌러 담아보세요.</Empty>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((s) => (
            <RestaurantRow key={s.r.id} s={s} />
          ))}
        </div>
      )}
    </div>
  );
}
