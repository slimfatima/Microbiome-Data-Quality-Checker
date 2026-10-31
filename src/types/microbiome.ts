/**
 * Microbiome Data Quality Checker (microbiomeQC)
 * Domain Models and Validation Type Definitions
 */

export type Severity = 'critical' | 'warning' | 'notice' | 'pass';

export type ValidationCategory = 
  | 'metadata' 
  | 'taxonomy' 
  | 'signature' 
  | 'experiment' 
  | 'identifier' 
  | 'statistics';

export type TaxonomicRank = 
  | 'superkingdom'
  | 'phylum' 
  | 'class' 
  | 'order' 
  | 'family' 
  | 'genus' 
  | 'species' 
  | 'strain'
  | 'unranked';

export interface SampleMetadata {
  sample_id: string;
  study_id: string;
  participant_id?: string;
  host_species?: string;
  body_site?: string;
  sample_type?: string;
  disease_condition?: string;
  experimental_group?: string;
  collection_timepoint?: string | number;
  age?: number | string;
  sex?: 'male' | 'female' | 'other' | string;
  antibiotic_exposure?: boolean | string;
  treatment?: string;
  study_design?: 'cross_sectional' | 'longitudinal' | 'intervention' | 'cohort' | string;
  collection_date?: string;
  sequencing_platform?: string;
  library_layout?: 'paired' | 'single' | string;
  [key: string]: any;
}

export interface TaxonomyEntry {
  raw_name: string;
  cleaned_name?: string;
  ncbi_taxid?: number | string;
  suggested_taxid?: number;
  accepted_name?: string;
  rank?: TaxonomicRank;
  status: 'verified' | 'synonym' | 'unresolved' | 'ambiguous' | 'rank_mismatch';
  lineage?: string[];
  authority_source?: string;
  notes?: string;
}

export interface MicrobialSignature {
  signature_id: string;
  study_id: string;
  experiment_id: string;
  taxon_name: string;
  ncbi_taxid?: number | string;
  taxonomic_rank?: TaxonomicRank;
  group1: string;
  group2: string;
  condition?: string;
  abundance_direction: 'UP' | 'DOWN' | 'ELEVATED' | 'DEPLETED' | 'OVERREPRESENTED' | string;
  statistical_method?: string;
  p_value?: number;
  adjusted_p_value?: number;
  effect_size?: number; // log2 fold change, etc.
  effect_size_metric?: string;
  source_reference?: string;
  source_figure_table?: string;
  description?: string;
}

export interface ExperimentMetadata {
  study_id: string;
  experiment_id: string;
  study_title: string;
  study_design: 'cross_sectional' | 'longitudinal' | 'intervention' | 'case_control' | 'paired_before_after' | string;
  experimental_arms: string[];
  sample_count: number;
  is_paired: boolean;
  repeated_measures: boolean;
  biological_sample_type: string;
  sequencing_target: '16S_V4' | '16S_V3V4' | 'ITS' | 'shotgun_metagenomics' | string;
  statistical_test_planned?: string;
}

export interface ValidationIssue {
  id: string;
  category: ValidationCategory;
  severity: Severity;
  rule_id: string;
  rule_name: string;
  record_id: string; // sample_id, signature_id, or taxon_name
  field: string;
  detected_value: any;
  message: string;
  rationale: string;
  suggested_correction?: any;
  evidence: string;
  correction_status?: 'pending' | 'accepted' | 'rejected' | 'manually_edited';
  edited_value?: any;
  user_note?: string;
}

export interface ValidationProfile {
  id: 'clinical' | 'longitudinal' | 'intervention' | 'minimal_mimarks' | 'custom';
  name: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  strictTaxonomy: boolean;
  requirePValues: boolean;
  requireAntibioticInfo: boolean;
  minSamplesPerGroup: number;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  issue_id: string;
  record_id: string;
  field: string;
  original_value: any;
  updated_value: any;
  action: 'accepted' | 'rejected' | 'manual_edit';
  user_note?: string;
  user_email: string;
}

export interface QCReportSummary {
  dataset_name: string;
  validation_date: string;
  validation_profile: string;
  total_samples: number;
  total_taxa: number;
  total_signatures: number;
  total_experiments: number;
  quality_score: number; // 0 - 100
  critical_count: number;
  warning_count: number;
  notice_count: number;
  passed_count: number;
  category_breakdown: {
    metadata: { critical: number; warning: number; notice: number; pass: number };
    taxonomy: { critical: number; warning: number; notice: number; pass: number };
    signatures: { critical: number; warning: number; notice: number; pass: number };
    experiments: { critical: number; warning: number; notice: number; pass: number };
  };
  issues: ValidationIssue[];
  software_version: string;
  engine_hash?: string;
}

export interface DatasetBundle {
  id: string;
  name: string;
  description: string;
  profile: 'clinical' | 'longitudinal' | 'intervention' | 'minimal_mimarks';
  samples: SampleMetadata[];
  taxa: TaxonomyEntry[];
  signatures: MicrobialSignature[];
  experiments: ExperimentMetadata[];
  uploaded_at: string;
}
