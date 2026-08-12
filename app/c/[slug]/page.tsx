import { headers } from "next/headers";
import {
  Calendar,
  FileText,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  UserPlus,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReciprocalForm } from "@/components/features/reciprocal-form";
import { getPublishedProfileBySlug, recordProfileView } from "@/lib/supabase/queries";
import type { Profile } from "@/lib/supabase/types";

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

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function buildVCardHref(profile: Profile) {
  const displayName = profile.full_name ?? "Carte LinkCard";
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${displayName}`,
    profile.company ? `ORG:${profile.company}` : "",
    profile.job_title ? `TITLE:${profile.job_title}` : "",
    profile.phone ? `TEL;TYPE=CELL:${profile.phone}` : "",
    profile.whatsapp_number ? `TEL;TYPE=WORK,VOICE:${profile.whatsapp_number}` : "",
    profile.email ? `EMAIL:${profile.email}` : "",
    profile.website_url ? `URL:${profile.website_url}` : "",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
  return `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`;
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
        <div
          className="flex h-32 items-end p-4"
          style={{
            background: `linear-gradient(135deg, ${profile.brand_primary_color ?? "#2563EB"}, ${
              profile.brand_primary_color ?? "#3B82F6"
            }aa)`,
          }}
        >
          <Avatar className="size-16 border-4 border-card">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
            <AvatarFallback className="bg-white/20 text-lg text-white">
              {initialsOf(displayName)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex flex-col items-center gap-1 px-5 pb-6 pt-4 text-center">
          <h1 className="font-display text-xl font-semibold">{displayName}</h1>
          {profile.job_title && <p className="text-sm text-muted-foreground">{profile.job_title}</p>}
          {profile.company && <p className="text-sm text-muted-foreground">{profile.company}</p>}

          <div className="mt-4 grid w-full grid-cols-4 gap-2">
            <a
              href={profile.phone ? `tel:${profile.phone}` : undefined}
              aria-disabled={!profile.phone}
              className="flex flex-col items-center gap-1 rounded-lg bg-muted py-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted/70 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            >
              <Phone className="size-4" />
              Appeler
            </a>
            <a
              href={profile.email ? `mailto:${profile.email}` : undefined}
              aria-disabled={!profile.email}
              className="flex flex-col items-center gap-1 rounded-lg bg-muted py-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted/70 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            >
              <Mail className="size-4" />
              Email
            </a>
            <a
              href={profile.website_url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!profile.website_url}
              className="flex flex-col items-center gap-1 rounded-lg bg-muted py-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted/70 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            >
              <Link2 className="size-4" />
              Site
            </a>
            <a
              href={
                profile.address
                  ? `https://maps.google.com/?q=${encodeURIComponent(profile.address)}`
                  : undefined
              }
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!profile.address}
              className="flex flex-col items-center gap-1 rounded-lg bg-muted py-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted/70 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            >
              <MapPin className="size-4" />
              Itinéraire
            </a>
          </div>

          {links.length > 0 && (
            <div className="mt-4 flex w-full flex-col gap-2">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                >
                  <link.icon className="size-4 text-muted-foreground" />
                  {link.label}
                </a>
              ))}
            </div>
          )}

          <a
            href={buildVCardHref(profile)}
            download={`${displayName.replace(/\s+/g, "-")}.vcf`}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <UserPlus className="size-4" />
            Enregistrer le contact
          </a>
        </div>
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
