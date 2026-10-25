// A right thumb, as if holding the phone in the right hand: a hologram blueprint that slides up
// from a button (first-run guides on page A and page B).
export default function HoloThumb() {
  return (
    <span className="holo-thumb">
      <svg viewBox="0 0 80 250" aria-hidden="true">
        <path className="th-body" d="M40 2C58 2 70 16 70 38L72 150C72 178 78 208 82 250H-2C2 208 8 178 10 150L10 38C10 16 22 2 40 2Z" />
        <path className="th-nail" d="M40 10C52 10 60 20 60 34V60C60 68 53 73 40 73S20 68 20 60V34C20 20 28 10 40 10Z" />
        <path className="th-line" d="M17 118Q40 126 63 118M15 131Q40 139 65 131" />
        <circle className="th-tip" cx="40" cy="6" r="5" />
      </svg>
    </span>
  )
}
