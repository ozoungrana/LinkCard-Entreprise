import {
  BookOpen,
  Rocket,
  LayoutTemplate,
  Share2,
  Users,
  BarChart3,
  Workflow,
  Building2,
  CreditCard,
  WifiOff,
  Keyboard,
  HelpCircle,
  QrCode,
  Nfc,
  Mail,
  Link2,
  History,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getCurrentOrganization } from "@/lib/supabase/queries";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex flex-col gap-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] font-medium text-foreground">
            {i + 1}
          </span>
          <span className="pt-px">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      {children}
    </p>
  );
}

export default async function GuidePage() {
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-16 text-center">
        <CardContent className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Impossible de charger ton organisation pour le moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <BookOpen className="size-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold font-display">Guide utilisateur</h2>
          <p className="text-xs text-muted-foreground">
            Tout ce qu&apos;il faut savoir pour tirer le meilleur de LinkCard Enterprise.
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          Plan {PLAN_LABELS[organization.plan] ?? organization.plan}
        </Badge>
      </div>

      <Tabs
        defaultValue="demarrage"
        orientation="vertical"
        className="items-start gap-4 lg:grid lg:grid-cols-[240px_1fr]"
      >
        <Card className="w-full gap-0 p-2">
          <TabsList className="h-auto w-full flex-col gap-1 bg-transparent p-0">
            <TabsTrigger value="demarrage" className="w-full justify-start px-3 py-2">
              <Rocket />
              Démarrage rapide
            </TabsTrigger>
            <TabsTrigger value="editeur" className="w-full justify-start px-3 py-2">
              <LayoutTemplate />
              L&apos;éditeur de carte
            </TabsTrigger>
            <TabsTrigger value="partage" className="w-full justify-start px-3 py-2">
              <Share2 />
              Partager ma carte
            </TabsTrigger>
            <TabsTrigger value="contacts" className="w-full justify-start px-3 py-2">
              <Users />
              Contacts & pipeline
            </TabsTrigger>
            <TabsTrigger value="analytics" className="w-full justify-start px-3 py-2">
              <BarChart3 />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="automatisations" className="w-full justify-start px-3 py-2">
              <Workflow />
              Automatisations
            </TabsTrigger>
            <TabsTrigger value="admin" className="w-full justify-start px-3 py-2">
              <Building2 />
              Équipe & Administration
            </TabsTrigger>
            <TabsTrigger value="abonnement" className="w-full justify-start px-3 py-2">
              <CreditCard />
              Abonnement & Facturation
            </TabsTrigger>
            <TabsTrigger value="offline" className="w-full justify-start px-3 py-2">
              <WifiOff />
              Mode hors-ligne
            </TabsTrigger>
            <TabsTrigger value="raccourcis" className="w-full justify-start px-3 py-2">
              <Keyboard />
              Raccourcis clavier
            </TabsTrigger>
            <TabsTrigger value="faq" className="w-full justify-start px-3 py-2">
              <HelpCircle />
              FAQ & Dépannage
            </TabsTrigger>
          </TabsList>
        </Card>

        <Card className="w-full p-6">
          {/* Démarrage rapide */}
          <TabsContent value="demarrage" className="flex flex-col gap-6">
            <Section title="Créer ton compte et ta première carte">
              <p>
                À l&apos;inscription, un assistant en 4 étapes te guide pour créer ta première
                carte : informations personnelles, entreprise, style visuel, puis publication.
              </p>
              <Steps
                items={[
                  "Renseigne ton nom, ta fonction et ton entreprise.",
                  "Ajoute tes coordonnées (téléphone, WhatsApp, email, adresse).",
                  "Choisis une couleur de marque et une police — le vérificateur de contraste t'avertit si le texte devient illisible.",
                  "Publie : ta carte est immédiatement accessible via son lien public.",
                ]}
              />
            </Section>
            <Separator />
            <Section title="Le tableau de bord">
              <p>
                Vue d&apos;ensemble de tes cartes, de tes derniers contacts capturés et de tes
                statistiques de vues. C&apos;est le point d&apos;entrée après connexion.
              </p>
            </Section>
            <Separator />
            <Section title="Créer une carte supplémentaire">
              <p>
                Depuis <b>Mes cartes</b>, clique sur <b>Nouvelle carte</b>. Le plan Free est limité
                à 1 carte active ; les plans Pro et supérieurs n&apos;ont pas de limite.
              </p>
            </Section>
          </TabsContent>

          {/* Éditeur */}
          <TabsContent value="editeur" className="flex flex-col gap-6">
            <Section title="Onglet Infos">
              <p>
                Nom, fonction, entreprise, téléphone, numéro WhatsApp (juste après le téléphone),
                email, adresse. Chaque champ est validé au moment où tu quittes le champ, pas
                seulement à la sauvegarde.
              </p>
            </Section>
            <Separator />
            <Section title="Onglet Liens">
              <p>Site web, LinkedIn, Calendly, portfolio — ajoute les liens pertinents pour ton activité.</p>
            </Section>
            <Separator />
            <Section title="Style : couleurs, police, photo">
              <p>
                Choisis une couleur principale et secondaire, une police parmi celles proposées, et
                ajoute une photo de profil (JPEG, PNG ou WebP, 5 Mo max). La photo apparaît sur le
                tableau de bord, dans l&apos;éditeur et sur la carte publique.
              </p>
            </Section>
            <Separator />
            <Section title="Sauvegarde automatique">
              <p>
                Tes modifications sont sauvegardées automatiquement 2 secondes après ta dernière
                frappe. En cas d&apos;échec réseau, 3 nouvelles tentatives sont faites
                automatiquement avant de te proposer un bouton de sauvegarde manuelle.
              </p>
            </Section>
            <Separator />
            <Section title="Historique des versions">
              <div className="flex items-center gap-2">
                <History className="size-4 shrink-0" />
                <span>
                  Chaque sauvegarde crée une nouvelle version. Clique sur <b>Historique</b> en haut
                  de l&apos;éditeur pour voir toutes les versions précédentes et{" "}
                  <b>Restaurer</b> celle de ton choix en un clic.
                </span>
              </div>
            </Section>
          </TabsContent>

          {/* Partage */}
          <TabsContent value="partage" className="flex flex-col gap-6">
            <Section title="QR Code">
              <div className="flex items-center gap-2">
                <QrCode className="size-4 shrink-0" />
                <span>
                  Un QR code est généré automatiquement et visible directement sur la carte, sans
                  clic nécessaire. Ouvre <b>Partager</b> pour le télécharger en haute résolution.
                </span>
              </div>
            </Section>
            <Separator />
            <Section title="NFC">
              <div className="flex items-center gap-2">
                <Nfc className="size-4 shrink-0" />
                <span>
                  Sur un appareil Android compatible (Chrome), l&apos;onglet <b>NFC</b> de la
                  fenêtre de partage permet d&apos;écrire le lien de ta carte directement sur un
                  tag NFC — approche un tag et suis les instructions à l&apos;écran.
                </span>
              </div>
              <Note>
                Le Web NFC n&apos;est pas supporté sur iOS/Safari — l&apos;onglet NFC ne
                s&apos;affiche que si le navigateur le permet.
              </Note>
            </Section>
            <Separator />
            <Section title="Signature email">
              <div className="flex items-center gap-2">
                <Mail className="size-4 shrink-0" />
                <span>
                  Génère une signature HTML prête à copier-coller dans Gmail, Outlook ou ton client
                  mail habituel, avec ta photo, tes coordonnées et le lien vers ta carte.
                </span>
              </div>
            </Section>
            <Separator />
            <Section title="Lien direct">
              <div className="flex items-center gap-2">
                <Link2 className="size-4 shrink-0" />
                <span>
                  Chaque carte a une URL publique courte (<code className="font-mono text-xs">/c/ton-slug</code>),
                  accessible sans compte ni application, chargée en moins d&apos;une seconde.
                </span>
              </div>
            </Section>
            <Separator />
            <Section title="vCard">
              <p>
                Depuis la carte publique, le visiteur peut télécharger tes coordonnées au format
                vCard (.vcf) pour les ajouter directement à ses contacts.
              </p>
            </Section>
          </TabsContent>

          {/* Contacts */}
          <TabsContent value="contacts" className="flex flex-col gap-6">
            <Section title="Capture de contacts">
              <p>
                Quand quelqu&apos;un consulte ta carte et remplit le formulaire de retour (avec
                consentement RGPD explicite), un contact est automatiquement créé dans ton espace
                <b> Contacts</b>, avec le canal de capture (QR, NFC, signature email, lien direct,
                OCR ou import CSV).
              </p>
            </Section>
            <Separator />
            <Section title="Ajouter un contact manuellement (terrain)">
              <p>
                Depuis <b>Contacts</b>, le bouton <b>Ajouter un contact</b> permet de saisir
                directement les coordonnées d&apos;une personne rencontrée en personne — nom,
                entreprise, email, téléphone, notes. Ça fonctionne même sans connexion réseau : la
                fiche est enregistrée localement sur l&apos;appareil et synchronisée automatiquement
                dès que la connexion revient.
              </p>
            </Section>
            <Separator />
            <Section title="Pipeline (vue Kanban)">
              <p>
                Fais glisser un contact d&apos;une colonne à l&apos;autre pour suivre son
                avancement : <b>Nouveau → Contacté → Qualifié → Proposition → Client</b>, ou{" "}
                <b>Perdu</b>. Une vue tableau classique est aussi disponible.
              </p>
            </Section>
            <Separator />
            <Section title="Fiche contact">
              <p>
                Clique sur un contact pour voir ses coordonnées, ajouter des notes, des tags, et
                l&apos;historique complet des échanges.
              </p>
            </Section>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="flex flex-col gap-6">
            <Section title="Vues et clics">
              <p>
                Suis le nombre de vues de chaque carte et les clics sur chacun de tes liens
                (site web, LinkedIn, téléphone, WhatsApp, etc.).
              </p>
            </Section>
            <Separator />
            <Section title="Répartition par canal, pays et appareil">
              <p>
                Comprends d&apos;où viennent tes visiteurs : QR code, NFC, lien direct ou signature
                email ; leur pays ; et s&apos;ils consultent depuis mobile, tablette ou ordinateur.
              </p>
            </Section>
          </TabsContent>

          {/* Automatisations */}
          <TabsContent value="automatisations" className="flex flex-col gap-6">
            <Section title="Workflows">
              <p>
                Automatise ce qui se passe après un événement (ex. un contact capturé) : créer une
                notification, envoyer un email, synchroniser vers un CRM. Le plan Pro permet 1
                workflow actif à la fois ; Business et Enterprise n&apos;ont pas de limite.
              </p>
              <Steps
                items={[
                  "Va dans Automatisations → Mes workflows.",
                  "Clique sur Créer un workflow, choisis le déclencheur.",
                  "Active-le avec l'interrupteur — tu peux le désactiver à tout moment.",
                ]}
              />
            </Section>
            <Note>
              Les modèles email, les webhooks sortants et l&apos;historique détaillé
              d&apos;exécution arrivent avec le moteur de workflow, en cours de finalisation.
            </Note>
          </TabsContent>

          {/* Admin */}
          <TabsContent value="admin" className="flex flex-col gap-6">
            <Section title="Membres & rôles">
              <p>
                Invite les membres de ton équipe et attribue-leur un rôle : Admin
                d&apos;organisation, Admin d&apos;équipe, Membre ou Lecteur.
              </p>
            </Section>
            <Separator />
            <Section title="Charte graphique">
              <p>
                Verrouille les couleurs et le logo de l&apos;organisation pour que toutes les
                cartes de l&apos;équipe restent cohérentes avec ta marque.
              </p>
            </Section>
            <Separator />
            <Section title="Intégrations CRM">
              <p>
                Statut de connexion en temps réel pour HubSpot, Salesforce, Pipedrive et Zoho.
              </p>
              <Note>
                La connexion effective nécessite l&apos;enregistrement d&apos;une application
                OAuth chez chaque fournisseur — actuellement désactivée en attendant ces
                identifiants.
              </Note>
            </Section>
            <Separator />
            <Section title="SSO & Provisioning (Enterprise)">
              <p>
                Statut de connexion pour Google Workspace, Microsoft Entra ID et Okta, via WorkOS.
              </p>
              <Note>
                Désactivé tant qu&apos;une clé API WorkOS n&apos;est pas configurée côté
                Enterprise.
              </Note>
            </Section>
          </TabsContent>

          {/* Abonnement */}
          <TabsContent value="abonnement" className="flex flex-col gap-6">
            <Section title="Les plans">
              <p>
                <b>Free</b> (0 €) : 1 carte, 5 contacts/mois. <b>Pro</b> (9 €/mois) : cartes
                illimitées, 1 workflow actif. <b>Business</b> (19 €/utilisateur/mois) : équipes,
                charte graphique, CRM. <b>Enterprise</b> (sur devis) : SSO/SCIM, audit, support
                dédié.
              </p>
            </Section>
            <Separator />
            <Section title="Changer de formule ou gérer la facturation">
              <p>
                Depuis <b>Mon compte → Abonnement & Facturation</b>, mets à niveau ton plan, mets à
                jour ton moyen de paiement ou télécharge tes factures — tout est géré de façon
                sécurisée par Stripe.
              </p>
            </Section>
          </TabsContent>

          {/* Offline */}
          <TabsContent value="offline" className="flex flex-col gap-6">
            <Section title="Ce qui fonctionne hors-ligne">
              <p>
                LinkCard est une application installable (PWA). Une fois visitée, la dernière carte
                publique consultée reste accessible hors-ligne, ainsi que le téléchargement de la
                vCard déjà en cache. L&apos;ajout manuel d&apos;un contact fonctionne aussi
                hors-ligne : la fiche est enregistrée sur l&apos;appareil et envoyée automatiquement
                dès que la connexion revient.
              </p>
            </Section>
            <Note>
              L&apos;écriture/lecture NFC hors-ligne et le scan OCR d&apos;une carte de visite
              hors-ligne ne sont pas encore disponibles.
            </Note>
          </TabsContent>

          {/* Raccourcis */}
          <TabsContent value="raccourcis" className="flex flex-col gap-6">
            <Section title="Palette de commandes">
              <p>
                Appuie sur <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">⌘K</kbd>{" "}
                (ou <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">Ctrl K</kbd>{" "}
                sur Windows) n&apos;importe où dans l&apos;espace de travail pour ouvrir la
                recherche rapide : navigue vers n&apos;importe quelle page ou lance une action
                rapide (créer une carte, voir tes contacts, gérer ton abonnement) sans toucher la
                souris.
              </p>
            </Section>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq">
            <Accordion type="single" collapsible>
              <AccordionItem value="q1">
                <AccordionTrigger>Ma carte ne se met pas à jour côté visiteur ?</AccordionTrigger>
                <AccordionContent>
                  Vérifie que le statut de la carte est bien « Publiée » (pas « Brouillon »). Si tu
                  viens de modifier, attends la fin de l&apos;autosauvegarde (indicateur en haut de
                  l&apos;éditeur) avant de tester le lien public.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger>Un visiteur ne peut pas m&apos;envoyer ses coordonnées ?</AccordionTrigger>
                <AccordionContent>
                  Le formulaire de retour nécessite que le visiteur coche la case de consentement
                  RGPD. Sans elle, l&apos;envoi est bloqué par design.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3">
                <AccordionTrigger>Pourquoi le bouton « Connecter » est-il grisé pour mon CRM/SSO ?</AccordionTrigger>
                <AccordionContent>
                  Ces intégrations sont en cours d&apos;activation côté LinkCard (identifiants
                  fournisseur à configurer) — le statut de connexion est déjà fonctionnel, seule
                  l&apos;action de connexion reste temporairement désactivée.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4">
                <AccordionTrigger>Comment revenir à une ancienne version de ma carte ?</AccordionTrigger>
                <AccordionContent>
                  Ouvre l&apos;éditeur de la carte concernée, clique sur <b>Historique</b>, puis{" "}
                  <b>Restaurer</b> sur la version souhaitée.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q5">
                <AccordionTrigger>Besoin d&apos;aide supplémentaire ?</AccordionTrigger>
                <AccordionContent>
                  Écris-nous depuis <b>Mon compte</b> ou contacte le support à l&apos;adresse
                  indiquée dans tes emails de facturation.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}
