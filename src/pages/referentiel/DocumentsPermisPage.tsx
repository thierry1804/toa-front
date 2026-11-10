import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Edit, Search, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { usePermissions } from '@/features/menus/hooks/usePermissions'
import { useUiStore } from '@/store/ui.store'
import { documentPermisApi, type DocumentPermisInput, type DocumentPermisRegle } from '@/api/documentPermisApi'

const MOMENTS = ['SOUMISSION', 'CLOTURE', 'DANGERS'] as const
const PROCESSUS = ['NOUVEAU_SITE', 'AUTRES', 'TOUS'] as const
const TYPES = ['GENERAL', 'HAUTEUR', 'ELECTRIQUE', 'TOUS'] as const
const DEMANDES = ['PREMIERE', 'RENOUVELLEMENT', 'TOUTES'] as const

const emptyForm = (): DocumentPermisInput => ({
  code: '',
  libelle: '',
  moment: 'SOUMISSION',
  processus: 'TOUS',
  typePermis: 'TOUS',
  demande: 'TOUTES',
  apnApiUniquement: false,
  obligatoire: true,
  autoriseNA: false,
  ordre: 0,
  actif: true,
})

export default function DocumentsPermisPage() {
  const { t } = useTranslation()
  const perms = usePermissions('/referentiel/documents-permis')
  const canCreate = perms?.canCreate ?? false
  const canEdit = perms?.canEdit ?? false
  const canDelete = perms?.canDelete ?? false
  const addToast = useUiStore((s) => s.addToast)
  const queryClient = useQueryClient()
  const { data = [], isLoading } = useQuery({
    queryKey: ['documents-permis'],
    queryFn: documentPermisApi.list,
  })
  const [editing, setEditing] = useState<DocumentPermisRegle | null>(null)
  const [form, setForm] = useState<DocumentPermisInput | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [processusFilter, setProcessusFilter] = useState<'' | (typeof PROCESSUS)[number]>('')
  const [typeFilter, setTypeFilter] = useState<'' | (typeof TYPES)[number]>('')

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['documents-permis'] })
  const filtered = data.filter(
    (regle) =>
      (!search ||
        regle.libelle.toLowerCase().includes(search.toLowerCase()) ||
        regle.code.toLowerCase().includes(search.toLowerCase())) &&
      (!processusFilter || regle.processus === processusFilter) &&
      (!typeFilter || regle.typePermis === typeFilter),
  )
  const handleSearch = () => setSearch(searchInput)
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleSearch()
  }
  const handleSearchClear = () => {
    setSearchInput('')
    setSearch('')
  }
  const save = useMutation({
    mutationFn: async () => {
      if (!form) return
      if (editing) return documentPermisApi.update(editing.id, form)
      return documentPermisApi.create(form)
    },
    onSuccess: () => {
      addToast({ message: t('referentiel.documentsPermis.saved'), type: 'success' })
      setForm(null)
      refresh()
    },
    onError: () => addToast({ message: t('referentiel.documentsPermis.saveError'), type: 'error' }),
  })
  const remove = useMutation({
    mutationFn: (id: string) => documentPermisApi.remove(id),
    onSuccess: () => {
      addToast({ message: t('referentiel.documentsPermis.deleted'), type: 'success' })
      refresh()
    },
    onError: () => addToast({ message: t('referentiel.documentsPermis.deleteUsed'), type: 'error' }),
  })
  const toggleActif = useMutation({
    mutationFn: (regle: DocumentPermisRegle) => documentPermisApi.update(regle.id, { actif: !regle.actif }),
    onSuccess: refresh,
    onError: () => addToast({ message: t('referentiel.documentsPermis.toggleError'), type: 'error' }),
  })
  const toggleObligatoire = useMutation({
    mutationFn: (regle: DocumentPermisRegle) => documentPermisApi.update(regle.id, { obligatoire: !regle.obligatoire }),
    onSuccess: refresh,
    onError: () => addToast({ message: t('referentiel.documentsPermis.toggleError'), type: 'error' }),
  })
  const toggleApnApi = useMutation({
    mutationFn: (regle: DocumentPermisRegle) => documentPermisApi.update(regle.id, { apnApiUniquement: !regle.apnApiUniquement }),
    onSuccess: refresh,
    onError: () => addToast({ message: t('referentiel.documentsPermis.toggleError'), type: 'error' }),
  })
  const toggleAutoriseNA = useMutation({
    mutationFn: (regle: DocumentPermisRegle) => documentPermisApi.update(regle.id, { autoriseNA: !regle.autoriseNA }),
    onSuccess: refresh,
    onError: () => addToast({ message: t('referentiel.documentsPermis.toggleError'), type: 'error' }),
  })

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('referentiel.documentsPermis.title')}
        description={t('referentiel.documentsPermis.subtitle')}
        actions={canCreate ? <Button onClick={() => { setEditing(null); setForm(emptyForm()) }}>{t('referentiel.documentsPermis.add')}</Button> : undefined}
      />
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder={t('referentiel.documentsPermis.searchPlaceholder')}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            <Button onClick={handleSearch} variant="outline">{t('referentiel.documentsPermis.searchButton')}</Button>
            {search && (
              <Button onClick={handleSearchClear} variant="secondary">{t('referentiel.documentsPermis.clearButton')}</Button>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <select
              className="border border-gray-300 px-2 py-2 text-sm rounded-md"
              value={processusFilter}
              onChange={(event) => setProcessusFilter(event.target.value as typeof processusFilter)}
            >
              <option value="">{t('referentiel.documentsPermis.filterAllProcessus')}</option>
              {PROCESSUS.map((value) => <option key={value} value={value}>{t(`referentiel.documentsPermis.processus.${value}`)}</option>)}
            </select>
            <select
              className="border border-gray-300 px-2 py-2 text-sm rounded-md"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
            >
              <option value="">{t('referentiel.documentsPermis.filterAllTypes')}</option>
              {TYPES.map((value) => <option key={value} value={value}>{t(`referentiel.documentsPermis.types.${value}`)}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-3 py-2 font-medium">{t('referentiel.documentsPermis.fields.libelle')}</th>
                <th className="px-3 py-2 font-medium">{t('referentiel.documentsPermis.fields.moment')}</th>
                <th className="px-3 py-2 font-medium">{t('referentiel.documentsPermis.fields.processus')}</th>
                <th className="px-3 py-2 font-medium">{t('referentiel.documentsPermis.fields.type')}</th>
                <th className="px-3 py-2 font-medium">{t('referentiel.documentsPermis.fields.demande')}</th>
                <th className="px-3 py-2 font-medium">{t('referentiel.documentsPermis.fields.apnApi')}</th>
                <th className="px-3 py-2 font-medium">{t('referentiel.documentsPermis.fields.obligatoire')}</th>
                <th className="px-3 py-2 font-medium">{t('referentiel.documentsPermis.fields.autoriseNA')}</th>
                <th className="px-3 py-2 font-medium">{t('referentiel.documentsPermis.fields.actif')}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td className="px-3 py-4" colSpan={10}>{t('referentiel.documentsPermis.loading')}</td></tr>}
              {!isLoading && filtered.length === 0 && (
                <tr><td className="px-3 py-4 text-center text-gray-500" colSpan={10}>{t('referentiel.documentsPermis.noResults')}</td></tr>
              )}
              {filtered.map((regle) => (
                <tr key={regle.id} className="border-b border-gray-100">
                  <td className="px-3 py-2">
                    <div>{regle.libelle}</div>
                    <div className="text-xs text-gray-500">{regle.code}</div>
                  </td>
                  <td className="px-3 py-2">{t(`referentiel.documentsPermis.moments.${regle.moment}`)}</td>
                  <td className="px-3 py-2">{t(`referentiel.documentsPermis.processus.${regle.processus}`)}</td>
                  <td className="px-3 py-2">{t(`referentiel.documentsPermis.types.${regle.typePermis}`)}</td>
                  <td className="px-3 py-2">{t(`referentiel.documentsPermis.demandes.${regle.demande}`)}</td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={regle.apnApiUniquement}
                      disabled={!canEdit || toggleApnApi.isPending}
                      onChange={() => toggleApnApi.mutate(regle)}
                      aria-label={t('referentiel.documentsPermis.fields.apnApi')}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={regle.obligatoire}
                      disabled={!canEdit || toggleObligatoire.isPending}
                      onChange={() => toggleObligatoire.mutate(regle)}
                      aria-label={t('referentiel.documentsPermis.fields.obligatoire')}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={regle.autoriseNA}
                      disabled={!canEdit || toggleAutoriseNA.isPending}
                      onChange={() => toggleAutoriseNA.mutate(regle)}
                      aria-label={t('referentiel.documentsPermis.fields.autoriseNA')}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={regle.actif}
                      disabled={!canEdit || toggleActif.isPending}
                      onChange={() => toggleActif.mutate(regle)}
                      aria-label={t('referentiel.documentsPermis.fields.actif')}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditing(regle); setForm({ ...regle }) }}
                          title={t('referentiel.documentsPermis.edit')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => remove.mutate(regle.id)}
                          title={t('referentiel.documentsPermis.delete')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Modal isOpen={form !== null} onClose={() => setForm(null)} title={editing ? t('referentiel.documentsPermis.edit') : t('referentiel.documentsPermis.add')}>
        {form && (
          <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); save.mutate() }}>
            <Input label={t('referentiel.documentsPermis.fields.code')} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} required />
            <Input label={t('referentiel.documentsPermis.fields.libelle')} value={form.libelle} onChange={(event) => setForm({ ...form, libelle: event.target.value })} required />
            <label className="block text-sm">
              {t('referentiel.documentsPermis.fields.moment')}
              <select className="mt-1 w-full border border-gray-300 px-2 py-2 text-sm" value={form.moment} onChange={(event) => setForm({ ...form, moment: event.target.value as DocumentPermisInput['moment'] })}>
                {MOMENTS.map((value) => <option key={value} value={value}>{t(`referentiel.documentsPermis.moments.${value}`)}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              {t('referentiel.documentsPermis.fields.processus')}
              <select className="mt-1 w-full border border-gray-300 px-2 py-2 text-sm" value={form.processus} onChange={(event) => setForm({ ...form, processus: event.target.value as DocumentPermisInput['processus'] })}>
                {PROCESSUS.map((value) => <option key={value} value={value}>{t(`referentiel.documentsPermis.processus.${value}`)}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              {t('referentiel.documentsPermis.fields.type')}
              <select className="mt-1 w-full border border-gray-300 px-2 py-2 text-sm" value={form.typePermis} onChange={(event) => setForm({ ...form, typePermis: event.target.value as DocumentPermisInput['typePermis'] })}>
                {TYPES.map((value) => <option key={value} value={value}>{t(`referentiel.documentsPermis.types.${value}`)}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              {t('referentiel.documentsPermis.fields.demande')}
              <select className="mt-1 w-full border border-gray-300 px-2 py-2 text-sm" value={form.demande} onChange={(event) => setForm({ ...form, demande: event.target.value as DocumentPermisInput['demande'] })}>
                {DEMANDES.map((value) => <option key={value} value={value}>{t(`referentiel.documentsPermis.demandes.${value}`)}</option>)}
              </select>
            </label>
            <Input label={t('referentiel.documentsPermis.fields.ordre')} type="number" value={String(form.ordre)} onChange={(event) => setForm({ ...form, ordre: Number(event.target.value) })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.obligatoire} onChange={(event) => setForm({ ...form, obligatoire: event.target.checked })} />{t('referentiel.documentsPermis.fields.obligatoire')}</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.autoriseNA} onChange={(event) => setForm({ ...form, autoriseNA: event.target.checked })} />{t('referentiel.documentsPermis.fields.autoriseNA')}</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.apnApiUniquement} onChange={(event) => setForm({ ...form, apnApiUniquement: event.target.checked })} />{t('referentiel.documentsPermis.apn')}</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.actif} onChange={(event) => setForm({ ...form, actif: event.target.checked })} />{t('referentiel.documentsPermis.fields.actif')}</label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setForm(null)}>{t('referentiel.documentsPermis.cancel')}</Button>
              <Button type="submit" disabled={save.isPending}>{t('referentiel.documentsPermis.save')}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
