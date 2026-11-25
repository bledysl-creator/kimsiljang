import { useState } from 'react';
import { PageHeader } from '@/components/Layout';
import { RestaurantRow } from '@/components/RestaurantCard';
import { Card, Chip, Field, PrimaryButton, inputCls } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { MIN_COVERAGE_TO_SHOW, WEIGHTS, rank } from '@/lib/score';
import { DRINKS, FOODS, MOODS, REGIONS, isFreeConfirmed } from '@/lib/constants';
import type { PersonPref, Preferences } from '@/types';

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export function PersonEditor({ p, onChange }: { p: PersonPref; onChange(p: PersonPref): void }) {
  return (
    <div className="space-y-3">
      <Field label="이름">
        <input className={inputCls} value={p.name} maxLength={20} onChange={(e) => onChange({ ...p, name: e.target.value })} />
      </Field>
      {(
        [
          ['좋아하는 음식', FOODS, 'foods'],
          ['좋아하는 술', DRINKS, 'drinks'],
          ['분위기', MOODS, 'moods'],
        ] as const
      ).map(([label, opts, key]) => (
        <div key={key}>
          <p className="mb-1.5 text-sm font-medium text-muted">{label}</p>
          <div className="flex flex-wrap gap-1.5">
            {opts.map((o) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <Chip key={o} active={(p[key] as string[]).includes(o)} onClick={() => onChange({ ...p, [key]: toggle(p[key] as any[], o) })}>
                {o}
              </Chip>
            ))}
          </div>
        </div>
      ))}
      <Field label="2인 예산 (원)">
        <input type="number" min={0} step={10000} inputMode="numeric" className={inputCls} value={p.budget || ''} onChange={(e) => onChange({ ...p, budget: Number(e.target.value) })} />
      </Field>
    </div>
  );
}

export function PrefsEditor() {
  const { prefs, savePrefs } = useStore();
  const [p, setP] = useState<Preferences>(prefs);
  const [saved, setSaved] = useState(false);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i}>
            <PersonEditor
              p={p.people[i]}
              onChange={(np) => {
                const people = [...p.people] as Preferences['people'];
                people[i] = np;
                setP({ ...p, people });
                setSaved(false);
              }}
            />
          </Card>
        ))}
      </div>
      <Card className="space-y-2">
        <p className="text-sm font-medium text-muted">선호 지역 (위치 점수)</p>
        <div className="flex flex-wrap gap-1.5">
          {REGIONS.map((r) => (
            <Chip key={r} active={p.regions.includes(r)} onClick={() => setP({ ...p, regions: toggle(p.regions, r) })}>
              {r}
            </Chip>
          ))}
        </div>
      </Card>
      <div className="flex items-center gap-3">
        <PrimaryButton
          onClick={() => {
            savePrefs(p);
            setSaved(true);
          }}
        >
          취향 저장
        </PrimaryButton>
        {saved && <span className="text-sm text-st-free">저장했어요</span>}
      </div>
    </div>
  );
}

export default function Recommend() {
  const { restaurants, prefs } = useStore();
  const [onlyConfirmed, setOnlyConfirmed] = useState(false);
  const pool = restaurants.filter((r) => r.corkage.status !== 'paid' && r.closure.status !== 'suspected' && (!onlyConfirmed || isFreeConfirmed(r.corkage.status)));
  const list = rank(pool, prefs).slice(0, 20);

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI 추천"
        subtitle={`두 사람의 취향 점수를 평균해요. 가중치는 콜키지 ${WEIGHTS.corkage} · 음식 ${WEIGHTS.food} · 분위기 ${WEIGHTS.mood} · 예산 ${WEIGHTS.budget} · 위치 ${WEIGHTS.location}이고, 정보가 없는 항목은 빼고 계산한 뒤 정보 충족률을 같이 보여줘요. 지금은 규칙 기반이고 외부 AI는 쓰지 않아요.`}
      />
      <details className="rounded-[var(--radius-card)] border border-line bg-card p-4">
        <summary className="min-h-11 cursor-pointer content-center font-bold">
          {prefs.people[0].name} · {prefs.people[1].name} 취향 고치기
        </summary>
        <div className="mt-3">
          <PrefsEditor />
        </div>
      </details>
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={onlyConfirmed} onClick={() => setOnlyConfirmed((v) => !v)}>
          무료 확인된 곳만
        </Chip>
        <p className="text-xs text-muted">정보 충족률 {Math.round(MIN_COVERAGE_TO_SHOW * 100)}% 미만이면 적합도 숫자를 숨겨요. 유료 가게는 빼요.</p>
      </div>
      {list.length === 0 ? (
        <Card className="text-center text-muted">추천할 후보가 없어요.</Card>
      ) : (
        <ol className="space-y-3">
          {list.map((s, i) => (
            <li key={s.r.id} className="flex items-start gap-2">
              <span className="mt-4 w-6 shrink-0 text-center text-lg font-extrabold text-brand">{i + 1}</span>
              <div className="min-w-0 flex-1 space-y-1">
                <RestaurantRow s={s} />
                <p className="px-1 text-xs text-muted">
                  <b className="text-fg">근거</b> {s.reasons.join(' · ') || '없음'}
                  {s.caveats.length > 0 && <> · <b className="text-st-cond">주의</b> {s.caveats.join(' · ')}</>}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
