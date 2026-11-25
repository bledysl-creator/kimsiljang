import { PageHeader } from '@/components/Layout';
import { Card, Empty } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { CORKAGE_META, money } from '@/lib/constants';

function Bars({ rows }: { rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <ul className="space-y-2.5">
      {rows.map(([k, v]) => (
        <li key={k}>
          <div className="flex justify-between text-sm">
            <span>{k}</span>
            <span className="font-semibold">{v}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full rounded-full bg-brand" style={{ width: `${(v / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const count = (xs: string[]) => Object.entries(xs.reduce<Record<string, number>>((m, x) => ((m[x] = (m[x] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);

export default function Stats() {
  const { visits, restaurants, prefs } = useStore();
  const real = restaurants.filter((r) => !r.isSample);

  if (visits.length === 0)
    return (
      <div className="space-y-4">
        <PageHeader title="통계·분석" subtitle="데이트 기록이 쌓이면 방문 수, 지출, 선호 음식, 재방문 비율을 보여줘요." />
        <Empty>아직 데이트 기록이 없어요. 기록을 남기면 여기에 통계가 생겨요.</Empty>
        <CollectedCard real={real} />
      </div>
    );

  const total = visits.reduce((s, v) => s + v.cost, 0);
  const avgCost = Math.round(total / visits.length);
  const revisitRate = Math.round((visits.filter((v) => v.revisit === 'yes').length / visits.length) * 100);
  const budget = Math.round((prefs.people[0].budget + prefs.people[1].budget) / 2);
  const visited = visits.map((v) => restaurants.find((r) => r.id === v.restaurantId)).filter((r) => r != null);

  return (
    <div className="space-y-4">
      <PageHeader title="통계·분석" subtitle="우리 데이트 기록을 한눈에 봐요." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['방문 수', `${visits.length}회`],
          ['총 지출', money(total)],
          ['1회 평균 지출', `${money(avgCost)}${budget ? ` (예산 ${money(budget)})` : ''}`],
          ['재방문 의사', `${revisitRate}%`],
        ].map(([k, v]) => (
          <Card key={k} className="!p-4">
            <p className="text-sm text-muted">{k}</p>
            <p className="mt-1 text-lg font-extrabold text-brand sm:text-xl">{v}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-bold">자주 간 음식</h2>
          {visited.length ? <Bars rows={count(visited.map((r) => r.food))} /> : <p className="text-sm text-muted">목록에 없는 식당만 기록돼 있어요.</p>}
        </Card>
        <Card>
          <h2 className="mb-4 font-bold">방문 지역</h2>
          {visited.length ? <Bars rows={count(visited.map((r) => r.region))} /> : <p className="text-sm text-muted">목록에 없는 식당만 기록돼 있어요.</p>}
        </Card>
        <CollectedCard real={real} />
      </div>
    </div>
  );
}

function CollectedCard({ real }: { real: { corkage: { status: keyof typeof CORKAGE_META } }[] }) {
  return (
    <Card>
      <h2 className="mb-4 font-bold">실제 수집 · 콜키지 상태</h2>
      {real.length ? <Bars rows={count(real.map((r) => CORKAGE_META[r.corkage.status].label))} /> : <p className="text-sm text-muted">아직 수집 데이터가 없어요.</p>}
    </Card>
  );
}
