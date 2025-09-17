/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import express from "express";
const quoteRoutes = express.Router();

/**
 * Get Random Quotes
 */
quoteRoutes.get("/", async (req, res) => {
  try {
    const response = await fetch("https://zenquotes.io/api/random");
    const data = await response.json();
    res.json(data); // send back to frontend
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch quote" });
  }
});

export default quoteRoutes;
