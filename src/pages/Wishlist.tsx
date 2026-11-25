import { Heart } from 'lucide-react';
import { PageHero } from '@/components/Layout';
import { RestaurantTile } from '@/components/RestaurantCard';
import { Empty } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { rank } from '@/lib/score';

export default function Wishlist() {
  const { restaurants, wishes, prefs } = useStore();
  const list = rank(restaurants.filter((r) => wishes.has(r.id)), prefs, wishes);
  return (
    <div className="space-y-5">
      <PageHero title="위시리스트" icon={<Heart className="fill-brand text-brand" />} subtitle="하트를 누른 가보고 싶은 곳이에요." />
      {list.length === 0 ? (
        <Empty>아직 담은 곳이 없어요. 카드의 ♡ 를 눌러 담아보세요.</Empty>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {list.map((s) => (
            <RestaurantTile key={s.r.id} s={s} />
          ))}
        </div>
      )}
    </div>
  );
}
