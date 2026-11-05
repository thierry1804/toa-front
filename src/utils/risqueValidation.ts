import type { CategorieRisque } from '@/types/referentiel'

interface RiskRowLike {
  categorieIds?: string[]
}

type CategoryLike = Pick<CategorieRisque, 'id' | 'parentId'>

/**
 * Un risque n'est exploitable que s'il porte au moins une sous-catégorie
 * (catégorie enfant) : la catégorie racine seule reste trop vague pour
 * pré-remplir les permis de travail ("Quels sont les dangers ?").
 */
export function rowsWithoutSousRisque<T extends RiskRowLike>(
  rows: T[],
  categories: CategoryLike[],
): T[] {
  const byId = new Map(categories.map((c) => [c.id, c]))
  return rows.filter((row) => !(row.categorieIds ?? []).some((id) => Boolean(byId.get(id)?.parentId)))
}
