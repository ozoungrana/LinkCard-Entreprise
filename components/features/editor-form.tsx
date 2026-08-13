"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  Camera,
  Check,
  Globe,
  History,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  User,
} from "lucide-react";

import {
  setProfileStatus,
  updateProfile,
  uploadAvatar,
  type ProfileFormValues,
} from "@/lib/actions/profiles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VersionHistorySheet } from "@/components/features/version-history-sheet";
import type { Profile, ProfileVersion } from "@/lib/supabase/types";

const swatches = ["#2563EB", "#06B6D4", "#DB2777", "#111827", "#22C55E", "#EA580C"];

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

export function EditorForm({
  profile,
  versions,
}: {
  profile: Profile;
  versions: ProfileVersion[];
}) {
  const [values, setValues] = useState<ProfileFormValues>({
    full_name: profile.full_name ?? "",
    job_title: profile.job_title ?? "",
    company: profile.company ?? "",
    phone: profile.phone ?? "",
    whatsapp_number: profile.whatsapp_number ?? "",
    email: profile.email ?? "",
    address: profile.address ?? "",
    website_url: profile.website_url ?? "",
    linkedin_url: profile.linkedin_url ?? "",
    calendly_url: profile.calendly_url ?? "",
    portfolio_url: profile.portfolio_url ?? "",
    brand_primary_color: profile.brand_primary_color ?? swatches[0],
    font: profile.font ?? "manrope",
    template: profile.template ?? "corporate",
  });
  const [status, setStatus] = useState(profile.status);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [avatarPending, setAvatarPending] = useState(false);
  const [pending, startTransition] = useTransition();
  const [publishPending, startPublishTransition] = useTransition();
  const [historyOpen, setHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarPending(true);
    uploadAvatar(profile.id, file)
      .then(({ avatarUrl: url }) => {
        setAvatarUrl(url);
        toast.success("Photo mise à jour");
        router.refresh();
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Échec de l'envoi de la photo");
      })
      .finally(() => setAvatarPending(false));
  }

  function set<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateProfile(profile.id, values);
        toast.success("Carte enregistrée");
        router.refresh();
      } catch {
        toast.error("Échec de l'enregistrement", {
          action: { label: "Réessayer", onClick: handleSave },
        });
      }
    });
  }

  function handleTogglePublish() {
    const next = status === "published" ? "draft" : "published";
    startPublishTransition(async () => {
      try {
        await setProfileStatus(profile.id, next);
        setStatus(next);
        toast.success(next === "published" ? "Carte publiée" : "Carte dépubliée");
        router.refresh();
      } catch {
        toast.error("Échec de l'opération");
      }
    });
  }

  const previewName = values.full_name || "Nouvelle carte";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px_320px]">
      {/* Left: informations */}
      <Card className="p-0">
        <Tabs defaultValue="infos">
          <TabsList className="m-2">
            <TabsTrigger value="infos">Infos</TabsTrigger>
            <TabsTrigger value="liens">Liens</TabsTrigger>
          </TabsList>

          <TabsContent value="infos" className="flex flex-col gap-4 p-4 pt-2">
            <Field>
              <FieldLabel>Photo</FieldLabel>
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                  <AvatarFallback>{initialsOf(values.full_name || "?")}</AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={avatarPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera />
                  {avatarPending ? "Envoi…" : "Changer la photo"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="in-name">Nom complet</FieldLabel>
              <Input
                id="in-name"
                value={values.full_name}
                onChange={(e) => set("full_name", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="in-role">Fonction</FieldLabel>
              <Input
                id="in-role"
                value={values.job_title}
                onChange={(e) => set("job_title", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="in-company">Entreprise</FieldLabel>
              <Input
                id="in-company"
                value={values.company}
                onChange={(e) => set("company", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="in-phone">Téléphone</FieldLabel>
              <Input
                id="in-phone"
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="in-whatsapp">WhatsApp</FieldLabel>
              <Input
                id="in-whatsapp"
                type="tel"
                placeholder="+225 07 00 00 00 00"
                value={values.whatsapp_number}
                onChange={(e) => set("whatsapp_number", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="in-email">Email</FieldLabel>
              <Input
                id="in-email"
                type="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="in-address">Adresse</FieldLabel>
              <Input
                id="in-address"
                value={values.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
          </TabsContent>

          <TabsContent value="liens" className="flex flex-col gap-4 p-4 pt-2">
            <Field>
              <FieldLabel htmlFor="in-website">Site web</FieldLabel>
              <Input
                id="in-website"
                value={values.website_url}
                onChange={(e) => set("website_url", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="in-linkedin">LinkedIn</FieldLabel>
              <Input
                id="in-linkedin"
                value={values.linkedin_url}
                onChange={(e) => set("linkedin_url", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="in-calendly">Calendly</FieldLabel>
              <Input
                id="in-calendly"
                value={values.calendly_url}
                onChange={(e) => set("calendly_url", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="in-portfolio">Portfolio / Brochure</FieldLabel>
              <Input
                id="in-portfolio"
                value={values.portfolio_url}
                onChange={(e) => set("portfolio_url", e.target.value)}
              />
            </Field>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Center: live preview */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-full max-w-[280px] overflow-hidden rounded-[2rem] border-8 border-gray-900 bg-background shadow-lg dark:border-gray-700">
          <div
            className="h-40 p-4"
            style={{
              background: `linear-gradient(135deg, ${values.brand_primary_color}, ${values.brand_primary_color}aa)`,
            }}
          >
            <Avatar className="size-14 border-2 border-white/50">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
              <AvatarFallback className="bg-white/20 text-lg text-white">
                {initialsOf(previewName)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col items-center gap-1 px-4 pb-4 pt-3 text-center">
            <div className="font-display text-lg font-semibold">{previewName}</div>
            <div className="text-sm text-muted-foreground">{values.job_title}</div>
            <div className="text-xs text-muted-foreground">{values.company}</div>

            <div className="mt-3 grid w-full grid-cols-4 gap-2">
              {[
                { icon: Phone, label: "Appeler" },
                { icon: Mail, label: "Email" },
                { icon: User, label: "Site" },
                { icon: MapPin, label: "Itinéraire" },
              ].map((a) => (
                <div
                  key={a.label}
                  className="flex flex-col items-center gap-1 rounded-lg bg-muted py-2 text-[10px] text-muted-foreground"
                >
                  <a.icon className="size-4" />
                  {a.label}
                </div>
              ))}
            </div>

            <div className="mt-3 flex w-full flex-col gap-2">
              {values.whatsapp_number && (
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <MessageCircle className="size-4" />
                  WhatsApp
                </div>
              )}
              {values.linkedin_url && (
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <Link2 className="size-4" />
                  LinkedIn
                </div>
              )}
              {values.calendly_url && (
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <Calendar className="size-4" />
                  Prendre rendez-vous
                </div>
              )}
            </div>

            <Button className="mt-3 w-full">Enregistrer le contact</Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Aperçu en direct · <b>{previewName}</b>
        </p>
      </div>

      {/* Right: appearance */}
      <Card className="flex flex-col gap-4 p-4">
        <h3 className="text-sm font-semibold">Style</h3>

        <Field>
          <FieldLabel>Couleur principale</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {swatches.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                className="relative size-7 rounded-full ring-offset-2 ring-offset-background focus-visible:outline-none"
                style={{ background: c }}
                onClick={() => set("brand_primary_color", c)}
              >
                {values.brand_primary_color === c && (
                  <Check className="absolute inset-0 m-auto size-4 text-white" />
                )}
              </button>
            ))}
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="font-select">Typographie</FieldLabel>
          <Select value={values.font} onValueChange={(v) => set("font", v)}>
            <SelectTrigger id="font-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manrope">Manrope</SelectItem>
              <SelectItem value="jetbrains">JetBrains Mono</SelectItem>
              <SelectItem value="georgia">Georgia</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="template-select">Modèle</FieldLabel>
          <Select value={values.template} onValueChange={(v) => set("template", v)}>
            <SelectTrigger id="template-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="elegant">Élégant</SelectItem>
              <SelectItem value="creative">Créatif</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <div className="mt-auto flex flex-col gap-2">
          <Button
            variant={status === "published" ? "outline" : "secondary"}
            disabled={publishPending}
            onClick={handleTogglePublish}
          >
            <Globe />
            {publishPending
              ? "…"
              : status === "published"
                ? "Dépublier"
                : "Publier la carte"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setHistoryOpen(true)}>
              <History />
              Historique
            </Button>
            <Button className="flex-1" disabled={pending} onClick={handleSave}>
              <Save />
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </Card>

      <VersionHistorySheet
        profileId={profile.id}
        versions={versions}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </div>
  );
}
