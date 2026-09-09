import React, { useState } from 'react'

const WIDTH = 640
const HEIGHT = 220
const PADDING = { top: 16, right: 16, bottom: 28, left: 36 }

/** 月別推移などの単一系列の折れ線グラフ。データが無い/1点だけでも壊れないようにしている。 */
export function LineChart({ data, color = 'var(--accent-cyan)' }) {
  const [hoverIndex, setHoverIndex] = useState(null)

  if (!data || data.length === 0) {
    return <div className="admin-chart-empty">データがありません</div>
  }

  const innerWidth = WIDTH - PADDING.left - PADDING.right
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom
  const maxValue = Math.max(1, ...data.map((d) => d.count))
  const stepX = data.length > 1 ? innerWidth / (data.length - 1) : 0

  function xAt(i) {
    return PADDING.left + (data.length > 1 ? i * stepX : innerWidth / 2)
  }
  function yAt(value) {
    return PADDING.top + innerHeight - (value / maxValue) * innerHeight
  }

  const points = data.map((d, i) => [xAt(i), yAt(d.count)])
  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')

  const yTicks = 4
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const value = (maxValue / yTicks) * i
    return { y: yAt(value), value: Math.round(value) }
  })

  // ラベルが詰まりすぎないよう、点が多い場合は間引く（先頭・末尾は必ず残す）。
  const labelStride = Math.ceil(data.length / 8)

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH
    let nearest = 0
    let bestDist = Infinity
    points.forEach(([x], i) => {
      const dist = Math.abs(x - relX)
      if (dist < bestDist) {
        bestDist = dist
        nearest = i
      }
    })
    setHoverIndex(nearest)
  }

  const hovered = hoverIndex != null ? data[hoverIndex] : null
  const hoverX = hoverIndex != null ? points[hoverIndex][0] : null

  return (
    <div className="admin-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="admin-chart-svg"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {gridLines.map((g) => (
          <g key={g.value}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={g.y}
              y2={g.y}
              className="admin-chart-gridline"
            />
            <text x={PADDING.left - 8} y={g.y} className="admin-chart-axis-label" textAnchor="end" dy="0.32em">
              {g.value}
            </text>
          </g>
        ))}

        {data.map((d, i) =>
          i % labelStride === 0 || i === data.length - 1 ? (
            <text
              key={d.month}
              x={xAt(i)}
              y={HEIGHT - PADDING.bottom + 16}
              className="admin-chart-axis-label"
              textAnchor="middle"
            >
              {d.month === 'unknown' ? '不明' : d.month}
            </text>
          ) : null
        )}

        {hoverX != null && (
          <line
            x1={hoverX}
            x2={hoverX}
            y1={PADDING.top}
            y2={HEIGHT - PADDING.bottom}
            className="admin-chart-crosshair"
          />
        )}

        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {points.map(([x, y], i) => (
          <circle
            key={data[i].month}
            cx={x}
            cy={y}
            r={hoverIndex === i ? 5 : 3}
            fill={color}
            className="admin-chart-point"
          />
        ))}
      </svg>
      {hovered && (
        <div className="admin-chart-tooltip" style={{ left: `${(hoverX / WIDTH) * 100}%` }}>
          <strong>{hovered.month === 'unknown' ? '不明' : hovered.month}</strong>: {hovered.count}
        </div>
      )}
    </div>
  )
}

/** カテゴリ別件数の横棒グラフ。件数の多い順に並べる。 */
export function BarChart({ data, color = 'var(--accent-cyan)' }) {
  if (!data || data.length === 0) {
    return <div className="admin-chart-empty">データがありません</div>
  }
  const sorted = [...data].sort((a, b) => b.value - a.value)
  const maxValue = Math.max(1, ...sorted.map((d) => d.value))

  return (
    <div className="admin-bar-chart">
      {sorted.map((d) => (
        <div className="admin-bar-row" key={d.label}>
          <div className="admin-bar-label">{d.label}</div>
          <div className="admin-bar-track">
            <div
              className="admin-bar-fill"
              style={{ width: `${(d.value / maxValue) * 100}%`, background: color }}
            />
          </div>
          <div className="admin-bar-value">{d.value}</div>
        </div>
      ))}
    </div>
  )
}
