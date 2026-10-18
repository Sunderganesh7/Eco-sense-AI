const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/ClimateIntelligence.tsx', 'utf8');

const newSkeleton = `
  if (loading) {
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
              Climate Intelligence
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '1rem', lineHeight: 1.5 }}>
              Understand climate conditions, variability, and their relationships with water, vegetation, and biodiversity.
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
                <CloudRain size={18} />
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary-dark)', zIndex: 1, lineHeight: 1.4 }}>
                Precise Climate Data<br/>Stronger Insights<br/>Resilient Systems
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

const oldSkeletonRegex = /if\s*\(\s*loading\s*\)\s*\{\s*return\s*\(\s*<div\s+className="main-content"[\s\S]*?\);\s*\}/;
content = content.replace(oldSkeletonRegex, newSkeleton);
fs.writeFileSync('frontend/src/pages/ClimateIntelligence.tsx', content);

console.log('Fixed ClimateIntelligence.tsx skeleton');
