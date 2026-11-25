import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Dices } from 'lucide-react';
import { useStore } from '@/store/AppStore';
import { rank } from '@/lib/score';
import { isFreeConfirmed } from '@/lib/constants';
import { PageHeader } from '@/components/Layout';
import { SearchBar } from '@/components/SearchPanel';
import { RestaurantRow } from '@/components/RestaurantCard';
import { Card, Empty, ListState } from '@/components/ui';

export default function Home() {
  const { restaurants, realCount, wishes, visits, prefs, lastSuccessAt, lastRun, loading, loadError, reload } = useStore();
  const nav = useNavigate();
  const confirmed = restaurants.filter((r) => isFreeConfirmed(r.corkage.status));
  const top = rank(confirmed, prefs).slice(0, 4);
  const newCount = restaurants.filter((r) => !r.isSample && lastSuccessAt && r.firstSeen === lastSuccessAt.slice(0, 10)).length;

  return (
    <div className="space-y-5">
      <PageHeader title="오늘, 우리 어디 갈까?" subtitle="서울 · 경기(성남, 분당, 판교, 수원)에서 좋은 음식과 좋아하는 술을 함께할 수 있는 곳을 찾아보세요.">
        <SearchBar onSubmit={() => nav('/explore')} />
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            ['실제 수집', `${realCount}곳`, `신규 ${newCount}곳`],
            ['위시리스트', `${wishes.size}곳`, '두 사람의 찜'],
            ['함께 방문', `${visits.length}회`, '데이트 기록'],
            ['마지막 수집', lastSuccessAt?.slice(0, 10) ?? '없음', lastRun?.status === 'failed' ? '최근 실행 실패 · 이전 데이터 표시' : '네이버 블로그·카카오 장소'],
          ] as const
        ).map(([k, v, s]) => (
          <Card key={k} className="!p-4">
            <p className="text-sm text-muted">{k}</p>
            <p className="mt-1 text-2xl font-extrabold text-brand">{v}</p>
            <p className="text-xs text-muted">{s}</p>
          </Card>
        ))}
      </div>

      <section aria-labelledby="weekend">
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <h2 id="weekend" className="text-xl font-extrabold">
              이번 주말 추천
            </h2>
            <p className="text-xs text-muted">콜키지 무료가 확인된(무료·조건부 무료) 곳만 골랐어요.</p>
          </div>
          <Link to="/recommend" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-brand">
            전체 보기 →
          </Link>
        </div>
        {loading ? (
          <ListState loading error={null} onRetry={reload} />
        ) : top.length === 0 ? (
          <Empty>
            아직 무료가 확인된 곳이 없어요. 자동 수집 결과는 후기 기준이라 '확인 전'이에요.
            <br />
            <Link to="/discover" className="mt-2 inline-flex min-h-11 items-center font-semibold text-brand underline">
              신규 발견에서 검토하기
            </Link>
          </Empty>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {top.map((s) => (
              <RestaurantRow key={s.r.id} s={s} />
            ))}
          </div>
        )}
        {loadError && (
          <div className="mt-3">
            <ListState loading={false} error={loadError} onRetry={reload} />
          </div>
        )}
      </section>

      <Link to="/random" className="group block">
        <Card className="flex items-center gap-4 transition group-hover:border-brand/40">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-white">
            <Dices size={28} aria-hidden />
          </span>
          <div className="flex-1">
            <h2 className="text-lg font-bold">랜덤 데이트</h2>
            <p className="text-sm text-muted">고민될 땐 무료 확인된 곳 중에서 하나 뽑아봐요.</p>
          </div>
          <ChevronRight className="text-muted" aria-hidden />
        </Card>
      </Link>
    </div>
  );
}
