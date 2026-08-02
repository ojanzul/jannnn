import { supabaseService } from "@/lib/supabase";
import { JournalForm } from "./JournalForm";

export const revalidate = 0; // always fresh — this is a personal log, not a cached view

export default async function JournalPage() {
  const supabase = supabaseService();
  const { data: instruments } = await supabase.from("instruments").select("id, display").order("id");
  const { data: entries } = await supabase
    .from("journal_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const closed = (entries ?? []).filter((e) => e.result !== "open");
  const wins = closed.filter((e) => e.result === "win").length;
  const winRate = closed.length ? Math.round((100 * wins) / closed.length) : 0;
  const totalR = (entries ?? []).reduce((s, e) => s + (e.r_multiple ? Number(e.r_multiple) : 0), 0);

  return (
    <div className="container">
      <div className="section-title">Trade Journal</div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 20 }}>
        <div className="card"><div className="pair-name">{entries?.length ?? 0}</div><div className="field-label">Total Entries</div></div>
        <div className="card"><div className="pair-name">{closed.length}</div><div className="field-label">Closed Trades</div></div>
        <div className="card"><div className="pair-name" style={{ color: "var(--buy)" }}>{winRate}%</div><div className="field-label">Win Rate</div></div>
        <div className="card"><div className="pair-name" style={{ color: totalR >= 0 ? "var(--buy)" : "var(--sell)" }}>{totalR >= 0 ? "+" : ""}{totalR.toFixed(2)}R</div><div className="field-label">Total R</div></div>
      </div>

      <JournalForm instruments={instruments ?? []} />

      {(!entries || entries.length === 0) ? (
        <div className="empty">No journal entries yet — add your first trade above.</div>
      ) : (
        <table>
          <thead>
            <tr><th>Date</th><th>Instrument</th><th>Dir</th><th>Entry</th><th>SL</th><th>TP</th><th>Result</th><th>R</th><th>Notes</th></tr>
          </thead>
          <tbody>
            {entries.map((e: any) => (
              <tr key={e.id}>
                <td>{e.trade_date}</td>
                <td>{e.instrument_id}</td>
                <td style={{ color: e.direction === "BUY" ? "var(--buy)" : "var(--sell)" }}>{e.direction}</td>
                <td>{e.entry}</td>
                <td>{e.stop_loss}</td>
                <td>{e.take_profit}</td>
                <td><span className={`pill ${e.result}`}>{e.result}</span></td>
                <td>{e.r_multiple != null ? `${e.r_multiple > 0 ? "+" : ""}${e.r_multiple}R` : "—"}</td>
                <td style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>{e.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
