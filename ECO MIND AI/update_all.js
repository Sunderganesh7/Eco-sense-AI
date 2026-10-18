const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/ClimateIntelligence.tsx', 'utf8');

// Replace the condition
content = content.replace(/if\s*\(\s*loading\s*\)\s*\{/, 'if (loading || !profile) {');
content = content.replace(/if\s*\(\s*!profile\s*\)\s*return\s*null;/, '');

fs.writeFileSync('frontend/src/pages/ClimateIntelligence.tsx', content);

// Do the same for SoilIntelligence.tsx
let soil = fs.readFileSync('frontend/src/pages/SoilIntelligence.tsx', 'utf8');
const oldSoilSkeletonRegex = /if\s*\(\s*loading\s*\)\s*\{\s*return\s*\(\s*<div\s+className="main-content"[\s\S]*?\);\s*\}/;
const newSoilSkeleton = `
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
              Soil Intelligence
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '1rem', lineHeight: 1.5 }}>
              Understand the condition, drivers, and environmental role of your soil. Analyze soil indicators, identify potential soil pressures, understand relationships with vegetation and water, and explore evidence-backed environmental insights.
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

            <div style={{ background: 'var(--color-success-bg)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start', width: '240px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <div style={{ background: 'var(--color-success)', color: 'white', borderRadius: '50%', padding: '8px', display: 'flex', zIndex: 1 }}>
                <FlaskConical size={18} />
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary-dark)', zIndex: 1, lineHeight: 1.4 }}>
                Accurate Soil Data<br/>Stronger Insights<br/>Healthier Ecosystems
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
soil = soil.replace(oldSoilSkeletonRegex, newSoilSkeleton);
soil = soil.replace(/if\s*\(\s*!profile\s*\)\s*return\s*null;/, '');
fs.writeFileSync('frontend/src/pages/SoilIntelligence.tsx', soil);

// BiodiversityIntelligence.tsx
let bio = fs.readFileSync('frontend/src/pages/BiodiversityIntelligence.tsx', 'utf8');
const oldBioSkeletonRegex = /if\s*\(\s*loading\s*\)\s*\{\s*return\s*\(\s*<div\s+className="main-content"[\s\S]*?\);\s*\}/;
const newBioSkeleton = `
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
              Biodiversity Intelligence
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '1rem', lineHeight: 1.5 }}>
              Analyze habitat conditions, species diversity, and ecological resilience.
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

            <div style={{ background: 'var(--color-success-bg)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start', width: '240px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <div style={{ background: 'var(--color-success)', color: 'white', borderRadius: '50%', padding: '8px', display: 'flex', zIndex: 1 }}>
                <Trees size={18} />
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary-dark)', zIndex: 1, lineHeight: 1.4 }}>
                Rich Ecosystems<br/>Stronger Resilience<br/>Lasting Impact
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
bio = bio.replace(oldBioSkeletonRegex, newBioSkeleton);
bio = bio.replace(/if\s*\(\s*!profile\s*\)\s*return\s*null;/, '');
fs.writeFileSync('frontend/src/pages/BiodiversityIntelligence.tsx', bio);

// LandIntelligence.tsx
let land = fs.readFileSync('frontend/src/pages/LandIntelligence.tsx', 'utf8');
const newLandSkeleton = `
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
              Land Intelligence
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '1rem', lineHeight: 1.5 }}>
              Understand land use efficiency, agronomic impact, and landscape integrity.
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

            <div style={{ background: 'var(--color-warning-bg)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start', width: '240px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ background: 'var(--color-warning)', color: 'white', borderRadius: '50%', padding: '8px', display: 'flex', zIndex: 1 }}>
                <MapIcon size={18} />
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary-dark)', zIndex: 1, lineHeight: 1.4 }}>
                Optimal Usage<br/>Sustainable Practices<br/>Higher Yields
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
land = land.replace(oldBioSkeletonRegex, newLandSkeleton);
land = land.replace(/if\s*\(\s*!profile\s*\)\s*return\s*null;/, '');
fs.writeFileSync('frontend/src/pages/LandIntelligence.tsx', land);

// HumanImpact.tsx
let human = fs.readFileSync('frontend/src/pages/HumanImpact.tsx', 'utf8');
const newHumanSkeleton = `
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
              Human Impact Intelligence
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '1rem', lineHeight: 1.5 }}>
              Track pollution, deforestation, and human-driven environmental pressures.
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

            <div style={{ background: 'var(--color-danger-bg)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start', width: '240px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ background: 'var(--color-danger)', color: 'white', borderRadius: '50%', padding: '8px', display: 'flex', zIndex: 1 }}>
                <Factory size={18} />
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary-dark)', zIndex: 1, lineHeight: 1.4 }}>
                Reduced Pressures<br/>Restored Balance<br/>Protected Futures
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
human = human.replace(oldBioSkeletonRegex, newHumanSkeleton);
human = human.replace(/if\s*\(\s*!profile\s*\)\s*return\s*null;/, '');
fs.writeFileSync('frontend/src/pages/HumanImpact.tsx', human);

console.log("Updated files");
