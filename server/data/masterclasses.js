// FINOVA Elite masterclasses. Served only by the server to verified Elite members.
// Educational content; not investment advice. Rules referenced are as commonly understood in India; check official sources.
export const MASTERCLASSES = [
  {
    id: "annual-report",
    title: "Reading an annual report, end to end",
    minutes: 18,
    topics: ["Financial statements", "Cash flow", "Red flags"],
    summary: "A step-by-step method for reading an Indian listed company's annual report and turning it into a one-page view of the business.",
    sections: [
      { h: "Why the annual report matters", p: ["Prices change every second, but the annual report is where the company has to explain, in writing and with audited numbers, how the business actually did. Learning to read it is the single most useful skill for a long-term investor."] },
      { h: "Step 1: Start with the business, not the numbers", p: ["Read the chairman's letter and the Management Discussion & Analysis (MD&A) first. Write down in two lines what the company sells, to whom, and why customers choose it. If you can't, you are not ready to judge the numbers."] },
      { h: "Step 2: Profit & loss statement", p: ["Track revenue growth, operating profit (EBITDA) margin and net profit over at least five years. Consistent growth with stable or rising margins is a sign of pricing power. One-off items (exceptional gains or losses) should be removed before comparing years."] },
      { h: "Step 3: Balance sheet", p: ["Check borrowings against shareholders' equity (debt-to-equity), receivables and inventory. Receivables growing much faster than revenue can mean the company is selling on easy credit to report sales."] },
      { h: "Step 4: Cash flow statement", p: ["Compare cash from operations (CFO) with net profit over several years. A healthy business converts most of its profit into cash. Persistent gaps, where profit is high but CFO is low, deserve a close look at working capital."] },
      { h: "Step 5: Notes, related parties and the auditor", p: ["Read the related-party transactions note, contingent liabilities, and the auditor's report. Qualified opinions, frequent auditor changes, large loans to promoter entities or rising pledged promoter shares are common red flags."] },
      { h: "Your one-page summary", p: ["End with: what the business does, five-year growth and margins, debt level, cash conversion, three risks, and what would change your view. Revisit it when the next report comes out."] },
    ],
    checklist: ["Five-year revenue and profit trend", "Operating margin trend", "Debt-to-equity", "Cash from operations vs net profit", "Receivable days", "Related-party transactions", "Auditor's opinion", "Promoter pledging"],
  },
  {
    id: "asset-allocation-plan",
    title: "Building your personal asset allocation plan",
    minutes: 15,
    topics: ["Goals", "Allocation", "Rebalancing"],
    summary: "Turn your goals into a written allocation plan with buckets, target weights and simple rebalancing rules you can follow for years.",
    sections: [
      { h: "Allocation drives most of your experience", p: ["How your money is split between equity, debt, gold and cash decides how much your portfolio can fall in a bad year and how much it can grow over time. Picking individual funds matters less than getting this split right for you."] },
      { h: "Step 1: Separate money by goal and time", p: ["Create buckets: emergency (instant access), short-term goals (under 3 years), medium-term (3 to 7 years) and long-term (7+ years). Each bucket gets its own mix; long-term money can take more equity because it has time to recover."] },
      { h: "Step 2: Set target weights", p: ["For example, a long-term bucket might be 70% equity, 25% debt and 5% gold, while a 2-year goal might be 100% debt. Write the targets down. The exact numbers depend on your risk tolerance, which the Wallet planner can help you think through."] },
      { h: "Step 3: Choose simple building blocks", p: ["Low-cost index funds or diversified equity funds for equity, short-duration or liquid funds and deposits for debt, and gold ETFs or gold funds for gold. Fewer, broader holdings are easier to monitor."] },
      { h: "Step 4: Rebalancing rules", p: ["Pick one rule and stick to it: rebalance once a year, or whenever an asset is more than 5 percentage points away from its target. Rebalancing sells some of what has risen and buys what has lagged, which keeps risk at the level you chose."] },
      { h: "Step 5: Review, don't react", p: ["Review the plan yearly or after life events (job change, marriage, children). Market news is not a reason to change targets; a change in your goals or time horizon is."] },
    ],
    checklist: ["Goals listed with dates", "Emergency fund separate", "Target weights per bucket", "Building blocks chosen", "Rebalancing rule written", "Annual review date set"],
  },
  {
    id: "position-sizing",
    title: "Position sizing and drawdown control for traders",
    minutes: 14,
    topics: ["Risk per trade", "Drawdowns", "Journaling"],
    summary: "Why most trading accounts fail, and how fixed-fraction position sizing and a drawdown plan keep you in the game.",
    sections: [
      { h: "Losses compound faster than gains", p: ["A 10% loss needs an 11% gain to recover, a 25% loss needs 33%, and a 50% loss needs 100%. Protecting capital is therefore more important than finding big winners."] },
      { h: "Fixed-fraction sizing", p: ["Decide the maximum you will lose on any single trade as a fraction of your capital, commonly 0.5% to 1%. Position size = (capital × risk %) ÷ (entry price − stop-loss price). The stop is set by the chart, the size by your risk rule."] },
      { h: "Worked example", p: ["Capital ₹2,00,000, risk 1% = ₹2,000. Entry ₹500, stop ₹480, so ₹20 risk per share. Position = 2,000 ÷ 20 = 100 shares (₹50,000 exposure). Even ten losses in a row would cost about 10% of the account."] },
      { h: "A drawdown plan", p: ["Write rules before you need them: for example, cut position size in half after a 6% drawdown from your account peak, and stop trading for a week after 10%. Review your journal before resuming."] },
      { h: "Use your journal", p: ["Tag every trade with its setup and emotion. After 30 trades, compare win rate and average win vs average loss by setup. Keep the setups with positive expectancy and drop the rest."] },
      { h: "Derivatives warning", p: ["Futures and options add leverage, so the same price move can wipe out much more capital. SEBI's studies have found that the large majority of individual F&O traders lose money. Master sizing on cash equities and paper trading first."] },
    ],
    checklist: ["Risk per trade fixed (e.g. 1%)", "Stop-loss set before entry", "Size calculated, not guessed", "Drawdown rules written", "Every trade journaled", "Monthly review of setups"],
  },
];
