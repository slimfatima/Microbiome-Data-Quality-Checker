import React, { useState } from 'react';
import Papa from 'papaparse';
import { 
  Upload, Download, FileSpreadsheet, FileText, Check, AlertCircle, 
  Settings, ArrowRight, Table, Sparkles
} from 'lucide-react';
import { DatasetBundle, SampleMetadata, TaxonomyEntry, MicrobialSignature } from '../types/microbiome';
import { VALIDATION_PROFILES } from '../lib/validationEngine';

interface UploadViewProps {
  currentDataset: DatasetBundle;
  onUpdateDataset: (dataset: DatasetBundle) => void;
  onSelectProfile: (profileId: string) => void;
  selectedProfileId: string;
  onRunValidation: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  currentDataset,
  onUpdateDataset,
  onSelectProfile,
  selectedProfileId,
  onRunValidation
}) => {
  const [importTarget, setImportTarget] = useState<'samples' | 'taxa' | 'signatures'>('samples');
  const [dragActive, setDragActive] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    setUploadMessage(null);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (Array.isArray(parsed)) {
            applyParsedData(parsed);
          } else if (parsed.samples || parsed.taxa || parsed.signatures) {
            onUpdateDataset({
              ...currentDataset,
              name: parsed.name || file.name,
              samples: parsed.samples || currentDataset.samples,
              taxa: parsed.taxa || currentDataset.taxa,
              signatures: parsed.signatures || currentDataset.signatures,
              experiments: parsed.experiments || currentDataset.experiments
            });
            setUploadMessage({ type: 'success', text: `Successfully loaded full dataset from ${file.name}` });
          } else {
            setUploadMessage({ type: 'error', text: 'JSON must be an array of records or a full dataset bundle.' });
          }
        } catch (err: any) {
          setUploadMessage({ type: 'error', text: `Failed to parse JSON: ${err.message}` });
        }
      };
      reader.readAsText(file);
    } else {
      // CSV or TSV
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0 && results.data.length === 0) {
            setUploadMessage({ type: 'error', text: `Parsing error: ${results.errors[0].message}` });
            return;
          }
          applyParsedData(results.data as any[]);
        },
        error: (err) => {
          setUploadMessage({ type: 'error', text: `File read failed: ${err.message}` });
        }
      });
    }
  };

  const applyParsedData = (rows: any[]) => {
    if (rows.length === 0) {
      setUploadMessage({ type: 'error', text: 'The uploaded file contains no data rows.' });
      return;
    }

    if (importTarget === 'samples') {
      const updatedSamples: SampleMetadata[] = rows.map((r, i) => ({
        sample_id: String(r.sample_id || r.SampleID || r.sample || `SMP_${i + 1}`).trim(),
        study_id: String(r.study_id || r.StudyID || currentDataset.samples[0]?.study_id || 'STUDY_1'),
        participant_id: r.participant_id || r.ParticipantID || r.subject_id,
        host_species: r.host_species || r.Host || 'Homo sapiens',
        body_site: r.body_site || r.BodySite || 'feces',
        sample_type: r.sample_type || 'stool',
        disease_condition: r.disease_condition || r.condition || r.Diagnosis,
        experimental_group: r.experimental_group || r.group || r.Group,
        collection_timepoint: r.collection_timepoint || r.timepoint || r.Time,
        age: r.age || r.Age,
        sex: r.sex || r.Sex,
        antibiotic_exposure: r.antibiotic_exposure ?? r.antibiotics,
        treatment: r.treatment || r.Treatment,
        collection_date: r.collection_date || r.Date,
        sequencing_platform: r.sequencing_platform || r.platform
      }));

      onUpdateDataset({
        ...currentDataset,
        samples: updatedSamples
      });
      setUploadMessage({ type: 'success', text: `Imported ${updatedSamples.length} samples into Metadata table.` });
    } else if (importTarget === 'taxa') {
      const updatedTaxa: TaxonomyEntry[] = rows.map((r) => ({
        raw_name: String(r.raw_name || r.taxon_name || r.taxon || r.species || r.Taxon || '').trim(),
        ncbi_taxid: r.ncbi_taxid || r.taxid || r.TaxID,
        rank: r.rank || r.Rank,
        status: 'verified' as const
      })).filter(t => t.raw_name.length > 0);

      onUpdateDataset({
        ...currentDataset,
        taxa: updatedTaxa
      });
      setUploadMessage({ type: 'success', text: `Imported ${updatedTaxa.length} taxa into Taxonomy table.` });
    } else if (importTarget === 'signatures') {
      const updatedSignatures: MicrobialSignature[] = rows.map((r, i) => ({
        signature_id: String(r.signature_id || r.SignatureID || `Sig_${i + 1}`),
        study_id: String(r.study_id || currentDataset.signatures[0]?.study_id || 'STUDY_1'),
        experiment_id: String(r.experiment_id || 'EXP_1'),
        taxon_name: String(r.taxon_name || r.taxon || r.Taxon || ''),
        ncbi_taxid: r.ncbi_taxid || r.taxid,
        taxonomic_rank: r.taxonomic_rank || r.rank,
        group1: String(r.group1 || r.Case || 'Case'),
        group2: String(r.group2 || r.Control || 'Control'),
        condition: r.condition || r.disease,
        abundance_direction: String(r.abundance_direction || r.direction || 'UP').toUpperCase() as any,
        statistical_method: r.statistical_method || r.method || 'DESeq2',
        p_value: r.p_value ?? r.pvalue,
        adjusted_p_value: r.adjusted_p_value ?? r.fdr ?? r.q_value,
        effect_size: r.effect_size ?? r.log2FoldChange ?? r.logFC,
        source_reference: r.source_reference || r.source
      })).filter(s => s.taxon_name.length > 0);

      onUpdateDataset({
        ...currentDataset,
        signatures: updatedSignatures
      });
      setUploadMessage({ type: 'success', text: `Imported ${updatedSignatures.length} microbial biomarker signatures.` });
    }
  };

  const downloadTemplate = (type: 'metadata' | 'taxonomy' | 'signatures') => {
    let csvContent = '';
    let defaultFileName = '';

    if (type === 'metadata') {
      csvContent = 'sample_id,study_id,participant_id,host_species,body_site,sample_type,disease_condition,experimental_group,collection_timepoint,age,sex,antibiotic_exposure,treatment,collection_date\n' +
        'SMP_001,PRJNA12345,PT_001,Homo sapiens,feces,stool,Crohns Disease,Case,T0,32,female,false,anti-TNF,2024-01-15\n' +
        'SMP_002,PRJNA12345,PT_002,Homo sapiens,feces,stool,Healthy,Control,T0,29,male,false,none,2024-01-16\n';
      defaultFileName = 'microbiome_sample_metadata_template.csv';
    } else if (type === 'taxonomy') {
      csvContent = 'taxon_name,ncbi_taxid,rank\n' +
        'Faecalibacterium prausnitzii,853,species\n' +
        'Akkermansia muciniphila,239935,species\n' +
        'Clostridioides difficile,1496,species\n' +
        'Bacteroidota,976,phylum\n';
      defaultFileName = 'microbiome_taxonomy_template.csv';
    } else {
      csvContent = 'signature_id,study_id,experiment_id,taxon_name,ncbi_taxid,taxonomic_rank,group1,group2,condition,abundance_direction,statistical_method,p_value,adjusted_p_value,effect_size,source_reference\n' +
        'SIG_001,PRJNA12345,EXP_1,Faecalibacterium prausnitzii,853,species,Case,Control,Crohns Disease,DOWN,DESeq2,0.0002,0.0015,-2.8,Figure 2\n' +
        'SIG_002,PRJNA12345,EXP_1,Fusobacterium nucleatum,851,species,Case,Control,Crohns Disease,UP,DESeq2,0.0004,0.0022,3.1,Figure 2\n';
      defaultFileName = 'microbial_signatures_template.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', defaultFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-base font-bold text-slate-900">Dataset Upload & Ingestion Center</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Upload research datasets for automated bioinformatics validation. Supports CSV, TSV, JSON, and standard tab-delimited microbiome tables from QIIME 2, mothur, Biobakery, and MG-RAST.
        </p>

        {/* Validation Profile Selector */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Select Validation Profile</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.values(VALIDATION_PROFILES).map((prof) => {
              const isSelected = selectedProfileId === prof.id;
              return (
                <div
                  key={prof.id}
                  onClick={() => onSelectProfile(prof.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-teal-50 border-teal-600 text-teal-900 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{prof.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-teal-800" />}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{prof.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Upload Box & Import Target Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Target Selector */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Step 1: Choose Import Target Table
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setImportTarget('samples')}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded border transition-colors flex items-center justify-center gap-1.5 ${
                  importTarget === 'samples'
                    ? 'bg-teal-800 border-teal-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Sample Metadata ({currentDataset.samples.length})</span>
              </button>

              <button
                onClick={() => setImportTarget('taxa')}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded border transition-colors flex items-center justify-center gap-1.5 ${
                  importTarget === 'taxa'
                    ? 'bg-teal-800 border-teal-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Taxonomy Table ({currentDataset.taxa.length})</span>
              </button>

              <button
                onClick={() => setImportTarget('signatures')}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded border transition-colors flex items-center justify-center gap-1.5 ${
                  importTarget === 'signatures'
                    ? 'bg-teal-800 border-teal-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Signatures ({currentDataset.signatures.length})</span>
              </button>
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-teal-600 bg-teal-50' : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900">Drag & drop dataset file here</h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">Supports .csv, .tsv, .txt, or .json tables</p>

            <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded cursor-pointer transition-colors">
              <span>Browse Local Files</span>
              <input
                type="file"
                accept=".csv,.tsv,.txt,.json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
            </label>

            {fileName && (
              <p className="text-xs font-mono text-slate-600 mt-3">Selected: {fileName}</p>
            )}
          </div>

          {uploadMessage && (
            <div className={`p-3 rounded text-xs flex items-center gap-2 ${
              uploadMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {uploadMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{uploadMessage.text}</span>
            </div>
          )}
        </div>

        {/* Download Starter Templates */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Standardized Templates</h3>
            <p className="text-xs text-slate-500 mb-4">
              Download pre-formatted CSV templates adhering to MIMARKS, NCBI Taxonomy, and Bioconductor standards:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => downloadTemplate('metadata')}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left text-xs flex items-center justify-between group transition-colors"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">Metadata Template (CSV)</span>
                  <span className="text-[11px] text-slate-500">MIMARKS sample fields</span>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </button>

              <button
                onClick={() => downloadTemplate('taxonomy')}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left text-xs flex items-center justify-between group transition-colors"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">Taxonomy Template (CSV)</span>
                  <span className="text-[11px] text-slate-500">Taxon names, TaxIDs, and ranks</span>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </button>

              <button
                onClick={() => downloadTemplate('signatures')}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left text-xs flex items-center justify-between group transition-colors"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">Signatures Template (CSV)</span>
                  <span className="text-[11px] text-slate-500">Differential abundance biomarkers</span>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-6">
            <button
              onClick={onRunValidation}
              className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <span>Validate Uploaded Dataset</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Data Preview Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Current Dataset Table Preview: {importTarget.toUpperCase()}</h3>
            <p className="text-xs text-slate-500">Inspect parsed columns and initial records</p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {importTarget === 'samples' ? `${currentDataset.samples.length} samples` :
             importTarget === 'taxa' ? `${currentDataset.taxa.length} taxa` :
             `${currentDataset.signatures.length} signatures`}
          </span>
        </div>

        <div className="overflow-x-auto max-h-72 border border-slate-100 rounded custom-scrollbar">
          {importTarget === 'samples' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                <tr>
                  <th className="py-2 px-3">Sample ID</th>
                  <th className="py-2 px-3">Participant</th>
                  <th className="py-2 px-3">Group</th>
                  <th className="py-2 px-3">Age</th>
                  <th className="py-2 px-3">Sex</th>
                  <th className="py-2 px-3">Antibiotic</th>
                  <th className="py-2 px-3">Condition</th>
                  <th className="py-2 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {currentDataset.samples.slice(0, 8).map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-semibold text-slate-900">{s.sample_id}</td>
                    <td className="py-1.5 px-3 text-slate-700">{s.participant_id || '—'}</td>
                    <td className="py-1.5 px-3 text-slate-700">{s.experimental_group || '—'}</td>
                    <td className="py-1.5 px-3 text-slate-700">{s.age !== undefined ? s.age : '—'}</td>
                    <td className="py-1.5 px-3 text-slate-700">{s.sex || '—'}</td>
                    <td className="py-1.5 px-3 text-slate-700">{String(s.antibiotic_exposure ?? '—')}</td>
                    <td className="py-1.5 px-3 text-slate-700">{s.disease_condition || '—'}</td>
                    <td className="py-1.5 px-3 text-slate-500">{s.collection_date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {importTarget === 'taxa' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                <tr>
                  <th className="py-2 px-3">Taxon Name</th>
                  <th className="py-2 px-3">NCBI TaxID</th>
                  <th className="py-2 px-3">Rank</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {currentDataset.taxa.slice(0, 8).map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-semibold text-slate-900 italic font-sans">{t.raw_name}</td>
                    <td className="py-1.5 px-3 text-slate-700">{t.ncbi_taxid || '—'}</td>
                    <td className="py-1.5 px-3 text-slate-700">{t.rank || '—'}</td>
                    <td className="py-1.5 px-3 text-slate-500">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {importTarget === 'signatures' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                <tr>
                  <th className="py-2 px-3">Signature ID</th>
                  <th className="py-2 px-3">Taxon</th>
                  <th className="py-2 px-3">Comparison</th>
                  <th className="py-2 px-3">Direction</th>
                  <th className="py-2 px-3">Method</th>
                  <th className="py-2 px-3">P-Value</th>
                  <th className="py-2 px-3">Log2FC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {currentDataset.signatures.slice(0, 8).map((sig, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-semibold text-slate-900">{sig.signature_id}</td>
                    <td className="py-1.5 px-3 text-slate-800 italic font-sans">{sig.taxon_name}</td>
                    <td className="py-1.5 px-3 text-slate-700">{sig.group1} vs {sig.group2}</td>
                    <td className="py-1.5 px-3 text-slate-700 font-bold">{sig.abundance_direction}</td>
                    <td className="py-1.5 px-3 text-slate-600">{sig.statistical_method || '—'}</td>
                    <td className="py-1.5 px-3 text-slate-700">{sig.p_value !== undefined ? sig.p_value : '—'}</td>
                    <td className="py-1.5 px-3 text-slate-700">{sig.effect_size !== undefined ? sig.effect_size : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
