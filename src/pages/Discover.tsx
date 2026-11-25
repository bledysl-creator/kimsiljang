import { Inbox, RefreshCw } from 'lucide-react';
import { PageHero } from '@/components/Layout';
import { RestaurantRow } from '@/components/RestaurantCard';
import { Card, Empty } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { rank } from '@/lib/score';

export default function Discover() {
  const { restaurants, prefs, wishes, dataUpdatedAt, realCount } = useStore();
  const real = restaurants.filter((r) => !r.isSample);
  const recent = rank(real, prefs, wishes).sort((a, b) => b.r.firstSeen.localeCompare(a.r.firstSeen));
  const byStatus = (s: string) => real.filter((r) => r.corkage.status === s).length;

  return (
    <div className="space-y-5">
      <PageHero
        title="신규 발견"
        icon={<Inbox className="text-brand" />}
        subtitle="매일 아침 자동 수집이 서울·성남·분당·판교·수원의 가게를 찾고, 네이버 블로그 글로 콜키지 무료 여부를 검증해요."
      />
      <Card className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat k="마지막 수집" v={dataUpdatedAt ?? '아직 없음'} icon />
        <Stat k="실제 수집" v={`${realCount}곳`} />
        <Stat k="무료" v={`${byStatus('free')}곳`} />
        <Stat k="조건부" v={`${byStatus('conditional')}곳`} />
        <Stat k="확인 필요" v={`${byStatus('unknown')}곳`} />
      </Card>
      {recent.length === 0 ? (
        <Empty>
          아직 실제 수집 데이터가 없어요. GitHub Actions 의 <b>수집하고 배포하기</b>가 한 번 돌면 여기에 채워져요.
        </Empty>
      ) : (
        <div className="space-y-3">
          {recent.map((s) => (
            <div key={s.r.id}>
              <p className="mb-1 text-xs text-muted">{s.r.firstSeen} 발견</p>
              <RestaurantRow s={s} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ k, v, icon }: { k: string; v: string; icon?: boolean }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-muted">
        {icon && <RefreshCw size={12} />} {k}
      </p>
      <p className="mt-0.5 text-lg font-extrabold">{v}</p>
    </div>
  );
}
