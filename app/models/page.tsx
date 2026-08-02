import { supabaseAnon } from "@/lib/supabase";

export const revalidate = 60;

const FEATURE_LABELS: Record<string, string> = {
  trendEma: "EMA50 vs EMA200 alignment", priceEma50: "Price vs EMA50",
  supertrend: "Supertrend direction", macdSign: "MACD histogram sign",
  macdMomentum: "MACD histogram momentum", rsiSupportive: "RSI supportive zone (30-50 / 50-70)",
  rsiExtreme: "RSI overbought / oversold", adxConfluence: "ADX trend confirmation (>=25)",
  htfBias: "Higher-timeframe bias",
};

const MIN_SAMPLES_TO_TRUST = 80;
const MIN_HOLDOUT_ACCURACY_TO_TRUST = 55;

export default async function ModelsPage() {
  const supabase = supabaseAnon();
  const { data: instruments } = await supabase.from("instruments").select("*").order("id");
  const { data: models } = await supabase.from("ml_models").select("*");

  const modelByInstrument = new Map<string, any>();
  for (const m of models ?? []) modelByInstrument.set(m.instrument_id, m);

  return (
    <div className="container">
      <div className="section-title">AI Model Status</div>
      <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 20, maxWidth: 640 }}>
        A model only scores live signals once it has {MIN_SAMPLES_TO_TRUST}+ closed-trade samples AND{" "}
        {MIN_HOLDOUT_ACCURACY_TO_TRUST}%+ hold-out accuracy. Below that, <code className="mono">scan-markets</code>{" "}
        quietly uses the rule-based confluence score instead — a model trained on too little data is worse than no model.
      </p>

      <table>
        <thead>
          <tr>
            <th>Instrument</th><th>Samples</th><th>Win Rate</th><th>Avg R</th><th>Total R</th>
            <th>Train Acc.</th><th>Hold-Out Acc.</th><th>Chosen L2</th><th>Status</th><th>Trained</th>
          </tr>
        </thead>
        <tbody>
          {(instruments ?? []).map((inst: any) => {
            const m = modelByInstrument.get(inst.id);
            if (!m) {
              return (
                <tr key={inst.id}>
                  <td>{inst.display}</td>
                  <td colSpan={8} style={{ color: "var(--text-dim)" }}>Not trained yet</td>
                </tr>
              );
            }
            const trusted = m.is_trusted;
            return (
              <tr key={inst.id}>
                <td>{inst.display}</td>
                <td>{m.samples}</td>
                <td>{m.win_rate}%</td>
                <td style={{ color: m.avg_r >= 0 ? "var(--buy)" : "var(--sell)" }}>{m.avg_r >= 0 ? "+" : ""}{m.avg_r}R</td>
                <td style={{ color: m.total_r >= 0 ? "var(--buy)" : "var(--sell)" }}>{m.total_r >= 0 ? "+" : ""}{m.total_r}R</td>
                <td>{m.train_accuracy}%</td>
                <td>{m.holdout_accuracy ?? "—"}%</td>
                <td>{m.chosen_l2 ?? "—"}</td>
                <td><span className={`tag ${trusted ? "BUY" : "WATCHLIST"}`}>{trusted ? "Live" : "Default in use"}</span></td>
                <td style={{ fontSize: 10.5, color: "var(--text-dim)" }}>{new Date(m.trained_at).toLocaleDateString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="section-title">Weights by Instrument</div>
      <div className="grid">
        {(instruments ?? []).map((inst: any) => {
          const m = modelByInstrument.get(inst.id);
          if (!m) return null;
          const maxAbs = Math.max(...Object.values(m.weights as Record<string, number>).map((v) => Math.abs(v)), 0.01);
          return (
            <div className="card" key={inst.id}>
              <div className="card-head">
                <span className="pair-name">{inst.display}</span>
                <span className={`tag ${m.is_trusted ? "BUY" : "WATCHLIST"}`}>{m.is_trusted ? "Live" : "Not live"}</span>
              </div>
              {Object.entries(m.weights as Record<string, number>)
                .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                .map(([k, w]) => {
                  const pct = Math.round((100 * Math.abs(w)) / maxAbs);
                  const negative = w < 0;
                  return (
                    <div className="weight-bar" key={k}>
                      <div className="row">
                        <span style={{ color: "var(--text-primary)" }}>{FEATURE_LABELS[k] ?? k}</span>
                        <span className="mono" style={{ color: negative ? "var(--sell)" : "var(--accent)" }}>
                          {w > 0 ? "+" : ""}{w.toFixed(3)}
                        </span>
                      </div>
                      <div className="track">
                        <div className="fill" style={{ width: `${pct}%`, background: negative ? "var(--sell)" : "var(--accent)" }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
