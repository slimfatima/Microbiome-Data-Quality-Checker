import React from 'react';
import { BookOpen, ShieldAlert, CheckCircle, Scale, Database, AlertCircle } from 'lucide-react';

export const DocumentationView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-teal-800" />
          <h2 className="text-base font-bold text-slate-900">Scientific Validation Guidelines & Rulebook</h2>
        </div>
        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
          The Microbiome Data Quality Checker (Microbiome QC) adheres to strict computational biology and epidemiological standards. This reference manual documents the scientific invariants, evidence bases, and epistemic principles governing all validation decisions.
        </p>
      </div>

      {/* Core Epistemic Principles */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Scale className="w-4 h-4 text-teal-800" />
          <span>Core Epistemic Principles for Responsible Validation</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900">1. Zero Hallucination Policy</h4>
            <p className="text-slate-600 leading-relaxed">
              The engine <strong>never invents missing metadata or fabricates NCBI TaxIDs</strong>. If a taxonomic name cannot be resolved in NCBI Taxonomy or if participant age is missing, the system explicitly labels it as <em>Unresolved</em> or <em>Missing</em>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900">2. Non-Destructive Data Preservation</h4>
            <p className="text-slate-600 leading-relaxed">
              The software <strong>never silently alters raw research data</strong>. Every accepted correction, synonym modernization, or manual adjustment is recorded in an immutable, timestamped audit log.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900">3. Diversity vs Biomarker Distinction</h4>
            <p className="text-slate-600 leading-relaxed">
              We distinguish between global community metrics (&alpha;-diversity, &beta;-diversity distance matrices) and feature-level differential abundance biomarker signatures. A statistically significant PERMANOVA result does not constitute an individual taxon signature.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900">4. Software Validation vs Scientific Peer Review</h4>
            <p className="text-slate-600 leading-relaxed">
              Microbiome QC verifies syntax, ontology, format integrity, and statistical plausibility. It <strong>does not replace scientific peer review</strong>, experimental replication, or causal clinical validation.
            </p>
          </div>
        </div>
      </div>

      {/* Validation Rules Dictionary */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-teal-800" />
          <span>Validation Rules Dictionary</span>
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Rule ID</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Rule Title</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Bioinformatic Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 font-bold text-slate-800">RULE_SID_01</td>
                <td className="py-2 px-3 font-sans capitalize">Identifier</td>
                <td className="py-2 px-3 font-sans font-semibold">Missing Sample ID</td>
                <td className="py-2 px-3 text-rose-700 font-bold">CRITICAL</td>
                <td className="py-2 px-3 font-sans text-slate-600">Sample table must maintain persistent primary keys for demultiplexing.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 font-bold text-slate-800">RULE_SID_02</td>
                <td className="py-2 px-3 font-sans capitalize">Identifier</td>
                <td className="py-2 px-3 font-sans font-semibold">Untrimmed Whitespace</td>
                <td className="py-2 px-3 text-amber-700 font-bold">WARNING</td>
                <td className="py-2 px-3 font-sans text-slate-600">Trailing whitespace causes silent failures during SQL or R join operations.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 font-bold text-slate-800">RULE_SID_05</td>
                <td className="py-2 px-3 font-sans capitalize">Identifier</td>
                <td className="py-2 px-3 font-sans font-semibold">Duplicate Sample ID</td>
                <td className="py-2 px-3 text-rose-700 font-bold">CRITICAL</td>
                <td className="py-2 px-3 font-sans text-slate-600">Prevents ambiguous 1-to-many specimen mapping.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 font-bold text-slate-800">RULE_GRP_01</td>
                <td className="py-2 px-3 font-sans capitalize">Metadata</td>
                <td className="py-2 px-3 font-sans font-semibold">Inconsistent Group Casing</td>
                <td className="py-2 px-3 text-amber-700 font-bold">WARNING</td>
                <td className="py-2 px-3 font-sans text-slate-600">Differences like 'Control' vs 'control' create unintended extra factor levels in DESeq2/MaAsLin2.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 font-bold text-slate-800">RULE_TAX_03</td>
                <td className="py-2 px-3 font-sans capitalize">Taxonomy</td>
                <td className="py-2 px-3 font-sans font-semibold">Outdated Synonym</td>
                <td className="py-2 px-3 text-amber-700 font-bold">WARNING</td>
                <td className="py-2 px-3 font-sans text-slate-600">Flags obsolete nomenclature (e.g. Clostridium difficile vs Clostridioides difficile).</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 font-bold text-slate-800">RULE_TAX_04</td>
                <td className="py-2 px-3 font-sans capitalize">Taxonomy</td>
                <td className="py-2 px-3 font-sans font-semibold">TaxID Mismatch</td>
                <td className="py-2 px-3 text-rose-700 font-bold">CRITICAL</td>
                <td className="py-2 px-3 font-sans text-slate-600">Ensures provided TaxID corresponds strictly to the true NCBI phylogenetic node.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 font-bold text-slate-800">RULE_SIG_05</td>
                <td className="py-2 px-3 font-sans capitalize">Statistics</td>
                <td className="py-2 px-3 font-sans font-semibold">P-Value Outside [0, 1]</td>
                <td className="py-2 px-3 text-rose-700 font-bold">CRITICAL</td>
                <td className="py-2 px-3 font-sans text-slate-600">Probabilities outside [0, 1] represent severe calculation or column transposition errors.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 font-bold text-slate-800">RULE_SIG_07</td>
                <td className="py-2 px-3 font-sans capitalize">Signatures</td>
                <td className="py-2 px-3 font-sans font-semibold">Contradictory Direction</td>
                <td className="py-2 px-3 text-rose-700 font-bold">CRITICAL</td>
                <td className="py-2 px-3 font-sans text-slate-600">Same taxon in identical comparison cannot be both enriched and depleted.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 font-bold text-slate-800">RULE_EXP_02</td>
                <td className="py-2 px-3 font-sans capitalize">Experiments</td>
                <td className="py-2 px-3 font-sans font-semibold">Mismatched Paired Design</td>
                <td className="py-2 px-3 text-rose-700 font-bold">CRITICAL</td>
                <td className="py-2 px-3 font-sans text-slate-600">Flagging independent samples as paired corrupts degrees of freedom and variance tests.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
