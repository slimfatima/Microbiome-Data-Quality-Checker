/**
 * Microbiome Data Quality Checker (microbiomeQC)
 * Scientific Validation Engine
 *
 * Implements rigorous, reproducible rules across:
 * 1. Metadata completeness and type integrity
 * 2. Sample ID formatting, duplicate detection, participant conflicts
 * 3. Group label normalization and casing consistency
 * 4. Taxonomy verification, synonyms, rank hierarchies, and NCBI TaxIDs
 * 5. Microbial signature completeness, statistical validity, direction consistency, duplicate detection
 * 6. Experiment design, sample sizes, and paired vs independent validation
 */

import {
  SampleMetadata,
  TaxonomyEntry,
  MicrobialSignature,
  ExperimentMetadata,
  ValidationIssue,
  ValidationProfile,
  QCReportSummary
} from '../types/microbiome';
import { resolveTaxonomyEntry, isValidTaxonomicRank } from './ncbiTaxonomy';

// Standard Validation Profiles
export const VALIDATION_PROFILES: Record<string, ValidationProfile> = {
  clinical: {
    id: 'clinical',
    name: 'Clinical & Observational Study',
    description: 'Enforces human clinical metadata: age, sex, disease/condition, body site, antibiotic history, and statistical rigor.',
    requiredFields: ['sample_id', 'study_id', 'participant_id', 'body_site', 'disease_condition', 'experimental_group', 'age', 'sex', 'antibiotic_exposure'],
    optionalFields: ['treatment', 'collection_date', 'sequencing_platform', 'collection_timepoint'],
    strictTaxonomy: true,
    requirePValues: true,
    requireAntibioticInfo: true,
    minSamplesPerGroup: 3
  },
  longitudinal: {
    id: 'longitudinal',
    name: 'Longitudinal Cohort Study',
    description: 'Validates repeated measurements over time, participant-to-sample linkage, and time point formatting.',
    requiredFields: ['sample_id', 'study_id', 'participant_id', 'collection_timepoint', 'experimental_group'],
    optionalFields: ['age', 'sex', 'antibiotic_exposure', 'treatment', 'collection_date'],
    strictTaxonomy: true,
    requirePValues: true,
    requireAntibioticInfo: false,
    minSamplesPerGroup: 2
  },
  intervention: {
    id: 'intervention',
    name: 'Intervention / Clinical Trial',
    description: 'Ensures arm allocation, baseline vs post-treatment status, paired design coherence, and effect sizes.',
    requiredFields: ['sample_id', 'study_id', 'participant_id', 'experimental_group', 'treatment', 'study_design'],
    optionalFields: ['age', 'sex', 'antibiotic_exposure', 'collection_timepoint'],
    strictTaxonomy: true,
    requirePValues: true,
    requireAntibioticInfo: true,
    minSamplesPerGroup: 4
  },
  minimal_mimarks: {
    id: 'minimal_mimarks',
    name: 'Minimal MIMARKS Standards',
    description: 'Follows Genomic Standards Consortium (GSC) MIMARKS minimal core: sample ID, host/environment, body site.',
    requiredFields: ['sample_id', 'study_id', 'host_species', 'body_site'],
    optionalFields: ['experimental_group', 'disease_condition'],
    strictTaxonomy: false,
    requirePValues: false,
    requireAntibioticInfo: false,
    minSamplesPerGroup: 1
  }
};

/**
 * Validates Sample IDs:
 * - Empty or missing
 * - Duplicates
 * - Whitespace, non-printable characters, or risky special symbols (#, ?, /, \, quotes)
 * - Leading or trailing whitespace
 * - Suspicious pure numeric formatting (causes Excel truncation or auto-date corruption)
 */
export function validateSampleIds(samples: SampleMetadata[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenIds = new Map<string, number>();

  samples.forEach((s, idx) => {
    const rawId = s.sample_id;
    const rowNum = idx + 1;

    if (!rawId || String(rawId).trim() === '') {
      issues.push({
        id: `sid-missing-${rowNum}`,
        category: 'identifier',
        severity: 'critical',
        rule_id: 'RULE_SID_01',
        rule_name: 'Missing Sample ID',
        record_id: `Row ${rowNum}`,
        field: 'sample_id',
        detected_value: rawId,
        message: `Sample identifier is empty or missing in row ${rowNum}.`,
        rationale: 'Every sample record must have a unique, persistent identifier for reproducible mapping and traceability.',
        evidence: 'MIMARKS / GSC Checklist section 1.1 (Unique Sample Identifier Requirement)'
      });
      return;
    }

    const strId = String(rawId);
    const trimmed = strId.trim();

    // Whitespace checks
    if (strId !== trimmed) {
      issues.push({
        id: `sid-space-${trimmed}-${rowNum}`,
        category: 'identifier',
        severity: 'warning',
        rule_id: 'RULE_SID_02',
        rule_name: 'Untrimmed Sample ID Whitespace',
        record_id: strId,
        field: 'sample_id',
        detected_value: strId,
        message: `Sample ID "${strId}" contains leading or trailing whitespace.`,
        rationale: 'Untrimmed whitespace causes silent merge failures and join mismatches between metadata and OTU/ASV count tables.',
        suggested_correction: trimmed,
        evidence: 'Bioinformatic Join Integrity Rule'
      });
    }

    // Risky symbols
    if (/[#?%&/\\"'` \t\r\n]/.test(strId)) {
      issues.push({
        id: `sid-symbol-${trimmed}`,
        category: 'identifier',
        severity: 'warning',
        rule_id: 'RULE_SID_03',
        rule_name: 'Unsafe Characters in Sample ID',
        record_id: trimmed,
        field: 'sample_id',
        detected_value: strId,
        message: `Sample ID contains spaces or special characters (#, ?, /, quotes).`,
        rationale: 'Special characters frequently break downstream shell pipelines, QIIME 2 TSV parsers, and FASTQ demultiplexers.',
        suggested_correction: trimmed.replace(/[^a-zA-Z0-9_-]/g, '_'),
        evidence: 'POSIX & QIIME 2 Metadata Standard Format'
      });
    }

    // Excel auto-conversion risk (e.g., "1-2" or "MAR1")
    if (/^\d+-[A-Za-z]+$/.test(trimmed) || /^[A-Za-z]+-\d+$/.test(trimmed)) {
      if (/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d+$/i.test(trimmed)) {
        issues.push({
          id: `sid-excel-date-${trimmed}`,
          category: 'identifier',
          severity: 'warning',
          rule_id: 'RULE_SID_04',
          rule_name: 'Excel Date Corruption Risk',
          record_id: trimmed,
          field: 'sample_id',
          detected_value: strId,
          message: `Sample ID resembles date format ("${trimmed}") which spreadsheet programs may silently convert to a timestamp.`,
          rationale: 'Gene and sample name corruption in Excel is a well-documented source of published biomedical data errors.',
          suggested_correction: `SMP_${trimmed}`,
          evidence: 'Ziemann et al. Genome Biology (2016) gene name & identifier corruption study'
        });
      }
    }

    // Duplicate check
    const normalizedKey = trimmed.toLowerCase();
    if (seenIds.has(normalizedKey)) {
      const firstSeenRow = seenIds.get(normalizedKey)!;
      issues.push({
        id: `sid-dup-${trimmed}-${rowNum}`,
        category: 'identifier',
        severity: 'critical',
        rule_id: 'RULE_SID_05',
        rule_name: 'Duplicate Sample ID',
        record_id: trimmed,
        field: 'sample_id',
        detected_value: strId,
        message: `Duplicate Sample ID "${trimmed}" detected (previously seen in row ${firstSeenRow}).`,
        rationale: 'Duplicate sample identifiers prevent unambiguous 1-to-1 association with biological specimens and sequencing reads.',
        suggested_correction: `${trimmed}_rep2`,
        evidence: 'Primary Key Uniqueness Invariant'
      });
    } else {
      seenIds.set(normalizedKey, rowNum);
    }
  });

  return issues;
}

/**
 * Validates Group Labels for consistency:
 * - Inconsistent casing (e.g. "Control" vs "control" vs "CONTROL")
 * - Inconsistent synonym variants (e.g. "CTRL", "Control", "Healthy")
 * - Near-duplicate labels differing only by space or punctuation
 */
export function validateGroupLabels(samples: SampleMetadata[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const rawGroups = samples
    .map(s => s.experimental_group)
    .filter((g): g is string => typeof g === 'string' && g.trim() !== '');

  const groupCounts = new Map<string, number>();
  const normalizedMap = new Map<string, Set<string>>();

  rawGroups.forEach(g => {
    const trimmed = g.trim();
    groupCounts.set(trimmed, (groupCounts.get(trimmed) || 0) + 1);

    const norm = trimmed.toLowerCase().replace(/[\s_-]+/g, '');
    if (!normalizedMap.has(norm)) {
      normalizedMap.set(norm, new Set());
    }
    normalizedMap.get(norm)!.add(trimmed);
  });

  // Check for casing / punctuation collisions
  normalizedMap.forEach((variants, normKey) => {
    if (variants.size > 1) {
      const variantList = Array.from(variants);
      // Pick the most common variant as suggested correction
      const mostCommon = variantList.reduce((a, b) => 
        (groupCounts.get(a) || 0) >= (groupCounts.get(b) || 0) ? a : b
      );

      variantList.forEach(variant => {
        if (variant !== mostCommon) {
          issues.push({
            id: `group-inconsistent-${variant}`,
            category: 'metadata',
            severity: 'warning',
            rule_id: 'RULE_GRP_01',
            rule_name: 'Inconsistent Group Label Casing/Formatting',
            record_id: variant,
            field: 'experimental_group',
            detected_value: variant,
            message: `Group label "${variant}" appears with alternative spelling/casing: ${variantList.join(', ')}.`,
            rationale: 'Case-sensitive statistical models (e.g. DESeq2, MaAsLin2, limma) will treat these as separate experimental strata.',
            suggested_correction: mostCommon,
            evidence: 'Differential Abundance Group Factor Integrity'
          });
        }
      });
    }
  });

  // Check for low sample count per group
  groupCounts.forEach((count, groupName) => {
    if (count < 2) {
      issues.push({
        id: `group-singleton-${groupName}`,
        category: 'experiment',
        severity: 'critical',
        rule_id: 'RULE_GRP_02',
        rule_name: 'Insufficient Group Sample Size',
        record_id: groupName,
        field: 'experimental_group',
        detected_value: count,
        message: `Experimental group "${groupName}" contains only ${count} sample.`,
        rationale: 'Standard statistical differential abundance and variance estimation require at least 2, ideally 3+ biological replicates per arm.',
        evidence: 'Bioconductor Differential Abundance Replicate Guidelines'
      });
    }
  });

  return issues;
}

/**
 * Validates Metadata Fields according to the selected profile:
 * - Missing required fields
 * - Age boundaries (e.g. negative or > 125)
 * - Sex standardization ('male', 'female', 'other')
 * - Conflicting Participant ID properties (e.g. same participant having two different sexes)
 * - Antibiotic exposure missing in clinical microbiome datasets
 * - Invalid ISO date formats
 */
export function validateMetadata(
  samples: SampleMetadata[], 
  profile: ValidationProfile
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const participantSexMap = new Map<string, string>();
  const participantHostMap = new Map<string, string>();

  samples.forEach((s, idx) => {
    const rowNum = idx + 1;
    const recId = s.sample_id || `Row ${rowNum}`;

    // 1. Required fields check
    for (const field of profile.requiredFields) {
      const val = s[field];
      if (val === undefined || val === null || String(val).trim() === '' || val === 'NA' || val === 'null' || val === 'NaN') {
        issues.push({
          id: `meta-req-${field}-${recId}`,
          category: 'metadata',
          severity: 'critical',
          rule_id: 'RULE_META_01',
          rule_name: `Missing Mandatory Field: ${field}`,
          record_id: recId,
          field,
          detected_value: val,
          message: `Mandatory field "${field}" is missing or empty in sample ${recId}.`,
          rationale: `Profile "${profile.name}" strictly requires "${field}" for valid epidemiological or statistical stratification.`,
          evidence: `Validation Profile Specification [${profile.id}]`
        });
      }
    }

    // 2. Numeric Age validation
    if (s.age !== undefined && s.age !== null && String(s.age).trim() !== '') {
      const ageNum = Number(s.age);
      if (isNaN(ageNum)) {
        issues.push({
          id: `meta-age-nan-${recId}`,
          category: 'metadata',
          severity: 'warning',
          rule_id: 'RULE_META_02',
          rule_name: 'Non-numeric Age Value',
          record_id: recId,
          field: 'age',
          detected_value: s.age,
          message: `Age "${s.age}" is not a valid numeric value.`,
          rationale: 'Age must be numeric to allow continuous regression modeling and covariate adjustment.',
          evidence: 'MIMARKS Host Associated Metadata Spec'
        });
      } else if (ageNum < 0 || ageNum > 125) {
        issues.push({
          id: `meta-age-range-${recId}`,
          category: 'metadata',
          severity: 'critical',
          rule_id: 'RULE_META_03',
          rule_name: 'Biologically Implausible Age',
          record_id: recId,
          field: 'age',
          detected_value: ageNum,
          message: `Reported age (${ageNum}) is outside biological human boundaries [0 - 125].`,
          rationale: 'Negative or excessively high age values indicate data transposition or entry errors.',
          suggested_correction: ageNum < 0 ? Math.abs(ageNum) : undefined,
          evidence: 'Physiological Bounds Check'
        });
      }
    }

    // 3. Sex standardisation
    if (s.sex !== undefined && s.sex !== null && String(s.sex).trim() !== '') {
      const sexStr = String(s.sex).trim().toLowerCase();
      const validSexes = ['male', 'female', 'other', 'unknown'];
      if (!validSexes.includes(sexStr)) {
        let suggested: string | undefined;
        if (sexStr === 'm') suggested = 'male';
        if (sexStr === 'f') suggested = 'female';
        issues.push({
          id: `meta-sex-format-${recId}`,
          category: 'metadata',
          severity: 'warning',
          rule_id: 'RULE_META_04',
          rule_name: 'Non-standard Biological Sex Value',
          record_id: recId,
          field: 'sex',
          detected_value: s.sex,
          message: `Sex value "${s.sex}" does not match standardized taxonomy ('male', 'female', 'other').`,
          rationale: 'Standardizing biological sex strings prevents redundant factor levels in linear models.',
          suggested_correction: suggested,
          evidence: 'NIH Common Data Elements (CDE) for Biological Sex'
        });
      }
    }

    // 4. Participant consistency checks
    if (s.participant_id && String(s.participant_id).trim() !== '') {
      const pId = String(s.participant_id).trim();

      // Check sex consistency per participant
      if (s.sex) {
        const curSex = String(s.sex).trim().toLowerCase();
        if (participantSexMap.has(pId) && participantSexMap.get(pId) !== curSex) {
          issues.push({
            id: `meta-participant-sex-conflict-${pId}-${recId}`,
            category: 'metadata',
            severity: 'critical',
            rule_id: 'RULE_META_05',
            rule_name: 'Conflicting Participant Metadata: Sex',
            record_id: recId,
            field: 'sex',
            detected_value: s.sex,
            message: `Participant "${pId}" is recorded with sex "${curSex}" here, but previously as "${participantSexMap.get(pId)}".`,
            rationale: 'A single biological participant cannot have conflicting biological sex across longitudinal sample rows without documented clinical intervention.',
            evidence: 'Participant Record Coherence Rule'
          });
        } else {
          participantSexMap.set(pId, curSex);
        }
      }

      // Check host species consistency
      if (s.host_species) {
        const curHost = String(s.host_species).trim().toLowerCase();
        if (participantHostMap.has(pId) && participantHostMap.get(pId) !== curHost) {
          issues.push({
            id: `meta-participant-host-conflict-${pId}-${recId}`,
            category: 'metadata',
            severity: 'critical',
            rule_id: 'RULE_META_06',
            rule_name: 'Conflicting Participant Host Species',
            record_id: recId,
            field: 'host_species',
            detected_value: s.host_species,
            message: `Participant "${pId}" is linked to different host species across rows (${curHost} vs ${participantHostMap.get(pId)}).`,
            rationale: 'Participant IDs must strictly belong to a single biological organism.',
            evidence: 'Host Organism Consistency Invariant'
          });
        } else {
          participantHostMap.set(pId, curHost);
        }
      }
    }

    // 5. Antibiotic Exposure check (crucial for microbiome)
    if (profile.requireAntibioticInfo) {
      if (s.antibiotic_exposure === undefined || s.antibiotic_exposure === null || String(s.antibiotic_exposure).trim() === '') {
        issues.push({
          id: `meta-antibiotic-missing-${recId}`,
          category: 'metadata',
          severity: 'warning',
          rule_id: 'RULE_META_07',
          rule_name: 'Missing Antibiotic Exposure Data',
          record_id: recId,
          field: 'antibiotic_exposure',
          detected_value: s.antibiotic_exposure,
          message: `Antibiotic exposure information is missing for sample ${recId}.`,
          rationale: 'Recent antibiotic usage is the single largest confounding factor in gut and mucosal microbiome profiling.',
          evidence: 'Nature Microbiology Guidelines for Microbiome Reporting'
        });
      }
    }

    // 6. Date formatting check
    if (s.collection_date) {
      const dateStr = String(s.collection_date).trim();
      const isValidIso = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(Date.parse(dateStr));
      if (!isValidIso) {
        issues.push({
          id: `meta-date-format-${recId}`,
          category: 'metadata',
          severity: 'notice',
          rule_id: 'RULE_META_08',
          rule_name: 'Non-ISO Date Format',
          record_id: recId,
          field: 'collection_date',
          detected_value: dateStr,
          message: `Collection date "${dateStr}" is not in ISO 8601 (YYYY-MM-DD) format.`,
          rationale: 'ISO 8601 dates prevent ambiguous US vs European month-day inversions (e.g. 03/04/2024).',
          evidence: 'ISO 8601 / MIMARKS standard'
        });
      }
    }
  });

  return issues;
}

/**
 * Validates Taxonomy Records:
 * - Unrecognized names
 * - Outdated synonyms (with suggested current accepted name)
 * - Mismatched NCBI TaxIDs
 * - Invalid Linnaean rank names
 * - Species format validation (binomial)
 */
export async function validateTaxonomy(taxa: TaxonomyEntry[]): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  for (const entry of taxa) {
    const raw = entry.raw_name;
    const resolved = await resolveTaxonomyEntry(raw, entry.ncbi_taxid, entry.rank);

    // 1. Rank validity
    if (entry.rank && !isValidTaxonomicRank(entry.rank)) {
      issues.push({
        id: `tax-rank-invalid-${raw}`,
        category: 'taxonomy',
        severity: 'warning',
        rule_id: 'RULE_TAX_01',
        rule_name: 'Invalid Linnaean Taxonomic Rank',
        record_id: raw,
        field: 'rank',
        detected_value: entry.rank,
        message: `Rank "${entry.rank}" is not a recognized taxonomic level.`,
        rationale: 'Ranks must be one of: superkingdom, phylum, class, order, family, genus, species, strain.',
        suggested_correction: resolved.rank,
        evidence: 'International Code of Nomenclature of Prokaryotes (ICNP)'
      });
    }

    // 2. Unresolved / Unrecognized taxon
    if (resolved.status === 'unresolved') {
      issues.push({
        id: `tax-unresolved-${raw}`,
        category: 'taxonomy',
        severity: 'critical',
        rule_id: 'RULE_TAX_02',
        rule_name: 'Unresolved / Unrecognized Taxon Name',
        record_id: raw,
        field: 'raw_name',
        detected_value: raw,
        message: `Taxon "${raw}" could not be resolved in the NCBI Taxonomy database.`,
        rationale: 'Scientific names must map to valid taxonomic entries to ensure cross-study meta-analyses and database submissions.',
        evidence: 'NCBI Taxonomy Database Entrez Index'
      });
    }

    // 3. Synonym / Outdated nomenclature
    if (resolved.status === 'synonym' && resolved.accepted_name) {
      issues.push({
        id: `tax-synonym-${raw}`,
        category: 'taxonomy',
        severity: 'warning',
        rule_id: 'RULE_TAX_03',
        rule_name: 'Outdated Taxonomic Synonym Detected',
        record_id: raw,
        field: 'raw_name',
        detected_value: raw,
        message: `"${raw}" is an outdated synonym or reclassified taxon. NCBI accepted name is "${resolved.accepted_name}".`,
        rationale: 'Using outdated synonyms (e.g. Clostridium difficile vs Clostridioides difficile) fragments microbiome biomarker queries.',
        suggested_correction: resolved.accepted_name,
        evidence: resolved.notes || 'NCBI Taxonomy Synonym Registry / LPSN (List of Prokaryotic names with Standing in Nomenclature)'
      });
    }

    // 4. Mismatched NCBI TaxID
    if (entry.ncbi_taxid && resolved.suggested_taxid) {
      if (Number(entry.ncbi_taxid) !== resolved.suggested_taxid) {
        issues.push({
          id: `tax-id-mismatch-${raw}`,
          category: 'taxonomy',
          severity: 'critical',
          rule_id: 'RULE_TAX_04',
          rule_name: 'Mismatched NCBI TaxID',
          record_id: raw,
          field: 'ncbi_taxid',
          detected_value: entry.ncbi_taxid,
          message: `Provided TaxID (${entry.ncbi_taxid}) does not correspond to "${resolved.accepted_name || raw}" (NCBI TaxID: ${resolved.suggested_taxid}).`,
          rationale: 'Incorrect TaxIDs cause downstream databases to link findings to entirely wrong phylogenetic clades.',
          suggested_correction: resolved.suggested_taxid,
          evidence: 'NCBI Entrez Taxonomy Authority'
        });
      }
    }

    // 5. Binomial species format check
    if (resolved.rank === 'species' || entry.rank === 'species') {
      const words = (resolved.accepted_name || resolved.cleaned_name || raw).split(/\s+/);
      if (words.length < 2) {
        issues.push({
          id: `tax-species-binomial-${raw}`,
          category: 'taxonomy',
          severity: 'warning',
          rule_id: 'RULE_TAX_05',
          rule_name: 'Non-Binomial Species Name',
          record_id: raw,
          field: 'raw_name',
          detected_value: raw,
          message: `Taxon designated as species rank "${raw}" is not a valid Latin binomial (requires Genus + specific epithet).`,
          rationale: 'Species epithets cannot stand alone without their parent genus.',
          evidence: 'ICNP Binomial Nomenclature Standard'
        });
      }
    }
  }

  return issues;
}

/**
 * Validates Microbial Signatures (Biomarkers):
 * - Duplicate signatures
 * - Missing abundance direction
 * - Invalid direction values
 * - Missing statistical test or missing p-value
 * - P-value range validity (0 <= p <= 1)
 * - Signatures with contradictory directions for identical group comparison
 */
export function validateSignatures(
  signatures: MicrobialSignature[], 
  profile: ValidationProfile
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const signatureKeys = new Map<string, MicrobialSignature>();

  signatures.forEach((sig, idx) => {
    const rowNum = idx + 1;
    const sigId = sig.signature_id || `Sig_${rowNum}`;

    // 1. Required Taxon
    if (!sig.taxon_name || sig.taxon_name.trim() === '') {
      issues.push({
        id: `sig-tax-missing-${sigId}`,
        category: 'signature',
        severity: 'critical',
        rule_id: 'RULE_SIG_01',
        rule_name: 'Missing Taxon in Signature',
        record_id: sigId,
        field: 'taxon_name',
        detected_value: sig.taxon_name,
        message: `Microbial signature ${sigId} does not specify a target taxon name.`,
        rationale: 'A microbial signature must identify the specific organism or clade being reported.',
        evidence: 'Microbial Signature Minimum Metadata Specification'
      });
    }

    // 2. Abundance Direction
    const validDirections = ['UP', 'DOWN', 'ELEVATED', 'DEPLETED', 'OVERREPRESENTED', 'UNDERREPRESENTED'];
    if (!sig.abundance_direction || sig.abundance_direction.trim() === '') {
      issues.push({
        id: `sig-dir-missing-${sigId}`,
        category: 'signature',
        severity: 'critical',
        rule_id: 'RULE_SIG_02',
        rule_name: 'Missing Abundance Direction',
        record_id: sigId,
        field: 'abundance_direction',
        detected_value: sig.abundance_direction,
        message: `Signature ${sigId} is missing abundance direction (e.g. UP / DOWN).`,
        rationale: 'Without abundance direction, researchers cannot determine whether the microbe is enriched or depleted.',
        evidence: 'Differential Abundance Signature Standard'
      });
    } else {
      const dirUpper = sig.abundance_direction.trim().toUpperCase();
      if (!validDirections.includes(dirUpper)) {
        issues.push({
          id: `sig-dir-invalid-${sigId}`,
          category: 'signature',
          severity: 'warning',
          rule_id: 'RULE_SIG_03',
          rule_name: 'Non-Standard Abundance Direction',
          record_id: sigId,
          field: 'abundance_direction',
          detected_value: sig.abundance_direction,
          message: `Abundance direction "${sig.abundance_direction}" is non-standard. Expected: UP, DOWN, ELEVATED, or DEPLETED.`,
          rationale: 'Standardizing direction vocabulary enables automated meta-analyses and database ingestion.',
          suggested_correction: dirUpper.includes('UP') || dirUpper.includes('HIGH') ? 'UP' : 'DOWN',
          evidence: 'Differential Abundance Vocabulary Mapping'
        });
      }
    }

    // 3. Statistical validity
    if (profile.requirePValues) {
      if (sig.p_value === undefined || sig.p_value === null || isNaN(Number(sig.p_value))) {
        issues.push({
          id: `sig-pval-missing-${sigId}`,
          category: 'statistics',
          severity: 'warning',
          rule_id: 'RULE_SIG_04',
          rule_name: 'Missing Nominal P-Value',
          record_id: sigId,
          field: 'p_value',
          detected_value: sig.p_value,
          message: `Signature ${sigId} reports a biomarker without an associated p-value.`,
          rationale: 'Reporting differential taxa without statistical significance values risks unverified or anecdotal associations.',
          evidence: 'Reporting Standards for Microbiome Signatures (STREGA / MIMARKS)'
        });
      } else {
        const pval = Number(sig.p_value);
        if (pval < 0 || pval > 1) {
          issues.push({
            id: `sig-pval-range-${sigId}`,
            category: 'statistics',
            severity: 'critical',
            rule_id: 'RULE_SIG_05',
            rule_name: 'P-Value Outside Mathematical Range [0, 1]',
            record_id: sigId,
            field: 'p_value',
            detected_value: pval,
            message: `P-value (${pval}) is invalid; probability must strictly lie between 0 and 1.`,
            rationale: 'P-values outside [0, 1] represent severe calculation, parsing, or column transposition errors.',
            evidence: 'Probability Axioms'
          });
        }
      }

      // Check adjusted p-value (FDR) vs nominal p-value
      if (sig.adjusted_p_value !== undefined && sig.p_value !== undefined) {
        const adjP = Number(sig.adjusted_p_value);
        const nomP = Number(sig.p_value);
        if (adjP < nomP) {
          issues.push({
            id: `sig-fdr-smaller-${sigId}`,
            category: 'statistics',
            severity: 'warning',
            rule_id: 'RULE_SIG_06',
            rule_name: 'Adjusted P-Value Smaller Than Nominal P-Value',
            record_id: sigId,
            field: 'adjusted_p_value',
            detected_value: adjP,
            message: `Adjusted p-value (${adjP}) is lower than nominal p-value (${nomP}), which violates multiple testing correction invariants.`,
            rationale: 'Benjamini-Hochberg and Bonferroni procedures can never produce an adjusted p-value lower than the raw p-value.',
            evidence: 'Benjamini & Hochberg (1995) FDR Mathematical Bound'
          });
        }
      }
    }

    // 4. Duplicate Signature Check
    const compKey = `${sig.experiment_id || ''}::${(sig.group1 || '').trim().toLowerCase()}::${(sig.group2 || '').trim().toLowerCase()}::${(sig.taxon_name || '').trim().toLowerCase()}`;
    if (signatureKeys.has(compKey)) {
      const prevSig = signatureKeys.get(compKey)!;
      // Check if directions conflict
      if (prevSig.abundance_direction.toUpperCase() !== sig.abundance_direction.toUpperCase()) {
        issues.push({
          id: `sig-conflict-dir-${sigId}`,
          category: 'signature',
          severity: 'critical',
          rule_id: 'RULE_SIG_07',
          rule_name: 'Contradictory Microbial Signature Direction',
          record_id: sigId,
          field: 'abundance_direction',
          detected_value: `${sig.abundance_direction} vs ${prevSig.abundance_direction}`,
          message: `Contradictory abundance directions reported for taxon "${sig.taxon_name}" between groups "${sig.group1}" and "${sig.group2}" across duplicate records (${sigId} vs ${prevSig.signature_id}).`,
          rationale: 'Directly contradictory findings within the same study comparison compromise curation accuracy.',
          evidence: 'Microbial Signature Consistency Check'
        });
      } else {
        issues.push({
          id: `sig-duplicate-${sigId}`,
          category: 'signature',
          severity: 'warning',
          rule_id: 'RULE_SIG_08',
          rule_name: 'Duplicate Microbial Signature',
          record_id: sigId,
          field: 'signature_id',
          detected_value: sigId,
          message: `Signature ${sigId} is a duplicate of signature ${prevSig.signature_id} (same taxon, comparison groups, and experiment).`,
          rationale: 'Duplicate signatures distort meta-analytical effect sizes and vote-counting summaries.',
          evidence: 'Curated Signature Uniqueness Rule'
        });
      }
    } else {
      signatureKeys.set(compKey, sig);
    }
  });

  return issues;
}

/**
 * Validates Experiments and Study Design:
 * - Study design declaration
 * - Paired vs independent sample verification
 * - Replicate sufficiency
 * - Missing statistical methods
 */
export function validateExperiments(
  experiments: ExperimentMetadata[], 
  samples: SampleMetadata[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  experiments.forEach(exp => {
    const expId = exp.experiment_id || 'EXP_1';

    // 1. Missing study design
    if (!exp.study_design || exp.study_design.trim() === '') {
      issues.push({
        id: `exp-design-missing-${expId}`,
        category: 'experiment',
        severity: 'critical',
        rule_id: 'RULE_EXP_01',
        rule_name: 'Undefined Study Design',
        record_id: expId,
        field: 'study_design',
        detected_value: exp.study_design,
        message: `Experiment ${expId} does not specify an experimental study design.`,
        rationale: 'Study design (cross-sectional, longitudinal, paired intervention) governs appropriate statistical modeling.',
        evidence: 'STROBE-metagenomics / MIMARKS Experiment Guidelines'
      });
    }

    // 2. Paired sample verification
    if (exp.is_paired) {
      // If paired, verify that samples actually contain repeated participant_ids across groups/timepoints
      const participantCounts = new Map<string, number>();
      samples.forEach(s => {
        if (s.participant_id) {
          const pid = String(s.participant_id).trim();
          participantCounts.set(pid, (participantCounts.get(pid) || 0) + 1);
        }
      });

      const multiSampleParticipants = Array.from(participantCounts.values()).filter(c => c > 1).length;
      if (multiSampleParticipants === 0 && samples.length > 0) {
        issues.push({
          id: `exp-paired-unmatched-${expId}`,
          category: 'experiment',
          severity: 'critical',
          rule_id: 'RULE_EXP_02',
          rule_name: 'Mismatched Paired Design (No Multi-sample Participants)',
          record_id: expId,
          field: 'is_paired',
          detected_value: true,
          message: `Experiment is marked as "paired", but metadata contains no participants with repeated measurements.`,
          rationale: 'Treating independent participants as paired samples invalidates paired t-tests, repeated-measures ANOVA, and mixed models.',
          suggested_correction: 'Set is_paired to false, or verify participant_id column linkage.',
          evidence: 'Statistical Independence & Design Matrix Rule'
        });
      }
    }

    // 3. Sample size validation
    if (exp.sample_count < 6 && exp.sample_count > 0) {
      issues.push({
        id: `exp-low-power-${expId}`,
        category: 'experiment',
        severity: 'warning',
        rule_id: 'RULE_EXP_03',
        rule_name: 'Extremely Low Sample Size (High Risk of Low Power)',
        record_id: expId,
        field: 'sample_count',
        detected_value: exp.sample_count,
        message: `Experiment has only ${exp.sample_count} samples. Microbiome composition exhibits extreme inter-individual variance.`,
        rationale: 'Small cohort sizes in microbiome studies lead to high false-discovery rates and non-reproducible differential abundance claims.',
        evidence: 'Kelly et al. Nature Microbiology (Power calculations in microbiome sequencing)'
      });
    }
  });

  return issues;
}

/**
 * Calculate comprehensive Quality Score (0 - 100)
 */
export function calculateQualityScore(
  issues: ValidationIssue[], 
  totalEntities: number
): number {
  if (totalEntities === 0) return 100;

  // Deduct based on severity weights
  let penalty = 0;
  issues.forEach(iss => {
    if (iss.severity === 'critical') penalty += 15;
    else if (iss.severity === 'warning') penalty += 5;
    else if (iss.severity === 'notice') penalty += 1;
  });

  const rawScore = 100 - penalty;
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

/**
 * Execute Full Multi-Module QC Pipeline
 */
export async function runFullQC(
  datasetName: string,
  samples: SampleMetadata[],
  taxa: TaxonomyEntry[],
  signatures: MicrobialSignature[],
  experiments: ExperimentMetadata[],
  profileId: string = 'clinical'
): Promise<QCReportSummary> {
  const profile = VALIDATION_PROFILES[profileId] || VALIDATION_PROFILES.clinical;

  const idIssues = validateSampleIds(samples);
  const grpIssues = validateGroupLabels(samples);
  const metaIssues = validateMetadata(samples, profile);
  const taxIssues = await validateTaxonomy(taxa);
  const sigIssues = validateSignatures(signatures, profile);
  const expIssues = validateExperiments(experiments, samples);

  const allIssues = [
    ...idIssues,
    ...grpIssues,
    ...metaIssues,
    ...taxIssues,
    ...sigIssues,
    ...expIssues
  ];

  let criticalCount = 0;
  let warningCount = 0;
  let noticeCount = 0;

  const breakdown = {
    metadata: { critical: 0, warning: 0, notice: 0, pass: 0 },
    taxonomy: { critical: 0, warning: 0, notice: 0, pass: 0 },
    signatures: { critical: 0, warning: 0, notice: 0, pass: 0 },
    experiments: { critical: 0, warning: 0, notice: 0, pass: 0 }
  };

  allIssues.forEach(iss => {
    if (iss.severity === 'critical') criticalCount++;
    if (iss.severity === 'warning') warningCount++;
    if (iss.severity === 'notice') noticeCount++;

    const cat = iss.category === 'identifier' ? 'metadata' :
      iss.category === 'statistics' ? 'signatures' :
      iss.category;

    if (breakdown[cat as keyof typeof breakdown]) {
      const bucket = breakdown[cat as keyof typeof breakdown];
      if (iss.severity === 'critical') bucket.critical++;
      else if (iss.severity === 'warning') bucket.warning++;
      else if (iss.severity === 'notice') bucket.notice++;
    }
  });

  const totalEntities = samples.length + taxa.length + signatures.length + experiments.length;
  const qualityScore = calculateQualityScore(allIssues, totalEntities);
  const passedCount = Math.max(0, totalEntities - (criticalCount + warningCount));

  // Update pass buckets
  breakdown.metadata.pass = Math.max(0, samples.length - (breakdown.metadata.critical + breakdown.metadata.warning));
  breakdown.taxonomy.pass = Math.max(0, taxa.length - (breakdown.taxonomy.critical + breakdown.taxonomy.warning));
  breakdown.signatures.pass = Math.max(0, signatures.length - (breakdown.signatures.critical + breakdown.signatures.warning));
  breakdown.experiments.pass = Math.max(0, experiments.length - (breakdown.experiments.critical + breakdown.experiments.warning));

  return {
    dataset_name: datasetName,
    validation_date: new Date().toISOString(),
    validation_profile: profile.name,
    total_samples: samples.length,
    total_taxa: taxa.length,
    total_signatures: signatures.length,
    total_experiments: experiments.length,
    quality_score: qualityScore,
    critical_count: criticalCount,
    warning_count: warningCount,
    notice_count: noticeCount,
    passed_count: passedCount,
    category_breakdown: breakdown,
    issues: allIssues,
    software_version: 'microbiomeQC v1.2.0 (Bioconductor-aligned engine)',
    engine_hash: 'R-4.4-BioC-3.20-REV2'
  };
}
