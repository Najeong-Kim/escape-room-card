type BrandLogoProps = {
  className?: string
}

export function BrandLogo({ className = '' }: BrandLogoProps) {
  return (
    <img
      src="/brand-logo.png"
      alt="방탕"
      className={className}
      draggable={false}
    />
  )
}
