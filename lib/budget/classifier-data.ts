// Item bank shared by both halves of the Receipts/Expenditure Classifier:
// the Learn panel (BalanceSheetExplainer) and the Test-yourself drag game
// (ReceiptsClassifier). Every item is placed on two independent axes at
// once — that's the actual source of the "where does disinvestment go?"
// confusion: students only ever learn the Revenue/Capital axis, never
// notice Receipt/Expenditure is a second, separate axis layered on top.
//
// bucket: which row (revenue vs capital)
// kind:   which column — is money coming in or going out?
// effect: the mechanism that *decides* bucket, framed as a balance-sheet
//         move. "none" = the transaction never touches a recorded asset or
//         liability, it only flows through the income statement — that's
//         what makes it Revenue. Any of the other four means something on
//         the balance sheet moved — that's what makes it Capital. This is
//         the single field the Learn panel's animation is driven by.
// why:    one-line reasoning, always phrased against the same asset/
//         liability test so it composes across items instead of being 14
//         separate facts to memorize.

export type Bucket = "revenue" | "capital";
export type Kind = "receipt" | "expenditure";
export type Effect = "asset-up" | "asset-down" | "liability-up" | "liability-down" | "none";

export interface ClassifierItem {
  id: string;
  label: string;
  icon: string;
  kind: Kind;
  bucket: Bucket;
  effect: Effect;
  why: string;
}

export const CLASSIFIER_ITEMS: ClassifierItem[] = [
  {
    id: "gst",
    label: "GST collections",
    icon: "🧾",
    kind: "receipt",
    bucket: "revenue",
    effect: "none",
    why: "Ordinary tax income — no asset is sold, no liability is created. Balance sheet untouched.",
  },
  {
    id: "corp-tax",
    label: "Corporate tax",
    icon: "🏢",
    kind: "receipt",
    bucket: "revenue",
    effect: "none",
    why: "Tax income again — same test, same answer.",
  },
  {
    id: "income-tax",
    label: "Income tax",
    icon: "👤",
    kind: "receipt",
    bucket: "revenue",
    effect: "none",
    why: "Tax income — recurring, creates nothing, reduces nothing.",
  },
  {
    id: "rbi-dividend",
    label: "RBI / PSU dividend",
    icon: "🏦",
    kind: "receipt",
    bucket: "revenue",
    effect: "none",
    why: "Non-tax revenue — a payout received, not an asset sold or a debt taken on.",
  },
  {
    id: "disinvestment",
    label: "Disinvestment proceeds",
    icon: "📉",
    kind: "receipt",
    bucket: "capital",
    effect: "asset-down",
    why: "The government is selling an asset it owns (PSU shares) — the asset side goes down, so it's capital, however \"revenue-like\" the cash feels.",
  },
  {
    id: "market-borrowing",
    label: "Market borrowings (G-secs)",
    icon: "📄",
    kind: "receipt",
    bucket: "capital",
    effect: "liability-up",
    why: "Creates a liability — it has to be repaid with interest.",
  },
  {
    id: "loan-recovery",
    label: "Recovery of loans (states repaying Centre)",
    icon: "↩️",
    kind: "receipt",
    bucket: "capital",
    effect: "asset-down",
    why: "An asset the Centre held (a loan receivable) is reduced when it's repaid.",
  },
  {
    id: "small-savings",
    label: "Small savings (via NSSF)",
    icon: "🪙",
    kind: "receipt",
    bucket: "capital",
    effect: "liability-up",
    why: "Money raised from depositors that must eventually be paid back — a liability.",
  },
  {
    id: "salaries",
    label: "Salaries & pensions",
    icon: "💼",
    kind: "expenditure",
    bucket: "revenue",
    effect: "none",
    why: "Recurring running cost — no asset is created, no liability retired. Balance sheet untouched.",
  },
  {
    id: "interest-payments",
    label: "Interest payments",
    icon: "💸",
    kind: "expenditure",
    bucket: "revenue",
    effect: "none",
    why: "The cost of servicing past borrowing, not the borrowing itself — nothing on the balance sheet moves, only cash goes out as an expense.",
  },
  {
    id: "subsidies",
    label: "Food & fertilizer subsidies",
    icon: "🌾",
    kind: "expenditure",
    bucket: "revenue",
    effect: "none",
    why: "A recurring transfer payment — no asset comes into existence.",
  },
  {
    id: "highway-capex",
    label: "Building a new highway",
    icon: "🛣️",
    kind: "expenditure",
    bucket: "capital",
    effect: "asset-up",
    why: "Creates a physical asset the government owns — that's the capital test on the spending side.",
  },
  {
    id: "loans-to-states",
    label: "Loans given to states/UTs",
    icon: "🤝",
    kind: "expenditure",
    bucket: "capital",
    effect: "asset-up",
    why: "Creates a financial asset (a loan receivable) even though cash is going out.",
  },
  {
    id: "loan-repayment",
    label: "Repaying principal on past debt",
    icon: "🧮",
    kind: "expenditure",
    bucket: "capital",
    effect: "liability-down",
    why: "Reduces a liability — same test as the receipts side, mirrored.",
  },
];
