import { afterEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useMenuStore } from '@/store/menu.store'
import { usePermission } from '@/features/auth/usePermission'
import { cleanup, render } from '@/test/renderHelpers'

function CreateAction() {
  return usePermission('permit_travail.create') ? <button>Create</button> : <p>Read</p>
}
function setMatrix(canCreate: boolean) {
  useMenuStore.setState({ items: [{ id: 1, name: 'Permits', route: '/permits-travail', children: [], canView: true, canCreate }], loaded: true })
}
afterEach(() => {
  cleanup()
  useAuthStore.setState({ roles: [], permissions: [] })
  useMenuStore.setState({ items: [], loaded: false })
})
describe('permit creation follows the admin menu matrix', () => {
  it('denies creation when the matrix denies it despite legacy action grants', async () => {
    useAuthStore.setState({ roles: ['ROLE_AGENT_TERRAIN'], permissions: ['permit_travail.create'] })
    setMatrix(false)
    const { container } = await render(<CreateAction />)
    expect(container.querySelector('button')).toBeNull()
  })
  it('grants creation to the field agent from the matrix without a separate role action', async () => {
    useAuthStore.setState({ roles: ['ROLE_AGENT_TERRAIN'], permissions: [] })
    setMatrix(true)
    const { container } = await render(<CreateAction />)
    expect(container.querySelector('button')).not.toBeNull()
  })
  it('denies creation until the menu is available', async () => {
    useAuthStore.setState({ roles: ['ROLE_HSE'], permissions: ['permit_travail.create'] })
    const { container } = await render(<CreateAction />)
    expect(container.querySelector('button')).toBeNull()
  })
  it.each(['ROLE_PRESTATAIRE', 'ROLE_CHEF_PROJET_PRESTATAIRE', 'ROLE_HSE', 'ROLE_SUPER_ADMIN', 'ROLE_CHEF_PROJET'])(
    'denies creation to %s even when the matrix allows it (R-14)',
    async (role) => {
      useAuthStore.setState({ roles: [role], permissions: ['permit_travail.create'] })
      setMatrix(true)
      const { container } = await render(<CreateAction />)
      expect(container.querySelector('button')).toBeNull()
    },
  )
  it('reacts to matrix permission revocation', async () => {
    useAuthStore.setState({ roles: ['ROLE_AGENT_TERRAIN'], permissions: [] })
    setMatrix(true)
    const { container } = await render(<CreateAction />)
    expect(container.querySelector('button')).not.toBeNull()
    await act(async () => { setMatrix(false) })
    expect(container.querySelector('button')).toBeNull()
  })
})
