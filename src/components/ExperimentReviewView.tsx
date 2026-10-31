import React, { useState } from 'react';
import { 
  GitBranch, Users, Check, AlertCircle, AlertTriangle, 
  HelpCircle, ShieldCheck, ArrowRight, Layers, FileCheck
} from 'lucide-react';
import { ExperimentMetadata, SampleMetadata, ValidationIssue, AuditRecord } from '../types/microbiome';

interface ExperimentReviewViewProps {
  experiments: ExperimentMetadata[];
  samples: SampleMetadata[];
  issues: ValidationIssue[];
  onUpdateExperiments: (experiments: ExperimentMetadata[]) => void;
  onLogAudit: (record: AuditRecord) => void;
}

export const ExperimentReviewView: React.FC<ExperimentReviewViewProps> = ({
  experiments,
  samples,
  issues,
  onUpdateExperiments,
  onLogAudit
}) => {
  const expIssues = issues.filter(i => i.category === 'experiment');

  // Compute actual participant distribution
  const participantSampleCounts = new Map<string, number>();
  samples.forEach(s => {
    if (s.participant_id) {
      const pid = String(s.participant_id).trim();
      participantSampleCounts.set(pid, (participantSampleCounts.get(pid) || 0) + 1);
    }
  });

  const repeatedParticipants = Array.from(participantSampleCounts.entries()).filter(([_, count]) => count > 1);
  const singleParticipants = Array.from(participantSampleCounts.entries()).filter(([_, count]) => count === 1);

  const handleTogglePaired = (exp: ExperimentMetadata) => {
    const newPaired = !exp.is_paired;
    const updated = experiments.map(e => e.experiment_id === exp.experiment_id ? { ...e, is_paired: newPaired } : e);
    onUpdateExperiments(updated);

    onLogAudit({
      id: `audit-exp-paired-${Date.now()}`,
      timestamp: new Date().toISOString(),
      issue_id: 'RULE_EXP_02',
      record_id: exp.experiment_id,
      field: 'is_paired',
      original_value: exp.is_paired,
      updated_value: newPaired,
      action: 'accepted',
      user_note: `Updated paired design declaration to ${newPaired} based on participant repeat measurement analysis`,
      user_email: 'curator@microbiomeqc.org'
    });
  };

  const handleSetStudyDesign = (expId: string, design: string) => {
    const updated = experiments.map(e => e.experiment_id === expId ? { ...e, study_design: design } : e);
    onUpdateExperiments(updated);

    onLogAudit({
      id: `audit-exp-design-${Date.now()}`,
      timestamp: new Date().toISOString(),
      issue_id: 'RULE_EXP_01',
      record_id: expId,
      field: 'study_design',
      original_value: 'unspecified',
      updated_value: design,
      action: 'accepted',
      user_note: `Explicitly confirmed study design as ${design}`,
      user_email: 'curator@microbiomeqc.org'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-base font-bold text-slate-900">Study Design & Experiment-Level Verification</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl">
          Validates that statistical assumptions match the true sampling design. In microbiome literature, treating dependent longitudinal or paired pre/post samples as independent observations inflates false-positive biomarker discovery by up to 300%.
        </p>
      </div>

      {/* Main Experiment Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {experiments.map(exp => {
          const issuesForThisExp = expIssues.filter(i => i.record_id === exp.experiment_id);

          return (
            <div key={exp.experiment_id} className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-mono text-slate-400 uppercase">Experiment ID: {exp.experiment_id}</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{exp.study_title}</h3>
                </div>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700">
                  {exp.study_id}
                </span>
              </div>

              {/* Study Design Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Declared Study Design:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['case_control', 'cross_sectional', 'longitudinal', 'paired_before_after'].map(d => (
                    <button
                      key={d}
                      onClick={() => handleSetStudyDesign(exp.experiment_id, d)}
                      className={`p-2 rounded border text-left font-medium transition-colors ${
                        exp.study_design === d
                          ? 'bg-teal-50 border-teal-600 text-teal-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {d.replace(/_/g, ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paired vs Independent Inspection Box */}
              <div className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-800">Paired / Dependent Structure Status</span>
                  </div>
                  <button
                    onClick={() => handleTogglePaired(exp)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                      exp.is_paired
                        ? 'bg-purple-50 border-purple-300 text-purple-800'
                        : 'bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                  >
                    {exp.is_paired ? 'Declared as PAIRED' : 'Declared as INDEPENDENT'}
                  </button>
                </div>

                <div className="text-xs text-slate-600 space-y-1 font-mono text-[11px] bg-white p-2.5 rounded border border-slate-100">
                  <div className="flex justify-between">
                    <span>Total Participants:</span>
                    <strong className="text-slate-900">{participantSampleCounts.size}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Participants with Repeated Measures:</span>
                    <strong className={repeatedParticipants.length > 0 ? 'text-teal-800' : 'text-slate-500'}>
                      {repeatedParticipants.length}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Single-sample Participants:</span>
                    <strong className="text-slate-900">{singleParticipants.length}</strong>
                  </div>
                </div>

                {exp.is_paired && repeatedParticipants.length === 0 && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <div>
                      <strong>Design Mismatch Warning:</strong> Experiment is flagged as paired, but no participants have repeated longitudinal samples in the metadata.
                    </div>
                  </div>
                )}
              </div>

              {/* Biological Sample & Sequencing Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span className="text-[11px] text-slate-400 uppercase font-mono block">Sample Matrix</span>
                  <span className="font-semibold text-slate-800">{exp.biological_sample_type || 'feces'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span className="text-[11px] text-slate-400 uppercase font-mono block">Sequencing Target</span>
                  <span className="font-semibold text-slate-800">{exp.sequencing_target || 'shotgun metagenomics'}</span>
                </div>
              </div>

              {/* Issues for this experiment */}
              {issuesForThisExp.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-rose-700 block">Identified Design Issues:</span>
                  {issuesForThisExp.map((iss, i) => (
                    <div key={i} className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
                      <strong>{iss.rule_name}:</strong> {iss.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Statistical Suitability Guide Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileCheck className="w-4 h-4 text-teal-800" />
            <h3 className="text-sm font-bold text-slate-900">Statistical Method Appropriateness Matrix</h3>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="p-2.5 rounded border border-slate-100 bg-slate-50">
              <strong className="text-slate-900 block mb-0.5">Cross-Sectional / Independent Groups:</strong>
              <span>Recommended: ANCOM-BC, DESeq2 (Wald test), MaAsLin2 (linear modeling with covariate adjustment), ALDEx2.</span>
            </div>

            <div className="p-2.5 rounded border border-slate-100 bg-slate-50">
              <strong className="text-slate-900 block mb-0.5">Paired Before-After / Longitudinal:</strong>
              <span>Recommended: Linear Mixed-Effects Models (lme4 / MaAsLin2 random effects for participant_id), paired Wilcoxon signed-rank test.</span>
            </div>

            <div className="p-2.5 rounded border border-slate-100 bg-slate-50">
              <strong className="text-slate-900 block mb-0.5">Compositionality & Zero-Inflation:</strong>
              <span>Microbiome count tables represent relative simplexes. Never apply raw unnormalized Student&apos;s t-test or uncorrected Pearson correlation.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
