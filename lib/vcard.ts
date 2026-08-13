import type { Profile } from "@/lib/supabase/types";

export function buildVCardHref(profile: Profile) {
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

export function vCardFilename(profile: Profile) {
  return `${(profile.full_name ?? "Carte-LinkCard").replace(/\s+/g, "-")}.vcf`;
}
