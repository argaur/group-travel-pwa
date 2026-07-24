// Topographic contour lines — the terrain of the trip. Ambient backdrop for
// any cartography surface. Styled entirely by `.contours` in globals.css
// (ink strokes at 0.075 opacity, one vermillion accent path at 0.14).
//
// `fixed`: hero sections keep the default absolute-to-section behavior; tall
// scrollable in-app screens pass `fixed` so the terrain anchors to the
// viewport instead of stretching across the whole document height.
export function Contours({ fixed = false }: { fixed?: boolean }) {
  return (
    <div className={`contours${fixed ? " contours--fixed" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 1400 760" preserveAspectRatio="xMidYMid slice">
        <path d="M-40,600 C180,520 300,640 520,560 C740,480 860,620 1080,540 C1240,480 1360,560 1460,520" />
        <path d="M-40,640 C200,560 320,690 540,610 C760,530 880,670 1100,590 C1260,530 1380,610 1460,570" />
        <path d="M-40,540 C160,470 300,580 500,510 C720,430 840,560 1060,490 C1220,440 1360,500 1460,470" />
        <path d="M-40,470 C140,410 300,510 480,450 C700,380 820,490 1040,430 C1200,390 1360,440 1460,415" />
        <path
          className="accent"
          d="M-40,505 C150,440 300,545 490,480 C710,405 830,525 1050,460 C1210,415 1360,470 1460,442"
        />
      </svg>
    </div>
  );
}

export default Contours;
