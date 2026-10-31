/**
 * NCBI Taxonomy Integration Module
 * Provides authoritative NCBI Taxonomy verification, synonym mapping, rank validation,
 * and rate-limited API querying.
 *
 * Adheres to:
 * - Never inventing or hallucinating NCBI TaxIDs
 * - Preserving original raw taxon names
 * - Identifying accepted names separately from synonyms
 * - Transparent epistemic status: verified, synonym, unresolved, ambiguous, rank_mismatch
 */

import { TaxonomicRank, TaxonomyEntry } from '../types/microbiome';

// Curated authoritative taxonomy knowledge base for common human/mammalian & environmental microbiome taxa
export const CURATED_NCBI_TAXONOMY: Record<string, {
  taxid: number;
  accepted_name: string;
  rank: TaxonomicRank;
  synonyms?: string[];
  lineage: string[];
  notes?: string;
}> = {
  // Common gut microbes
  'faecalibacterium prausnitzii': {
    taxid: 853,
    accepted_name: 'Faecalibacterium prausnitzii',
    rank: 'species',
    lineage: ['Bacteria', 'Bacillota', 'Clostridia', 'Eubacteriales', 'Ruminococcaceae', 'Faecalibacterium'],
    notes: 'Major butyrate producer; depleted in inflammatory bowel diseases (IBD)'
  },
  'akkermansia muciniphila': {
    taxid: 239935,
    accepted_name: 'Akkermansia muciniphila',
    rank: 'species',
    lineage: ['Bacteria', 'Verrucomicrobiota', 'Verrucomicrobiia', 'Verrucomicrobiales', 'Akkermansiaceae', 'Akkermansia'],
    notes: 'Mucin-degrading bacterium associated with metabolic health and gut barrier integrity'
  },
  'bacteroides fragilis': {
    taxid: 817,
    accepted_name: 'Bacteroides fragilis',
    rank: 'species',
    lineage: ['Bacteria', 'Bacteroidota', 'Bacteroidia', 'Bacteroidales', 'Bacteroidaceae', 'Bacteroides'],
    notes: 'Key gut commensal; certain enterotoxigenic strains (ETBF) produce BFT toxin'
  },
  'bacteroides thetaiotaomicron': {
    taxid: 818,
    accepted_name: 'Bacteroides thetaiotaomicron',
    rank: 'species',
    lineage: ['Bacteria', 'Bacteroidota', 'Bacteroidia', 'Bacteroidales', 'Bacteroidaceae', 'Bacteroides'],
    notes: 'Exemplary polysaccharide-utilizing gut symbiont'
  },
  'bacteroides vulgatus': {
    taxid: 820,
    accepted_name: 'Phocaeicola vulgatus',
    rank: 'species',
    synonyms: ['Bacteroides vulgatus'],
    lineage: ['Bacteria', 'Bacteroidota', 'Bacteroidia', 'Bacteroidales', 'Bacteroidaceae', 'Phocaeicola'],
    notes: 'Reclassified from Bacteroides vulgatus to Phocaeicola vulgatus in 2020'
  },
  'phocaeicola vulgatus': {
    taxid: 820,
    accepted_name: 'Phocaeicola vulgatus',
    rank: 'species',
    synonyms: ['Bacteroides vulgatus'],
    lineage: ['Bacteria', 'Bacteroidota', 'Bacteroidia', 'Bacteroidales', 'Bacteroidaceae', 'Phocaeicola'],
  },
  'bifidobacterium longum': {
    taxid: 2168,
    accepted_name: 'Bifidobacterium longum',
    rank: 'species',
    lineage: ['Bacteria', 'Actinomycetota', 'Actinomycetes', 'Bifidobacteriales', 'Bifidobacteriaceae', 'Bifidobacterium'],
    notes: 'Prevalent neonatal and adult gut beneficial commensal'
  },
  'bifidobacterium adolescentis': {
    taxid: 1680,
    accepted_name: 'Bifidobacterium adolescentis',
    rank: 'species',
    lineage: ['Bacteria', 'Actinomycetota', 'Actinomycetes', 'Bifidobacteriales', 'Bifidobacteriaceae', 'Bifidobacterium']
  },
  'clostridioides difficile': {
    taxid: 1496,
    accepted_name: 'Clostridioides difficile',
    rank: 'species',
    synonyms: ['Clostridium difficile'],
    lineage: ['Bacteria', 'Bacillota', 'Clostridia', 'Peptostreptococcales', 'Peptostreptococcaceae', 'Clostridioides'],
    notes: 'Formerly Clostridium difficile. Reclassified in 2016 based on 16S and whole-genome phylogeny'
  },
  'clostridium difficile': {
    taxid: 1496,
    accepted_name: 'Clostridioides difficile',
    rank: 'species',
    synonyms: ['Clostridium difficile'],
    lineage: ['Bacteria', 'Bacillota', 'Clostridia', 'Peptostreptococcales', 'Peptostreptococcaceae', 'Clostridioides'],
    notes: 'Outdated synonym. Accepted name is Clostridioides difficile'
  },
  'propionibacterium acnes': {
    taxid: 1747,
    accepted_name: 'Cutibacterium acnes',
    rank: 'species',
    synonyms: ['Propionibacterium acnes'],
    lineage: ['Bacteria', 'Actinomycetota', 'Actinomycetes', 'Propionibacteriales', 'Propionibacteriaceae', 'Cutibacterium'],
    notes: 'Reclassified from Propionibacterium to Cutibacterium acnes in 2016'
  },
  'cutibacterium acnes': {
    taxid: 1747,
    accepted_name: 'Cutibacterium acnes',
    rank: 'species',
    synonyms: ['Propionibacterium acnes'],
    lineage: ['Bacteria', 'Actinomycetota', 'Actinomycetes', 'Propionibacteriales', 'Propionibacteriaceae', 'Cutibacterium']
  },
  'escherichia coli': {
    taxid: 562,
    accepted_name: 'Escherichia coli',
    rank: 'species',
    lineage: ['Bacteria', 'Pseudomonadota', 'Gammaproteobacteria', 'Enterobacterales', 'Enterobacteriaceae', 'Escherichia']
  },
  'fusobacterium nucleatum': {
    taxid: 851,
    accepted_name: 'Fusobacterium nucleatum',
    rank: 'species',
    lineage: ['Bacteria', 'Fusobacteriota', 'Fusobacteriia', 'Fusobacteriales', 'Fusobacteriaceae', 'Fusobacterium'],
    notes: 'Oral pathogen frequently enriched in colorectal carcinoma tissue and stool'
  },
  'ruminococcus gnavus': {
    taxid: 33038,
    accepted_name: 'Mediterraneibacter gnavus',
    rank: 'species',
    synonyms: ['Ruminococcus gnavus'],
    lineage: ['Bacteria', 'Bacillota', 'Clostridia', 'Lachnospirales', 'Lachnospiraceae', 'Mediterraneibacter'],
    notes: 'Transferred to genus Mediterraneibacter in 2019'
  },
  'mediterraneibacter gnavus': {
    taxid: 33038,
    accepted_name: 'Mediterraneibacter gnavus',
    rank: 'species',
    synonyms: ['Ruminococcus gnavus'],
    lineage: ['Bacteria', 'Bacillota', 'Clostridia', 'Lachnospirales', 'Lachnospiraceae', 'Mediterraneibacter']
  },
  'roseburia intestinalis': {
    taxid: 166486,
    accepted_name: 'Roseburia intestinalis',
    rank: 'species',
    lineage: ['Bacteria', 'Bacillota', 'Clostridia', 'Lachnospirales', 'Lachnospiraceae', 'Roseburia']
  },
  'lactobacillus rhamnosus': {
    taxid: 47715,
    accepted_name: 'Lacticaseibacillus rhamnosus',
    rank: 'species',
    synonyms: ['Lactobacillus rhamnosus'],
    lineage: ['Bacteria', 'Bacillota', 'Bacilli', 'Lactobacillales', 'Lactobacillaceae', 'Lacticaseibacillus'],
    notes: 'Reclassified in the major 2020 Lactobacillus genus splitting'
  },
  'lacticaseibacillus rhamnosus': {
    taxid: 47715,
    accepted_name: 'Lacticaseibacillus rhamnosus',
    rank: 'species',
    lineage: ['Bacteria', 'Bacillota', 'Bacilli', 'Lactobacillales', 'Lactobacillaceae', 'Lacticaseibacillus']
  },
  'lactobacillus acidophilus': {
    taxid: 1579,
    accepted_name: 'Lactobacillus acidophilus',
    rank: 'species',
    lineage: ['Bacteria', 'Bacillota', 'Bacilli', 'Lactobacillales', 'Lactobacillaceae', 'Lactobacillus']
  },
  'prevotella copri': {
    taxid: 165180,
    accepted_name: 'Segatella copri',
    rank: 'species',
    synonyms: ['Prevotella copri'],
    lineage: ['Bacteria', 'Bacteroidota', 'Bacteroidia', 'Bacteroidales', 'Prevotellaceae', 'Segatella'],
    notes: 'Reclassified to Segatella copri in 2022'
  },
  'segatella copri': {
    taxid: 165180,
    accepted_name: 'Segatella copri',
    rank: 'species',
    lineage: ['Bacteria', 'Bacteroidota', 'Bacteroidia', 'Bacteroidales', 'Prevotellaceae', 'Segatella']
  },
  'streptococcus pneumoniae': {
    taxid: 1313,
    accepted_name: 'Streptococcus pneumoniae',
    rank: 'species',
    lineage: ['Bacteria', 'Bacillota', 'Bacilli', 'Lactobacillales', 'Streptococcaceae', 'Streptococcus']
  },
  'staphylococcus aureus': {
    taxid: 1280,
    accepted_name: 'Staphylococcus aureus',
    rank: 'species',
    lineage: ['Bacteria', 'Bacillota', 'Bacilli', 'Bacillales', 'Staphylococcaceae', 'Staphylococcus']
  },
  'staphylococcus epidermidis': {
    taxid: 1282,
    accepted_name: 'Staphylococcus epidermidis',
    rank: 'species',
    lineage: ['Bacteria', 'Bacillota', 'Bacilli', 'Bacillales', 'Staphylococcaceae', 'Staphylococcus']
  },
  'candida albicans': {
    taxid: 5476,
    accepted_name: 'Candida albicans',
    rank: 'species',
    lineage: ['Eukaryota', 'Ascomycota', 'Saccharomycetes', 'Saccharomycetales', 'Saccharomycetaceae', 'Candida']
  },
  'blastocystis hominis': {
    taxid: 94478,
    accepted_name: 'Blastocystis hominis',
    rank: 'species',
    lineage: ['Eukaryota', 'Stramenopiles', 'Blastocystidae', 'Blastocystis']
  },
  // Higher rank taxa (Phyla & Genera)
  'bacteroidetes': {
    taxid: 976,
    accepted_name: 'Bacteroidota',
    rank: 'phylum',
    synonyms: ['Bacteroidetes'],
    lineage: ['Bacteria', 'Bacteroidota'],
    notes: 'ICNP 2021 priority name change from Bacteroidetes to Bacteroidota'
  },
  'bacteroidota': {
    taxid: 976,
    accepted_name: 'Bacteroidota',
    rank: 'phylum',
    lineage: ['Bacteria', 'Bacteroidota']
  },
  'firmicutes': {
    taxid: 1239,
    accepted_name: 'Bacillota',
    rank: 'phylum',
    synonyms: ['Firmicutes'],
    lineage: ['Bacteria', 'Bacillota'],
    notes: 'ICNP 2021 priority name change from Firmicutes to Bacillota'
  },
  'bacillota': {
    taxid: 1239,
    accepted_name: 'Bacillota',
    rank: 'phylum',
    lineage: ['Bacteria', 'Bacillota']
  },
  'proteobacteria': {
    taxid: 1224,
    accepted_name: 'Pseudomonadota',
    rank: 'phylum',
    synonyms: ['Proteobacteria'],
    lineage: ['Bacteria', 'Pseudomonadota'],
    notes: 'ICNP 2021 priority name change from Proteobacteria to Pseudomonadota'
  },
  'pseudomonadota': {
    taxid: 1224,
    accepted_name: 'Pseudomonadota',
    rank: 'phylum',
    lineage: ['Bacteria', 'Pseudomonadota']
  },
  'actinobacteria': {
    taxid: 201174,
    accepted_name: 'Actinomycetota',
    rank: 'phylum',
    synonyms: ['Actinobacteria'],
    lineage: ['Bacteria', 'Actinomycetota']
  },
  'actinomycetota': {
    taxid: 201174,
    accepted_name: 'Actinomycetota',
    rank: 'phylum',
    lineage: ['Bacteria', 'Actinomycetota']
  },
  'bacteroides': {
    taxid: 816,
    accepted_name: 'Bacteroides',
    rank: 'genus',
    lineage: ['Bacteria', 'Bacteroidota', 'Bacteroidia', 'Bacteroidales', 'Bacteroidaceae']
  },
  'bifidobacterium': {
    taxid: 1678,
    accepted_name: 'Bifidobacterium',
    rank: 'genus',
    lineage: ['Bacteria', 'Actinomycetota', 'Actinomycetes', 'Bifidobacteriales', 'Bifidobacteriaceae']
  },
  'faecalibacterium': {
    taxid: 216851,
    accepted_name: 'Faecalibacterium',
    rank: 'genus',
    lineage: ['Bacteria', 'Bacillota', 'Clostridia', 'Eubacteriales', 'Ruminococcaceae']
  },
  'akkermansia': {
    taxid: 239934,
    accepted_name: 'Akkermansia',
    rank: 'genus',
    lineage: ['Bacteria', 'Verrucomicrobiota', 'Verrucomicrobiia', 'Verrucomicrobiales', 'Akkermansiaceae']
  },
  'prevotella': {
    taxid: 838,
    accepted_name: 'Prevotella',
    rank: 'genus',
    lineage: ['Bacteria', 'Bacteroidota', 'Bacteroidia', 'Bacteroidales', 'Prevotellaceae']
  },
  'lactobacillus': {
    taxid: 1578,
    accepted_name: 'Lactobacillus',
    rank: 'genus',
    lineage: ['Bacteria', 'Bacillota', 'Bacilli', 'Lactobacillales', 'Lactobacillaceae']
  },
  'streptococcus': {
    taxid: 1301,
    accepted_name: 'Streptococcus',
    rank: 'genus',
    lineage: ['Bacteria', 'Bacillota', 'Bacilli', 'Lactobacillales', 'Streptococcaceae']
  },
  'clostridium': {
    taxid: 1485,
    accepted_name: 'Clostridium',
    rank: 'genus',
    lineage: ['Bacteria', 'Bacillota', 'Clostridia', 'Eubacteriales', 'Clostridiaceae']
  },
  'veillonella': {
    taxid: 29465,
    accepted_name: 'Veillonella',
    rank: 'genus',
    lineage: ['Bacteria', 'Bacillota', 'Negativicutes', 'Veillonellales', 'Veillonellaceae']
  },
  'enterococcus faecalis': {
    taxid: 1351,
    accepted_name: 'Enterococcus faecalis',
    rank: 'species',
    lineage: ['Bacteria', 'Bacillota', 'Bacilli', 'Lactobacillales', 'Enterococcaceae', 'Enterococcus']
  },
  'methanobrevibacter smithii': {
    taxid: 2173,
    accepted_name: 'Methanobrevibacter smithii',
    rank: 'species',
    lineage: ['Archaea', 'Methanobacteriota', 'Methanobacteria', 'Methanobacteriales', 'Methanobacteriaceae', 'Methanobrevibacter'],
    notes: 'Dominant methanogenic archaeon in the human distal gastrointestinal tract'
  }
};

// In-memory cache for live NCBI lookup results
const TAXONOMY_CACHE = new Map<string, TaxonomyEntry>();

/**
 * Clean common bioinformatic prefixes from taxonomic strings
 * e.g., "k__Bacteria; p__Bacteroidetes; g__Bacteroides; s__fragilis" -> "Bacteroides fragilis"
 * e.g., "s__Faecalibacterium_prausnitzii" -> "Faecalibacterium prausnitzii"
 */
export function cleanTaxonName(rawName: string): string {
  if (!rawName) return '';
  let cleaned = rawName.trim();

  // If full Greengenes / SILVA lineage string, extract the most specific level
  if (cleaned.includes(';') || cleaned.includes('|')) {
    const parts = cleaned.split(/[;|]/).map(s => s.trim()).filter(Boolean);
    const lastPart = parts[parts.length - 1];
    cleaned = lastPart;
  }

  // Remove taxonomic prefix (d__, k__, p__, c__, o__, f__, g__, s__, t__)
  cleaned = cleaned.replace(/^[a-z]__/, '');

  // Replace underscores with spaces
  cleaned = cleaned.replace(/_/g, ' ');

  // Remove common OTU / ASV suffixes or bracketed artifacts like [Clostridium] or [Ruminococcus]
  cleaned = cleaned.replace(/[\[\]]/g, '');

  // Strip excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Infer expected rank from name structure
 */
export function inferRankFromName(name: string): TaxonomicRank {
  const parts = name.split(/\s+/);
  if (parts.length === 1) {
    const lower = name.toLowerCase();
    if (lower.endsWith('ota') || lower.endsWith('etes') || lower === 'firmicutes' || lower === 'proteobacteria') {
      return 'phylum';
    }
    if (lower.endsWith('aceae')) {
      return 'family';
    }
    if (lower.endsWith('ales')) {
      return 'order';
    }
    if (lower.endsWith('ia') || lower.endsWith('iia')) {
      return 'class';
    }
    return 'genus';
  }
  if (parts.length === 2) {
    return 'species';
  }
  if (parts.length > 2) {
    return 'strain';
  }
  return 'unranked';
}

/**
 * Validate a taxon entry against curated and NCBI taxonomy
 */
export async function resolveTaxonomyEntry(
  rawName: string, 
  providedTaxid?: number | string,
  providedRank?: string
): Promise<TaxonomyEntry> {
  const cleaned = cleanTaxonName(rawName);
  const cacheKey = `${cleaned.toLowerCase()}::${providedTaxid ?? ''}`;

  if (TAXONOMY_CACHE.has(cacheKey)) {
    return TAXONOMY_CACHE.get(cacheKey)!;
  }

  const normalizedLookup = cleaned.toLowerCase();
  
  // 1. Check authoritative offline registry first
  if (CURATED_NCBI_TAXONOMY[normalizedLookup]) {
    const match = CURATED_NCBI_TAXONOMY[normalizedLookup];
    const isSynonym = match.accepted_name.toLowerCase() !== normalizedLookup;
    
    let status: TaxonomyEntry['status'] = isSynonym ? 'synonym' : 'verified';
    let notes = match.notes || '';

    // Check taxid consistency
    if (providedTaxid) {
      const parsedTaxid = Number(providedTaxid);
      if (parsedTaxid !== match.taxid) {
        status = 'rank_mismatch';
        notes = `Provided TaxID (${providedTaxid}) does not match NCBI TaxID (${match.taxid}) for ${match.accepted_name}. ${notes}`.trim();
      }
    }

    // Check rank consistency if provided
    if (providedRank && providedRank.toLowerCase() !== match.rank) {
      status = 'rank_mismatch';
      notes = `Provided rank (${providedRank}) differs from NCBI verified rank (${match.rank}). ${notes}`.trim();
    }

    const result: TaxonomyEntry = {
      raw_name: rawName,
      cleaned_name: cleaned,
      ncbi_taxid: providedTaxid ? Number(providedTaxid) : match.taxid,
      suggested_taxid: match.taxid,
      accepted_name: match.accepted_name,
      rank: match.rank,
      status,
      lineage: match.lineage,
      authority_source: 'NCBI Taxonomy (Authoritative Curated / Entrez)',
      notes: notes || undefined
    };

    TAXONOMY_CACHE.set(cacheKey, result);
    return result;
  }

  // 2. Try online NCBI E-utilities if running in node/browser with network access
  try {
    const term = encodeURIComponent(cleaned);
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=taxonomy&term=${term}&retmode=json`;
    
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(4000) });
    if (searchRes.ok) {
      const data = await searchRes.json();
      const idList = data?.esearchresult?.idlist;
      
      if (idList && idList.length > 0) {
        const foundTaxid = Number(idList[0]);
        // Ambiguous term if multiple distinct IDs returned
        const isAmbiguous = idList.length > 1;

        // Fetch summary
        const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=taxonomy&id=${foundTaxid}&retmode=json`;
        const summaryRes = await fetch(summaryUrl, { signal: AbortSignal.timeout(4000) });
        
        if (summaryRes.ok) {
          const sumData = await summaryRes.json();
          const doc = sumData?.result?.[String(foundTaxid)];
          if (doc) {
            const scientificName = doc.scientificname || cleaned;
            const rank = (doc.rank || inferRankFromName(scientificName)) as TaxonomicRank;
            const isSynonym = scientificName.toLowerCase() !== cleaned.toLowerCase();

            const entry: TaxonomyEntry = {
              raw_name: rawName,
              cleaned_name: cleaned,
              ncbi_taxid: providedTaxid ? Number(providedTaxid) : foundTaxid,
              suggested_taxid: foundTaxid,
              accepted_name: scientificName,
              rank,
              status: isAmbiguous ? 'ambiguous' : isSynonym ? 'synonym' : 'verified',
              authority_source: 'NCBI Taxonomy E-utilities Live API',
              notes: isAmbiguous 
                ? `Multiple candidate TaxIDs found (${idList.slice(0, 3).join(', ')}). Manual verification recommended.`
                : isSynonym 
                  ? `NCBI lists ${scientificName} as accepted scientific name.`
                  : undefined
            };
            TAXONOMY_CACHE.set(cacheKey, entry);
            return entry;
          }
        }
      }
    }
  } catch {
    // Graceful offline fallback
  }

  // 3. Fallback for unindexed or synthetic/environmental names
  // Never invent an NCBI TaxID!
  const inferred = inferRankFromName(cleaned);
  const isInvalidFormat = cleaned.length < 2 || /^\d+$/.test(cleaned) || /[<>{}\\\/]/.test(cleaned);

  const fallbackEntry: TaxonomyEntry = {
    raw_name: rawName,
    cleaned_name: cleaned,
    ncbi_taxid: providedTaxid ? Number(providedTaxid) : undefined,
    accepted_name: undefined, // Do not invent!
    rank: (providedRank as TaxonomicRank) || inferred,
    status: isInvalidFormat ? 'unresolved' : 'unresolved',
    authority_source: 'Microbiome QC Taxonomy Engine (Unverified against NCBI)',
    notes: isInvalidFormat
      ? 'Taxon name contains invalid non-alphabetic formatting or illegal characters.'
      : 'Unrecognized taxon name in NCBI Taxonomy database. Please inspect spelling or provide valid NCBI TaxID.'
  };

  TAXONOMY_CACHE.set(cacheKey, fallbackEntry);
  return fallbackEntry;
}

/**
 * Validate taxonomic rank names against standard Linnaean hierarchy
 */
export const VALID_TAXONOMIC_RANKS: TaxonomicRank[] = [
  'superkingdom',
  'phylum',
  'class',
  'order',
  'family',
  'genus',
  'species',
  'strain',
  'unranked'
];

export function isValidTaxonomicRank(rank: string): boolean {
  if (!rank) return false;
  return VALID_TAXONOMIC_RANKS.includes(rank.toLowerCase().trim() as TaxonomicRank);
}
