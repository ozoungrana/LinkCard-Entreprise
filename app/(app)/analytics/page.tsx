import { TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAnalyticsCounts,
  getChannelBreakdown,
  getCountryBreakdown,
  getDailyViewCounts,
  getDeviceBreakdown,
  getMyLeads,
  getMyProfiles,
} from "@/lib/supabase/queries";

const CHANNEL_LABELS: Record<string, string> = {
  qr: "QR Code",
  nfc: "NFC",
  email_signature: "Signature email",
  lien_direct: "Lien direct",
  ocr: "OCR",
  import_csv: "Import CSV",
};

function BreakdownList({
  title,
  rows,
  labels,
  total,
}: {
  title: string;
  rows: { key: string; count: number }[];
  labels?: Record<string, string>;
  total: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Pas encore de données.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((r) => (
              <div key={r.key} className="flex items-center gap-2 text-sm">
                <span className="w-28 shrink-0 truncate text-muted-foreground">
                  {labels?.[r.key] ?? r.key}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${total > 0 ? (r.count / total) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-medium">{r.count}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AnalyticsPage() {
  const profiles = await getMyProfiles();
  const profileIds = profiles.map((p) => p.id);
  const [counts, dailyViews, leads, channelRows, deviceRows, countryRows] = await Promise.all([
    getAnalyticsCounts(profileIds),
    getDailyViewCounts(profileIds),
    getMyLeads(),
    getChannelBreakdown(profileIds),
    getDeviceBreakdown(profileIds),
    getCountryBreakdown(profileIds),
  ]);

  const conversionRate =
    counts.view > 0 ? ((leads.length / counts.view) * 100).toFixed(1) : "0.0";
  const maxDaily = Math.max(1, ...dailyViews.map((d) => d.count));

  const stats = [
    { label: "Vues totales", value: counts.view },
    { label: "Clics totaux", value: counts.click },
    { label: "Contacts capturés", value: leads.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold font-display">Analytics</h2>
        <p className="text-sm text-muted-foreground">7 derniers jours</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <div className="mt-2 text-2xl font-semibold font-display">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vues dans le temps</CardTitle>
        </CardHeader>
        <CardContent>
          {counts.view === 0 ? (
            <p className="text-sm text-muted-foreground">
              Pas encore de vues enregistrées — partage la page publique d&apos;une carte pour
              commencer à collecter des données.
            </p>
          ) : (
            <div className="flex h-32 items-end gap-2">
              {dailyViews.map((d) => (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-primary"
                    style={{ height: `${Math.max(4, (d.count / maxDaily) * 100)}px` }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(d.date).toLocaleDateString("fr-FR", { weekday: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Taux de conversion</CardTitle>
          <span className="flex items-center gap-1 text-sm font-semibold text-success">
            <TrendingUp className="size-3.5" />
            {conversionRate}%
          </span>
        </CardHeader>
        <CardContent className="flex items-end gap-4">
          <div className="flex flex-1 flex-col items-center gap-2">
            <div
              className="flex w-full items-end justify-center rounded-t-lg bg-gradient-to-b from-primary to-blue-400 pb-2 text-sm font-semibold text-primary-foreground"
              style={{ height: `${Math.max(40, 40 + Math.min(counts.view, 100))}px` }}
            >
              {counts.view}
            </div>
            <div className="text-xs text-muted-foreground">Vues de carte</div>
          </div>
          <div className="flex flex-1 flex-col items-center gap-2">
            <div
              className="flex w-full items-end justify-center rounded-t-lg bg-gradient-to-b from-success to-emerald-400 pb-2 text-sm font-semibold text-primary-foreground"
              style={{ height: `${Math.max(40, 40 + Math.min(leads.length, 100))}px` }}
            >
              {leads.length}
            </div>
            <div className="text-xs text-muted-foreground">Contacts capturés</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <BreakdownList
          title="Par canal"
          rows={channelRows.map((r) => ({ key: r.channel, count: r.count }))}
          labels={CHANNEL_LABELS}
          total={counts.view}
        />
        <BreakdownList
          title="Par appareil"
          rows={deviceRows.map((r) => ({ key: r.device, count: r.count }))}
          total={counts.view}
        />
        <BreakdownList
          title="Par pays"
          rows={countryRows.map((r) => ({ key: r.country, count: r.count }))}
          total={counts.view}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        La heatmap de la carte publique arrivera avec le suivi des clics par zone.
      </p>
    </div>
  );
}
