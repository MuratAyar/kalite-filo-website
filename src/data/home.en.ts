import type { HomePageCopy } from "@/types";

/** Professionally localized Home copy. Verified business claims remain unchanged. */
export const englishHomePageCopy: HomePageCopy = {
  publicationStatus: "draft",
  hero: {
    title: "Drive Your Business Forward with Fleet Leasing",
    intro:
      "Explore our vehicle portfolio or start the quotation process to plan your company’s mobility requirements.",
    primaryAction: { label: "Request a Quote" },
    secondaryAction: { label: "Explore Vehicles" },
    finder: {
      title: "Find a Vehicle Quickly",
      body: "Filter the vehicle portfolio by selecting a make and model.",
      action: { label: "View Vehicles" },
    },
  },
  featuredVehicles: {
    title: "Featured Vehicles",
    intro: "Explore the vehicle models currently featured in our portfolio.",
    emptyState: {
      title: "No vehicles are currently ready for publication",
      body: "Visit the Vehicles page to review the latest available options.",
      action: { label: "View Vehicles" },
    },
  },
  commercial: {
    title: "Supporting Your Commercial Vehicle Requirements",
    body:
      "Visit our portfolio to evaluate vehicle options suited to your company’s operational requirements.",
    action: { label: "View Commercial Vehicles" },
  },
  why: {
    title: "Why Choose Kalite Filo?",
    intro:
      "Move from defining your requirements to reviewing vehicles and requesting a tailored quotation.",
    steps: [
      {
        id: "requirements",
        title: "Define Your Requirements",
        body: "Clarify the vehicle type and operating profile your business needs.",
      },
      {
        id: "vehicles",
        title: "Review the Portfolio",
        body: "Compare the vehicle options available on the Vehicles page.",
      },
      {
        id: "quote",
        title: "Request a Quote",
        body: "Continue to the quotation page with your leasing requirements.",
      },
    ],
  },
  solutions: {
    title: "Fleet Solutions Tailored to Your Business",
    intro: "Choose the right route for your company’s mobility requirements.",
    items: [
      {
        id: "long-term",
        title: "Long-Term Leasing",
        body: "Explore vehicle options for your long-term leasing requirements.",
        destination: "vehicles",
        action: { label: "Explore Vehicles" },
      },
      {
        id: "operations",
        title: "Operational Management",
        body: "Start a quotation request for your fleet requirements.",
        destination: "quote",
        action: { label: "Request a Quote" },
      },
      {
        id: "commercial",
        title: "Commercial Vehicle Solutions",
        body: "Review our portfolio of commercial vehicle options.",
        destination: "vehicles",
        action: { label: "Explore Vehicles" },
      },
      {
        id: "executive",
        title: "Executive Vehicles",
        body: "Explore the portfolio for your executive vehicle requirements.",
        destination: "vehicles",
        action: { label: "Explore Vehicles" },
      },
    ],
  },
  conversion: {
    eyebrow: "Quick Enquiry",
    title: "Request a Quote for Your Fleet",
    body:
      "Contact us to discuss operational leasing options tailored to your requirements.",
    action: { label: "Request a Quote" },
  },
  editorial: {
    title: "Explore the World of Fleet Management",
    intro:
      "Visit the Fleet Guide for practical insights into corporate vehicle leasing and fleet management.",
    emptyState: {
      title: "No Fleet Guide articles are currently ready for publication",
      body: "Approved articles will appear here when their English editions are complete.",
    },
    allAction: { label: "View All Articles" },
  },
};
