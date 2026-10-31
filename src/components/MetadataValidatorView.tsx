import React, { useState } from 'react';
import { 
  AlertCircle, AlertTriangle, CheckCircle, Search, Filter, 
  Check, X, Edit3, ArrowRight, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';
import { SampleMetadata, ValidationIssue, AuditRecord } from '../types/microbiome';

interface MetadataValidatorViewProps {
  samples: SampleMetadata[];
  issues: ValidationIssue[];
  onUpdateSamples: (samples: SampleMetadata[]) => void;
  onLogAudit: (record: AuditRecord) => void;
  selectedIssueFromDashboard?: ValidationIssue | null;
  onClearSelectedIssue?: () => void;
}

export const MetadataValidatorView: React.FC<MetadataValidatorViewProps> = ({
  samples,
  issues,
  onUpdateSamples,
  onLogAudit,
  selectedIssueFromDashboard,
  onClearSelectedIssue
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'notice'>('all');
  const [activeIssue, setActiveIssue] = useState<ValidationIssue | null>(selectedIssueFromDashboard || null);
  const [manualValue, setManualValue] = useState<string>('');
  const [manualNote, setManualNote] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  // Filter issues pertaining to metadata and identifiers
  const metadataIssues = issues.filter(i => i.category === 'metadata' || i.category === 'identifier');

  // Map issues by sample_id + field for fast cell highlighting
  const issueMap = new Map<string, ValidationIssue>();
  metadataIssues.forEach(iss => {
    const key = `${iss.record_id}::${iss.field}`;
    issueMap.set(key, iss);
    // Also map by record_id alone
    issueMap.set(iss.record_id, iss);
  });

  // Filtered samples list
  const filteredSamples = samples.filter(s => {
    const matchesSearch = 
      s.sample_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.participant_id && s.participant_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.experimental_group && s.experimental_group.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.disease_condition && s.disease_condition.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (severityFilter === 'all') return true;

    // Check if this sample has issue of matching severity
    const sampleIssues = metadataIssues.filter(iss => iss.record_id === s.sample_id || iss.record_id === `Row ${samples.indexOf(s) + 1}`);
    return sampleIssues.some(iss => iss.severity === severityFilter);
  });

  const handleSelectIssue = (iss: ValidationIssue) => {
    setActiveIssue(iss);
    setIsEditing(false);
    setManualValue(iss.suggested_correction !== undefined ? String(iss.suggested_correction) : String(iss.detected_value ?? ''));
    setManualNote('');
  };

  const handleAcceptCorrection = (iss: ValidationIssue) => {
    if (iss.suggested_correction === undefined) return;

    const updatedSamples = samples.map(s => {
      if (s.sample_id === iss.record_id || iss.record_id.startsWith('Row')) {
        return {
          ...s,
          [iss.field]: iss.suggested_correction
        };
      }
      return s;
    });

    onUpdateSamples(updatedSamples);

    onLogAudit({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      issue_id: iss.id,
      record_id: iss.record_id,
      field: iss.field,
      original_value: iss.detected_value,
      updated_value: iss.suggested_correction,
      action: 'accepted',
      user_note: 'Accepted automated rule recommendation',
      user_email: 'curator@microbiomeqc.org'
    });

    setActiveIssue(null);
    if (onClearSelectedIssue) onClearSelectedIssue();
  };

  const handleManualSave = (iss: ValidationIssue) => {
    const updatedSamples = samples.map(s => {
      if (s.sample_id === iss.record_id) {
        return {
          ...s,
          [iss.field]: manualValue
        };
      }
      return s;
    });

    onUpdateSamples(updatedSamples);

    onLogAudit({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      issue_id: iss.id,
      record_id: iss.record_id,
      field: iss.field,
      original_value: iss.detected_value,
      updated_value: manualValue,
      action: 'manual_edit',
      user_note: manualNote || 'Researcher manual curation',
      user_email: 'curator@microbiomeqc.org'
    });

    setIsEditing(false);
    setActiveIssue(null);
    if (onClearSelectedIssue) onClearSelectedIssue();
  };

  const handleRejectIssue = (iss: ValidationIssue) => {
    onLogAudit({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      issue_id: iss.id,
      record_id: iss.record_id,
      field: iss.field,
      original_value: iss.detected_value,
      updated_value: iss.detected_value,
      action: 'rejected',
      user_note: manualNote || 'Researcher confirmed biological anomaly or deliberate design',
      user_email: 'curator@microbiomeqc.org'
    });

    setActiveIssue(null);
    if (onClearSelectedIssue) onClearSelectedIssue();
  };

  // Batch Auto-Fix Safe Formatting
  const handleBatchFixFormatting = () => {
    let fixesCount = 0;
    const updated = samples.map(s => {
      let copy = { ...s };
      // Trim sample ID
      if (copy.sample_id && copy.sample_id !== copy.sample_id.trim()) {
        copy.sample_id = copy.sample_id.trim();
        fixesCount++;
      }
      // Standardize Sex
      if (copy.sex) {
        const lower = String(copy.sex).trim().toLowerCase();
        if (lower === 'm') { copy.sex = 'male'; fixesCount++; }
        if (lower === 'f') { copy.sex = 'female'; fixesCount++; }
      }
      // Abs negative age
      if (typeof copy.age === 'number' && copy.age < 0) {
        copy.age = Math.abs(copy.age);
        fixesCount++;
      }
      return copy;
    });

    if (fixesCount > 0) {
      onUpdateSamples(updated);
      onLogAudit({
        id: `audit-batch-${Date.now()}`,
        timestamp: new Date().toISOString(),
        issue_id: 'BATCH_FORMAT_CLEAN',
        record_id: 'ALL_METADATA',
        field: 'whitespace_sex_age',
        original_value: 'various',
        updated_value: 'standardized',
        action: 'accepted',
        user_note: `Batch resolved ${fixesCount} trivial whitespace and formatting inconsistencies`,
        user_email: 'curator@microbiomeqc.org'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Sample Metadata Validation Engine</h2>
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-slate-100 text-slate-700">
              {metadataIssues.length} issues detected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Detects missing required fields, duplicate sample IDs, untrimmed whitespace, conflicting participant attributes, and inconsistent group labels.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleBatchFixFormatting}
            className="px-3 py-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-800" />
            <span>Auto-Standardize Whitespace & Casing</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sample ID, participant, group, condition..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-hidden focus:border-teal-700"
          />
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded">
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              severityFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({samples.length})
          </button>
          <button
            onClick={() => setSeverityFilter('critical')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              severityFilter === 'critical' ? 'bg-white text-rose-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setSeverityFilter('warning')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              severityFilter === 'warning' ? 'bg-white text-amber-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Warnings
          </button>
        </div>
      </div>

      {/* Main Layout: Split Table & Curatorial Inspection Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Samples Table */}
        <div className={`${activeIssue ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white border border-slate-200 rounded-lg p-4`}>
          <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Sample ID</th>
                  <th className="py-2.5 px-3">Participant</th>
                  <th className="py-2.5 px-3">Group</th>
                  <th className="py-2.5 px-3">Age</th>
                  <th className="py-2.5 px-3">Sex</th>
                  <th className="py-2.5 px-3">Antibiotic</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredSamples.map((s, idx) => {
                  const sIssues = metadataIssues.filter(iss => iss.record_id === s.sample_id || iss.record_id === `Row ${idx + 1}`);
                  const hasCrit = sIssues.some(i => i.severity === 'critical');
                  const hasWarn = sIssues.some(i => i.severity === 'warning');

                  return (
                    <tr 
                      key={idx}
                      className={`hover:bg-slate-50 transition-colors ${
                        activeIssue && activeIssue.record_id === s.sample_id ? 'bg-teal-50/40' : ''
                      }`}
                    >
                      <td className="py-2 px-3 whitespace-nowrap">
                        {hasCrit ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            CRITICAL
                          </span>
                        ) : hasWarn ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            WARNING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            PASS
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {s.sample_id}
                        {s.sample_id !== s.sample_id.trim() && (
                          <span className="ml-1 text-[10px] bg-amber-100 text-amber-800 px-1 rounded">space</span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-slate-700">{s.participant_id || '—'}</td>

                      <td className="py-2 px-3 text-slate-800 font-sans">
                        {s.experimental_group || '—'}
                      </td>

                      <td className={`py-2 px-3 ${
                        typeof s.age === 'number' && s.age < 0 ? 'text-rose-600 font-bold bg-rose-50/50' : 'text-slate-700'
                      }`}>
                        {s.age !== undefined ? s.age : '—'}
                      </td>

                      <td className={`py-2 px-3 ${
                        s.sex && !['male', 'female', 'other'].includes(String(s.sex).toLowerCase()) ? 'text-amber-700 font-bold' : 'text-slate-700'
                      }`}>
                        {s.sex || '—'}
                      </td>

                      <td className={`py-2 px-3 ${
                        s.antibiotic_exposure === '' || s.antibiotic_exposure === undefined ? 'text-amber-600 font-bold' : 'text-slate-700'
                      }`}>
                        {String(s.antibiotic_exposure ?? '—')}
                      </td>

                      <td className="py-2 px-3 text-slate-500">{s.collection_date || '—'}</td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        {sIssues.length > 0 ? (
                          <button
                            onClick={() => handleSelectIssue(sIssues[0])}
                            className="text-xs font-semibold text-teal-800 hover:text-teal-900 underline"
                          >
                            Inspect ({sIssues.length})
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Curatorial Action Drawer (Interactive Review) */}
        {activeIssue && (
          <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-teal-800" />
                  <h3 className="text-sm font-bold text-slate-900">Curatorial Action Review</h3>
                </div>
                <button
                  onClick={() => { setActiveIssue(null); if (onClearSelectedIssue) onClearSelectedIssue(); }}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Severity Banner */}
              <div className={`p-2.5 rounded text-xs flex items-center justify-between ${
                activeIssue.severity === 'critical' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                activeIssue.severity === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                'bg-sky-50 text-sky-800 border border-sky-200'
              }`}>
                <span className="font-bold uppercase tracking-wider">{activeIssue.severity}</span>
                <span className="font-mono text-[11px]">{activeIssue.rule_id}</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Affected Record</span>
                <p className="text-sm font-bold font-mono text-slate-900">{activeIssue.record_id} &rarr; {activeIssue.field}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Issue Description</span>
                <p className="text-xs text-slate-800 mt-0.5">{activeIssue.message}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-1">Scientific & Bioinformatic Rationale:</span>
                <p className="text-xs text-slate-600 leading-relaxed">{activeIssue.rationale}</p>
                <div className="mt-2 text-[11px] text-slate-500 font-mono">
                  Evidence: {activeIssue.evidence}
                </div>
              </div>

              {/* Detected vs Suggested Correction */}
              <div className="border border-slate-200 rounded p-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Detected Value:</span>
                  <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                    {String(activeIssue.detected_value ?? 'NULL / Empty')}
                  </span>
                </div>

                {activeIssue.suggested_correction !== undefined && !isEditing && (
                  <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2">
                    <span className="text-slate-500">Suggested Fix:</span>
                    <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      {String(activeIssue.suggested_correction)}
                    </span>
                  </div>
                )}

                {isEditing && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-medium text-slate-700 block">Manual Replacement Value:</label>
                    <input
                      type="text"
                      value={manualValue}
                      onChange={(e) => setManualValue(e.target.value)}
                      className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-teal-700"
                    />
                    <label className="text-xs font-medium text-slate-700 block">Curation Reason (Logged to Audit Trail):</label>
                    <input
                      type="text"
                      value={manualNote}
                      onChange={(e) => setManualNote(e.target.value)}
                      placeholder="e.g. Verified against clinical lab pathology log..."
                      className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:border-teal-700"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t border-slate-100 mt-4">
              {activeIssue.suggested_correction !== undefined && !isEditing ? (
                <button
                  onClick={() => handleAcceptCorrection(activeIssue)}
                  className="w-full py-2 bg-teal-800 hover:bg-teal-900 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept Suggested Correction</span>
                </button>
              ) : null}

              {isEditing ? (
                <button
                  onClick={() => handleManualSave(activeIssue)}
                  className="w-full py-2 bg-teal-800 hover:bg-teal-900 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Manual Edit to Audit Trail</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Manual Custom Correction</span>
                </button>
              )}

              <button
                onClick={() => handleRejectIssue(activeIssue)}
                className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded text-xs font-semibold transition-colors"
              >
                Dismiss / Keep Original Value
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
