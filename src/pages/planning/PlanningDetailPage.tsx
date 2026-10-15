import { InfoItem, InfoList } from "@/components/ui/InfoList";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useActivityPlanning } from "@/features/planning/hooks/useActivityPlanning";
import { usePermissions } from "@/features/menus/hooks/usePermissions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ListPageSkeleton from "@/components/ui/ListPageSkeleton";
import { ArrowLeft, Edit, Plus, MapPin, AlertTriangle } from "lucide-react";
import { formatDate } from "@/utils/date";
import { STATUS_CONFIG } from "@/data/constant/planning";

function InfoRow({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return <InfoItem label={label} value={value} wide={wide} />;
}

export default function PlanningDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const permsPlanning = usePermissions("/planning");
  const permsPrevention = usePermissions("/prevention");

  const { data: plan, isLoading, isError } = useActivityPlanning(Number(id));

  if (isLoading) {
    return <ListPageSkeleton withStatStrip={false} />;
  }

  if (isError || !plan) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-gray-500">
        <AlertTriangle className="h-10 w-10 text-gray-300" />
        <p>{t("planning.detail.notFound")}</p>
        <Button variant="outline" onClick={() => navigate("/planning")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("planning.detail.back")}
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[plan.status];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[
          { label: t("planning.title"), href: "/planning" },
          { label: `#${plan.id}` },
        ]}
        title={`${t("planning.detail.title")} #${plan.id}`}
        description={plan.process}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => navigate("/planning")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("planning.detail.back")}
            </Button>
            {permsPlanning?.canEdit && (
              <Link to={`/planning/${plan.id}/edit`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  {t("planning.detail.editBtn")}
                </Button>
              </Link>
            )}
            {permsPrevention?.canCreate && (
              <Link to={`/prevention/new?planificationId=${plan.id}`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("planning.detail.createPreventionBtn")}
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            {t("planning.detail.infoTitle")}
            {statusConfig && (
              <Badge variant={statusConfig.variant}>
                {t(`planning.status.${plan.status}`)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InfoList>
            <InfoRow label={t("planning.detail.process")} value={plan.process} />
            {plan.typeIntervention && (
              <InfoRow
                label={t("planning.detail.typeIntervention")}
                value={plan.typeIntervention}
              />
            )}
            <InfoRow
              label={t("planning.detail.site")}
              value={
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  {plan.siteName} ({plan.siteCode})
                </span>
              }
            />
            <InfoRow
              label={t("planning.detail.provider")}
              value={plan.entreprise?.nom ?? plan.provider}
            />
            <InfoRow
              label={t("planning.detail.expectedDates")}
              value={`${formatDate(plan.expectedStartDate)} → ${formatDate(plan.expectedEndDate)}`}
            />
            {(plan.actualStartDate || plan.actualEndDate) && (
              <InfoRow
                label={t("planning.detail.actualDates")}
                value={`${plan.actualStartDate ? formatDate(plan.actualStartDate) : "—"} → ${
                  plan.actualEndDate ? formatDate(plan.actualEndDate) : "—"
                }`}
              />
            )}
            {plan.permitReference && (
              <InfoRow
                label={t("planning.detail.permitReference")}
                value={plan.permitReference}
              />
            )}
          </InfoList>
        </CardContent>
      </Card>
    </div>
  );
}
