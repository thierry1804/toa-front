import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useUiStore } from "@/store/ui.store";
import { sousTraitantApi, type PlanificationAffectation } from "@/api/sousTraitantApi";

export default function SousTraitantsPage() {
  const { t } = useTranslation();
  const addToast = useUiStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [nom, setNom] = useState("");
  const [drafts, setDrafts] = useState<Record<number, string[]>>({});

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
  const plans = affectations.data ?? [];

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
        <h2 className="text-base font-medium text-gray-900">{t("users.sousTraitant.listTitle")}</h2>
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
          />
          <Button type="submit" className="sm:self-end" disabled={create.isPending}>
            {t("common.create")}
          </Button>
        </form>
        <ul className="mt-4 divide-y divide-gray-200 border-t border-gray-200">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 py-2 text-sm text-gray-900">
              <span>{row.nom}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => remove.mutate(row.id)}
                disabled={remove.isPending}
              >
                {t("common.delete")}
              </Button>
            </li>
          ))}
          {rows.length === 0 && !sousTraitants.isLoading && (
            <li className="py-3 text-sm text-gray-600">{t("users.sousTraitant.empty")}</li>
          )}
        </ul>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-base font-medium text-gray-900">{t("users.sousTraitant.assignTitle")}</h2>
        <p className="mt-1 text-sm text-gray-600">{t("users.sousTraitant.assignHint")}</p>
        {affectations.isError && (
          <p className="mt-3 text-sm text-gray-700">{t("users.sousTraitant.assignDenied")}</p>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-700">
                <th className="py-2 pr-4 font-medium">{t("users.sousTraitant.site")}</th>
                <th className="py-2 pr-4 font-medium">{t("users.sousTraitant.process")}</th>
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
            <p className="py-3 text-sm text-gray-600">{t("users.sousTraitant.noPlan")}</p>
          )}
        </div>
      </section>
    </div>
  );
}
