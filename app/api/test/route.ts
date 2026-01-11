import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase/supabase"

export async function GET() {
    const { data } = await supabase.from("Rooms").select("*")
    return { rooms: data }
}
