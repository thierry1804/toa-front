import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['documents-permis'] })
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
  const toggle = useMutation({
    mutationFn: (regle: DocumentPermisRegle) => documentPermisApi.update(regle.id, { actif: !regle.actif }),
    onSuccess: refresh,
  })

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('referentiel.documentsPermis.title')}
        description={t('referentiel.documentsPermis.subtitle')}
        actions={canCreate ? <Button onClick={() => { setEditing(null); setForm(emptyForm()) }}>{t('referentiel.documentsPermis.add')}</Button> : undefined}
      />
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-3 py-2 font-medium">{t('referentiel.documentsPermis.fields.libelle')}</th>
                <th className="px-3 py-2 font-medium">{t('referentiel.documentsPermis.fields.moment')}</th>
                <th className="px-3 py-2 font-medium">{t('referentiel.documentsPermis.fields.cas')}</th>
                <th className="px-3 py-2 font-medium">{t('referentiel.documentsPermis.fields.obligatoire')}</th>
                <th className="px-3 py-2 font-medium">{t('referentiel.documentsPermis.fields.actif')}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td className="px-3 py-4" colSpan={6}>{t('referentiel.documentsPermis.loading')}</td></tr>}
              {data.map((regle) => (
                <tr key={regle.id} className="border-b border-gray-100">
                  <td className="px-3 py-2">
                    <div>{regle.libelle}</div>
                    <div className="text-xs text-gray-500">{regle.code}</div>
                  </td>
                  <td className="px-3 py-2">{t(`referentiel.documentsPermis.moments.${regle.moment}`)}</td>
                  <td className="px-3 py-2">
                    {t(`referentiel.documentsPermis.processus.${regle.processus}`)} · {t(`referentiel.documentsPermis.types.${regle.typePermis}`)} · {t(`referentiel.documentsPermis.demandes.${regle.demande}`)}
                    {regle.apnApiUniquement ? ` · ${t('referentiel.documentsPermis.apn')}` : ''}
                  </td>
                  <td className="px-3 py-2">{regle.obligatoire ? t('referentiel.documentsPermis.yes') : t('referentiel.documentsPermis.no')}</td>
                  <td className="px-3 py-2">{regle.actif ? t('referentiel.documentsPermis.yes') : t('referentiel.documentsPermis.no')}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    {canEdit && <Button size="sm" variant="outline" onClick={() => { setEditing(regle); setForm({ ...regle }) }}>{t('referentiel.documentsPermis.edit')}</Button>}
                    {canEdit && <Button size="sm" variant="outline" onClick={() => toggle.mutate(regle)}>{regle.actif ? t('referentiel.documentsPermis.deactivate') : t('referentiel.documentsPermis.activate')}</Button>}
                    {canDelete && <Button size="sm" variant="outline" onClick={() => remove.mutate(regle.id)}>{t('referentiel.documentsPermis.delete')}</Button>}
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
