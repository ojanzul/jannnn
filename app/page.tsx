import { supabaseAnon } from "@/lib/supabase";

export const revalidate = 30; // re-fetch at most every 30s — this is a read-only view, no need for client polling

function fmt(n: number | null, dec = 5): string {
  if (n === null || n === undefined) return "—";
  return n.toFixed(dec);
}
function pipDecimals(id: string, assetType: string) {
  if (id === "USDJPY") return 3;
  if (assetType === "crypto" || assetType === "goldproxy") return 2;
  return 5;
}
function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function DashboardPage() {
  const supabase = supabaseAnon();

  const { data: instruments } = await supabase.from("instruments").select("*").order("id");
  const { data: recentSignals } = await supabase
    .from("signals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  const latestByInstrument = new Map<string, any>();
  for (const s of recentSignals ?? []) {
    if (!latestByInstrument.has(s.instrument_id)) latestByInstrument.set(s.instrument_id, s);
  }

  const history = (recentSignals ?? [])
    .filter((s) => s.direction === "BUY" || s.direction === "SELL")
    .slice(0, 25);

  return (
    <div className="container">
      <div className="section-title">Latest Signal — Every Instrument</div>
      <div className="grid">
        {(instruments ?? []).map((inst: any) => {
          const sig = latestByInstrument.get(inst.id);
          const dec = pipDecimals(inst.id, inst.asset_type);
          return (
            <div className="card" key={inst.id}>
              <div className="card-head">
                <span className="pair-name">{inst.display}</span>
                {sig ? (
                  <span className={`tag ${sig.direction}`}>{sig.direction.replace("_", " ")}</span>
                ) : (
                  <span className="tag NO_TRADE">No scan yet</span>
                )}
              </div>
              {sig && (sig.direction === "BUY" || sig.direction === "SELL") ? (
                <>
                  <div className="field-row"><span className="field-label">Entry</span><span className="field-value">{fmt(sig.entry, dec)}</span></div>
                  <div className="field-row"><span className="field-label">Stop Loss</span><span className="field-value sell">{fmt(sig.stop_loss, dec)}</span></div>
                  <div className="field-row"><span className="field-label">TP1 / TP2</span><span className="field-value buy">{fmt(sig.tp1, dec)} / {fmt(sig.tp2, dec)}</span></div>
                  <div className="field-row"><span className="field-label">R:R</span><span className="field-value">1 : {sig.rr ? Number(sig.rr).toFixed(2) : "—"}</span></div>
                  <div className="field-row"><span className="field-label">Confidence</span><span className="field-value">{sig.confidence}% (Grade {sig.grade})</span></div>
                </>
              ) : sig ? (
                <p style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                  {sig.limitation || sig.error || "No high-confidence setup right now."}
                </p>
              ) : (
                <p style={{ fontSize: 11.5, color: "var(--text-dim)" }}>Waiting for the first scheduled scan.</p>
              )}
              {sig && (
                <div className="meta-line">
                  <span>{timeAgo(sig.created_at)}</span>
                  <span className={`badge-mode ${sig.scoring_mode ?? "rules"}`}>
                    {sig.scoring_mode === "ml" ? "AI model" : "Rule-based"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="section-title">Recent BUY/SELL Signals</div>
      {history.length === 0 ? (
        <div className="empty">No BUY/SELL signals yet — check back after the next scheduled scan.</div>
      ) : (
        <table>
          <thead>
            <tr><th>Time</th><th>Instrument</th><th>Dir</th><th>Entry</th><th>SL</th><th>TP1</th><th>R:R</th><th>Grade</th><th>Mode</th></tr>
          </thead>
          <tbody>
            {history.map((s: any) => {
              const inst = (instruments ?? []).find((i: any) => i.id === s.instrument_id);
              const dec = pipDecimals(s.instrument_id, inst?.asset_type ?? "forex");
              return (
                <tr key={s.id}>
                  <td>{timeAgo(s.created_at)}</td>
                  <td>{inst?.display ?? s.instrument_id}</td>
                  <td style={{ color: s.direction === "BUY" ? "var(--buy)" : "var(--sell)" }}>{s.direction}</td>
                  <td>{fmt(s.entry, dec)}</td>
                  <td>{fmt(s.stop_loss, dec)}</td>
                  <td>{fmt(s.tp1, dec)}</td>
                  <td>1:{s.rr ? Number(s.rr).toFixed(2) : "—"}</td>
                  <td>{s.grade}</td>
                  <td>{s.scoring_mode === "ml" ? "AI" : "Rules"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
