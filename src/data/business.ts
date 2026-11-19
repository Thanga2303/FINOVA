export type BizCategory =
  | "Small business" | "Online business" | "Low-investment" | "Student" | "AI-powered"
  | "Digital marketing" | "Freelancing" | "SaaS" | "E-commerce" | "Service-based";

export type BusinessIdea = {
  id: string;
  name: string;
  categories: BizCategory[];
  overview: string;
  investment: string; // indicative range, INR
  investmentLow: number;
  skills: string[];
  customers: string[];
  model: string;
  revenue: string[];
  marketing: string[];
  challenges: string[];
  roadmap: string[];
  video: string; // YouTube search phrase
};

export const BIZ_CATEGORIES: BizCategory[] = [
  "Small business", "Online business", "Low-investment", "Student", "AI-powered",
  "Digital marketing", "Freelancing", "SaaS", "E-commerce", "Service-based",
];

export const businessIdeas: BusinessIdea[] = [
  {
    id: "cloud-kitchen", name: "Cloud kitchen", categories: ["Small business"],
    overview: "A delivery-only food brand that runs from a rented kitchen and sells through food-delivery apps and its own WhatsApp orders, with no dine-in costs.",
    investment: "₹3–8 lakh", investmentLow: 300000,
    skills: ["Cooking and menu design", "Food safety (FSSAI licence)", "Basic accounting", "Managing delivery-app listings"],
    customers: ["Office workers", "Students in hostels and PGs", "Families ordering on weekends"],
    model: "Prepare a focused menu in one kitchen, sell through aggregators and direct orders; profit = order value − ingredients − packaging − commission − rent.",
    revenue: ["Food orders via delivery apps", "Direct orders with lower commission", "Corporate lunch subscriptions", "Second virtual brand from the same kitchen"],
    marketing: ["High-quality food photos", "Launch offers on apps", "Instagram reels of preparation", "Loyalty via WhatsApp broadcast"],
    challenges: ["Aggregator commissions of roughly 18–30%", "Consistent quality and hygiene", "Ratings sensitivity", "Food wastage"],
    roadmap: ["Pick one cuisine and 10–15 dishes", "Test with friends and price every dish by cost", "Get FSSAI registration and GST if needed", "Rent a small kitchen or use a shared kitchen", "List on delivery apps", "Track food cost % and ratings weekly", "Add a direct-order channel"],
    video: "how to start a cloud kitchen in India step by step",
  },
  {
    id: "tuition-centre", name: "Home tuition and coaching", categories: ["Small business", "Student", "Low-investment", "Service-based"],
    overview: "Teaching school or college subjects in small batches at home or online, scaling into a coaching brand over time.",
    investment: "₹5,000–50,000", investmentLow: 5000,
    skills: ["Subject expertise", "Clear explanation", "Patience", "Scheduling"],
    customers: ["School students (classes 6–12)", "Parents seeking exam support", "College students in specific subjects"],
    model: "Monthly fee per student per subject; small batches keep quality high and income predictable.",
    revenue: ["Monthly batch fees", "Exam crash courses", "Online recorded courses", "Doubt-clearing sessions"],
    marketing: ["Word of mouth from parents", "Local WhatsApp and society groups", "Free demo class", "Share student results (with permission)"],
    challenges: ["Seasonal demand around exams", "Building reputation from zero", "Time-bound income", "Competition from large coaching centres"],
    roadmap: ["Choose 1–2 subjects and grades", "Prepare a syllabus plan and notes", "Run 2 free demo classes", "Start with 5–8 students", "Collect feedback and results", "Add online batches", "Hire assistant teachers when demand grows"],
    video: "how to start home tuition business",
  },
  {
    id: "social-media-agency", name: "Social media management agency", categories: ["Digital marketing", "Online business", "Low-investment", "Service-based"],
    overview: "Managing Instagram, Facebook, LinkedIn and Google Business profiles for local businesses that have no time to post consistently.",
    investment: "₹10,000–60,000", investmentLow: 10000,
    skills: ["Content creation (Canva, short video editing)", "Copywriting", "Basic ads management", "Client communication"],
    customers: ["Cafés and restaurants", "Clinics and salons", "Real-estate agents", "Coaching institutes"],
    model: "Monthly retainer per client for a fixed number of posts, reels and reports; ad spend is billed separately.",
    revenue: ["Monthly retainers", "Paid ad management fee", "One-time profile setup", "Photo/video shoot packages"],
    marketing: ["Build your own page as a portfolio", "Offer a free audit to local businesses", "Case studies with numbers", "Referrals"],
    challenges: ["Client churn", "Proving results", "Keeping up with platform changes", "Scope creep"],
    roadmap: ["Learn content, reels and Meta ads basics", "Create 3 sample portfolios", "Pitch 20 local businesses with a free audit", "Sign 2 clients at an introductory price", "Report results monthly", "Systemise with templates", "Hire freelancers for editing"],
    video: "how to start social media marketing agency for beginners",
  },
  {
    id: "freelance-web-dev", name: "Freelance web development", categories: ["Freelancing", "Online business", "Student", "Low-investment"],
    overview: "Building websites, landing pages and small web apps for clients worldwide using your coding skills.",
    investment: "₹0–30,000 (laptop assumed)", investmentLow: 0,
    skills: ["HTML, CSS, JavaScript", "A framework (React) or a CMS (WordPress)", "Hosting and domains", "Client communication"],
    customers: ["Small businesses", "Startups", "Creators and coaches", "Overseas clients via freelance platforms"],
    model: "Fixed-price projects plus monthly maintenance retainers.",
    revenue: ["Project fees", "Maintenance plans", "Hosting resale", "Template sales"],
    marketing: ["A strong portfolio site", "GitHub projects", "Freelance platforms", "LinkedIn posts showing work"],
    challenges: ["Pricing your work", "Unclear client requirements", "Late payments", "Feast-or-famine income"],
    roadmap: ["Build 3 portfolio projects", "Publish a portfolio website", "Create profiles on 2 freelance platforms", "Take 2 small projects to get reviews", "Use written scope and 50% advance", "Offer maintenance plans", "Raise prices as reviews grow"],
    video: "how to start freelancing web development beginners",
  },
  {
    id: "ai-content-studio", name: "AI-assisted content studio", categories: ["AI-powered", "Online business", "Digital marketing", "Student"],
    overview: "Using AI tools to help businesses produce blogs, product descriptions, social posts and short videos faster, with human editing for quality and accuracy.",
    investment: "₹5,000–40,000 (tool subscriptions)", investmentLow: 5000,
    skills: ["Prompt engineering", "Editing and fact-checking", "SEO basics", "Brand voice"],
    customers: ["E-commerce sellers", "Small B2B companies", "Agencies needing overflow capacity", "Creators"],
    model: "Monthly content packages priced per deliverable; AI speeds up drafting while human editing guarantees quality.",
    revenue: ["Monthly content retainers", "Product catalogue writing", "Video scripts and captions", "Training businesses to use AI"],
    marketing: ["Before/after samples", "LinkedIn thought leadership", "Cold email to e-commerce stores", "Free sample article"],
    challenges: ["Clients expecting very low prices", "Accuracy and plagiarism checks", "Platform policy changes", "Differentiation"],
    roadmap: ["Master 2–3 AI tools and a prompting workflow", "Build a style guide template", "Create samples for 3 industries", "Price by package, not by hour", "Land 3 pilot clients", "Document a QA checklist", "Productise into fixed monthly plans"],
    video: "how to start AI content writing business",
  },
  {
    id: "ai-chatbot-agency", name: "AI chatbot and automation agency", categories: ["AI-powered", "SaaS", "Service-based"],
    overview: "Building WhatsApp/website chatbots and workflow automations for small businesses: answering FAQs, booking appointments and capturing leads.",
    investment: "₹20,000–1.5 lakh", investmentLow: 20000,
    skills: ["No-code automation tools or programming", "LLM APIs and prompt design", "Business process mapping", "Data privacy basics"],
    customers: ["Clinics", "Real-estate firms", "Coaching institutes", "D2C brands"],
    model: "Setup fee plus monthly maintenance; optional usage-based charges for messages.",
    revenue: ["One-time setup", "Monthly support", "Usage fees", "Custom integrations"],
    marketing: ["Live demo bots for each industry", "ROI case studies (hours saved, leads captured)", "Partnerships with web agencies"],
    challenges: ["Explaining value to non-technical owners", "API costs", "Handling wrong AI answers safely", "Data protection compliance"],
    roadmap: ["Pick one industry", "Build a demo bot for it", "Show it to 10 businesses", "Deliver a pilot with clear success metrics", "Add human hand-off and safety rules", "Package as monthly plans", "Expand to a second industry"],
    video: "how to start AI automation agency chatbot business",
  },
  {
    id: "micro-saas", name: "Micro-SaaS tool", categories: ["SaaS", "Online business"],
    overview: "A small subscription software product that solves one specific problem for a niche, such as invoice reminders for freelancers or booking for salons.",
    investment: "₹10,000–2 lakh", investmentLow: 10000,
    skills: ["Full-stack development", "Product design", "Customer interviews", "Pricing and billing"],
    customers: ["A clearly defined niche (e.g. tuition teachers, gyms, freelancers)"],
    model: "Monthly or yearly subscriptions; costs are hosting, tools and support.",
    revenue: ["Subscriptions", "Annual plans", "Add-ons", "Setup services"],
    marketing: ["Content/SEO on the niche's problems", "Communities where the niche hangs out", "Free trial", "Product Hunt and directories"],
    challenges: ["Finding product-market fit", "Churn", "Support load", "Competition from bigger tools"],
    roadmap: ["Interview 15 people in the niche", "Write the one problem you solve", "Build an MVP in 4–6 weeks", "Get 5 paying beta users", "Iterate weekly from feedback", "Add billing and onboarding", "Grow through content and referrals"],
    video: "how to build a micro SaaS startup from idea to first customers",
  },
  {
    id: "d2c-ecommerce", name: "D2C e-commerce brand", categories: ["E-commerce", "Online business", "Small business"],
    overview: "Selling your own branded products (snacks, skincare, apparel, home décor) directly to customers through your website and marketplaces.",
    investment: "₹50,000–5 lakh", investmentLow: 50000,
    skills: ["Product sourcing or manufacturing", "Branding", "Performance marketing", "Inventory and logistics"],
    customers: ["Online shoppers in a specific niche", "Gift buyers", "Repeat buyers for consumables"],
    model: "Buy or make products, sell at a markup; profit after cost of goods, shipping, returns, marketplace fees and ads.",
    revenue: ["Website sales", "Marketplace sales", "Bundles and subscriptions", "B2B or bulk orders"],
    marketing: ["Instagram and influencer collaborations", "Meta/Google ads", "Reviews and UGC", "Email/WhatsApp retention"],
    challenges: ["Customer acquisition cost", "Returns and RTO (return to origin)", "Inventory blocking cash", "Competition"],
    roadmap: ["Pick a niche with repeat demand", "Source and test samples", "Calculate unit economics", "Register business, GST and trademark", "Launch with a small batch", "Collect reviews", "Scale ads only when margins work"],
    video: "how to start D2C brand e-commerce business India",
  },
  {
    id: "reselling", name: "Social commerce reselling", categories: ["E-commerce", "Low-investment", "Student"],
    overview: "Reselling products from wholesalers or reseller apps to your network through WhatsApp and Instagram, without holding inventory.",
    investment: "₹0–10,000", investmentLow: 0,
    skills: ["Communication", "Product curation", "Customer service"],
    customers: ["Friends, family and local community", "Hostel and college groups", "Instagram followers"],
    model: "Add a margin on top of the supplier's price; the supplier ships directly.",
    revenue: ["Product margins", "Festive season bundles", "Referral bonuses from platforms"],
    marketing: ["WhatsApp catalogues", "Instagram stories", "Customer testimonials", "Festive offers"],
    challenges: ["Thin margins", "Quality control", "Delivery delays you cannot control", "Returns"],
    roadmap: ["Choose a category you understand", "Find 2 reliable suppliers", "Create a WhatsApp catalogue", "Start with your network", "Track repeat customers", "Build an Instagram page", "Move to own-branded products if demand grows"],
    video: "how to start reselling business online from home",
  },
  {
    id: "event-photography", name: "Event photography and videography", categories: ["Service-based", "Small business", "Freelancing"],
    overview: "Shooting weddings, birthdays, college fests and corporate events, and editing photos and reels.",
    investment: "₹80,000–3 lakh (camera and lenses)", investmentLow: 80000,
    skills: ["Photography", "Editing (Lightroom, Premiere)", "Client handling", "Teamwork at events"],
    customers: ["Families (weddings, birthdays)", "Colleges and schools", "Companies", "Brands needing product shoots"],
    model: "Package pricing per event or per day, plus albums and reels as add-ons.",
    revenue: ["Event packages", "Albums and prints", "Reels and highlight videos", "Product shoots"],
    marketing: ["Instagram portfolio", "Tie-ups with decorators and venues", "Reviews on Google", "Referrals"],
    challenges: ["Expensive equipment", "Seasonal demand", "Long editing hours", "Competitive pricing"],
    roadmap: ["Learn on a budget camera", "Assist an established photographer", "Build a portfolio with free/low-cost shoots", "Create packages", "Partner with event vendors", "Upgrade gear from profits", "Hire an editor"],
    video: "how to start photography business beginners",
  },
  {
    id: "digital-courses", name: "Online courses and digital products", categories: ["Online business", "Digital marketing", "Student"],
    overview: "Packaging knowledge into courses, templates, e-books or cohort programs sold online.",
    investment: "₹5,000–50,000", investmentLow: 5000,
    skills: ["Subject expertise", "Teaching and structuring content", "Video recording", "Audience building"],
    customers: ["Learners in your niche", "Professionals upskilling", "Students"],
    model: "Create once, sell many times; or run live cohorts at a higher price.",
    revenue: ["Course sales", "Cohort programs", "Templates and e-books", "Community memberships"],
    marketing: ["Free content on YouTube/Instagram/LinkedIn", "Email list", "Free webinar", "Testimonials"],
    challenges: ["Building trust and audience", "Completion rates", "Piracy", "Standing out"],
    roadmap: ["Pick a problem you can solve", "Grow an audience with free content", "Pre-sell a pilot cohort", "Run it live and gather feedback", "Turn it into a recorded course", "Automate sales with email", "Add advanced levels"],
    video: "how to create and sell online courses step by step",
  },
  {
    id: "laundry-pickup", name: "Laundry pickup and delivery", categories: ["Service-based", "Small business"],
    overview: "Doorstep laundry, ironing and dry-cleaning pickup for busy households, PGs and hostels, using a partner or own laundry unit.",
    investment: "₹1–6 lakh", investmentLow: 100000,
    skills: ["Operations and scheduling", "Customer service", "Vendor management"],
    customers: ["Working professionals", "PG and hostel residents", "Apartment complexes"],
    model: "Per-kg or per-piece pricing, plus monthly subscription plans.",
    revenue: ["Wash & fold per kg", "Ironing per piece", "Dry cleaning", "Monthly plans"],
    marketing: ["Tie-ups with apartment associations", "Flyers in PGs", "First-order discount", "Google Business listing"],
    challenges: ["Turnaround time", "Lost or damaged clothes", "Labour management", "Low margins"],
    roadmap: ["Survey 50 potential customers", "Partner with a laundry unit", "Set clear pricing and timelines", "Start in one locality", "Use a simple order-tracking sheet or app", "Introduce subscriptions", "Buy own machines when volume justifies it"],
    video: "how to start laundry business in India",
  },
];
