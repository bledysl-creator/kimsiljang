import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Wine } from 'lucide-react';
import { PageHero } from '@/components/Layout';
import { Card, Empty, GhostButton, PrimaryButton, inputCls } from '@/components/ui';
import { Field } from './Visits';
import { useStore } from '@/store/AppStore';
import { useFilters } from '@/store/filters';
import { DRINKS } from '@/lib/constants';
import type { Drink } from '@/types';

const EMOJI: Record<Drink, string> = { 와인: '🍷', 사케: '🍶', 위스키: '🥃', '소주·전통주': '🍶', 기타: '🍾' };

export default function Cellar() {
  const { cellar, addCellar, removeCellar } = useStore();
  const { set, reset } = useFilters();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [type, setType] = useState<Drink>('와인');
  const [note, setNote] = useState('');

  return (
    <div className="space-y-5">
      <PageHero title="술장고" icon={<Wine className="text-brand" />} subtitle="집에 있는 술을 등록해 두고, 어울리는 콜키지 프리 맛집을 찾아요." />
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cellar.map((c) => (
            <Card key={c.id} className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-2xl">{EMOJI[c.type]}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{c.name}</p>
                <p className="truncate text-sm text-muted">
                  {c.type}
                  {c.note && ` · ${c.note}`}
                </p>
              </div>
              <GhostButton
                className="!px-3 !py-1.5 text-sm"
                onClick={() => {
                  reset();
                  set('q', c.type === '기타' ? '' : c.type.split('·')[0]);
                  set('freeOnly', true);
                  nav('/explore');
                }}
              >
                페어링
              </GhostButton>
              <button aria-label="삭제" onClick={() => removeCellar(c.id)} className="rounded-lg p-2 text-muted hover:text-brand">
                <Trash2 size={18} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
