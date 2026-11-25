import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Dices } from 'lucide-react';
import { useStore } from '@/store/AppStore';
import { rank } from '@/lib/score';
import { PageHero } from '@/components/Layout';
import { SearchBar } from '@/components/SearchPanel';
import { RestaurantTile } from '@/components/RestaurantCard';
import { Card } from '@/components/ui';

export default function Home() {
  const { restaurants, realCount, wishes, visits, prefs } = useStore();
  const nav = useNavigate();
  const top = rank(
    restaurants.filter((r) => r.corkage.status === 'free' || r.corkage.status === 'conditional'),
    prefs,
    wishes
  ).slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHero
        title="오늘, 우리 어디 갈까?"
        subtitle={
          <>
            서울 · 경기(성남, 분당, 판교, 수원)에서
            <br className="hidden sm:block" /> 좋은 음식과 좋아하는 술을 함께할 수 있는 곳을 찾아보세요.
          </>
        }
      >
        <SearchBar onSubmit={() => nav('/explore')} />
      </PageHero>

      <div className="grid grid-cols-3 gap-3">
        {[
          ['발굴한 맛집', realCount, '실제 수집'],
          ['가보고 싶은 곳', wishes.size, '위시리스트'],
          ['함께 방문', visits.length, '데이트 기록'],
        ].map(([k, v, s]) => (
          <Card key={k} className="!p-4">
            <p className="text-xs text-muted sm:text-sm">{k}</p>
            <p className="mt-1 text-2xl font-extrabold text-brand sm:text-3xl">
              {v}
              <span className="ml-0.5 text-sm font-medium text-muted">곳</span>
            </p>
            <p className="hidden text-xs text-muted sm:block">{s}</p>
          </Card>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-extrabold">이번 주말 추천 맛집</h2>
          <Link to="/recommend" className="text-sm text-muted hover:text-brand">
            적합도순 전체 보기 →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {top.map((s) => (
            <RestaurantTile key={s.r.id} s={s} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Card>
          <h2 className="text-lg font-bold">✧ 우리 둘의 취향</h2>
          <p className="text-xs text-muted">설정에서 바꿀 수 있어요</p>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ['좋아하는 음식', prefs.foods.join(', ') || '미설정'],
              ['좋아하는 술', prefs.drinks.join(', ') || '미설정'],
              ['2인 예산', `${prefs.budget.toLocaleString()}원 이하`],
              ['분위기', prefs.mood],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-line pb-2 last:border-0">
                <span className="text-muted">{k}</span>
                <span className="text-right font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <Link to="/random" className="group">
          <Card className="flex h-full items-center gap-4 bg-gradient-to-br from-brand-soft to-card transition group-hover:shadow-md">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-brand-ink">
              <Dices size={28} />
            </span>
            <div className="flex-1">
              <h2 className="text-lg font-bold">오늘의 데이트 룰렛</h2>
              <p className="text-sm text-muted">고민하지 말고 랜덤으로 골라봐요.</p>
            </div>
            <ChevronRight className="text-muted" />
          </Card>
        </Link>
      </div>
    </div>
  );
}
