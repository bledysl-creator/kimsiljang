import { BarChart3 } from 'lucide-react';
import { PageHero } from '@/components/Layout';
import { Card, Empty } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { money } from '@/lib/constants';

function Bars({ rows }: { rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className="space-y-2.5">
      {rows.map(([k, v]) => (
        <div key={k}>
          <div className="flex justify-between text-sm">
            <span>{k}</span>
            <span className="font-semibold">{v}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-gradient-to-r from-brand to-accent" style={{ width: `${(v / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const count = (xs: string[]) => Object.entries(xs.reduce<Record<string, number>>((m, x) => ((m[x] = (m[x] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);

export default function Stats() {
  const { visits, restaurants, wishes, cellar } = useStore();
  const total = visits.reduce((s, v) => s + v.cost, 0);
  const avg = visits.length ? (visits.reduce((s, v) => s + v.myRating + v.partnerRating, 0) / (2 * visits.length)).toFixed(1) : '—';
  const visited = visits.map((v) => restaurants.find((r) => r.id === v.restaurantId)).filter(Boolean);
  const real = restaurants.filter((r) => !r.isSample);

  return (
    <div className="space-y-5">
      <PageHero title="통계·분석" icon={<BarChart3 className="text-brand" />} subtitle="우리 데이트 기록과 수집 현황을 한눈에 봐요." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['방문 횟수', `${visits.length}회`],
          ['총 지출', money(total)],
          ['평균 만족도', `${avg} / 5`],
          ['술장고', `${cellar.length}병`],
        ].map(([k, v]) => (
          <Card key={k} className="!p-4">
            <p className="text-sm text-muted">{k}</p>
            <p className="mt-1 text-xl font-extrabold text-brand sm:text-2xl">{v}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-bold">방문한 음식 종류</h2>
          {visited.length ? <Bars rows={count(visited.map((r) => r!.food))} /> : <p className="text-sm text-muted">방문 기록을 추가하면 보여요.</p>}
        </Card>
        <Card>
          <h2 className="mb-4 font-bold">방문 지역</h2>
          {visited.length ? <Bars rows={count(visited.map((r) => r!.region))} /> : <p className="text-sm text-muted">방문 기록을 추가하면 보여요.</p>}
        </Card>
        <Card>
          <h2 className="mb-4 font-bold">실제 수집 · 콜키지 상태</h2>
          {real.length ? (
            <Bars rows={count(real.map((r) => ({ free: '무료', conditional: '조건부 무료', paid: '유료', unknown: '확인 필요' })[r.corkage.status]))} />
          ) : (
            <Empty>아직 수집 데이터가 없어요.</Empty>
          )}
        </Card>
        <Card>
          <h2 className="mb-4 font-bold">실제 수집 · 지역</h2>
          {real.length ? <Bars rows={count(real.map((r) => r.region))} /> : <Empty>아직 수집 데이터가 없어요.</Empty>}
          <p className="mt-4 text-xs text-muted">위시리스트 {wishes.size}곳</p>
        </Card>
      </div>
    </div>
  );
}
