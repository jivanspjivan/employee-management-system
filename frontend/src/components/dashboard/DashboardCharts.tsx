import { Alert, Box, Chip, Paper, Skeleton, Stack, SvgIcon, Typography } from '@mui/material'
import type { ReactNode } from 'react'

export interface DashboardChartData {
  statusDistribution: Array<{ status: 'ACTIVE' | 'INACTIVE'; count: number }>
  roleDistribution: Array<{ role: 'SUPER_ADMIN' | 'HR_MANAGER' | 'EMPLOYEE'; count: number }>
  departmentDistribution: Array<{ departmentId: string; name: string; count: number }>
  joiningTrend: Array<{ month: string; count: number }>
}

type DashboardChartsProps = {
  charts: DashboardChartData | null
  loading: boolean
  error?: string | null
}

const ChartIcon = ({ path }: { path: string }) => <SvgIcon sx={{ fontSize: 19 }}><path d={path} /></SvgIcon>

const ChartCard = ({ children, featured = false, icon, subtitle, title }: { children: ReactNode; featured?: boolean; icon: ReactNode; subtitle: string; title: string }) => (
  <Paper elevation={0} sx={{ background: featured ? 'linear-gradient(145deg,#ffffff 0%,#f8fbf9 100%)' : '#fff', border: featured ? '1px solid #cbdacf' : '1px solid #e2e9e4', borderRadius: featured ? 3.5 : 2.5, boxShadow: featured ? '0 12px 30px rgba(30,65,42,.09)' : '0 6px 18px rgba(30,65,42,.05)', minHeight: featured ? 252 : 236, overflow: 'hidden', transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease', '&:hover': { borderColor: '#b8cdbd', boxShadow: featured ? '0 16px 36px rgba(30,65,42,.13)' : '0 11px 25px rgba(30,65,42,.09)', transform: 'translateY(-2px)' } }}>
    <Stack direction="row" spacing={1.1} sx={{ alignItems: 'center', borderBottom: '1px solid #edf1ee', px: featured ? 2.3 : 2, py: 1.35 }}>
      <Box sx={{ alignItems: 'center', bgcolor: featured ? '#e3f0e7' : '#f0f5f1', borderRadius: 2, color: 'primary.main', display: 'flex', height: featured ? 36 : 32, justifyContent: 'center', width: featured ? 36 : 32 }}>{icon}</Box>
      <Box><Typography sx={{ fontSize: featured ? '.92rem' : '.84rem', fontWeight: featured ? 760 : 700 }}>{title}</Typography><Typography color="text.secondary" sx={{ fontSize: '.64rem', mt: .05 }}>{subtitle}</Typography></Box>
      {featured && <Chip label="6 months" size="small" sx={{ bgcolor: '#edf5ef', color: '#477258', fontSize: '.59rem', height: 21, ml: 'auto!important' }} />}
    </Stack>
    <Box sx={{ p: featured ? 2.2 : 1.9 }}>{children}</Box>
  </Paper>
)

const formatMonth = (month: string) => new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(`${month}-01T00:00:00`))

export const DashboardCharts = ({ charts, loading, error }: DashboardChartsProps) => {
  if (error) return <Alert severity="warning" sx={{ mt: 2.25 }}>Charts could not be loaded: {error}</Alert>

  if (loading || !charts) {
    return <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.65fr) minmax(280px, .75fr)' }, mt: 2.25 }}><Skeleton height={236} sx={{ borderRadius: 3.5 }} variant="rounded" /><Skeleton height={236} sx={{ borderRadius: 2.5 }} variant="rounded" /></Box>
  }

  const active = charts.statusDistribution.find((item) => item.status === 'ACTIVE')?.count ?? 0
  const inactive = charts.statusDistribution.find((item) => item.status === 'INACTIVE')?.count ?? 0
  const statusTotal = active + inactive
  const activePercent = statusTotal ? Math.round((active / statusTotal) * 100) : 0
  const trendMax = Math.max(...charts.joiningTrend.map((item) => item.count), 1)
  const totalJoined = charts.joiningTrend.reduce((total, item) => total + item.count, 0)
  const latestJoined = charts.joiningTrend.at(-1)?.count ?? 0
  const previousJoined = charts.joiningTrend.at(-2)?.count ?? 0
  const change = previousJoined ? Math.round(((latestJoined - previousJoined) / previousJoined) * 100) : 0
  const trendPoints = charts.joiningTrend.map((item, index) => {
    const x = charts.joiningTrend.length === 1 ? 220 : 14 + (index * 412) / (charts.joiningTrend.length - 1)
    const y = 104 - (item.count / trendMax) * 77
    return `${x},${y}`
  }).join(' ')

  return (
    <Box sx={{ mt: 2.25 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 1.25 }}>
        <Box><Typography sx={{ fontSize: '1rem', fontWeight: 760 }}>Workforce insights</Typography><Typography color="text.secondary" sx={{ fontSize: '.72rem', mt: .15 }}>The signals that matter most across Playstack</Typography></Box>
        <Typography color="text.secondary" sx={{ fontSize: '.63rem', mt: { xs: .6, sm: 0 } }}>Updated just now</Typography>
      </Stack>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.65fr) minmax(280px, .75fr)' } }}>
        <ChartCard featured icon={<ChartIcon path="M3.5 18.49 9 12.98l4 4L22 6.92 20.59 5.5 13 14.02l-4-4-7 6.99 1.5 1.5Z" />} subtitle="Employee growth across Playstack" title="Joining trend">
          <Stack direction="row" spacing={3} sx={{ alignItems: 'flex-end', mb: .45 }}>
            <Box><Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Typography sx={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-.045em', lineHeight: 1 }}>{latestJoined}</Typography><Chip label={`${change >= 0 ? '↑' : '↓'} ${Math.abs(change)}% growth`} size="small" sx={{ bgcolor: change >= 0 ? '#e6f3ea' : '#faeaea', color: change >= 0 ? '#347b4d' : '#bd4c4c', fontSize: '.59rem', fontWeight: 720, height: 22 }} /></Stack><Typography color="text.secondary" sx={{ fontSize: '.61rem', mt: .35 }}>new hires this month</Typography></Box>
            <Box sx={{ borderLeft: '1px solid #dde6e0', pl: 2.2 }}><Typography sx={{ fontSize: '1rem', fontWeight: 750, lineHeight: 1 }}>{totalJoined}</Typography><Typography color="text.secondary" sx={{ fontSize: '.6rem', mt: .3 }}>total in 6 months</Typography></Box>
          </Stack>
          <Box component="svg" preserveAspectRatio="none" viewBox="0 0 440 112" sx={{ height: 124, overflow: 'visible', width: '100%' }}>
            <defs><linearGradient id="joining-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#4e9566" stopOpacity=".22" /><stop offset="1" stopColor="#4e9566" stopOpacity="0" /></linearGradient></defs>
            <line stroke="#dfe7e1" x1="14" x2="426" y1="104" y2="104" />
            <polygon fill="url(#joining-fill)" points={`14,104 ${trendPoints} 426,104`} />
            <polyline fill="none" points={trendPoints} stroke="#43845a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
            {charts.joiningTrend.map((item, index) => { const [x, y] = trendPoints.split(' ')[index].split(','); return <g key={item.month}><circle cx={x} cy={y} fill="#fff" r="4" stroke="#43845a" strokeWidth="2" /><text fill="#3f5848" fontSize="9" fontWeight="700" textAnchor="middle" x={x} y={Number(y) - 9}>{item.count}</text></g> })}
          </Box>
          <Stack direction="row" sx={{ justifyContent: 'space-between', px: .25 }}>{charts.joiningTrend.map((item) => <Typography color="text.secondary" key={item.month} sx={{ fontSize: '.59rem' }}>{formatMonth(item.month)}</Typography>)}</Stack>
        </ChartCard>

        <ChartCard icon={<ChartIcon path="M11 2v20C5.93 21.5 2 17.22 2 12S5.93 2.5 11 2Zm2 0v9h9C21.54 6.24 17.76 2.46 13 2Zm0 11v9c4.76-.46 8.54-4.24 9-9h-9Z" />} subtitle="Current availability" title="Employee status">
          <Stack sx={{ alignItems: 'center', justifyContent: 'center', minHeight: 166 }}>
            <Box sx={{ background: `conic-gradient(#4e9566 0 ${activePercent}%, #df6a6a ${activePercent}% 100%)`, borderRadius: '50%', display: 'grid', height: 140, placeItems: 'center', position: 'relative', width: 140, '&::after': { bgcolor: '#fff', borderRadius: '50%', content: '""', height: 90, position: 'absolute', width: 90 } }}><Box sx={{ position: 'relative', textAlign: 'center', zIndex: 1 }}><Typography sx={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{activePercent}%</Typography><Typography color="text.secondary" sx={{ fontSize: '.59rem', mt: .3 }}>active</Typography></Box></Box>
            <Stack direction="row" spacing={2.5} sx={{ mt: 1.5 }}>{[{ label: 'Active', value: active, color: '#4e9566' }, { label: 'Inactive', value: inactive, color: '#df6a6a' }].map((item) => <Stack direction="row" key={item.label} spacing={.65} sx={{ alignItems: 'center' }}><Box sx={{ bgcolor: item.color, borderRadius: '50%', height: 8, width: 8 }} /><Typography sx={{ fontSize: '.66rem', fontWeight: 650 }}>{item.value} <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>{item.label}</Box></Typography></Stack>)}</Stack>
          </Stack>
        </ChartCard>
      </Box>
    </Box>
  )
}
