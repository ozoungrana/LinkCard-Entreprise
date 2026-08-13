import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Mail, MapPin, Phone, Link2 as SiteIcon, UserPlus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type CardTemplate = "corporate" | "elegant" | "creative";
export type CardFont = "manrope" | "jetbrains" | "georgia";

export const CARD_FONT_FAMILY: Record<CardFont, string> = {
  manrope: "var(--font-manrope), ui-sans-serif, sans-serif",
  jetbrains: "var(--font-jetbrains-mono), ui-monospace, monospace",
  georgia: "Georgia, 'Times New Roman', serif",
};

export type ExtraLink = { icon: LucideIcon; label: string; href: string };
type QuickAction = { icon: LucideIcon; label: string; href?: string };

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

function ActionPill({
  action,
  template,
  interactive,
  color,
}: {
  action: QuickAction;
  template: CardTemplate;
  interactive: boolean;
  color: string;
}) {
  const active = Boolean(action.href);
  const Icon = action.icon;

  let content: ReactNode;
  if (template === "elegant") {
    content = (
      <div
        className={`flex size-11 items-center justify-center rounded-full border transition-colors ${
          active ? "" : "border-muted-foreground/30 text-muted-foreground/40"
        }`}
        style={active ? { borderColor: color, color } : undefined}
      >
        <Icon className="size-4" />
      </div>
    );
  } else if (template === "creative") {
    content = (
      <div
        className={`flex flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-medium backdrop-blur transition-colors ${
          active ? "bg-white/15 text-white hover:bg-white/25" : "bg-white/5 text-white/40"
        }`}
      >
        <Icon className="size-4" />
        {action.label}
      </div>
    );
  } else {
    content = (
      <div
        className={`flex flex-col items-center gap-1 rounded-lg py-2.5 text-[11px] transition-colors ${
          active ? "bg-muted text-muted-foreground hover:bg-muted/70" : "bg-muted/50 text-muted-foreground/40"
        }`}
      >
        <Icon className="size-4" />
        {action.label}
      </div>
    );
  }

  if (interactive && action.href) {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer" title={action.label}>
        {content}
      </a>
    );
  }
  return content;
}

function CtaButton({
  label,
  href,
  download,
  color,
  template,
  interactive,
}: {
  label: string;
  href?: string;
  download?: string;
  color: string;
  template: CardTemplate;
  interactive: boolean;
}) {
  let className =
    "mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors";
  let style: CSSProperties = {};

  if (template === "elegant") {
    className += " border-2 bg-transparent hover:bg-muted/40";
    style = { borderColor: color, color };
  } else if (template === "creative") {
    className += " bg-white text-gray-900 hover:bg-white/90";
  } else {
    className += " text-white hover:opacity-90";
    style = { background: color };
  }

  if (interactive && href) {
    return (
      <a href={href} download={download} className={className} style={style}>
        <UserPlus className="size-4" />
        {label}
      </a>
    );
  }
  return (
    <div className={className} style={style}>
      <UserPlus className="size-4" />
      {label}
    </div>
  );
}

function LinkRow({
  link,
  template,
  interactive,
}: {
  link: ExtraLink;
  template: CardTemplate;
  interactive: boolean;
}) {
  const className =
    template === "creative"
      ? "flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
      : template === "elegant"
        ? "flex items-center justify-center gap-2 py-2.5 text-sm transition-colors hover:opacity-70"
        : "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted/50";

  const content = (
    <>
      <link.icon className={template === "creative" ? "size-3.5" : "size-4 text-muted-foreground"} />
      {link.label}
    </>
  );

  if (interactive) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }
  return <div className={className}>{content}</div>;
}

export function CardFace({
  name,
  jobTitle,
  company,
  avatarUrl,
  primaryColor,
  font,
  template,
  phoneHref,
  emailHref,
  siteHref,
  addressHref,
  extraLinks,
  ctaLabel,
  ctaHref,
  ctaDownload,
  interactive,
}: {
  name: string;
  jobTitle?: string | null;
  company?: string | null;
  avatarUrl?: string | null;
  primaryColor: string;
  font?: string | null;
  template?: string | null;
  phoneHref?: string;
  emailHref?: string;
  siteHref?: string;
  addressHref?: string;
  extraLinks: ExtraLink[];
  ctaLabel: string;
  ctaHref?: string;
  ctaDownload?: string;
  interactive: boolean;
}) {
  const resolvedFont: CardFont =
    font === "jetbrains" || font === "georgia" ? font : "manrope";
  const resolvedTemplate: CardTemplate =
    template === "elegant" || template === "creative" ? template : "corporate";
  const fontFamily = CARD_FONT_FAMILY[resolvedFont];

  const quickActions: QuickAction[] = [
    { icon: Phone, label: "Appeler", href: phoneHref },
    { icon: Mail, label: "Email", href: emailHref },
    { icon: SiteIcon, label: "Site", href: siteHref },
    { icon: MapPin, label: "Itinéraire", href: addressHref },
  ];

  if (resolvedTemplate === "elegant") {
    return (
      <div style={{ fontFamily }} className="flex flex-col items-center gap-1 bg-card px-5 pb-6 pt-8 text-center">
        <div className="h-1 w-10 rounded-full" style={{ background: primaryColor }} />
        <Avatar className="mt-4 size-20 border-2" style={{ borderColor: primaryColor }}>
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback className="text-xl">{initialsOf(name)}</AvatarFallback>
        </Avatar>
        <h1 className="mt-3 text-xl font-semibold tracking-tight">{name}</h1>
        {jobTitle && <p className="text-sm text-muted-foreground">{jobTitle}</p>}
        {company && <p className="text-sm text-muted-foreground">{company}</p>}

        <div className="mt-5 flex w-full items-center justify-center gap-3">
          {quickActions.map((a) => (
            <ActionPill
              key={a.label}
              action={a}
              template={resolvedTemplate}
              interactive={interactive}
              color={primaryColor}
            />
          ))}
        </div>

        {extraLinks.length > 0 && (
          <div className="mt-5 flex w-full flex-col divide-y divide-border border-y">
            {extraLinks.map((l) => (
              <LinkRow key={l.label} link={l} template={resolvedTemplate} interactive={interactive} />
            ))}
          </div>
        )}

        <CtaButton
          label={ctaLabel}
          href={ctaHref}
          download={ctaDownload}
          color={primaryColor}
          template={resolvedTemplate}
          interactive={interactive}
        />
      </div>
    );
  }

  if (resolvedTemplate === "creative") {
    return (
      <div
        style={{
          fontFamily,
          background: `linear-gradient(160deg, ${primaryColor}, ${primaryColor}cc 60%, #111827)`,
        }}
        className="flex flex-col items-center gap-1 px-5 pb-6 pt-8 text-center text-white"
      >
        <Avatar className="size-20 ring-4 ring-white/40">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback className="bg-white/20 text-xl text-white">{initialsOf(name)}</AvatarFallback>
        </Avatar>
        <h1 className="mt-3 text-xl font-bold">{name}</h1>
        {jobTitle && <p className="text-sm text-white/80">{jobTitle}</p>}
        {company && <p className="text-sm text-white/80">{company}</p>}

        <div className="mt-5 grid w-full grid-cols-4 gap-2">
          {quickActions.map((a) => (
            <ActionPill
              key={a.label}
              action={a}
              template={resolvedTemplate}
              interactive={interactive}
              color={primaryColor}
            />
          ))}
        </div>

        {extraLinks.length > 0 && (
          <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
            {extraLinks.map((l) => (
              <LinkRow key={l.label} link={l} template={resolvedTemplate} interactive={interactive} />
            ))}
          </div>
        )}

        <CtaButton
          label={ctaLabel}
          href={ctaHref}
          download={ctaDownload}
          color={primaryColor}
          template={resolvedTemplate}
          interactive={interactive}
        />
      </div>
    );
  }

  // corporate (default)
  return (
    <div style={{ fontFamily }}>
      <div
        className="flex h-32 items-end p-4"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}aa)` }}
      >
        <Avatar className="size-16 border-4 border-card">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback className="bg-white/20 text-lg text-white">{initialsOf(name)}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col items-center gap-1 px-5 pb-6 pt-4 text-center">
        <h1 className="text-xl font-semibold">{name}</h1>
        {jobTitle && <p className="text-sm text-muted-foreground">{jobTitle}</p>}
        {company && <p className="text-sm text-muted-foreground">{company}</p>}

        <div className="mt-4 grid w-full grid-cols-4 gap-2">
          {quickActions.map((a) => (
            <ActionPill
              key={a.label}
              action={a}
              template={resolvedTemplate}
              interactive={interactive}
              color={primaryColor}
            />
          ))}
        </div>

        {extraLinks.length > 0 && (
          <div className="mt-4 flex w-full flex-col gap-2">
            {extraLinks.map((l) => (
              <LinkRow key={l.label} link={l} template={resolvedTemplate} interactive={interactive} />
            ))}
          </div>
        )}

        <CtaButton
          label={ctaLabel}
          href={ctaHref}
          download={ctaDownload}
          color={primaryColor}
          template={resolvedTemplate}
          interactive={interactive}
        />
      </div>
    </div>
  );
}
