export function Footer() {
  return (
    <footer className="px-4 py-8 text-center text-xs text-gray-600 space-y-2">
      <div className="flex items-center justify-center gap-3">
        <a href="/privacy" className="hover:text-gray-400 transition-colors">개인정보처리방침</a>
        <span aria-hidden="true">·</span>
        <a href="/terms" className="hover:text-gray-400 transition-colors">이용 안내</a>
      </div>
      <p>© 2026 방탕. All rights reserved.</p>
    </footer>
  )
}
