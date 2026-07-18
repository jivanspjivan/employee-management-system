import { useCallback, useEffect, useState } from 'react'
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Pagination, Paper, Stack, SvgIcon, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography,
} from '@mui/material'

import { ApiError } from '../api/client'
import {
  listPasswordResetRequests, resolvePasswordResetRequest, type PasswordResetRequest,
} from '../auth/auth-api'

const formatRequestedAt = (value: string) => new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value))

const PAGE_SIZE = 8
const BellIcon = () => <SvgIcon><path d="M12 22a2.01 2.01 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6v-5a6 6 0 0 0-5-5.91V4a1 1 0 0 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z" /></SvgIcon>
const KeyIcon = () => <SvgIcon sx={{ fontSize: 20 }}><path d="M7 14a5 5 0 1 1 4.58-7H22v4h-2v2h-3v2h-5.42A5 5 0 0 1 7 18a5 5 0 0 1 0-4Zm0 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></SvgIcon>
const StatusIcon = ({ completed }: { completed: boolean }) => <SvgIcon sx={{ fontSize: 17 }}><path d={completed ? 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9Z' : 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 11h-2V7h2v6Zm0 4h-2v-2h2v2Z'} /></SvgIcon>

export const PasswordResetRequestsPage = () => {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(requests.length / PAGE_SIZE))
  const visibleRequests = requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await listPasswordResetRequests()
      setRequests(response.data.requests)
      setPage(1)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to load password reset requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const resolve = async (request: PasswordResetRequest) => {
    setResolvingId(request.id)
    setError(null)
    try {
      const response = await resolvePasswordResetRequest(request.id)
      setCopied(false)
      setTemporaryPassword(response.data.temporaryPassword)
      setRequests((current) => current.map((item) => item.id === request.id ? { ...item, resolvedAt: new Date().toISOString() } : item))
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to reset the employee password')
    } finally {
      setResolvingId(null)
    }
  }

  const copyPassword = async () => {
    if (!temporaryPassword) return
    await navigator.clipboard.writeText(temporaryPassword)
    setCopied(true)
  }

  return (
    <Stack spacing={{ xs: 1.5, sm: 2.5 }}>
      <Stack direction="row" spacing={1.15} sx={{ alignItems: 'center' }}>
        <Box sx={{ alignItems: 'center', bgcolor: '#e7f1ea', border: '1px solid #d2e3d7', borderRadius: 2, color: 'primary.main', display: 'flex', height: { xs: 38, sm: 44 }, justifyContent: 'center', width: { xs: 38, sm: 44 } }}><BellIcon /></Box>
        <Box>
          <Typography component="h1" sx={{ fontSize: { xs: '1.45rem', md: '1.8rem' }, fontWeight: 760, lineHeight: 1.15 }}>Notifications</Typography>
          <Typography color="text.secondary" sx={{ fontSize: { xs: '.76rem', sm: '.875rem' }, mt: .25 }}>Review administrative activity.</Typography>
        </Box>
      </Stack>

      <Alert severity="info" sx={{ '& .MuiAlert-message': { fontSize: { xs: '.75rem', sm: '.875rem' }, py: { xs: .25, sm: .5 } } }}>For password recovery notifications, generated temporary passwords are shown only once and must be shared privately.</Alert>
      {error && <Alert action={<Button onClick={() => void load()}>Retry</Button>} severity="error">{error}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid #dce5df', borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'grid', minHeight: 220, placeItems: 'center' }}><CircularProgress /></Box>
        ) : requests.length === 0 ? (
          <Box sx={{ alignItems: 'center', background: 'linear-gradient(180deg,#f8fbf9,#fff)', display: 'flex', flexDirection: 'column', px: 2, py: { xs: 5, sm: 8 }, textAlign: 'center' }}>
            <Box sx={{ alignItems: 'center', bgcolor: '#e7f1ea', border: '1px solid #d2e3d7', borderRadius: '50%', color: 'primary.main', display: 'flex', height: { xs: 56, sm: 68 }, justifyContent: 'center', mb: { xs: 1.4, sm: 2 }, width: { xs: 56, sm: 68 } }}><BellIcon /></Box>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 760 }}>You’re all caught up</Typography>
            <Typography color="text.secondary" sx={{ fontSize: '.84rem', lineHeight: 1.6, maxWidth: 390, mt: .6 }}>There are no administrative notifications right now. New activity will be shown here automatically.</Typography>
          </Box>
        ) : (
          <>
            <Stack spacing={1.25} sx={{ display: { xs: 'flex', sm: 'none' }, p: 1.25 }}>
              {visibleRequests.map((request) => (
                <Paper elevation={0} key={request.id} sx={{ border: '1px solid #dbe5de', borderRadius: 2.25, boxShadow: '0 5px 14px rgba(30,65,42,.06)', overflow: 'hidden' }}>
                  <Box sx={{ p: 1.5 }}>
                    <Stack direction="row" spacing={1.1} sx={{ alignItems: 'flex-start' }}>
                      <Box sx={{ alignItems: 'center', bgcolor: '#e8f1ff', borderRadius: 1.75, color: '#3970a8', display: 'flex', flexShrink: 0, height: 38, justifyContent: 'center', width: 38 }}><KeyIcon /></Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 760, lineHeight: 1.25 }}>Password recovery</Typography>
                        <Typography color="text.secondary" sx={{ fontSize: '.76rem', lineHeight: 1.45, mt: .45 }}>Employee cannot access their account</Typography>
                      </Box>
                      <Chip color={request.resolvedAt ? 'success' : 'warning'} icon={<StatusIcon completed={Boolean(request.resolvedAt)} />} label={request.resolvedAt ? 'Completed' : 'Pending'} size="small" sx={{ flexShrink: 0, fontSize: '.65rem', fontWeight: 700 }} />
                    </Stack>
                    <Box sx={{ borderTop: '1px solid #e6ece8', mt: 1.35, pt: 1.2 }}>
                      <Typography sx={{ fontSize: '.88rem', fontWeight: 720 }}>{request.employee.name}</Typography>
                      <Typography color="text.secondary" sx={{ fontSize: '.74rem', lineHeight: 1.45, mt: .2, overflowWrap: 'anywhere' }}>{request.employee.email}</Typography>
                      <Typography sx={{ color: '#637169', fontFamily: 'monospace', fontSize: '.68rem', mt: .45 }}>{request.employee.employeeId}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 1.25 }}>
                      <Box><Typography color="text.secondary" sx={{ fontSize: '.62rem', textTransform: 'uppercase' }}>Created</Typography><Typography sx={{ fontSize: '.72rem', fontWeight: 620, mt: .15 }}>{formatRequestedAt(request.requestedAt)}</Typography></Box>
                      {request.resolvedAt ? <Stack direction="row" spacing={.45} sx={{ alignItems: 'center', color: 'success.main' }}><StatusIcon completed /><Typography sx={{ fontSize: '.7rem', fontWeight: 650 }}>Completed</Typography></Stack> : <Button disabled={Boolean(resolvingId)} onClick={() => void resolve(request)} size="small" variant="contained">{resolvingId === request.id ? 'Generating…' : 'Generate password'}</Button>}
                    </Stack>
                  </Box>
                </Paper>
              ))}
            </Stack>
            <TableContainer sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Table aria-label="Administrative notifications" sx={{ minWidth: 1050 }}>
              <TableHead><TableRow sx={{ bgcolor: '#e5eee8' }}><TableCell>Notification</TableCell><TableCell>Employee</TableCell><TableCell>Employee ID</TableCell><TableCell>Status</TableCell><TableCell>Created</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
              <TableBody>{visibleRequests.map((request) => (
                <TableRow hover key={request.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell><Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}><Box sx={{ alignItems: 'center', bgcolor: '#edf4ff', borderRadius: 2, color: '#3970a8', display: 'flex', flexShrink: 0, height: 38, justifyContent: 'center', width: 38 }}><KeyIcon /></Box><Box><Typography sx={{ fontWeight: 720 }}>Password recovery</Typography><Typography color="text.secondary" sx={{ fontSize: '.72rem' }}>Employee cannot access their account</Typography></Box></Stack></TableCell>
                  <TableCell><Typography sx={{ fontWeight: 700 }}>{request.employee.name}</Typography><Typography color="text.secondary" sx={{ fontSize: '.74rem' }}>{request.employee.email}</Typography></TableCell>
                  <TableCell>{request.employee.employeeId}</TableCell>
                  <TableCell><Chip color={request.resolvedAt ? 'success' : 'warning'} icon={<StatusIcon completed={Boolean(request.resolvedAt)} />} label={request.resolvedAt ? 'Completed' : 'Pending'} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                  <TableCell>{formatRequestedAt(request.requestedAt)}</TableCell>
                  <TableCell align="right">{request.resolvedAt ? <Stack direction="row" spacing={.6} sx={{ alignItems: 'center', color: 'success.main', justifyContent: 'flex-end' }}><StatusIcon completed /><Typography sx={{ fontSize: '.76rem', fontWeight: 650 }}>{formatRequestedAt(request.resolvedAt)}</Typography></Stack> : <Button disabled={Boolean(resolvingId)} onClick={() => void resolve(request)} variant="contained">{resolvingId === request.id ? 'Generating…' : 'Generate password'}</Button>}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
            </TableContainer>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'center', borderTop: '1px solid #e2e8e3', justifyContent: 'space-between', px: 2.5, py: 1.5 }}>
              <Typography color="text.secondary" sx={{ fontSize: '.78rem' }}>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, requests.length)} of {requests.length}</Typography>
              <Pagination color="primary" count={totalPages} onChange={(_event, value) => setPage(value)} page={page} shape="rounded" size="small" />
            </Stack>
          </>
        )}
      </Paper>

      <Dialog fullWidth maxWidth="xs" onClose={() => setTemporaryPassword(null)} open={Boolean(temporaryPassword)}>
        <DialogTitle>Temporary password generated</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>This password cannot be viewed again after you close this dialog.</Alert>
          <Paper elevation={0} sx={{ bgcolor: '#f4f7f5', border: '1px dashed #9caf9f', p: 2, textAlign: 'center' }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '1.15rem', fontWeight: 800, letterSpacing: '.05em' }}>{temporaryPassword}</Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setTemporaryPassword(null)}>Close</Button>
          <Button onClick={() => void copyPassword()} variant="contained">{copied ? 'Copied' : 'Copy password'}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
