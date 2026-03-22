export default function AdminDenied() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;900&family=Instrument+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#07101f;font-family:'Instrument Sans',sans-serif}
        .page{min-height:100vh;background:#07101f;display:flex;align-items:center;justify-content:center;padding:24px}
        .page::before{content:'';position:fixed;top:0;left:50%;transform:translateX(-50%);width:600px;height:400px;background:radial-gradient(ellipse at 50% 0%,rgba(239,68,68,.08),transparent 70%);pointer-events:none}
        .card{text-align:center;max-width:400px;position:relative;z-index:1}
        .icon{width:72px;height:72px;border-radius:20px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 24px}
        .title{font-family:'Cabinet Grotesk',sans-serif;font-size:28px;font-weight:900;color:#e8f0fa;letter-spacing:-.5px;margin-bottom:10px}
        .sub{font-size:14px;color:#4a5a72;line-height:1.65;max-width:300px;margin:0 auto 32px}
        .btn{display:inline-flex;align-items:center;gap:7px;padding:11px 24px;background:#0d1927;border:1px solid rgba(255,255,255,.1);border-radius:11px;color:#8899b0;font-size:13px;font-weight:500;text-decoration:none;font-family:inherit;transition:all .15s}
        .btn:hover{border-color:rgba(0,180,200,.3);color:#e8f0fa}
        .code{font-size:11px;color:#2a3a52;margin-top:20px;font-family:monospace}
      `}</style>
      <div className="page">
        <div className="card">
          <div className="icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div className="title">Accès refusé</div>
          <div className="sub">
            Vous n&apos;avez pas les permissions nécessaires pour accéder au panneau d&apos;administration.
          </div>
          <a href="/dashboard" className="btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Retour au tableau de bord
          </a>
          <div className="code">403 Forbidden · Admin role required</div>
        </div>
      </div>
    </>
  )
}
