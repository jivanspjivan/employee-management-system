import { useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  SvgIcon,
  TextField,
  Typography,
} from '@mui/material'

import { forgotPasswordRequest } from '../auth/auth-api'
import { ApiError } from '../api/client'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginPageProps {
  onLogin: (credentials: LoginCredentials) => void | Promise<void>
  loading?: boolean
  error?: string | null
}

const MailIcon = () => <SvgIcon sx={{ fontSize: 20 }}><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z" /></SvgIcon>
const LockIcon = () => <SvgIcon sx={{ fontSize: 20 }}><path d="M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2Zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm3-9H9V6a3 3 0 0 1 6 0v2Z" /></SvgIcon>
const EyeIcon = ({ hidden }: { hidden: boolean }) => <SvgIcon sx={{ fontSize: 19 }}><path d={hidden ? 'M12 6c3.79 0 7.17 2.13 8.82 5.5a9.9 9.9 0 0 1-2.19 2.93l1.42 1.42A11.93 11.93 0 0 0 23 11.5C21.27 7.39 17.21 4.5 12 4.5c-1.3 0-2.54.18-3.7.52l1.68 1.68A8.2 8.2 0 0 1 12 6Zm-9.27-3L1.45 4.27l2.36 2.36A11.9 11.9 0 0 0 1 11.5c1.73 4.11 5.79 7 11 7 1.52 0 2.96-.25 4.28-.7l3.45 3.45L21 19.97 2.73 3ZM12 17c-3.79 0-7.17-2.13-8.82-5.5a9.8 9.8 0 0 1 2.05-2.79l1.54 1.54A5.46 5.46 0 0 0 6.5 12a5.5 5.5 0 0 0 7.25 5.23l.74.74c-.79.2-1.62.31-2.49.31Zm-.18-9.99 3.67 3.67A3.5 3.5 0 0 0 11.82 7.01Z' : 'M12 4.5c-5 0-9.27 2.9-11 7 1.73 4.1 6 7 11 7s9.27-2.9 11-7c-1.73-4.1-6-7-11-7Zm0 11.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm0-7.2a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4Z'} /></SvgIcon>
const CheckIcon = () => <SvgIcon sx={{ fontSize: 17 }}><path d="m9 16.17-3.88-3.88L3.7 13.7 9 19 21 7l-1.41-1.41z" /></SvgIcon>
const ArrowIcon = () => <SvgIcon sx={{ fontSize: 19 }}><path d="m12 4-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8Z" /></SvgIcon>

const OrganizationIllustration = () => (
  <Box
    aria-hidden
    component="svg"
    viewBox="0 0 390 150"
    sx={{ display: { xs: 'none', md: 'block' }, height: 158, mt: 2.25, overflow: 'visible', transform: 'scale(1.04)', transformOrigin: 'center', width: '100%' }}
  >
    <defs>
      <linearGradient id="illustration-card" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity=".16" />
        <stop offset="1" stopColor="#ffffff" stopOpacity=".07" />
      </linearGradient>
      <filter id="illustration-shadow" height="140%" width="140%" x="-20%" y="-20%">
        <feDropShadow dx="0" dy="5" floodColor="#0d2417" floodOpacity=".2" stdDeviation="6" />
      </filter>
    </defs>

    <rect fill="#ffffff" fillOpacity=".035" height="140" rx="18" stroke="#ffffff" strokeOpacity=".1" width="382" x="4" y="4" />
    <circle cx="337" cy="35" fill="none" r="21" stroke="#bce6c7" strokeDasharray="3 5" strokeOpacity=".22" />
    <circle cx="38" cy="119" fill="#bce6c7" fillOpacity=".08" r="14" />

    <path d="M195 50v18M76 68h238M76 68v18M195 68v18M314 68v18" fill="none" stroke="#c8ebd1" strokeLinecap="round" strokeOpacity=".45" strokeWidth="1.5" />

    <g filter="url(#illustration-shadow)">
      <rect fill="url(#illustration-card)" height="42" rx="11" stroke="#ffffff" strokeOpacity=".2" width="142" x="124" y="9" />
      <circle cx="147" cy="30" fill="#bde8c8" fillOpacity=".9" r="10" />
      <path d="M142 33c1.5-3 8.5-3 10 0" fill="none" stroke="#28623e" strokeLinecap="round" strokeWidth="2" />
      <circle cx="147" cy="27" fill="#28623e" r="3" />
      <rect fill="#ffffff" fillOpacity=".86" height="4" rx="2" width="65" x="164" y="23" />
      <rect fill="#c8ebd1" fillOpacity=".55" height="3" rx="1.5" width="43" x="164" y="32" />
    </g>

    {[
      { x: 24, name: 60, bar: 43 },
      { x: 143, name: 62, bar: 48 },
      { x: 262, name: 58, bar: 38 },
    ].map((node, index) => (
      <g filter="url(#illustration-shadow)" key={node.x}>
        <rect fill="url(#illustration-card)" height="49" rx="11" stroke="#ffffff" strokeOpacity=".16" width="104" x={node.x} y="86" />
        <circle cx={node.x + 18} cy="104" fill={index === 1 ? '#d8e8ff' : '#c7ead0'} fillOpacity=".9" r="8" />
        <rect fill="#ffffff" fillOpacity=".8" height="3.5" rx="1.75" width={node.name} x={node.x + 32} y="98" />
        <rect fill="#ffffff" fillOpacity=".38" height="3" rx="1.5" width={node.bar} x={node.x + 32} y="107" />
        <rect fill="#bde8c8" fillOpacity=".22" height="9" rx="4.5" width="38" x={node.x + 12} y="119" />
        <rect fill="#ffffff" fillOpacity=".16" height="9" rx="4.5" width="31" x={node.x + 56} y="119" />
      </g>
    ))}
  </Box>
)

const inputStyles = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#f8faf8',
    borderRadius: 2.25,
    minHeight: 54,
    px: .5,
    transition: 'background-color 220ms ease, box-shadow 220ms ease',
    '& fieldset': { borderColor: '#98aa9e', transition: 'border-color 220ms ease, border-width 220ms ease' },
    '&:hover': { bgcolor: '#fff', '& fieldset': { borderColor: '#66816e' } },
    '&.Mui-focused': { bgcolor: '#fff', boxShadow: '0 0 0 4px rgba(47,112,69,.11)', '& fieldset': { borderColor: '#2f7045', borderWidth: 2 } },
  },
  '& .MuiInputBase-input': { py: 1.7 },
  '& .MuiInputAdornment-positionStart': { ml: .75, mr: 1.25 },
  '& .MuiInputAdornment-positionEnd': { ml: 1, mr: .5 },
  '& .MuiInputLabel-root': { color: '#52665a', fontWeight: 600 },
  '& .MuiInputLabel-root.Mui-focused': { color: '#2f7045' },
}

export function LoginPage({ onLogin, loading = false, error = null }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState<{ severity: 'error' | 'success'; text: string } | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void onLogin({ email: email.trim(), password })
  }

  const requestReset = async () => {
    if (!/^\S+@\S+\.\S+$/.test(resetEmail.trim())) {
      setResetMessage({ severity: 'error', text: 'Enter a valid work email address.' })
      return
    }
    setResetLoading(true)
    setResetMessage(null)
    try {
      const response = await forgotPasswordRequest(resetEmail.trim().toLowerCase())
      setResetMessage({ severity: 'success', text: response.message })
    } catch (requestError) {
      setResetMessage({ severity: 'error', text: requestError instanceof ApiError ? requestError.message : 'Unable to submit the request.' })
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <Box
      component="main"
      sx={{
        alignItems: 'center',
        backgroundColor: '#edf3ef',
        backgroundImage: 'radial-gradient(circle at 15% 15%, rgba(72,132,91,.14), transparent 27%), radial-gradient(circle at 88% 85%, rgba(47,112,69,.1), transparent 24%)',
        display: 'flex',
        minHeight: '100dvh',
        overflow: 'hidden',
        p: { xs: 1.5, sm: 3, lg: 4 },
        position: 'relative',
      }}
    >
      <Box aria-hidden sx={{ border: '1px solid rgba(47,112,69,.09)', borderRadius: '50%', height: 320, left: -150, position: 'absolute', top: -170, width: 320 }} />
      <Box aria-hidden sx={{ bgcolor: 'rgba(255,255,255,.45)', borderRadius: 6, bottom: -75, height: 170, position: 'absolute', right: '8%', transform: 'rotate(-18deg)', width: 170 }} />

      <Paper elevation={0} sx={{ border: '1px solid rgba(45,83,57,.1)', borderRadius: { xs: 3, md: 4 }, boxShadow: '0 24px 65px rgba(25,57,36,.14)', display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.03fr) minmax(420px, .97fr)' }, margin: 'auto', maxWidth: 1040, minHeight: { md: 600 }, overflow: 'hidden', position: 'relative', width: '100%' }}>
        <Box sx={{ background: 'linear-gradient(145deg,#173c29 0%,#28623e 58%,#3d7b52 100%)', color: '#fff', display: 'flex', flexDirection: 'column', minHeight: { xs: 190, md: 'auto' }, overflow: 'hidden', p: { xs: 3, sm: 4, md: 5 }, position: 'relative' }}>
          <Box aria-hidden sx={{ border: '1px solid rgba(255,255,255,.13)', borderRadius: '50%', height: 280, position: 'absolute', right: -100, top: -120, width: 280 }} />
          <Box aria-hidden sx={{ bgcolor: 'rgba(255,255,255,.055)', borderRadius: 5, bottom: 55, height: 145, position: 'absolute', right: 45, transform: 'rotate(24deg)', width: 145 }} />
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', position: 'relative' }}>
            <Box sx={{ bgcolor: 'rgba(255,255,255,.13)', border: '1px solid rgba(255,255,255,.17)', borderRadius: 2.25, display: 'grid', fontSize: '.72rem', fontWeight: 850, height: 40, letterSpacing: '-.06em', placeItems: 'center', width: 40 }}>PS</Box>
            <Box><Typography sx={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1 }}>Playstack</Typography><Typography sx={{ color: 'rgba(255,255,255,.6)', fontSize: '.61rem', letterSpacing: '.12em', mt: .45, textTransform: 'uppercase' }}>People workspace</Typography></Box>
          </Stack>

          <Box sx={{ my: { xs: 3, md: 'auto' }, maxWidth: 410, position: 'relative' }}>
            <Typography sx={{ color: '#bce6c7', fontSize: '.72rem', fontWeight: 750, letterSpacing: '.12em', textTransform: 'uppercase' }}>Employee management, simplified</Typography>
            <Typography component="h2" sx={{ fontSize: { xs: '1.7rem', md: '2.55rem' }, fontWeight: 780, letterSpacing: '-.045em', lineHeight: 1.12, mt: 1.4 }}>Bring your people and organization together.</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,.7)', display: { xs: 'none', sm: 'block' }, fontSize: '.88rem', lineHeight: 1.7, mt: 1.8 }}>A focused workspace for employee records, departments, reporting structures, and everyday people operations.</Typography>
            <OrganizationIllustration />
            <Stack spacing={1.1} sx={{ display: { xs: 'none', md: 'flex' }, mt: 2.25 }}>
              {['Secure role-based access', 'Clear reporting hierarchy', 'Real-time workforce overview'].map((feature) => <Stack direction="row" key={feature} spacing={1} sx={{ alignItems: 'center' }}><Box sx={{ bgcolor: 'rgba(185,234,198,.13)', borderRadius: '50%', color: '#bfe9ca', display: 'flex', p: .35 }}><CheckIcon /></Box><Typography sx={{ color: 'rgba(255,255,255,.82)', fontSize: '.8rem', fontWeight: 580 }}>{feature}</Typography></Stack>)}
            </Stack>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,.42)', display: { xs: 'none', md: 'block' }, fontSize: '.67rem', position: 'relative' }}>Built for modern teams at Playstack</Typography>
        </Box>

        <Stack component="form" onSubmit={handleSubmit} sx={{ justifyContent: 'center', p: { xs: 3, sm: 5, md: 6 } }}>
          <Box sx={{ mb: 3.5 }}>
            <Typography color="primary.main" sx={{ fontSize: '.72rem', fontWeight: 760, letterSpacing: '.1em', textTransform: 'uppercase' }}>Welcome back</Typography>
            <Typography component="h1" sx={{ fontSize: { xs: '1.85rem', sm: '2.2rem' }, fontWeight: 790, letterSpacing: '-.04em', lineHeight: 1.15, mt: .75 }}>Sign in to Playstack</Typography>
            <Typography color="text.secondary" sx={{ fontSize: '.86rem', mt: 1 }}>Use your work credentials to continue.</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2.25 }}>{error}</Alert>}
          <Stack spacing={2.2}>
            <TextField autoComplete="email" autoFocus disabled={loading} fullWidth label="Email address" onChange={(event) => setEmail(event.target.value)} required slotProps={{ input: { startAdornment: <InputAdornment position="start"><Box sx={{ color: 'text.secondary', display: 'flex' }}><MailIcon /></Box></InputAdornment> } }} sx={inputStyles} type="email" value={email} />
            <TextField autoComplete="current-password" disabled={loading} fullWidth label="Password" onChange={(event) => setPassword(event.target.value)} required slotProps={{ input: { startAdornment: <InputAdornment position="start"><Box sx={{ color: 'text.secondary', display: 'flex' }}><LockIcon /></Box></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((current) => !current)} size="small"><EyeIcon hidden={showPassword} /></IconButton></InputAdornment> } }} sx={inputStyles} type={showPassword ? 'text' : 'password'} value={password} />
            <Button onClick={() => { setResetEmail(email); setResetMessage(null); setForgotOpen(true) }} size="small" sx={{ alignSelf: 'flex-end', mb: .5, mt: '.25rem !important' }} type="button" variant="text">Forgot password?</Button>
            <Button disabled={loading} endIcon={!loading ? <ArrowIcon /> : undefined} size="large" startIcon={loading ? <CircularProgress color="inherit" size={18} /> : undefined} sx={{ boxShadow: '0 8px 18px rgba(47,112,69,.22)', fontWeight: 720, minHeight: 48, mt: .4, '& .MuiButton-endIcon': { transition: 'transform 180ms ease' }, '&:hover': { boxShadow: '0 11px 24px rgba(47,112,69,.28)', transform: 'translateY(-1px)', '& .MuiButton-endIcon': { transform: 'translateX(4px)' } } }} type="submit" variant="contained">{loading ? 'Signing in…' : 'Sign in'}</Button>
          </Stack>
          <Typography color="text.secondary" sx={{ fontSize: '.68rem', mt: 3, textAlign: 'center' }}>Protected by secure, role-based authentication</Typography>
        </Stack>
      </Paper>
      <Dialog fullWidth maxWidth="xs" onClose={() => !resetLoading && setForgotOpen(false)} open={forgotOpen}>
        <DialogTitle>Request a password reset</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ fontSize: '.84rem', mb: 2 }}>A Super Admin will receive your request and provide you with a temporary password.</Typography>
          {resetMessage && <Alert severity={resetMessage.severity} sx={{ mb: 2 }}>{resetMessage.text}</Alert>}
          <TextField autoFocus disabled={resetLoading || resetMessage?.severity === 'success'} fullWidth label="Work email" onChange={(event) => setResetEmail(event.target.value)} type="email" value={resetEmail} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button disabled={resetLoading} onClick={() => setForgotOpen(false)}>Close</Button>
          {resetMessage?.severity !== 'success' && <Button disabled={resetLoading} onClick={() => void requestReset()} variant="contained">{resetLoading ? 'Submitting…' : 'Send request'}</Button>}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LoginPage
