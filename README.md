# FINOVA — Intelligence Beyond Money

A responsive, front-end fintech learning prototype built with plain HTML, CSS and JavaScript.

## Run it
1. Extract the ZIP file.
2. Open the `finova` folder in VS Code.
3. Open `index.html` in a browser, or use the VS Code extension **Live Server** and click **Go Live**.
4. Explore the sidebar: Overview, Finova AI, Learn, Trading simulator and My finances.

No build tools or installation are required.

## What works in this prototype
- Responsive dashboard and navigation.
- Beginner and advanced educational lesson cards with lesson detail popups.
- Offline finance-topic helper with broader built-in explanations (not connected to a live AI model).
- Virtual trading simulator with fictional sample assets and reset button.
- Expense tracker saved in the current browser using localStorage.

## Important limitations
- No Firebase project is connected yet.
- No real AI API is connected.
- No live market data is used. Simulator prices are fictional.
- Expense data is stored only in this browser/device and is not synced.
- No user accounts, cloud backup, subscriptions or payments are implemented.
- This is an educational prototype, not financial advice or a brokerage app.

## Recommended next build steps
1. Connect Firebase Authentication and Firestore with security rules.
2. Add a server-side AI endpoint; never put a private AI API key in browser JavaScript.
3. Integrate a properly licensed market-data provider if live prices are needed.
4. Add privacy policy, terms, data deletion and security review.
5. Review applicable Indian financial-services and app-store requirements before launching paid or personalised investment features.
