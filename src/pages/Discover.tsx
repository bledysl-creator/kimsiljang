import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { RestaurantRow } from '@/components/RestaurantCard';
import { Card, Chip, Empty, ListState } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { rank } from '@/lib/score';
import { CORKAGE_META } from '@/lib/constants';
import type { CorkageStatus } from '@/types';

export default function Discover() {
  const { restaurants, prefs, lastRun, lastSuccessAt, realCount, loading, loadError, reload, verifications } = useStore();
  const [queue, setQueue] = useState(true);
  const real = useMemo(() => restaurants.filter((r) => !r.isSample), [restaurants]);
  const list = useMemo(
    () =>
      rank(queue ? real.filter((r) => !verifications[r.id] && (r.corkage.status === 'unknown' || r.corkage.status === 'disputed')) : real, prefs).sort((a, b) =>
        b.r.firstSeen.localeCompare(a.r.firstSeen)
      ),
    [real, prefs, queue, verifications]
  );
  const count = (s: CorkageStatus) => real.filter((r) => r.corkage.status === s).length;

  return (
    <div className="space-y-4">
      <PageHeader title="신규 발견" subtitle="자동 수집(매일 오전 7시 예약, 정확한 시각은 보장되지 않음)이 찾은 후보예요. 블로그 후기만 있는 곳은 '확인 전'이에요. 전화·방문으로 확인하면 검토 대기에서 빠져요." />
      <Card className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat k="마지막 성공" v={lastSuccessAt ?? '없음'} />
        <Stat k="마지막 실행" v={lastRun ? `${lastRun.status === 'success' ? '성공' : lastRun.status === 'failed' ? '실패' : '건너뜀'} · ${lastRun.finishedAt.slice(0, 10)}` : '기록 없음'} />
        <Stat k="실제 수집" v={`${realCount}곳`} />
        {(['verified_free', 'unknown', 'disputed'] as const).map((s) => (
          <Stat key={s} k={CORKAGE_META[s].label} v={`${count(s)}곳`} />
        ))}
      </Card>
      {lastRun?.status === 'failed' && (
        <p role="alert" className="rounded-xl border border-st-disputed/30 bg-card p-3 text-sm">
          최근 수집이 실패했어요 ({lastRun.error ?? '원인 미상'}). 이전 데이터를 그대로 보여주고 있어요.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Chip active={queue} onClick={() => setQueue(true)}>
          검토 대기
        </Chip>
        <Chip active={!queue} onClick={() => setQueue(false)}>
          전체
        </Chip>
      </div>
      {loading || loadError ? (
        <ListState loading={loading} error={loadError} onRetry={reload} />
      ) : list.length === 0 ? (
        <Empty>{realCount === 0 ? '아직 실제 수집 데이터가 없어요.' : '검토할 후보가 없어요.'}</Empty>
      ) : (
        <ul className="space-y-3">
          {list.slice(0, 60).map((s) => (
            <li key={s.r.id}>
              <p className="mb-1 flex flex-wrap items-center gap-2 px-1 text-xs text-muted">
                {s.r.firstSeen} 수집
                {s.r.evidence[0] && (
                  <a href={s.r.evidence[0].url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline">
                    근거 글 <ExternalLink size={11} aria-hidden />
                  </a>
                )}
              </p>
              <RestaurantRow s={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{k}</p>
      <p className="mt-0.5 font-extrabold">{v}</p>
    </div>
  );
}
