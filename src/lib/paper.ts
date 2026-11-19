import { getState, setState, uid, type AssetKind, type Holding, type Order } from "./store";

/**
 * Paper trading: hypothetical orders against real delayed prices / latest NAVs.
 * No real money moves and nothing is sent to any broker or exchange.
 */

// Illustrative charges only (actual brokerage, STT, exchange and stamp charges vary by broker and segment).
export function estCharges(kind: AssetKind, side: "BUY" | "SELL", amount: number) {
  if (kind === "fund") return side === "BUY" ? amount * 0.00005 : 0; // stamp duty on purchase
  return amount * (side === "BUY" ? 0.0012 : 0.0012); // ~STT 0.1% + exchange/SEBI/stamp/GST, delivery
}

type OrderInput = {
  kind: AssetKind; symbol: string; name: string; side: "BUY" | "SELL"; type: Order["type"];
  qty: number; price: number; limitPrice?: number; category?: string;
};

export type OrderResult = { ok: boolean; message: string; order?: Order };

function applyFill(o: Order, category?: string): OrderResult {
  const s = getState();
  const p = s.paper;
  const amount = o.qty * o.price;
  const charges = estCharges(o.kind, o.side, amount);
  const holdings = [...p.holdings];
  const idx = holdings.findIndex((h) => h.symbol === o.symbol && h.kind === o.kind);
  let pnl: number | undefined;
  let cash = p.cash;
  if (o.side === "BUY") {
    if (amount + charges > cash + 1e-6) return { ok: false, message: `Not enough virtual balance. Needed ₹${(amount + charges).toFixed(2)}, available ₹${cash.toFixed(2)}.` };
    cash -= amount + charges;
    if (idx >= 0) {
      const h = holdings[idx];
      holdings[idx] = { ...h, qty: h.qty + o.qty, avg: (h.avg * h.qty + amount) / (h.qty + o.qty) };
    } else {
      holdings.push({ id: uid(), kind: o.kind, symbol: o.symbol, name: o.name, qty: o.qty, avg: o.price, category, addedAt: Date.now() } satisfies Holding);
    }
  } else {
    const h = holdings[idx];
    if (!h || h.qty + 1e-9 < o.qty) return { ok: false, message: `You hold ${h?.qty ?? 0} ${o.kind === "fund" ? "units" : "shares"}. Short selling isn't available in paper trading.` };
    pnl = (o.price - h.avg) * o.qty - charges;
    cash += amount - charges;
    const left = h.qty - o.qty;
    if (left <= 1e-6) holdings.splice(idx, 1);
    else holdings[idx] = { ...h, qty: left };
  }
  const done: Order = { ...o, amount, charges, status: "EXECUTED", executedAt: Date.now(), pnl };
  setState((st) => ({ paper: { cash, holdings, orders: [done, ...st.paper.orders.filter((x) => x.id !== o.id)].slice(0, 500) } }));
  return { ok: true, message: `${o.side === "BUY" ? "Bought" : "Sold"} ${fmtQty(o)} of ${o.name} at ₹${o.price.toFixed(2)} (paper trade).`, order: done };
}

const fmtQty = (o: Pick<Order, "qty" | "kind">) => (o.kind === "fund" ? `${o.qty.toFixed(3)} units` : `${o.qty} shares`);

export function placeOrder(input: OrderInput): OrderResult {
  if (!(input.qty > 0)) return { ok: false, message: "Quantity must be greater than zero." };
  if (input.kind === "stock" && !Number.isInteger(input.qty)) return { ok: false, message: "Shares must be whole numbers." };
  if (!(input.price > 0)) return { ok: false, message: "Price unavailable right now. Try again when data loads." };
  const base: Order = {
    id: uid(), kind: input.kind, symbol: input.symbol, name: input.name, side: input.side, type: input.type, qty: input.qty,
    price: input.price, limitPrice: input.limitPrice, amount: input.qty * input.price, charges: 0, status: "OPEN", placedAt: Date.now(),
  };
  if (input.type === "LIMIT" && input.limitPrice) {
    const marketable = input.side === "BUY" ? input.price <= input.limitPrice : input.price >= input.limitPrice;
    if (!marketable) {
      setState((st) => ({ paper: { ...st.paper, orders: [{ ...base, price: input.limitPrice!, amount: input.qty * input.limitPrice! }, ...st.paper.orders] } }));
      return { ok: true, message: `Limit order placed. It will fill (on paper) if the delayed price reaches ₹${input.limitPrice.toFixed(2)}.`, order: base };
    }
  }
  return applyFill(base, input.category);
}

/** Fill open limit orders whose condition is met by the latest delayed prices. */
export function checkLimitOrders(prices: Record<string, number>) {
  const open = getState().paper.orders.filter((o) => o.status === "OPEN" && o.type === "LIMIT");
  const fills: OrderResult[] = [];
  for (const o of open) {
    const px = prices[o.symbol];
    if (!px || !o.limitPrice) continue;
    if ((o.side === "BUY" && px <= o.limitPrice) || (o.side === "SELL" && px >= o.limitPrice)) fills.push(applyFill({ ...o, price: px }));
  }
  return fills;
}

export function cancelOrder(id: string) {
  setState((st) => ({ paper: { ...st.paper, orders: st.paper.orders.map((o) => (o.id === id && o.status === "OPEN" ? { ...o, status: "CANCELLED" } : o)) } }));
}

export function resetPaper(cash: number) {
  setState(() => ({ paper: { cash, holdings: [], orders: [] } }));
}
