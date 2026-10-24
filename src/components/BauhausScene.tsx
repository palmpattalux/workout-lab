import '../themes/bauhaus.css'

// Bauhaus theme backdrop: a flat geometric composition in muted primaries on paper.
// A large sun circle anchors the top-right corner; a few small shapes sit around the edges
// and the bottom, each drifting or turning a few degrees. One SVG on a 390 x 844 canvas.
const W = 390, H = 844

export default function BauhausScene() {
  return (
    <div className="bauhaus-scene" aria-hidden="true">
      <svg className="bh-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        {/* anchor: the sun, with a thin ring and a crossing line */}
        <g className="bh-move bh-m1">
          <circle cx="338" cy="58" r="104" className="bh-red" />
        </g>
        <g className="bh-move bh-m2">
          <circle cx="338" cy="58" r="128" className="bh-ring" />
        </g>
        <g className="bh-move bh-m3">
          <path d="M244 184 L392 36" className="bh-line" />
          <circle cx="274" cy="154" r="7" className="bh-ink" />
        </g>
        {/* small cobalt disc on the right edge */}
        <g className="bh-move bh-m4">
          <circle cx="372" cy="318" r="26" className="bh-blue" />
        </g>
        {/* mustard half-circle against the left edge */}
        <g className="bh-move bh-m5">
          <path d="M0 382 A52 52 0 0 1 0 486 Z" className="bh-mustard" />
        </g>
        {/* small square, left */}
        <g className="bh-move bh-m6">
          <rect x="22" y="292" width="18" height="18" className="bh-red soft" />
        </g>
        {/* bottom: a quarter arc and a low half-sun between the corner buttons */}
        <g className="bh-move bh-m7">
          <path d="M122 846 A74 74 0 0 1 196 772" className="bh-arc" />
        </g>
        <g className="bh-move bh-m8">
          <path d="M158 846 A38 38 0 0 1 234 846 Z" className="bh-mustard soft" />
        </g>
      </svg>
    </div>
  )
}
