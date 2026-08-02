"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JournalForm({ instruments }: { instruments: { id: string; display: string }[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = await fetch("/api/journal", { method: "POST", body: JSON.stringify(body) });
    setSubmitting(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else {
      alert("Failed to save entry — see console for details.");
      console.error(await res.text());
    }
  }

  return (
    <form className="form-card" onSubmit={onSubmit}>
      <div className="field">
        <label>Instrument</label>
        <select name="instrument_id" required>
          {instruments.map((i) => <option key={i.id} value={i.id}>{i.display}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Direction</label>
        <select name="direction" required><option value="BUY">BUY</option><option value="SELL">SELL</option></select>
      </div>
      <div className="field"><label>Entry</label><input name="entry" type="number" step="any" required /></div>
      <div className="field"><label>Stop Loss</label><input name="stop_loss" type="number" step="any" required /></div>
      <div className="field"><label>Take Profit</label><input name="take_profit" type="number" step="any" required /></div>
      <div className="field">
        <label>Result</label>
        <select name="result"><option value="open">Open</option><option value="win">Win</option><option value="loss">Loss</option></select>
      </div>
      <div className="field"><label>R Multiple</label><input name="r_multiple" type="number" step="any" placeholder="e.g. 1.8" /></div>
      <div className="field" style={{ gridColumn: "span 2" }}><label>Notes</label><input name="notes" type="text" placeholder="Setup notes, lessons…" /></div>
      <div className="field" style={{ justifyContent: "flex-end" }}>
        <label>&nbsp;</label>
        <button className="btn-primary" type="submit" disabled={submitting}>{submitting ? "Saving…" : "Add Entry"}</button>
      </div>
    </form>
  );
}
