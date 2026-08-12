"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Briefcase, Building2, Camera, Check, Mic, Sparkles, User } from "lucide-react";

import {
  createProfileForOnboarding,
  setProfileStatus,
  updateProfile,
  uploadAvatar,
} from "@/lib/actions/profiles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardQrThumbnail, ShareCardDialog } from "@/components/features/share-card-dialog";

const TYPES: { value: string; label: string; icon: typeof Building2 }[] = [
  { value: "freelance", label: "Freelance", icon: User },
  { value: "entreprise", label: "Entreprise", icon: Building2 },
  { value: "conference", label: "Conférence", icon: Mic },
  { value: "custom", label: "Personnalisé", icon: Sparkles },
];

const SWATCHES = ["#2563EB", "#06B6D4", "#DB2777", "#111827", "#22C55E", "#EA580C"];
const TEMPLATES = [
  { value: "corporate", label: "Corporate" },
  { value: "elegant", label: "Élégant" },
  { value: "creative", label: "Créatif" },
];

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

export function OnboardingWizard({ userName }: { userName: string }) {
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [type, setType] = useState("freelance");
  const [fullName, setFullName] = useState(userName);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);
  const [template, setTemplate] = useState("corporate");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPending, setAvatarPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<{ id: string; slug: string } | null>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !profile) return;
    setAvatarPending(true);
    uploadAvatar(profile.id, file)
      .then(({ avatarUrl: url }) => setAvatarUrl(url))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Échec de l'envoi"))
      .finally(() => setAvatarPending(false));
  }

  function goToStep2() {
    startTransition(async () => {
      try {
        const { id, slug } = await createProfileForOnboarding(fullName || "Ma carte", type);
        setProfile({ id, slug });
        setStep(2);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Impossible de créer la carte");
      }
    });
  }

  function goToStep3() {
    if (!profile) return;
    startTransition(async () => {
      try {
        await updateProfile(profile.id, {
          full_name: fullName,
          job_title: jobTitle,
          company,
          phone: "",
          whatsapp_number: "",
          email: "",
          address: "",
          website_url: "",
          linkedin_url: "",
          calendly_url: "",
          portfolio_url: "",
          brand_primary_color: color,
          font: "manrope",
          template,
        });
        setStep(3);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec de l'enregistrement");
      }
    });
  }

  function publish() {
    if (!profile) return;
    startTransition(async () => {
      try {
        await updateProfile(profile.id, {
          full_name: fullName,
          job_title: jobTitle,
          company,
          phone: "",
          whatsapp_number: "",
          email: "",
          address: "",
          website_url: "",
          linkedin_url: "",
          calendly_url: "",
          portfolio_url: "",
          brand_primary_color: color,
          font: "manrope",
          template,
        });
        await setProfileStatus(profile.id, "published");
        setStep(4);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec de la publication");
      }
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-muted/30 px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1.5 w-10 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      <Card className="w-full max-w-md p-6">
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="font-display text-lg font-semibold">Quel type de carte veux-tu créer ?</h1>
              <p className="text-sm text-muted-foreground">3 minutes suffisent pour publier ta première carte.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors ${
                    type === t.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <t.icon className="size-5" />
                  {t.label}
                </button>
              ))}
            </div>
            <Field>
              <FieldLabel htmlFor="ob-name">Ton nom complet</FieldLabel>
              <Input
                id="ob-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ton nom"
              />
            </Field>
            <Button disabled={!fullName.trim() || pending} onClick={goToStep2}>
              {pending ? "Création…" : "Continuer"}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="font-display text-lg font-semibold">Tes informations</h1>
              <p className="text-sm text-muted-foreground">Ce qui apparaîtra sur ta carte.</p>
            </div>
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                <AvatarFallback>{initialsOf(fullName)}</AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={avatarPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera />
                {avatarPending ? "Envoi…" : "Ajouter une photo"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <Field>
              <FieldLabel htmlFor="ob-job">Fonction</FieldLabel>
              <Input
                id="ob-job"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Consultante marketing"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ob-company">Entreprise</FieldLabel>
              <Input
                id="ob-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Indépendante"
              />
            </Field>
            <Button disabled={pending} onClick={goToStep3}>
              {pending ? "Enregistrement…" : "Continuer"}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="font-display text-lg font-semibold">Choisis un style</h1>
              <p className="text-sm text-muted-foreground">Tu pourras tout personnaliser plus tard.</p>
            </div>
            <Field>
              <FieldLabel>Couleur principale</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    className="relative size-8 rounded-full"
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  >
                    {color === c && <Check className="absolute inset-0 m-auto size-4 text-white" />}
                  </button>
                ))}
              </div>
            </Field>
            <Field>
              <FieldLabel>Modèle</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTemplate(t.value)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      template === t.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>
            <Button disabled={pending} onClick={publish}>
              {pending ? "Publication…" : "Publier ma carte"}
            </Button>
          </div>
        )}

        {step === 4 && profile && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
              <Check className="size-6" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold">Ta carte est publiée !</h1>
              <p className="text-sm text-muted-foreground">
                Partage-la par QR Code ou lien direct dès maintenant.
              </p>
            </div>
            <ShareCardDialog
              slug={profile.slug}
              cardName={fullName || "ma carte"}
              jobTitle={jobTitle}
              company={company}
              color={color}
              trigger={<CardQrThumbnail slug={profile.slug} size={120} />}
            />
            <Button className="w-full" onClick={() => router.push("/dashboard")}>
              <Briefcase />
              Aller au tableau de bord
            </Button>
          </div>
        )}
      </Card>
    </main>
  );
}
