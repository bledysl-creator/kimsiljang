/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_KAKAO_JS_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
interface Window {
  // 카카오맵 SDK 는 타입 정의가 없어서 any 로 둬요
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kakao: any;
}
