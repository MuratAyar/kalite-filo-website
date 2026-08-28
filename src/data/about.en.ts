import type { AboutPageContent } from "./about";

export const englishAboutPageContent = {
  publicationStatus: "draft",
  metadata: { description: "Discover Kalite Filo’s approach to corporate vehicle leasing, fleet management and structured operational processes." },
  hero: {
    eyebrow: "Our Corporate Story", titleLead: "Putting Quality", titleAccent: "on the Road",
    body: "We support corporate mobility with data-informed and sustainable fleet leasing solutions designed for the dynamics of modern business.",
    primaryAction: "Our Milestones", secondaryAction: "Our Vision",
    statistics: [{ id: "vehicle-fleet", value: "300+", label: "Vehicle Fleet" }, { id: "customer-satisfaction", value: "98%", label: "Customer Satisfaction" }],
  },
  visionMissionValues: {
    title: "Vision, Mission and Values",
    vision: { id: "vision", icon: "eye", title: "Our Vision", body: "To become a benchmark brand in Türkiye for corporate fleet leasing and mobility solutions, recognised for trust and service quality." },
    mission: { id: "mission", icon: "rocket", title: "Our Mission", body: "To strengthen businesses by managing their mobility requirements through reliable, efficient and sustainable fleet solutions." },
    values: {
      title: "Our Values", eyebrow: "“PUTTING QUALITY ON THE ROAD.”",
      items: [
        { id: "trust", icon: "shield", title: "Trust" }, { id: "quality", icon: "award", title: "Quality" },
        { id: "leadership", icon: "flag", title: "Leadership" }, { id: "customer-focus", icon: "users", title: "Customer Focus" },
        { id: "operational-excellence", icon: "sliders", title: "Operational Excellence" }, { id: "innovation", icon: "lightbulb", title: "Innovation" },
        { id: "responsibility", icon: "gavel", title: "Responsibility" }, { id: "sustainability", icon: "leaf", title: "Sustainability" },
        { id: "continuous-improvement", icon: "trend", title: "Continuous Improvement" },
      ],
    },
  },
  operational: {
    title: "Operational Excellence",
    intro: "We aim to make vehicle operations more structured and predictable by bringing different stages of fleet management together within a coordinated operational approach.",
    items: [
      { id: "data-informed-management", icon: "analytics", title: "Data-Informed Management", body: "More informed fleet decisions through consistent monitoring of vehicle and operational information." },
      { id: "proactive-operations", icon: "calendar", title: "Proactive Operations", body: "Planned coordination of maintenance and operational processes." },
      { id: "coordinated-communication", icon: "headset", title: "Coordinated Communication", body: "Structured communication of requirements across the relevant operational stages." },
      { id: "sustainable-approach", icon: "leaf", title: "Sustainable Approach", body: "Evaluation of efficient vehicle alternatives suited to each requirement." },
    ],
  },
  network: {
    title: "Operational Service Network",
    intro: "We address corporate vehicle usage through a planned and integrated operational approach.",
    items: [
      { id: "corporate-fleet-management", icon: "briefcase", title: "Corporate Fleet Management", body: "An integrated approach from vehicle requirements through ongoing operations." },
      { id: "operational-support", icon: "route", title: "Operational Support", body: "Planned support across different stages of the vehicle usage cycle." },
      { id: "flexible-solutions", icon: "sliders", title: "Flexible Solutions", body: "A structure that can be shaped around the operating model and fleet requirement." },
    ],
  },
  why: {
    title: "Why Kalite Filo?",
    intro: "A fleet approach designed to make corporate vehicle requirements more predictable, structured and manageable.",
    items: [
      { id: "fleet-efficiency", icon: "gauge", title: "Fleet Efficiency", body: "A structure that supports more orderly management of operational vehicle processes." },
      { id: "cost-control", icon: "wallet", title: "Cost Control", body: "A leasing approach that helps make fleet expenditure more predictable." },
      { id: "operational-support", icon: "headset", title: "Operational Support", body: "Management of the operational steps required throughout vehicle usage." },
      { id: "central-management", icon: "dashboard", title: "Central Management", body: "Simpler monitoring of vehicles and fleet processes." },
      { id: "flexible-solutions", icon: "document", title: "Flexible Solutions", body: "Vehicle, term and usage model options aligned with the requirement." },
      { id: "specialist-approach", icon: "users", title: "Specialist Approach", body: "Support in defining a vehicle and fleet structure suited to corporate needs." },
    ],
  },
  editorial: {
    title: "Explore the World of Fleet Management", intro: "Read about corporate vehicle leasing, vehicle selection and fleet costs.",
    emptyState: { title: "Content is being prepared", body: "Approved Fleet Guide articles will appear here when their English editions are ready." },
    allAction: { label: "View All" },
    articleIds: ["operasyonel-arac-kiralama-nedir", "kurumsal-filoda-dogru-arac-secimi", "filo-toplam-sahip-olma-maliyeti-tco"],
  },
} satisfies AboutPageContent;
