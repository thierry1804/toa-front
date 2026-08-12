import { useState } from 'react'
import { Eye, Download, FileDown, RefreshCw, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Drawer } from '@/components/ui/Drawer'
import Input from '@/components/ui/Input'
import StatutPermitBadge from '@/components/permitTravail/StatutPermitBadge'
import { usePermitTravailLogs } from '@/features/permitTravail/hooks/usePermitTravail'
import type { PermitTravail, PermitTravailLog, ActionPermitTravailLog } from '@/types/permitTravail'

const ACTION_CONFIG: Record<ActionPermitTravailLog, { labelKey: string; color: string; icon: React.ElementType }> = {
  CONSULTE:            { labelKey: 'permitTravail.components.logsDrawer.actions.consulte',            color: 'bg-blue-100 text-blue-700',   icon: Eye        },
  DOCUMENT_TELECHARGE: { labelKey: 'permitTravail.components.logsDrawer.actions.documentTelecharge',  color: 'bg-purple-100 text-purple-700', icon: FileDown  },
  STATUT_CHANGE:       { labelKey: 'permitTravail.components.logsDrawer.actions.statutChange',        color: 'bg-orange-100 text-orange-700', icon: RefreshCw },
  PDF_GENERE:          { labelKey: 'permitTravail.components.logsDrawer.actions.pdfGenere',           color: 'bg-green-100 text-green-700', icon: Download   },
}

function LogTimelineItem({ log, t }: { log: PermitTravailLog; t: TFunction }) {
  const cfg = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.CONSULTE
  const Icon = cfg.icon
  const time = new Date(log.createdAt)
  const label = t(cfg.labelKey)

  return (
    <div className="flex gap-3 pb-5">
      <div className="flex flex-col items-center">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="mt-1 flex-1 w-px bg-gray-200" />
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-900">{label}</span>
          <time className="shrink-0 text-xs text-gray-500">
            {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>
        {log.declenchePar && (
          <p className="mt-0.5 text-xs text-gray-500">{log.declenchePar.email}</p>
        )}
        {log.metadata && (
          <div className="mt-1 rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">
            {log.action === 'STATUT_CHANGE' && log.metadata.ancienStatut && log.metadata.nouveauStatut ? (
              <span>
                <span className="font-mono">{log.metadata.ancienStatut}</span>
                {' → '}
                <span className="font-mono font-medium">{log.metadata.nouveauStatut}</span>
              </span>
            ) : log.action === 'DOCUMENT_TELECHARGE' ? (
              log.metadata.filename ?? log.metadata.documentId
            ) : log.action === 'PDF_GENERE' && log.metadata.tailleFichier ? (
              `${Math.round(Number(log.metadata.tailleFichier) / 1024)} Ko`
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

function exportCsv(logs: PermitTravailLog[], reference: string, t: TFunction) {
  const header = t('permitTravail.components.logsDrawer.csvHeader')
  const rows = logs.map((l) => {
    const d = new Date(l.createdAt)
    const date = d.toLocaleDateString('fr-FR')
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const action = t(ACTION_CONFIG[l.action]?.labelKey ?? '') || l.action
    const by = l.declenchePar?.email ?? ''
    const detail = l.metadata ? JSON.stringify(l.metadata).replace(/"/g, '""') : ''
    return `"${date}","${time}","${action}","${by}","${detail}"`
  })
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `logs_${reference}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

interface LogsDrawerProps {
  permit: PermitTravail | null
  isOpen: boolean
  onClose: () => void
}

const PAGE_SIZE = 20

export default function LogsDrawer({ permit, isOpen, onClose }: LogsDrawerProps) {
  const { t } = useTranslation()
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const { data: logs = [], isLoading } = usePermitTravailLogs(permit?.id ?? '', date)

  const visible = logs.slice(0, visibleCount)
  const hasMore = visibleCount < logs.length

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        permit
          ? t('permitTravail.components.logsDrawer.titleWithRef', { reference: permit.reference })
          : t('permitTravail.components.logsDrawer.titleDefault')
      }
      subtitle={permit ? undefined : undefined}
      width="max-w-lg"
    >
      {permit && (
        <div className="mb-4 flex items-center gap-2">
          <StatutPermitBadge statut={permit.statut} />
          <span className="text-xs text-gray-500">{permit.codeSite}</span>
        </div>
      )}

      <div className="mb-4 flex items-end gap-3">
        <div className="flex-1">
          <Input
            label={t('permitTravail.components.logsDrawer.dateLabel')}
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setVisibleCount(PAGE_SIZE) }}
          />
        </div>
        {logs.length > 0 && (
          <button
            onClick={() => exportCsv(logs, permit?.reference ?? 'permit', t)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            {t('permitTravail.components.logsDrawer.csvButton')}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
          {t('permitTravail.components.logsDrawer.loading')}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Eye className="mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm">{t('permitTravail.components.logsDrawer.emptyText')}</p>
        </div>
      ) : (
        <div>
          <div className="mb-3 text-xs text-gray-500">
            {t('permitTravail.components.logsDrawer.eventCount', { count: logs.length })}
          </div>
          <div>
            {visible.map((log) => (
              <LogTimelineItem key={log.id} log={log} t={t} />
            ))}
          </div>
          {hasMore && (
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <ChevronDown className="h-4 w-4" />
              {t('permitTravail.components.logsDrawer.loadMore', { remaining: logs.length - visibleCount })}
            </button>
          )}
        </div>
      )}
    </Drawer>
  )
}
