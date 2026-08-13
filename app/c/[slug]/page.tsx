import { headers } from "next/headers";
import { Calendar, FileText, Link2, MessageCircle, Search } from "lucide-react";

import { CardFace } from "@/components/features/card-face";
import { ReciprocalForm } from "@/components/features/reciprocal-form";
import { getPublishedProfileBySlug, recordProfileView } from "@/lib/supabase/queries";
import { buildVCardHref, vCardFilename } from "@/lib/vcard";

function parseUserAgent(ua: string) {
  const device = /Mobi|Android/i.test(ua) ? "Mobile" : /Tablet|iPad/i.test(ua) ? "Tablette" : "Ordinateur";
  let browser = "Autre";
  if (/EdgA?\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua) && !/Chromium|OPR\//.test(ua)) browser = "Chrome";
  else if (/CriOS\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome|CriOS/.test(ua)) browser = "Safari";
  return { device, browser };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ channel?: string }>;
}) {
  const { slug } = await params;
  const { channel } = await searchParams;
  const profile = await getPublishedProfileBySlug(slug);

  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted/30 px-4 text-center">
        <Search className="size-8 text-muted-foreground" />
        <h1 className="font-display text-lg font-semibold">Cette page n&apos;existe pas ou plus</h1>
        <p className="text-sm text-muted-foreground">
          Vérifie le lien, ou rends-toi sur linkcard.app
        </p>
      </main>
    );
  }

  const h = await headers();
  const { device, browser } = parseUserAgent(h.get("user-agent") ?? "");
  await recordProfileView(profile.id, {
    channel,
    device,
    browser,
    country: h.get("x-vercel-ip-country"),
  });

  const displayName = profile.full_name ?? "Carte LinkCard";
  const whatsappDigits = profile.whatsapp_number?.replace(/[^0-9]/g, "");
  const links = [
    whatsappDigits && {
      icon: MessageCircle,
      label: "WhatsApp",
      href: `https://wa.me/${whatsappDigits}`,
    },
    profile.linkedin_url && { icon: Link2, label: "LinkedIn", href: profile.linkedin_url },
    profile.calendly_url && {
      icon: Calendar,
      label: "Prendre rendez-vous",
      href: profile.calendly_url,
    },
    profile.portfolio_url && {
      icon: FileText,
      label: "Télécharger la brochure",
      href: profile.portfolio_url,
    },
  ].filter(Boolean) as { icon: typeof Link2; label: string; href: string }[];

  return (
    <main className="flex min-h-screen flex-col items-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border bg-card shadow-sm">
        <CardFace
          name={displayName}
          jobTitle={profile.job_title}
          company={profile.company}
          avatarUrl={profile.avatar_url}
          primaryColor={profile.brand_primary_color ?? "#2563EB"}
          font={profile.font}
          template={profile.template}
          phoneHref={profile.phone ? `tel:${profile.phone}` : undefined}
          emailHref={profile.email ? `mailto:${profile.email}` : undefined}
          siteHref={profile.website_url ?? undefined}
          addressHref={
            profile.address ? `https://maps.google.com/?q=${encodeURIComponent(profile.address)}` : undefined
          }
          extraLinks={links}
          ctaLabel="Enregistrer le contact"
          ctaHref={buildVCardHref(profile)}
          ctaDownload={vCardFilename(profile)}
          interactive
        />
      </div>

      <div className="mt-8 w-full max-w-sm rounded-2xl border bg-card p-5">
        <h2 className="mb-1 text-sm font-semibold">Formulaire de retour</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Renvoyez vos coordonnées à {displayName} en un clic, sans créer de compte.
        </p>
        <ReciprocalForm profileId={profile.id} recipientName={displayName} />
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Propulsé par <span className="font-medium">LinkCard</span>
      </p>
    </main>
  );
}
