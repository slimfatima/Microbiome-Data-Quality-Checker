import React, { useState } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  ZAxis, ReferenceLine, Cell 
} from 'recharts';
import { 
  Sparkles, AlertCircle, AlertTriangle, CheckCircle, Search, 
  ArrowUpDown, Filter, Edit3, Check, Trash2 
} from 'lucide-react';
import { MicrobialSignature, ValidationIssue, AuditRecord } from '../types/microbiome';

interface SignatureValidatorViewProps {
  signatures: MicrobialSignature[];
  issues: ValidationIssue[];
  onUpdateSignatures: (signatures: MicrobialSignature[]) => void;
  onLogAudit: (record: AuditRecord) => void;
}

export const SignatureValidatorView: React.FC<SignatureValidatorViewProps> = ({
  signatures,
  issues,
  onUpdateSignatures,
  onLogAudit
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSig, setSelectedSig] = useState<MicrobialSignature | null>(null);
  const [directionFilter, setDirectionFilter] = useState<'all' | 'UP' | 'DOWN' | 'contradictory'>('all');

  const sigIssues = issues.filter(i => i.category === 'signature' || i.category === 'statistics');

  // Prepare Volcano Plot data (Effect size vs -log10(p-value))
  const volcanoData = signatures
    .filter(s => s.effect_size !== undefined && s.p_value !== undefined && s.p_value > 0)
    .map(s => {
      const pval = Number(s.p_value);
      const minusLogP = pval > 0 && pval <= 1 ? -Math.log10(pval) : 0;
      const isIssue = sigIssues.some(iss => iss.record_id === s.signature_id);

      return {
        id: s.signature_id,
        taxon: s.taxon_name,
        effectSize: Number(s.effect_size),
        minusLogP: Number(minusLogP.toFixed(2)),
        direction: s.abundance_direction,
        isIssue,
        color: isIssue ? '#dc2626' : (s.abundance_direction === 'UP' || s.abundance_direction === 'ELEVATED') ? '#0d9488' : '#e8710a'
      };
    });

  const filteredSignatures = signatures.filter(s => {
    const matchesSearch = 
      s.signature_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.taxon_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.group1 && s.group1.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.group2 && s.group2.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (directionFilter === 'UP') return s.abundance_direction === 'UP' || s.abundance_direction === 'ELEVATED';
    if (directionFilter === 'DOWN') return s.abundance_direction === 'DOWN' || s.abundance_direction === 'DEPLETED';
    if (directionFilter === 'contradictory') {
      return sigIssues.some(i => i.record_id === s.signature_id && i.rule_id === 'RULE_SIG_07');
    }
    return true;
  });

  const handleDeleteSignature = (sigId: string) => {
    const updated = signatures.filter(s => s.signature_id !== sigId);
    onUpdateSignatures(updated);

    onLogAudit({
      id: `audit-sig-del-${Date.now()}`,
      timestamp: new Date().toISOString(),
      issue_id: 'SIG_DELETION',
      record_id: sigId,
      field: 'signature_id',
      original_value: sigId,
      updated_value: 'DELETED',
      action: 'accepted',
      user_note: `Removed redundant or contradictory microbial signature ${sigId}`,
      user_email: 'curator@microbiomeqc.org'
    });

    if (selectedSig?.signature_id === sigId) {
      setSelectedSig(null);
    }
  };

  const handleToggleDirection = (sig: MicrobialSignature) => {
    const newDir = (sig.abundance_direction === 'UP' || sig.abundance_direction === 'ELEVATED') ? 'DOWN' : 'UP';
    const updated = signatures.map(s => {
      if (s.signature_id === sig.signature_id) {
        return { ...s, abundance_direction: newDir };
      }
      return s;
    });

    onUpdateSignatures(updated);

    onLogAudit({
      id: `audit-sig-dir-${Date.now()}`,
      timestamp: new Date().toISOString(),
      issue_id: 'RULE_SIG_07',
      record_id: sig.signature_id,
      field: 'abundance_direction',
      original_value: sig.abundance_direction,
      updated_value: newDir,
      action: 'accepted',
      user_note: `Inverted abundance direction from ${sig.abundance_direction} to ${newDir} based on consensus curation`,
      user_email: 'curator@microbiomeqc.org'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Microbial Signature Validation Engine</h2>
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-slate-100 text-slate-700">
              {signatures.length} biomarker signatures
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Validates differential abundance biomarker records. Enforces p-value mathematical domain [0, 1], flags multiple testing correction inconsistencies (FDR &lt; nominal p), and identifies contradictory abundance directions for identical taxa.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-slate-500">
            {sigIssues.length} signature issues flagged
          </span>
        </div>
      </div>

      {/* Volcano Plot Card */}
      {volcanoData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Biomarker Volcano Plot Inspection</h3>
              <p className="text-xs text-slate-500">Effect Size vs -log10(p-value). Red points indicate statistical or directional defects.</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-teal-800 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" /> Enriched (UP)
              </span>
              <span className="flex items-center gap-1 text-amber-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Depleted (DOWN)
              </span>
              <span className="flex items-center gap-1 text-rose-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> Flagged Defect
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <XAxis 
                  type="number" 
                  dataKey="effectSize" 
                  name="Effect Size (log2FC)" 
                  unit=""
                  label={{ value: 'Effect Size (log2FC)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="minusLogP" 
                  name="-log10(p-value)" 
                  label={{ value: '-log10(p-value)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: '#64748b' }}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <ReferenceLine y={-Math.log10(0.05)} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'p = 0.05', fontSize: 10, fill: '#94a3b8' }} />
                <ReferenceLine x={0} stroke="#cbd5e1" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2.5 border border-slate-200 rounded text-xs shadow-md space-y-1">
                          <p className="font-bold text-slate-900 italic">{data.taxon}</p>
                          <p className="font-mono text-slate-600">ID: {data.id}</p>
                          <p className="font-mono text-slate-600">Effect Size: {data.effectSize}</p>
                          <p className="font-mono text-slate-600">-log10(p): {data.minusLogP}</p>
                          <p className="font-semibold text-slate-700">Direction: {data.direction}</p>
                          {data.isIssue && <p className="text-rose-600 font-bold text-[11px]">FLAGGED VALIDATION DEFECT</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={volcanoData} fill="#0d9488">
                  {volcanoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Signatures List and Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search taxon, signature ID, or group..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:border-teal-700"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded text-xs font-medium">
            <button
              onClick={() => setDirectionFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                directionFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({signatures.length})
            </button>
            <button
              onClick={() => setDirectionFilter('UP')}
              className={`px-2.5 py-1 rounded transition-colors ${
                directionFilter === 'UP' ? 'bg-white text-teal-800 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Enriched (UP)
            </button>
            <button
              onClick={() => setDirectionFilter('DOWN')}
              className={`px-2.5 py-1 rounded transition-colors ${
                directionFilter === 'DOWN' ? 'bg-white text-amber-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Depleted (DOWN)
            </button>
            <button
              onClick={() => setDirectionFilter('contradictory')}
              className={`px-2.5 py-1 rounded transition-colors ${
                directionFilter === 'contradictory' ? 'bg-white text-rose-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Contradictions
            </button>
          </div>
        </div>

        {/* Signatures Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Signature ID</th>
                <th className="py-2.5 px-3">Taxon Name</th>
                <th className="py-2.5 px-3">Comparison</th>
                <th className="py-2.5 px-3">Direction</th>
                <th className="py-2.5 px-3">P-Value</th>
                <th className="py-2.5 px-3">Adj P (FDR)</th>
                <th className="py-2.5 px-3">Effect Size</th>
                <th className="py-2.5 px-3">Source Ref</th>
                <th className="py-2.5 px-3">Curate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredSignatures.map((sig, idx) => {
                const issuesForSig = sigIssues.filter(i => i.record_id === sig.signature_id);
                const hasCrit = issuesForSig.some(i => i.severity === 'critical');
                const hasWarn = issuesForSig.some(i => i.severity === 'warning');

                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {hasCrit ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          DEFECT
                        </span>
                      ) : hasWarn ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          WARN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          CLEAN
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-semibold text-slate-900">{sig.signature_id}</td>
                    <td className="py-2.5 px-3 font-sans italic text-slate-900">{sig.taxon_name}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">{sig.group1} vs {sig.group2}</td>
                    
                    <td className="py-2.5 px-3">
                      <span className={`inline-block font-bold px-1.5 py-0.5 rounded text-[11px] ${
                        sig.abundance_direction === 'UP' || sig.abundance_direction === 'ELEVATED'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {sig.abundance_direction}
                      </span>
                    </td>

                    <td className={`py-2.5 px-3 ${
                      sig.p_value !== undefined && (sig.p_value < 0 || sig.p_value > 1) ? 'text-rose-600 font-bold bg-rose-50' : 'text-slate-700'
                    }`}>
                      {sig.p_value !== undefined ? sig.p_value : '—'}
                    </td>

                    <td className={`py-2.5 px-3 ${
                      sig.adjusted_p_value !== undefined && sig.p_value !== undefined && sig.adjusted_p_value < sig.p_value ? 'text-rose-600 font-bold bg-rose-50' : 'text-slate-700'
                    }`}>
                      {sig.adjusted_p_value !== undefined ? sig.adjusted_p_value : '—'}
                    </td>

                    <td className="py-2.5 px-3 text-slate-700">{sig.effect_size !== undefined ? sig.effect_size : '—'}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-500">{sig.source_reference || '—'}</td>

                    <td className="py-2.5 px-3 whitespace-nowrap font-sans flex items-center gap-2">
                      <button
                        onClick={() => handleToggleDirection(sig)}
                        title="Toggle abundance direction (UP/DOWN)"
                        className="p-1 text-slate-500 hover:text-teal-800 hover:bg-slate-100 rounded"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSignature(sig.signature_id)}
                        title="Delete duplicate or contradictory signature"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
