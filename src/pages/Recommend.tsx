import { Sparkles } from 'lucide-react';
import { PageHero } from '@/components/Layout';
import { RestaurantRow } from '@/components/RestaurantCard';
import { Chip, Card } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { rank } from '@/lib/score';
import { DRINKS, FOODS } from '@/lib/constants';

export default function Recommend() {
  const { restaurants, prefs, savePrefs, wishes } = useStore();
  const list = rank(restaurants.filter((r) => r.corkage.status !== 'paid'), prefs, wishes).slice(0, 20);
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="space-y-5">
      <PageHero
        title="AI 추천"
        icon={<Sparkles className="text-brand" />}
        subtitle="우리 둘의 취향, 예산, 콜키지 근거(블로그 무료 언급 수)를 합쳐 적합도를 계산해요. 지금은 규칙 기반 점수이고, 외부 AI 호출은 하지 않아요."
      />
      <Card className="space-y-3">
        <p className="text-sm font-bold">좋아하는 음식</p>
        <div className="flex flex-wrap gap-2">
          {FOODS.map((f) => (
            <Chip key={f} active={prefs.foods.includes(f)} onClick={() => savePrefs({ ...prefs, foods: toggle(prefs.foods, f) })}>
              {f}
            </Chip>
          ))}
        </div>
        <p className="pt-2 text-sm font-bold">가져갈 술</p>
        <div className="flex flex-wrap gap-2">
          {DRINKS.map((d) => (
            <Chip key={d} active={prefs.drinks.includes(d)} onClick={() => savePrefs({ ...prefs, drinks: toggle(prefs.drinks, d) })}>
              {d}
            </Chip>
          ))}
        </div>
      </Card>
      <div className="space-y-3">
        {list.map((s, i) => (
          <div key={s.r.id} className="flex items-start gap-3">
            <span className="mt-4 w-6 shrink-0 text-center text-lg font-extrabold text-brand">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <RestaurantRow s={s} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
