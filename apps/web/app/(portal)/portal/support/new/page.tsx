'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { portalTicketsApi } from '@/lib/api/tickets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'

const schema = z.object({
  subject: z.string().min(5, 'Assunto deve ter ao menos 5 caracteres'),
  body: z.string().min(20, 'Descreva o problema com ao menos 20 caracteres'),
  priority: z.string().optional(),
  category: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function NewTicketPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM' },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    setError('')
    try {
      const res = await portalTicketsApi.create(values)
      const ticket = res?.data ?? res
      router.push(`/portal/support/${ticket.id}`)
    } catch {
      setError('Ocorreu um erro ao abrir o chamado. Tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-h2 font-bold text-foreground">Novo chamado</h1>
          <p className="text-sm text-muted-foreground">Descreva seu problema e nossa equipe irá atendê-lo.</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Detalhes do chamado</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Assunto <span className="text-destructive">*</span></Label>
              <Input id="subject" placeholder="Ex.: Não consigo acessar minha conta" {...register('subject')} />
              {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Prioridade</Label>
                <Select defaultValue="MEDIUM" onValueChange={(v) => setValue('priority', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baixa</SelectItem>
                    <SelectItem value="MEDIUM">Média</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="CRITICAL">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select onValueChange={(v) => setValue('category', v === 'none' ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geral</SelectItem>
                    <SelectItem value="billing">Faturamento</SelectItem>
                    <SelectItem value="technical">Técnico</SelectItem>
                    <SelectItem value="account">Conta</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="body">Descrição <span className="text-destructive">*</span></Label>
              <Textarea
                id="body"
                placeholder="Descreva o problema em detalhes. Quanto mais informação você fornecer, mais rápido poderemos ajudar."
                rows={6}
                {...register('body')}
              />
              {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" loading={submitting}>
                Abrir chamado
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
