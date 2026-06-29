'use client'

import { useEffect } from 'react'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[RootError]', error)
  }, [error])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '2rem', textAlign: 'center',
      fontFamily: 'system-ui, sans-serif', background: '#f9fafb',
    }}>
      <div style={{
        background: '#fff', borderRadius: '1rem', padding: '2.5rem', maxWidth: '480px',
        width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
        </div>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
          Algo deu errado
        </h1>
        {error?.message && (
          <pre style={{
            background: '#f3f4f6', borderRadius: '0.5rem', padding: '0.75rem',
            fontSize: '0.75rem', color: '#374151', textAlign: 'left',
            overflowX: 'auto', marginBottom: '1.5rem', whiteSpace: 'pre-wrap',
            maxHeight: '200px', overflowY: 'auto',
          }}>
            {error.message}
            {error.digest && `\n\nDigest: ${error.digest}`}
          </pre>
        )}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={reset}
            style={{
              flex: 1, background: '#7c3aed', color: '#fff', border: 'none',
              borderRadius: '0.75rem', padding: '0.625rem 1rem', fontSize: '0.875rem',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            style={{
              flex: 1, background: 'transparent', color: '#374151',
              border: '1px solid #d1d5db', borderRadius: '0.75rem', padding: '0.625rem 1rem',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Ir para login
          </button>
        </div>
      </div>
    </div>
  )
}
