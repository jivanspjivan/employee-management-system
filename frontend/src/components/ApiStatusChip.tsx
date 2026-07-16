import { Chip } from '@mui/material'

export type ApiState = 'checking' | 'online' | 'offline'

type ApiStatusChipProps = {
  state: ApiState
}

export const ApiStatusChip = ({ state }: ApiStatusChipProps) => {
  const statusColor =
    state === 'online'
      ? 'success.main'
      : state === 'offline'
        ? 'error.main'
        : 'warning.main'

  return (
    <Chip
      aria-live="polite"
      label={`Backend API: ${state}`}
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.07)',
        border: '1px solid rgba(255, 255, 255, 0.13)',
        color: '#f5fbf6',
        fontWeight: 650,
        '&::before': {
          bgcolor: statusColor,
          borderRadius: '50%',
          content: '""',
          height: 10,
          ml: 1.5,
          width: 10,
        },
      }}
    />
  )
}
