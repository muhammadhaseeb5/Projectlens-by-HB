export const label = (v: string | undefined) => (v || 'draft').replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
export const date = (v?: string, timezone?: string) => v ? new Intl.DateTimeFormat('en', { dateStyle:'medium', timeStyle:'short', timeZone:timezone || 'UTC' }).format(new Date(v)) : 'Not set'
export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0,2).map(x => x[0]).join('').toUpperCase() || 'PL'
export function csvCell(v:unknown){let s=String(v??'');if(/^[\s]*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'}
export const csvText=(rows:unknown[][])=>'\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')
export function downloadCsv(name: string, rows: unknown[][]) {
  const url = URL.createObjectURL(new Blob([csvText(rows)],{type:'text/csv;charset=utf-8'}))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
}
