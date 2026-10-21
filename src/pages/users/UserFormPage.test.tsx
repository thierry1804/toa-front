import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { cleanup, render } from '@/test/renderHelpers'
import UserFormPage from './UserFormPage'

const mocks = vi.hoisted(() => ({ createUser: vi.fn(), addToast: vi.fn() }))

const profile = {
  id: 1,
  roles: ['ROLE_PRESTATAIRE'],
  entreprise: { '@id': '/api/entreprises/e1', id: 'e1', nom: 'Ma Boite' },
  entrepriseName: 'Ma Boite',
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('@/features/users/hooks/useUsers', () => ({
  useUser: () => ({ data: undefined }),
  useCreateUser: () => ({ mutate: mocks.createUser, isPending: false }),
  useUpdateUser: () => ({ mutate: vi.fn(), isPending: false }),
  useUploadSignature: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/api/usersApi', () => ({ usersApi: { getSignatureBlob: vi.fn() } }))
vi.mock('@/features/menus/hooks/usePermissions', () => ({
  usePermissions: () => ({ canView: true, canCreate: true, canEdit: true, canDelete: false }),
}))
vi.mock('@/store/menu.store', () => ({
  useMenuStore: (selector: (state: { loaded: boolean }) => unknown) => selector({ loaded: true }),
}))
vi.mock('@/store/ui.store', () => ({
  useUiStore: (selector: (state: { addToast: typeof mocks.addToast }) => unknown) =>
    selector({ addToast: mocks.addToast }),
}))
vi.mock('@/features/roles/hooks/useRoles', () => ({
  useRoles: () => ({ data: { member: [] }, isLoading: false }),
}))
vi.mock('@/features/referentiel/hooks/useEntreprises', () => ({
  useEntreprises: () => ({ data: [profile.entreprise] }),
}))
vi.mock('@/features/users/hooks/usePrestataireEntrepriseScope', () => ({
  usePrestataireEntrepriseScope: () => ({
    isScoped: true,
    profile,
    isProfileLoading: false,
    canManageUser: () => true,
    hasEntreprise: true,
    entrepriseIri: profile.entreprise['@id'],
    entrepriseName: profile.entrepriseName,
  }),
}))
vi.mock('@/hooks/usePendingUploads', () => ({ usePendingUploads: () => [] }))

afterEach(() => {
  cleanup()
  mocks.createUser.mockReset()
})

async function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  await act(async () => {
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('user creation by a scoped prestataire', () => {
  it('submits the Chef de projet Prestataire role shown by default, not Prestataire', async () => {
    const { container } = await render(
      <MemoryRouter>
        <UserFormPage />
      </MemoryRouter>,
    )

    const roleSelect = container.querySelector('select') as HTMLSelectElement
    expect(roleSelect.value).toBe('ROLE_CHEF_PROJET_PRESTATAIRE')

    const inputs = [...container.querySelectorAll('input')] as HTMLInputElement[]
    const byType = (t: string) => inputs.filter((i) => i.type === t)
    const [name, firstname] = byType('text')
    await type(name, 'Kernel')
    await type(firstname, 'John')
    await type(byType('email')[0], 'john@example.com')
    const [password, confirm] = byType('password')
    await type(password, 'secret123')
    await type(confirm, 'secret123')

    await act(async () => {
      container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(mocks.createUser).toHaveBeenCalledTimes(1)
    expect(mocks.createUser.mock.calls[0][0].roles).toEqual(['ROLE_CHEF_PROJET_PRESTATAIRE'])
  })
})
