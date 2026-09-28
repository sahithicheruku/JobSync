import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const labels = {
  draft: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
} as const;

type FunnelStage = keyof typeof labels;

export default function JobFunnel({
  stages,
}: {
  stages: { status: FunnelStage; count: number; conversionRate: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Funnel</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-4">
        {stages.map(({ status, count, conversionRate }) => (
          <div key={status} className="rounded-md border p-3">
            <p className="text-sm text-muted-foreground">{labels[status]}</p>
            <p className="text-2xl font-semibold">{count}</p>
            <p className="text-xs text-muted-foreground">
              {status === "draft" ? "Baseline" : `${conversionRate}% from previous`}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
