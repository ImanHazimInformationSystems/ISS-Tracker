// api/cron.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  // Only allow GET (Vercel Cron will call GET)
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
  if (!APPS_SCRIPT_URL) {
    console.error("APPS_SCRIPT_URL not set");
    return res.status(500).send("Server misconfigured");
  }

  try {
    // 1) Fetch ISS data from WhereTheISS.at
    const wtiaRes = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
    if (!wtiaRes.ok) throw new Error(`ISS API error ${wtiaRes.status}`);
    const wt = await wtiaRes.json();

    // wt contains fields: latitude, longitude, altitude, velocity, timestamp, etc.
    const payload = {
      timestamp: Math.floor(Date.now() / 1000), // seconds
      latitude: wt.latitude,
      longitude: wt.longitude,
      altitude: wt.altitude,
      velocity: wt.velocity
    };

    // 2) Post to your Google Apps Script doPost endpoint (which writes into the Sheet)
    const postRes = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const text = await postRes.text();
    console.log("Posted to Apps Script:", postRes.status, text);

    return res.status(200).json({ success: true, posted: payload, appsScriptStatus: postRes.status, appsScriptResponse: text });
  } catch (err) {
    console.error("cron error:", err);
    return res.status(500).json({ error: err.message });
  }
}
