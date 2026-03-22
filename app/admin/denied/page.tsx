export default function AdminDenied() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;900&family=Instrument+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#07101f;font-family:'Instrument Sans',sans-serif}
      `}</style>
      <div style={{ minHeight: '100vh', background: '#07101f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
        <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,.06), transparent 70%)', pointerEvents: 'none' }}/>
        <div style={{ textAlign: 'center', maxWidth: 400, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 28, fontWeight: 900, color: '#e8f0fa', letterSpacing: -.5, marginBottom: 10 }}>Accès refusé</div>
          <div style={{ fontSize: 14, color: '#4a5a72', lineHeight: 1.65, maxWidth: 300, margin: '0 auto 32px' }}>
            Vous n&apos;avez pas les permissions nécessaires pour accéder au panneau d&apos;administration.
          </div>
          <a href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 24px', background: '#0d1927', border: '1px solid rgba(255,255,255,.1)', borderRadius: 11, color: '#8899b0', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Retour au tableau de bord
          </a>
          <div style={{ fontSize: 11, color: '#2a3a52', marginTop: 20 }}>403 Forbidden · Admin role required</div>
        </div>
      </div>
    </>
  )
}
