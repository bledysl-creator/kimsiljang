import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Wine } from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { Card, Empty, Field, GhostButton, PrimaryButton, inputCls } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { useFilters } from '@/store/filters';
import { DRINKS } from '@/lib/constants';
import type { Drink, Food } from '@/types';

/** 일반적인 페어링 안내 (가게별 근거가 아니라 일반 상식 수준) */
const PAIRING: Record<Drink, { foods: Food[]; text: string }> = {
  와인: { foods: ['양식', '고기'], text: '레드는 고기·스테이크, 화이트·스파클링은 해산물이나 파스타와 잘 어울려요.' },
  사케: { foods: ['회·해산물', '일식·이자카야'], text: '회, 초밥, 이자카야 안주처럼 담백한 음식과 잘 어울려요.' },
  위스키: { foods: ['고기', '일식·이자카야'], text: '구이류나 짭짤한 안주, 하이볼로는 튀김과 잘 어울려요.' },
  '소주·전통주': { foods: ['한식', '회·해산물'], text: '한식 요리, 전, 회와 잘 어울려요.' },
  맥주: { foods: ['고기', '중식'], text: '튀김, 중식, 바비큐처럼 기름진 음식과 잘 어울려요.' },
  기타: { foods: [], text: '술 종류에 맞춰 직접 골라보세요.' },
};

export default function Cellar() {
  const { cellar, addCellar, removeCellar } = useStore();
  const { set, reset } = useFilters();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [type, setType] = useState<Drink>('와인');
  const [note, setNote] = useState('');

  const findPairing = (d: Drink, food?: Food) => {
    reset();
    set('corkage', 'free_cond');
    if (d !== '기타') set('drink', d);
    if (food) set('food', food);
    nav('/explore');
  };

  return (
    <div className="space-y-4">
      <PageHeader title="술장고" subtitle="집에 있는 술을 등록해 두고, 그 술을 가져갈 수 있는 콜키지 무료 맛집을 찾아요." />
      <Card>
        <form
          className="grid gap-3 sm:grid-cols-[2fr_1fr_2fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            addCellar({ name: name.trim(), type, note });
            setName('');
            setNote('');
          }}
        >
          <Field label="술 이름">
            <input required maxLength={80} className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 샤블리 2021" />
          </Field>
          <Field label="주종">
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as Drink)}>
              {DRINKS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="메모">
            <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="선물받음, 기념일용" />
          </Field>
          <PrimaryButton>등록</PrimaryButton>
        </form>
      </Card>
      {cellar.length === 0 ? (
        <Empty>등록한 술이 없어요.</Empty>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {cellar.map((c) => {
            const p = PAIRING[c.type] ?? PAIRING.기타;
            return (
              <li key={c.id}>
                <Card className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                      <Wine aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{c.name}</p>
                      <p className="truncate text-sm text-muted">
                        {c.type}
                        {c.note && ` · ${c.note}`}
                      </p>
                    </div>
                    <button aria-label={`${c.name} 삭제`} onClick={() => removeCellar(c.id)} className="grid size-11 place-items-center rounded-lg text-muted hover:text-brand">
                      <Trash2 size={18} aria-hidden />
                    </button>
                  </div>
                  <p className="text-sm text-muted">{p.text}</p>
                  <div className="flex flex-wrap gap-2">
                    {p.foods.map((f) => (
                      <GhostButton key={f} className="text-sm" onClick={() => findPairing(c.type, f)}>
                        {f} 맛집 찾기
                      </GhostButton>
                    ))}
                    <GhostButton className="text-sm" onClick={() => findPairing(c.type)}>
                      {c.type} 반입 가능한 곳
                    </GhostButton>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
