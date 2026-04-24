import { useNavigate } from 'react-router-dom'
import { GlobalNav } from '../GlobalNav'
import { Footer } from '../Footer'
import { usePageMeta } from '../../lib/seo'

type LegalPageKind = 'privacy' | 'terms'

const UPDATED_AT = '2026년 4월 17일'

const SECTION_CLASS = 'rounded-xl bg-[#13131a] border border-white/8 px-4 py-4 space-y-2'

export function LegalPage({ kind }: { kind: LegalPageKind }) {
  const navigate = useNavigate()
  const isPrivacy = kind === 'privacy'
  const title = isPrivacy ? '개인정보처리방침' : '이용 안내'
  const description = isPrivacy
    ? '방탕의 개인정보 처리와 기록 저장 방식을 안내합니다.'
    : '방탕의 정보 제공 범위, 외부 링크, 제보와 삭제 요청 방법을 안내합니다.'

  usePageMeta({ title, description, url: isPrivacy ? '/privacy' : '/terms' })

  return (
    <div className="min-h-dvh bg-[#0a0a0f] text-white">
      <GlobalNav />
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center gap-3 min-w-0">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white transition-colors p-1"
          aria-label="뒤로"
        >
          ←
        </button>
        <h1 className="font-semibold text-base truncate">{title}</h1>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <section className="space-y-2">
          <p className="text-xs text-gray-500">시행일: {UPDATED_AT}</p>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        </section>

        {isPrivacy ? <PrivacyContent /> : <TermsContent />}
      </main>
      <Footer />
    </div>
  )
}

function PrivacyContent() {
  return (
    <>
      <section className={SECTION_CLASS}>
        <h3 className="font-semibold">수집하는 정보</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          방탕은 서비스 이용에 필요한 범위에서 닉네임, 방탕 카드 결과, 플레이 기록, 테마 평가, 제보 내용을 저장할 수 있습니다.
          로그인하지 않은 상태의 카드 결과는 브라우저 localStorage에 저장될 수 있으며, 플레이 기록은 로그인한 계정에 저장됩니다.
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h3 className="font-semibold">로그인 시 저장되는 정보</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          로그인하면 방탕 카드 결과와 플레이 기록을 Supabase DB에 동기화할 수 있습니다. 저장 항목에는 테마명, 플레이 날짜, 성공 여부,
          길 평가, 세부 평가, 한마디가 포함될 수 있습니다.
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h3 className="font-semibold">제보와 문의</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          사용자가 보낸 제보에는 제보 유형, 제목, 내용, 선택 입력한 닉네임과 이메일이 포함될 수 있습니다.
          이메일은 답변이 필요한 경우에만 확인 목적으로 사용합니다.
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h3 className="font-semibold">보관과 삭제 요청</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          브라우저에 저장된 정보는 사용자가 직접 기록 삭제 또는 카드 재생성을 통해 지울 수 있습니다.
          계정에 저장된 정보 삭제가 필요한 경우 제보 기능을 통해 삭제 요청을 보내 주세요.
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h3 className="font-semibold">외부 서비스</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          인증, 데이터 저장, 후기 검색, 지도와 예약 링크 연결을 위해 Supabase, 네이버, 유튜브 등 외부 서비스를 사용할 수 있습니다.
          외부 링크로 이동한 뒤의 개인정보 처리는 각 서비스 정책을 따릅니다.
        </p>
      </section>
    </>
  )
}

function TermsContent() {
  return (
    <>
      <section className={SECTION_CLASS}>
        <h3 className="font-semibold">정보 제공 범위</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          방탕은 방탈출로 탕진하기 위한 테마 탐색, 기록, 추천 서비스입니다. 운영 여부, 가격, 예약 가능 시간, 인원 제한은 변경될 수 있으니
          방문 전 공식 홈페이지 또는 예약 페이지에서 다시 확인해 주세요.
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h3 className="font-semibold">추천과 평가</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          추천 결과와 예상 길은 사용자의 기록, 카드 결과, 공식 정보, 유저 평균 평가를 바탕으로 계산한 참고 정보입니다.
          실제 체감 난이도와 만족도는 개인차가 있을 수 있습니다.
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h3 className="font-semibold">외부 후기 링크</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          블로그, 유튜브, 인스타그램 등 외부 후기는 원문 출처로 이동하는 링크입니다. 콘텐츠의 권리와 책임은 각 작성자와 플랫폼에 있습니다.
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h3 className="font-semibold">이미지와 포스터</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          포스터와 이미지는 테마 식별을 돕기 위한 목적으로 출처를 확인해 사용합니다. 권리자 요청이 있으면 확인 후 수정하거나 제거합니다.
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h3 className="font-semibold">제보와 삭제 요청</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          잘못된 정보, 폐점, 이미지 사용, 후기 링크, 개인정보 삭제 요청은 테마 상세 페이지의 정보 제보 기능으로 보내 주세요.
        </p>
      </section>
    </>
  )
}
