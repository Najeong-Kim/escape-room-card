import { supabase } from './supabaseClient'

export type ReportType = 'incorrect_info' | 'closed_or_moved' | 'missing_theme' | 'bug' | 'other'

export interface ReportInput {
  themeId?: number | null
  reportType: ReportType
  title: string
  message: string
  reporterName?: string
  reporterEmail?: string
}

export async function submitReport(input: ReportInput) {
  const payload = {
    report_token: crypto.randomUUID(),
    theme_id: input.themeId ?? null,
    report_type: input.reportType,
    title: input.title.trim(),
    message: input.message.trim(),
    reporter_name: input.reporterName?.trim() || null,
    reporter_email: input.reporterEmail?.trim() || null,
    page_url: window.location.href,
    user_agent: navigator.userAgent,
  }

  const { error } = await supabase
    .from('reports')
    .insert(payload)

  if (error) throw error

  return { ok: true }
}
