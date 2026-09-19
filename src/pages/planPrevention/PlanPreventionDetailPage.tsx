import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Plus,
  AlertCircle,
  Eye,
  User,
  Calendar,
  FileText,
  ShieldCheck,
  ShieldX,
  Key,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import PlanReference from "@/components/planPrevention/PlanReference";
import RisqueMatrice from "@/components/planPrevention/RisqueMatrice";
import AnalyseRisquesPlanning from "@/components/planPrevention/AnalyseRisquesPlanning";
import InstallationsTable from "@/components/planPrevention/InstallationsTable";
import EquipementsTable from "@/components/planPrevention/EquipementsTable";
import StatutBadge from "@/components/planPrevention/StatutBadge";
import Badge from "@/components/ui/Badge";
import ExaminerModal from "@/components/planPrevention/ExaminerModal";
import ValiderModal from "@/components/planPrevention/ValiderModal";
import RefuserModal from "@/components/planPrevention/RefuserModal";
import PdfGenerationButton from "@/components/planPrevention/PdfGenerationButton";
import PdfStatusBadge from "@/components/planPrevention/PdfStatusBadge";
import DocumentViewerModal from "@/components/documents/DocumentViewerModal";
import DocumentTypeRow from "@/components/documents/DocumentTypeRow";
import {
  usePlanPreventionDetail,
  usePlanPrevention,
  usePlanPreventionPdf,
  useConsulterDocument,
} from "@/features/planPrevention/hooks/usePlanPrevention";
import { useCategoriesRisqueAll } from "@/features/referentiel/hooks/useCategorieRisque";
import { useHasRole, usePermission } from "@/features/auth/usePermission";
import { planPreventionApi } from "@/api/planPreventionApi";
import {
  TYPES_DOCUMENT_LABELS,
  ALL_DOCUMENT_TYPES,
} from "@/types/planPrevention";
import type { RisqueRow } from "@/types/planPrevention";
import { planSections } from "@/utils/planSections";

const STATUTS_EXAMINABLES = ["SOUMIS", "EN_COURS_DE_VALIDATION"] as const;

// Roles for which the back records a document consultation (PlanPreventionDocumentConsulterController).
const CONSULTATION_ROLES = ["ROLE_CHEF_PROJET", "ROLE_HSE", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"] as const;

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-800">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-48 shrink-0 text-sm font-medium text-gray-500">
        {label}
      </dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: "VALIDE" | "REFUSE" }) {
  const { t } = useTranslation();
  return decision === "VALIDE" ? (
    <Badge variant="success">
      <ShieldCheck className="mr-1 h-3 w-3" />
      {t("planPrevention.decision.VALIDE")}
    </Badge>
  ) : (
    <Badge variant="danger">
      <ShieldX className="mr-1 h-3 w-3" />
      {t("planPrevention.decision.REFUSE")}
    </Badge>
  );
}

export default function PlanPreventionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const canExamine = usePermission("plan_prevention.examine");
  const canValiderHse = usePermission("plan_prevention.valider_hse");
  const canRefuserHse = usePermission("plan_prevention.refuser_hse");
  const hasReviewerRole = useHasRole(...CONSULTATION_ROLES);
  const canCreatePermit = usePermission("permit_travail.create");

  const { data: plan, isLoading, isError } = usePlanPreventionDetail(id ?? "");
  const {
    examinerPlan,
    isExamining,
    validerPlan,
    isValidating,
    refuserPlan,
    isRefusing,
  } = usePlanPrevention();
  const { pdfStatut } = usePlanPreventionPdf(id ?? "", {
    enabled: plan?.statut === "VALIDE_HSE",
  });
  const { data: categoriesData } = useCategoriesRisqueAll();
  const allCategories = categoriesData?.member ?? [];

  const [examinerOpen, setExaminerOpen] = useState(false);
  const [validerOpen, setValiderOpen] = useState(false);
  const [refuserOpen, setRefuserOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{ id: string; label: string } | null>(null);
  // Une consultation par pièce et par affichage : le visionneur peut se recharger plusieurs fois, et hors-ligne
  // chaque envoi serait une action de plus en file de synchronisation.
  const consultationSent = useRef(new Set<string>());
  const consulter = useConsulterDocument(id ?? "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <svg
          className="mr-2 h-5 w-5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        {t("planPrevention.detail.loading")}
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-red-400" />
        <p className="font-medium text-gray-700">
          {t("planPrevention.detail.notFound")}
        </p>
        <p className="mt-1 text-sm text-gray-400">
          {t("planPrevention.detail.notFoundDesc")}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/prevention")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("planPrevention.detail.back")}
        </Button>
      </div>
    );
  }

  const isReviewer =
    hasReviewerRole && (canExamine || canValiderHse || canRefuserHse);
  const docsConsulted = !isReviewer || plan.tousDocumentsConsultes !== false;
  const isExaminable =
    canExamine &&
    (STATUTS_EXAMINABLES as readonly string[]).includes(plan.statut);
  const isDecidable = plan.statut === "EXAMINE";
  const hasPendingReviewAction =
    isExaminable || (isDecidable && (canValiderHse || canRefuserHse));

  const markConsulted = (docId: string) => {
    if (!isReviewer || consultationSent.current.has(docId)) return;
    const doc = plan.documents?.find((d) => d.id === docId);
    if (!doc || doc.consultedAt) return;
    consultationSent.current.add(docId);
    consulter.mutate(docId, { onError: () => consultationSent.current.delete(docId) });
  };

  // La consultation (R-11) n'est comptée qu'une fois le fichier réellement affiché ou téléchargé : hors-ligne,
  // une pièce absente du cache ne doit pas être marquée « consultée ».
  const openDocument = (docId: string, label: string) => {
    setViewingDoc({ id: docId, label });
  };

  const risqueRows: RisqueRow[] = (plan.risques ?? []).map((r) => ({
    localId: r.id,
    tachePlanifieeId: r.tachePlanifieeId ?? null,
    description: r.description,
    categorieIds: (r.categoriesRisque ?? []).map((iri) => iri.split("/").pop() ?? iri),
    gravite: r.gravite,
    probabilite: r.probabilite,
    mesuresPreventives: r.mesuresPreventives,
    risqueResiduel: r.risqueResiduel ?? null,
  }));

  const downloadDocument = async (docId: string, filename: string) => {
    await planPreventionApi.downloadDocument(plan.id, docId, filename);
  };

  const dateDebut = plan.dateDebut
    ? new Date(plan.dateDebut).toLocaleDateString("fr-FR")
    : "—";
  const dateFin = plan.dateFin
    ? new Date(plan.dateFin).toLocaleDateString("fr-FR")
    : "—";

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[
          { label: "Plans de prévention", href: "/prevention" },
          { label: plan.reference },
        ]}
        title={t("planPrevention.detail.title")}
        description={t("planPrevention.detail.description")}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate("/prevention")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("planPrevention.detail.back")}
            </Button>
            {isExaminable && (
              <Button
                onClick={() => setExaminerOpen(true)}
                disabled={!docsConsulted}
                title={!docsConsulted ? t("planPrevention.toast.documentsNonConsultes") : undefined}
              >
                <Eye className="mr-2 h-4 w-4" />
                {t("planPrevention.detail.examinerBtn")}
              </Button>
            )}
            {canCreatePermit && plan.statut === "VALIDE_HSE" && (
              <Button
                onClick={() =>
                  navigate(
                    `/permits-travail/new?planId=${plan.id}&codeSite=${encodeURIComponent(plan.codeSite)}`,
                  )
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("planPrevention.detail.createPermitBtn")}
              </Button>
            )}
            <PdfGenerationButton planId={plan.id} planStatut={plan.statut} />
          </div>
        }
      />

      {isReviewer && !docsConsulted && hasPendingReviewAction && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-800">
            {t("planPrevention.toast.documentsNonConsultes")}
          </p>
        </div>
      )}

      {/* Panneau de décision HSE */}
      {isDecidable && (canValiderHse || canRefuserHse) && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="mb-3 text-sm font-semibold text-blue-800">
            {t("planPrevention.detail.decisionPanel")}
          </p>
          <div className="flex items-center gap-3">
            {canValiderHse && (
              <Button onClick={() => setValiderOpen(true)} disabled={!docsConsulted}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                {t("planPrevention.list.actions.valider")}
              </Button>
            )}
            {canRefuserHse && (
              <Button variant="danger" onClick={() => setRefuserOpen(true)} disabled={!docsConsulted}>
                <ShieldX className="mr-2 h-4 w-4" />
                {t("planPrevention.list.actions.refuser")}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Actions enregistrées hors-ligne, pas encore confirmées par le serveur */}
      {plan.pendingSync && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-800">
          {t("offline.planPending")}
        </div>
      )}

      {/* Badge PDF officiel */}
      {pdfStatut === "GENERE" && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 py-3">
          <PdfStatusBadge statut="GENERE" />
          <span className="text-sm font-medium text-green-800">
            PDF officiel disponible
          </span>
        </div>
      )}

      {/* 1. Informations générales */}
      <SectionCard title={t("planPrevention.detail.sections.generalInfo")}>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <PlanReference reference={plan.reference} />
            <StatutBadge statut={plan.statut} className="mt-0.5" />
          </div>
          <dl className="space-y-3">
            <InfoRow
              label={t("planPrevention.detail.fields.activitePlanifiee")}
              value={plan.activitePlanifiee}
            />
            <InfoRow
              label={t("planPrevention.detail.fields.processus")}
              value={plan.typeIntervention ?? "—"}
            />
            <InfoRow
              label={t("planPrevention.detail.fields.periode")}
              value={
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {dateDebut} → {dateFin}
                </span>
              }
            />
            <InfoRow
              label={t("planPrevention.detail.fields.createdBy")}
              value={
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-gray-400" />
                  {plan.createdBy?.name ?? "—"}
                </span>
              }
            />
            {plan.soumisAt && (
              <InfoRow
                label={t("planPrevention.detail.fields.soumisAt")}
                value={new Date(plan.soumisAt).toLocaleString("fr-FR")}
              />
            )}
            {plan.validatedAt && (
              <InfoRow
                label={t("planPrevention.detail.fields.validatedAt")}
                value={new Date(plan.validatedAt).toLocaleString("fr-FR")}
              />
            )}
            {plan.chefProjet && (
              <InfoRow
                label={t("planPrevention.detail.fields.chefProjet")}
                value={
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-gray-400" />
                    {plan.chefProjet.firstname
                      ? `${plan.chefProjet.firstname} ${plan.chefProjet.name}`
                      : plan.chefProjet.name}
                  </span>
                }
              />
            )}
          </dl>
        </div>
      </SectionCard>

      {/* 2. Analyse des risques */}
      <SectionCard
        title={`Analyse des risques (${risqueRows.length})`}
      >
        {planSections(plan).length > 0 ? (
          <AnalyseRisquesPlanning
            sections={planSections(plan)}
            rows={risqueRows}
            onChange={() => undefined}
            categories={allCategories}
            disabled
          />
        ) : (
          <RisqueMatrice rows={risqueRows} onChange={() => undefined} disabled />
        )}
      </SectionCard>

      {/* 3. Sites concernés (depuis la planification liée) */}
      {(() => {
        const rawPlanifSites = plan.planificationSites ?? [];
        const planifSites = rawPlanifSites.length === 0 && plan.codeSite
          ? [{ codeSite: plan.codeSite, nomSite: plan.localite ?? '' }]
          : rawPlanifSites;
        return (
          <SectionCard
            title={`Sites concernés${planifSites.length > 0 ? ` (${planifSites.length})` : ''}`}
          >
            {planifSites.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucun site renseigné.</p>
            ) : (
              <div className={planifSites.length > 10 ? "overflow-x-auto overflow-y-auto max-h-[26rem]" : "overflow-x-auto"}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-gray-200">
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Code site
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Nom du site
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {planifSites.map((site, i) => (
                      <tr key={site.codeSite ?? i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-xs text-gray-700">
                          {site.codeSite}
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                          {site.nomSite}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        );
      })()}

      {/* 4. Installations & Équipements — only for "Nouveau site" */}
      {plan.typeIntervention === "Nouveau site" && (
        <SectionCard title="Installations & Équipements">
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600">
                Installations et matériels utilisés
                {(plan.installations?.length ?? 0) > 0 &&
                  ` (${plan.installations!.length})`}
              </p>
              <InstallationsTable
                value={plan.installations ?? []}
                onChange={() => {}}
                readonly
                emptyLabel="Aucune installation renseignée."
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600">
                Matériels, équipements et outillages
                {(plan.equipements?.length ?? 0) > 0 &&
                  ` (${plan.equipements!.length})`}
              </p>
              <EquipementsTable
                value={plan.equipements ?? []}
                onChange={() => {}}
                readonly
                emptyLabel="Aucun équipement renseigné."
              />
            </div>
          </div>
        </SectionCard>
      )}

      {/* 5. Documents requis */}
      <SectionCard title={t("planPrevention.detail.sections.documents")}>
        <div className="space-y-3">
          {ALL_DOCUMENT_TYPES.map((type) => (
            <DocumentTypeRow
              key={type}
              label={TYPES_DOCUMENT_LABELS[type]}
              docs={(plan.documents ?? []).filter((d) => d.type === type)}
              pending={[]}
              missing
              disabled
              showConsulted={isReviewer}
              loadBlob={(docId) => planPreventionApi.getDocumentBlob(plan.id, docId)}
              onView={(doc) => openDocument(doc.id, TYPES_DOCUMENT_LABELS[type])}
              onCapture={async () => undefined}
              renderExtra={(doc) => (
                <button
                  type="button"
                  onClick={() => {
                    void downloadDocument(
                      doc.id,
                      (plan.documents ?? []).find((d) => d.id === doc.id)?.filePath.split("/").at(-1) ?? "document",
                    )
                      .then(() => markConsulted(doc.id))
                      .catch(() => undefined);
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  <Download className="h-3.5 w-3.5" />
                  {t("planPrevention.detail.download")}
                </button>
              )}
            />
          ))}
        </div>
      </SectionCard>

      {/* 6. Historique des examens */}
      <SectionCard title={t("planPrevention.detail.sections.examenHistory")}>
        {(plan.examens?.length ?? 0) === 0 ? (
          <p className="text-sm text-gray-400 italic">
            {t("planPrevention.detail.noExamens")}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {plan.examens!.map((examen) => (
              <li key={examen.id} className="py-3 space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-500" />
                  <span className="text-sm font-medium text-gray-800">
                    {t("planPrevention.detail.examinedBy")}{" "}
                    {examen.examinePar.firstname
                      ? `${examen.examinePar.firstname} ${examen.examinePar.name}`
                      : examen.examinePar.name}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">
                    {new Date(examen.examineAt).toLocaleString("fr-FR")}
                  </span>
                </div>
                {examen.commentaire && (
                  <p className="pl-6 text-sm text-gray-600 italic">
                    "{examen.commentaire}"
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* 7. Historique des décisions HSE */}
      <SectionCard title={t("planPrevention.detail.sections.hseHistory")}>
        {(plan.decisionsHse?.length ?? 0) === 0 ? (
          <p className="text-sm text-gray-400 italic">
            {t("planPrevention.detail.noDecisions")}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {plan.decisionsHse!.map((d) => (
              <li key={d.id} className="py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <DecisionBadge decision={d.decision} />
                  <span className="text-sm font-medium text-gray-800">
                    {t("planPrevention.detail.decisionBy")}{" "}
                    {d.decidePar.firstname
                      ? `${d.decidePar.firstname} ${d.decidePar.name}`
                      : d.decidePar.name}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">
                    {new Date(d.decidedAt).toLocaleString("fr-FR")}
                  </span>
                </div>
                {d.commentaire && (
                  <p className="pl-1 text-sm text-gray-600 italic">
                    "{d.commentaire}"
                  </p>
                )}
                <div className="flex items-center gap-1.5 pl-1">
                  <Key className="h-3.5 w-3.5 text-gray-400" />
                  <span className="break-all font-mono text-xs text-gray-400">
                    {d.signatureElectronique}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <ExaminerModal
        isOpen={examinerOpen}
        planId={plan.id}
        planReference={plan.reference}
        isExamining={isExamining}
        onClose={() => setExaminerOpen(false)}
        onExaminer={examinerPlan}
      />

      <ValiderModal
        isOpen={validerOpen}
        planId={plan.id}
        planReference={plan.reference}
        isValidating={isValidating}
        onClose={() => setValiderOpen(false)}
        onValider={validerPlan}
      />

      <RefuserModal
        isOpen={refuserOpen}
        planId={plan.id}
        planReference={plan.reference}
        isRefusing={isRefusing}
        onClose={() => setRefuserOpen(false)}
        onRefuser={refuserPlan}
      />

      <DocumentViewerModal
        isOpen={viewingDoc !== null}
        onClose={() => setViewingDoc(null)}
        title={viewingDoc?.label ?? ""}
        blob={viewingDoc ? () => planPreventionApi.getDocumentBlob(plan.id, viewingDoc.id) : null}
        onLoaded={() => {
          if (viewingDoc) markConsulted(viewingDoc.id);
        }}
      />
    </div>
  );
}
