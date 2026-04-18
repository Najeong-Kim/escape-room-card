import { useState, useEffect, useRef, CSSProperties } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabaseClient'
import { loadSavedCard, SAVED_CARD_CHANGED } from '../../lib/savedCard'
import type { QuizProfile } from '../../lib/traitMap'
import './LandingPage.css'

// ─── Data ────────────────────────────────────────────────────

const CHARACTERS = [
  { id: 'lion',   name: '사자',   tag: '대담한 퍼즐러',  hue: 42,  accent: '#FBBF24', img: '/characters/lion.png' },
  { id: 'tiger',  name: '호랑이', tag: '대담한 장치형',  hue: 18,  accent: '#F97316', img: '/characters/tiger.png' },
  { id: 'wolf',   name: '늑대',   tag: '대담한 균형형',  hue: 260, accent: '#A78BFA', img: '/characters/wolf.png' },
  { id: 'fox',    name: '여우',   tag: '침착한 퍼즐러',  hue: 28,  accent: '#FB923C', img: '/characters/fox.png' },
  { id: 'cat',    name: '고양이', tag: '침착한 장치형',  hue: 195, accent: '#06B6D4', img: '/characters/cat.png' },
  { id: 'eagle',  name: '독수리', tag: '침착한 균형형',  hue: 160, accent: '#10B981', img: '/characters/eagle.png' },
  { id: 'rabbit', name: '토끼',   tag: '신중한 모험가',  hue: 330, accent: '#EC4899', img: '/characters/rabbit.png' },
]

const FEATURES = [
  {
    kbd: 'Q1',
    title: '12문항, 2분이면 끝',
    desc: '심리학 전공자가 짠 진짜 질문. 공포도·장치·스토리 취향까지 잡아내요.',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" style={{ width: 28, height: 28 }}>
        <rect x="6" y="6" width="28" height="28" rx="6" stroke="currentColor" strokeWidth="2"/>
        <path d="M14 17h12M14 22h12M14 27h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    kbd: 'Q2',
    title: '내 취향에 딱 맞는 방 추천',
    desc: '전국 방탈출 데이터와 내 성향을 엮어 인생테마 후보를 골라드려요.',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" style={{ width: 28, height: 28 }}>
        <path d="M20 6 L6 14 L6 28 L20 34 L34 28 L34 14 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <circle cx="20" cy="20" r="4" fill="currentColor"/>
      </svg>
    ),
  },
  {
    kbd: 'Q3',
    title: '플레이 기록이 통계로',
    desc: '성공률, 평균 난이도, 최애 매장까지. 나만 보는 방탈출 일지가 생겨요.',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" style={{ width: 28, height: 28 }}>
        <path d="M8 30 L16 20 L22 24 L32 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="32" cy="10" r="2.5" fill="currentColor"/>
      </svg>
    ),
  },
]

const STATS = [
  { num: '2.4만', label: '생성된 카드' },
  { num: '1,380', label: '등록 테마' },
  { num: '4.8', label: '사용자 평점' },
  { num: '92%', label: '추천 만족도' },
]

const REVIEWS = [
  { who: '준영 · 사자🦁', txt: '"딱 맞춰서 소름. 인생테마 추천 3개 중 2개 예약함"', hue: 42 },
  { who: '하린 · 여우🦊', txt: '"공포 싫어한다 했더니 진짜 공포 방 하나도 안 나옴"', hue: 28 },
  { who: '민지 · 고양이🐱', txt: '"친구들이랑 다 만들어서 카드 맞춰봄. 의외의 조합 발견"', hue: 195 },
  { who: '도현 · 늑대🐺', txt: '"기록 쌓일수록 추천이 정교해짐. 방탕이 진짜 내 취향 앎"', hue: 260 },
  { who: '소연 · 독수리🦅', txt: '"어떤 방 갈지 30분씩 고민했는데 이제 방탕이 먼저 알려줌"', hue: 160 },
]

const ROOMS = [
  { brand: '키이스케이프', name: '필사의 탐구',  genre: '추리',    diff: 4.6, match: 97, hue: 195 },
  { brand: '제로월드',     name: '타임머신',     genre: 'SF/장치', diff: 4.2, match: 94, hue: 42  },
  { brand: '코드케이',     name: '은밀한 서재',  genre: '잠입',    diff: 3.8, match: 91, hue: 260 },
]

const FAQ = [
  { q: '방탕이 뭐예요?',              a: '"방탈출 탕진하기" 줄임말. 방탈출에 푹 빠진 사람들을 위한 성향 카드 서비스예요. 12문항에 답하면 7가지 동물 중 내 캐릭터가 나와요.' },
  { q: '무료로 쓸 수 있나요?',        a: '네, 핵심 기능은 전부 무료예요. 카드 생성도, 방 추천도, 플레이 기록도요.' },
  { q: '개인정보는 어떻게 쓰이나요?', a: '닉네임과 플레이 기록만 저장해요. 카드를 공유할 때만 외부에 공개되고, 언제든 삭제할 수 있어요.' },
  { q: '기록 없이도 추천받을 수 있나요?', a: '처음엔 12문항 기반으로 추천드려요. 기록이 쌓일수록 훨씬 더 정교해지고요.' },
  { q: '공유는 어떻게 하나요?',       a: '카드 이미지로 저장하거나 링크로 공유하면 돼요. 인스타 스토리 비율로도 저장돼요.' },
]

// ─── Button helpers ──────────────────────────────────────────

function btnPrimary(small = false): CSSProperties {
  return {
    background: 'var(--brand)',
    color: 'white',
    border: 'none',
    padding: small ? '8px 16px' : '16px 28px',
    borderRadius: 10,
    fontWeight: 800,
    fontSize: small ? 13 : 16,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 8px 24px -8px rgba(20,184,166,.55), inset 0 1px 0 rgba(255,255,255,.22)',
    transition: 'transform .15s ease, box-shadow .2s ease',
  }
}

function btnGhost(small = false): CSSProperties {
  return {
    background: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    padding: small ? '7px 15px' : '15px 26px',
    borderRadius: 10,
    fontWeight: 600,
    fontSize: small ? 13 : 15,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'border-color .2s ease, background .2s ease',
  }
}

// ─── Logo ────────────────────────────────────────────────────

function LpLogo({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/brand-logo.svg"
      alt="방탕"
      width={size}
      height={size}
      draggable={false}
      style={{ filter: 'drop-shadow(0 0 18px rgba(20,184,166,.35))' }}
    />
  )
}

// ─── Nav ─────────────────────────────────────────────────────

function Nav({ onCta }: { onCta: () => void }) {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'color-mix(in srgb, var(--bg) 88%, transparent)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div className="lp-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LpLogo size={32} />
          <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.02em' }}>방탕</span>
          <span className="lp-mono" style={{ fontSize: 10, color: 'var(--text-muted)', padding: '2px 6px', border: '1px solid var(--border)', borderRadius: 4, marginLeft: 4 }}>v2.0</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 14, fontWeight: 500 }}>
          <a href="#characters" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="lp-hide-sm">캐릭터</a>
          <a href="#features"   style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="lp-hide-sm">기능</a>
          <a href="#rooms"      style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="lp-hide-sm">방 추천</a>
          <a href="#faq"        style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="lp-hide-sm">FAQ</a>
          <button style={btnPrimary(true)} onClick={onCta}>카드 만들기 →</button>
        </div>
      </div>
    </nav>
  )
}

// ─── Avatar stack ────────────────────────────────────────────

function AvatarStack() {
  return (
    <div style={{ display: 'flex' }}>
      {CHARACTERS.slice(0, 4).map((c, i) => (
        <div key={c.id} style={{
          width: 30, height: 30, borderRadius: '50%',
          background: `color-mix(in srgb, ${c.accent} 30%, var(--surface))`,
          border: '2px solid var(--bg)',
          marginLeft: i === 0 ? 0 : -8,
          overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} />
        </div>
      ))}
    </div>
  )
}

// ─── Grid dots ───────────────────────────────────────────────

function GridDots() {
  return (
    <div className="lp-dotted-bg" style={{
      position: 'absolute', inset: 0,
      maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)',
      WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)',
    }} />
  )
}

// ─── Sample Card ─────────────────────────────────────────────

type Char = typeof CHARACTERS[number]

function SampleCard({ char, style }: { char: Char; style?: CSSProperties }) {
  return (
    <div style={{
      position: 'relative',
      background: `linear-gradient(160deg, color-mix(in srgb, ${char.accent} 24%, var(--surface)) 0%, var(--surface) 70%)`,
      border: `1px solid color-mix(in srgb, ${char.accent} 30%, var(--border))`,
      borderRadius: 20,
      padding: 16,
      width: '100%', height: '100%',
      boxShadow: `0 24px 60px -12px rgba(0,0,0,.18), 0 0 40px -12px ${char.accent}55`,
      display: 'flex', flexDirection: 'column',
      ...style,
    }} className="lp-noise">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="lp-mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '.1em' }}>BANGTANG · 001</div>
        <LpLogo size={22} />
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={char.img} alt="" style={{ width: '82%', height: '82%', objectFit: 'contain', filter: `drop-shadow(0 12px 24px ${char.accent}66)` }} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, letterSpacing: '.05em' }}>{char.tag}</div>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em' }}>{char.name}</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < 4 ? char.accent : 'var(--border)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function SampleCardBack({ char }: { char: Char }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      padding: 18,
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span className="lp-mono" style={{ color: 'var(--text-muted)' }}>PROFILE</span>
        <span style={{ color: char.accent, fontWeight: 700 }}>{char.name}형</span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {[
          { k: '공포도', v: 72 },
          { k: '퍼즐',   v: 88 },
          { k: '장치',   v: 54 },
          { k: '스토리', v: 91 },
          { k: '활동성', v: 42 },
        ].map(({ k, v }) => (
          <div key={k}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>{k}</span>
              <span className="lp-mono" style={{ color: 'var(--text)' }}>{v}</span>
            </div>
            <div style={{ height: 5, background: 'var(--surface-muted)', borderRadius: 99 }}>
              <div style={{ height: '100%', width: v + '%', background: `linear-gradient(90deg, var(--brand), ${char.accent})`, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 'auto', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }} className="lp-mono">
        TAP TO FLIP BACK
      </div>
    </div>
  )
}

// ─── Floating card stack ─────────────────────────────────────

function FloatingCardStack({ big = false }: { big?: boolean }) {
  const [flipped, setFlipped] = useState(false)
  const w = big ? 280 : 240
  const h = big ? 400 : 340

  const bg   = CHARACTERS[0] // lion
  const mid  = CHARACTERS[5] // eagle
  const front = CHARACTERS[2] // wolf

  return (
    <div style={{ position: 'relative', width: w + 80, height: h + 60 }}>
      {/* back card */}
      <SampleCard char={bg} style={{
        position: 'absolute', left: 0, top: 30,
        transform: 'rotate(-8deg)', width: w * 0.82, height: h * 0.82,
      }} />
      {/* middle card */}
      <SampleCard char={mid} style={{
        position: 'absolute', right: 0, top: 10,
        transform: 'rotate(7deg)', width: w * 0.82, height: h * 0.82,
      }} />
      {/* front card — flippable */}
      <div
        className="lp-flip-scene lp-floaty"
        style={{
          position: 'absolute', left: '50%', top: 0,
          transform: 'translateX(-50%)', width: w, height: h, cursor: 'pointer',
        }}
        onClick={() => setFlipped(f => !f)}
      >
        <div className={`lp-flip-inner${flipped ? ' flipped' : ''}`}>
          <div className="lp-flip-face"><SampleCard char={front} /></div>
          <div className="lp-flip-face lp-flip-back"><SampleCardBack char={front} /></div>
        </div>
      </div>
      <div style={{
        position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
        fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap',
      }} className="lp-mono">
        click to flip ↻
      </div>
    </div>
  )
}

// ─── Hero — Balanced / Split ─────────────────────────────────

function HeroBalanced({ parallaxY, onCta, onBrowse, loggedIn = false }: { parallaxY: number; onCta: () => void; onBrowse: () => void; loggedIn?: boolean }) {
  return (
    <section style={{ position: 'relative', padding: '60px 0 90px', overflow: 'hidden' }}>
      <GridDots />
      <div className="lp-container" style={{ position: 'relative' }}>
        <div className="lp-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 56, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
              {loggedIn
                ? <span className="lp-sticker" style={{ background: 'var(--brand)', color: '#fff', border: 'none' }}>✓ 로그인 됨</span>
                : <span className="lp-sticker" style={{ background: 'var(--accent)', color: '#1a1405', border: 'none' }}>✦ NEW</span>
              }
              <span className="lp-sticker">무료 · 2분</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(2.6rem, 5.6vw, 5.2rem)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 0.98,
              margin: 0,
            }} className="lp-break-keep">
              {loggedIn ? (
                <>어서 와요!<br />카드 만들고<br />
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    탕진하자.
                    <svg style={{ position: 'absolute', left: '-6%', bottom: '-8%', width: '112%', height: 28 }} viewBox="0 0 200 30" fill="none" preserveAspectRatio="none">
                      <path d="M4 18 C 40 6, 80 6, 120 14 S 180 22, 196 14" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                    </svg>
                  </span>
                </>
              ) : (
                <>방탈출 <span className="lp-handwrite" style={{ color: 'var(--accent)', fontWeight: 700 }}>탕진</span>러를<br />
                위한 성향<br />
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  카드.
                  <svg style={{ position: 'absolute', left: '-6%', bottom: '-8%', width: '112%', height: 28 }} viewBox="0 0 200 30" fill="none" preserveAspectRatio="none">
                    <path d="M4 18 C 40 6, 80 6, 120 14 S 180 22, 196 14" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                  </svg>
                </span>
                </>
              )}
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 440, marginTop: 28, lineHeight: 1.65 }} className="lp-break-keep">
              {loggedIn
                ? '12문항에 답하면 7가지 동물 중 내 캐릭터가 결정돼요. 카드를 만들고 취향에 딱 맞는 방을 찾아봐요.'
                : '12문항만 답하세요. 7가지 동물 중 나의 방탈출 캐릭터가 나오고, 내 취향에 딱 맞는 방까지 골라드려요.'
              }
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
              <button style={btnPrimary()} onClick={onCta}>{loggedIn ? '카드 만들기 →' : '내 카드 만들기 →'}</button>
              <button style={btnGhost()} onClick={onBrowse}>방 둘러보기</button>
            </div>
            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 13 }}>
              <AvatarStack />
              <span><b style={{ color: 'var(--text)' }}>2만 4천 명</b>이 이미 카드를 받았어요</span>
            </div>
          </div>
          <div style={{ position: 'relative', height: 520, transform: `translateY(${parallaxY * 0.15}px)` }}>
            <FloatingCardStack big />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Section Header ──────────────────────────────────────────

function SectionHeader({ eyebrow, title, sub, align = 'center' }: {
  eyebrow: string
  title: React.ReactNode
  sub: string
  align?: 'center' | 'left'
}) {
  return (
    <div style={{ textAlign: align, maxWidth: align === 'center' ? 620 : 'none', margin: align === 'center' ? '0 auto' : '0' }}>
      <div className="lp-mono" style={{ fontSize: 11, color: 'var(--brand)', letterSpacing: '.2em', marginBottom: 14 }}>— {eyebrow}</div>
      <h2 style={{ fontSize: 'clamp(2rem, 4.2vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0 }} className="lp-break-keep">{title}</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: 14, lineHeight: 1.6, fontSize: 16 }} className="lp-break-keep">{sub}</p>
    </div>
  )
}

// ─── Char Orbit ──────────────────────────────────────────────

function CharOrbit({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const radius = 180
  return (
    <div style={{ marginTop: 48, position: 'relative', height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer ring */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: radius * 2 + 10, height: radius * 2 + 10, borderRadius: '50%',
          border: '1px dashed color-mix(in srgb, var(--text) 12%, transparent)',
          animation: 'lp-slow-rotate 60s linear infinite',
        }} />
      </div>
      {/* Inner ring */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: radius * 1.4, height: radius * 1.4, borderRadius: '50%',
          border: '1px dashed color-mix(in srgb, var(--text) 8%, transparent)',
          animation: 'lp-slow-rotate-rev 40s linear infinite',
        }} />
      </div>

      {/* Center — selected character */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        {CHARACTERS.filter(c => c.id === selected).map(c => (
          <div key={c.id}>
            <div className="lp-floaty" style={{
              width: 180, height: 180, margin: '0 auto',
              background: `radial-gradient(circle, color-mix(in srgb, ${c.accent} 28%, transparent), transparent 70%)`,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            }}>
              <img src={c.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: `drop-shadow(0 10px 28px ${c.accent}88)` }} />
            </div>
            <div style={{ fontWeight: 900, fontSize: 22, marginTop: 8 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.tag}</div>
          </div>
        ))}
      </div>

      {/* Orbit nodes */}
      {CHARACTERS.filter(c => c.id !== selected).map((c, idx) => {
        const angle = (idx / 6) * Math.PI * 2 - Math.PI / 2
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            style={{
              position: 'absolute',
              left: `calc(50% + ${x}px - 40px)`,
              top: `calc(50% + ${y}px - 40px)`,
              width: 80, height: 80, borderRadius: '50%',
              background: `color-mix(in srgb, ${c.accent} 22%, var(--surface))`,
              border: `1px solid color-mix(in srgb, ${c.accent} 40%, var(--border))`,
              cursor: 'pointer',
              padding: 0, overflow: 'hidden',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              transition: 'transform .2s ease, box-shadow .2s ease',
              zIndex: 3,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.15)'
              e.currentTarget.style.boxShadow = `0 12px 32px -8px ${c.accent}99`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <img src={c.img} alt={c.name} style={{ width: '88%', height: '88%', objectFit: 'contain' }} />
          </button>
        )
      })}
    </div>
  )
}

// ─── Char Detail Panel ───────────────────────────────────────

function CharDetailPanel({ char }: { char: Char }) {
  return (
    <div style={{
      marginTop: 32,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      padding: 24,
      display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center',
    }} className="lp-char-detail">
      <div>
        <div className="lp-mono" style={{ fontSize: 11, color: char.accent, letterSpacing: '.15em', marginBottom: 6 }}>CHARACTER · {char.id.toUpperCase()}</div>
        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>{char.name} — {char.tag}</div>
        <p style={{ color: 'var(--text-muted)', margin: '10px 0 18px', lineHeight: 1.65, maxWidth: 560 }} className="lp-break-keep">
          방탈출에서 나만의 방식으로 문제를 풀어나가는 타입. 공포도나 난이도와 상관없이 끝까지 밀고 가는 편이에요. 인생테마 후보는 주로 내 성향에 딱 맞는 장르에서 나와요.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['공포 5/5', '퍼즐형 3/5', '활동성 4/5', '스토리 5/5'].map(t => (
            <span key={t} className="lp-sticker" style={{ background: 'var(--surface-muted)' }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{
        width: 140, height: 140, borderRadius: 20,
        background: `radial-gradient(circle, color-mix(in srgb, ${char.accent} 26%, transparent), transparent 70%)`,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}>
        <img src={char.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
    </div>
  )
}

// ─── Character Showcase ──────────────────────────────────────

function CharacterShowcase() {
  const [selected, setSelected] = useState('wolf')
  const char = CHARACTERS.find(c => c.id === selected)!

  return (
    <section id="characters" style={{ padding: '100px 0', position: 'relative' }}>
      <div className="lp-container">
        <SectionHeader
          eyebrow="7 CHARACTERS"
          title={<>당신은 어떤 <span style={{ color: 'var(--accent)' }}>동물</span>인가요?</>}
          sub="방탈출 성향에 따라 7가지 동물 캐릭터로 분류해요. 내 동물을 찾으면 딱 맞는 방을 추천해드려요."
        />
        <CharOrbit selected={selected} onSelect={setSelected} />
        <CharDetailPanel char={char} />
      </div>
    </section>
  )
}

// ─── Card Sample Preview ─────────────────────────────────────

function CardSamplePreview() {
  const [idx, setIdx] = useState(2)
  const [flipped, setFlipped] = useState(false)
  const char = CHARACTERS[idx]

  return (
    <section style={{ padding: '100px 0', position: 'relative', background: 'var(--surface-muted)' }}>
      <div className="lp-container">
        <SectionHeader
          eyebrow="SAMPLE CARD"
          title={<>이렇게 생긴 <span style={{ color: 'var(--brand)' }}>카드</span>가 나와요</>}
          sub="카드를 클릭해서 뒤집어보세요. 앞면엔 캐릭터, 뒷면엔 세부 취향 점수가 담겨요."
        />
        <div className="lp-sample-grid" style={{ marginTop: 56, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              className="lp-flip-scene"
              style={{ width: 320, height: 460, cursor: 'pointer' }}
              onClick={() => setFlipped(f => !f)}
            >
              <div className={`lp-flip-inner${flipped ? ' flipped' : ''}`}>
                <div className="lp-flip-face"><SampleCard char={char} /></div>
                <div className="lp-flip-face lp-flip-back"><SampleCardBack char={char} /></div>
              </div>
            </div>
          </div>
          <div>
            <div className="lp-mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '.15em', marginBottom: 14 }}>PREVIEW DIFFERENT CHARACTERS</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
              {CHARACTERS.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => { setIdx(i); setFlipped(false) }}
                  style={{
                    padding: '10px 14px', borderRadius: 10,
                    background: idx === i ? `color-mix(in srgb, ${c.accent} 18%, var(--surface))` : 'var(--surface)',
                    border: `1px solid ${idx === i ? c.accent : 'var(--border)'}`,
                    color: 'var(--text)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                    transition: 'all .15s ease',
                  }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: `color-mix(in srgb, ${c.accent} 35%, transparent)`, display: 'inline-flex', overflow: 'hidden' }}>
                    <img src={c.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </span>
                  {c.name}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              {[
                { ic: '✦', t: '캐릭터 + 태그라인',  d: '나에게 딱 맞는 호칭과 함께 동물 일러스트가 카드에 담겨요.' },
                { ic: '▨', t: '5축 취향 레이더',    d: '공포, 퍼즐, 장치, 스토리, 활동성을 한눈에. 뒷면에서 확인하세요.' },
                { ic: '↗', t: '공유 링크 · PNG 저장', d: '인스타 스토리 비율로 바로 저장. 친구 카드랑 맞춰보기도 가능.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'color-mix(in srgb, var(--brand) 14%, transparent)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, flexShrink: 0 }}>{item.ic}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{item.t}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>{item.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Features ────────────────────────────────────────────────

function Features() {
  return (
    <section id="features" style={{ padding: '100px 0' }}>
      <div className="lp-container">
        <SectionHeader
          eyebrow="WHAT YOU GET"
          title={<>방탕이 <span style={{ color: 'var(--brand)' }}>해주는</span> 일</>}
          sub="재미로 끝나지 않아요. 방탈출 취향을 데이터로 쌓고, 써먹을 수 있게 돌려드려요."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginTop: 56 }}>
          {FEATURES.map((f, i) => (
            <div key={i}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 20, padding: 28, position: 'relative',
                transition: 'transform .2s ease, border-color .2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--brand) 50%, var(--border))'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'color-mix(in srgb, var(--brand) 12%, transparent)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {f.icon}
                </div>
                <span className="lp-mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '.15em' }}>{f.kbd}</span>
              </div>
              <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.01em' }} className="lp-break-keep">{f.title}</div>
              <div style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14, lineHeight: 1.6 }} className="lp-break-keep">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Stats + Reviews ─────────────────────────────────────────

function StatsAndReviews() {
  return (
    <section style={{ padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
      <div className="lp-container">
        <div style={{
          background: 'linear-gradient(140deg, color-mix(in srgb, var(--brand) 14%, var(--surface)), var(--surface))',
          border: '1px solid color-mix(in srgb, var(--brand) 28%, var(--border))',
          borderRadius: 24, padding: '40px 32px',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24,
        }} className="lp-stats-grid">
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }} className="lp-stat-cell">
              <div style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 900, letterSpacing: '-0.03em', background: 'linear-gradient(180deg, var(--text), color-mix(in srgb, var(--text) 70%, transparent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {s.num}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.15em', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 56, overflow: 'hidden', position: 'relative' }}>
        <div className="lp-marquee-track" style={{ display: 'flex', gap: 16, width: 'max-content' }}>
          {[...REVIEWS, ...REVIEWS].map((r, i) => (
            <div key={i} style={{
              flex: '0 0 320px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 16, padding: 20,
            }}>
              <div className="lp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.who}</div>
              <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.55, color: 'var(--text)' }}>{r.txt}</div>
              <div style={{ display: 'flex', gap: 2, marginTop: 10 }}>
                {[...Array(5)].map((_, j) => (
                  <span key={j} style={{ color: 'var(--accent)', fontSize: 13 }}>★</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 80, background: 'linear-gradient(90deg, var(--bg), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 80, background: 'linear-gradient(-90deg, var(--bg), transparent)', pointerEvents: 'none' }} />
      </div>
    </section>
  )
}

// ─── Room Preview ────────────────────────────────────────────

function RoomPreview({ onBrowse }: { onBrowse: () => void }) {
  return (
    <section id="rooms" style={{ padding: '100px 0' }}>
      <div className="lp-container">
        <SectionHeader
          eyebrow="ROOM RECOMMENDATIONS"
          title={<>내 취향이면, 이런 <span style={{ color: 'var(--accent)' }}>방</span></>}
          sub="카드를 받으면 전국 1,380개 테마 중 내 성향과 93% 이상 맞는 방을 골라드려요. 아래는 '늑대 🐺' 카드 기준 예시."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 48 }}>
          {ROOMS.map((r, i) => (
            <div key={i}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', transition: 'transform .2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
            >
              <div style={{
                aspectRatio: '4 / 3',
                background: `linear-gradient(135deg, hsl(${r.hue}, 50%, 35%), hsl(${r.hue + 40}, 40%, 20%))`,
                position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 16,
              }} className="lp-noise">
                <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg, rgba(0,0,0,0) 0 16px, rgba(0,0,0,.1) 16px 17px)' }} />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div className="lp-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', letterSpacing: '.15em' }}>POSTER · {String(i + 1).padStart(2, '0')}</div>
                </div>
                <div style={{ position: 'absolute', top: 14, right: 14, padding: '6px 10px', borderRadius: 999, background: 'var(--accent)', color: '#1a1405', fontSize: 12, fontWeight: 900 }}>
                  {r.match}% match
                </div>
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.brand}</div>
                <div style={{ fontSize: 19, fontWeight: 900, marginTop: 2 }}>{r.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="lp-sticker">{r.genre}</span>
                    <span className="lp-sticker" style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}>난이도 {r.diff}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--brand)' }}>→</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button style={btnGhost()} onClick={onBrowse}>전체 방 둘러보기 →</button>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────

function FaqSection() {
  return (
    <section id="faq" style={{ padding: '100px 0' }}>
      <div className="lp-container" style={{ maxWidth: 780 }}>
        <SectionHeader
          eyebrow="FAQ"
          title={<>자주 묻는 <span style={{ color: 'var(--brand)' }}>질문</span></>}
          sub="더 궁금한 게 있으면 hi@bangtang.kr 로 보내주세요."
          align="left"
        />
        <div style={{ marginTop: 40, display: 'grid', gap: 10 }}>
          {FAQ.map((f, i) => (
            <details key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', cursor: 'pointer' }}>
              <summary style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', listStyle: 'none', fontWeight: 700, fontSize: 16 }} className="lp-break-keep">
                <span>{f.q}</span>
                <span className="lp-faq-caret" style={{ color: 'var(--brand)', fontSize: 20, fontWeight: 900 }}>+</span>
              </summary>
              <p style={{ color: 'var(--text-muted)', margin: '14px 0 0', lineHeight: 1.65 }} className="lp-break-keep">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Bottom CTA ──────────────────────────────────────────────

function BottomCta({ onCta, onBrowse }: { onCta: () => void; onBrowse: () => void }) {
  return (
    <section style={{ padding: '60px 0 100px' }}>
      <div className="lp-container">
        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--brand) 20%, var(--surface)), color-mix(in srgb, var(--accent) 14%, var(--surface)))',
          border: '1px solid color-mix(in srgb, var(--brand) 30%, transparent)',
          borderRadius: 28, padding: '80px 40px', textAlign: 'center', overflow: 'hidden',
        }}>
          <div className="lp-halftone" style={{ position: 'absolute', inset: 0, color: 'color-mix(in srgb, var(--text) 6%, transparent)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div className="lp-mono" style={{ fontSize: 12, color: 'var(--brand)', letterSpacing: '.2em', marginBottom: 16 }}>무료 · 2분 · 카드는 영원히</div>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.6rem)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1, margin: 0, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }} className="lp-break-keep">
              지금 바로 내 방탈출 카드를 받아보세요
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 520, margin: '18px auto 0', lineHeight: 1.6 }} className="lp-break-keep">
              12문항이면 충분해요. 카드 받고, 친구랑 비교하고, 이번 주말 방탈출은 방탕이 골라줄게요.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
              <button style={{ ...btnPrimary(), padding: '18px 36px', fontSize: 17 }} onClick={onCta}>카드 만들기 →</button>
              <button style={btnGhost()} onClick={onBrowse}>먼저 방 둘러보기</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────

function LpFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 0' }}>
      <div className="lp-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LpLogo size={26} />
          <span style={{ fontWeight: 800, fontSize: 16 }}>방탕</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>© 2026 Bangtang. All rights reserved.</span>
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
          <Link to="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>개인정보처리방침</Link>
          <Link to="/terms"   style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>이용약관</Link>
          <a href="mailto:hi@bangtang.kr" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>hi@bangtang.kr</a>
        </div>
      </div>
    </footer>
  )
}

// ─── Return User Page (has card) ────────────────────────────

const CHAR_FOR_ID: Record<string, typeof CHARACTERS[number]> = Object.fromEntries(CHARACTERS.map(c => [c.id, c]))

const CHARACTER_BY_TYPE: Record<string, string> = {
  brave_puzzle:   'lion',
  brave_device:   'tiger',
  brave_balanced: 'wolf',
  neutral_puzzle: 'fox',
  neutral_device: 'cat',
  neutral_balanced: 'eagle',
  scared_any:     'rabbit',
}

function ReturnUserPage({ card, onBrowse, onRedo }: { card: QuizProfile; onBrowse: () => void; onRedo: () => void }) {
  const charId = CHARACTER_BY_TYPE[card.characterId] ?? 'wolf'
  const char   = CHAR_FOR_ID[charId] ?? CHARACTERS[2]

  return (
    <div className="lp-root" style={{ minHeight: '100dvh' }}>
      <Nav onCta={onRedo} />

      {/* Hero: 내 카드 */}
      <section style={{ position: 'relative', padding: '64px 0 80px', overflow: 'hidden' }}>
        <GridDots />
        <div className="lp-container" style={{ position: 'relative' }}>
          <div className="lp-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
                <span className="lp-sticker" style={{ background: 'var(--brand)', color: '#fff', border: 'none' }}>✓ 내 카드</span>
                <span className="lp-sticker" style={{ background: `color-mix(in srgb, ${char.accent} 20%, var(--surface-raised))`, color: char.accent, borderColor: `color-mix(in srgb, ${char.accent} 40%, transparent)` }}>
                  {char.name}형
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(2.2rem, 4.8vw, 4.4rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.98, margin: 0 }} className="lp-break-keep">
                안녕하세요,<br />
                <span className="lp-handwrite" style={{ color: char.accent, fontWeight: 700, fontSize: '1.05em' }}>{card.nickname}</span>님!
              </h1>
              <p style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 20, lineHeight: 1.65 }} className="lp-break-keep">
                <b style={{ color: 'var(--text)' }}>{char.name}형</b> — {char.tag}.<br />
                {card.tagline}
              </p>

              <div style={{ display: 'flex', gap: 10, marginTop: 32, flexWrap: 'wrap' }}>
                <button style={btnPrimary()} onClick={onBrowse}>내 취향 방 탐색 →</button>
                <button style={btnGhost()} onClick={onRedo}>카드 다시 만들기</button>
              </div>

              {/* 장르 태그 */}
              {card.genres.length > 0 && (
                <div style={{ marginTop: 28, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {card.genres.map(g => (
                    <span key={g} className="lp-sticker" style={{ background: `color-mix(in srgb, ${char.accent} 12%, var(--surface-raised))`, color: char.accent, borderColor: `color-mix(in srgb, ${char.accent} 30%, transparent)` }}>{g}</span>
                  ))}
                  {card.playStyle.map(s => (
                    <span key={s} className="lp-sticker">{s}</span>
                  ))}
                </div>
              )}
            </div>

            {/* 내 카드 미리보기 (flip) */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <MyCardDisplay char={char} card={card} />
            </div>
          </div>
        </div>
      </section>

      {/* 통계 요약 */}
      <section style={{ padding: '40px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
        <div className="lp-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--border)' }}>
            {[
              { label: '방탈출 경험', value: card.playCount === '100+' ? '100회 이상' : `${card.playCount}회`, mono: true },
              { label: '플레이 스타일', value: card.puzzleStyle === 'puzzle' ? '퍼즐형' : card.puzzleStyle === 'device' ? '장치형' : '균형형', mono: false },
              { label: '공포 내성', value: card.fearLevel === 'brave' ? '강함 💪' : card.fearLevel === 'calm' ? '보통 😌' : '약함 😨', mono: false },
            ].map(({ label, value, mono }) => (
              <div key={label} style={{ background: 'var(--surface)', padding: '24px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
                <div className={mono ? 'lp-mono' : ''} style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 방 탐색 유도 */}
      <RoomPreview onBrowse={onBrowse} />

      <LpFooter />
    </div>
  )
}

function MyCardDisplay({ char, card }: { char: typeof CHARACTERS[number]; card: QuizProfile }) {
  const [flipped, setFlipped] = useState(false)
  const w = 260, h = 370

  return (
    <div style={{ position: 'relative', width: w + 40, height: h + 40 }}>
      {/* shadow card behind */}
      <div style={{
        position: 'absolute', left: 16, top: 16, width: w, height: h,
        background: `color-mix(in srgb, ${char.accent} 15%, var(--surface-raised))`,
        borderRadius: 20,
        transform: 'rotate(4deg)',
      }} />
      {/* main flippable card */}
      <div
        className="lp-flip-scene lp-floaty"
        style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, cursor: 'pointer' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div className={`lp-flip-inner${flipped ? ' flipped' : ''}`}>
          <div className="lp-flip-face">
            <div style={{
              background: `linear-gradient(160deg, color-mix(in srgb, ${char.accent} 28%, var(--surface)) 0%, var(--surface) 70%)`,
              border: `1px solid color-mix(in srgb, ${char.accent} 35%, var(--border))`,
              borderRadius: 20, padding: 18, width: '100%', height: '100%',
              boxShadow: `0 24px 60px -12px rgba(0,0,0,.2), 0 0 40px -12px ${char.accent}55`,
              display: 'flex', flexDirection: 'column',
            }} className="lp-noise">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="lp-mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '.1em' }}>BANGTANG</span>
                <LpLogo size={20} />
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={char.img} alt="" style={{ width: '78%', height: '78%', objectFit: 'contain', filter: `drop-shadow(0 12px 24px ${char.accent}66)` }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, letterSpacing: '.04em' }}>{char.tag}</div>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>{card.nickname}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{char.name}형</div>
              </div>
            </div>
          </div>
          <div className="lp-flip-face lp-flip-back">
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 20, padding: 18, width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span className="lp-mono" style={{ color: 'var(--text-muted)' }}>PROFILE</span>
                <span style={{ color: char.accent, fontWeight: 700 }}>{char.name}형</span>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  { k: '공포 내성', v: card.fearLevel === 'brave' ? 85 : card.fearLevel === 'calm' ? 55 : 25 },
                  { k: '퍼즐 선호', v: card.puzzleStyle === 'puzzle' ? 90 : card.puzzleStyle === 'balanced' ? 60 : 35 },
                  { k: '장치 선호', v: card.puzzleStyle === 'device' ? 90 : card.puzzleStyle === 'balanced' ? 60 : 35 },
                  { k: '경험치', v: card.playCount === '100+' ? 100 : card.playCount === '30-100' ? 80 : card.playCount === '10-30' ? 55 : card.playCount === '0-10' ? 30 : 10 },
                ].map(({ k, v }) => (
                  <div key={k}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                      <span className="lp-mono">{v}</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--surface-muted)', borderRadius: 99 }}>
                      <div style={{ height: '100%', width: v + '%', background: `linear-gradient(90deg, var(--brand), ${char.accent})`, borderRadius: 99 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'auto', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }} className="lp-mono">
                TAP TO FLIP BACK
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }} className="lp-mono">
        click to flip ↻
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────

export function LandingPage() {
  const navigate = useNavigate()
  const [card, setCard] = useState<QuizProfile | null>(loadSavedCard)
  const [session, setSession] = useState<Session | null>(null)
  const [scrollY, setScrollY] = useState(0)

  // auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  // card changes (e.g. after quiz)
  useEffect(() => {
    const refresh = () => setCard(loadSavedCard())
    window.addEventListener(SAVED_CARD_CHANGED, refresh)
    return () => window.removeEventListener(SAVED_CARD_CHANGED, refresh)
  }, [])

  // scroll
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const onCta    = () => navigate('/my-card')
  const onBrowse = () => navigate('/rooms')

  // State 3: 카드 있음 → 개인화 대시보드
  if (card) {
    return <ReturnUserPage card={card} onBrowse={onBrowse} onRedo={onCta} />
  }

  // State 1 & 2: 카드 없음 → 풀 마케팅 랜딩 (로그인 여부에 따라 히어로만 변경)
  return (
    <div className="lp-root">
      <Nav onCta={onCta} />
      <HeroBalanced parallaxY={scrollY} onCta={onCta} onBrowse={onBrowse} loggedIn={Boolean(session)} />
      <CharacterShowcase />
      <CardSamplePreview />
      <Features />
      <StatsAndReviews />
      <RoomPreview onBrowse={onBrowse} />
      <FaqSection />
      <BottomCta onCta={onCta} onBrowse={onBrowse} />
      <LpFooter />
    </div>
  )
}
