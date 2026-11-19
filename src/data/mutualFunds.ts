import { q, type Lesson } from "./types";

const A = "mutual-funds" as const;

export const mfLessons: Lesson[] = [
  {
    id: "what-is-mutual-fund", academy: A, level: "Beginner", minutes: 5,
    title: "What is a mutual fund?",
    summary: "A pool of money from many investors, managed by professionals and invested in stocks, bonds or both.",
    body: [
      "A mutual fund collects money from many investors and invests it according to a stated objective, such as large Indian companies or government bonds. Each investor owns units of the fund in proportion to what they put in.",
      "Funds are run by Asset Management Companies (AMCs) and regulated by SEBI. AMFI is the industry body that runs investor education and registers distributors. A fund gives small investors diversification and professional management with as little as ₹100–₹500.",
    ],
    example: "You invest ₹5,000 in a fund whose NAV is ₹50, so you get 100 units. The fund owns 60 stocks; your ₹5,000 is spread across all of them in the fund's proportions.",
    points: [
      "Investors own units; the fund owns the securities.",
      "Regulated by SEBI; money is held by an independent custodian.",
      "Returns are market-linked and not guaranteed.",
    ],
    quiz: [
      q("Who manages a mutual fund?", ["SEBI", "An Asset Management Company", "The stock exchange", "Your bank branch"], 1, "AMCs manage schemes under SEBI regulation."),
      q("₹10,000 invested at NAV ₹25 buys...", ["25 units", "250 units", "400 units", "4,000 units"], 2, "10,000 ÷ 25 = 400 units."),
    ],
    video: "what is mutual fund explained for beginners India",
  },
  {
    id: "how-mf-work", academy: A, level: "Beginner", minutes: 5,
    title: "How mutual funds work",
    summary: "From your money to the fund manager's portfolio, and how returns reach you.",
    body: [
      "When you invest, the AMC issues units at that day's NAV (based on the order cut-off time). The fund manager invests the pooled money as per the scheme's mandate. Each day the fund's assets are valued and the NAV is published.",
      "Your returns come from the change in NAV, plus any IDCW payouts. When you redeem, units are sold back to the fund at the applicable NAV, minus any exit load, and money reaches your bank, typically within 1–3 working days for equity funds.",
    ],
    example: "You bought 200 units at ₹40 (₹8,000). Two years later NAV is ₹52. Your units are worth ₹10,400, a gain of ₹2,400 (30%) before tax.",
    points: [
      "Units are bought and sold at NAV, not on an exchange (except ETFs).",
      "Every scheme publishes its portfolio monthly.",
      "Read the Scheme Information Document (SID) before investing.",
    ],
    quiz: [
      q("Your mutual fund return mainly comes from...", ["Change in NAV", "Fixed interest", "Bank deposits", "Insurance bonus"], 0, "NAV growth (plus any IDCW)."),
      q("Exit load is...", ["A fee charged on early redemption", "A tax", "A bonus", "Brokerage on stocks"], 0, "Some funds charge a fee if you redeem within a set period."),
    ],
    video: "how do mutual funds work NAV units explained",
  },
  {
    id: "types-of-mf", academy: A, level: "Beginner", minutes: 6,
    title: "Types of mutual funds",
    summary: "SEBI groups funds into equity, debt, hybrid, solution-oriented and other categories.",
    body: [
      "Since 2017, SEBI has standardised fund categories so investors can compare like with like. The main groups are equity (stocks), debt (bonds and money-market instruments), hybrid (a mix), solution-oriented (retirement, children's) and others (index funds, ETFs, fund of funds).",
      "Each AMC can usually have only one scheme per category, which makes comparison simpler. Choose the category based on your goal and time horizon first, then the fund.",
    ],
    example: "Goal in 1 year: a liquid or short-duration debt fund. Goal in 3–5 years: a hybrid fund. Goal in 10+ years: an equity or index fund.",
    points: [
      "Equity: higher risk, higher long-term growth potential.",
      "Debt: lower volatility, interest-rate and credit risk.",
      "Hybrid: a mix for balance.",
    ],
    quiz: [
      q("Who standardised fund categories in India?", ["RBI", "SEBI", "NSE", "IRDAI"], 1, "SEBI's 2017 categorisation circular."),
      q("For a goal 12 months away, a better fit is usually...", ["Small-cap fund", "Liquid / short-duration debt fund", "Sectoral fund", "International equity fund"], 1, "Short horizons need lower volatility."),
    ],
    video: "types of mutual funds explained equity debt hybrid",
  },
  {
    id: "equity-funds", academy: A, level: "Beginner", minutes: 5,
    title: "Equity funds",
    summary: "Funds that invest mainly in shares; suited to long-term goals.",
    body: [
      "Equity funds invest at least 65% in stocks. SEBI categories include large-cap, mid-cap, small-cap, flexi-cap, multi-cap, large & mid-cap, ELSS (tax-saving), focused, sectoral/thematic, value and dividend-yield funds.",
      "They can fall 20–40% in bad years, so they suit goals five or more years away. ELSS funds have a 3-year lock-in and qualify for Section 80C deduction under the old tax regime.",
    ],
    example: "A flexi-cap fund can move money between large, mid and small companies as the manager sees fit, while a large-cap fund must keep at least 80% in the top 100 companies.",
    points: [
      "Minimum 65% equity exposure.",
      "Small-cap funds are the most volatile of the diversified categories.",
      "ELSS: 3-year lock-in, the shortest among 80C options.",
    ],
    quiz: [
      q("ELSS funds have a lock-in of...", ["None", "1 year", "3 years", "5 years"], 2, "ELSS has a 3-year lock-in."),
      q("Equity funds are best suited to goals that are...", ["Weeks away", "5+ years away", "Tomorrow", "Only for retirees"], 1, "Time helps smooth equity volatility."),
    ],
    video: "equity mutual funds large cap mid cap small cap explained",
  },
  {
    id: "debt-funds", academy: A, level: "Beginner", minutes: 6,
    title: "Debt funds",
    summary: "Funds that lend money to governments and companies through bonds and money-market instruments.",
    body: [
      "Debt funds earn interest from bonds, treasury bills, commercial paper and similar instruments. Categories range from overnight and liquid funds (very short) to gilt and long-duration funds.",
      "Two key risks: interest-rate risk (bond prices fall when rates rise, more so for long durations) and credit risk (a borrower may default). Debt funds bought after 1 April 2023 are taxed at your income slab rate regardless of holding period.",
    ],
    example: "A liquid fund is often used to park an emergency fund or money needed within months. A gilt fund holding long government bonds can rise when interest rates fall, but drop when they rise.",
    points: [
      "Shorter duration = less interest-rate sensitivity.",
      "Check credit quality (AAA, sovereign) in the portfolio.",
      "Debt funds are not the same as fixed deposits; returns can vary.",
    ],
    quiz: [
      q("When interest rates rise, bond prices usually...", ["Rise", "Fall", "Stay fixed", "Double"], 1, "Prices and yields move in opposite directions."),
      q("Credit risk is the risk that...", ["The borrower defaults", "The NAV is published late", "Markets close", "SEBI changes"], 0, "A borrower may not repay."),
    ],
    video: "debt mutual funds explained interest rate risk credit risk",
  },
  {
    id: "index-funds", academy: A, level: "Beginner", minutes: 5,
    title: "Index funds",
    summary: "Low-cost funds that copy an index such as Nifty 50 instead of picking stocks.",
    body: [
      "An index fund buys all the stocks in an index in the same proportions. There is no stock-picking, so costs (expense ratios) are much lower than most active funds.",
      "Tracking error measures how closely the fund follows its index; lower is better. ETFs are similar but trade on the exchange like shares, so you need a Demat account to buy them.",
    ],
    example: "If Nifty 50 rises 12% in a year and an index fund's expense ratio is 0.2%, the fund should return close to 11.8% minus a little tracking difference.",
    points: [
      "Low cost, transparent and diversified.",
      "You get the market's return, not more.",
      "Compare expense ratio and tracking error between index funds on the same index.",
    ],
    quiz: [
      q("An index fund tries to...", ["Beat the index", "Copy the index", "Avoid stocks", "Guarantee returns"], 1, "It replicates the index."),
      q("Lower tracking error means...", ["The fund follows the index more closely", "Higher fees", "Higher risk", "Lock-in"], 0, "Closer tracking."),
    ],
    video: "what is index fund explained Nifty 50 index fund",
  },
  {
    id: "hybrid-funds", academy: A, level: "Beginner", minutes: 5,
    title: "Hybrid funds",
    summary: "Funds that combine equity, debt and sometimes gold to balance growth and stability.",
    body: [
      "Hybrid categories include conservative hybrid (mostly debt), balanced advantage / dynamic asset allocation (shifts between equity and debt), aggressive hybrid (65–80% equity), multi-asset allocation (at least three asset classes) and arbitrage funds.",
      "They suit investors who want one fund that manages the mix, or who want smoother returns than pure equity. Taxation depends on how much equity the fund holds.",
    ],
    example: "A balanced advantage fund may hold 70% equity when markets look cheap and 40% when they look expensive, based on a model. This can reduce the depth of falls but also trims gains in strong rallies.",
    points: [
      "Asset mix varies by category; check the factsheet.",
      "Arbitrage funds earn from price gaps between cash and futures markets.",
      "Useful as a first step from deposits into market-linked investing.",
    ],
    quiz: [
      q("An aggressive hybrid fund holds roughly...", ["10–25% equity", "65–80% equity", "100% gold", "0% equity"], 1, "65–80% equity per SEBI."),
      q("A multi-asset fund invests in at least...", ["One asset class", "Two", "Three", "Ten"], 2, "At least three asset classes."),
    ],
    video: "hybrid mutual funds balanced advantage fund explained",
  },
  {
    id: "sip", academy: A, level: "Beginner", minutes: 6,
    title: "SIP (Systematic Investment Plan)",
    summary: "Investing a fixed amount at regular intervals, usually monthly, into a mutual fund.",
    body: [
      "A SIP automatically invests a fixed sum, say ₹2,000 a month, on a date you choose. When NAV is low you get more units, when it is high you get fewer. This is called rupee-cost averaging.",
      "SIPs build discipline, remove the pressure of timing the market and let compounding work. You can start, pause, increase (step-up) or stop a SIP at any time; there is no penalty for stopping, though exit loads may apply on redemption.",
    ],
    example: "₹5,000 a month for 15 years is ₹9 lakh invested. At a hypothetical 12% annual return it could grow to about ₹25 lakh. At 8% it would be about ₹17 lakh. Try the SIP calculator below; actual returns vary and are not guaranteed.",
    points: [
      "Rupee-cost averaging: more units when prices are low.",
      "Step-up SIPs increase the amount yearly as income grows.",
      "Continuing SIPs during market falls is what makes averaging work.",
    ],
    quiz: [
      q("When NAV falls, a fixed SIP buys...", ["Fewer units", "More units", "No units", "The same units"], 1, "Same rupees, lower price, more units."),
      q("Is there a penalty for stopping a SIP?", ["Yes, always", "No, SIPs can be stopped anytime", "Only after 10 years", "Only for index funds"], 1, "You can stop anytime; only exit loads on redemption may apply."),
    ],
    video: "what is SIP systematic investment plan explained with example",
    tool: "sip",
  },
  {
    id: "lump-sum", academy: A, level: "Beginner", minutes: 4,
    title: "Lump-sum investment",
    summary: "Investing a large amount at once instead of in instalments.",
    body: [
      "A lump sum puts all your money to work immediately. Over long periods markets have tended to rise, so lump sums often end up ahead of spreading the same amount over months, but they are more exposed to bad timing.",
      "A middle path is a Systematic Transfer Plan (STP): park the lump sum in a liquid fund and transfer a fixed amount into an equity fund every month.",
    ],
    example: "You receive a ₹3 lakh bonus. Option 1: invest it all in an index fund today. Option 2: put it in a liquid fund and STP ₹25,000 a month into the index fund for 12 months, reducing timing risk.",
    points: [
      "Lump sum = more time in the market; more timing risk.",
      "STP spreads a lump sum over time.",
      "Use the lump-sum calculator to compare outcomes at different rates.",
    ],
    quiz: [
      q("STP stands for...", ["Systematic Transfer Plan", "Stock Trading Plan", "Simple Tax Payment", "Short-term Profit"], 0, "It transfers money between funds periodically."),
      q("Main risk of a lump sum is...", ["Too many units", "Investing just before a fall", "No NAV", "Lock-in"], 1, "Timing risk."),
    ],
    video: "SIP vs lump sum which is better explained",
    tool: "lumpsum",
  },
  {
    id: "nav", academy: A, level: "Beginner", minutes: 4,
    title: "NAV (Net Asset Value)",
    summary: "The per-unit value of a fund: (assets − liabilities) ÷ units.",
    body: [
      "NAV = (market value of all holdings + cash − liabilities) ÷ total units. It is calculated at the end of each business day.",
      "A low NAV does not mean a fund is cheap, and a high NAV does not mean it is expensive. What matters is how the underlying portfolio performs, not the NAV level itself.",
    ],
    example: "Fund A has NAV ₹15 and Fund B ₹150, both holding identical portfolios. If the stocks rise 10%, A becomes ₹16.50 and B ₹165. Your ₹10,000 grows to ₹11,000 in either.",
    points: [
      "NAV is calculated daily.",
      "Ignore whether NAV is “high” or “low”.",
      "Compare returns, risk and costs instead.",
    ],
    quiz: [
      q("A fund with NAV ₹10 is cheaper than one with NAV ₹100.", ["True", "False"], 1, "NAV level says nothing about value."),
      q("NAV is calculated...", ["Once a year", "Every business day", "Every minute", "Only at launch"], 1, "Daily."),
    ],
    video: "what is NAV in mutual fund explained",
  },
  {
    id: "expense-ratio", academy: A, level: "Intermediate", minutes: 5,
    title: "Expense ratio",
    summary: "The annual fee a fund charges, shown as a percentage of your investment.",
    body: [
      "The Total Expense Ratio (TER) covers fund management, administration and distribution costs. It is deducted from the fund's assets daily, so the NAV you see is already after expenses.",
      "SEBI caps TER based on fund size and type. Small differences compound: over 20 years, a 1% higher expense ratio can cost a large share of your final corpus.",
    ],
    example: "₹10 lakh invested for 20 years at 12% gross: with a 0.5% TER you end with about ₹88 lakh; with 1.5% TER about ₹74 lakh. A 1% fee difference cost roughly ₹14 lakh.",
    points: [
      "TER is charged daily, inside the NAV.",
      "Index funds and direct plans have lower TERs.",
      "Compare TER between funds in the same category.",
    ],
    quiz: [
      q("Where is the expense ratio deducted?", ["From your bank account monthly", "From the fund's assets, inside the NAV", "At redemption only", "From your salary"], 1, "It is built into NAV."),
      q("Over 20 years, a higher expense ratio...", ["Doesn't matter", "Can significantly reduce the final value", "Increases returns", "Is refunded"], 1, "Costs compound."),
    ],
    video: "expense ratio mutual fund explained",
  },
  {
    id: "direct-vs-regular", academy: A, level: "Intermediate", minutes: 4,
    title: "Direct vs Regular plans",
    summary: "Same fund, same manager; the regular plan pays a distributor commission and costs more.",
    body: [
      "Every scheme has a direct plan (bought straight from the AMC or a direct platform) and a regular plan (bought through a distributor who earns a trail commission). The portfolio is identical; only the expense ratio differs.",
      "Direct plans usually cost 0.5–1.5 percentage points less per year. Regular plans can make sense if you value a distributor's ongoing guidance; a SEBI-registered investment adviser (RIA) charges a fee instead and recommends direct plans.",
    ],
    example: "A flexi-cap fund's regular plan has a TER of 1.7% and its direct plan 0.7%. Same holdings, but the direct plan returns about 1% more every year.",
    points: [
      "Same portfolio, different cost.",
      "Plan name shows “Direct” or “Regular”.",
      "Choose based on whether you need paid guidance.",
    ],
    quiz: [
      q("Direct and regular plans of a fund have...", ["Different portfolios", "The same portfolio, different expenses", "Different managers", "Different NAV dates"], 1, "Only costs differ."),
      q("Who earns commission in a regular plan?", ["SEBI", "The distributor", "The exchange", "Nobody"], 1, "The distributor earns trail commission."),
    ],
    video: "direct vs regular mutual fund explained",
  },
  {
    id: "growth-vs-idcw", academy: A, level: "Intermediate", minutes: 4,
    title: "Growth vs IDCW",
    summary: "Growth reinvests gains inside the fund; IDCW pays some of your own money back periodically.",
    body: [
      "In the growth option, all gains stay in the fund and compound; the NAV reflects them. In the IDCW (Income Distribution cum Capital Withdrawal) option, the fund pays out amounts from time to time and the NAV drops by the payout.",
      "SEBI renamed the old “dividend” option to IDCW in 2021 to make clear that the payout comes partly from your own capital. IDCW payouts are taxed at your slab rate, so growth is usually more efficient for long-term wealth building.",
    ],
    example: "NAV ₹30 declares an IDCW of ₹2. Your NAV becomes ₹28 and you receive ₹2 per unit, taxed at your slab. Your total wealth did not increase because of the payout.",
    points: [
      "Growth = compounding inside the fund.",
      "IDCW = periodic payouts that reduce NAV.",
      "Need regular income? Consider a SWP from the growth option instead.",
    ],
    quiz: [
      q("After an IDCW payout, NAV...", ["Rises", "Falls by the payout", "Stays the same", "Doubles"], 1, "The payout comes out of the NAV."),
      q("IDCW replaced the earlier name...", ["Growth", "Dividend option", "SIP", "ELSS"], 1, "The dividend option was renamed IDCW in 2021."),
    ],
    video: "growth vs IDCW mutual fund explained",
  },
  {
    id: "risk-levels", academy: A, level: "Intermediate", minutes: 4,
    title: "Risk levels (Riskometer)",
    summary: "Every scheme shows a SEBI riskometer from Low to Very High.",
    body: [
      "The riskometer has six levels: Low, Low to Moderate, Moderate, Moderately High, High and Very High. It is printed on every scheme document and factsheet and is reviewed monthly based on the actual portfolio.",
      "Match the riskometer to your own risk capacity and time horizon. Most diversified equity funds are rated Very High because of short-term volatility.",
    ],
    example: "An overnight fund usually shows Low risk. A small-cap fund shows Very High. A conservative hybrid fund might show Moderately High.",
    points: [
      "Six levels, updated monthly.",
      "High risk means larger possible swings, not guaranteed losses.",
      "Don't pick a fund only for past returns; check its risk level.",
    ],
    quiz: [
      q("How many levels does the riskometer have?", ["3", "4", "6", "10"], 2, "Six levels."),
      q("Most diversified equity funds are rated...", ["Low", "Moderate", "Very High", "Unrated"], 2, "Because of equity volatility."),
    ],
    video: "mutual fund riskometer explained",
  },
  {
    id: "evaluate-mf", academy: A, level: "Advanced", minutes: 6,
    title: "How to evaluate mutual funds",
    summary: "Look beyond last year's return: consistency, risk, cost, portfolio and the fund house.",
    body: [
      "Check rolling returns over 3, 5 and 7 years against the benchmark and category average; consistency matters more than one great year. Look at risk measures: standard deviation, Sharpe ratio (return per unit of risk), maximum drawdown and downside capture.",
      "Then check the expense ratio, portfolio concentration and turnover, fund size, fund manager tenure and the AMC's process. Past performance never guarantees future results.",
    ],
    example: "Fund A returned 30% last year but trailed its benchmark in 4 of the last 7 years. Fund B returned 18% last year but beat its benchmark in 6 of 7 rolling 3-year periods with smaller drawdowns. B shows more consistency.",
    points: [
      "Rolling returns > point-to-point returns.",
      "Sharpe ratio: higher is better for the same category.",
      "Compare only within the same category.",
    ],
    quiz: [
      q("Which shows consistency best?", ["Last 1-year return", "Rolling returns over many periods", "NAV level", "Fund name"], 1, "Rolling returns smooth out lucky start dates."),
      q("Sharpe ratio measures...", ["Fees", "Return per unit of risk", "Fund size", "Lock-in"], 1, "Risk-adjusted return."),
    ],
    video: "how to select best mutual fund rolling returns sharpe ratio",
  },
  {
    id: "compare-mf", academy: A, level: "Advanced", minutes: 5,
    title: "How to compare mutual funds",
    summary: "A step-by-step checklist for comparing two funds side by side.",
    body: [
      "1) Same category only. 2) Same plan type (direct vs direct). 3) Compare rolling returns versus the same benchmark. 4) Compare volatility and drawdowns. 5) Compare expense ratios. 6) Check portfolio overlap with funds you already own.",
      "Use the scheme factsheets and AMFI data. If two funds are close on everything, the cheaper and simpler one usually wins.",
    ],
    example: "You own a Nifty 50 index fund and are considering a large-cap fund. If the large-cap fund holds 85% of the same stocks, it adds little diversification but charges more.",
    points: [
      "Like-for-like comparison only.",
      "High portfolio overlap = little extra diversification.",
      "Simplicity is a feature.",
    ],
    quiz: [
      q("Should you compare a small-cap fund with a debt fund on returns?", ["Yes", "No, different categories and risks"], 1, "Compare within the same category."),
      q("High portfolio overlap means...", ["Better diversification", "Little extra diversification", "Lower risk always", "Tax savings"], 1, "You are buying the same stocks twice."),
    ],
    video: "how to compare mutual funds portfolio overlap",
  },
];
