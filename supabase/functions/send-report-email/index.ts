import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ReportEmailPayload = {
  reportId?: number
  reportToken?: string
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reportId, reportToken } = await req.json() as ReportEmailPayload
    if (!reportId && !reportToken) {
      return new Response(JSON.stringify({ error: 'reportId or reportToken is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const toEmail = Deno.env.get('REPORT_TO_EMAIL')
    const fromEmail = Deno.env.get('REPORT_FROM_EMAIL') ?? 'Escape Room Card <onboarding@resend.dev>'

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase service environment variables are missing')
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    let query = supabase
      .from('reports')
      .select('*,themes(name,cafes(name,branch_name))')

    query = reportToken ? query.eq('report_token', reportToken) : query.eq('id', reportId)

    const { data: report, error } = await query
      .single()

    if (error) throw error
    if (!report) throw new Error('Report not found')

    if (!resendApiKey || !toEmail) {
      return new Response(JSON.stringify({ ok: true, emailSkipped: true }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      })
    }

    const cafe = report.themes?.cafes
    const cafeName = cafe ? `${cafe.name ?? ''}${cafe.branch_name ? ` ${cafe.branch_name}` : ''}` : ''
    const themeName = report.themes?.name
    const themeText = cafeName || themeName ? `${cafeName}${cafeName && themeName ? ' · ' : ''}${themeName ?? ''}` : '테마 없음'

    const html = `
      <h2>새 제보가 접수되었습니다.</h2>
      <p><strong>제목:</strong> ${escapeHtml(report.title)}</p>
      <p><strong>유형:</strong> ${escapeHtml(report.report_type)}</p>
      <p><strong>테마:</strong> ${escapeHtml(themeText)}</p>
      <p><strong>제보자:</strong> ${escapeHtml(report.reporter_name || '익명')} ${escapeHtml(report.reporter_email || '')}</p>
      <p><strong>페이지:</strong> ${escapeHtml(report.page_url || '-')}</p>
      <hr />
      <p style="white-space: pre-wrap;">${escapeHtml(report.message)}</p>
    `

    const mailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${resendApiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `[방탈출 제보] ${report.title}`,
        html,
      }),
    })

    if (!mailRes.ok) {
      const detail = await mailRes.text()
      throw new Error(`Resend failed: ${detail}`)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    })
  }
})
