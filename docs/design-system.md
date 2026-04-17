# 방탕 디자인 시스템

## Color Tokens

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Brand primary | `--color-brand-primary` | `#14B8A6` | 주요 CTA, 선택 상태, 링크, 포커스 |
| Brand primary hover | `--color-brand-primary-hover` | `#0D9488` | CTA hover, active emphasis |
| Brand primary soft | `--color-brand-primary-soft` | `#CCFBF1` | subtle badge, light accent surface |
| Brand primary dark | `--color-brand-primary-dark` | `#115E59` | light mode text, strong border |
| Brand accent | `--color-brand-accent` | `#FBBF24` | 방탕/열쇠/보상/하이라이트 |
| Brand accent hover | `--color-brand-accent-hover` | `#F59E0B` | accent hover |
| Brand accent soft | `--color-brand-accent-soft` | `#FEF3C7` | light accent surface |
| Brand accent dark | `--color-brand-accent-dark` | `#92400E` | light mode accent text |
| Background | `--color-bg` | dark `#0A0A0F`, light `#F8FAFC` | page background |
| Surface | `--color-surface` | dark `#13131A`, light `#FFFFFF` | cards, panels |
| Muted surface | `--color-surface-muted` | dark `#0E0E16`, light `#F3F4F8` | nested fields, quiet panels |
| Text | `--color-text` | dark `#F8FAFC`, light `#111827` | primary text |
| Muted text | `--color-text-muted` | dark `#94A3B8`, light `#64748B` | helper text |

## Rules

- Use mint/teal as the default interaction color.
- Use yellow only for brand moments, rewards, highlights, and official/accent labels.
- Keep success, danger, warning, and info colors reserved for their semantic meanings.
- Avoid adding new purple/violet UI colors. Existing category colors can be revisited only when there is a clear semantic reason.
- Prefer shared classes like `app-primary-action`, `app-secondary-action`, `personal-score`, `review-source-badge`, and CSS variables before adding one-off hex colors.
