/**
 * Microbiome Data Quality Checker (Microbiome QC)
 * Main Application Entry Point
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header, ActiveTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { UploadView } from './components/UploadView';
import { MetadataValidatorView } from './components/MetadataValidatorView';
import { TaxonomyCheckerView } from './components/TaxonomyCheckerView';
import { SignatureValidatorView } from './components/SignatureValidatorView';
import { ExperimentReviewView } from './components/ExperimentReviewView';
import { ReportsView } from './components/ReportsView';
import { RPackageView } from './components/RPackageView';
import { DocumentationView } from './components/DocumentationView';

import { DatasetBundle, QCReportSummary, ValidationIssue, AuditRecord } from './types/microbiome';
import { SAMPLE_DATASETS } from './lib/sampleDatasets';
import { runFullQC } from './lib/validationEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentDataset, setCurrentDataset] = useState<DatasetBundle>(SAMPLE_DATASETS.crc_cohort);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('clinical');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [selectedIssueFromDashboard, setSelectedIssueFromDashboard] = useState<ValidationIssue | null>(null);

  // Initial audit trail
  const [auditTrail, setAuditTrail] = useState<AuditRecord[]>([
    {
      id: 'audit-init-1',
      timestamp: new Date().toISOString(),
      issue_id: 'SYSTEM_INIT',
      record_id: 'DATASET_LOAD',
      field: 'all',
      original_value: 'none',
      updated_value: 'PRJNA514228',
      action: 'accepted',
      user_note: 'Initial ingest of Colorectal Cancer Metagenomics Benchmark (CRC-104)',
      user_email: 'curator@microbiomeqc.org'
    }
  ]);

  // Current compiled QC report
  const [report, setReport] = useState<QCReportSummary>(() => {
    // Initial sync calculation
    const initDataset = SAMPLE_DATASETS.crc_cohort;
    return {
      dataset_name: initDataset.name,
      validation_date: new Date().toISOString(),
      validation_profile: 'Clinical & Observational Study',
      total_samples: initDataset.samples.length,
      total_taxa: initDataset.taxa.length,
      total_signatures: initDataset.signatures.length,
      total_experiments: initDataset.experiments.length,
      quality_score: 55,
      critical_count: 5,
      warning_count: 6,
      notice_count: 1,
      passed_count: 8,
      category_breakdown: {
        metadata: { critical: 3, warning: 3, notice: 1, pass: 5 },
        taxonomy: { critical: 1, warning: 2, notice: 0, pass: 4 },
        signatures: { critical: 1, warning: 1, notice: 0, pass: 2 },
        experiments: { critical: 0, warning: 0, notice: 0, pass: 1 }
      },
      issues: [],
      software_version: 'microbiomeQC v1.2.0',
      engine_hash: 'R-4.4-BioC-3.20'
    };
  });

  // Re-run validation pipeline
  const executeValidation = useCallback(async (datasetToValidate = currentDataset, profileId = selectedProfileId) => {
    setIsValidating(true);
    try {
      const res = await runFullQC(
        datasetToValidate.name,
        datasetToValidate.samples,
        datasetToValidate.taxa,
        datasetToValidate.signatures,
        datasetToValidate.experiments,
        profileId
      );
      setReport(res);
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setIsValidating(false);
    }
  }, [currentDataset, selectedProfileId]);

  // Run on mount or dataset switch
  useEffect(() => {
    executeValidation(currentDataset, selectedProfileId);
  }, [currentDataset, selectedProfileId]);

  const handleSelectDataset = (key: string) => {
    if (SAMPLE_DATASETS[key]) {
      const ds = SAMPLE_DATASETS[key];
      setCurrentDataset(ds);
      setSelectedProfileId(ds.profile);
      setAuditTrail(prev => [
        {
          id: `audit-load-${Date.now()}`,
          timestamp: new Date().toISOString(),
          issue_id: 'DATASET_SWITCH',
          record_id: ds.id,
          field: 'all',
          original_value: currentDataset.id,
          updated_value: ds.id,
          action: 'accepted',
          user_note: `Switched active dataset benchmark to: ${ds.name}`,
          user_email: 'curator@microbiomeqc.org'
        },
        ...prev
      ]);
    }
  };

  const handleResetToBenchmark = () => {
    handleSelectDataset('crc_cohort');
    setActiveTab('dashboard');
  };

  const handleLogAudit = (record: AuditRecord) => {
    setAuditTrail(prev => [record, ...prev]);
  };

  const handleSelectIssueFromDashboard = (issue: ValidationIssue) => {
    setSelectedIssueFromDashboard(issue);
    if (issue.category === 'metadata' || issue.category === 'identifier') {
      setActiveTab('metadata');
    } else if (issue.category === 'taxonomy') {
      setActiveTab('taxonomy');
    } else if (issue.category === 'signature' || issue.category === 'statistics') {
      setActiveTab('signatures');
    } else if (issue.category === 'experiment') {
      setActiveTab('experiments');
    } else {
      setActiveTab('reports');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onRunValidation={() => executeValidation(currentDataset, selectedProfileId)}
        isValidating={isValidating}
        onReset={handleResetToBenchmark}
        hasIssues={report.issues.length > 0}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentDataset={currentDataset}
            report={report}
            onSelectDataset={handleSelectDataset}
            onSelectTab={setActiveTab}
            onSelectIssue={handleSelectIssueFromDashboard}
          />
        )}

        {activeTab === 'upload' && (
          <UploadView
            currentDataset={currentDataset}
            onUpdateDataset={(updated) => {
              setCurrentDataset(updated);
              executeValidation(updated, selectedProfileId);
            }}
            onSelectProfile={(pId) => {
              setSelectedProfileId(pId);
            }}
            selectedProfileId={selectedProfileId}
            onRunValidation={() => {
              executeValidation(currentDataset, selectedProfileId);
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'metadata' && (
          <MetadataValidatorView
            samples={currentDataset.samples}
            issues={report.issues}
            onUpdateSamples={(updatedSamples) => {
              const updated = { ...currentDataset, samples: updatedSamples };
              setCurrentDataset(updated);
              executeValidation(updated, selectedProfileId);
            }}
            onLogAudit={handleLogAudit}
            selectedIssueFromDashboard={selectedIssueFromDashboard}
            onClearSelectedIssue={() => setSelectedIssueFromDashboard(null)}
          />
        )}

        {activeTab === 'taxonomy' && (
          <TaxonomyCheckerView
            taxa={currentDataset.taxa}
            onUpdateTaxa={(updatedTaxa) => {
              const updated = { ...currentDataset, taxa: updatedTaxa };
              setCurrentDataset(updated);
              executeValidation(updated, selectedProfileId);
            }}
            onLogAudit={handleLogAudit}
          />
        )}

        {activeTab === 'signatures' && (
          <SignatureValidatorView
            signatures={currentDataset.signatures}
            issues={report.issues}
            onUpdateSignatures={(updatedSignatures) => {
              const updated = { ...currentDataset, signatures: updatedSignatures };
              setCurrentDataset(updated);
              executeValidation(updated, selectedProfileId);
            }}
            onLogAudit={handleLogAudit}
          />
        )}

        {activeTab === 'experiments' && (
          <ExperimentReviewView
            experiments={currentDataset.experiments}
            samples={currentDataset.samples}
            issues={report.issues}
            onUpdateExperiments={(updatedExp) => {
              const updated = { ...currentDataset, experiments: updatedExp };
              setCurrentDataset(updated);
              executeValidation(updated, selectedProfileId);
            }}
            onLogAudit={handleLogAudit}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            report={report}
            auditTrail={auditTrail}
          />
        )}

        {activeTab === 'r_package' && (
          <RPackageView />
        )}

        {activeTab === 'docs' && (
          <DocumentationView />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Microbiome Data Quality Checker (microbiomeQC)</span>
            <span className="text-slate-400">·</span>
            <span>Version 1.2.0</span>
            <span className="text-slate-400">·</span>
            <span className="font-mono">NCBI Taxonomy Compliant</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <button onClick={() => setActiveTab('docs')} className="hover:text-slate-900 transition-colors">
              MIMARKS Guidelines
            </button>
            <button onClick={() => setActiveTab('r_package')} className="hover:text-slate-900 transition-colors">
              R Package Source
            </button>
            <button onClick={() => setActiveTab('reports')} className="hover:text-slate-900 transition-colors">
              QC Dossiers
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
