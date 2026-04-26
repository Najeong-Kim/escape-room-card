import { useEffect } from 'react'

const DEFAULT_TITLE = '방탈출로 탕진하자: 방탕'
const DEFAULT_DESCRIPTION = '7문항에 답하면 내 방탈출 성향 카드가 나와요. 전국 715개 테마 중 취향에 딱 맞는 방도 골라드려요.'
const DEFAULT_IMAGE = '/og-image.png'

function absoluteUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
}

function setMeta(selector: string, attr: 'content' | 'href', value: string) {
  const element = document.head.querySelector(selector)
  if (element) {
    element.setAttribute(attr, value)
  }
}

export function usePageMeta({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
}: {
  title?: string
  description?: string
  image?: string
  url?: string
}) {
  useEffect(() => {
    const pageTitle = title === DEFAULT_TITLE ? title : `${title} | 방탕`
    const pageUrl = absoluteUrl(url ?? window.location.pathname)
    const imageUrl = absoluteUrl(image)

    document.title = pageTitle
    setMeta('meta[name="description"]', 'content', description)
    setMeta('meta[property="og:url"]', 'content', pageUrl)
    setMeta('meta[property="og:title"]', 'content', pageTitle)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:image"]', 'content', imageUrl)
    setMeta('meta[name="twitter:title"]', 'content', pageTitle)
    setMeta('meta[name="twitter:description"]', 'content', description)
    setMeta('meta[name="twitter:image"]', 'content', imageUrl)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = pageUrl
  }, [description, image, title, url])
}
