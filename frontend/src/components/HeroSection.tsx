import { Paper, Typography } from '@mui/material'

import { ApiStatusChip, type ApiState } from './ApiStatusChip'

type HeroSectionProps = {
  apiState: ApiState
}

export const HeroSection = ({ apiState }: HeroSectionProps) => (
  <Paper
    component="section"
    elevation={0}
    sx={{
      alignItems: 'flex-start',
      background:
        'radial-gradient(circle at 82% 18%, rgba(135, 214, 155, 0.28), transparent 27%), linear-gradient(135deg, #173f2b, #0e251a)',
      borderRadius: { xs: 4, md: 8 },
      boxShadow: '0 24px 70px rgba(22, 58, 40, 0.18)',
      color: 'common.white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      minHeight: { xs: 590, md: 520 },
      p: { xs: 4, md: 9 },
    }}
  >
    <Typography
      sx={{
        color: '#9de2ae',
        fontSize: '0.8rem',
        fontWeight: 750,
        letterSpacing: '0.14em',
        mb: 2,
        textTransform: 'uppercase',
      }}
    >
      Playstack Employee Management
    </Typography>

    <Typography
      component="h1"
      sx={{
        fontSize: { xs: '2.8rem', sm: '4rem', md: '5.6rem' },
        fontWeight: 750,
        letterSpacing: '-0.055em',
        lineHeight: 0.98,
        maxWidth: 800,
      }}
    >
      Build a better-connected organization.
    </Typography>

    <Typography
      sx={{
        color: '#c9d7ce',
        fontSize: { xs: '1rem', md: '1.2rem' },
        lineHeight: 1.65,
        my: 3.5,
        maxWidth: 650,
      }}
    >
      Secure employee records, role-based access, reporting hierarchies, and
      workforce insights in one responsive workspace.
    </Typography>

    <ApiStatusChip state={apiState} />
  </Paper>
)
