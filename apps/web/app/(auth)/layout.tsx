export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — decorative */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden p-10 lg:flex"
        style={{ background: 'linear-gradient(135deg, hsl(267 66% 18%) 0%, hsl(267 66% 10%) 100%)' }}
      >
        {/* Gradient orbs */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse at 20% 20%, hsl(267 66% 60% / 0.25) 0%, transparent 60%),
                             radial-gradient(ellipse at 80% 80%, hsl(306 58% 47% / 0.20) 0%, transparent 60%)`,
          }}
        />

        {/* Subtle dots grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
            <span className="text-base font-bold text-white font-heading">N</span>
          </div>
          <span className="text-lg font-bold text-white font-heading tracking-tight">Nexano</span>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <p className="text-2xl font-bold leading-snug text-white/90 font-heading mb-3">
            Billing e automação para serviços digitais.
          </p>
          <p className="text-sm text-white/50 mb-8 leading-relaxed">
            Gerencie clientes, faturas, domínios e servidores em um só lugar.
          </p>
          <div className="space-y-3">
            {[
              'Multi-tenant desde a fundação',
              'Checkout otimizado para conversão',
              'Provisionamento em tempo real',
              'PIX, cartão e boleto nativos',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 text-sm text-white/65">
                <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-white/10">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <span className="text-sm font-bold text-white font-heading">N</span>
          </div>
          <span className="text-base font-bold font-heading tracking-tight">Nexano</span>
        </div>

        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
