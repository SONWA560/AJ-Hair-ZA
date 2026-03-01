import { writeFileSync } from 'fs';
import { renderMermaidSVG, THEMES } from '../node_modules/beautiful-mermaid/dist/index.js';

const diagram = `
flowchart TD
    %% ────────────── CLIENT ──────────────
    subgraph CLIENT["  CLIENT LAYER"]
        direction TB
        USR(["👤 User / Browser"])
        CART_CTX["🛒 Cart Context\\n+ localStorage"]
        IMG_UP["📷 Image Upload\\n(camera icon)"]
    end

    %% ────────────── AUTH ──────────────
    subgraph AUTH["  AUTHENTICATION — Clerk v6"]
        direction TB
        MW["🔒 Middleware\\nclerkMiddleware()\\nprotects /admin/*"]
        ORG_CHK{"orgId\\npresent?"}
        UNAUTH["🚫 /admin/unauthorized"]
    end

    %% ────────────── PAGES ──────────────
    subgraph PAGES["  NEXT.JS 15 PAGES — App Router / React Server Components"]
        direction LR
        HOME["/\\nHomepage\\n+ Promo Banner"]
        PDP["/product/[handle]\\nProduct Detail\\n+ View Counter"]
        SRCH["/search\\n/search/[collection]\\nAI Search Results"]
        CHK["/checkout\\n2-step: Shipping → Payment"]
        OK["/checkout/success\\nOrder Confirmation"]
        ACC["/account\\nProfile + Order History"]
        WISH["/account/wishlist\\nWishlist Page"]
        SIGN["/sign-in  /sign-up\\nClerk Hosted UI"]
        ADM["/admin\\nDashboard"]
        ADM_P["/admin/products\\nProduct CRUD"]
        ADM_O["/admin/orders\\nOrder Management"]
        ADM_R["/admin/reports\\nFinancial · Product\\nCustomer Reports"]
    end

    %% ────────────── BIZ LOGIC ──────────────
    subgraph LOGIC["  SERVER ACTIONS + API ROUTES"]
        direction TB
        SA_ORD["placeOrder()\\nServer Action\\nlib/actions.ts"]
        SA_COMP["completeOrder()\\nServer Action"]
        SA_FILT["filterProducts()\\nServer Action"]
        PA["createProduct()\\nupdateProduct()\\ndeleteProduct()\\nlib/product-actions.ts"]
        WA["toggleWishlist()\\ngetWishlistProducts()\\nlib/wishlist-actions.ts"]
        API_AI["/api/ai-search\\nGPT-3.5 intent parser\\n→ Firestore filters"]
        API_IMG["/api/image-search\\nGPT-4o Vision\\n→ search phrase"]
        API_PROD["/api/products\\ntrending · collection\\n· single · all"]
    end

    %% ────────────── EXTERNAL SERVICES ──────────────
    subgraph EXT["  EXTERNAL SERVICES"]
        direction TB
        GPT35["🤖 OpenAI GPT-3.5-Turbo\\nNatural language → filters\\n{hair_type, length, color}"]
        GPT4V["🤖 OpenAI GPT-4o-mini\\nVision — image → description"]
        RESEND["📧 Resend Email\\nOrder Confirmation\\nHTML template"]
        CLERK_SVC["🔑 Clerk SaaS\\nJWT · Session · Org"]
    end

    %% ────────────── FIREBASE ──────────────
    subgraph DB["  FIREBASE FIRESTORE — Admin SDK"]
        direction LR
        PRODS[("📦 products\\ntitle · price · cost\\nspecifications · inventory\\nmetadata.views\\nseo.handle")]
        ORDERS[("🧾 orders\\nitems · total · status\\nshippingAddress\\npaymentMethod")]
        CARTS[("🛒 carts\\nper-user document\\nitems array")]
        WISHLISTS[("❤️ wishlists\\nper-user document\\nitems: productId[]")]
        LOGS[("📊 searchLogs\\nquery · filters\\nresultsCount · userId")]
    end

    %% ────────────── FLOWS ──────────────

    %% Auth gate
    USR -->|"every request"| MW
    MW --> ORG_CHK
    ORG_CHK -->|"no org"| UNAUTH
    ORG_CHK -->|"org member"| ADM
    ORG_CHK -->|"org member"| ADM_P
    ORG_CHK -->|"org member"| ADM_O
    ORG_CHK -->|"org member"| ADM_R
    MW -->|"public routes"| HOME
    MW -->|"public routes"| PDP
    MW -->|"public routes"| SRCH
    MW -->|"authenticated"| CHK
    MW -->|"authenticated"| ACC
    MW -->|"authenticated"| WISH
    MW --> SIGN

    %% Cart
    USR <-->|"add / remove / qty"| CART_CTX
    CART_CTX -->|"proceed to checkout"| CHK

    %% Homepage + Product browsing
    HOME -->|"getTrendingProducts()"| PRODS
    PDP -->|"getProduct(handle)"| PRODS
    PDP -->|"FieldValue.increment(1)"| PRODS

    %% Search flows
    SRCH -->|"query"| API_AI
    API_AI -->|"prompt"| GPT35
    GPT35 -->|"JSON filters"| API_AI
    API_AI -->|"getProducts(filters)"| PRODS
    IMG_UP -->|"base64 image"| API_IMG
    API_IMG -->|"image_url"| GPT4V
    GPT4V -->|"wig description"| API_AI
    API_AI -->|"aiInterpretation"| SRCH
    API_AI -->|"logSearchQuery()"| LOGS

    %% Checkout flow
    CHK -->|"placeOrder()"| SA_ORD
    SA_ORD -->|"add order doc"| ORDERS
    SA_ORD -->|"decrement inventory"| PRODS
    SA_ORD -->|"sendOrderConfirmation()"| RESEND
    SA_ORD -->|"completeOrder()"| SA_COMP
    SA_COMP -->|"status: completed"| ORDERS
    SA_COMP -->|"redirect"| OK

    %% Account + Wishlist
    ACC -->|"getOrdersByUserId()"| ORDERS
    WISH -->|"getWishlistProducts()"| WISHLISTS
    WISH -->|"product details"| PRODS
    WA -->|"toggle item"| WISHLISTS

    %% Admin flows
    ADM_P -->|"getAdminProducts()"| PRODS
    ADM_P --> PA
    PA -->|"create / update / delete"| PRODS
    ADM_O -->|"getAdminOrders()"| ORDERS
    ADM_R -->|"getReportData() — all orders"| ORDERS
    ADM_R -->|"getReportData() — all products"| PRODS

    %% Clerk
    MW <-->|"JWT verify"| CLERK_SVC

    %% Styles
    classDef page fill:#1e293b,stroke:#38bdf8,color:#e2e8f0
    classDef action fill:#172554,stroke:#60a5fa,color:#bfdbfe
    classDef external fill:#1a1a2e,stroke:#a78bfa,color:#e9d5ff
    classDef db fill:#052e16,stroke:#4ade80,color:#bbf7d0
    classDef auth fill:#2d1b00,stroke:#f59e0b,color:#fef3c7
    classDef client fill:#1c1917,stroke:#f97316,color:#ffedd5

    class HOME,PDP,SRCH,CHK,OK,ACC,WISH,SIGN,ADM,ADM_P,ADM_O,ADM_R page
    class SA_ORD,SA_COMP,SA_FILT,PA,WA,API_AI,API_IMG,API_PROD action
    class GPT35,GPT4V,RESEND,CLERK_SVC external
    class PRODS,ORDERS,CARTS,WISHLISTS,LOGS db
    class MW,ORG_CHK,UNAUTH auth
    class USR,CART_CTX,IMG_UP client
`;

const theme = THEMES['github-dark'];

console.log('Rendering architecture diagram with beautiful-mermaid...');
const svg = renderMermaidSVG(diagram, theme);

writeFileSync('./docs/architecture.svg', svg, 'utf8');
console.log('✓ Saved to docs/architecture.svg');

// Also write an HTML viewer for easy browsing
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AJ Hair ZA — System Architecture</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0d1117;
      color: #e6edf3;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-height: 100vh;
      padding: 40px 24px;
    }
    header {
      text-align: center;
      margin-bottom: 40px;
    }
    header h1 {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #f0f6fc;
    }
    header p {
      margin-top: 8px;
      font-size: 14px;
      color: #8b949e;
    }
    .diagram-wrapper {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 32px;
      overflow: auto;
      max-width: 100%;
    }
    .diagram-wrapper svg {
      display: block;
      margin: 0 auto;
      max-width: 100%;
    }
    footer {
      text-align: center;
      margin-top: 32px;
      font-size: 12px;
      color: #484f58;
    }
  </style>
</head>
<body>
  <header>
    <h1>AJ Hair ZA — System Architecture</h1>
    <p>Next.js 15 · Firebase · Clerk · OpenAI · Resend</p>
  </header>
  <div class="diagram-wrapper">
    ${svg}
  </div>
  <footer>Generated with beautiful-mermaid · AJ Hair ZA E-Commerce Platform</footer>
</body>
</html>`;

writeFileSync('./docs/architecture.html', html, 'utf8');
console.log('✓ Saved to docs/architecture.html (open in browser for best view)');
