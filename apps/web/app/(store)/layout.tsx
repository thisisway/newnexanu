import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Loja — Nexano',
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Store header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary" />
            <span className="text-base font-semibold text-foreground">Nexano</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <a href="/store" className="hover:text-foreground transition-colors">Produtos</a>
            <a href="/store/domains" className="hover:text-foreground transition-colors">Domínios</a>
            <a href="/portal" className="hover:text-foreground transition-colors">Minha conta</a>
          </nav>
          <a
            href="/login"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Entrar
          </a>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border py-8 mt-16">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Nexano. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}
