import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase/supabase"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "POST") {
        const { value } = req.body;
        return res.status(200).json({ test: "ok" });
    }
    if (req.method === "GET") {
        const { value } = req.body;
        const { data } = await supabase.from("Rooms").select("*")
        return res.status(200).json({ rooms: data });
    }
}
