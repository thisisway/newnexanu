'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f5f5f5' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', padding: '2rem', textAlign: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: '1rem', padding: '2.5rem', maxWidth: '480px',
            width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111', marginBottom: '0.5rem' }}>
              Ocorreu um erro
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              O aplicativo encontrou um problema inesperado.
            </p>
            {error?.message && (
              <pre style={{
                background: '#f5f5f5', borderRadius: '0.5rem', padding: '1rem',
                fontSize: '0.75rem', color: '#444', textAlign: 'left',
                overflowX: 'auto', marginBottom: '1.5rem', whiteSpace: 'pre-wrap',
              }}>
                {error.message}
                {error.digest && `\n\nDigest: ${error.digest}`}
              </pre>
            )}
            <button
              onClick={reset}
              style={{
                background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '0.75rem',
                padding: '0.625rem 1.5rem', fontSize: '0.875rem', fontWeight: 600,
                cursor: 'pointer', width: '100%',
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
