// frontend/src/components/FeatureHero.jsx
import React, { useState } from "react";

/**
 * Shared hero section used by every GeoGuardian feature page.
 * Left: title/description. Right: feature-specific image with CSS fallback.
 * The image container NEVER shows a broken-image icon — if the remote image
 * fails to load, a polished CSS-only satellite visual is shown instead.
 */
const FeatureHero = ({ icon: Icon, title, description, imageUrl, badge = "GeoGuardian" }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex flex-col md:flex-row gap-8 items-center justify-between">

          {/* Left — text */}
          <div className="md:w-1/2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
              {badge}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              {Icon && <Icon className="w-8 h-8 text-emerald-600 flex-shrink-0" />}
              {title}
            </h1>
            <p className="text-base text-slate-500 leading-relaxed max-w-xl">
              {description}
            </p>
          </div>

          {/* Right — feature image with CSS fallback */}
          <div className="md:w-5/12 w-full">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-gradient-to-br from-slate-800 via-emerald-950 to-slate-900">

              {/* Actual image — hidden on error */}
              {imageUrl && !imgError && (
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              )}

              {/* CSS fallback — shows when image is missing/broken or no imageUrl given */}
              {(!imageUrl || imgError) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                  {/* Decorative satellite grid */}
                  <div className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(52,211,153,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.6) 1px, transparent 1px)",
                      backgroundSize: "32px 32px",
                    }}
                  />
                  {/* Outer orbit ring */}
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" style={{ animationDuration: "3s" }} />
                    <div className="absolute inset-2 rounded-full border border-emerald-400/20" />
                    {/* Earth circle */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center shadow-xl shadow-emerald-900/50">
                      {Icon && <Icon className="w-8 h-8 text-emerald-200" />}
                    </div>
                  </div>
                  {/* Label */}
                  <p className="mt-4 text-emerald-400 text-xs font-bold uppercase tracking-widest opacity-80">
                    Sentinel-2 · Earth Observation
                  </p>
                </div>
              )}

              {/* Gradient overlay — always shown over the image */}
              {imageUrl && !imgError && (
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent pointer-events-none" />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FeatureHero;
