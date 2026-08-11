import Link from "next/link";
import {
  BadgeCheck,
  BarChart3,
  Check,
  LayoutGrid,
  Plug,
  ScanLine,
  Share2,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const logos = ["ACME CORP", "Innovatech", "NextWay", "Vision Pro", "DataFlow", "BrightIdeas"];

const stats = [
  { value: "50 000+", label: "utilisateurs actifs" },
  { value: "2,5 M", label: "cartes partagées" },
  { value: "1,8 M", label: "contacts capturés" },
  { value: "98 %", label: "de satisfaction" },
];

const features = [
  { icon: Share2, title: "Partage universel", desc: "QR Code dynamique, NFC, lien, email et wallet — partagez partout en un geste." },
  { icon: ScanLine, title: "Capture intelligente", desc: "Scannez les cartes papier par OCR, elles deviennent des fiches contact en un instant." },
  { icon: BarChart3, title: "Analytics avancées", desc: "Vues, clics, conversions et canaux — comprenez ce qui fonctionne vraiment." },
  { icon: Users, title: "Équipe & Admin", desc: "Gérez rôles, accès et provisioning automatique pour toute votre organisation." },
  { icon: Plug, title: "Intégrations CRM", desc: "Synchronisez vos contacts avec HubSpot, Salesforce, Pipedrive, Zoho et plus." },
  { icon: BadgeCheck, title: "Sécurisé & Conforme", desc: "Chiffrement de bout en bout, RGPD/CCPA, SSO et SCIM pour l'Enterprise." },
];

const steps = [
  { num: "1", title: "Créez votre carte", desc: "Personnalisez couleurs, logo et disposition en quelques clics." },
  { num: "2", title: "Partagez partout", desc: "QR Code, NFC, lien ou wallet — ajoutez-la à votre signature." },
  { num: "3", title: "Capturez des contacts", desc: "Recevez des coordonnées, scannez des cartes papier." },
  { num: "4", title: "Suivez & convertissez", desc: "Relances automatiques, transformez vos connexions en opportunités." },
];

const testimonials = [
  { initials: "SD", name: "Sophie Durand", role: "Responsable Commerciale, Innovatech", quote: "LinkCard a complètement transformé ma façon de réseauter. Fini les cartes papier perdues, tout est centralisé." },
  { initials: "TB", name: "Thomas Bernard", role: "CEO, NextWay", quote: "Super outil pour notre équipe ! La gestion centralisée et les intégrations CRM nous font gagner un temps précieux." },
  { initials: "ML", name: "Marc Lefèvre", role: "Directeur Marketing, Vision Pro", quote: "L'analytics nous permet de comprendre ce qui fonctionne vraiment et d'optimiser nos échanges au quotidien." },
];

const plans = [
  { name: "Free", desc: "Pour bien commencer", price: "0 €", period: "/mois", features: ["1 carte digitale", "Partage QR Code & lien", "5 contacts / mois"], cta: "Commencer", featured: false },
  { name: "Pro", desc: "Pour les professionnels", price: "9 €", period: "/mois", features: ["Cartes illimitées", "Analytics avancées", "Export vCard"], cta: "Essayer gratuitement", featured: true },
  { name: "Business", desc: "Pour les équipes", price: "19 €", period: "/utilisateur/mois", features: ["Équipe & rôles", "Intégrations CRM avancées", "Support prioritaire"], cta: "Essayer gratuitement", featured: false },
  { name: "Enterprise", desc: "Pour les grandes organisations", price: "Sur devis", period: "", features: ["SSO / SCIM", "Support dédié", "Personnalisation avancée"], cta: "Nous contacter", featured: false },
];

const compareRows = [
  { feature: "QR Code & NFC", hihello: true, blinq: true, popl: true },
  { feature: "Apple / Google Wallet", hihello: true, blinq: true, popl: "Partiel" },
  { feature: "OCR par IA", hihello: "Basique", blinq: false, popl: "Partiel" },
  { feature: "Éditeur WYSIWYG", hihello: false, blinq: false, popl: false },
  { feature: "Analytics avancées", hihello: "Moyen", blinq: "Faible", popl: "Moyen" },
  { feature: "Dashboard Enterprise", hihello: "Moyen", blinq: "Faible", popl: "Moyen" },
  { feature: "SSO / SCIM", hihello: false, blinq: false, popl: false },
  { feature: "Intelligence artificielle", hihello: false, blinq: false, popl: false },
  { feature: "API publique", hihello: "Limitée", blinq: false, popl: "Limitée" },
];

const faqs = [
  { q: "LinkCard fonctionne-t-elle sans application ?", a: "Oui. Le destinataire consulte votre carte et enregistre vos coordonnées directement depuis son navigateur mobile, sans rien installer." },
  { q: "Mes données sont-elles sécurisées ?", a: "Toutes les données sont chiffrées en transit (TLS 1.3) et au repos (AES-256). LinkCard est conforme RGPD et CCPA." },
  { q: "Puis-je modifier ma carte après l'avoir partagée ?", a: "Oui, à tout moment. Le QR Code et le lien restent identiques — seul le contenu affiché change, sans jamais avoir à réimprimer une carte." },
  { q: "Puis-je intégrer mes propres couleurs et logo ?", a: "Oui, l'éditeur permet une personnalisation complète, et les entreprises peuvent verrouiller une charte graphique pour toute l'équipe." },
  { q: "Comment fonctionne le QR Code dynamique ?", a: "Le QR Code pointe vers une URL stable dont le contenu peut être mis à jour à tout moment, sans jamais changer le code lui-même." },
  { q: "Proposez-vous un support dédié ?", a: "Les plans Business et Enterprise incluent un support prioritaire, avec un interlocuteur dédié pour les grands comptes." },
];

function CompareCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto size-4 text-success" />;
  if (value === false) return <span className="text-muted-foreground">—</span>;
  return <span className="text-xs text-muted-foreground">{value}</span>;
}

export default function MarketingHomePage() {
  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LayoutGrid className="size-4" />
          </div>
          <span className="font-display font-semibold">LinkCard</span>
        </div>
        <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Fonctionnalités</a>
          <a href="#pricing" className="hover:text-foreground">Tarifs</a>
          <a href="#compare" className="hover:text-foreground">Comparatif</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Se connecter
          </Link>
          <Button asChild size="sm">
            <Link href="/register">Essayer gratuitement</Link>
          </Button>
        </div>
      </header>

      <section className="flex flex-col items-center gap-6 px-6 py-24 text-center">
        <h1 className="max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Échangez plus que des cartes,{" "}
          <span className="text-primary">créez des connexions qui comptent.</span>
        </h1>
        <p className="max-w-xl text-muted-foreground">
          LinkCard transforme chaque rencontre en opportunité mesurable : identité numérique,
          capture de leads et analytics dans une seule plateforme.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">Commencer gratuitement</Link>
          </Button>
          <Button variant="outline" size="lg">
            Voir la démo
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Aucune carte bancaire · Configuration en 2 min · Conforme RGPD
        </p>
      </section>

      <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 border-y bg-muted/30 px-6 py-6 text-sm font-medium text-muted-foreground">
        {logos.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>

      <div className="bg-primary px-6 py-12 text-primary-foreground">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 text-center sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-display text-2xl font-semibold sm:text-3xl">{s.value}</div>
              <div className="text-xs text-primary-foreground/80">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <section id="features" className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-6 py-24">
        <div className="max-w-xl text-center">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
            Fonctionnalités
          </div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Une solution complète pour booster votre réseau
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            De la création de votre carte à la conversion de vos contacts en clients, tout est
            réuni dans une seule plateforme.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardContent className="pt-6">
                <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-4.5" />
                </div>
                <h4 className="font-medium">{f.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 max-w-xl">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
              Simple et rapide
            </div>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Comment ça marche ?
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.num}>
                <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-primary font-display font-semibold text-primary-foreground">
                  {s.num}
                </div>
                <h4 className="font-medium">{s.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="mb-10 max-w-xl">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
            Ils nous font confiance
          </div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Nos utilisateurs en parlent le mieux
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name}>
              <CardContent className="pt-6">
                <div className="mb-2 text-warning">★★★★★</div>
                <p className="text-sm">{t.quote}</p>
                <div className="mt-4 flex items-center gap-2">
                  <Avatar className="size-8">
                    <AvatarFallback>{t.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="pricing" className="bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 max-w-xl">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
              Tarifs transparents
            </div>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Choisissez la formule qui vous correspond
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Essai gratuit de 14 jours sur les plans payants. Sans engagement, annulez à tout
              moment.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((p) => (
              <Card key={p.name} className={p.featured ? "border-primary shadow-md" : ""}>
                <CardContent className="flex flex-col gap-4 pt-6">
                  {p.featured && <Badge className="w-fit">Populaire</Badge>}
                  <div>
                    <h4 className="font-display font-semibold">{p.name}</h4>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                  <div>
                    <span className="text-2xl font-semibold">{p.price}</span>
                    <span className="text-sm text-muted-foreground">{p.period}</span>
                  </div>
                  <ul className="flex flex-col gap-1.5 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="size-3.5 shrink-0 text-success" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button variant={p.featured ? "default" : "outline"} className="justify-center">
                    {p.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="compare" className="mx-auto max-w-5xl px-6 py-24">
        <div className="mb-10 max-w-xl">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
            Comparatif
          </div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Pourquoi choisir LinkCard
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Une plateforme complète, là où les autres se limitent à la carte de visite.
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium">Fonctionnalité</th>
                <th className="p-3 text-center font-medium">HiHello</th>
                <th className="p-3 text-center font-medium">Blinq</th>
                <th className="p-3 text-center font-medium">Popl</th>
                <th className="p-3 text-center font-medium text-primary">LinkCard</th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row) => (
                <tr key={row.feature} className="border-t">
                  <td className="p-3">{row.feature}</td>
                  <td className="p-3 text-center"><CompareCell value={row.hihello} /></td>
                  <td className="p-3 text-center"><CompareCell value={row.blinq} /></td>
                  <td className="p-3 text-center"><CompareCell value={row.popl} /></td>
                  <td className="bg-primary/5 p-3 text-center"><Check className="mx-auto size-4 text-primary" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-2xl px-6 py-24">
        <div className="mb-8 text-center">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
            Questions fréquentes
          </div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Vous avez des questions ?
          </h2>
        </div>
        <Accordion type="single" collapsible defaultValue="faq-0">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="bg-primary px-6 py-16 text-center text-primary-foreground">
        <h3 className="font-display text-2xl font-semibold">Prêt à moderniser votre réseau ?</h3>
        <p className="mt-2 text-primary-foreground/80">
          Rejoignez des milliers de professionnels qui ont déjà fait le choix de LinkCard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link href="/register">Commencer gratuitement</Link>
          </Button>
          <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
            Planifier une démo
          </Button>
        </div>
      </section>

      <footer className="border-t px-6 py-12 text-sm">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-5">
          <div className="sm:col-span-1">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <LayoutGrid className="size-3.5" />
              </div>
              <span className="font-display font-semibold">LinkCard</span>
            </div>
            <p className="max-w-[200px] text-xs text-muted-foreground">
              La carte de visite digitale intelligente pour créer des connexions qui comptent.
            </p>
          </div>
          {[
            { title: "Produit", links: ["Fonctionnalités", "Tarifs", "Intégrations", "Mises à jour"] },
            { title: "Ressources", links: ["Centre d'aide", "Blog", "Tutoriels", "Webinaires"] },
            { title: "Entreprise", links: ["À propos", "Carrières", "Presse", "Contact"] },
            { title: "Légal", links: ["Mentions légales", "Politique de confidentialité", "CGU", "RGPD"] },
          ].map((col) => (
            <div key={col.title}>
              <h5 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                {col.title}
              </h5>
              <ul className="flex flex-col gap-1.5 text-muted-foreground">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-foreground">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 max-w-5xl border-t pt-6 text-xs text-muted-foreground">
          © 2026 LinkCard. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
