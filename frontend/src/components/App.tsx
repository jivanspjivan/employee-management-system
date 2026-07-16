import { useEffect, useState } from 'react'
import { Box, Container } from '@mui/material'

import { type ApiState } from './ApiStatusChip'
import { FeatureCards } from './FeatureCards'
import { HeroSection } from './HeroSection'

export const App = () => {
  const [apiState, setApiState] = useState<ApiState>('checking')

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

    fetch(`${apiUrl}/health`)
      .then((response) => {
        if (!response.ok) throw new Error('API health check failed')
        setApiState('online')
      })
      .catch(() => setApiState('offline'))
  }, [])

  return (
    <Box component="main" sx={{ py: { xs: 3, md: 9 } }}>
      <Container maxWidth="lg">
        <HeroSection apiState={apiState} />
        <FeatureCards />
      </Container>
    </Box>
  )
}
