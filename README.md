# Microbiome Data Quality Checker (`microbiomeQC`)

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](https://opensource.org/licenses/MIT)
[![Bioconductor Ready](https://img.shields.io/badge/Bioconductor-Package%20Ready-blue.svg)](https://bioconductor.org)
[![NCBI Taxonomy](https://img.shields.io/badge/NCBI-Taxonomy%20Integrated-emerald.svg)](https://www.ncbi.nlm.nih.gov/taxonomy)
[![TypeScript / React](https://img.shields.io/badge/Full--Stack-React%2019%20%2B%20Express-0284c7.svg)](https://react.dev)

A publication-grade scientific data validation platform and R package designed to identify errors, inconsistencies, and nomenclatural drift in microbiome datasets before statistical modeling, publication, or public repository submission.

---

## 1. Vision & Core Problems Solved

Microbiome datasets (16S rRNA gene sequencing, shotgun metagenomics, metabolomics, and microbial biomarkers) are notoriously prone to metadata transcription errors, outdated taxonomy, and statistical misinterpretations.

**Microbiome QC** systematically checks:
1. **Missing or Incomplete Sample Metadata**: Unrecorded antibiotic exposure, missing timepoints, or unmapped body sites.
2. **Inconsistent Sample Identifiers & Group Labels**: Untrimmed whitespace, Excel auto-date truncation bugs, casing collisions (e.g. `Control` vs `control` vs `CTRL`).
3. **Invalid or Unrecognized Taxonomic Names**: Unindexed strings, non-binomial species formatting, and typos.
4. **Outdated Synonyms & ICNP Priority Reclassifications**: e.g., *Clostridium difficile* &rarr; *Clostridioides difficile*, *Propionibacterium acnes* &rarr; *Cutibacterium acnes*, *Bacteroidetes* &rarr; *Bacteroidota*, *Firmicutes* &rarr; *Bacillota*.
5. **NCBI Taxonomy ID Mismatches**: Catches incorrect TaxIDs that map to unintended phylogenetic clades.
6. **Microbial Signature Direction & Contradiction**: Identifies biomarker findings with contradictory directions (e.g., *Fusobacterium nucleatum* reported as both elevated and depleted in the same contrast).
7. **Statistical Domain Invariants**: Enforces p-value mathematical boundaries $[0, 1]$ and flags multiple-testing violations ($q\text{-value} < p\text{-value}$).
8. **Paired vs. Independent Design Conflicts**: Flags when studies declared as paired before-after lack participant-level repeated measurements.
9. **Study Power & Group Replication**: Alerts researchers when experimental strata contain single-sample replicates.
10. **Immutable Curatorial Audit Trail**: Ensures no research dataset is silently overwritten.

---

## 2. Architecture & Modules

```
microbiome-qc/
├── R/                          # R Package validation functions (roxygen2)
│   ├── validate_metadata.R
│   ├── validate_taxonomy.R
│   ├── validate_signatures.R
│   ├── validate_experiments.R
│   └── qc_report.R
├── tests/testthat/             # R unit tests
├── vignettes/                  # Bioconductor tutorial vignette
├── src/                        # Full-Stack React + TypeScript Workbench
│   ├── components/             # Dashboard, Upload, Taxonomy Checker, Signatures, Reports
│   ├── lib/                    # NCBI Taxonomy E-utilities client & offline database
│   └── types/                  # Rigorous domain models and schemas
├── server.ts                   # Express server with NCBI Taxonomy proxy
└── package.json
```

---

## 3. R Package: `microbiomeQC`

### Installation

```r
# Install development version from GitHub
if (!requireNamespace("devtools", quietly = TRUE))
    install.packages("devtools")

devtools::install_github("microbiome-qc/microbiomeQC")
```

### Quick Usage

```r
library(microbiomeQC)
library(readr)

# 1. Load your study metadata
metadata <- read_csv("sample_metadata.csv")

# 2. Run clinical validation profile
issues <- validate_metadata(metadata, profile = "clinical")
print(issues)

# 3. Validate taxonomy against NCBI
taxonomy <- read_csv("taxonomy_table.csv")
tax_issues <- validate_taxonomy(taxonomy, check_online = TRUE)

# 4. Generate structured Quality-Control Dossier
report <- generate_qc_report(issues, dataset_name = "CRC Metagenomics Study")
cat("Quality Score:", report$quality_score, "/ 100\n")

# 5. Export reproducible report
export_qc_report(report, file = "qc_report.html", format = "html")
export_qc_report(report, file = "qc_report.json", format = "json")
```

---

## 4. Full-Stack Web Application

The interactive web console provides:
- **Researcher Dashboard**: Live quality score (0–100), severity distribution, and issue breakdown across metadata, taxonomy, signatures, and experiments.
- **Upload & Ingestion Center**: Drag-and-drop CSV/TSV/JSON import, automatic delimiter sniffing, and downloadable MIMARKS templates.
- **Taxonomy Validation Engine**: Real-time NCBI Entrez E-utilities querying, synonym resolution, and one-click accepted name batch standardization.
- **Microbial Signature Inspector**: Differential abundance Volcano Plot (Effect size vs $-\log_{10}(p)$) highlighting statistical defects and contradictory findings.
- **Curatorial Action Workflow**: Inspect flagged records, view biological rationale, accept suggested fixes, or log manual overrides to the audit trail.
- **QC Dossier Export**: Downloadable self-contained interactive HTML reports, machine-readable JSON payloads, and CSV issue summaries.

---

## 5. Scientific Principles & Non-Destructive Policy

1. **Never Fabricate Data**: Missing values are never hallucinated. Unindexed taxa remain *Unresolved*.
2. **Never Silently Overwrite**: Raw research files are preserved; every modification requires explicit researcher confirmation and is recorded in the curatorial audit trail.
3. **Transparent Evidence**: Every flagged issue cites its bioinformatic or epidemiological evidence base (MIMARKS, ICNP, STREGA).

---

## 6. License

This project is licensed under the **MIT License**.
