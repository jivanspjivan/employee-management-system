import { useEffect, useMemo, useState } from 'react'
import {
  Alert, Avatar, Box, Button, Chip, Collapse, IconButton, Paper, Skeleton, Stack,
  SvgIcon, Tooltip, Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'

import { getOrganizationTreeRequest } from '../api/organization'
import type { OrganizationTreeNode } from '../api/types'

const TreeIcon = () => <SvgIcon><path d="M15 4a3 3 0 1 0-6 0 3 3 0 0 0 2 2.82V9H6a2 2 0 0 0-2 2v2.18A3 3 0 1 0 6 13v-2h5v2.18a3 3 0 1 0 2 0V11h5v2.18a3 3 0 1 0 2 0V11a2 2 0 0 0-2-2h-5V6.82A3 3 0 0 0 15 4Z" /></SvgIcon>
const ChevronIcon = ({ expanded }: { expanded: boolean }) => <SvgIcon sx={{ fontSize: 20, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 160ms ease' }}><path d="m9 18 6-6-6-6-1.4 1.4 4.6 4.6-4.6 4.6L9 18Z" /></SvgIcon>
const ExpandIcon = () => <SvgIcon sx={{ fontSize: 18 }}><path d="M7 14H5v5h5v-2H7v-3Zm-2-4h2V7h3V5H5v5Zm12 7h-3v2h5v-5h-2v3ZM14 5v2h3v3h2V5h-5Z" /></SvgIcon>
const CollapseIcon = () => <SvgIcon sx={{ fontSize: 18 }}><path d="M5 16h3v3h2v-5H5v2Zm3-8H5v2h5V5H8v3Zm6 11h2v-3h3v-2h-5v5Zm2-11V5h-2v5h5V8h-3Z" /></SvgIcon>
const ViewIcon = () => <SvgIcon sx={{ fontSize: 17 }}><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5ZM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></SvgIcon>

const roleLabel = (role: string) => role.split('_').map((word) => word[0] + word.slice(1).toLowerCase()).join(' ')
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
const roleStyles = {
  EMPLOYEE: { bgcolor: '#e7ece9', border: '1px solid #d1d9d4', color: '#4e5d54' },
  HR_MANAGER: { bgcolor: '#dfeaf7', border: '1px solid #c5d8ec', color: '#285f91' },
  SUPER_ADMIN: { bgcolor: '#e9e0f5', border: '1px solid #d7c7ea', color: '#66428d' },
}

const flatten = (nodes: OrganizationTreeNode[]): OrganizationTreeNode[] => nodes.flatMap((node) => [node, ...flatten(node.directReports)])

type TreeNodeProps = {
  depth: number
  expandedIds: Set<string>
  node: OrganizationTreeNode
  onNavigate: (id: string) => void
  onToggle: (id: string) => void
}

const TreeNode = ({ depth, expandedIds, node, onNavigate, onToggle }: TreeNodeProps) => {
  const hasReports = node.directReports.length > 0
  const expanded = expandedIds.has(node.id)

  return <Box sx={{ ml: { xs: `${Math.min(depth, 5) * 14}px`, sm: `${Math.min(depth, 7) * 26}px` }, position: 'relative', ...(depth > 0 && { '&::before': { bgcolor: '#9fb7a6', content: '""', height: 'calc(100% + 10px)', left: { xs: -9, sm: -15 }, position: 'absolute', top: -10, width: '2px' }, '&::after': { bgcolor: '#9fb7a6', content: '""', height: '2px', left: { xs: -9, sm: -15 }, position: 'absolute', top: 28, width: { xs: 9, sm: 15 } } }) }}>
    <Paper elevation={0} sx={{ border: '1px solid #dfe7e1', borderLeft: hasReports ? '3px solid #6b9b79' : '1px solid #dfe7e1', borderRadius: 2, boxShadow: '0 4px 14px rgba(30,65,42,.045)', mb: 1, overflow: 'hidden', transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease', '&:hover': { borderColor: '#c3d3c7', boxShadow: '0 9px 22px rgba(30,65,42,.09)', transform: 'translateY(-1px)' } }}>
      <Stack direction="row" spacing={{ xs: .6, sm: .9 }} sx={{ alignItems: 'center', minHeight: 50, px: { xs: .8, sm: 1.1 }, py: .4 }}>
        {hasReports ? <Tooltip title={expanded ? 'Collapse reports' : 'Expand reports'}><IconButton aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`} onClick={() => onToggle(node.id)} size="small"><ChevronIcon expanded={expanded} /></IconButton></Tooltip> : <Box sx={{ width: 34 }} />}
        <Avatar src={node.profileImageUrl ?? undefined} sx={{ bgcolor: hasReports ? '#dcebe1' : '#e8edf0', color: hasReports ? '#39704a' : '#617078', fontSize: '.7rem', fontWeight: 720, height: 32, width: 32 }}>{initials(node.name)}</Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}><Stack direction="row" spacing={.7} sx={{ alignItems: 'center' }}><Typography noWrap sx={{ fontSize: '.86rem', fontWeight: 780 }}>{node.name}</Typography><Box sx={{ bgcolor: node.status === 'ACTIVE' ? '#45a064' : '#cc5b5b', border: '2px solid #fff', borderRadius: '50%', flexShrink: 0, height: 9, width: 9 }} /></Stack><Stack direction="row" spacing={.55} sx={{ alignItems: 'center', minWidth: 0 }}><Typography noWrap sx={{ color: '#6a766e', fontSize: '.68rem', fontWeight: 560 }}>{node.designation}</Typography><Typography sx={{ color: '#a1aaa4', fontSize: '.62rem' }}>·</Typography><Typography noWrap sx={{ color: '#8a958e', fontSize: '.65rem' }}>{node.department.name}</Typography><Typography sx={{ color: '#b2bab5', display: { xs: 'none', sm: 'block' }, fontSize: '.6rem' }}>· {node.employeeId}</Typography></Stack></Box>
        <Stack direction="row" spacing={.55} sx={{ alignItems: 'center', bgcolor: '#f7f9f7', border: '1px solid #e7ece8', borderRadius: 1.5, p: .35 }}><Chip label={roleLabel(node.role)} size="small" sx={{ ...roleStyles[node.role], display: { xs: 'none', md: 'inline-flex' }, fontSize: '.63rem', fontWeight: 700, height: 24, '& .MuiChip-label': { px: 1.15 } }} />
        {hasReports && <Chip label={`${node.directReports.length} direct`} size="small" sx={{ bgcolor: '#e5f0e8', border: '1px solid #cfdfd3', color: '#3d6c4d', fontSize: '.62rem', fontWeight: 650, height: 23 }} />}
        <Tooltip title="View employee"><IconButton aria-label={`View ${node.name}`} onClick={() => onNavigate(node.id)} size="small" sx={{ color: '#47759f', height: 28, width: 28, '&:hover': { bgcolor: '#eaf3fb' } }}><ViewIcon /></IconButton></Tooltip></Stack>
      </Stack>
    </Paper>
    {hasReports && <Collapse in={expanded} timeout={180} unmountOnExit><Box>{node.directReports.map((report) => <TreeNode depth={depth + 1} expandedIds={expandedIds} key={report.id} node={report} onNavigate={onNavigate} onToggle={onToggle} />)}</Box></Collapse>}
  </Box>
}

export const OrganizationPage = () => {
  const navigate = useNavigate()
  const [tree, setTree] = useState<OrganizationTreeNode[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    getOrganizationTreeRequest(controller.signal).then(({ data }) => {
      setTree(data.tree)
      setExpandedIds(new Set(data.tree.map((root) => root.id)))
    }).catch((requestError: unknown) => {
      if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : 'Unable to load organization')
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  const employees = useMemo(() => flatten(tree), [tree])
  const managerIds = useMemo(() => employees.filter((employee) => employee.directReports.length).map((employee) => employee.id), [employees])
  const departmentCount = new Set(employees.map((employee) => employee.department.id)).size
  const toggle = (id: string) => setExpandedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next })

  return <Stack spacing={1.25}>
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'flex-end' }, justifyContent: 'space-between' }}><Box><Typography component="h1" sx={{ fontWeight: 750, letterSpacing: '-.03em' }} variant="h4">Organization</Typography><Typography color="text.secondary" sx={{ mt: .4 }}>Explore Playstack’s reporting structure and team relationships.</Typography></Box><Stack direction="row" spacing={1}><Button disabled={loading || managerIds.length === 0} onClick={() => setExpandedIds(new Set())} startIcon={<CollapseIcon />} variant="outlined">Collapse all</Button><Button disabled={loading || managerIds.length === 0} onClick={() => setExpandedIds(new Set(managerIds))} startIcon={<ExpandIcon />} variant="outlined">Expand all</Button></Stack></Stack>
    {error && <Alert severity="error">{error}</Alert>}
    <Paper elevation={0} sx={{ alignItems: 'center', border: '1px solid #dfe7e1', borderRadius: 2.5, boxShadow: '0 7px 20px rgba(30,65,42,.055)', display: 'flex', flexWrap: 'wrap', gap: { xs: 3, sm: 5.5 }, px: 2.2, py: 1.7 }}><Box sx={{ alignItems: 'center', bgcolor: '#e2efe6', borderRadius: 1.7, color: '#39704a', display: 'flex', p: 1 }}><TreeIcon /></Box><Box><Typography sx={{ fontSize: '1.72rem', fontWeight: 900, letterSpacing: '-.045em', lineHeight: .92 }}>{employees.length}</Typography><Typography color="text.secondary" sx={{ fontSize: '.68rem', mt: .5 }}>People</Typography></Box><Box><Typography sx={{ color: '#386b49', fontSize: '1.72rem', fontWeight: 900, letterSpacing: '-.045em', lineHeight: .92 }}>{managerIds.length}</Typography><Typography color="text.secondary" sx={{ fontSize: '.68rem', mt: .5 }}>People managers</Typography></Box><Box><Typography sx={{ color: '#466d99', fontSize: '1.72rem', fontWeight: 900, letterSpacing: '-.045em', lineHeight: .92 }}>{departmentCount}</Typography><Typography color="text.secondary" sx={{ fontSize: '.68rem', mt: .5 }}>Departments</Typography></Box><Box sx={{ ml: { sm: 'auto' } }}><Typography color="text.secondary" sx={{ fontSize: '.7rem' }}><Box component="span" sx={{ color: '#45a064' }}>●</Box> Active&nbsp;&nbsp; <Box component="span" sx={{ color: '#cc5b5b' }}>●</Box> Inactive</Typography></Box></Paper>
    <Paper elevation={0} sx={{ bgcolor: '#f9fbf9', border: '1px solid #dfe7e1', borderRadius: 2.5, boxShadow: '0 8px 24px rgba(30,65,42,.05)', overflow: 'hidden' }}><Stack direction="row" spacing={1} sx={{ alignItems: 'center', bgcolor: '#edf4ef', borderBottom: '1px solid #d9e4dc', color: 'primary.main', px: 2, py: 1.4 }}><TreeIcon /><Box><Typography sx={{ color: 'text.primary', fontSize: '.9rem', fontWeight: 730 }}>Reporting tree</Typography><Typography color="text.secondary" sx={{ fontSize: '.68rem' }}>Select the chevron to expand or collapse direct reports</Typography></Box></Stack><Box sx={{ overflowX: 'hidden', p: { xs: 1, sm: 2 } }}>{loading ? <Stack spacing={1}>{Array.from({ length: 7 }, (_, index) => <Skeleton height={62} key={index} sx={{ ml: `${Math.min(index, 3) * 24}px` }} variant="rounded" />)}</Stack> : tree.length ? tree.map((root) => <TreeNode depth={0} expandedIds={expandedIds} key={root.id} node={root} onNavigate={(employeeId) => navigate(`/employees/${employeeId}`)} onToggle={toggle} />) : <Box sx={{ py: 7, textAlign: 'center' }}><Box sx={{ color: '#83a18c', mb: 1 }}><TreeIcon /></Box><Typography sx={{ fontWeight: 700 }}>No reporting structure found</Typography><Typography color="text.secondary" variant="body2">Assign reporting managers to build the organization tree.</Typography></Box>}</Box></Paper>
  </Stack>
}
