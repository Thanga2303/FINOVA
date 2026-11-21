import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { estCharges, placeOrder, type OrderResult } from "../../lib/paper";
import { setState, uid, useStore, type AssetKind } from "../../lib/store";
import { Icon } from "../ui";
import { price } from "./bits";

type Props = { open: boolean; onClose: () => void; kind: AssetKind; symbol: string; name: string; ltp: number | null; category?: string; initialSide?: "BUY" | "SELL" };

export default function OrderTicket({ open, onClose, kind, symbol, name, ltp, category, initialSide = "BUY" }: Props) {
  const paper = useStore((s) => s.paper);
  const [side, setSide] = useState<"BUY" | "SELL">(initialSide);
  const [type, setType] = useState<"MARKET" | "LIMIT" | "LUMPSUM" | "SIP">(kind === "fund" ? "LUMPSUM" : "MARKET");
  const [qty, setQty] = useState(1);
  const [amount, setAmount] = useState(5000);
  const [limit, setLimit] = useState(ltp ? +ltp.toFixed(2) : 0);
  const [sipDay, setSipDay] = useState(5);
  const [step, setStep] = useState<"form" | "review" | "done">("form");
  const [result, setResult] = useState<OrderResult | null>(null);
  const holding = paper.holdings.find((h) => h.symbol === symbol && h.kind === kind);

  const fundUnits = kind === "fund" && ltp ? (side === "BUY" ? amount / ltp : qty) : 0;
  const execPx = type === "LIMIT" ? limit : ltp ?? 0;
  const q = kind === "fund" ? fundUnits : qty;
  const value = kind === "fund" ? (side === "BUY" ? amount : qty * (ltp ?? 0)) : q * execPx;
  const charges = estCharges(kind, side, value);
  const total = side === "BUY" ? value + charges : value - charges;

  const problem = useMemo(() => {
    if (!ltp) return "Price is not available yet.";
    if (kind === "stock" && (!Number.isInteger(qty) || qty < 1)) return "Enter a whole number of shares (1 or more).";
    if (type === "LIMIT" && !(limit > 0)) return "Enter a limit price.";
    if (kind === "fund" && side === "BUY" && amount < 100) return "Minimum amount here is ₹100 (actual scheme minimums vary).";
    if (side === "BUY" && type !== "SIP" && total > paper.cash) return `Not enough virtual balance (${price(paper.cash)} available).`;
    if (side === "SELL" && (!holding || holding.qty + 1e-9 < q)) return `You hold ${holding ? (kind === "fund" ? holding.qty.toFixed(3) + " units" : holding.qty + " shares") : "none"} in paper trading.`;
    return null;
  }, [ltp, kind, qty, type, limit, side, amount, total, paper.cash, holding, q]);

  const close = () => { onClose(); setTimeout(() => { setStep("form"); setResult(null); }, 300); };

  function confirm() {
    if (type === "SIP") {
      setState((s) => ({ wallet: { ...s.wallet, planned: [...s.wallet.planned, { id: uid(), name: `SIP · ${name}`, amount, dayOfMonth: sipDay, active: true }] } }));
      const first = placeOrder({ kind, symbol, name, side: "BUY", type: "SIP", qty: amount / (ltp ?? 1), price: ltp ?? 0, category });
      setResult({ ok: first.ok, message: first.ok ? `Paper SIP of ${price(amount, 0)} on day ${sipDay} added to your Wallet plan, and the first instalment was bought on paper at NAV ${price(ltp, 4)}.` : first.message });
    } else {
      setResult(placeOrder({ kind, symbol, name, side, type: type === "LUMPSUM" ? "LUMPSUM" : type, qty: q, price: ltp ?? 0, limitPrice: type === "LIMIT" ? limit : undefined, category }));
    }
    setStep("done");
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[66] bg-black/55 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div role="dialog" aria-modal="true" aria-label={`Paper order for ${name}`}
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-line bg-bg2 p-5 sm:p-6 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-amber font-semibold">PAPER TRADE · NO REAL MONEY</div>
                <h2 className="font-display text-lg font-semibold mt-1">{name}</h2>
                <div className="text-sm text-muted">{kind === "fund" ? "Latest NAV" : "Delayed price"}: <span className="text-text font-semibold">{price(ltp, kind === "fund" ? 4 : 2)}</span></div>
              </div>
              <button className="btn-ghost !p-2" onClick={close} aria-label="Close"><Icon name="close" className="w-4 h-4" /></button>
            </div>

            {step === "form" && (
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line p-1">
                  {(["BUY", "SELL"] as const).map((sd) => (
                    <button key={sd} onClick={() => { setSide(sd); if (kind === "fund") setType(sd === "SELL" ? "LUMPSUM" : type); }}
                      className={`rounded-xl py-2 font-semibold ${side === sd ? (sd === "BUY" ? "bg-emerald text-[#04121c]" : "bg-rose text-white") : "text-muted"}`}>
                      {kind === "fund" ? (sd === "BUY" ? "Invest" : "Redeem") : sd === "BUY" ? "Buy" : "Sell"}
                    </button>
                  ))}
                </div>

                <div>
                  <div className="text-xs text-muted mb-1.5">Order type</div>
                  <div className="flex flex-wrap gap-2">
                    {(kind === "fund" ? (side === "BUY" ? ["LUMPSUM", "SIP"] : ["LUMPSUM"]) : ["MARKET", "LIMIT"]).map((t) => (
                      <button key={t} onClick={() => setType(t as typeof type)} className={`chip !text-sm !px-3 !py-1.5 ${type === t ? "!text-text !border-cyan/60 !bg-card-strong" : ""}`}>
                        {t === "LUMPSUM" ? (side === "SELL" ? "Units" : "One-time") : t === "SIP" ? "Monthly SIP" : t === "MARKET" ? "Market" : "Limit"}
                      </button>
                    ))}
                  </div>
                </div>

                {kind === "stock" || side === "SELL" ? (
                  <label className="block text-sm"><span className="text-muted">{kind === "fund" ? "Units to redeem" : "Quantity (shares)"}</span>
                    <input type="number" min={kind === "fund" ? 0.001 : 1} step={kind === "fund" ? 0.001 : 1} className="field mt-1" value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))} />
                    {holding && <span className="text-xs text-muted">You hold {kind === "fund" ? holding.qty.toFixed(3) + " units" : holding.qty + " shares"} (paper)</span>}
                  </label>
                ) : (
                  <label className="block text-sm"><span className="text-muted">{type === "SIP" ? "Monthly amount (₹)" : "Amount (₹)"}</span>
                    <input type="number" min={100} step={100} className="field mt-1" value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} />
                    <span className="text-xs text-muted">≈ {fundUnits.toFixed(3)} units at the latest NAV</span>
                  </label>
                )}
                {type === "LIMIT" && (
                  <label className="block text-sm"><span className="text-muted">Limit price (₹)</span>
                    <input type="number" step={0.05} className="field mt-1" value={limit} onChange={(e) => setLimit(Number(e.target.value) || 0)} />
                  </label>
                )}
                {type === "SIP" && (
                  <label className="block text-sm"><span className="text-muted">SIP date (day of month)</span>
                    <input type="number" min={1} max={28} className="field mt-1" value={sipDay} onChange={(e) => setSipDay(Math.min(28, Math.max(1, Number(e.target.value) || 1)))} />
                  </label>
                )}

                <div className="rounded-2xl border border-line bg-card p-4 text-sm space-y-1.5">
                  <Row k="Estimated order value" v={price(value)} />
                  <Row k="Estimated charges (illustrative)" v={price(charges)} />
                  <Row k={side === "BUY" ? "Total debit (virtual)" : "Net credit (virtual)"} v={price(total)} strong />
                  <Row k="Virtual balance" v={price(paper.cash)} />
                </div>
                {problem && <p className="text-sm text-rose" role="alert">{problem}</p>}
                <button className="btn-primary w-full disabled:opacity-40" disabled={Boolean(problem)} onClick={() => setStep("review")}>Review order</button>
              </div>
            )}

            {step === "review" && (
              <div className="mt-5 space-y-4">
                <h3 className="font-semibold">Order summary</h3>
                <div className="rounded-2xl border border-line bg-card p-4 text-sm space-y-1.5">
                  <Row k="Action" v={kind === "fund" ? (side === "BUY" ? (type === "SIP" ? "Start SIP" : "Invest one-time") : "Redeem") : side} />
                  <Row k="Order type" v={type} />
                  <Row k={kind === "fund" ? "Units (approx.)" : "Quantity"} v={kind === "fund" ? q.toFixed(3) : String(q)} />
                  <Row k="Price" v={type === "LIMIT" ? `Limit ${price(limit)}` : price(ltp, kind === "fund" ? 4 : 2)} />
                  <Row k="Estimated total" v={price(total)} strong />
                </div>
                <p className="text-xs text-muted">This is a simulated order on FINOVA's paper-trading account using {kind === "fund" ? "the latest published NAV" : "delayed market prices"}. It is not sent to any broker, exchange or AMC, and no real money moves. Real investing requires an account with a SEBI-registered broker or distributor, with KYC.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-ghost" onClick={() => setStep("form")}>Edit</button>
                  <button className={`rounded-full py-3 font-semibold ${side === "BUY" ? "bg-emerald text-[#04121c]" : "bg-rose text-white"}`} onClick={confirm}>Confirm paper order</button>
                </div>
              </div>
            )}

            {step === "done" && result && (
              <div className="mt-6 text-center">
                <div className="relative mx-auto w-14 h-14">
                  {result.ok && [0, 0.25].map((d) => <span key={d} aria-hidden className="absolute inset-0 rounded-full border-2 border-emerald ring-pop" style={{ animationDelay: `${d}s` }} />)}
                  {result.ok && Array.from({ length: 10 }, (_, i) => (
                    <motion.span key={i} aria-hidden className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-emerald"
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{ x: Math.cos((i / 10) * Math.PI * 2) * 46, y: Math.sin((i / 10) * Math.PI * 2) * 46, opacity: 0, scale: 0.3 }}
                      transition={{ duration: 0.9, ease: "easeOut" }} />
                  ))}
                  <motion.div initial={{ scale: 0.4, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 14 }}
                    className={`relative w-14 h-14 rounded-full grid place-items-center ${result.ok ? "bg-emerald/15 text-emerald shadow-[0_0_30px_-4px_var(--emerald)]" : "bg-rose/15 text-rose"}`}>
                    <Icon name={result.ok ? "check" : "close"} className="w-7 h-7" />
                  </motion.div>
                </div>
                <h3 className="font-display text-xl font-semibold mt-3">{result.ok ? "Paper order placed" : "Order not placed"}</h3>
                <p className="text-sm text-muted mt-2">{result.message}</p>
                <div className="flex justify-center gap-2 mt-5">
                  <Link to="/investments" className="btn-primary" onClick={close}>View portfolio</Link>
                  <button className="btn-ghost" onClick={close}>Done</button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return <div className="flex justify-between gap-4"><span className="text-muted">{k}</span><span className={strong ? "font-semibold" : ""}>{v}</span></div>;
}
