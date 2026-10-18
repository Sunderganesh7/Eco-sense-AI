const fs = require('fs');

let ev = fs.readFileSync('frontend/src/pages/EvidenceAndReasoning.tsx', 'utf8');
const oldEvSkeletonRegex = /if\s*\(\s*loading\s*\)\s*\{\s*return\s*\(\s*<div\s+className="main-content"[\s\S]*?\);\s*\}/;
const newEvSkeleton = `
  if (loading || !profile) {
    return (
      <div className="main-content" style={{ width: '92%', margin: '0 auto', maxWidth: '1400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div style={{ maxWidth: '650px' }}>
            <button 
              type="button"
              onClick={() => navigate('/')} 
              style={{ 
                display: 'inline-flex', alignItems: 'center', gap: '6px', 
                marginBottom: '16px', padding: '6px 12px', fontSize: '0.85rem',
                background: 'transparent', border: '1px solid var(--color-border)',
                borderRadius: '20px', color: 'var(--color-text-secondary)', cursor: 'pointer',
                transition: 'background var(--transition-fast)'
              }}
            >
              <ArrowLeft size={16} /> Back to Overview
            </button>
            <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--color-primary-dark)', fontWeight: 700, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              Evidence & Reasoning
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '1rem', lineHeight: 1.5 }}>
              Trace how environmental observations become evidence-backed recommendations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <button 
              type="button" 
              disabled={true}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                background: 'white', border: '1px solid var(--color-border)',
                borderRadius: '8px', color: 'var(--color-primary)', fontWeight: 600, cursor: 'not-allowed',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <RefreshCw size={18} className="loading-pulse" />
              Loading...
            </button>

            <div style={{ background: 'var(--color-info-bg)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start', width: '240px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ background: 'var(--color-info)', color: 'white', borderRadius: '50%', padding: '8px', display: 'flex', zIndex: 1 }}>
                <Network size={18} />
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary-dark)', zIndex: 1, lineHeight: 1.4 }}>
                Transparent Logic<br/>Verified Science<br/>Trusted Actions
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="skeleton-box" style={{ height: '250px', borderRadius: '16px' }}></div>
            <div className="skeleton-box" style={{ height: '180px', borderRadius: '16px' }}></div>
            <div className="skeleton-box" style={{ height: '180px', borderRadius: '16px' }}></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="skeleton-box" style={{ height: '200px', borderRadius: '16px' }}></div>
            <div className="skeleton-box" style={{ height: '250px', borderRadius: '16px' }}></div>
            <div className="skeleton-box" style={{ height: '300px', borderRadius: '16px' }}></div>
          </div>
        </div>
      </div>
    );
  }
`;
ev = ev.replace(oldEvSkeletonRegex, newEvSkeleton);
ev = ev.replace(/if\s*\(\s*!profile\s*\)\s*return\s*null;/, '');
fs.writeFileSync('frontend/src/pages/EvidenceAndReasoning.tsx', ev);

let dash = fs.readFileSync('frontend/src/pages/DashboardOverview.tsx', 'utf8');
const oldDashSkeletonRegex = /if\s*\(\s*loading\s*\)\s*\{\s*return\s*\(\s*<div\s+className="main-content"[\s\S]*?\);\s*\}/;
const newDashSkeleton = `
  if (loading || !profile) {
    return (
      <div className="main-content" style={{ width: '92%', margin: '0 auto', maxWidth: '1400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--color-primary-dark)', fontWeight: 700, letterSpacing: '-0.02em' }}>
              EcoMind AI Overview
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '1rem' }}>
              Real-time environmental intelligence and risk monitoring for Profile #{profileId}.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <button 
              type="button" 
              disabled={true}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                background: 'white', border: '1px solid var(--color-border)',
                borderRadius: '8px', color: 'var(--color-primary)', fontWeight: 600, cursor: 'not-allowed',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <RefreshCw size={18} className="loading-pulse" />
              Loading...
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/environment')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                background: 'var(--color-primary)', border: 'none',
                borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              Update Environmental Data
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div className="skeleton-box" style={{ height: '140px', borderRadius: '16px' }}></div>
          <div className="skeleton-box" style={{ height: '140px', borderRadius: '16px' }}></div>
          <div className="skeleton-box" style={{ height: '140px', borderRadius: '16px' }}></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          <div className="skeleton-box" style={{ height: '400px', borderRadius: '16px' }}></div>
          <div className="skeleton-box" style={{ height: '400px', borderRadius: '16px' }}></div>
        </div>
      </div>
    );
  }
`;
dash = dash.replace(oldDashSkeletonRegex, newDashSkeleton);
dash = dash.replace(/if\s*\(\s*!profile\s*\)\s*return\s*null;/, '');
fs.writeFileSync('frontend/src/pages/DashboardOverview.tsx', dash);

console.log("Updated Evidence and Dashboard");
