export type FrameworkType = "React" | "Angular" | "Vue" | "Web Components";
export type Framework = {
  id: string;
  name: string;
  type: FrameworkType;
  description: string;
  tags: string[];
  components: number;
  capabilities: string[];
  useCases: string[];
};

// Illustrative catalog entries, not claims about released libraries.
export const frameworks: Framework[] = [
  {
    id: "cornerstone",
    name: "Cornerstone",
    type: "Angular",
    components: 48,
    description:
      "Structured components for managing appointments, records, and day-to-day operations in complex service applications.",
    tags: ["Scheduling", "Record management", "Staff workflows"],
    capabilities: [
      "Appointment calendars and scheduling controls",
      "Searchable record tables and detail panels",
      "Staff task lists and status indicators",
    ],
    useCases: [
      "Practice management",
      "Service operations",
      "Internal workspaces",
    ],
  },
  {
    id: "form",
    name: "Form",
    type: "React",
    components: 36,
    description:
      "Form-focused components for collecting information, guiding onboarding, and helping people complete multi-step tasks.",
    tags: ["Intake forms", "Client portals", "Onboarding"],
    capabilities: [
      "Multi-step intake and registration forms",
      "Input validation and helpful field messages",
      "Client profiles and account settings",
    ],
    useCases: ["Patient intake", "Customer onboarding", "Self-service portals"],
  },
  {
    id: "pulse",
    name: "Pulse",
    type: "React",
    components: 42,
    description:
      "Interactive components for publishing media, connecting communities, and helping audiences discover new content.",
    tags: ["Media players", "Social feeds", "Communities"],
    capabilities: [
      "Audio and video player controls",
      "Activity feeds and member profiles",
      "Content collections and discovery lists",
    ],
    useCases: ["Streaming services", "Creator platforms", "Community apps"],
  },
  {
    id: "folio",
    name: "Folio",
    type: "Vue",
    components: 28,
    description:
      "Content-led components for organizing articles, presenting services, and making information easy to navigate.",
    tags: ["Publishing", "Service pages", "Knowledge bases"],
    capabilities: [
      "Article layouts and content navigation",
      "Service directories and profile pages",
      "Searchable knowledge base layouts",
    ],
    useCases: ["Publications", "Informational websites", "Help centers"],
  },
  {
    id: "orbit",
    name: "Orbit",
    type: "React",
    components: 56,
    description:
      "Data-rich components for tracking performance, investigating trends, and monitoring operational activity.",
    tags: ["Analytics", "Dashboards", "Reporting"],
    capabilities: [
      "Charts and metric summary cards",
      "Filterable data tables and reporting views",
      "Operational monitoring dashboards",
    ],
    useCases: [
      "Business intelligence",
      "Operations reporting",
      "Performance monitoring",
    ],
  },
  {
    id: "coast",
    name: "Coast",
    type: "Vue",
    components: 32,
    description:
      "Booking and discovery components that help customers find a service, check availability, and reserve a time.",
    tags: ["Bookings", "Service discovery", "Availability"],
    capabilities: [
      "Availability calendars and time-slot pickers",
      "Service listings and location cards",
      "Reservation summaries and confirmation views",
    ],
    useCases: [
      "Appointment booking",
      "Travel reservations",
      "Local service directories",
    ],
  },
  {
    id: "mono",
    name: "Mono",
    type: "Web Components",
    components: 24,
    description:
      "Technical interfaces for inspecting systems, working with code, and configuring developer tools across stacks.",
    tags: ["Developer tools", "Code editors", "System consoles"],
    capabilities: [
      "Code editor and terminal layouts",
      "System status and log viewers",
      "Configuration panels and command menus",
    ],
    useCases: ["Developer platforms", "Admin consoles", "Infrastructure tools"],
  },
  {
    id: "mango",
    name: "Mango",
    type: "Web Components",
    components: 38,
    description:
      "Commerce components for showcasing products, building shopping carts, and guiding customers through checkout.",
    tags: ["Product catalogs", "Shopping carts", "Checkout"],
    capabilities: [
      "Product cards and catalog filters",
      "Shopping carts and checkout forms",
      "Order summaries and purchase history",
    ],
    useCases: ["Online stores", "Retail storefronts", "Product marketplaces"],
  },
];
