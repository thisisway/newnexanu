'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, Plus, Search, Filter, Building2, User,
  MoreHorizontal, Eye, Pencil, Trash2, RefreshCw,
} from 'lucide-react'
import { clientsApi, Client } from '@/lib/api/clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { DataTable, Pagination, Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ClientFormDrawer } from './components/client-form-drawer'

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>()

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await clientsApi.list({ search: search || undefined, status: status || undefined, type: type || undefined, page, limit: 20 })
      setClients(res.data)
      setMeta(res.meta)
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }, [search, status, type, page])

  useEffect(() => {
    const t = setTimeout(fetchClients, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchClients, search])

  function handleEdit(client: Client) {
    setEditingClient(client)
    setDrawerOpen(true)
  }

  function handleNew() {
    setEditingClient(undefined)
    setDrawerOpen(true)
  }

  async function handleDelete(client: Client) {
    if (!confirm(`Excluir ${client.name}? Esta ação não pode ser desfeita.`)) return
    await clientsApi.delete(client.id)
    fetchClients()
  }

  function handleSuccess() {
    setDrawerOpen(false)
    fetchClients()
  }

  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: 'Cliente',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            {row.type === 'COMPANY' ? (
              <Building2 className="h-4 w-4 text-primary" />
            ) : (
              <User className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'document',
      header: 'Documento',
      cell: (row) => (
        <span className="text-muted-foreground">
          {row.document ? `${row.documentType === 'CPF' ? 'CPF' : 'CNPJ'}: ${row.document}` : '—'}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Telefone',
      cell: (row) => <span className="text-muted-foreground">{row.phone || row.mobile || '—'}</span>,
    },
    {
      key: 'type',
      header: 'Tipo',
      cell: (row) => (
        <Badge variant="outline" className="text-xs">
          {row.type === 'COMPANY' ? 'Empresa' : 'Pessoa Física'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-10',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/clients/${row.id}`) }}>
              <Eye className="mr-2 h-4 w-4" /> Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(row) }}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); handleDelete(row) }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 font-semibold text-foreground">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta.total} cliente{meta.total !== 1 ? 's' : ''} cadastrado{meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleNew} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Novo cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] max-w-sm">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Buscar por nome, e-mail ou documento..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ACTIVE">Ativo</SelectItem>
            <SelectItem value="INACTIVE">Inativo</SelectItem>
            <SelectItem value="SUSPENDED">Suspenso</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type || 'all'} onValueChange={(v) => { setType(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="INDIVIDUAL">Pessoa Física</SelectItem>
            <SelectItem value="COMPANY">Empresa</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => fetchClients()} title="Atualizar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div>
        <DataTable
          columns={columns}
          data={clients}
          loading={loading}
          onRowClick={(row) => router.push(`/admin/clients/${row.id}`)}
          emptyState={
            <EmptyState
              icon={Users}
              title="Nenhum cliente encontrado"
              description={search ? 'Tente outro termo de busca.' : 'Cadastre seu primeiro cliente para começar.'}
              actions={search ? undefined : [{ label: 'Novo cliente', onClick: handleNew }]}
            />
          }
        />
        {meta.total > 0 && (
          <Pagination
            page={page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Drawer */}
      <ClientFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleSuccess}
        client={editingClient}
      />
    </div>
  )
}
