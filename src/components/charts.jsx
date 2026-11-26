import { useEffect, useRef, useState } from 'react';

/* Gráficos dibujados a mano en SVG: livianos, animados y con tooltip. */

function niceScale(max, ticks = 4) {
  if (!max || max <= 0) return { top: 1, values: [0, 1] };
  const rough = max / ticks;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const n = rough / pow;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
  const top = Math.ceil(max / step) * step;
  const values = [];
  for (let v = 0; v <= top + step / 2; v += step) values.push(v);
  return { top, values };
}

function useWidth(min = 260) {
  const ref = useRef(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('ResizeObserver' in window)) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(min, Math.floor(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [min]);
  return [ref, width];
}

const barPath = (x, y, w, h) => {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
};

/**
 * Barras verticales de una sola serie.
 * data: [{ key, label, value, tip?: string[] }]
 */
export function BarChart({ data, height = 280, formatAxis = String, formatValue = String, title }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { top: 18, right: 6, bottom: 30, left: 58 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(0, ...data.map((d) => d.value));
  const { top, values } = niceScale(max);
  const step = innerW / Math.max(1, data.length);
  const barW = Math.max(6, Math.min(46, step - Math.max(4, step * 0.3)));
  const y = (v) => pad.top + innerH - (v / top) * innerH;
  const labelEvery = step < 30 ? 3 : step < 44 ? 2 : 1;
  const active = hover !== null ? data[hover] : null;

  return (
    <div className="chart" ref={ref}>
      <svg width={width} height={height} role="img" aria-label={title} onMouseLeave={() => setHover(null)}>
        {values.map((v) => (
          <g key={v}>
            <line x1={pad.left} x2={width - pad.right} y1={y(v)} y2={y(v)} className={v === 0 ? 'chart__base' : 'chart__grid'} />
            <text x={pad.left - 10} y={y(v)} dy="0.32em" textAnchor="end" className="chart__axis">
              {formatAxis(v)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.left + step * i + (step - barW) / 2;
          const h = Math.max(0, y(0) - y(d.value));
          return (
            <g key={d.key}>
              {h > 0 && (
                <path
                  d={barPath(x, y(d.value), barW, h)}
                  className={`chart__bar ${hover !== null && hover !== i ? 'is-dim' : ''}`}
                  style={{ '--i': i }}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={height - 8} textAnchor="middle" className={`chart__axis ${hover === i ? 'is-active' : ''}`}>
                  {d.label}
                </text>
              )}
              {/* Zona de hover más grande que la barra */}
              <rect
                x={pad.left + step * i}
                y={pad.top}
                width={step}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${d.label}: ${formatValue(d.value)}`}
              />
            </g>
          );
        })}
      </svg>
      {active && (
        <div
          className="chart__tip"
          style={{
            left: Math.min(Math.max(pad.left + step * hover + step / 2, 90), width - 90),
            top: Math.max(0, y(active.value) - 12),
          }}
        >
          <small>{active.tipLabel || active.label}</small>
          <b>{formatValue(active.value)}</b>
          {active.tip?.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Dona para participación (pocas categorías). El color lo define cada ítem
 * y sigue a la entidad, no a su posición en el ranking.
 * data: [{ key, label, value, color }]
 */
export function Donut({ data, size = 210, thickness = 28, formatValue = String, centerTitle = 'Total' }) {
  const [hover, setHover] = useState(null);
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const gap = data.length > 1 ? 3 : 0;
  let acc = 0;
  const active = hover !== null ? data[hover] : null;

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Participación por categoría">
        {total === 0 && <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="donut__track" strokeWidth={thickness} />}
        {total > 0 &&
          data.map((d, i) => {
            const len = (d.value / total) * circ;
            const dash = Math.max(0, len - gap);
            const offset = acc;
            acc += len;
            return (
              <circle
                key={d.key}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={hover === i ? thickness + 8 : thickness}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                className={`donut__seg ${hover !== null && hover !== i ? 'is-dim' : ''}`}
                style={{ '--len': circ, '--i': i }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
      </svg>
      <div className="donut__center">
        <small>{active ? active.label : centerTitle}</small>
        <b>{formatValue(active ? active.value : total)}</b>
        {active && total > 0 && <span>{((active.value / total) * 100).toFixed(1).replace('.', ',')}%</span>}
      </div>
    </div>
  );
}
