import { q, type Lesson } from "./types";

const A = "trading" as const;

export const tradingLessons: Lesson[] = [
  {
    id: "trading-fundamentals", academy: A, level: "Beginner", minutes: 6,
    title: "Trading fundamentals",
    summary: "Trading aims to profit from shorter-term price moves; it is different from long-term investing.",
    body: [
      "Investors buy businesses to hold for years. Traders buy and sell over minutes, days or weeks to profit from price swings. Trading needs a defined strategy, strict risk control, low costs and a lot of practice.",
      "Most new traders lose money, mainly because of overtrading, no stop-losses, and leverage. SEBI's studies of the futures and options segment found that about 9 in 10 individual traders made net losses. Practise in the simulator before risking real money.",
    ],
    example: "A trader buys 100 shares at ₹200 expecting a move to ₹220, with a stop-loss at ₹194. Risk = ₹600, potential reward = ₹2,000. The plan is written before the trade, not after.",
    points: [
      "Every trade needs entry, stop-loss and target before you click buy.",
      "Costs (brokerage, STT, slippage) matter far more when you trade often.",
      "Trading is a skill business; treat it like one.",
    ],
    quiz: [
      q("What did SEBI's studies find about individual F&O traders?", ["Most made profits", "About 9 in 10 made net losses", "Exactly half lost", "None lost"], 1, "SEBI found around 89–91% made net losses."),
      q("Which should be decided before entering a trade?", ["Only the target", "Entry, stop-loss and target", "Nothing", "Only the broker"], 1, "Plan the whole trade first."),
    ],
    video: "trading for beginners basics explained",
    tool: "simulator",
  },
  {
    id: "intraday", academy: A, level: "Beginner", minutes: 5,
    title: "Intraday trading",
    summary: "Buying and selling within the same trading day; all positions are closed before the market closes.",
    body: [
      "In intraday (MIS) trades, positions are squared off the same day, so no shares go into your Demat account. Brokers offer margin (leverage) for intraday, which magnifies both profits and losses.",
      "Intraday needs fast decisions, liquid stocks and very tight risk control. Positions not closed by the trader are auto-squared off by the broker near the close, sometimes with an extra charge.",
    ],
    example: "You short a stock at ₹1,000 at 10:00 expecting weakness and cover at ₹990 at 14:30. Profit = ₹10 per share before charges. If it had risen to your stop at ₹1,006, you would exit with a ₹6 loss per share.",
    points: [
      "Positions close the same day.",
      "Leverage amplifies losses as much as gains.",
      "Trade only liquid stocks with tight spreads.",
    ],
    quiz: [
      q("Intraday positions are...", ["Held for months", "Closed the same day", "Moved to Demat", "Tax-free"], 1, "Squared off before close."),
      q("Leverage makes losses...", ["Smaller", "Larger", "Impossible", "Guaranteed"], 1, "Leverage multiplies both directions."),
    ],
    video: "intraday trading explained for beginners risks",
  },
  {
    id: "swing-trading", academy: A, level: "Beginner", minutes: 5,
    title: "Swing trading",
    summary: "Holding positions for days to a few weeks to capture a price swing.",
    body: [
      "Swing traders aim to catch one leg of a move, for example a bounce from support to resistance. They usually use daily charts, so it fits people with full-time jobs better than intraday trading.",
      "Because positions are held overnight, they face gap risk (prices opening sharply higher or lower after news). Position sizing and stops are essential.",
    ],
    example: "A stock in an uptrend pulls back to its 20-day moving average and forms a bullish candle. A swing trader buys at ₹500, stop at ₹480, target ₹560 (risk ₹20, reward ₹60, a 1:3 risk-reward).",
    points: [
      "Typical holding period: 2 days to a few weeks.",
      "Uses daily and weekly charts.",
      "Overnight gap risk exists.",
    ],
    quiz: [
      q("Typical swing trade duration?", ["Seconds", "Days to weeks", "10 years", "Only one minute"], 1, "Days to a few weeks."),
      q("Holding overnight adds...", ["Gap risk", "No risk", "Guaranteed profit", "Tax exemption"], 0, "News can gap prices at the open."),
    ],
    video: "swing trading strategy explained beginners",
  },
  {
    id: "positional-trading", academy: A, level: "Beginner", minutes: 4,
    title: "Positional trading",
    summary: "Holding trades for weeks to months to ride larger trends.",
    body: [
      "Positional traders follow bigger trends using weekly and daily charts, often combining technical signals with fundamental or sector themes.",
      "It needs fewer decisions and lower costs than intraday trading, but wider stop-losses, so position sizes must be smaller to keep risk the same.",
    ],
    example: "A trader notices a sector breaking out of a two-year range on the weekly chart and buys a leading stock, planning to hold while it stays above its 50-day average.",
    points: [
      "Weeks to months holding period.",
      "Wider stops → smaller position size.",
      "Trend-following mindset.",
    ],
    quiz: [
      q("Positional trading usually uses...", ["Tick charts", "Daily and weekly charts", "No charts", "Only news"], 1, "Higher timeframes."),
      q("Wider stops usually mean...", ["Bigger positions", "Smaller positions for the same risk", "No risk", "No stops"], 1, "Size = risk ÷ stop distance."),
    ],
    video: "positional trading explained",
  },
  {
    id: "candlesticks-trading", academy: A, level: "Intermediate", minutes: 6,
    title: "Candlestick patterns for traders",
    summary: "Reversal and continuation candle patterns, and how traders confirm them.",
    body: [
      "Reversal patterns include the hammer and shooting star, bullish and bearish engulfing, morning star and evening star. Continuation patterns include rising/falling three methods and inside bars in trends.",
      "Treat a pattern as a signal to pay attention, not as a buy or sell order. Confirm with location (at support/resistance), trend direction and volume, and always place a stop.",
    ],
    example: "At resistance after a strong rise, a shooting star appears (small body, long upper wick). The next candle closes below its low. A trader might short with a stop above the wick's high.",
    points: [
      "Location matters: patterns at key levels are more meaningful.",
      "Wait for the next candle to confirm.",
      "Practise identifying patterns on the interactive chart.",
    ],
    quiz: [
      q("A shooting star appears most meaningfully...", ["At resistance after a rise", "In the middle of nowhere", "Only on weekends", "After a dividend"], 0, "Location gives context."),
      q("What should follow a pattern before acting?", ["Confirmation", "Doubling position", "Removing stop", "Nothing"], 0, "Confirmation reduces false signals."),
    ],
    video: "candlestick patterns for trading reversal continuation",
    tool: "candles",
  },
  {
    id: "chart-reading", academy: A, level: "Intermediate", minutes: 5,
    title: "Chart reading",
    summary: "Chart types, timeframes, trend lines and how to read a price chart step by step.",
    body: [
      "Common chart types are line (closing prices), bar and candlestick (OHLC). Choose a timeframe that matches your holding period: intraday traders use 5–15 minute charts, swing traders daily, investors weekly or monthly.",
      "Read a chart in order: 1) overall trend, 2) key support/resistance zones, 3) recent candles and volume, 4) indicator signals. Mark levels before the session starts.",
    ],
    example: "On a daily chart: trend up, support at ₹720, resistance at ₹790, price at ₹760 with falling volume. Conclusion: in the middle of the range; wait for a move to a level rather than trading in the middle.",
    points: [
      "Match timeframe to holding period.",
      "Trend → levels → candles → indicators.",
      "Avoid trading in the middle of a range.",
    ],
    quiz: [
      q("A line chart typically plots...", ["Closing prices", "Only highs", "Volume", "Dividends"], 0, "Line charts connect closes."),
      q("A swing trader usually reads...", ["1-minute charts", "Daily charts", "Yearly charts", "No charts"], 1, "Daily charts suit swing holding periods."),
    ],
    video: "how to read stock charts for beginners",
    tool: "candles",
  },
  {
    id: "technical-indicators", academy: A, level: "Intermediate", minutes: 5,
    title: "Technical indicators",
    summary: "Formulas based on price and volume that help describe trend, momentum and volatility.",
    body: [
      "Indicators fall into groups: trend (moving averages, ADX), momentum (RSI, MACD, stochastic), volatility (Bollinger Bands, ATR) and volume (OBV, VWAP).",
      "Indicators are derived from price, so they lag. Use one or two from different groups instead of stacking many that say the same thing.",
    ],
    example: "A trader uses the 50-day moving average for trend and RSI for momentum. They only take long trades when price is above the 50 DMA and RSI pulls back towards 40–50 and turns up.",
    points: [
      "Indicators lag price.",
      "Combine different types, not duplicates.",
      "ATR helps set stops based on volatility.",
    ],
    quiz: [
      q("Which is a volatility indicator?", ["RSI", "ATR", "EPS", "P/E"], 1, "Average True Range measures volatility."),
      q("Indicators based on past prices tend to...", ["Lead price", "Lag price", "Predict perfectly", "Ignore price"], 1, "They are calculated from past data."),
    ],
    video: "technical indicators explained for beginners",
  },
  {
    id: "moving-averages", academy: A, level: "Intermediate", minutes: 5,
    title: "Moving averages",
    summary: "The average price over a period, plotted as a line to smooth noise and show trend.",
    body: [
      "A simple moving average (SMA) averages closing prices over N periods. An exponential moving average (EMA) gives more weight to recent prices, so it reacts faster.",
      "Common uses: price above a rising 200-day average suggests a long-term uptrend; a 50-day crossing above the 200-day is called a golden cross, and below it a death cross. Moving averages also act as dynamic support and resistance.",
    ],
    example: "Closing prices over 5 days: 100, 102, 101, 105, 107. The 5-day SMA = 515 ÷ 5 = ₹103. If tomorrow closes at 110, the oldest value (100) drops out: (102+101+105+107+110) ÷ 5 = ₹105.",
    points: [
      "SMA = equal weights; EMA = more weight to recent prices.",
      "50 and 200-day averages are widely watched.",
      "Crossovers lag and give false signals in sideways markets.",
    ],
    quiz: [
      q("Prices 10, 12, 14. The 3-period SMA is...", ["10", "12", "14", "36"], 1, "(10+12+14) ÷ 3 = 12."),
      q("A golden cross is when...", ["50 DMA crosses above 200 DMA", "Price hits zero", "RSI = 50", "Volume doubles"], 0, "Short-term average crosses above long-term."),
    ],
    video: "moving average SMA EMA explained golden cross",
  },
  {
    id: "rsi", academy: A, level: "Intermediate", minutes: 5,
    title: "RSI (Relative Strength Index)",
    summary: "A momentum oscillator from 0 to 100 measuring the speed of recent price changes.",
    body: [
      "RSI, created by J. Welles Wilder, compares average gains with average losses, usually over 14 periods. Readings above 70 are traditionally called overbought and below 30 oversold.",
      "In strong trends RSI can stay overbought or oversold for a long time, so these levels are not automatic sell or buy signals. Divergence (price makes a new high but RSI does not) can warn that momentum is weakening.",
    ],
    example: "A stock makes a new high at ₹950, but RSI peaks at 62 versus 75 on the previous high. This bearish divergence suggests buying momentum is fading; a trader might tighten their stop.",
    points: [
      "Range 0–100, default 14 periods.",
      "70/30 are guides, not commands.",
      "Divergences are often more useful than the levels.",
    ],
    quiz: [
      q("RSI above 70 is traditionally called...", ["Oversold", "Overbought", "Neutral", "Bankrupt"], 1, "Above 70 = overbought."),
      q("Price new high, RSI lower high is...", ["Bullish divergence", "Bearish divergence", "Golden cross", "Breakout"], 1, "Momentum weakening at a new high."),
    ],
    video: "RSI indicator explained relative strength index",
  },
  {
    id: "macd", academy: A, level: "Intermediate", minutes: 5,
    title: "MACD",
    summary: "Moving Average Convergence Divergence: the gap between two EMAs, used to spot momentum shifts.",
    body: [
      "MACD line = 12-period EMA − 26-period EMA. The signal line is a 9-period EMA of the MACD line. The histogram shows the difference between the two.",
      "A MACD line crossing above the signal line is a bullish crossover; crossing below is bearish. Crossovers above or below the zero line show whether momentum is positive or negative overall.",
    ],
    example: "After a downtrend, MACD crosses above its signal line while still below zero, then the histogram grows. A trader sees early momentum improvement but waits for price to break resistance before buying.",
    points: [
      "Default settings: 12, 26, 9.",
      "Histogram shows momentum strength.",
      "Works better in trending markets than sideways ones.",
    ],
    quiz: [
      q("MACD line = ", ["12 EMA − 26 EMA", "50 SMA − 200 SMA", "RSI − 50", "High − Low"], 0, "Difference of two EMAs."),
      q("MACD crossing above its signal line is...", ["Bullish crossover", "Bearish crossover", "A dividend", "Neutral always"], 0, "Bullish momentum shift."),
    ],
    video: "MACD indicator explained for beginners",
  },
  {
    id: "stop-loss", academy: A, level: "Beginner", minutes: 5,
    title: "Stop-loss",
    summary: "An exit order that limits your loss if the trade goes against you.",
    body: [
      "A stop-loss closes your position when price reaches a level that proves your trade idea wrong. A stop-loss limit order sets a trigger and a limit price; a stop-loss market (SL-M) order executes at market once triggered.",
      "Place stops at logical levels (below support, below a swing low, or a multiple of ATR), not at a random percentage. Never move a stop further away to avoid taking a loss.",
    ],
    example: "Buy at ₹300 with support at ₹288. Place the stop at ₹285 (slightly below support). If price falls to ₹285, you exit with a ₹15 loss per share instead of hoping and possibly losing much more.",
    points: [
      "Decide the stop before entering.",
      "Logical levels beat arbitrary percentages.",
      "Gaps can fill a stop below its trigger price.",
    ],
    quiz: [
      q("Moving your stop further away to avoid a loss is...", ["Good practice", "A common and costly mistake", "Required by SEBI", "Risk-free"], 1, "It turns small losses into big ones."),
      q("A good stop is placed...", ["At a random level", "Where the trade idea is proven wrong", "At zero", "Never"], 1, "At the invalidation point."),
    ],
    video: "stop loss explained how to place stop loss",
  },
  {
    id: "risk-reward", academy: A, level: "Intermediate", minutes: 5,
    title: "Risk-to-reward ratio",
    summary: "How much you could gain compared with how much you risk on a trade.",
    body: [
      "Risk-reward = (target − entry) ÷ (entry − stop). A 1:3 ratio means risking ₹1 to potentially make ₹3.",
      "Combine it with win rate. With a 1:2 ratio you can be profitable winning only 40% of trades, before costs. Expectancy = (win rate × average win) − (loss rate × average loss).",
    ],
    example: "Entry ₹100, stop ₹95, target ₹115. Risk ₹5, reward ₹15 → 1:3. Ten such trades with 4 wins and 6 losses: 4 × 15 − 6 × 5 = ₹30 profit per share before costs.",
    points: [
      "Aim for setups of at least 1:2.",
      "Expectancy tells you if a strategy works over many trades.",
      "Use the risk-reward calculator below.",
    ],
    quiz: [
      q("Entry 200, stop 190, target 230. Risk-reward?", ["1:1", "1:2", "1:3", "3:1 risk"], 2, "Risk 10, reward 30."),
      q("With a 1:2 ratio, the break-even win rate is about...", ["10%", "33%", "50%", "90%"], 1, "Win 1 of 3: +2 −1 −1 = 0."),
    ],
    video: "risk reward ratio trading explained",
    tool: "riskreward",
  },
  {
    id: "trading-psychology", academy: A, level: "Advanced", minutes: 6,
    title: "Trading psychology",
    summary: "Discipline, emotional control and process are what separate consistent traders.",
    body: [
      "Common traps: revenge trading after a loss, overtrading out of boredom, abandoning the plan after a few losses, and getting overconfident after a winning streak.",
      "Build habits: a written trading plan, a daily loss limit, a trade journal recording reasons and emotions, and regular reviews. Judge yourself on following the process, not on any single trade's outcome.",
    ],
    example: "After two losses, a trader doubles size to “win it back” and takes a third, larger loss. A rule such as “stop for the day after a 2% account loss” would have prevented it.",
    points: [
      "Daily loss limit protects your capital and mind.",
      "Journal every trade.",
      "Process over outcome.",
    ],
    quiz: [
      q("Revenge trading means...", ["Following your plan", "Trading emotionally to recover losses", "Investing in index funds", "Taking a break"], 1, "Emotion-driven trading after a loss."),
      q("A trade journal helps you...", ["Hide losses", "Learn from patterns in your decisions", "Avoid taxes", "Get tips"], 1, "Review improves process."),
    ],
    video: "trading psychology discipline emotions",
  },
  {
    id: "options-futures", academy: A, level: "Advanced", minutes: 8,
    title: "Options and futures fundamentals",
    summary: "Derivatives whose value depends on an underlying asset; powerful, leveraged and risky.",
    body: [
      "A futures contract is an agreement to buy or sell an asset at a fixed price on a future date; you post margin, not the full value, so it is leveraged. An option gives the buyer the right (not obligation) to buy (call) or sell (put) at the strike price before expiry, for a premium.",
      "Option buyers can lose the whole premium; option sellers face potentially large losses. Prices are affected by time decay (theta) and volatility. SEBI has repeatedly warned that most individual F&O traders lose money; learn the concepts before trading them.",
    ],
    example: "Nifty is at 24,000. A call option with strike 24,200 costs ₹100 per unit. If Nifty expires at 24,500, the option is worth ₹300 (profit ₹200 per unit). If Nifty stays below 24,200, it expires worthless and the buyer loses ₹100 per unit.",
    points: [
      "Futures = obligation; options = right for the buyer.",
      "Leverage and time decay work against beginners.",
      "This academy teaches concepts only; FINOVA does not place real trades.",
    ],
    quiz: [
      q("A call option gives the buyer the right to...", ["Sell", "Buy", "Vote", "Receive dividends only"], 1, "Calls = right to buy; puts = right to sell."),
      q("Maximum loss for an option buyer is...", ["Unlimited", "The premium paid", "Zero", "The strike price"], 1, "Buyers can lose only the premium."),
    ],
    video: "options and futures basics explained beginners India",
  },
];
