import {
  Alert,
  Box,
  Button,
  Paper,
  Skeleton,
  Stack,
  SvgIcon,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { DashboardCharts, type DashboardChartData } from '../components/dashboard/DashboardCharts';

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  departmentCount: number;
}

export interface DashboardPageProps {
  stats: DashboardStats | null;
  charts?: DashboardChartData | null;
  chartsLoading?: boolean;
  chartsError?: string | null;
  loading?: boolean;
  error?: string | null;
  onAddEmployee?: () => void;
  onAddDepartment?: () => void;
  welcomeName?: string;
}

interface StatCardProps {
  label: string;
  value: number;
  accent: string;
  tint: string;
  icon: ReactNode;
  loading: boolean;
  trend: string;
  trendLabel: string;
  sparkline: string;
  trendTone: 'positive' | 'negative' | 'neutral';
}

function StatCard({ label, value, accent, tint, icon, loading, trend, trendLabel, sparkline, trendTone }: StatCardProps) {
  const trendColor = trendTone === 'positive' ? '#2f7d4a' : trendTone === 'negative' ? '#c44747' : '#3976a8';
  const trendBackground = trendTone === 'positive' ? 'rgba(47, 125, 74, 0.07)' : trendTone === 'negative' ? 'rgba(196, 71, 71, 0.07)' : 'rgba(57, 118, 168, 0.07)';
  const trendSymbol = trendTone === 'positive' ? '↑' : trendTone === 'negative' ? '↓' : '→';
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: '#e8eeea',
        borderRadius: { xs: 2.5, sm: 4 },
        bgcolor: tint,
        boxShadow: '0 5px 16px rgba(31, 64, 43, 0.055)',
        overflow: 'hidden',
        p: { xs: 1.25, sm: 2 },
        position: 'relative',
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        '&:hover': {
          borderColor: '#c9d9ce',
          boxShadow: '0 14px 30px rgba(31, 64, 43, 0.14)',
          transform: 'translateY(-5px)',
        },
      }}
    >
      <Box sx={{ bgcolor: accent, height: 3, left: 0, position: 'absolute', right: 0, top: 0 }} />
      <Stack
        direction="row"
        spacing={1.25}
        sx={{ alignItems: 'center' }}
      >
        <Box
          sx={{
            alignItems: 'center',
            bgcolor: 'background.paper',
            borderRadius: { xs: 1.75, sm: 2.5 },
            display: 'flex',
            height: { xs: 32, sm: 36 },
            justifyContent: 'center',
            width: { xs: 32, sm: 36 },
            color: accent,
            boxShadow: '0 3px 10px rgba(22, 58, 40, 0.07)',
          }}
        >
          {icon}
        </Box>
        <Typography color="text.secondary" sx={{ fontWeight: 650 }} variant="body2">
          {label}
        </Typography>
      </Stack>
      <Stack direction="row" sx={{ alignItems: 'flex-end', justifyContent: 'space-between', mt: { xs: .65, sm: 1.15 } }}>
        <Box>
          {loading ? (
            <Skeleton height={40} width={70} />
          ) : (
            <Typography component="p" sx={{ color: '#17291d', fontSize: { xs: '2.35rem', lg: '2.5rem' }, fontWeight: 820, letterSpacing: '-0.055em', lineHeight: .95 }}>
              {value.toLocaleString()}
            </Typography>
          )}
          {loading ? (
            <Skeleton height={16} sx={{ mt: 0.65 }} width={112} />
          ) : (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'baseline', mt: { xs: .4, sm: .65 } }}>
              <Typography component="span" sx={{ color: trendColor, fontSize: '0.7rem', fontWeight: 750 }}>
                {trendSymbol} {trend}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: '0.62rem' }}>
                {trendLabel}
              </Typography>
            </Stack>
          )}
        </Box>
        {loading ? (
          <Skeleton height={64} sx={{ borderRadius: 2 }} variant="rounded" width={152} />
        ) : (
          <Box>
            <Typography color="text.secondary" sx={{ fontSize: '0.62rem', fontWeight: 650, mb: 0.25, textAlign: 'right' }}>
              Monthly Trend
            </Typography>
            <Box sx={{ bgcolor: trendBackground, borderRadius: { xs: 1.5, sm: 2 }, display: 'flex', px: 0.6, py: 0.35 }}>
              <Box component="svg" aria-hidden viewBox="0 0 140 48" sx={{ height: { xs: 36, sm: 54 }, overflow: 'visible', width: { xs: 112, sm: 152 } }}>
                <line stroke={trendColor} strokeOpacity="0.14" strokeWidth="1" x1="0" x2="140" y1="42" y2="42" />
                <polyline fill="none" points={sparkline} stroke={trendColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.6" />
              </Box>
            </Box>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

const EmployeeIcon = () => (
  <SvgIcon>
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z" />
  </SvgIcon>
);

const ActiveIcon = () => (
  <SvgIcon><path d="m9 16.17-3.88-3.88L3.7 13.7 9 19 21 7l-1.41-1.41z" /></SvgIcon>
);

const InactiveIcon = () => (
  <SvgIcon><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm5 11H7v-2h10v2Z" /></SvgIcon>
);

const DepartmentIcon = () => (
  <SvgIcon><path d="M12 7V3H2v18h20V7H12Zm-6 12H4v-2h2v2Zm0-4H4v-2h2v2Zm0-4H4V9h2v2Zm0-4H4V5h2v2Zm4 12H8v-2h2v2Zm0-4H8v-2h2v2Zm0-4H8V9h2v2Zm0-4H8V5h2v2Zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10Zm-2-8h-2v2h2v-2Zm0 4h-2v2h2v-2Z" /></SvgIcon>
);

const AddEmployeeIcon = () => (
  <SvgIcon><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6Zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" /></SvgIcon>
);

const AddDepartmentIcon = () => (
  <SvgIcon><path d="M13 7V3H3v18h18V7h-8Zm-6 12H5v-2h2v2Zm0-4H5v-2h2v2Zm0-4H5V9h2v2Zm0-4H5V5h2v2Zm4 12H9v-2h2v2Zm0-4H9v-2h2v2Zm0-4H9V9h2v2Zm8 8h-6v-2h2v-2h-2v-2h2v-2h-2V9h6v10Zm-2-8h-2v2h2v-2Zm0 4h-2v2h2v-2Z" /></SvgIcon>
);

export function DashboardPage({
  stats,
  charts = null,
  chartsLoading = false,
  chartsError = null,
  loading = false,
  error = null,
  onAddEmployee,
  onAddDepartment,
  welcomeName,
}: DashboardPageProps) {
  const values = stats ?? {
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    departmentCount: 0,
  };
  const today = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  }).format(new Date());
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Box component="main" sx={{ p: { xs: .5, sm: 1, lg: 1 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between', mb: { xs: 2.25, sm: 3 } }}
      >
        <Box>
          <Typography color="primary.main" sx={{ fontSize: '0.78rem', fontWeight: 750, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {today}
          </Typography>
          <Typography component="h1" sx={{ fontSize: { xs: '1.6rem', sm: '2.125rem' }, fontWeight: 750, letterSpacing: '-0.03em', lineHeight: { xs: 1.2, sm: 1.235 }, mt: 0.5 }}>
            {greeting} 👋{welcomeName ? `, ${welcomeName.split(' ')[0]}` : ''}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Here&apos;s what&apos;s happening across Playstack today.
          </Typography>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: { xs: 'stretch', sm: 'flex-end' }, mb: 1.5 }}
      >
        <Button
          onClick={onAddDepartment}
          startIcon={<AddDepartmentIcon />}
          sx={{ bgcolor: '#edf6f0', borderColor: '#c8ddcf', color: '#346b47', flex: { xs: 1, sm: 'initial' }, fontSize: { xs: '.76rem', sm: '.875rem' }, minHeight: { xs: 36, sm: 40 }, px: { xs: 1, sm: 2 }, py: { xs: .45, sm: .75 }, '& .MuiButton-startIcon svg': { fontSize: { xs: 18, sm: 20 } }, '&:hover': { bgcolor: '#e2f0e7', borderColor: '#a9cbb4' } }}
          variant="outlined"
        >
          Add department
        </Button>
        <Button
          onClick={onAddEmployee}
          startIcon={<AddEmployeeIcon />}
          sx={{ boxShadow: '0 6px 14px rgba(47, 112, 69, 0.2)', flex: { xs: 1, sm: 'initial' }, fontSize: { xs: '.76rem', sm: '.92rem' }, minHeight: { xs: 36, sm: 44 }, px: { xs: 1, sm: 2.4 }, py: { xs: .45, sm: .75 }, '& .MuiButton-startIcon svg': { fontSize: { xs: 18, sm: 20 } } }}
          variant="contained"
        >
          Add employee
        </Button>
      </Stack>

      <Box
        aria-busy={loading}
        aria-label={loading ? 'Loading dashboard statistics' : undefined}
        sx={{
          display: 'grid',
          gap: { xs: 1.25, sm: 2 },
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' },
        }}
      >
        <StatCard accent="#4d8761" icon={<EmployeeIcon />} label="Total employees" loading={loading} sparkline="1,39 22,33 45,35 68,22 91,25 116,13 139,7" tint="#fafcfb" trend="12%" trendLabel="vs last month" trendTone="positive" value={values.totalEmployees} />
        <StatCard accent="#4d8761" icon={<ActiveIcon />} label="Active employees" loading={loading} sparkline="1,37 22,38 45,27 68,29 91,18 116,20 139,9" tint="#fafcfb" trend="8%" trendLabel="vs last month" trendTone="positive" value={values.activeEmployees} />
        <StatCard accent="#4d8761" icon={<InactiveIcon />} label="Inactive employees" loading={loading} sparkline="1,12 22,17 45,14 68,28 91,23 116,38 139,33" tint="#fafcfb" trend="2%" trendLabel="vs last month" trendTone="negative" value={values.inactiveEmployees} />
        <StatCard accent="#4d8761" icon={<DepartmentIcon />} label="Departments" loading={loading} sparkline="1,27 22,25 45,26 68,24 91,25 116,23 139,24" tint="#fafcfb" trend="0%" trendLabel="vs last month" trendTone="neutral" value={values.departmentCount} />
      </Box>
      <DashboardCharts charts={charts} error={chartsError} loading={chartsLoading} />
    </Box>
  );
}

export default DashboardPage;
