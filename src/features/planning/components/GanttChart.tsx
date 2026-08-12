import { useState, useRef, useEffect, useCallback } from 'react'
import type { ActivityPlanning, ActivityPlanningStatus } from '@/types'
import { formatDate } from '@/utils/date'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BarChart2 } from 'lucide-react'
import { useTranslation } from "react-i18next";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<ActivityPlanningStatus, string> = {
  brouillon: 'bg-orange-400',
  planifie:  'bg-blue-500',
  en_cours:  'bg-yellow-500',
  valide:    'bg-green-500',
  annule:    'bg-red-400',
  stand_by:  'bg-purple-400',
}

type ViewMode = 'day' | 'week' | 'month'

const PX_PER_DAY: Record<ViewMode, number> = { day: 52, week: 26, month: 10 }

const ROW_H         = 44   // px — h-11
const HEADER_H      = 32   // px — h-8
const MAX_ROWS      = 10

// ─── Tick builder ────────────────────────────────────────────────────────────

interface Tick { label: string; leftPct: number }

function buildTicks(
  mode: ViewMode,
  minTime: number,
  maxTime: number,
  totalMs: number,
  totalDays: number,
): Tick[] {
  const ticks: Tick[] = []
  const cur = new Date(minTime)

  if (mode === 'month') {
    cur.setDate(1); cur.setHours(0, 0, 0, 0)
    while (cur.getTime() <= maxTime + 86_400_000 * 15) {
      const p = ((cur.getTime() - minTime) / totalMs) * 100
      if (p >= -5 && p <= 105)
        ticks.push({ label: cur.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), leftPct: Math.max(0, p) })
      cur.setMonth(cur.getMonth() + 1)
    }
  } else if (mode === 'week') {
    const dow = cur.getDay()
    cur.setDate(cur.getDate() + (dow === 0 ? -6 : 1 - dow))
    cur.setHours(0, 0, 0, 0)
    while (cur.getTime() <= maxTime + 86_400_000 * 7) {
      const p = ((cur.getTime() - minTime) / totalMs) * 100
      if (p >= -5 && p <= 105)
        ticks.push({ label: cur.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), leftPct: Math.max(0, p) })
      cur.setDate(cur.getDate() + 7)
    }
  } else {
    cur.setHours(0, 0, 0, 0)
    const every = totalDays <= 14 ? 1 : totalDays <= 31 ? 3 : 7
    let idx = 0
    while (cur.getTime() <= maxTime + 86_400_000) {
      const p = ((cur.getTime() - minTime) / totalMs) * 100
      if (p >= -5 && p <= 105)
        ticks.push({
          label: idx % every === 0 ? cur.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '',
          leftPct: Math.max(0, p),
        })
      cur.setDate(cur.getDate() + 1); idx++
    }
  }
  return ticks
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props { activities: ActivityPlanning[] }

export default function GanttChart({ activities }: Props) {
  // ── hooks (all before early return) ──
  const [tooltip,    setTooltip]    = useState<ActivityPlanning | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [viewMode,   setViewMode]   = useState<ViewMode>('week')
  const { t } = useTranslation()

  const VIEW_LABELS: Record<ViewMode, string> = {
    day: t('planning.gantt.viewDay'),
    week: t('planning.gantt.viewWeek'),
    month: t('planning.gantt.viewMonth'),
  }

  const rightRef    = useRef<HTMLDivElement>(null)
  const leftBodyRef = useRef<HTMLDivElement>(null)
  const syncing     = useRef(false)

  // Holds latest computed values accessible in effects without stale closure.
  const scrollVals = useRef({ todayPct: 0, timelineWidth: 0 })

  // Guards the one-time initial scroll — never scroll to today again after mount.
  const hasMounted = useRef(false)

  // Tracks the user's scroll position as a fraction of timelineWidth.
  // Lets us restore the same DATE (not same pixel) when the view mode changes.
  const scrollRatio = useRef(0)

  // Sync vertical scroll and track horizontal ratio for viewMode position restore.
  const handleRightScroll = useCallback(() => {
    if (!rightRef.current) return
    const el = rightRef.current

    if (!syncing.current && leftBodyRef.current) {
      syncing.current = true
      leftBodyRef.current.scrollTop = el.scrollTop
      syncing.current = false
    }

    const tw = scrollVals.current.timelineWidth
    if (tw > 0) scrollRatio.current = el.scrollLeft / tw
  }, [])

  // ── derived data ──
  const valid = activities
    .filter((a) => a.expectedStartDate && a.expectedEndDate)
    .sort((a, b) => new Date(a.expectedStartDate).getTime() - new Date(b.expectedStartDate).getTime())

  const safeTs = valid.length > 0
    ? valid.flatMap((a) => [
        new Date(a.expectedStartDate).getTime(),
        new Date(a.expectedEndDate).getTime(),
      ])
    : [Date.now() - 86_400_000 * 7, Date.now() + 86_400_000 * 30]

  const minTime      = Math.min(...safeTs)
  const maxTime      = Math.max(...safeTs)
  const totalMs      = maxTime - minTime || 86_400_000
  const totalDays    = Math.ceil(totalMs / 86_400_000) + 1
  const timelineWidth = Math.max(640, totalDays * PX_PER_DAY[viewMode])
  const ticks         = buildTicks(viewMode, minTime, maxTime, totalMs, totalDays)
  const todayPct      = ((Date.now() - minTime) / totalMs) * 100
  const showToday     = todayPct >= 0 && todayPct <= 100

  // Keep ref in sync with latest values each render
  scrollVals.current = { todayPct, timelineWidth }

  // ONCE on initial data load: center today in the viewport.
  // requestAnimationFrame ensures absolute inset-0 has computed clientWidth first.
  useEffect(() => {
    if (valid.length === 0 || hasMounted.current) return
    requestAnimationFrame(() => {
      const el = rightRef.current
      if (!el) return
      const { todayPct: pct, timelineWidth: tw } = scrollVals.current
      el.scrollLeft = Math.max(0, (pct / 100) * tw - el.clientWidth / 2)
      scrollRatio.current = tw > 0 ? el.scrollLeft / tw : 0
      hasMounted.current = true
    })
  }, [valid.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // On viewMode change: restore same temporal position (ratio-based).
  useEffect(() => {
    if (!hasMounted.current) return
    requestAnimationFrame(() => {
      const el = rightRef.current
      if (!el) return
      const tw = scrollVals.current.timelineWidth
      el.scrollLeft = Math.max(0, scrollRatio.current * tw)
    })
  }, [viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── early return ──
  if (valid.length === 0) return null

  // ── layout helpers ──
  const visibleRows = Math.min(valid.length, MAX_ROWS)
  // containerH kept for reference but height is now controlled by the parent wrapper
  const _containerH = HEADER_H + visibleRows * ROW_H

  const getBarStyle = (a: ActivityPlanning) => {
    const s = new Date(a.expectedStartDate).getTime()
    const e = new Date(a.expectedEndDate).getTime()
    if (isNaN(s) || isNaN(e)) return null
    return {
      left:  `${Math.max(0, ((s - minTime) / totalMs) * 100)}%`,
      width: `${Math.max(0.5, ((e - s) / totalMs) * 100)}%`,
    }
  }

  // ── render ──
  return (
    <Card className="w-full max-w-full h-full flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <BarChart2 className="h-5 w-5 text-blue-600" />
            {t('planning.gantt.title')}
          </CardTitle>

          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
            {(['day', 'week', 'month'] as ViewMode[]).map((mode, i) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 transition-colors ${i > 0 ? 'border-l border-gray-200' : ''} ${
                  viewMode === mode ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {VIEW_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 flex flex-col p-0 overflow-hidden">
        {/* ── Main Gantt area — fills available height, scrolls internally ── */}
        <div className="flex flex-1 min-h-0 w-full max-w-full border-b border-gray-200 overflow-hidden">
          {/* Left: sticky label column */}
          <div className="shrink-0 w-32 sm:w-44 md:w-48 flex flex-col border-r border-gray-200 bg-white z-20">
            {/* Label header cell */}
            <div
              className="shrink-0 px-3 flex items-center text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200"
              style={{ height: HEADER_H }}
            >
            {
              t('planning.project')
            }
            </div>

            {/* Label rows — overflow hidden, scrollTop driven by rightRef */}
            <div ref={leftBodyRef} className="flex-1 overflow-hidden">
              {valid.map((a) => (
                <div
                  key={a.id}
                  className="px-3 flex flex-col justify-center overflow-hidden border-b border-gray-100 hover:bg-blue-50/30 transition-colors"
                  style={{ height: ROW_H }}
                >
                  <p className="text-xs sm:text-sm font-medium leading-tight text-gray-900 truncate" title={a.process}>
                    {a.process}
                  </p>
                  <p className="text-[10px] sm:text-xs leading-tight text-gray-400 truncate">{a.siteName}</p>
                  <p className="text-[10px] leading-tight text-blue-500 truncate" title={a.provider}>{a.provider}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: relative wrapper — sized by flex, never by content */}
          <div className="flex-1 min-w-0 relative overflow-hidden">
          {/* Absolute scroll container — inset-0 pins it to wrapper bounds */}
          <div
            ref={rightRef}
            className="absolute inset-0 overflow-x-auto overflow-y-auto"
            onScroll={handleRightScroll}
          >
            <div className="relative" style={{ minWidth: timelineWidth }}>

              {/* Sticky tick header */}
              <div
                className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 relative"
                style={{ height: HEADER_H }}
              >
                {ticks.map((tick, i) =>
                  tick.label ? (
                    <span
                      key={i}
                      className="absolute top-2 text-xs text-gray-500 font-medium whitespace-nowrap"
                      style={{ left: `${tick.leftPct}%` }}
                    >
                      {tick.label}
                    </span>
                  ) : null,
                )}

                {/* Today — pill badge + vertical line in header */}
                {showToday && (
                  <div
                    className="absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center"
                    style={{ left: `${todayPct}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="mt-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap leading-none shadow select-none">
                      {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="flex-1 w-px bg-red-500" />
                  </div>
                )}
              </div>

              {/* Rows area */}
              <div className="relative">
                {/* Background grid lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {ticks.map((tick, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-gray-100"
                      style={{ left: `${tick.leftPct}%` }}
                    />
                  ))}

                  {/* Today — continuous vertical line through all rows */}
                  {showToday && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                      style={{ left: `${todayPct}%`, transform: 'translateX(-50%)' }}
                    />
                  )}
                </div>

                {/* Activity bar rows */}
                {valid.map((a) => {
                  const barStyle  = getBarStyle(a)
                  const colorCls  = STATUS_COLORS[a.status] ?? 'bg-gray-400'

                  return (
                    <div
                      key={a.id}
                      className="relative border-b border-gray-100 hover:bg-blue-50/20 transition-colors"
                      style={{ height: ROW_H }}
                    >
                      {barStyle && (
                        <div
                          className={`absolute rounded ${colorCls} opacity-90 hover:opacity-100 transition-opacity cursor-pointer`}
                          style={{ ...barStyle, top: 10, bottom: 10 }}
                          onMouseEnter={(e) => { setTooltip(a); setTooltipPos({ x: e.clientX, y: e.clientY }) }}
                          onMouseMove={(e)  => setTooltipPos({ x: e.clientX, y: e.clientY })}
                          onMouseLeave={()  => setTooltip(null)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 border-t border-gray-100 bg-gray-50">
          {(Object.keys(STATUS_COLORS) as ActivityPlanningStatus[]).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={`inline-block w-3 h-3 rounded-sm shrink-0 ${STATUS_COLORS[s]}`} />
              <span className="text-xs text-gray-600 whitespace-nowrap">{t(`planning.status.${s}`)}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-px h-3 bg-red-500 shrink-0" />
            <span className="text-xs text-gray-600 whitespace-nowrap">{t('planning.gantt.today')}</span>
          </div>
        </div>
      </CardContent>

      {/* ── Tooltip ── */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none max-w-[min(280px,90vw)]"
          style={{ left: tooltipPos.x + 14, top: tooltipPos.y - 10 }}
        >
          <p className="font-semibold mb-1">{tooltip.process}</p>
          <p>{formatDate(tooltip.expectedStartDate)} → {formatDate(tooltip.expectedEndDate)}</p>
          <p className="mt-1 text-gray-300">{t('planning.gantt.statutLabel')} {t(`planning.status.${tooltip.status}`)}</p>
          <p className="text-gray-300">{t('planning.gantt.prestataireLabel')} {tooltip.provider}</p>
          {tooltip.siteName && <p className="text-gray-300">{t('planning.gantt.siteLabel')} {tooltip.siteName}</p>}
        </div>
      )}
    </Card>
  )
}
