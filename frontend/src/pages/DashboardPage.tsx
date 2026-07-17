import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  departmentCount: number;
}

export interface DashboardPageProps {
  stats: DashboardStats | null;
  loading?: boolean;
  error?: string | null;
}

interface StatCardProps {
  label: string;
  value: number;
  accent: string;
  loading: boolean;
}

function StatCard({ label, value, accent, loading }: StatCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
        p: 3,
        position: 'relative',
      }}
    >
      <Box sx={{ bgcolor: accent, height: '100%', left: 0, position: 'absolute', top: 0, width: 5 }} />
      <Typography color="text.secondary" sx={{ fontWeight: 600 }} variant="body2">
        {label}
      </Typography>
      {loading ? (
        <Skeleton sx={{ mt: 1 }} width="45%" />
      ) : (
        <Typography component="p" sx={{ fontWeight: 700, mt: 1 }} variant="h4">
          {value.toLocaleString()}
        </Typography>
      )}
    </Paper>
  );
}

export function DashboardPage({ stats, loading = false, error = null }: DashboardPageProps) {
  const values = stats ?? {
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    departmentCount: 0,
  };

  return (
    <Box component="main" sx={{ p: { xs: 2, sm: 3, lg: 4 } }}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography component="h1" sx={{ fontWeight: 700 }} variant="h4">
            Dashboard
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            A quick overview of your organization.
          </Typography>
        </Box>
        {loading && <CircularProgress aria-label="Loading dashboard" size={24} />}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' },
        }}
      >
        <StatCard accent="#4f46e5" label="Total employees" loading={loading} value={values.totalEmployees} />
        <StatCard accent="#16a34a" label="Active employees" loading={loading} value={values.activeEmployees} />
        <StatCard accent="#dc2626" label="Inactive employees" loading={loading} value={values.inactiveEmployees} />
        <StatCard accent="#0891b2" label="Departments" loading={loading} value={values.departmentCount} />
      </Box>
    </Box>
  );
}

export default DashboardPage;
