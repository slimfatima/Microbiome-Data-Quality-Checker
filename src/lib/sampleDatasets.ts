/**
 * Curated Benchmark Microbiome Datasets
 * Includes realistic datasets with intentional curation flaws for validation demonstration,
 * as well as a pristine 100% verified baseline.
 */

import { DatasetBundle } from '../types/microbiome';

export const SAMPLE_DATASETS: Record<string, DatasetBundle> = {
  crc_cohort: {
    id: 'crc_cohort',
    name: 'Colorectal Cancer vs Healthy Gut Study (CRC-104)',
    description: 'Human stool metagenomics cohort with realistic metadata inconsistencies, outdated taxonomy, duplicate sample IDs, and conflicting signatures.',
    profile: 'clinical',
    uploaded_at: '2026-10-30T14:22:00Z',
    samples: [
      {
        sample_id: 'CRC_001',
        study_id: 'PRJNA514228',
        participant_id: 'PT_001',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Colorectal Neoplasms',
        experimental_group: 'CRC',
        collection_timepoint: 'T0',
        age: 64,
        sex: 'male',
        antibiotic_exposure: false,
        treatment: 'chemotherapy-naive',
        study_design: 'case_control',
        collection_date: '2023-04-12',
        sequencing_platform: 'Illumina NovaSeq 6000',
        library_layout: 'paired'
      },
      {
        sample_id: 'CRC_002',
        study_id: 'PRJNA514228',
        participant_id: 'PT_002',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Colorectal Neoplasms',
        experimental_group: 'CRC',
        collection_timepoint: 'T0',
        age: 71,
        sex: 'female',
        antibiotic_exposure: false,
        treatment: 'resection',
        study_design: 'case_control',
        collection_date: '2023-04-14',
        sequencing_platform: 'Illumina NovaSeq 6000',
        library_layout: 'paired'
      },
      {
        sample_id: 'CRC_003',
        study_id: 'PRJNA514228',
        participant_id: 'PT_003',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Healthy Control',
        experimental_group: 'Control',
        collection_timepoint: 'T0',
        age: 58,
        sex: 'female',
        antibiotic_exposure: false,
        treatment: 'none',
        study_design: 'case_control',
        collection_date: '2023-05-01',
        sequencing_platform: 'Illumina NovaSeq 6000',
        library_layout: 'paired'
      },
      {
        sample_id: 'CRC_004',
        study_id: 'PRJNA514228',
        participant_id: 'PT_004',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Healthy Control',
        experimental_group: 'control', // Inconsistent casing!
        collection_timepoint: 'T0',
        age: 62,
        sex: 'male',
        antibiotic_exposure: false,
        treatment: 'none',
        study_design: 'case_control',
        collection_date: '2023-05-02',
        sequencing_platform: 'Illumina NovaSeq 6000',
        library_layout: 'paired'
      },
      {
        sample_id: 'CRC_005',
        study_id: 'PRJNA514228',
        participant_id: 'PT_005',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Colorectal Neoplasms',
        experimental_group: 'CRC',
        collection_timepoint: 'T0',
        age: -52, // Negative age error!
        sex: 'male',
        antibiotic_exposure: false,
        treatment: 'none',
        study_design: 'case_control',
        collection_date: '05/18/2023', // Non-ISO date!
        sequencing_platform: 'Illumina NovaSeq 6000',
        library_layout: 'paired'
      },
      {
        sample_id: 'CRC_006 ', // Trailing whitespace!
        study_id: 'PRJNA514228',
        participant_id: 'PT_006',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Colorectal Neoplasms',
        experimental_group: 'CRC',
        collection_timepoint: 'T0',
        age: 69,
        sex: 'M', // Non-standard sex!
        antibiotic_exposure: '', // Missing antibiotic!
        treatment: 'none',
        study_design: 'case_control',
        collection_date: '2023-06-01',
        sequencing_platform: 'Illumina NovaSeq 6000',
        library_layout: 'paired'
      },
      {
        sample_id: 'CRC_007',
        study_id: 'PRJNA514228',
        participant_id: 'PT_007',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Adenoma',
        experimental_group: 'Adenoma',
        collection_timepoint: 'T0',
        age: 55,
        sex: 'female',
        antibiotic_exposure: false,
        treatment: 'none',
        study_design: 'case_control',
        collection_date: '2023-06-05',
        sequencing_platform: 'Illumina NovaSeq 6000',
        library_layout: 'paired'
      },
      {
        sample_id: 'CRC_008',
        study_id: 'PRJNA514228',
        participant_id: 'PT_008',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Healthy Control',
        experimental_group: 'CTRL', // Third variant of control label!
        collection_timepoint: 'T0',
        age: 60,
        sex: 'female',
        antibiotic_exposure: false,
        treatment: 'none',
        study_design: 'case_control',
        collection_date: '2023-06-10',
        sequencing_platform: 'Illumina NovaSeq 6000',
        library_layout: 'paired'
      },
      {
        sample_id: 'CRC_009',
        study_id: 'PRJNA514228',
        participant_id: 'PT_009',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Adenoma',
        experimental_group: 'Adenoma',
        collection_timepoint: 'T0',
        age: 63,
        sex: 'male',
        antibiotic_exposure: true,
        treatment: 'amoxicillin',
        study_design: 'case_control',
        collection_date: '2023-06-12',
        sequencing_platform: 'Illumina NovaSeq 6000',
        library_layout: 'paired'
      },
      {
        sample_id: 'CRC_009', // Duplicate sample ID!
        study_id: 'PRJNA514228',
        participant_id: 'PT_009_rep',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Adenoma',
        experimental_group: 'Adenoma',
        collection_timepoint: 'T0',
        age: 63,
        sex: 'male',
        antibiotic_exposure: true,
        treatment: 'amoxicillin',
        study_design: 'case_control',
        collection_date: '2023-06-12',
        sequencing_platform: 'Illumina NovaSeq 6000',
        library_layout: 'paired'
      },
      {
        sample_id: 'CRC_010',
        study_id: 'PRJNA514228',
        participant_id: 'PT_010',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Colorectal Neoplasms',
        experimental_group: 'CRC',
        collection_timepoint: 'T0',
        age: 74,
        sex: 'female',
        antibiotic_exposure: false,
        treatment: 'none',
        study_design: 'case_control',
        collection_date: '2023-06-20',
        sequencing_platform: 'Illumina NovaSeq 6000',
        library_layout: 'paired'
      },
      {
        sample_id: 'CRC_011',
        study_id: 'PRJNA514228',
        participant_id: 'PT_010', // Reusing PT_010 but with conflicting sex!
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Colorectal Neoplasms',
        experimental_group: 'CRC',
        collection_timepoint: 'T1',
        age: 74,
        sex: 'male', // Sex conflict for PT_010!
        antibiotic_exposure: false,
        treatment: 'adjuvant',
        study_design: 'case_control',
        collection_date: '2023-08-20',
        sequencing_platform: 'Illumina NovaSeq 6000',
        library_layout: 'paired'
      }
    ],
    taxa: [
      {
        raw_name: 'Fusobacterium nucleatum',
        ncbi_taxid: 851,
        rank: 'species',
        status: 'verified'
      },
      {
        raw_name: 'Faecalibacterium prausnitzii',
        ncbi_taxid: 853,
        rank: 'species',
        status: 'verified'
      },
      {
        raw_name: 'Clostridium difficile', // Outdated synonym!
        ncbi_taxid: 1496,
        rank: 'species',
        status: 'synonym'
      },
      {
        raw_name: 'Bacteroides fragilis',
        ncbi_taxid: 9999999, // Mismatched TaxID!
        rank: 'species',
        status: 'rank_mismatch'
      },
      {
        raw_name: 'Propionibacterium acnes', // Outdated synonym!
        ncbi_taxid: 1747,
        rank: 'species',
        status: 'synonym'
      },
      {
        raw_name: 'Bacteroidetes', // Outdated phylum name!
        ncbi_taxid: 976,
        rank: 'phylum',
        status: 'synonym'
      },
      {
        raw_name: 'Xylococcus_unclassified_xyz99', // Unresolved taxon!
        rank: 'species',
        status: 'unresolved'
      }
    ],
    signatures: [
      {
        signature_id: 'SIG_CRC_01',
        study_id: 'PRJNA514228',
        experiment_id: 'EXP_CRC_1',
        taxon_name: 'Fusobacterium nucleatum',
        ncbi_taxid: 851,
        taxonomic_rank: 'species',
        group1: 'CRC',
        group2: 'Control',
        condition: 'Colorectal Neoplasms',
        abundance_direction: 'UP',
        statistical_method: 'DESeq2 (Wald test)',
        p_value: 0.00012,
        adjusted_p_value: 0.0034,
        effect_size: 2.84,
        effect_size_metric: 'log2FC',
        source_reference: 'Figure 2A'
      },
      {
        signature_id: 'SIG_CRC_02',
        study_id: 'PRJNA514228',
        experiment_id: 'EXP_CRC_1',
        taxon_name: 'Faecalibacterium prausnitzii',
        ncbi_taxid: 853,
        taxonomic_rank: 'species',
        group1: 'CRC',
        group2: 'Control',
        condition: 'Colorectal Neoplasms',
        abundance_direction: 'DOWN',
        statistical_method: 'ANCOM-BC',
        p_value: 0.00045,
        adjusted_p_value: 0.0089,
        effect_size: -2.12,
        effect_size_metric: 'W-statistic',
        source_reference: 'Table S3'
      },
      {
        signature_id: 'SIG_CRC_03',
        study_id: 'PRJNA514228',
        experiment_id: 'EXP_CRC_1',
        taxon_name: 'Fusobacterium nucleatum', // Duplicate signature with conflicting direction!
        ncbi_taxid: 851,
        taxonomic_rank: 'species',
        group1: 'CRC',
        group2: 'Control',
        condition: 'Colorectal Neoplasms',
        abundance_direction: 'DOWN', // CONTRADICTS SIG_CRC_01!
        statistical_method: 'Wilcoxon rank-sum',
        p_value: 1.45, // Invalid p-value > 1!
        adjusted_p_value: 0.0001, // Adjusted < nominal!
        effect_size: -1.2,
        source_reference: 'Abstract text'
      },
      {
        signature_id: 'SIG_CRC_04',
        study_id: 'PRJNA514228',
        experiment_id: 'EXP_CRC_1',
        taxon_name: 'Bacteroides fragilis',
        ncbi_taxid: 817,
        taxonomic_rank: 'species',
        group1: 'CRC',
        group2: 'Control',
        abundance_direction: 'ELEVATED',
        statistical_method: 'MaAsLin2',
        p_value: 0.021,
        adjusted_p_value: 0.084,
        effect_size: 1.41,
        source_reference: 'Figure 3B'
      }
    ],
    experiments: [
      {
        study_id: 'PRJNA514228',
        experiment_id: 'EXP_CRC_1',
        study_title: 'Metagenomic Biomarkers in Colorectal Carcinoma',
        study_design: 'case_control',
        experimental_arms: ['CRC', 'Adenoma', 'Control'],
        sample_count: 12,
        is_paired: false,
        repeated_measures: false,
        biological_sample_type: 'fecal',
        sequencing_target: 'shotgun_metagenomics',
        statistical_test_planned: 'DESeq2 & ANCOM-BC'
      }
    ]
  },

  longitudinal_infant: {
    id: 'longitudinal_infant',
    name: 'Infant Gut Longitudinal Cohort & Antibiotics (INF-200)',
    description: 'Pediatric cohort tracking microbiome colonization across 3 time points (M0, M6, M12) with antibiotic interventions.',
    profile: 'longitudinal',
    uploaded_at: '2026-10-31T01:10:00Z',
    samples: [
      {
        sample_id: 'INF_101_M0',
        study_id: 'PRJNA662190',
        participant_id: 'INF_101',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Healthy',
        experimental_group: 'Exclusively Breastfed',
        collection_timepoint: 'M0',
        age: 0.1,
        sex: 'female',
        antibiotic_exposure: false,
        study_design: 'longitudinal',
        collection_date: '2024-01-10'
      },
      {
        sample_id: 'INF_101_M6',
        study_id: 'PRJNA662190',
        participant_id: 'INF_101',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Healthy',
        experimental_group: 'Mixed Feeding',
        collection_timepoint: 'M6',
        age: 0.5,
        sex: 'female',
        antibiotic_exposure: true,
        treatment: 'oral amoxicillin',
        study_design: 'longitudinal',
        collection_date: '2024-07-10'
      },
      {
        sample_id: 'INF_102_M0',
        study_id: 'PRJNA662190',
        participant_id: 'INF_102',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Healthy',
        experimental_group: 'Formula Fed',
        collection_timepoint: 'M0',
        age: 0.1,
        sex: 'male',
        antibiotic_exposure: false,
        study_design: 'longitudinal',
        collection_date: '2024-01-15'
      },
      {
        sample_id: 'INF_102_M6',
        study_id: 'PRJNA662190',
        participant_id: 'INF_102',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Healthy',
        experimental_group: 'Formula Fed',
        collection_timepoint: 'M6',
        age: 0.5,
        sex: 'male',
        antibiotic_exposure: false,
        study_design: 'longitudinal',
        collection_date: '2024-07-15'
      }
    ],
    taxa: [
      {
        raw_name: 'Bifidobacterium longum',
        ncbi_taxid: 2168,
        rank: 'species',
        status: 'verified'
      },
      {
        raw_name: 'Bifidobacterium adolescentis',
        ncbi_taxid: 1680,
        rank: 'species',
        status: 'verified'
      },
      {
        raw_name: 'Escherichia coli',
        ncbi_taxid: 562,
        rank: 'species',
        status: 'verified'
      }
    ],
    signatures: [
      {
        signature_id: 'SIG_INF_01',
        study_id: 'PRJNA662190',
        experiment_id: 'EXP_INF_1',
        taxon_name: 'Bifidobacterium longum',
        ncbi_taxid: 2168,
        taxonomic_rank: 'species',
        group1: 'Exclusively Breastfed',
        group2: 'Formula Fed',
        abundance_direction: 'UP',
        statistical_method: 'Linear Mixed Model (lme4)',
        p_value: 0.002,
        adjusted_p_value: 0.015,
        effect_size: 3.4,
        source_reference: 'Figure 1B'
      }
    ],
    experiments: [
      {
        study_id: 'PRJNA662190',
        experiment_id: 'EXP_INF_1',
        study_title: 'Longitudinal Assembly of the Infant Gut Microbiome',
        study_design: 'longitudinal',
        experimental_arms: ['Exclusively Breastfed', 'Formula Fed'],
        sample_count: 4,
        is_paired: true,
        repeated_measures: true,
        biological_sample_type: 'fecal',
        sequencing_target: '16S_V4'
      }
    ]
  },

  pristine_validated: {
    id: 'pristine_validated',
    name: 'MIMARKS-Compliant Pristine Benchmark (CLEAN-100)',
    description: 'Fully curated reference dataset with 100% compliant metadata, verified NCBI TaxIDs, standard Linnaean ranks, and valid statistical parameters.',
    profile: 'clinical',
    uploaded_at: '2026-10-31T02:00:00Z',
    samples: [
      {
        sample_id: 'VAL_001',
        study_id: 'PRJNA900001',
        participant_id: 'SUB_01',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Crohns Disease',
        experimental_group: 'Active Disease',
        collection_timepoint: 'Baseline',
        age: 34,
        sex: 'female',
        antibiotic_exposure: false,
        treatment: 'anti-TNF',
        study_design: 'cross_sectional',
        collection_date: '2024-03-01',
        sequencing_platform: 'Illumina NovaSeq 6000',
        library_layout: 'paired'
      },
      {
        sample_id: 'VAL_002',
        study_id: 'PRJNA900001',
        participant_id: 'SUB_02',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Crohns Disease',
        experimental_group: 'Active Disease',
        collection_timepoint: 'Baseline',
        age: 29,
        sex: 'male',
        antibiotic_exposure: false,
        treatment: 'anti-TNF',
        study_design: 'cross_sectional',
        collection_date: '2024-03-02',
        sequencing_platform: 'Illumina NovaSeq 6000',
        library_layout: 'paired'
      },
      {
        sample_id: 'VAL_003',
        study_id: 'PRJNA900001',
        participant_id: 'SUB_03',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Healthy Control',
        experimental_group: 'Healthy Control',
        collection_timepoint: 'Baseline',
        age: 31,
        sex: 'female',
        antibiotic_exposure: false,
        treatment: 'none',
        study_design: 'cross_sectional',
        collection_date: '2024-03-05',
        sequencing_platform: 'Illumina NovaSeq 6000',
        library_layout: 'paired'
      },
      {
        sample_id: 'VAL_004',
        study_id: 'PRJNA900001',
        participant_id: 'SUB_04',
        host_species: 'Homo sapiens',
        body_site: 'feces',
        sample_type: 'stool',
        disease_condition: 'Healthy Control',
        experimental_group: 'Healthy Control',
        collection_timepoint: 'Baseline',
        age: 36,
        sex: 'male',
        antibiotic_exposure: false,
        treatment: 'none',
        study_design: 'cross_sectional',
        collection_date: '2024-03-06',
        sequencing_platform: 'Illumina NovaSeq 6000',
        library_layout: 'paired'
      }
    ],
    taxa: [
      {
        raw_name: 'Faecalibacterium prausnitzii',
        ncbi_taxid: 853,
        accepted_name: 'Faecalibacterium prausnitzii',
        rank: 'species',
        status: 'verified'
      },
      {
        raw_name: 'Akkermansia muciniphila',
        ncbi_taxid: 239935,
        accepted_name: 'Akkermansia muciniphila',
        rank: 'species',
        status: 'verified'
      },
      {
        raw_name: 'Roseburia intestinalis',
        ncbi_taxid: 166486,
        accepted_name: 'Roseburia intestinalis',
        rank: 'species',
        status: 'verified'
      }
    ],
    signatures: [
      {
        signature_id: 'SIG_VAL_01',
        study_id: 'PRJNA900001',
        experiment_id: 'EXP_VAL_1',
        taxon_name: 'Faecalibacterium prausnitzii',
        ncbi_taxid: 853,
        taxonomic_rank: 'species',
        group1: 'Active Disease',
        group2: 'Healthy Control',
        condition: 'Crohns Disease',
        abundance_direction: 'DOWN',
        statistical_method: 'DESeq2 (Wald test)',
        p_value: 0.0003,
        adjusted_p_value: 0.0018,
        effect_size: -2.75,
        effect_size_metric: 'log2FC',
        source_reference: 'Table 2'
      }
    ],
    experiments: [
      {
        study_id: 'PRJNA900001',
        experiment_id: 'EXP_VAL_1',
        study_title: 'Mucosal Immunity and Microbiome Integrity in Crohns Disease',
        study_design: 'case_control',
        experimental_arms: ['Active Disease', 'Healthy Control'],
        sample_count: 4,
        is_paired: false,
        repeated_measures: false,
        biological_sample_type: 'fecal',
        sequencing_target: 'shotgun_metagenomics',
        statistical_test_planned: 'DESeq2'
      }
    ]
  }
};
