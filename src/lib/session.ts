const SESSION_KEY = 'escape-room-session'

/** 앱 최초 실행 시 생성되는 익명 UUID. localStorage에 영구 보관. */
export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}
