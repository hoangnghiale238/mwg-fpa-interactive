"use client";

import { useEffect, useMemo, useState } from "react";

type ScenarioName = "Bear" | "Base" | "Bull";
type ViewName = "plan" | "yoy" | "forecast";
type PreviewName = "dashboard" | "variance" | "forecast" | "practice";
type FormulaName = "SUMIFS" | "XLOOKUP" | "F/U logic" | "Rolling forecast" | "Tolerance check";
type ModuleName = "performance" | "forecast" | "variance" | "working-capital" | "model" | "evidence";

const scenarioPresets: Record<ScenarioName, number> = {
  Bear: 0.0370671789,
  Base: 0.0870671789,
  Bull: 0.1370671789,
};

const actual2026 = [16102, 16102, 14304, 15988, 16663, 16146];
const monthly2025 = [12262, 12262, 11567, 12544, 12594, 12426, 12852, 12994, 13635, 14853, 14013, 13864];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fy2026Plan = 185000;
const patPlan = 9200;
const revenue6M2026 = 95305;
const h2Revenue2025 = 82511;

const moduleNavigation: Array<{ key: ModuleName; number: string; label: string }> = [
  { key: "performance", number: "01", label: "Performance" },
  { key: "forecast", number: "02", label: "Forecast" },
  { key: "variance", number: "03", label: "Variance" },
  { key: "working-capital", number: "04", label: "Working capital" },
  { key: "model", number: "05", label: "Model" },
  { key: "evidence", number: "06", label: "Evidence" },
];

const businessUnits = [
  {
    key: "TGDĐ",
    actual: 37255.6,
    budget: 33000,
    color: "#153f8f",
    driver: "Store productivity and premium-category mix supported the beat.",
    action: "Protect conversion, inventory turns and promotion discipline.",
  },
  {
    key: "ĐMX",
    actual: 68304.0,
    budget: 63000,
    color: "#0d7b70",
    driver: "Scale and category demand delivered the largest absolute upside.",
    action: "Prioritize high-return categories and validate supplier funding.",
  },
  {
    key: "BHX",
    actual: 46782.1,
    budget: 46500,
    color: "#dc8b2b",
    driver: "Revenue landed close to plan while the chain continued to scale.",
    action: "Track store cohorts, basket size and shrink before accelerating.",
  },
  {
    key: "Other",
    actual: 3586.4,
    budget: 7500,
    color: "#b64b5f",
    driver: "New ventures under-delivered against an aggressive planning base.",
    action: "Reset targets and stage-gate expansion against unit economics.",
  },
];

const varianceDrivers = [
  {
    label: "Revenue",
    variance: 5928.1,
    display: "+5,928",
    status: "F",
    note: "Top-line beat led by TGDĐ, ĐMX and a near-plan BHX result.",
  },
  {
    label: "Gross margin",
    variance: -2500,
    display: "(0.5) ppt",
    status: "U",
    note: "Mix and promotional intensity kept margin below plan.",
  },
  {
    label: "Selling expense",
    variance: 1969.1,
    display: "+1,969",
    status: "F",
    note: "Selling-expense productivity was the largest operating lever.",
  },
  {
    label: "G&A",
    variance: -546.1,
    display: "(546)",
    status: "U",
    note: "Overhead grew ahead of plan and diluted part of the operating beat.",
  },
  {
    label: "Operating profit",
    variance: 1822.4,
    display: "+1,822",
    status: "F",
    note: "Revenue growth and selling-cost leverage outweighed G&A pressure.",
  },
  {
    label: "PAT",
    variance: 2222.6,
    display: "+2,223",
    status: "F",
    note: "FY2025 PAT finished 45.8% above the official plan.",
  },
];

const viewData = {
  plan: {
    eyebrow: "FY2025 ACTUAL VS BUDGET",
    title: "A clear earnings beat, with margin still the key tension.",
    metrics: [
      { label: "Revenue", actual: "155,928", comparison: "150,000", delta: "+4.0%", tone: "positive" },
      { label: "Gross margin", actual: "19.9%", comparison: "20.4%", delta: "(0.5) ppt", tone: "negative" },
      { label: "Operating profit", actual: "7,075", comparison: "5,253", delta: "+34.7%", tone: "positive" },
      { label: "PAT", actual: "7,073", comparison: "4,850", delta: "+45.8%", tone: "positive" },
    ],
    takeaway:
      "Revenue exceeded plan, but the stronger result came mainly from selling-expense leverage and non-operating support—not from gross-margin expansion.",
  },
  yoy: {
    eyebrow: "FY2025 ACTUAL VS FY2024 ACTUAL",
    title: "Scale translated into faster earnings growth.",
    metrics: [
      { label: "Revenue", actual: "155,928", comparison: "134,341", delta: "+16.1%", tone: "positive" },
      { label: "Gross margin", actual: "19.9%", comparison: "20.5%", delta: "(0.6) ppt", tone: "negative" },
      { label: "Selling-expense ratio", actual: "12.4%", comparison: "14.8%", delta: "+2.4 ppt", tone: "positive" },
      { label: "PAT", actual: "7,073", comparison: "3,733", delta: "+89.4%", tone: "positive" },
    ],
    takeaway:
      "FY2025 earnings grew materially faster than revenue. Lower selling-cost intensity offset gross-margin compression, while G&A discipline remains the next operating question.",
  },
  forecast: {
    eyebrow: "FY2026 FORECAST VS PLAN",
    title: "The first half is ahead; the model solves for the H2 run-rate.",
    metrics: [
      { label: "6M revenue", actual: "95,305", comparison: "Plan phasing", delta: "+9.2%", tone: "positive" },
      { label: "Base FY revenue", actual: "185,000", comparison: "185,000", delta: "On plan", tone: "positive" },
      { label: "Base PAT", actual: "9,200", comparison: "9,200", delta: "On plan", tone: "positive" },
      { label: "Required H2 growth", actual: "8.7%", comparison: "YoY", delta: "Base case", tone: "neutral" },
    ],
    takeaway:
      "The Base case is calibrated to management guidance. Bear and Bull cases move H2 growth by five percentage points to make the planning range explicit.",
  },
} satisfies Record<ViewName, {
  eyebrow: string;
  title: string;
  metrics: Array<{ label: string; actual: string; comparison: string; delta: string; tone: string }>;
  takeaway: string;
}>;

const formulaLibrary: Record<FormulaName, { purpose: string; formula: string; used: string; caution: string }> = {
  SUMIFS: {
    purpose: "Aggregate Actual or Budget by period, business unit and account code.",
    formula: '=SUMIFS(Amount, Year, 2025, BusinessUnit, "BHX", AccountCode, "REV")',
    used: "Monthly P&L · Variance analysis · Forecast vs Budget",
    caution: "Criteria ranges and the sum range must have the same dimensions.",
  },
  XLOOKUP: {
    purpose: "Map AccountCode to P&L category and cost nature.",
    formula: '=XLOOKUP(Code, MapCode, Category, "Unmapped", 0)',
    used: "Raw Actual · Raw Budget · Account Mapping",
    caution: 'Keep the exact-match flag and surface "Unmapped" instead of hiding gaps.',
  },
  "F/U logic": {
    purpose: "Evaluate a variance according to whether the account is income or expense.",
    formula: '=IF(Variance * FavorableSign >= 0, "F", "U")',
    used: "Variance analysis · Forecast vs Budget",
    caution: "A positive variance is not always favorable—higher costs are unfavorable.",
  },
  "Rolling forecast": {
    purpose: "Preserve reported actuals and forecast only the remainder of the year.",
    formula: "=Actual_YTD + Forecast_Remaining",
    used: "FY2026 Rolling Forecast",
    caution: "Do not reforecast months already closed as actual.",
  },
  "Tolerance check": {
    purpose: "Allow small rounding differences while keeping tie-outs strict.",
    formula: '=IF(ABS(Actual - Expected) <= Tolerance, "PASS", "FAIL")',
    used: "Checks & Controls",
    caution: "A tolerance that is too large makes the control meaningless.",
  },
};

const previewLibrary: Record<PreviewName, { label: string; src: string; caption: string }> = {
  dashboard: {
    label: "Dashboard",
    src: "./previews/dashboard.png",
    caption: "Management-facing KPI cards and formula-linked charts.",
  },
  variance: {
    label: "Variance",
    src: "./previews/variance.png",
    caption: "Actual vs Budget with driver, impact and recommended action.",
  },
  forecast: {
    label: "Forecast",
    src: "./previews/forecast.png",
    caption: "Monthly FY2026 rolling forecast with Bear/Base/Bull scenario logic.",
  },
  practice: {
    label: "Practice Lab",
    src: "./previews/practice.png",
    caption: "Nineteen formula exercises with automatic grading.",
  },
};

function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

function AppIcon({ name }: { name: "arrow" | "download" | "check" | "grid" }) {
  const icons = {
    arrow: "↗",
    download: "↓",
    check: "✓",
    grid: "▦",
  };
  return <span aria-hidden="true">{icons[name]}</span>;
}

export default function Home() {
  const [scenario, setScenario] = useState<ScenarioName>("Base");
  const [h2Growth, setH2Growth] = useState(scenarioPresets.Base);
  const [activeView, setActiveView] = useState<ViewName>("plan");
  const [activeBu, setActiveBu] = useState(1);
  const [activeDriver, setActiveDriver] = useState(0);
  const [dso, setDso] = useState(0.6);
  const [dio, setDio] = useState(80);
  const [dpo, setDpo] = useState(40);
  const [activeFormula, setActiveFormula] = useState<FormulaName>("SUMIFS");
  const [formulaRevealed, setFormulaRevealed] = useState(false);
  const [activePreview, setActivePreview] = useState<PreviewName>("dashboard");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeModule, setActiveModule] = useState<ModuleName>("performance");

  useEffect(() => {
    const onScroll = () => {
      const root = document.documentElement;
      const available = Math.max(root.scrollHeight - root.clientHeight, 1);
      setScrollProgress(Math.min(window.scrollY / available, 1));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scenarioMetrics = useMemo(() => {
    const revenue = revenue6M2026 + h2Revenue2025 * (1 + h2Growth);
    const pat = revenue * (patPlan / fy2026Plan);
    const achievement = revenue / fy2026Plan;
    const rawVariance = revenue - fy2026Plan;
    const variance = Math.abs(rawVariance) < 0.5 ? 0 : rawVariance;
    return { revenue, pat, achievement, variance };
  }, [h2Growth]);

  const monthlyForecast = useMemo(() => {
    const h2Base = monthly2025.slice(6);
    const rawH2 = h2Base.map((value) => value * (1 + h2Growth));
    return [...actual2026, ...rawH2];
  }, [h2Growth]);

  const monthlyBudget = useMemo(() => {
    const total = monthly2025.reduce((sum, value) => sum + value, 0);
    return monthly2025.map((value) => (value / total) * fy2026Plan);
  }, []);

  const maxMonth = Math.max(...monthlyForecast, ...monthlyBudget);
  const selectedBu = businessUnits[activeBu];
  const selectedDriver = varianceDrivers[activeDriver];
  const wcRevenue = scenarioMetrics.revenue;
  const wcCogs = wcRevenue * (150740.2194518919 / 189125.55);
  const receivables = (wcRevenue / 365) * dso;
  const inventory = (wcCogs / 365) * dio;
  const payables = (wcCogs / 365) * dpo;
  const nwc = receivables + inventory - payables;
  const ccc = dso + dio - dpo;

  const selectScenario = (next: ScenarioName) => {
    setScenario(next);
    setH2Growth(scenarioPresets[next]);
  };

  const updateGrowth = (value: number) => {
    setH2Growth(value);
    const exact = (Object.entries(scenarioPresets) as Array<[ScenarioName, number]>).find(
      ([, preset]) => Math.abs(preset - value) < 0.0001,
    );
    if (exact) setScenario(exact[0]);
  };

  const currentView = viewData[activeView];
  const currentFormula = formulaLibrary[activeFormula];
  const currentPreview = previewLibrary[activePreview];

  const activateModule = (nextModule: ModuleName) => {
    setActiveModule(nextModule);
    window.requestAnimationFrame(() => {
      document.getElementById("workspace")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <main>
      <div className="scroll-progress" style={{ transform: `scaleX(${scrollProgress})` }} />

      <header className="topbar">
        <a className="brand" href="#top" aria-label="MWG FP&A project home">
          <span className="brand-mark">FP</span>
          <span>
            <strong>MWG FP&amp;A</strong>
            <small>Interactive work sample</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <button type="button" onClick={() => activateModule("performance")}>Performance</button>
          <button type="button" onClick={() => activateModule("forecast")}>Forecast</button>
          <button type="button" onClick={() => activateModule("model")}>Model</button>
          <button type="button" onClick={() => activateModule("evidence")}>Evidence</button>
        </nav>
        <a className="download-link compact" href="./downloads/MWG_FPA_Showcase_Final.xlsx" download>
          <AppIcon name="download" /> Excel model
        </a>
      </header>

      <div className="hero-stage">
        <section className="hero section-shell" id="top">
          <div className="hero-copy">
          <div className="eyebrow-row">
            <span className="status-dot" />
            <span>Public-data FP&amp;A work sample</span>
            <span>FY2024A–FY2026F</span>
          </div>
          <h1>
            From public disclosures to a
            <span> decision-ready operating plan.</span>
          </h1>
          <p className="hero-lede">
            A formula-driven MWG model that turns monthly revenue, audited financials and
            management targets into variance analysis, a rolling forecast, working-capital
            planning and management actions.
          </p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => activateModule("forecast")}>
              Open scenario lab <AppIcon name="arrow" />
            </button>
            <a className="secondary-button" href="./downloads/MWG_FPA_Showcase_Final.xlsx" download>
              Download workbook <AppIcon name="download" />
            </a>
          </div>
          <div className="hero-proof">
            <div><strong>16/16</strong><span>model checks pass</span></div>
            <div><strong>5</strong><span>Power Query connections</span></div>
            <div><strong>1</strong><span>live PivotTable</span></div>
            <div><strong>19</strong><span>formula exercises</span></div>
          </div>
          </div>

          <div className="hero-panel" aria-label="FY2026 scenario summary">
          <div className="panel-topline">
            <span>FY2026 live plan</span>
            <span className="live-pill">Formula-linked</span>
          </div>
          <div className="segmented-control" aria-label="Scenario presets">
            {(Object.keys(scenarioPresets) as ScenarioName[]).map((name) => (
              <button
                type="button"
                key={name}
                className={scenario === name ? "active" : ""}
                onClick={() => selectScenario(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="hero-metric">
            <span>Revenue forecast</span>
            <strong>{formatNumber(scenarioMetrics.revenue)}</strong>
            <small>VND bn</small>
          </div>
          <div className="plan-track" aria-label={`Plan achievement ${(scenarioMetrics.achievement * 100).toFixed(1)} percent`}>
            <div style={{ width: `${Math.min(scenarioMetrics.achievement * 100, 100)}%` }} />
            <span className="plan-marker">Plan</span>
          </div>
          <div className="panel-stat-grid">
            <div>
              <span>Plan achievement</span>
              <strong>{(scenarioMetrics.achievement * 100).toFixed(1)}%</strong>
            </div>
            <div>
              <span>PAT forecast</span>
              <strong>{formatNumber(scenarioMetrics.pat)}</strong>
            </div>
            <div>
              <span>H2 growth</span>
              <strong>{(h2Growth * 100).toFixed(1)}%</strong>
            </div>
            <div>
              <span>Variance to plan</span>
              <strong className={scenarioMetrics.variance >= 0 ? "good" : "bad"}>
                {scenarioMetrics.variance >= 0 ? "+" : ""}
                {formatNumber(scenarioMetrics.variance)}
              </strong>
            </div>
          </div>
          <p className="micro-note">
            Reported 6M2026 revenue + scenario-based H2 estimate. Base is calibrated to
            MWG&apos;s official revenue and PAT targets.
          </p>
          </div>
        </section>
      </div>

      <section className="ticker">
        <div><span>FY2025 revenue</span><strong>155,928</strong><em>+4.0% vs plan</em></div>
        <div><span>FY2025 PAT</span><strong>7,073</strong><em>+45.8% vs plan</em></div>
        <div><span>FY2025 gross margin</span><strong>19.9%</strong><em className="warning">(0.5) ppt vs plan</em></div>
        <div><span>FY2026 revenue plan</span><strong>185,000</strong><em>VND bn</em></div>
      </section>

      <section className="module-switcher-shell" id="workspace">
        <div className="module-switcher" role="tablist" aria-label="Project modules">
          {moduleNavigation.map((module) => (
            <button
              type="button"
              role="tab"
              id={`${module.key}-tab`}
              aria-selected={activeModule === module.key}
              aria-controls={`${module.key}-panel`}
              className={activeModule === module.key ? "active" : ""}
              key={module.key}
              onClick={() => activateModule(module.key)}
            >
              <span>{module.number}</span>
              <strong>{module.label}</strong>
            </button>
          ))}
        </div>
      </section>

      <section
        className="section-shell performance-section workspace-panel"
        id="performance-panel"
        role="tabpanel"
        aria-labelledby="performance-tab"
        hidden={activeModule !== "performance"}
      >
        <div className="section-heading">
          <div>
            <span className="section-index">01 / PERFORMANCE</span>
            <h2>One model, three management views.</h2>
          </div>
          <div className="view-tabs" role="tablist" aria-label="Performance view">
            <button className={activeView === "plan" ? "active" : ""} onClick={() => setActiveView("plan")}>A vs B</button>
            <button className={activeView === "yoy" ? "active" : ""} onClick={() => setActiveView("yoy")}>YoY</button>
            <button className={activeView === "forecast" ? "active" : ""} onClick={() => setActiveView("forecast")}>FY2026F</button>
          </div>
        </div>

        <div className="performance-layout">
          <div className="performance-summary">
            <span className="data-eyebrow">{currentView.eyebrow}</span>
            <h3>{currentView.title}</h3>
            <p>{currentView.takeaway}</p>
            <div className="management-question">
              <span>Management question</span>
              <strong>
                {activeView === "plan"
                  ? "What really drove the earnings beat?"
                  : activeView === "yoy"
                    ? "Did scale improve operating productivity?"
                    : "What H2 run-rate closes the FY2026 plan?"}
              </strong>
            </div>
          </div>
          <div className="metric-grid">
            {currentView.metrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.actual}</strong>
                <small>vs {metric.comparison}</small>
                <em className={metric.tone}>{metric.delta}</em>
              </article>
            ))}
          </div>
        </div>

        <div className="bu-panel">
          <div className="bu-selector">
            <span>Revenue by business unit · FY2025</span>
            <div>
              {businessUnits.map((bu, index) => (
                <button
                  type="button"
                  key={bu.key}
                  className={activeBu === index ? "active" : ""}
                  onClick={() => setActiveBu(index)}
                >
                  {bu.key}
                </button>
              ))}
            </div>
          </div>
          <div className="bu-visual">
            <div
              className="share-ring"
              style={{
                background: `conic-gradient(${selectedBu.color} 0 ${(selectedBu.actual / 155928.1) * 100}%, #e6ecea ${(selectedBu.actual / 155928.1) * 100}% 100%)`,
              }}
            >
              <div>
                <strong>{((selectedBu.actual / 155928.1) * 100).toFixed(1)}%</strong>
                <span>revenue mix</span>
              </div>
            </div>
            <div className="bu-bars">
              <div>
                <span><b>Actual</b>{formatNumber(selectedBu.actual)}</span>
                <div className="bar-track"><i style={{ width: `${Math.min((selectedBu.actual / 70000) * 100, 100)}%`, background: selectedBu.color }} /></div>
              </div>
              <div>
                <span><b>Budget</b>{formatNumber(selectedBu.budget)}</span>
                <div className="bar-track"><i style={{ width: `${Math.min((selectedBu.budget / 70000) * 100, 100)}%` }} /></div>
              </div>
              <div className="bu-variance">
                <span>Variance</span>
                <strong className={selectedBu.actual >= selectedBu.budget ? "good" : "bad"}>
                  {selectedBu.actual >= selectedBu.budget ? "+" : ""}
                  {(((selectedBu.actual / selectedBu.budget) - 1) * 100).toFixed(1)}%
                </strong>
              </div>
            </div>
          </div>
          <div className="bu-commentary">
            <div><span>Primary driver</span><p>{selectedBu.driver}</p></div>
            <div><span>Recommended action</span><p>{selectedBu.action}</p></div>
          </div>
        </div>
      </section>

      <section
        className="dark-section workspace-panel"
        id="forecast-panel"
        role="tabpanel"
        aria-labelledby="forecast-tab"
        hidden={activeModule !== "forecast"}
      >
        <div className="section-shell">
          <div className="section-heading light">
            <div>
              <span className="section-index">02 / FORECAST LAB</span>
              <h2>Move the H2 assumption. Watch the plan respond.</h2>
            </div>
            <div className="scenario-badge">{scenario} scenario</div>
          </div>

          <div className="forecast-grid">
            <div className="forecast-controls">
              <div className="control-label">
                <span>H2 revenue growth</span>
                <strong>{(h2Growth * 100).toFixed(1)}%</strong>
              </div>
              <input
                aria-label="H2 revenue growth assumption"
                type="range"
                min="0"
                max="0.18"
                step="0.001"
                value={h2Growth}
                onChange={(event) => updateGrowth(Number(event.target.value))}
              />
              <div className="range-labels"><span>0%</span><span>18%</span></div>
              <div className="preset-row">
                {(Object.keys(scenarioPresets) as ScenarioName[]).map((name) => (
                  <button key={name} className={scenario === name ? "active" : ""} onClick={() => selectScenario(name)}>
                    <span>{name}</span>
                    <strong>{(scenarioPresets[name] * 100).toFixed(1)}%</strong>
                  </button>
                ))}
              </div>
              <div className="formula-chip">
                <span>Formula</span>
                <code>FY = 6M actual + 2025 H2 × (1 + growth)</code>
              </div>
              <div className="forecast-output">
                <div><span>FY revenue</span><strong>{formatNumber(scenarioMetrics.revenue)}</strong></div>
                <div><span>PAT</span><strong>{formatNumber(scenarioMetrics.pat)}</strong></div>
                <div><span>Plan gap</span><strong className={scenarioMetrics.variance >= 0 ? "good" : "bad"}>{formatNumber(scenarioMetrics.variance)}</strong></div>
              </div>
            </div>

            <div className="monthly-chart">
              <div className="chart-header">
                <div><span>Monthly revenue</span><strong>FY2026F vs Budget</strong></div>
                <div className="legend"><span><i className="forecast-key" />Forecast</span><span><i className="budget-key" />Budget</span></div>
              </div>
              <div className="chart-area" aria-label="Monthly forecast and budget bar chart">
                {months.map((month, index) => (
                  <div className="month-column" key={month}>
                    <div className="bars">
                      <i className="budget-bar" style={{ height: `${(monthlyBudget[index] / maxMonth) * 100}%` }} />
                      <i className="forecast-bar" style={{ height: `${(monthlyForecast[index] / maxMonth) * 100}%` }} />
                    </div>
                    <span>{month}</span>
                    {index === 5 && <b className="actual-cut">Actual</b>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="section-shell variance-section workspace-panel"
        id="variance-panel"
        role="tabpanel"
        aria-labelledby="variance-tab"
        hidden={activeModule !== "variance"}
      >
        <div className="section-heading">
          <div>
            <span className="section-index">03 / VARIANCE STORY</span>
            <h2>Numbers become useful when they end in an action.</h2>
          </div>
          <p className="section-copy">Select a driver to see the operating interpretation behind the variance.</p>
        </div>
        <div className="variance-layout">
          <div className="driver-list">
            {varianceDrivers.map((driver, index) => {
              const width = Math.min((Math.abs(driver.variance) / 6000) * 100, 100);
              return (
                <button
                  type="button"
                  className={activeDriver === index ? "active" : ""}
                  onClick={() => setActiveDriver(index)}
                  key={driver.label}
                >
                  <span>{driver.label}</span>
                  <div className="driver-track">
                    <i className={driver.status === "F" ? "favorable" : "unfavorable"} style={{ width: `${width}%` }} />
                  </div>
                  <strong>{driver.display}</strong>
                  <em className={driver.status === "F" ? "favorable" : "unfavorable"}>{driver.status}</em>
                </button>
              );
            })}
          </div>
          <article className="driver-detail">
            <span className={selectedDriver.status === "F" ? "signal favorable" : "signal unfavorable"}>
              {selectedDriver.status === "F" ? "Favorable" : "Unfavorable"}
            </span>
            <h3>{selectedDriver.label}</h3>
            <strong>{selectedDriver.display}</strong>
            <p>{selectedDriver.note}</p>
            <div>
              <span>Decision rule</span>
              <code>Variance × Favorable sign ≥ 0</code>
            </div>
          </article>
        </div>
      </section>

      <section
        className="section-shell working-capital-section workspace-panel"
        id="working-capital-panel"
        role="tabpanel"
        aria-labelledby="working-capital-tab"
        hidden={activeModule !== "working-capital"}
      >
        <div className="section-heading">
          <div>
            <span className="section-index">04 / WORKING CAPITAL</span>
            <h2>A small operational assumption can move a lot of cash.</h2>
          </div>
          <div className="ccc-badge"><span>Cash conversion cycle</span><strong>{ccc.toFixed(1)} days</strong></div>
        </div>
        <div className="wc-grid">
          <div className="wc-controls">
            {[
              { label: "DSO", value: dso, set: setDso, min: 0, max: 15, step: 0.1 },
              { label: "DIO", value: dio, set: setDio, min: 40, max: 120, step: 1 },
              { label: "DPO", value: dpo, set: setDpo, min: 20, max: 80, step: 1 },
            ].map((control) => (
              <label key={control.label}>
                <span>{control.label}<strong>{control.value.toFixed(control.step < 1 ? 1 : 0)} days</strong></span>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={control.value}
                  onChange={(event) => control.set(Number(event.target.value))}
                />
              </label>
            ))}
            <p>Base assumptions in the workbook: DSO 0.6 days · DIO 80 days · DPO 40 days.</p>
          </div>
          <div className="wc-output">
            <div><span>Accounts receivable</span><strong>{formatNumber(receivables)}</strong></div>
            <div><span>Inventory</span><strong>{formatNumber(inventory)}</strong></div>
            <div><span>Accounts payable</span><strong>({formatNumber(payables)})</strong></div>
            <div className="nwc-total"><span>Net working capital</span><strong>{formatNumber(nwc)}</strong><small>VND bn</small></div>
          </div>
          <div className="wc-explainer">
            <span>Why it matters</span>
            <p>
              Inventory days are the dominant cash lever in this simplified model. The calculation
              makes the operating assumption explicit instead of burying working capital inside a
              cash-flow plug.
            </p>
            <code>NWC = AR + Inventory − AP</code>
          </div>
        </div>
      </section>

      <section
        className="model-section workspace-panel"
        id="model-panel"
        role="tabpanel"
        aria-labelledby="model-tab"
        hidden={activeModule !== "model"}
      >
        <div className="section-shell">
          <div className="section-heading">
            <div>
              <span className="section-index">05 / MODEL ARCHITECTURE</span>
              <h2>Built to refresh, trace and defend.</h2>
            </div>
            <p className="section-copy">The workbook separates sources, calculations, decisions and controls.</p>
          </div>
          <div className="model-flow">
            {[
              ["01", "Raw Actual / Budget", "Audited filings, monthly disclosures and analyst-phased plans."],
              ["02", "Mapping layer", "XLOOKUP and Power Query map each account to a P&L category and cost nature."],
              ["03", "Monthly P&L", "SUMIFS rolls transactions into a consistent twelve-month reporting view."],
              ["04", "Variance & Forecast", "F/U logic, management commentary and scenario-based H2 estimates."],
              ["05", "Dashboard & Checks", "Formula-linked outputs, a live PivotTable and sixteen visible controls."],
            ].map((step) => (
              <article key={step[0]}>
                <span>{step[0]}</span>
                <h3>{step[1]}</h3>
                <p>{step[2]}</p>
              </article>
            ))}
          </div>

          <div className="formula-lab">
            <div className="formula-list">
              <span>Formula explorer</span>
              {(Object.keys(formulaLibrary) as FormulaName[]).map((name) => (
                <button
                  type="button"
                  key={name}
                  className={activeFormula === name ? "active" : ""}
                  onClick={() => {
                    setActiveFormula(name);
                    setFormulaRevealed(false);
                  }}
                >
                  {name}<AppIcon name="arrow" />
                </button>
              ))}
            </div>
            <div className="formula-detail">
              <span>{activeFormula}</span>
              <h3>{currentFormula.purpose}</h3>
              <button type="button" className="reveal-button" onClick={() => setFormulaRevealed(!formulaRevealed)}>
                {formulaRevealed ? "Hide formula" : "Reveal formula"}
              </button>
              <div className={`formula-code ${formulaRevealed ? "revealed" : ""}`}>
                <code>{formulaRevealed ? currentFormula.formula : "••••••••••••••••••••••••••••"}</code>
              </div>
              <div className="formula-meta">
                <div><span>Used in</span><p>{currentFormula.used}</p></div>
                <div><span>Watch out</span><p>{currentFormula.caution}</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="section-shell evidence-section workspace-panel"
        id="evidence-panel"
        role="tabpanel"
        aria-labelledby="evidence-tab"
        hidden={activeModule !== "evidence"}
      >
        <div className="section-heading">
          <div>
            <span className="section-index">06 / WORKBOOK EVIDENCE</span>
            <h2>Not a mockup. The underlying Excel file is the deliverable.</h2>
          </div>
          <a className="primary-button" href="./downloads/MWG_FPA_Showcase_Final.xlsx" download>
            Download Excel <AppIcon name="download" />
          </a>
        </div>
        <div className="preview-tabs" role="tablist" aria-label="Workbook previews">
          {(Object.keys(previewLibrary) as PreviewName[]).map((name) => (
            <button
              key={name}
              className={activePreview === name ? "active" : ""}
              onClick={() => setActivePreview(name)}
            >
              {previewLibrary[name].label}
            </button>
          ))}
        </div>
        <button className="preview-frame" type="button" onClick={() => setPreviewOpen(true)} aria-label={`Enlarge ${currentPreview.label} preview`}>
          <img src={currentPreview.src} alt={`${currentPreview.label} Excel sheet preview`} />
          <span><AppIcon name="grid" /> Click to enlarge</span>
        </button>
        <div className="preview-caption">
          <span>{currentPreview.label}</span>
          <p>{currentPreview.caption}</p>
        </div>

        <div className="evidence-grid">
          <article><AppIcon name="check" /><strong>Formula-driven</strong><span>No hardcoded reporting outputs</span></article>
          <article><AppIcon name="check" /><strong>Refreshable</strong><span>Five Power Query connections</span></article>
          <article><AppIcon name="check" /><strong>Auditable</strong><span>Source register and visible checks</span></article>
          <article><AppIcon name="check" /><strong>Trainable</strong><span>Formula guide, lab and answer key</span></article>
        </div>
      </section>

      <section className="closing-section">
        <div className="section-shell closing-inner">
          <div>
            <span>MWG FP&amp;A INTERACTIVE WORK SAMPLE</span>
            <h2>Monthly reporting. Variance. Forecast. Cash. Controls.</h2>
            <p>
              Built from public company disclosures to demonstrate practical Excel,
              financial modelling and management-reporting skills.
            </p>
          </div>
          <a className="closing-download" href="./downloads/MWG_FPA_Showcase_Final.xlsx" download>
            <span>Get the full workbook</span>
            <strong>MWG_FP&amp;A_Model.xlsx</strong>
            <AppIcon name="download" />
          </a>
        </div>
      </section>

      <footer>
        <div>
          <strong>Le Hoang Nghia</strong>
          <span>Finance / FP&amp;A Intern Portfolio</span>
        </div>
        <p>
          Public-data work sample. FY2024/FY2025 actuals tie to company filings.
          Budgets, allocations and forecasts are analyst-prepared and explicitly labelled.
        </p>
        <a href="https://mwg.vn/bao-cao" target="_blank" rel="noreferrer">Company reports ↗</a>
      </footer>

      {previewOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setPreviewOpen(false)}>
          <div className="preview-modal" role="dialog" aria-modal="true" aria-label={`${currentPreview.label} workbook preview`} onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Close preview">×</button>
            <img src={currentPreview.src} alt={`${currentPreview.label} full Excel sheet preview`} />
          </div>
        </div>
      )}
    </main>
  );
}
