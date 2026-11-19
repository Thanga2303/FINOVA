import { q, type Lesson } from "./types";

const A = "investments" as const;

export const investmentLessons: Lesson[] = [
  {
    id: "long-term-investing", academy: A, level: "Beginner", minutes: 5,
    title: "Long-term investing",
    summary: "Holding quality assets for years so compounding and business growth do the heavy lifting.",
    body: [
      "Long-term investors focus on goals 5–30 years away. Over such periods, temporary crashes matter less, and the growth of businesses and the economy matters more.",
      "Key habits: invest regularly, keep costs low, diversify, avoid reacting to daily news, and review once or twice a year rather than every day.",
    ],
    example: "Two friends invest ₹10,000 a month. One stops for a year after a 20% market fall; the other continues. The one who continued bought more units at lower prices and is usually ahead when markets recover.",
    points: [
      "Time in the market beats timing the market for most people.",
      "Volatility is the price of long-term equity returns.",
      "Automate contributions.",
    ],
    quiz: [
      q("Long-term investing typically means a horizon of...", ["Days", "Weeks", "5+ years", "Minutes"], 2, "Years, not days."),
      q("A good long-term habit is...", ["Checking prices hourly", "Reviewing periodically and staying invested", "Selling at every dip", "Using leverage"], 1, "Patience and periodic review."),
    ],
    video: "long term investing for beginners India",
    tool: "wealth3d",
  },
  {
    id: "short-term-investing", academy: A, level: "Beginner", minutes: 4,
    title: "Short-term investing",
    summary: "Where to keep money you need within 1–3 years, where safety matters more than growth.",
    body: [
      "For short horizons, the priority is that the money is there when you need it. Options include savings accounts, fixed deposits, recurring deposits, liquid funds, money-market funds and short-duration debt funds.",
      "Avoid putting money you need soon into equities: a 20–30% fall right before your goal can be hard to recover from in time.",
    ],
    example: "You plan to pay a ₹1.5 lakh college fee in 10 months. An RD or a liquid fund is more suitable than a small-cap fund, even if the small-cap fund did well last year.",
    points: [
      "Short horizon → low volatility instruments.",
      "Check liquidity and any lock-in or penalty.",
      "Returns are lower but more predictable.",
    ],
    quiz: [
      q("For money needed in 6 months, which fits best?", ["Small-cap fund", "Liquid fund or FD", "Crypto", "Options"], 1, "Capital safety first."),
      q("Why avoid equity for short-term goals?", ["Too boring", "Prices can fall sharply right when you need the money", "It's illegal", "No returns ever"], 1, "Timing risk."),
    ],
    video: "where to invest for short term goals India",
  },
  {
    id: "compounding", academy: A, level: "Beginner", minutes: 5,
    title: "Compounding",
    summary: "Earning returns on your returns, so growth accelerates over time.",
    body: [
      "With compounding, each year's gains are added to your principal and earn returns too. The formula is FV = P × (1 + r)ⁿ. Time is the most powerful input: starting earlier often matters more than investing more.",
      "The Rule of 72 gives a quick estimate: years to double ≈ 72 ÷ annual return %. At 8%, money doubles in about 9 years; at 12%, about 6 years.",
    ],
    example: "Asha invests ₹5,000 a month from age 25 to 35, then stops. Ravi starts at 35 and invests ₹5,000 a month until 60. At a hypothetical 10% a year, Asha's 10 years of investing can end ahead of Ravi's 25 years (about ₹1.1 crore vs ₹67 lakh), because her money compounded for longer.",
    points: [
      "FV = P × (1 + r)ⁿ.",
      "Rule of 72: 72 ÷ rate = years to double.",
      "Start early; let it run.",
    ],
    quiz: [
      q("At 9% a year, money doubles in about...", ["4 years", "8 years", "12 years", "20 years"], 1, "72 ÷ 9 = 8."),
      q("The most powerful input in compounding is usually...", ["Time", "Luck", "Tips", "Brokerage"], 0, "Time multiplies everything."),
    ],
    video: "power of compounding explained with example",
    tool: "compound",
  },
  {
    id: "asset-allocation", academy: A, level: "Intermediate", minutes: 5,
    title: "Asset allocation",
    summary: "Dividing money between equity, debt, gold and cash based on goals and risk.",
    body: [
      "Asset allocation is how you split your money across asset classes. Equity drives growth, debt provides stability and income, gold often holds value in crises, and cash covers emergencies.",
      "Your mix depends on your goals, time horizon and ability to handle losses. A common starting rule of thumb is equity % ≈ 100 − age, adjusted for your own situation; it is a guide, not a rule.",
    ],
    example: "A 25-year-old saving for a goal 20 years away might hold 75% equity, 20% debt, 5% gold. A 55-year-old near retirement might hold 40% equity, 50% debt, 10% gold.",
    points: [
      "Allocation sets your portfolio's risk level.",
      "Rebalance periodically back to target.",
      "Different goals can have different allocations.",
    ],
    quiz: [
      q("Which asset mainly provides stability?", ["Small-cap equity", "Debt", "Options", "Crypto"], 1, "Debt is less volatile."),
      q("“100 − age” is...", ["A legal requirement", "A rough rule of thumb", "Guaranteed optimal", "A tax formula"], 1, "A starting point only."),
    ],
    video: "asset allocation explained equity debt gold",
  },
  {
    id: "diversification-inv", academy: A, level: "Intermediate", minutes: 4,
    title: "Diversification",
    summary: "Not putting all your eggs in one basket: across assets, sectors, geographies and time.",
    body: [
      "Diversification combines investments that do not all move together, so a fall in one is cushioned by others. You can diversify across asset classes, sectors, company sizes, countries and entry times (SIPs).",
      "Over-diversification also exists: owning ten similar equity funds adds complexity and cost without lowering risk much.",
    ],
    example: "In a year when Indian stocks fell, gold rose and short-term debt held steady. A portfolio with all three fell much less than an all-equity portfolio.",
    points: [
      "Look for assets that behave differently.",
      "Check fund overlap.",
      "Diversification reduces, but never removes, risk.",
    ],
    quiz: [
      q("Owning ten large-cap funds is...", ["Great diversification", "Mostly overlap", "Required", "Tax-free"], 1, "They hold many of the same stocks."),
      q("SIPs diversify across...", ["Time (entry points)", "Countries only", "Nothing", "Taxes"], 0, "They spread purchases over time."),
    ],
    video: "diversification in investing explained",
  },
  {
    id: "inflation", academy: A, level: "Beginner", minutes: 4,
    title: "Inflation",
    summary: "The rise in prices over time that reduces what your money can buy.",
    body: [
      "Inflation means ₹100 buys less next year than today. In India, retail inflation is measured by the Consumer Price Index (CPI); the RBI targets 4% with a band of 2–6%.",
      "Real return = nominal return − inflation (approximately). A savings account earning 3% when inflation is 5% loses purchasing power every year.",
    ],
    example: "At 6% inflation, something costing ₹1 lakh today costs about ₹1.79 lakh in 10 years and ₹3.2 lakh in 20 years. Use the inflation calculator to see the effect on your goals.",
    points: [
      "Real return ≈ return − inflation.",
      "RBI's target: 4% CPI inflation (2–6% band).",
      "Plan goals in future rupees, not today's.",
    ],
    quiz: [
      q("Return 7%, inflation 5%. Approximate real return?", ["12%", "7%", "2%", "−2%"], 2, "7 − 5 = 2%."),
      q("India's retail inflation target set for the RBI is...", ["0%", "4% (2–6% band)", "10%", "Not defined"], 1, "4% with a tolerance band of 2–6%."),
    ],
    video: "inflation explained effect on savings India",
    tool: "inflation",
  },
  {
    id: "risk-tolerance", academy: A, level: "Beginner", minutes: 4,
    title: "Risk tolerance",
    summary: "How much loss you can afford (capacity) and how much you can handle emotionally (appetite).",
    body: [
      "Risk capacity depends on facts: income stability, age, dependents, emergency fund and time horizon. Risk appetite is psychological: how you feel and act when your portfolio drops 25%.",
      "Your portfolio should respect the lower of the two. A plan you abandon in a crash is worse than a more conservative plan you stick with.",
    ],
    example: "A student with no dependents and a 20-year horizon has high risk capacity, but if a 10% fall makes them panic-sell, their effective risk tolerance is lower and their allocation should reflect that.",
    points: [
      "Capacity = can you afford it? Appetite = can you stomach it?",
      "Use the lower of the two.",
      "Reassess after major life events.",
    ],
    quiz: [
      q("Risk capacity is mainly about...", ["Feelings", "Financial situation and horizon", "Tips", "Market news"], 1, "Objective ability to bear loss."),
      q("Which should guide your allocation?", ["The higher of capacity and appetite", "The lower of the two", "Neither", "Friends' choices"], 1, "Be conservative where they differ."),
    ],
    video: "risk tolerance risk profile investing explained",
  },
  {
    id: "financial-goals", academy: A, level: "Beginner", minutes: 5,
    title: "Financial goals",
    summary: "Turning wishes into specific goals with an amount, a date and a monthly plan.",
    body: [
      "Good goals are SMART: specific, measurable, achievable, relevant and time-bound. “Buy a bike” becomes “₹1.2 lakh for a bike in 24 months”.",
      "For each goal: estimate the future cost (adjusting for inflation), choose investments that fit the time horizon, and calculate the monthly amount needed. Prioritise: emergency fund and insurance first, then high-priority goals.",
    ],
    example: "Goal: ₹6 lakh in 5 years for higher studies. At a hypothetical 10% a year, you would need roughly ₹7,700 a month. At 7%, about ₹8,300 a month.",
    points: [
      "Name it, price it, date it.",
      "Short, medium and long-term goals need different investments.",
      "Review goals yearly.",
    ],
    quiz: [
      q("Which is a SMART goal?", ["Be rich", "₹2 lakh for a laptop and course in 18 months", "Save more", "Invest in stocks"], 1, "Specific amount and date."),
      q("What usually comes before other goals?", ["Luxury holiday", "Emergency fund and insurance", "Options trading", "New phone"], 1, "Protection first."),
    ],
    video: "how to set financial goals SMART goals planning",
    tool: "sip",
  },
  {
    id: "emergency-fund", academy: A, level: "Beginner", minutes: 4,
    title: "Emergency fund",
    summary: "3–6 months (or more) of essential expenses kept safe and easy to access.",
    body: [
      "An emergency fund covers job loss, medical bills or urgent repairs so you never have to sell investments at a bad time or take expensive loans.",
      "Keep 3–6 months of essential expenses (6–12 if your income is irregular) in a savings account, sweep-in FD or liquid fund. Its job is safety and access, not returns.",
    ],
    example: "Monthly essentials: rent ₹12,000 + food ₹6,000 + bills ₹3,000 + transport ₹2,000 + EMI ₹4,000 = ₹27,000. A 6-month emergency fund = ₹1,62,000.",
    points: [
      "Only essentials count.",
      "Keep it separate from investments.",
      "Refill it after you use it.",
    ],
    quiz: [
      q("A typical emergency fund size is...", ["1 week of expenses", "3–6 months of essential expenses", "10 years of income", "Zero"], 1, "3–6 months, more for irregular income."),
      q("Best place for an emergency fund?", ["Small-cap fund", "Savings/sweep FD/liquid fund", "Options", "Real estate"], 1, "Safe and liquid."),
    ],
    video: "emergency fund how much and where to keep",
    tool: "emergency",
  },
  {
    id: "retirement-planning", academy: A, level: "Intermediate", minutes: 6,
    title: "Retirement planning",
    summary: "Estimating the corpus you'll need and building it with time on your side.",
    body: [
      "Retirement planning has three steps: estimate future monthly expenses (adjusting for inflation), estimate the corpus needed to fund them for 25–30 years, and work out the monthly investment to reach it.",
      "Indian options include EPF, PPF, NPS (with extra tax benefits under some regimes), and equity mutual funds for long-term growth. Starting in your 20s dramatically lowers the monthly amount needed.",
    ],
    example: "Expenses today ₹30,000 a month; retiring in 30 years at 6% inflation → about ₹1.72 lakh a month in future rupees. Use the retirement calculator to estimate the corpus and monthly SIP needed under your assumptions.",
    points: [
      "Plan in future rupees.",
      "Mix of EPF/PPF/NPS and equity funds is common.",
      "Increase contributions as income grows.",
    ],
    quiz: [
      q("Why plan in future rupees?", ["Inflation raises costs", "It sounds bigger", "Tax rules", "No reason"], 0, "Inflation compounds over decades."),
      q("Which is a government-backed long-term savings scheme?", ["PPF", "Intraday trading", "IPO", "Options"], 0, "Public Provident Fund."),
    ],
    video: "retirement planning in India how much corpus",
    tool: "retirement",
  },
  {
    id: "tax-basics", academy: A, level: "Intermediate", minutes: 6,
    title: "Tax basics for investors",
    summary: "How common investments are taxed in India (rules as of FY 2025-26; always check the latest Budget).",
    body: [
      "Equity shares and equity funds: gains on holdings over 12 months are long-term (LTCG), taxed at 12.5% on gains above ₹1.25 lakh a year; short-term gains (STCG) are taxed at 20%. Dividends and IDCW are taxed at your slab rate.",
      "Debt funds bought after 1 April 2023 and interest from FDs are taxed at your slab rate. Under the old tax regime, Section 80C allows up to ₹1.5 lakh of deductions (ELSS, PPF, EPF and others); the new regime has lower slab rates but fewer deductions. Tax rules change; confirm with the latest official guidance or a tax professional.",
    ],
    example: "You sell equity fund units held for 2 years with a gain of ₹2 lakh. The first ₹1.25 lakh of LTCG in the year is exempt; tax = 12.5% × ₹75,000 = ₹9,375 (plus cess).",
    points: [
      "Holding period changes the tax rate.",
      "Old vs new regime: compare both every year.",
      "Keep records of purchase dates and prices.",
    ],
    quiz: [
      q("Equity LTCG above the annual exemption is taxed at (FY 2025-26)...", ["5%", "12.5%", "30%", "0%"], 1, "12.5% above ₹1.25 lakh."),
      q("FD interest is taxed...", ["Not at all", "At your slab rate", "At 12.5% flat", "Only after 10 years"], 1, "Added to your income."),
    ],
    video: "income tax on mutual funds and shares capital gains India",
  },
];
