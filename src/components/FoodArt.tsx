// 업종별 대표 일러스트 (직접 그린 SVG). 실제 가게 사진이 아니에요.
// CLAUDE.md 2.4-5: 확인되지 않은 사진을 실제 매장처럼 보여주지 않도록 '일러스트' 표시를 같이 붙여요.
import type { Food } from '@/types';

const WINE = '#7A1E3A';
const GLASS = '#F4EEF0';

/** 와인잔 (레드) */
function WineGlass({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-9 0h18c0 11-4 17-9 17S-9 11-9 0z" fill={GLASS} stroke="#fff" strokeWidth="1.2" />
      <path d="M-8.2 6h16.4c-.8 7-4 11-8.2 11s-7.4-4-8.2-11z" fill={WINE} />
      <rect x="-1" y="17" width="2" height="12" fill={GLASS} />
      <rect x="-7" y="28.5" width="14" height="2.4" rx="1.2" fill={GLASS} />
    </g>
  );
}

/** 사케 도쿠리 + 잔 */
function Sake({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-4 0h8v5c6 4 9 10 9 17 0 7-6 10-13 10s-13-3-13-10c0-7 3-13 9-17z" fill="#F3EBDD" stroke="#D9CDB8" strokeWidth="1" />
      <path d="M-10 18h20" stroke="#3C5A8A" strokeWidth="2.5" />
      <rect x="-5" y="-2" width="10" height="3" rx="1.5" fill="#D9CDB8" />
      <path d="M14 22h12l-2 8h-8z" fill="#F3EBDD" stroke="#D9CDB8" strokeWidth="1" />
    </g>
  );
}

/** 소주 병 + 잔 */
function Soju({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-3" y="0" width="6" height="7" rx="1" fill="#3E8E5C" />
      <path d="M-3 7c-4 3-5 6-5 10v19h16V17c0-4-1-7-5-10z" fill="#5BB27E" opacity=".9" />
      <rect x="-6" y="20" width="12" height="9" rx="1.5" fill="#fff" opacity=".85" />
      <path d="M13 26h9l-1.5 10h-6z" fill="#E9F4EE" stroke="#BFDCCB" strokeWidth="1" />
    </g>
  );
}

function Plate({ cx, cy, r, color = '#FFFDF9' }: { cx: number; cy: number; r: number; color?: string }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy + 2} rx={r} ry={r * 0.92} fill="#000" opacity=".08" />
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <circle cx={cx} cy={cy} r={r * 0.78} fill="none" stroke="#EFE6DC" strokeWidth="1.5" />
    </g>
  );
}

function Western() {
  return (
    <>
      <rect width="120" height="120" fill="#F6E7DA" />
      <Plate cx={50} cy={64} r={36} />
      {/* 스테이크 */}
      <path d="M30 58c2-10 14-14 24-11 9 2 13 9 11 16-2 8-11 11-21 10-10-1-16-7-14-15z" fill="#7B3B22" />
      <path d="M36 55l20 12M40 51l20 12M34 61l16 9" stroke="#4E2212" strokeWidth="2.2" strokeLinecap="round" />
      {/* 파스타 */}
      <g fill="none" stroke="#E8B54A" strokeWidth="2.4" strokeLinecap="round">
        <path d="M58 80c6-6 16-6 20 0s-2 10-8 9-9-6-4-10 13-3 14 3" />
        <path d="M55 84c4-3 9-4 13-1" />
      </g>
      <circle cx="70" cy="81" r="3.2" fill="#C8352E" />
      <circle cx="62" cy="76" r="2.4" fill="#C8352E" />
      <path d="M42 74c3 1 5 0 7-2" stroke="#5E9A4B" strokeWidth="3" strokeLinecap="round" />
      <WineGlass x={98} y={36} s={1.25} />
    </>
  );
}

function Izakaya() {
  return (
    <>
      <rect width="120" height="120" fill="#EFE3D3" />
      {/* 나무 도마 */}
      <rect x="10" y="50" width="76" height="40" rx="6" fill="#C08A55" />
      <rect x="10" y="50" width="76" height="40" rx="6" fill="none" stroke="#A4703F" strokeWidth="1.5" />
      {/* 초밥 */}
      {[18, 36].map((x) => (
        <g key={x}>
          <rect x={x} y="62" width="15" height="10" rx="5" fill="#FFFDF7" />
          <path d={`M${x - 1} 63c4-6 13-6 17 0-5 2-12 2-17 0z`} fill="#F08A4B" />
          <path d={`M${x + 3} 61l3 3M${x + 8} 60l3 3`} stroke="#fff" strokeWidth="1" opacity=".8" />
        </g>
      ))}
      {/* 회 */}
      <path d="M56 60c6-3 14-2 18 3-6 2-12 2-18-3z" fill="#E94F5B" />
      <path d="M58 66c6-3 14-2 18 3-6 2-12 2-18-3z" fill="#F07A84" />
      {/* 튀김 */}
      <g>
        <path d="M20 80c6-6 18-6 24 0-6 4-18 4-24 0z" fill="#E7B24C" />
        <path d="M24 79l3-2M30 78l3-2M36 79l3-2" stroke="#C98D25" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M46 82c5-5 15-5 20 0-5 3-15 3-20 0z" fill="#EDBE5E" />
      </g>
      <path d="M70 79c3 0 5 2 5 4h-8c0-2 1-4 3-4z" fill="#7CB342" />
      <Sake x={98} y={40} />
    </>
  );
}

function Sashimi() {
  return (
    <>
      <rect width="120" height="120" fill="#E4EEF2" />
      <Plate cx={52} cy={62} r={38} color="#FBFCFD" />
      {/* 시소 잎 */}
      <path d="M26 52c8-12 22-10 26-2-8 8-20 8-26 2z" fill="#4E9A54" />
      {/* 연어·흰살 회 */}
      {[0, 1, 2, 3].map((i) => (
        <path key={`s${i}`} d={`M${34 + i * 7} ${58 - i * 2}c6-4 14-3 17 2-6 3-12 3-17-2z`} fill={i % 2 ? '#F4A07A' : '#F07F52'} stroke="#fff" strokeWidth=".8" />
      ))}
      {[0, 1, 2].map((i) => (
        <path key={`w${i}`} d={`M${36 + i * 8} ${74 + i}c6-4 14-3 17 2-6 3-12 3-17-2z`} fill="#F6F1EA" stroke="#E2D8CC" strokeWidth=".8" />
      ))}
      {/* 새우 */}
      <path d="M64 80c8-6 18-2 18 6-4-3-9-2-11 2" fill="none" stroke="#F08A4B" strokeWidth="5" strokeLinecap="round" />
      <circle cx="40" cy="86" r="4" fill="#9CCB5A" />
      <Sake x={100} y={42} />
    </>
  );
}

function Grill() {
  return (
    <>
      <rect width="120" height="120" fill="#EDE0D6" />
      {/* 불판 */}
      <circle cx="50" cy="62" r="38" fill="#3A3436" />
      <circle cx="50" cy="62" r="32" fill="#4A4245" />
      <g stroke="#2B2628" strokeWidth="2">
        {[-20, -10, 0, 10, 20].map((d) => (
          <path key={d} d={`M${30} ${62 + d}h40`} />
        ))}
      </g>
      {/* 고기 */}
      <path d="M28 52c8-6 22-4 26 2-6 6-20 6-26-2z" fill="#B0412E" />
      <path d="M33 53c5-2 11-2 15 0" stroke="#F3D6C8" strokeWidth="1.6" />
      <path d="M46 66c8-6 22-4 26 2-6 6-20 6-26-2z" fill="#9C3626" />
      <path d="M51 67c5-2 11-2 15 0" stroke="#F3D6C8" strokeWidth="1.6" />
      <path d="M30 74c6-4 16-3 19 1-5 4-14 4-19-1z" fill="#C2543C" />
      {/* 마늘·상추 */}
      <ellipse cx="64" cy="50" rx="4" ry="3" fill="#F6EBD0" />
      <ellipse cx="70" cy="80" rx="4" ry="3" fill="#F6EBD0" />
      <path d="M8 98c6-14 22-16 30-6-10 8-22 10-30 6z" fill="#6DB35A" />
      <WineGlass x={100} y={34} s={1.15} />
      <Soju x={100} y={78} />
    </>
  );
}

function Korean() {
  return (
    <>
      <rect width="120" height="120" fill="#F1E6D8" />
      {/* 뚝배기 */}
      <ellipse cx="44" cy="72" rx="28" ry="8" fill="#000" opacity=".08" />
      <path d="M18 58h52c0 14-10 22-26 22S18 72 18 58z" fill="#4B3A33" />
      <ellipse cx="44" cy="58" rx="26" ry="7" fill="#C8422E" />
      <circle cx="36" cy="57" r="3" fill="#F5E7C6" />
      <circle cx="50" cy="59" r="2.5" fill="#6DB35A" />
      <rect x="42" y="54" width="5" height="4" rx="1" fill="#F7F3EA" />
      {/* 밥그릇·반찬 */}
      <path d="M70 84h22c0 7-5 11-11 11s-11-4-11-11z" fill="#E9E2D6" />
      <ellipse cx="81" cy="84" rx="11" ry="4" fill="#FFFFFF" />
      {[
        [20, 92, '#D2482F'],
        [40, 96, '#6DB35A'],
        [58, 92, '#E0A43A'],
      ].map(([x, y, c]) => (
        <g key={String(x)}>
          <ellipse cx={x as number} cy={y as number} rx="9" ry="4" fill="#FBF8F3" />
          <ellipse cx={x as number} cy={(y as number) - 1} rx="6" ry="2.4" fill={c as string} />
        </g>
      ))}
      {/* 막걸리 잔 */}
      <path d="M84 36h22l-3 14H87z" fill="#F7F2E8" stroke="#E2D6C3" strokeWidth="1" />
      <ellipse cx="95" cy="36" rx="11" ry="3" fill="#EEE6D6" />
      <Soju x={98} y={56} />
    </>
  );
}

function Chinese() {
  return (
    <>
      <rect width="120" height="120" fill="#F3E2DB" />
      {/* 찜기 */}
      <ellipse cx="50" cy="66" rx="36" ry="12" fill="#000" opacity=".08" />
      <rect x="16" y="52" width="68" height="16" rx="6" fill="#D9B27A" />
      <path d="M16 58h68" stroke="#B88F55" strokeWidth="1.5" />
      <ellipse cx="50" cy="52" rx="34" ry="10" fill="#E7C894" />
      {/* 만두 */}
      {[30, 50, 70].map((x) => (
        <g key={x}>
          <path d={`M${x - 9} 52c0-8 18-8 18 0-6 3-12 3-18 0z`} fill="#FFF9EE" />
          <path d={`M${x - 5} 47l2 2M${x} 45v3M${x + 5} 47l-2 2`} stroke="#E4D6BE" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      ))}
      {/* 젓가락 */}
      <path d="M14 96l60-14M16 100l60-14" stroke="#7A3B2A" strokeWidth="2.5" strokeLinecap="round" />
      {/* 고량주 잔 */}
      <path d="M90 64h14l-2 10h-10z" fill="#FFFFFF" stroke="#E6D6D0" strokeWidth="1" />
      <rect x="92" y="30" width="10" height="28" rx="3" fill="#C8352E" />
      <rect x="94" y="24" width="6" height="7" rx="1.5" fill="#E7B24C" />
      <rect x="93" y="40" width="8" height="8" rx="1" fill="#F7E1A8" />
    </>
  );
}

function Etc() {
  return (
    <>
      <rect width="120" height="120" fill="#ECE4EE" />
      {/* 치즈 보드 */}
      <rect x="12" y="62" width="70" height="30" rx="8" fill="#B88456" />
      <path d="M22 70l18 6-18 8z" fill="#F4C95D" />
      <circle cx="30" cy="77" r="1.6" fill="#E0AE3D" />
      <rect x="46" y="70" width="14" height="12" rx="2" fill="#F6EED9" />
      <g fill="#6B2D5C">
        <circle cx="68" cy="72" r="3" />
        <circle cx="73" cy="75" r="3" />
        <circle cx="68" cy="78" r="3" />
      </g>
      <path d="M50 86c4-2 10-2 14 0" stroke="#A8563F" strokeWidth="3" strokeLinecap="round" />
      {/* 와인병 */}
      <rect x="92" y="18" width="8" height="14" rx="2" fill="#3B1724" />
      <path d="M90 32h12c4 4 5 8 5 14v40c0 3-2 5-5 5H90c-3 0-5-2-5-5V46c0-6 1-10 5-14z" fill="#5A1F33" />
      <rect x="87" y="54" width="18" height="18" rx="2" fill="#F4EEE6" />
      <WineGlass x={62} y={30} s={1.05} />
    </>
  );
}

const ART: Record<Food, () => React.JSX.Element> = {
  양식: Western,
  '일식·이자카야': Izakaya,
  '회·해산물': Sashimi,
  고기: Grill,
  한식: Korean,
  중식: Chinese,
  기타: Etc,
};

export const FOOD_ART_CAPTION: Record<Food, string> = {
  양식: '스테이크·파스타와 와인',
  '일식·이자카야': '초밥·회·튀김과 사케',
  '회·해산물': '모둠회·새우와 사케',
  고기: '숯불 고기와 와인·소주',
  한식: '찌개·반찬과 막걸리',
  중식: '딤섬과 고량주',
  기타: '치즈 플레이트와 와인',
};

/** 업종별 대표 일러스트. 실제 가게 사진이 아니라는 걸 alt 와 '일러스트' 표시로 알려줘요 */
export function FoodArt({ food, className }: { food: Food; className?: string }) {
  const Art = ART[food] ?? Etc;
  return (
    <svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={`${food} 대표 일러스트 (${FOOD_ART_CAPTION[food] ?? ''}), 실제 가게 사진 아님`}>
      <Art />
    </svg>
  );
}
