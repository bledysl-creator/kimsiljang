import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { Card, Empty, Field, PrimaryButton, inputCls } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { money } from '@/lib/constants';
import type { Visit } from '@/types';

const REVISIT: Record<Visit['revisit'], string> = { yes: '또 갈래요', maybe: '글쎄요', no: '한 번이면 충분' };
const todayKST = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

export default function Visits() {
  const { restaurants, visits, addVisit, removeVisit, prefs } = useStore();
  const [params] = useSearchParams();
  const [rid, setRid] = useState(params.get('new') ?? '');
  const [date, setDate] = useState(todayKST());
  const [cost, setCost] = useState('');
  const [a, setA] = useState(5);
  const [b, setB] = useState(5);
  const [revisit, setRevisit] = useState<Visit['revisit']>('yes');
  const [note, setNote] = useState('');
  const [names] = [prefs.people.map((p) => p.name)];
  const sorted = [...restaurants].sort((x, y) => x.name.localeCompare(y.name, 'ko'));

  return (
    <div className="space-y-4">
      <PageHeader title="데이트 기록" subtitle="함께 간 곳, 두 사람 각자의 평가, 지출과 재방문 의사를 남겨요." />
      <Card>
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            const r = restaurants.find((x) => x.id === rid);
            if (!r) return;
            addVisit({ restaurantId: r.id, restaurantName: r.name, date, cost: Number(cost) || 0, myRating: a, partnerRating: b, revisit, note });
            setCost('');
            setNote('');
          }}
        >
          <Field label="식당">
            <select required className={inputCls} value={rid} onChange={(e) => setRid(e.target.value)}>
              <option value="">선택해 주세요</option>
              {sorted.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.area}
                </option>
              ))}
            </select>
          </Field>
          <Field label="날짜">
            <input type="date" required className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="지출 (원)">
            <input type="number" min={0} inputMode="numeric" className={inputCls} value={cost} onChange={(e) => setCost(e.target.value)} placeholder="80000" />
          </Field>
          <Field label={`${names[0]} 평가`}>
            <Stars v={a} set={setA} who={names[0]} />
          </Field>
          <Field label={`${names[1]} 평가`}>
            <Stars v={b} set={setB} who={names[1]} />
          </Field>
          <Field label="재방문 의사">
            <select className={inputCls} value={revisit} onChange={(e) => setRevisit(e.target.value as Visit['revisit'])}>
              {Object.entries(REVISIT).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="메모" className="sm:col-span-2">
            <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="그날의 추억, 가져간 술" maxLength={300} />
          </Field>
          <Field label="사진 (비공개)">
            <span className="flex min-h-11 items-center rounded-xl border border-dashed border-line px-3 text-sm">준비 중 · Supabase 비공개 저장소 연결 후</span>
          </Field>
          <PrimaryButton className="sm:col-span-2 lg:col-span-3">기록 추가</PrimaryButton>
        </form>
      </Card>
      {visits.length === 0 ? (
        <Empty>아직 기록이 없어요. 첫 데이트를 남겨보세요.</Empty>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {visits.map((v) => (
            <li key={v.id}>
              <Card className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted">{v.date}</p>
                  <h3 className="truncate text-lg font-bold">{v.restaurantName}</h3>
                  <p className="text-sm text-muted">
                    {money(v.cost)} · {names[0]} {v.myRating}/5 · {names[1]} {v.partnerRating}/5 · {REVISIT[v.revisit ?? 'maybe']}
                  </p>
                  {v.note && <p className="mt-2 text-sm">{v.note}</p>}
                </div>
                <button aria-label={`${v.restaurantName} 기록 삭제`} onClick={() => removeVisit(v.id)} className="grid size-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-brand-soft hover:text-brand">
                  <Trash2 size={18} aria-hidden />
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stars({ v, set, who }: { v: number; set: (n: number) => void; who: string }) {
  return (
    <div className="flex" role="radiogroup" aria-label={`${who} 평가`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} role="radio" aria-checked={n === v} aria-label={`${n}점`} onClick={() => set(n)} className={n <= v ? 'size-11 text-2xl text-brand' : 'size-11 text-2xl text-line'}>
          ♥
        </button>
      ))}
    </div>
  );
}
