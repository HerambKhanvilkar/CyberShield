import React from 'react';

// Use a CSS conic-gradient as a mask on an overlay div. The overlay applies a
// backdrop-filter grayscale to the whole card; the conic-gradient mask makes
// the owned slices transparent so the underlying colored card shows through.
// This avoids SVG mask quirks and ensures the "pie" envelopes the entire card.
const PieBadgeOverlay = ({ requires = [], ownedSet = new Set(), colors }) => {
  const n = Array.isArray(requires) ? requires.length : 0;
  if (n === 0) return null;

  const filledColor = (colors && colors.filled) || '#06b6d4'; // unused for overlay

  // Build conic-gradient segments: transparent for owned slice, opaque for unowned
  const segments = [];
  for (let i = 0; i < n; i++) {
    const startDeg = (i / n) * 360;
    const endDeg = ((i + 1) / n) * 360;
    const reqId = String(requires[i] || '');
    const owned = ownedSet.has(reqId);
    if (owned) {
      // transparent slice (reveals colored card beneath)
      segments.push(`transparent ${startDeg}deg ${endDeg}deg`);
    } else {
      // dark/opaque slice (keeps desaturation overlay visible)
      segments.push(`rgba(0,0,0,0.85) ${startDeg}deg ${endDeg}deg`);
    }
  }

  // Close the gradient; the conic-gradient accepts comma-separated segments
  const gradient = `conic-gradient(${segments.join(', ')})`;

  const style = {
    WebkitMaskImage: gradient,
    maskImage: gradient,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    maskMode: 'alpha',
    backdropFilter: 'grayscale(1) brightness(0.75)',
    WebkitBackdropFilter: 'grayscale(1) brightness(0.75)',
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      <div style={style} className="absolute inset-0" />

      {/* Glint overlay: visible only on owned slices. Uses a mask built
          from owned segments (white where owned, transparent elsewhere)
          and applies the project's `glint` CSS class. */}
      {(() => {
        // build owned-only gradient: owned -> white (mask visible), others -> transparent
        const ownedSegments = [];
        for (let i = 0; i < n; i++) {
          const startDeg = (i / n) * 360;
          const endDeg = ((i + 1) / n) * 360;
          const reqId = String(requires[i] || '');
          const owned = ownedSet.has(reqId);
          if (owned) {
            ownedSegments.push(`rgba(255,255,255,1) ${startDeg}deg ${endDeg}deg`);
          } else {
            ownedSegments.push(`transparent ${startDeg}deg ${endDeg}deg`);
          }
        }
        const ownedGradient = `conic-gradient(${ownedSegments.join(', ')})`;
        const glintStyle = {
          WebkitMaskImage: ownedGradient,
          maskImage: ownedGradient,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          maskMode: 'alpha',
        };
        return <div style={glintStyle} className="absolute inset-0 glint-slice z-30" />;
      })()}

    </div>
  );
};

export default PieBadgeOverlay;
