import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = supabaseService();

  const { error } = await supabase.from("journal_entries").insert({
    instrument_id: body.instrument_id,
    direction: body.direction,
    entry: body.entry ? Number(body.entry) : null,
    stop_loss: body.stop_loss ? Number(body.stop_loss) : null,
    take_profit: body.take_profit ? Number(body.take_profit) : null,
    result: body.result || "open",
    r_multiple: body.r_multiple ? Number(body.r_multiple) : null,
    notes: body.notes || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const supabase = supabaseService();
  const { error } = await supabase.from("journal_entries").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
