export const CATEGORIES_RISQUES: Record<
  string,
  {
    label: string
    color: string
    sousCategories: { value: string; label: string }[]
  }
> = {
  environnement: {
    label: "Risques liés à l'environnement",
    color: "green",
    sousCategories: [
      { value: "pollutions_deversement", label: "Pollutions (déversement)" },
      { value: "incendie", label: "Incendie" },
      { value: "nuisances_sonores", label: "Nuisances sonores" },
      { value: "emissions_atmospheriques", label: "Émissions atmosphériques" },
      { value: "gestion_dechets", label: "Gestion des déchets" },
      { value: "autre", label: "Autre (à préciser)" },
    ],
  },
  social: {
    label: "Risque Social",
    color: "blue",
    sousCategories: [
      { value: "contestation_riveraine", label: "Contestation riveraine" },
      { value: "surete", label: "Sûreté" },
      { value: "relations_communautaires", label: "Relations avec les communautés" },
      { value: "acces_site", label: "Accès au site" },
      { value: "autre", label: "Autre (à préciser)" },
    ],
  },
  sante_securite: {
    label: "Risque lié à la santé et sécurité",
    color: "red",
    sousCategories: [
      { value: "securite_routiere", label: "Accident lié à la sécurité routière" },
      { value: "risque_chimique", label: "Risque chimique" },
      { value: "risque_hauteur", label: "Risque en hauteur" },
      { value: "ensevelissement", label: "Risque d'ensevelissement et/ou effondrement" },
      { value: "noyade", label: "Risque de noyade" },
      { value: "electrique", label: "Risques liés aux installations électriques" },
      { value: "outils_main", label: "Risque lié à la manipulation des outils à la main" },
      { value: "outillage_electroportatif", label: "Risque lié à la manipulation des outillages électroportatifs" },
      { value: "manutention_mecanique", label: "Accident lié à manutention mécanique" },
      { value: "manutention_manuelle", label: "Accident lié à manutention manuelle" },
      { value: "travaux_chaud", label: "Risque lié au travail à chaud" },
      { value: "travaux_isole", label: "Risque lié au travail isolé" },
      { value: "coactivites", label: "Risque lié aux coactivités" },
      { value: "ambiance_thermique", label: "Risque lié à l'ambiance thermique" },
      { value: "bruit", label: "Risque lié au bruit" },
      { value: "psychosociaux", label: "Risques psychosociaux" },
      { value: "maladies_infectieuses", label: "Risque face aux maladies infectieuses" },
      { value: "paludisme", label: "Risque du paludisme" },
      { value: "autre", label: "Autre (à préciser)" },
    ],
  },
  infrastructure: {
    label: "Risque lié aux installation/infrastructure existants",
    color: "orange",
    sousCategories: [
      { value: "acces_site", label: "Risques liés à l'accès sur site" },
      { value: "etat_infrastructures", label: "Risques liés à l'état des infrastructures existants (Greenfield, Rooftop)" },
      { value: "stabilite_structures", label: "Stabilité des structures existantes" },
      { value: "reseaux_enterres", label: "Réseaux enterrés" },
      { value: "autre", label: "Autre (à préciser)" },
    ],
  },
}
