import { supabase } from './supabaseClient'

interface RecClickEvent {
  room_id: number
  room_name: string
  character_id: string
  match_percent: number
  source: string
}

/**
 * 추천 카드 클릭 이벤트 로깅
 * Supabase rec_click_events 테이블에 fire-and-forget으로 저장.
 * 테이블이 없으면 조용히 실패.
 *
 * 테이블 스키마 (Supabase에서 생성 필요):
 * CREATE TABLE rec_click_events (
 *   id bigint generated always as identity primary key,
 *   room_id bigint,
 *   room_name text,
 *   character_id text,
 *   match_percent int,
 *   source text,
 *   created_at timestamptz default now()
 * );
 */
export function logRecClick(event: RecClickEvent) {
  supabase.from('rec_click_events').insert(event).then(({ error }) => {
    if (error && import.meta.env.DEV) {
      console.warn('[analytics] rec_click_events insert failed:', error.message)
    }
  })
}
