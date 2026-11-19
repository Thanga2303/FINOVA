import { q, type Lesson } from "./types";

const A = "stocks" as const;

export const stockLessons: Lesson[] = [
  // ---------- BEGINNER ----------
  {
    id: "what-is-stock-market", academy: A, level: "Beginner", minutes: 5,
    title: "What is the stock market?",
    summary: "A regulated marketplace where buyers and sellers trade shares of listed companies.",
    body: [
      "The stock market is a network of exchanges where people buy and sell ownership in companies. In India, the two main exchanges are the NSE and the BSE, and the market is regulated by SEBI (Securities and Exchange Board of India).",
      "Companies list on an exchange to raise money for growth. Investors buy those shares hoping the business grows, which can raise the share price and pay dividends. Prices move every second based on demand, supply, company results and the wider economy.",
    ],
    example: "Imagine a bakery that needs ₹10 lakh to open five new shops. Instead of a loan, it sells small ownership pieces to 1,000 people. If the bakery earns more, each piece becomes more valuable. A stock market does this at the scale of thousands of companies and crores of investors.",
    points: [
      "The primary market is where companies first sell shares (an IPO); the secondary market is where investors trade with each other.",
      "SEBI makes rules to protect investors and keep trading fair.",
      "Prices reflect expectations about the future, not just today's profits.",
    ],
    quiz: [
      q("Who regulates India's securities market?", ["RBI", "SEBI", "NSE", "AMFI"], 1, "SEBI is the securities market regulator. RBI regulates banks and monetary policy."),
      q("Where do investors trade existing shares with each other?", ["Primary market", "Secondary market", "Bond market", "Forex market"], 1, "The secondary market (NSE/BSE trading) is where already-issued shares change hands."),
    ],
    video: "what is stock market for beginners India",
  },
  {
    id: "what-are-stocks", academy: A, level: "Beginner", minutes: 5,
    title: "What are stocks?",
    summary: "A stock (share) is a small unit of ownership in a company.",
    body: [
      "When you own a share, you own a tiny part of the company. You may get voting rights at shareholder meetings and a share of profits if the company pays dividends.",
      "You make money from stocks in two ways: capital appreciation (the price rises above what you paid) and dividends (cash the company distributes). You can also lose money if the price falls, so owning stocks means sharing in both the upside and the risk.",
    ],
    example: "If a company has 1 crore shares and you own 1,000, you own 0.01% of it. If its total value grows from ₹500 crore to ₹750 crore, your shares grow in value by about 50% too.",
    points: [
      "Shares represent ownership, not a loan to the company.",
      "Returns come from price growth and dividends; neither is guaranteed.",
      "Shareholders are paid after lenders if a company shuts down.",
    ],
    quiz: [
      q("Owning a share means you are a company's...", ["Lender", "Part-owner", "Employee", "Customer"], 1, "A share is ownership. Bondholders are lenders."),
      q("Which is NOT a way stocks can earn you money?", ["Dividends", "Price appreciation", "Fixed guaranteed interest", "Selling higher than you bought"], 2, "Stocks do not pay guaranteed interest; that is a feature of deposits and some bonds."),
    ],
    video: "what are shares stocks explained beginners",
  },
  {
    id: "what-is-nse", academy: A, level: "Beginner", minutes: 4,
    title: "What is NSE?",
    summary: "The National Stock Exchange of India, the country's largest exchange by trading volume.",
    body: [
      "The NSE was set up in 1992 and began trading in 1994. It introduced fully electronic, screen-based trading in India, which made buying and selling faster and more transparent.",
      "The NSE runs the Nifty family of indices, including the Nifty 50. It is also the largest derivatives (futures and options) exchange in the world by number of contracts traded.",
    ],
    example: "When you place an order for Infosys shares in your broker app and choose NSE, your order is matched electronically with a seller on the NSE's system within milliseconds.",
    points: [
      "Headquartered in Mumbai.",
      "Home of the Nifty 50 index.",
      "Most retail equity and derivatives trading in India happens on the NSE.",
    ],
    quiz: [
      q("Which index belongs to the NSE?", ["Sensex", "Nifty 50", "Dow Jones", "FTSE 100"], 1, "Nifty 50 is the NSE's flagship index. Sensex belongs to the BSE."),
      q("What did the NSE bring to Indian markets?", ["Paper share certificates", "Screen-based electronic trading", "Fixed share prices", "Gold trading only"], 1, "The NSE pioneered fully electronic trading in India."),
    ],
    video: "what is NSE National Stock Exchange explained",
  },
  {
    id: "what-is-bse", academy: A, level: "Beginner", minutes: 4,
    title: "What is BSE?",
    summary: "BSE (formerly Bombay Stock Exchange), founded in 1875, is Asia's oldest stock exchange.",
    body: [
      "BSE began as a group of brokers trading under a banyan tree in Mumbai and became a formal exchange in 1875. Today it is fully electronic and lists more companies than any other Indian exchange.",
      "BSE runs the S&P BSE Sensex, India's oldest stock index. Many shares are listed on both NSE and BSE, so you can usually choose either when you buy.",
    ],
    example: "Reliance Industries is listed on both exchanges. Its price on BSE and NSE is almost always within a few paise because traders quickly profit from any gap, which pulls the prices together.",
    points: [
      "Asia's oldest exchange, located on Dalal Street, Mumbai.",
      "Runs the Sensex.",
      "Lists the largest number of companies in India, including many small companies.",
    ],
    quiz: [
      q("BSE was founded in...", ["1875", "1947", "1992", "2000"], 0, "BSE dates back to 1875."),
      q("Can the same company be listed on both NSE and BSE?", ["No, never", "Yes, many are", "Only government companies", "Only banks"], 1, "Many large companies are dual-listed."),
    ],
    video: "what is BSE Bombay Stock Exchange explained",
  },
  {
    id: "what-is-sensex", academy: A, level: "Beginner", minutes: 4,
    title: "What is Sensex?",
    summary: "An index of 30 large, well-established companies listed on BSE.",
    body: [
      "Sensex (Sensitive Index) tracks 30 of the largest and most actively traded companies on BSE, weighted by their free-float market capitalisation. Its base year is 1978-79, with a base value of 100.",
      "When news says “Sensex rose 500 points”, it means these 30 companies, taken together, gained value that day. It is a quick thermometer for the mood of large Indian companies.",
    ],
    example: "If the Sensex moves from 80,000 to 80,800, that is a 1% rise. It does not mean every one of the 30 stocks rose; some may have fallen while heavier ones rose more.",
    points: [
      "30 companies, free-float market-cap weighted.",
      "Base value 100 in 1978-79.",
      "A rising index does not mean every stock is rising.",
    ],
    quiz: [
      q("How many companies are in the Sensex?", ["10", "30", "50", "100"], 1, "Sensex has 30 constituents."),
      q("Sensex moving from 60,000 to 60,600 is a rise of...", ["0.1%", "1%", "6%", "10%"], 1, "600 / 60,000 = 1%."),
    ],
    video: "what is Sensex explained in simple terms",
  },
  {
    id: "what-is-nifty-50", academy: A, level: "Beginner", minutes: 4,
    title: "What is Nifty 50?",
    summary: "The NSE index of 50 large companies across key sectors of the economy.",
    body: [
      "Nifty 50 tracks 50 large, liquid companies listed on the NSE, spread across sectors such as banking, IT, energy and consumer goods. Like the Sensex, it is weighted by free-float market capitalisation.",
      "Nifty 50 is widely used as a benchmark: mutual funds compare their performance against it, and index funds and ETFs copy it so investors can own all 50 companies in one go.",
    ],
    example: "A Nifty 50 index fund with ₹10,000 of your money spreads it across all 50 companies in the same proportion as the index, so a heavier stock like a large bank gets a bigger slice.",
    points: [
      "50 companies from multiple sectors.",
      "Managed by NSE Indices Ltd.",
      "Common benchmark for large-cap funds and the basis of many index funds.",
    ],
    quiz: [
      q("What is a benchmark?", ["A guaranteed return", "A standard used to compare performance", "A type of share", "A tax rule"], 1, "Funds compare themselves to benchmarks such as the Nifty 50."),
      q("Which product copies an index like Nifty 50?", ["Index fund", "Fixed deposit", "Insurance policy", "Savings account"], 0, "Index funds and ETFs replicate an index."),
    ],
    video: "what is Nifty 50 explained beginners",
  },
  {
    id: "demat-account", academy: A, level: "Beginner", minutes: 5,
    title: "What is a Demat account?",
    summary: "An electronic account that holds your shares and securities, like a bank account for investments.",
    body: [
      "A Demat (dematerialised) account stores your shares electronically. In India, Demat accounts are held with two depositories, NSDL and CDSL, through a Depository Participant, usually your broker.",
      "To invest you typically need three things: a bank account (money), a trading account with a broker (to place orders) and a Demat account (to hold what you buy). KYC with PAN and Aadhaar is required to open them.",
    ],
    example: "You buy 10 shares of a company on Monday. After settlement, the shares appear in your Demat account, and the money leaves your trading account. When you sell, the shares leave the Demat account and the sale money arrives after settlement.",
    points: [
      "Depositories: NSDL and CDSL.",
      "Trading account = placing orders; Demat account = holding securities.",
      "Never share your Demat login or OTPs with anyone.",
    ],
    quiz: [
      q("What does a Demat account do?", ["Places orders", "Holds securities electronically", "Pays interest", "Gives loans"], 1, "The trading account places orders; the Demat account holds what you own."),
      q("Which are India's two depositories?", ["NSE and BSE", "NSDL and CDSL", "SEBI and RBI", "AMFI and NISM"], 1, "NSDL and CDSL are the depositories."),
    ],
    video: "what is demat account and trading account explained",
  },
  {
    id: "buying-selling", academy: A, level: "Beginner", minutes: 6,
    title: "How does buying and selling work?",
    summary: "Orders are matched on the exchange, then settled so shares and money change hands.",
    body: [
      "You place an order through your broker. A market order buys or sells at the best available price right away. A limit order lets you set the maximum price you will pay (or minimum you will accept) and waits until that price is available.",
      "Once matched, the trade is settled: Indian equities settle on T+1, meaning shares and money move one working day after the trade. You also pay small charges such as brokerage, Securities Transaction Tax (STT), exchange fees, GST and stamp duty.",
    ],
    example: "A share trades at ₹102. You place a limit buy at ₹100. Your order waits; if a seller agrees to ₹100 later, it executes at ₹100. If the price never comes down, your order is not filled.",
    points: [
      "Market order = speed; limit order = price control.",
      "Delivery trades settle on T+1 in India.",
      "Check total charges, not only brokerage.",
    ],
    quiz: [
      q("Which order lets you set your maximum buying price?", ["Market order", "Limit order", "Stop-loss market only", "None"], 1, "A limit order executes only at your price or better."),
      q("Indian equity trades settle on...", ["T+0 always", "T+1", "T+5", "End of month"], 1, "India moved to T+1 settlement for equities."),
    ],
    video: "how to buy and sell shares market order limit order explained",
  },
  {
    id: "what-is-ipo", academy: A, level: "Beginner", minutes: 5,
    title: "What is an IPO?",
    summary: "An Initial Public Offering is when a company sells shares to the public for the first time.",
    body: [
      "In an IPO, a private company becomes listed on the stock exchange. It publishes a prospectus (the DRHP/RHP) explaining its business, finances, risks and how it will use the money.",
      "Investors apply during the subscription window through UPI or ASBA. If the IPO is oversubscribed, shares are allotted by lottery for retail investors. Listing-day gains are common in headlines but not guaranteed; some IPOs list below their issue price.",
    ],
    example: "An IPO is priced at ₹300–₹315 per share with a lot size of 47 shares. Applying for one lot at the top price blocks ₹14,805 in your bank. If you do not get an allotment, the block is released.",
    points: [
      "Read the RHP: business, risks, valuation and use of funds.",
      "Retail allotment is by lottery when demand is high.",
      "An IPO's popularity does not tell you whether it is good value.",
    ],
    quiz: [
      q("What is a company doing in an IPO?", ["Buying back shares", "Selling shares to the public for the first time", "Paying a dividend", "Leaving the exchange"], 1, "IPO = first public sale of shares."),
      q("Are listing-day gains guaranteed?", ["Yes", "No", "Only for large IPOs", "Only on BSE"], 1, "IPOs can list below their issue price."),
    ],
    video: "what is IPO and how to apply explained India",
  },
  {
    id: "dividends", academy: A, level: "Beginner", minutes: 4,
    title: "What are dividends?",
    summary: "A share of company profits paid to shareholders, usually in cash.",
    body: [
      "Profitable companies may pay part of their profits to shareholders as dividends. The board decides the amount; it can be raised, cut or skipped. Dividend yield = annual dividend per share ÷ share price.",
      "To receive a dividend you must own the share before the record date (in practice, buy before the ex-dividend date). On the ex-date, the share price usually drops by roughly the dividend amount. In India, dividends are taxed at your income-tax slab rate.",
    ],
    example: "A share costs ₹500 and pays ₹15 a year in dividends. Its dividend yield is 15 ÷ 500 = 3%. With 100 shares you would receive ₹1,500 before tax.",
    points: [
      "Dividends are not guaranteed.",
      "Dividend yield = dividend ÷ price.",
      "A very high yield can signal a falling price or a dividend that may be cut.",
    ],
    quiz: [
      q("A ₹200 share pays a ₹6 dividend. The yield is...", ["2%", "3%", "6%", "12%"], 1, "6 ÷ 200 = 3%."),
      q("Who decides whether a dividend is paid?", ["SEBI", "The company's board", "The exchange", "Your broker"], 1, "The board of directors declares dividends."),
    ],
    video: "what are dividends dividend yield explained",
  },
  // ---------- INTERMEDIATE ----------
  {
    id: "fundamental-analysis", academy: A, level: "Intermediate", minutes: 7,
    title: "Fundamental analysis",
    summary: "Judging a company's value by studying its business, financials and management.",
    body: [
      "Fundamental analysis asks: is this a good business, and is the price reasonable? You read the three financial statements: the income statement (revenue, costs, profit), the balance sheet (assets, debt) and the cash-flow statement (real cash in and out).",
      "Analysts look at revenue and profit growth, return on equity (ROE), debt-to-equity, operating margins and cash flow, then compare them with competitors and with the company's own history. Qualitative factors such as management quality, competitive advantage and industry trends matter just as much.",
    ],
    example: "Two paint companies both grow profit 15% a year. Company A has almost no debt and ROE of 25%; Company B has heavy debt and ROE of 10%. Fundamental analysis suggests A is the stronger business, though you still need to check whether its price already reflects that.",
    points: [
      "Read annual reports and quarterly results, not just news.",
      "Cash flow is harder to manipulate than reported profit.",
      "A great company can still be a poor investment at too high a price.",
    ],
    quiz: [
      q("Which statement shows a company's debt and assets?", ["Income statement", "Balance sheet", "Cash-flow statement", "Annual dividend notice"], 1, "The balance sheet lists assets, liabilities and equity."),
      q("High ROE with low debt usually indicates...", ["A weak business", "Efficient use of shareholder money", "Guaranteed returns", "An IPO"], 1, "ROE measures profit generated from shareholders' equity."),
    ],
    video: "fundamental analysis of stocks for beginners",
  },
  {
    id: "technical-analysis", academy: A, level: "Intermediate", minutes: 7,
    title: "Technical analysis",
    summary: "Studying price charts and volume to understand trends and market behaviour.",
    body: [
      "Technical analysis assumes that price and volume reflect what market participants collectively think. Analysts study trends (higher highs and higher lows), chart patterns, support and resistance, and indicators such as moving averages and RSI.",
      "It is mostly used for timing entries and exits, especially in trading. It does not tell you what a business is worth, and patterns often fail, so it should always be paired with risk management.",
    ],
    example: "A stock has made higher highs and higher lows for three months and trades above its 50-day moving average. A technical analyst calls this an uptrend, but would set a stop-loss below the last swing low in case the trend breaks.",
    points: [
      "Trend, support/resistance, volume and indicators are the core tools.",
      "Charts show probabilities, not certainties.",
      "Use the interactive candlestick chart below to practise reading price action.",
    ],
    quiz: [
      q("An uptrend is defined by...", ["Lower highs and lower lows", "Higher highs and higher lows", "Flat prices", "Rising dividends"], 1, "Higher highs and higher lows define an uptrend."),
      q("Technical analysis mainly helps with...", ["Valuing a business", "Timing entries and exits", "Filing taxes", "Choosing insurance"], 1, "It is a timing tool, not a valuation method."),
    ],
    video: "technical analysis for beginners chart reading",
    tool: "candles",
  },
  {
    id: "candlestick-patterns", academy: A, level: "Intermediate", minutes: 7,
    title: "Candlestick patterns",
    summary: "Each candle shows open, high, low and close; groups of candles form recognisable patterns.",
    body: [
      "A candlestick shows four prices for a period: open, high, low and close (OHLC). The body runs from open to close; it is green when close > open and red when close < open. The thin wicks show the high and low.",
      "Common patterns: a doji (open ≈ close) signals indecision; a hammer (small body, long lower wick) after a fall can hint at buying interest; a bullish engulfing candle fully covers the previous red body. Patterns work best with context: trend, support levels and volume.",
    ],
    example: "After five red candles, a hammer forms at a known support level with higher-than-average volume. A trader might wait for the next candle to close higher before acting, with a stop-loss below the hammer's low.",
    points: [
      "OHLC = open, high, low, close.",
      "Context (trend + level + volume) matters more than the pattern alone.",
      "Wait for confirmation instead of acting on a single candle.",
    ],
    quiz: [
      q("A green candle means...", ["Close < open", "Close > open", "No trading", "High = low"], 1, "Green (bullish) candles close above where they opened."),
      q("A doji usually signals...", ["Strong uptrend", "Indecision", "A dividend", "A stock split"], 1, "Open and close are nearly equal, so neither side won."),
    ],
    video: "candlestick patterns explained for beginners",
    tool: "candles",
  },
  {
    id: "support-resistance", academy: A, level: "Intermediate", minutes: 6,
    title: "Support and resistance",
    summary: "Price zones where buying (support) or selling (resistance) has repeatedly appeared.",
    body: [
      "Support is a price zone where a falling price has often stopped because buyers stepped in. Resistance is a zone where a rising price has often stalled because sellers appeared. They are zones, not exact lines.",
      "When resistance is broken convincingly, it often becomes the new support (role reversal). Traders use these zones to place entries, targets and stop-losses.",
    ],
    example: "A stock bounced near ₹480 three times this year and stalled near ₹560 twice. ₹480 is support and ₹560 is resistance. If it closes above ₹560 with strong volume, ₹560 may act as support later.",
    points: [
      "Draw zones from multiple touches.",
      "Breakouts are more reliable with higher volume.",
      "Round numbers (₹500, ₹1,000) often act as psychological levels.",
    ],
    quiz: [
      q("Support is where...", ["Sellers dominate", "Buyers have repeatedly stepped in", "Dividends are paid", "Trading stops"], 1, "Support is a demand zone."),
      q("After a strong breakout, old resistance often becomes...", ["Support", "Irrelevant", "A dividend", "Resistance again immediately"], 0, "Role reversal is common."),
    ],
    video: "support and resistance explained trading",
  },
  {
    id: "volume-analysis", academy: A, level: "Intermediate", minutes: 5,
    title: "Volume analysis",
    summary: "Volume shows how many shares changed hands and how strong a price move is.",
    body: [
      "Volume is the number of shares traded in a period. A price move on high volume shows conviction; a move on low volume is easier to reverse.",
      "Traders watch for volume spikes at breakouts, falling volume during pullbacks in an uptrend, and very high volume after long falls, which can mark capitulation.",
    ],
    example: "A stock rises 4% on three times its average daily volume after strong quarterly results. The heavy volume suggests large investors are buying, which makes the move more meaningful than a 4% rise on thin volume.",
    points: [
      "Compare volume with its own average, not with other stocks.",
      "Breakouts need volume confirmation.",
      "Delivery percentage (on NSE) shows how much of the volume was taken into Demat accounts.",
    ],
    quiz: [
      q("A breakout on low volume is...", ["More reliable", "Less reliable", "Guaranteed", "Illegal"], 1, "Low participation makes moves fragile."),
      q("Volume measures...", ["Number of shares traded", "Company profit", "Dividend size", "Number of employees"], 0, "Volume is shares traded."),
    ],
    video: "volume analysis in stock market explained",
  },
  {
    id: "market-cap", academy: A, level: "Intermediate", minutes: 5,
    title: "Market capitalisation",
    summary: "Market cap = share price × total shares; it shows a company's size in the market.",
    body: [
      "Market capitalisation is the total market value of a company's shares. In India, SEBI's classification ranks companies by market cap: the top 100 are large-cap, 101–250 are mid-cap, and 251 onwards are small-cap. AMFI publishes this list twice a year.",
      "Large caps are usually more stable; small caps can grow faster but swing more and can be harder to sell in bad markets.",
    ],
    example: "A company with 50 crore shares trading at ₹1,200 has a market cap of ₹60,000 crore. If the price rises to ₹1,500, the market cap becomes ₹75,000 crore without the business itself changing overnight.",
    points: [
      "Market cap = price × shares outstanding.",
      "Large-cap: top 100; mid-cap: 101–250; small-cap: 251+.",
      "Size affects risk, volatility and liquidity.",
    ],
    quiz: [
      q("Price ₹200, shares 10 crore. Market cap?", ["₹20 crore", "₹200 crore", "₹2,000 crore", "₹20,000 crore"], 2, "200 × 10 crore = ₹2,000 crore."),
      q("Under SEBI's rules, the 150th largest company is...", ["Large-cap", "Mid-cap", "Small-cap", "Micro-cap"], 1, "Ranks 101–250 are mid-cap."),
    ],
    video: "market capitalisation large cap mid cap small cap explained",
  },
  {
    id: "pe-ratio", academy: A, level: "Intermediate", minutes: 6,
    title: "P/E ratio",
    summary: "Price-to-earnings shows how much investors pay for each rupee of a company's profit.",
    body: [
      "P/E = share price ÷ earnings per share (EPS). A P/E of 25 means investors pay ₹25 for every ₹1 of annual profit. A high P/E usually means the market expects strong future growth; a low P/E can mean value or real problems.",
      "Compare P/E within the same industry and against the company's own history. A fast-growing tech company and a slow utility will naturally have very different P/Es.",
    ],
    example: "Share price ₹600, EPS ₹30 → P/E = 20. A competitor at P/E 40 is not automatically overpriced if its profits are growing twice as fast; that is why some investors also use the PEG ratio (P/E ÷ growth rate).",
    points: [
      "P/E = price ÷ EPS.",
      "Compare within the same sector.",
      "Loss-making companies have no meaningful P/E.",
    ],
    quiz: [
      q("Price ₹450, EPS ₹15. P/E?", ["15", "30", "45", "450"], 1, "450 ÷ 15 = 30."),
      q("A high P/E usually signals...", ["Expected high growth", "Bankruptcy", "A guaranteed bargain", "No profits"], 0, "Investors pay more for expected growth."),
    ],
    video: "PE ratio explained price to earnings",
  },
  {
    id: "eps", academy: A, level: "Intermediate", minutes: 4,
    title: "EPS (Earnings per share)",
    summary: "Net profit divided by the number of shares: the profit attributable to one share.",
    body: [
      "EPS = (net profit − preferred dividends) ÷ weighted average shares outstanding. It lets you compare profit across time even if the number of shares changes.",
      "Growing EPS over many years is a sign of a healthy business. Watch for share dilution (new shares issued), which can shrink EPS even if total profit rises. Diluted EPS accounts for options and convertibles.",
    ],
    example: "A company earns ₹1,000 crore net profit and has 50 crore shares. EPS = ₹20. If it issues 10 crore new shares and profit stays the same, EPS falls to about ₹16.7.",
    points: [
      "EPS links company profit to one share.",
      "Track EPS growth over 5–10 years.",
      "Dilution reduces EPS.",
    ],
    quiz: [
      q("Net profit ₹500 crore, shares 25 crore. EPS?", ["₹2", "₹20", "₹25", "₹200"], 1, "500 ÷ 25 = ₹20."),
      q("Issuing many new shares with flat profit makes EPS...", ["Rise", "Fall", "Unchanged", "Double"], 1, "More shares share the same profit."),
    ],
    video: "EPS earnings per share explained",
  },
  {
    id: "diversification-stocks", academy: A, level: "Intermediate", minutes: 5,
    title: "Portfolio diversification",
    summary: "Spreading money across companies, sectors and assets to reduce the damage from any single loss.",
    body: [
      "Diversification lowers company-specific risk. If one company has a scandal, it hurts a portfolio of 20 stocks far less than a portfolio of 2. Spreading across sectors (banking, IT, pharma, consumer) helps further.",
      "It cannot remove market risk: in a broad crash most stocks fall together. That is why investors also diversify across asset classes such as debt, gold and cash.",
    ],
    example: "Portfolio A holds one stock that falls 40%: the whole portfolio drops 40%. Portfolio B holds 20 equal stocks; the same 40% fall in one stock costs the portfolio 2%.",
    points: [
      "Diversify across companies, sectors and asset classes.",
      "Too many overlapping funds is not real diversification.",
      "Diversification reduces risk but cannot eliminate it.",
    ],
    quiz: [
      q("Diversification mainly reduces...", ["Company-specific risk", "All risk completely", "Taxes", "Brokerage"], 0, "It reduces unsystematic (company-specific) risk."),
      q("One of 10 equal holdings drops 50%. Portfolio impact?", ["−50%", "−10%", "−5%", "0%"], 2, "50% × 1/10 = 5%."),
    ],
    video: "portfolio diversification explained",
  },
  // ---------- ADVANCED ----------
  {
    id: "advanced-charts", academy: A, level: "Advanced", minutes: 8,
    title: "Advanced chart analysis",
    summary: "Multi-timeframe analysis, chart patterns and confluence for higher-quality setups.",
    body: [
      "Advanced chartists start on a higher timeframe (weekly) to find the main trend and key levels, then zoom into daily or hourly charts for entries. This multi-timeframe approach avoids trading against the bigger trend.",
      "They study patterns such as head and shoulders, double tops/bottoms, triangles and flags, and look for confluence: several signals agreeing (a level + a pattern + volume + an indicator). Every setup still needs a pre-defined exit if it fails.",
    ],
    example: "Weekly chart: uptrend. Daily chart: price pulls back to a prior breakout level that matches the 50-day moving average, and forms a bullish engulfing candle. Three factors line up, so the setup has confluence; the stop goes below the pullback low.",
    points: [
      "Top-down: weekly → daily → intraday.",
      "Confluence improves odds but never guarantees an outcome.",
      "Write the invalidation level before entering.",
    ],
    quiz: [
      q("Multi-timeframe analysis starts with...", ["The 1-minute chart", "A higher timeframe", "News only", "Dividends"], 1, "Top-down analysis begins with the bigger picture."),
      q("Confluence means...", ["One indicator only", "Several independent signals agreeing", "Trading at random", "Holding forever"], 1, "Multiple signals pointing the same way."),
    ],
    video: "multi timeframe analysis chart patterns advanced",
    tool: "candles",
  },
  {
    id: "market-psychology", academy: A, level: "Advanced", minutes: 6,
    title: "Market psychology",
    summary: "Fear, greed and cognitive biases drive many price moves and investor mistakes.",
    body: [
      "Markets cycle between optimism, euphoria, anxiety, panic and recovery. During euphoria people buy because prices are rising; during panic they sell because prices are falling, often doing the opposite of what long-term investing requires.",
      "Common biases: loss aversion (holding losers too long), herd behaviour (following the crowd), recency bias (assuming the recent trend continues forever), overconfidence and confirmation bias (reading only what agrees with you).",
    ],
    example: "In a rally, a friend's stock doubles and you buy in late to avoid missing out (FOMO). When it falls 20%, loss aversion makes you hold it hoping to break even, while you sell a good stock that is up 10% to “book profit”. That is the disposition effect.",
    points: [
      "Have a written plan before emotions arrive.",
      "Automate investing (e.g. SIPs) to reduce emotional decisions.",
      "Ask: would I buy this today at this price?",
    ],
    quiz: [
      q("Holding losers too long and selling winners early is called...", ["Diversification", "The disposition effect", "Compounding", "Arbitrage"], 1, "A classic behavioural bias."),
      q("FOMO usually leads investors to...", ["Buy after big rises", "Sell at the bottom only", "Avoid markets", "Read annual reports"], 0, "Fear of missing out drives late buying."),
    ],
    video: "stock market psychology behavioural finance biases",
  },
  {
    id: "risk-management-stocks", academy: A, level: "Advanced", minutes: 6,
    title: "Risk management",
    summary: "Position sizing, stop-losses and limits that keep any single mistake survivable.",
    body: [
      "Professional investors decide how much they can lose before deciding how much they might make. A common rule for traders is to risk no more than 1–2% of capital on any one trade. Investors cap single-stock exposure (for example, 5–10% of the portfolio).",
      "Position size = amount you are willing to risk ÷ distance to your stop-loss. Avoid leverage you do not understand, and keep an emergency fund outside the market so you are never forced to sell at the worst time.",
    ],
    example: "Capital ₹5,00,000, risk 1% = ₹5,000. You buy at ₹250 with a stop at ₹240 (₹10 risk per share). Position size = 5,000 ÷ 10 = 500 shares (₹1,25,000 invested), but your maximum planned loss is still ₹5,000.",
    points: [
      "Position size from risk, not from conviction.",
      "Losses compound too: −50% needs +100% to recover.",
      "Leverage multiplies both gains and losses.",
    ],
    quiz: [
      q("A 50% loss needs what gain to recover?", ["50%", "75%", "100%", "150%"], 2, "₹100 → ₹50 needs to double to get back to ₹100."),
      q("Risk ₹2,000, stop distance ₹5. Position size?", ["40 shares", "400 shares", "2,000 shares", "10 shares"], 1, "2,000 ÷ 5 = 400."),
    ],
    video: "risk management position sizing stop loss",
    tool: "riskreward",
  },
  {
    id: "portfolio-construction", academy: A, level: "Advanced", minutes: 7,
    title: "Portfolio construction",
    summary: "Combining assets with purpose: goals, allocation, position limits and rebalancing.",
    body: [
      "A portfolio is built from your goals backwards. Decide the asset allocation first (for example 60% equity, 30% debt, 10% gold), then choose investments inside each bucket. Within equity, many investors use a core (index funds or large caps) plus a smaller satellite (themes or individual stocks).",
      "Set position limits, avoid overlapping holdings, and rebalance when allocations drift far from target, for example once a year or when an asset is 5 percentage points off.",
    ],
    example: "Target 60/40 equity/debt. After a strong year, equity grows to 70%. Rebalancing sells some equity and buys debt to get back to 60/40, locking in gains and keeping risk at the intended level.",
    points: [
      "Allocation drives most of a portfolio's risk.",
      "Core-satellite keeps experiments small.",
      "Rebalancing is a discipline, not a prediction.",
    ],
    quiz: [
      q("What should be decided first?", ["Which hot stock to buy", "Asset allocation based on goals", "Brokerage plan", "Chart pattern"], 1, "Allocation comes first."),
      q("Rebalancing after equity rallies usually means...", ["Buying more equity", "Selling some equity to restore targets", "Selling everything", "Doing nothing ever"], 1, "Restore the target mix."),
    ],
    video: "how to build an investment portfolio asset allocation rebalancing",
  },
  {
    id: "institutional-investing", academy: A, level: "Advanced", minutes: 6,
    title: "Institutional investing concepts",
    summary: "How FIIs, DIIs, mutual funds and insurers move markets, and what retail investors can learn.",
    body: [
      "Institutions such as foreign portfolio investors (FPIs/FIIs), domestic institutions (DIIs: mutual funds, insurers, pension funds) and banks manage huge pools of money. Their flows are published daily by the exchanges and often explain big market moves.",
      "Institutions follow mandates, benchmarks and risk limits. They do research at scale, rebalance regularly and think in years. Retail investors can borrow their habits: a written policy, diversification, cost control and patience, without trying to copy their trades.",
    ],
    example: "In a month when FPIs sell heavily because of global interest-rate fears, DIIs flush with SIP inflows may buy. Their opposing flows can cushion the fall in Indian markets.",
    points: [
      "FPI and DII flow data is published daily.",
      "Block and bulk deals reveal large institutional trades.",
      "Copy their process, not their positions.",
    ],
    quiz: [
      q("DIIs include...", ["Foreign hedge funds", "Indian mutual funds and insurers", "Only retail investors", "Only RBI"], 1, "Domestic institutional investors include MFs, insurers and pension funds."),
      q("A useful lesson from institutions is...", ["Trade on tips", "Follow a written investment policy", "Use maximum leverage", "Never diversify"], 1, "Process and discipline."),
    ],
    video: "FII DII explained institutional investors India",
  },
];
