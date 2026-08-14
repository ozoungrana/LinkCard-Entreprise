import { Inngest } from "inngest";

export type LeadCapturedData = {
  leadId: string;
  organizationId: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
};

export const inngest = new Inngest({ id: "linkcard-enterprise" });
