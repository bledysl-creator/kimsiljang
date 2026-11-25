import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarHeart, Trash2 } from 'lucide-react';
import { PageHero } from '@/components/Layout';
import { Card, Empty, PrimaryButton, inputCls } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { money } from '@/lib/constants';

export default function Visits() {
  const { restaurants, visits, addVisit, removeVisit } = useStore();
  const [params] = useSearchParams();
  const [rid, setRid] = useState(params.get('rid') ?? restaurants[0]?.id ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [cost, setCost] = useState('');
  const [a, setA] = useState(5);
  const [b, setB] = useState(5);
  const [note, setNote] = useState('');

  return (
    <div className="space-y-5">
      <PageHero title="데이트 기록" icon={<CalendarHeart className="text-brand" />} subtitle="함께 간 곳과 그날의 추억을 남겨요." />
      <Card>
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            const r = restaurants.find((x) => x.id === rid);
            if (!r) return;
            addVisit({ restaurantId: r.id, restaurantName: r.name, date, cost: Number(cost) || 0, myRating: a, partnerRating: b, note });
            setCost('');
            setNote('');
          }}
        >
          <Field label="맛집">
            <select className={inputCls} value={rid} onChange={(e) => setRid(e.target.value)}>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="날짜">
            <input type="date" required className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="결제 금액(원)">
            <input type="number" min={0} inputMode="numeric" className={inputCls} value={cost} onChange={(e) => setCost(e.target.value)} placeholder="80000" />
          </Field>
          <Field label="내 평점">
            <Stars v={a} set={setA} />
          </Field>
          <Field label="상대 평점">
            <Stars v={b} set={setB} />
          </Field>
          <Field label="메모">
            <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="오늘의 추억, 가져간 술" maxLength={300} />
          </Field>
          <PrimaryButton className="sm:col-span-2 lg:col-span-3">기록 추가</PrimaryButton>
        </form>
      </Card>
      {visits.length === 0 ? (
        <Empty>아직 기록이 없어요.</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visits.map((v) => (
            <Card key={v.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted">{v.date}</p>
                <h3 className="text-lg font-bold">{v.restaurantName}</h3>
                <p className="text-sm text-muted">
                  {money(v.cost)} · 나 {'♥'.repeat(v.myRating)} · 상대 {'♥'.repeat(v.partnerRating)}
                </p>
                {v.note && <p className="mt-2 text-sm">{v.note}</p>}
              </div>
              <button aria-label="삭제" onClick={() => removeVisit(v.id)} className="rounded-lg p-2 text-muted hover:bg-brand-soft hover:text-brand">
                <Trash2 size={18} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-muted">
      {label}
      {children}
    </label>
  );
}

function Stars({ v, set }: { v: number; set: (n: number) => void }) {
  return (
    <div className="flex gap-1 py-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} aria-label={`${n}점`} onClick={() => set(n)} className={n <= v ? 'text-2xl text-brand' : 'text-2xl text-line'}>
          ♥
        </button>
      ))}
    </div>
  );
}
