import { Box, Paper, Stack, Typography } from '@mui/material'

const features = [
  {
    number: '01',
    title: 'Secure access',
    description:
      'JWT authentication and permissions for every organizational role.',
  },
  {
    number: '02',
    title: 'Employee records',
    description:
      'Validated profiles, departments, status, and employment details.',
  },
  {
    number: '03',
    title: 'Clear hierarchy',
    description:
      'Reporting trees and direct reports with circular-link protection.',
  },
]

export const FeatureCards = () => (
  <Box
    aria-label="Planned features"
    component="section"
    sx={{
      display: 'grid',
      gap: 2.25,
      gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
      mt: 2.25,
    }}
  >
    {features.map((feature) => (
      <Paper
        component="article"
        elevation={0}
        key={feature.number}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.75)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 5,
          p: 3.75,
        }}
      >
        <Stack spacing={1.25}>
          <Typography
            sx={{
              color: 'primary.main',
              fontSize: '0.78rem',
              fontWeight: 750,
            }}
          >
            {feature.number}
          </Typography>
          <Typography
            component="h2"
            sx={{ fontSize: '1.25rem', fontWeight: 700, pt: 4 }}
          >
            {feature.title}
          </Typography>
          <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            {feature.description}
          </Typography>
        </Stack>
      </Paper>
    ))}
  </Box>
)
