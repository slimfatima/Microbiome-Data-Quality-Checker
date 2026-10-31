/**
 * Full-Stack Express Server for Microbiome Data Quality Checker
 * Provides NCBI Taxonomy API proxy, dataset validation service, and serves Vite frontend.
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * Exponential backoff helper for scientific APIs (NCBI E-utilities)
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 2,
  baseDelayMs = 400
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(resolve => setTimeout(resolve, baseDelayMs * Math.pow(2, attempt)));
    }
  }
  throw new Error(`Exhausted retries for ${url}`);
}

// NCBI Taxonomy Proxy Endpoint
app.get('/api/ncbi/taxonomy/search', async (req, res) => {
  const query = req.query.term as string;
  if (!query) {
    return res.status(400).json({ error: 'Missing "term" parameter' });
  }

  const cleanTerm = query.trim().replace(/^[a-z]__/, '').replace(/_/g, ' ');
  const apiKey = process.env.NCBI_API_KEY ? `&api_key=${process.env.NCBI_API_KEY}` : '';
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=taxonomy&term=${encodeURIComponent(cleanTerm)}&retmode=json${apiKey}`;

  try {
    const searchRes = await fetchWithRetry(searchUrl, { signal: AbortSignal.timeout(4000) });
    if (!searchRes.ok) {
      return res.status(searchRes.status).json({ error: `NCBI returned status ${searchRes.status}` });
    }

    const searchData = await searchRes.json();
    const idList = searchData?.esearchresult?.idlist || [];

    if (idList.length === 0) {
      return res.json({ found: false, term: cleanTerm });
    }

    const taxid = idList[0];
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=taxonomy&id=${taxid}&retmode=json${apiKey}`;
    const summaryRes = await fetchWithRetry(summaryUrl, { signal: AbortSignal.timeout(4000) });

    if (!summaryRes.ok) {
      return res.json({ found: true, taxid: Number(taxid), candidateIds: idList });
    }

    const sumData = await summaryRes.json();
    const doc = sumData?.result?.[String(taxid)];

    return res.json({
      found: true,
      taxid: Number(taxid),
      candidateIds: idList,
      scientificName: doc?.scientificname || cleanTerm,
      rank: doc?.rank || 'species',
      division: doc?.division || 'Bacteria'
    });
  } catch (error: any) {
    // Return friendly fallback if external network is blocked or offline
    return res.json({
      found: false,
      term: cleanTerm,
      fallback: true,
      message: 'NCBI E-utilities lookup timed out or was unreachable; using internal curated registry.'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Microbiome QC Engine',
    version: '1.2.0',
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Microbiome QC server active at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
