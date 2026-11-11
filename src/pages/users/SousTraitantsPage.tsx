import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ChevronDown, ChevronUp, ChevronsUpDown, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useUiStore } from "@/store/ui.store";
import { sousTraitantApi, type PlanificationAffectation } from "@/api/sousTraitantApi";

type SortKey = "site" | "process" | "planification";
type SortDir = "asc" | "desc";

function sortValue(plan: PlanificationAffectation, key: SortKey): string {
  switch (key) {
    case "site":
      return `${plan.siteCode ?? ""} ${plan.siteName ?? ""}`.trim().toLowerCase();
    case "process":
      return (plan.typeIntervention || plan.process || "").toLowerCase();
    case "planification":
      return (plan.planPreventionReference ?? "").toLowerCase();
  }
}

export default function SousTraitantsPage() {
  const { t } = useTranslation();
  const addToast = useUiStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [nom, setNom] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, string[]>>({});
  const [assignSearch, setAssignSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);

  const toggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      return prev.dir === "asc" ? { key, dir: "desc" } : null;
    });
  };

  const renderSortIcon = (key: SortKey) => {
    if (sort?.key !== key) return <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />;
    return sort.dir === "asc" ? (
      <ChevronUp className="h-3.5 w-3.5 text-gray-700" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-gray-700" />
    );
  };

  const sousTraitants = useQuery({
    queryKey: ["sous-traitants"],
    queryFn: () => sousTraitantApi.list(),
  });
  const affectations = useQuery({
    queryKey: ["planifications-affectations"],
    queryFn: () => sousTraitantApi.affectations(),
  });

  const create = useMutation({
    mutationFn: (name: string) => sousTraitantApi.create(name),
    onSuccess: async () => {
      setNom("");
      setShowAddForm(false);
      await queryClient.invalidateQueries({ queryKey: ["sous-traitants"] });
    },
    onError: () => addToast({ message: t("users.sousTraitant.saveError"), type: "error" }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => sousTraitantApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sous-traitants"] });
      await queryClient.invalidateQueries({ queryKey: ["planifications-affectations"] });
    },
    onError: () => addToast({ message: t("users.sousTraitant.saveError"), type: "error" }),
  });
  const save = useMutation({
    mutationFn: (plan: PlanificationAffectation) =>
      sousTraitantApi.saveAffectation(plan.id, drafts[plan.id] ?? plan.sousTraitantIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["planifications-affectations"] });
      addToast({ message: t("users.sousTraitant.saved"), type: "success" });
    },
    onError: () => addToast({ message: t("users.sousTraitant.saveError"), type: "error" }),
  });

  const rows = sousTraitants.data ?? [];
  const allPlans = affectations.data ?? [];
  const query = assignSearch.trim().toLowerCase();
  const filteredPlans = query
    ? allPlans.filter((plan) =>
        [plan.siteCode, plan.siteName, plan.process, plan.typeIntervention, plan.planPreventionReference]
          .some((field) => (field ?? "").toLowerCase().includes(query)),
      )
    : allPlans;
  const plans = sort
    ? [...filteredPlans].sort((a, b) => {
        const cmp = sortValue(a, sort.key).localeCompare(sortValue(b, sort.key));
        return sort.dir === "asc" ? cmp : -cmp;
      })
    : filteredPlans;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("users.sousTraitant.title")}
        description={t("users.sousTraitant.description")}
        actions={
          <Link to="/users" className="inline-flex items-center gap-2 text-sm text-gray-700">
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Link>
        }
      />

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-medium text-gray-900">
            {t("users.sousTraitant.listTitle")} <span className="text-gray-400">({rows.length})</span>
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm((v) => !v)}>
            <Plus className="mr-1 h-4 w-4" />
            {t("common.create")}
          </Button>
        </div>

        {showAddForm && (
          <form
            className="mt-3 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              const name = nom.trim();
              if (name) create.mutate(name);
            }}
          >
            <Input
              label={t("users.sousTraitant.name")}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              autoFocus
            />
            <Button type="submit" className="sm:self-end" disabled={create.isPending}>
              {t("common.save")}
            </Button>
          </form>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {rows.map((row) => (
            <span
              key={row.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-800"
            >
              {row.nom}
              <button
                type="button"
                onClick={() => remove.mutate(row.id)}
                disabled={remove.isPending}
                className="text-gray-400 hover:text-red-600 disabled:opacity-40"
                aria-label={t("common.delete")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {rows.length === 0 && !sousTraitants.isLoading && (
            <p className="text-sm text-gray-600">{t("users.sousTraitant.empty")}</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-base font-medium text-gray-900">{t("users.sousTraitant.assignTitle")}</h2>
        <p className="mt-1 text-sm text-gray-600">{t("users.sousTraitant.assignHint")}</p>
        {affectations.isError && (
          <p className="mt-3 text-sm text-gray-700">{t("users.sousTraitant.assignDenied")}</p>
        )}
        <div className="mt-3">
          <Input
            placeholder={t("users.sousTraitant.search")}
            value={assignSearch}
            onChange={(e) => setAssignSearch(e.target.value)}
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-700">
                <th className="py-2 pr-4 font-medium">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-gray-900"
                    onClick={() => toggleSort("site")}
                  >
                    {t("users.sousTraitant.site")}
                    {renderSortIcon("site")}
                  </button>
                </th>
                <th className="py-2 pr-4 font-medium">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-gray-900"
                    onClick={() => toggleSort("process")}
                  >
                    {t("users.sousTraitant.process")}
                    {renderSortIcon("process")}
                  </button>
                </th>
                <th className="py-2 pr-4 font-medium">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-gray-900"
                    onClick={() => toggleSort("planification")}
                  >
                    {t("users.sousTraitant.planification")}
                    {renderSortIcon("planification")}
                  </button>
                </th>
                <th className="py-2 pr-4 font-medium">{t("users.sousTraitant.assigned")}</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => {
                const selected = drafts[plan.id] ?? plan.sousTraitantIds;
                return (
                  <tr key={plan.id} className="border-b border-gray-100 align-top">
                    <td className="py-3 pr-4 text-gray-900">
                      {plan.siteCode} {plan.siteName}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{plan.typeIntervention || plan.process}</td>
                    <td className="py-3 pr-4 text-gray-700">
                      {plan.planPreventionReference ? (
                        <>
                          <span className="font-medium text-gray-900">{plan.planPreventionReference}</span>
                          {plan.activitePlanifiee && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{plan.activitePlanifiee}</p>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">{t("users.sousTraitant.noPlanPrevention")}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="grid gap-1">
                        {rows.map((row) => (
                          <label key={row.id} className="flex min-h-9 items-center gap-2 text-gray-800">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300"
                              checked={selected.includes(row.id)}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...selected, row.id]
                                  : selected.filter((id) => id !== row.id);
                                setDrafts((prev) => ({ ...prev, [plan.id]: next }));
                              }}
                            />
                            {row.nom}
                          </label>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">
                      <Button
                        type="button"
                        size="sm"
                        disabled={save.isPending || drafts[plan.id] === undefined}
                        onClick={() => save.mutate(plan)}
                      >
                        {t("common.save")}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {plans.length === 0 && !affectations.isLoading && !affectations.isError && (
            <p className="py-3 text-sm text-gray-600">
              {allPlans.length === 0 ? t("users.sousTraitant.noPlan") : t("users.sousTraitant.noPlanMatch")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
