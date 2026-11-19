// FINOVA front-end prototype. No live AI or market-data connection is configured yet.
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const money = (n) => new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
let balance = 100000, holdings = {}, trades = [], mode = "beginner";
let expenses = [];
try { expenses = JSON.parse(localStorage.getItem("finova_expenses") || "[]"); if (!Array.isArray(expenses)) expenses=[]; } catch { expenses=[]; }
const prices = {ALPHA:250, NOVA:480, ORBIT:125};

function toast(message){
 const el=$("#toast"); if(!el) return;
 el.textContent=message; el.classList.add("show");
 clearTimeout(window.finovaToastTimer);
 window.finovaToastTimer=setTimeout(()=>el.classList.remove("show"),3000);
}
function navigate(view){
 const target=$(`#view-${view}`);
 if(!target){toast("That section is not available yet.");return;}
 $$(".view").forEach(v=>v.classList.toggle("active",v===target));
 $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
 const labels={overview:"Overview",ai:"Finova AI",learn:"Learn",simulator:"Trading simulator",finance:"My finances"};
 if($("#crumb")) $("#crumb").textContent=labels[view]||"Overview";
 window.scrollTo({top:0,behavior:"smooth"});
}
document.addEventListener("click",e=>{
 const nav=e.target.closest("[data-view]");
 const goto=e.target.closest("[data-goto]");
 if(nav) navigate(nav.dataset.view);
 else if(goto) navigate(goto.dataset.goto);
});

function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderExpenses(){
 const total=expenses.reduce((s,e)=>s+(Number(e.amount)||0),0);
 if($("#expense-total")) $("#expense-total").textContent=money(total);
 if($("#expense-count")) $("#expense-count").textContent=`${expenses.length} ITEMS`;
 const box=$("#expense-items"); if(!box)return;
 box.innerHTML=expenses.length?expenses.slice().reverse().map(e=>`<div class="expense-row"><div>${escapeHtml(e.name)}<small>${escapeHtml(e.category)} · ${escapeHtml(e.date)}</small></div><strong>${money(e.amount)}</strong></div>`).join(""):'<div class="empty-state">No expenses yet. Add your first expense.</div>';
 try{localStorage.setItem("finova_expenses",JSON.stringify(expenses))}catch{toast("Browser storage is unavailable; this expense may not persist.")}
}
$("#expense-form")?.addEventListener("submit",e=>{
 e.preventDefault();const name=$("#expense-name").value.trim(),amount=Number($("#expense-amount").value);
 if(!name||!Number.isFinite(amount)||amount<=0)return toast("Enter a valid description and amount.");
 expenses.push({name,amount,category:$("#expense-category").value,date:new Date().toLocaleDateString("en-IN")});
 e.target.reset();renderExpenses();toast("Expense saved on this device.");
});
renderExpenses();

const lessons={
 beginner:[
 ["01","Money foundations","Understand income, expenses, needs, wants and the value of an emergency fund.","A budget is a plan for how you use your money.","Start by writing down all income received and expenses paid over 30 days. Separate essential costs from optional spending. An emergency fund is money kept accessible for unexpected costs. The right amount depends on your situation; build it gradually."],
 ["02","How the stock market works","Learn what a share represents and why companies issue shares.","A stock is a small ownership share in a company.","When a company lists shares, investors can buy and sell them on an exchange. A share price changes as buyers and sellers react to company performance, expectations and wider market conditions. Prices can fall as well as rise."],
 ["03","NSE, BSE and indices","Explore Indian exchanges and what market indices measure.","An index tracks a selected group of securities.","NSE and BSE are Indian stock exchanges. An index such as Nifty 50 or Sensex tracks a selected basket of companies using a defined methodology. An index is a measure of market performance, not a guaranteed investment return."],
 ["04","Risk and diversification","Learn why spreading exposure can reduce concentration risk.","Diversification cannot remove all investment risk.","Putting all your money into one company exposes you to company-specific risk. Diversification spreads exposure across investments. It can reduce concentration risk, but broad market declines can still cause losses."],
 ["05","Mutual funds and SIPs","Understand pooled investments, NAV and systematic investing.","A SIP is a way to invest a fixed amount regularly.","A mutual fund pools money from many investors and invests according to its stated objective. NAV is the per-unit value of the fund. A SIP is a schedule for investing regularly; it does not guarantee profit or protect against market losses."],
 ["06","Trading vs investing","Compare time horizons, approaches, costs and risks.","Neither approach guarantees a profit.","Investing generally focuses on longer-term ownership and goals. Trading usually involves more frequent buying and selling. Trading can involve higher costs, emotional pressure and rapid losses. Choose based on knowledge, goals and risk capacity."]
 ],
 advanced:[
 ["01","Reading financial statements","Explore revenue, profit, cash flow and balance-sheet basics.","Financial statements provide information, not certainty.","Study the income statement for revenue and expenses, the balance sheet for assets and liabilities, and the cash-flow statement for cash generated and used. Compare multiple periods and read notes; one metric alone rarely tells the whole story."],
 ["02","Technical indicators","Learn the purpose and limitations of RSI, MACD and moving averages.","Indicators are derived from past price or volume data.","Moving averages smooth price data, RSI measures recent momentum, and MACD compares moving averages. They are tools for analysing historical data, not prediction machines. Signals can be late or misleading in sideways or volatile markets."],
 ["03","Support and resistance","Study areas where buying or selling interest has appeared.","These levels are subjective and can fail.","Support and resistance are price areas where a market has previously struggled to move lower or higher. They are zones, not guaranteed barriers. A break can be genuine or a false move; risk planning matters."],
 ["04","Position sizing","Understand how risk per trade relates to position size.","A risk plan cannot prevent every loss.","Position sizing links the amount traded to the amount you are prepared to lose if your idea is wrong. Fees, slippage and gaps can make actual losses larger than planned. Practise calculations before risking real capital."],
 ["05","Backtesting basics","Learn how to test a rules-based strategy on historical data.","Past performance does not predict future results.","Backtesting applies clear entry and exit rules to historical data. Avoid look-ahead bias and overfitting; include realistic costs and test on data not used to design the strategy. A good backtest does not guarantee future results."],
 ["06","Portfolio risk","Explore correlation, concentration and drawdowns.","Risk depends on the whole portfolio, not one holding.","Portfolio risk includes market risk, concentration, liquidity and how holdings move together. Drawdown measures a decline from a prior peak. Review exposures and goals periodically rather than judging a portfolio from one day's move."]
 ]};
function openLesson(item){
 const [n,title,desc,tip,body]=item;
 let modal=$("#lesson-modal");
 if(!modal){modal=document.createElement("div");modal.id="lesson-modal";modal.className="lesson-modal";modal.innerHTML='<div class="lesson-modal-card" role="dialog" aria-modal="true" aria-labelledby="lesson-modal-title"><button class="modal-close" aria-label="Close">×</button><div class="eyebrow" id="lesson-modal-number"></div><h2 id="lesson-modal-title"></h2><p id="lesson-modal-body"></p><div class="lesson-takeaway"></div><button class="primary-btn modal-done">Got it</button></div>';document.body.appendChild(modal);
  modal.addEventListener("click",e=>{if(e.target===modal||e.target.closest(".modal-close,.modal-done"))modal.classList.remove("open")});
 }
 $("#lesson-modal-number").textContent=`LESSON ${n}`;
 $("#lesson-modal-title").textContent=title;
 $("#lesson-modal-body").textContent=body;
 modal.querySelector(".lesson-takeaway").textContent=`KEY TAKEAWAY: ${tip}`;
 modal.classList.add("open");
}
function renderLessons(){
 const grid=$("#lesson-grid");if(!grid)return;
 grid.innerHTML=lessons[mode].map((item,i)=>`<article class="lesson"><div class="lesson-no">LESSON ${item[0]}</div><h3>${escapeHtml(item[1])}</h3><p>${escapeHtml(item[2])}</p><button type="button" data-lesson="${i}">Open lesson ↗</button></article>`).join("");
 grid.querySelectorAll("[data-lesson]").forEach(b=>b.addEventListener("click",()=>openLesson(lessons[mode][Number(b.dataset.lesson)])));
}
$$(".mode").forEach(b=>b.addEventListener("click",()=>{mode=b.dataset.mode;$$(".mode").forEach(x=>x.classList.toggle("active",x===b));renderLessons()}));
renderLessons();

window.addchat=function(text, who = "ai") {
    const chatBody = document.getElementById("chat-body");

    if (!chatBody) {
        console.error("FINOVA: chat-body not found");
        return;
    }

    const message = document.createElement("div");
    message.className = who === "user"
        ? "bubble user-bubble"
        : "bubble ai-bubble";

    message.textContent = text;

    chatBody.appendChild(message);
    chatBody.scrollTop = chatBody.scrollHeight;
}
async function askAI(q) {
    const message = String(q || "").trim();

    if (!message) return;

    addchat(message, "user");

    try {
        addchat("FINOVA AI is thinking...", "ai");

        const response = await fetch(
            "http://localhost:3000/api/chat",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: message
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "AI request failed");
        }

        addchat(data.reply, "ai");

    } catch (error) {
        console.error("FINOVA AI Error:", error);

        addchat(
            "Sorry! I couldn't connect to FINOVA AI. Please check whether the backend is running.",
            "ai"
        );
    }
}
$("#chat-form")?.addEventListener("submit",e=>{e.preventDefault();const q=$("#chat-input").value.trim();if(!q)return;$("#chat-input").value="";askAI(q)});
$$(".prompt-chip").forEach(b=>b.addEventListener("click",()=>askAI(b.textContent)));

$("#asset")?.addEventListener("change",()=>$("#sample-price").innerHTML=`${money(prices[$("#asset").value])} <small>Sample price</small>`);
function renderTrades(){const el=$("#trade-history");if(!el)return;el.innerHTML=trades.length?trades.slice().reverse().map(t=>`<div class="trade-row"><div>${t.side} ${t.asset}<small>${t.qty} units · ${t.time}</small></div><strong>${money(t.total)}</strong></div>`).join(""):'<div class="empty-state">No practice trades yet. Make a virtual trade to see it here.</div>'}
function updateBalance(){if($("#sim-balance"))$("#sim-balance").textContent=money(balance);if($("#virtual-balance"))$("#virtual-balance").textContent=money(balance)}
function trade(side){const asset=$("#asset").value,qty=Math.floor(Number($("#quantity").value)),price=prices[asset],total=qty*price;if(!Number.isInteger(qty)||qty<1)return toast("Enter a quantity of at least 1.");if(side==="BUY"){if(total>balance)return toast("Not enough virtual cash.");balance-=total;holdings[asset]=(holdings[asset]||0)+qty}else{if((holdings[asset]||0)<qty)return toast("You don't own enough virtual units to sell.");holdings[asset]-=qty;balance+=total}trades.push({side,asset,qty,total,time:new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})});updateBalance();renderTrades();toast(`${side} practice order completed.`)}
$("#buy-btn")?.addEventListener("click",()=>trade("BUY"));
$("#sell-btn")?.addEventListener("click",()=>trade("SELL"));
$("#reset-sim")?.addEventListener("click",()=>{balance=100000;holdings={};trades=[];updateBalance();renderTrades();toast("Simulator reset to ₹1,00,000.")});
updateBalance();renderTrades();
// FINOVA AI CHAT CONNECTION

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

if (chatForm && chatInput) {
    chatForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const message = chatInput.value.trim();

        if (!message) return;

        chatInput.value = "";

        await askAI(message);
    });
}