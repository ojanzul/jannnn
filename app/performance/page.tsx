import { supabaseAnon } from "@/lib/supabase";

export const revalidate = 60;

function fmtR(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}R`;
}

export default async function PerformancePage() {
  const supabase = supabaseAnon();
  const { data: instruments } = await supabase.from("instruments").select("id, display").order("id");
  const { data: models } = await supabase.from("ml_models").select("*");
  const { data: resolvedSignals } = await supabase
    .from("signals")
    .select("instrument_id, outcome, r_multiple, resolved_at")
    .not("outcome", "is", null)
    .order("resolved_at", { ascending: false })
    .limit(1000);

  const { count: openCount } = await supabase
    .from("signals")
    .select("*", { count: "exact", head: true })
    .in("direction", ["BUY", "SELL"])
    .is("outcome", null);

  const modelByInstrument = new Map((models ?? []).map((m: any) => [m.instrument_id, m]));

  const liveByInstrument = new Map<string, any[]>();
  for (const s of resolvedSignals ?? []) {
    if (!liveByInstrument.has(s.instrument_id)) liveByInstrument.set(s.instrument_id, []);
    liveByInstrument.get(s.instrument_id)!.push(s);
  }

  const rows = (instruments ?? []).map((inst: any) => {
    const backtest = modelByInstrument.get(inst.id);
    const liveTrades = (liveByInstrument.get(inst.id) ?? []).filter((s) => s.outcome !== "expired");
    const liveWins = liveTrades.filter((s) => s.outcome === "tp1" || s.outcome === "tp2").length;
    const liveWinRate = liveTrades.length ? Math.round((100 * liveWins) / liveTrades.length) : null;
    const liveTotalR = liveTrades.reduce((s, t) => s + (t.r_multiple ?? 0), 0);
    const liveAvgR = liveTrades.length ? liveTotalR / liveTrades.length : null;
    return {
      id: inst.id, display: inst.display,
      backtestAvgR: backtest?.avg_r ?? null, backtestWinRate: backtest?.win_rate ?? null, backtestSamples: backtest?.samples ?? 0,
      liveAvgR, liveWinRate, liveSamples: liveTrades.length, liveTotalR,
    };
  });

  return (
    <div className="container">
      <div className="section-title">Live vs Backtest Performance</div>
      <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 10, maxWidth: 700 }}>
        Backtest columns come from the most recent <code className="mono">retrain-models</code> run
        (simulated history). Live columns come from actual signals sent since this pipeline went live,
        resolved against real subsequent price action by <code className="mono">check-outcomes</code>{" "}
        (runs every 15 min). Live sample sizes will be small for a while — treat any live number under
        ~30 resolved trades as too early to draw conclusions from, regardless of which direction it points.
      </p>
      <p style={{ fontSize: 11.5, color: "var(--text-dim)", marginBottom: 20 }}>
        {openCount ?? 0} signal(s) currently open and not yet resolved.
      </p>

      <table>
        <thead>
          <tr>
            <th>Instrument</th>
            <th>Backtest Avg R</th><th>Backtest Win Rate</th><th>Backtest Samples</th>
            <th>Live Avg R</th><th>Live Win Rate</th><th>Live Samples</th>
            <th>Divergence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const hasEnoughLive = r.liveSamples >= 30;
            const divergence = r.backtestAvgR !== null && r.liveAvgR !== null ? r.liveAvgR - r.backtestAvgR : null;
            return (
              <tr key={r.id}>
                <td>{r.display}</td>
                <td style={{ color: (r.backtestAvgR ?? 0) >= 0 ? "var(--buy)" : "var(--sell)" }}>{fmtR(r.backtestAvgR)}</td>
                <td>{r.backtestWinRate ?? "—"}%</td>
                <td>{r.backtestSamples}</td>
                <td style={{ color: r.liveAvgR === null ? "var(--text-dim)" : r.liveAvgR >= 0 ? "var(--buy)" : "var(--sell)" }}>
                  {fmtR(r.liveAvgR)}
                </td>
                <td>{r.liveWinRate !== null ? `${r.liveWinRate}%` : "—"}</td>
                <td style={{ color: hasEnoughLive ? "var(--text-primary)" : "var(--text-dim)" }}>
                  {r.liveSamples}{!hasEnoughLive && r.liveSamples > 0 ? " (too early)" : ""}
                </td>
                <td style={{ color: !hasEnoughLive ? "var(--text-dim)" : divergence !== null && Math.abs(divergence) > 0.3 ? "var(--watch)" : "var(--text-muted)" }}>
                  {!hasEnoughLive ? "—" : divergence !== null ? `${divergence >= 0 ? "+" : ""}${divergence.toFixed(2)}R` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p style={{ fontSize: 10.5, color: "var(--text-dim)", marginTop: 12, maxWidth: 700 }}>
        "Divergence" = live avg R − backtest avg R, only shown once there are 30+ resolved live trades.
        A large negative divergence (highlighted) means live results are running meaningfully worse than
        the backtest predicted — worth investigating (e.g. real spread/slippage wider than the cost
        model assumes, or the backtested history isn't representative of current market conditions)
        before trusting that instrument's signals as much as its backtest numbers suggest.
      </p>
    </div>
  );
}
