/**
 * GET /api/admin/registrations
 *
 * Returns the full registrations table as CSV. Gated by `x-admin-token` header
 * which must match `NUXT_ADMIN_TOKEN`. Useful as a backup if the Supabase
 * dashboard isn't handy or for quick one-off exports.
 *
 * Example:
 *   curl -H "x-admin-token: $TOKEN" https://harryafters.example.com/api/admin/registrations -o list.csv
 */

interface RegistrationRow {
  name: string
  email: string
  created_at: string
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const expected = config.adminToken

  if (!expected) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Admin token is not configured (set NUXT_ADMIN_TOKEN).'
    })
  }

  const provided = getRequestHeader(event, 'x-admin-token')
  if (!provided || provided !== expected) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('registrations')
    .select('name, email, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[admin/registrations] Supabase select failed', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Could not fetch registrations.'
    })
  }

  const rows = (data ?? []) as RegistrationRow[]
  const header = 'name,email,created_at'
  const lines = rows.map(row =>
    [row.name, row.email, row.created_at].map(csvEscape).join(',')
  )
  const csv = [header, ...lines].join('\n')

  setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setResponseHeader(
    event,
    'content-disposition',
    'attachment; filename="harry-afters-registrations.csv"'
  )
  return csv
})
