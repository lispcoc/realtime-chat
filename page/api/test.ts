import type { NextApiRequest, NextApiResponse } from "next";

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
        return res.status(200).json({ test: "ok" });
    }
}
