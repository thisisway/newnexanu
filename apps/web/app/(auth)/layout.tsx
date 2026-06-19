export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — decorative */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#070A12] p-10 lg:flex">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #635BFF 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, #4338CA 0%, transparent 50%)`,
          }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px),
                             linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <span className="text-base font-bold text-white">N</span>
          </div>
          <span className="text-lg font-bold text-white">Nexano</span>
        </div>

        {/* Testimonial / tagline */}
        <div className="relative z-10">
          <blockquote className="space-y-2">
            <p className="text-xl font-medium leading-relaxed text-white/90">
              "Billing, automação e cloud para vender serviços digitais sem complicação."
            </p>
          </blockquote>
          <div className="mt-8 space-y-3">
            {[
              'Multi-tenant desde a fundação',
              'Checkout otimizado para conversão',
              'Provisionamento em tempo real',
              'PIX, cartão e boleto nativos',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-white/70">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-white">N</span>
          </div>
          <span className="text-base font-bold">Nexano</span>
        </div>

        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
