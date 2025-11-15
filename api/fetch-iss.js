// api/fetch-iss.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  // Allow only GET from browser
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
  if (!APPS_SCRIPT_URL) {
    console.error("APPS_SCRIPT_URL not set");
    return res.status(500).send("Server misconfigured");
  }

  try {
    // Call the Apps Script doGet (which returns JSON of sheet rows)
    const appsRes = await fetch(APPS_SCRIPT_URL);
    if (!appsRes.ok) {
      const txt = await appsRes.text();
      throw new Error(`Apps Script error ${appsRes.status}: ${txt}`);
    }
    const json = await appsRes.json();

    // Add CORS headers for browser requests
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    return res.status(200).json(json);
  } catch (err) {
    console.error("fetch-iss error:", err);
    return res.status(500).json({ error: err.message });
  }
}
