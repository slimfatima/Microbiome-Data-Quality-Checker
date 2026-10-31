import React, { useState } from 'react';
import { 
  Dna, Search, ExternalLink, Check, AlertTriangle, AlertCircle, 
  HelpCircle, Sparkles, ArrowRight, RefreshCw, Layers
} from 'lucide-react';
import { TaxonomyEntry, AuditRecord } from '../types/microbiome';
import { resolveTaxonomyEntry, cleanTaxonName } from '../lib/ncbiTaxonomy';

interface TaxonomyCheckerViewProps {
  taxa: TaxonomyEntry[];
  onUpdateTaxa: (taxa: TaxonomyEntry[]) => void;
  onLogAudit: (record: AuditRecord) => void;
}

export const TaxonomyCheckerView: React.FC<TaxonomyCheckerViewProps> = ({
  taxa,
  onUpdateTaxa,
  onLogAudit
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [liveQuery, setLiveQuery] = useState('');
  const [liveResult, setLiveResult] = useState<TaxonomyEntry | null>(null);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredTaxa = taxa.filter(t => {
    const matchesSearch = 
      t.raw_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.accepted_name && t.accepted_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.ncbi_taxid && String(t.ncbi_taxid).includes(searchTerm));

    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  const handleApplyAcceptedName = (entry: TaxonomyEntry) => {
    if (!entry.accepted_name) return;

    const updated = taxa.map(t => {
      if (t.raw_name === entry.raw_name) {
        return {
          ...t,
          raw_name: entry.accepted_name!,
          accepted_name: entry.accepted_name,
          ncbi_taxid: entry.suggested_taxid || t.ncbi_taxid,
          status: 'verified' as const
        };
      }
      return t;
    });

    onUpdateTaxa(updated);

    onLogAudit({
      id: `audit-tax-${Date.now()}`,
      timestamp: new Date().toISOString(),
      issue_id: 'RULE_TAX_03',
      record_id: entry.raw_name,
      field: 'raw_name',
      original_value: entry.raw_name,
      updated_value: entry.accepted_name,
      action: 'accepted',
      user_note: `Replaced outdated synonym '${entry.raw_name}' with NCBI accepted name '${entry.accepted_name}'`,
      user_email: 'curator@microbiomeqc.org'
    });
  };

  const handleApplyAllSynonyms = () => {
    let count = 0;
    const updated = taxa.map(t => {
      if (t.status === 'synonym' && t.accepted_name) {
        count++;
        return {
          ...t,
          raw_name: t.accepted_name,
          ncbi_taxid: t.suggested_taxid || t.ncbi_taxid,
          status: 'verified' as const
        };
      }
      return t;
    });

    if (count > 0) {
      onUpdateTaxa(updated);
      onLogAudit({
        id: `audit-tax-batch-${Date.now()}`,
        timestamp: new Date().toISOString(),
        issue_id: 'BATCH_TAX_SYNONYMS',
        record_id: 'ALL_TAXA',
        field: 'raw_name',
        original_value: 'synonyms',
        updated_value: 'accepted_names',
        action: 'accepted',
        user_note: `Batch standardized ${count} outdated taxonomic synonyms to current NCBI accepted names`,
        user_email: 'curator@microbiomeqc.org'
      });
    }
  };

  const handleLiveLookup = async () => {
    if (!liveQuery.trim()) return;
    setIsSearchingLive(true);
    try {
      const res = await resolveTaxonomyEntry(liveQuery.trim());
      setLiveResult(res);
    } catch {
      // Handled
    } finally {
      setIsSearchingLive(false);
    }
  };

  const getStatusBadge = (status: TaxonomyEntry['status']) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            <Check className="w-3 h-3" />
            VERIFIED
          </span>
        );
      case 'synonym':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3" />
            SYNONYM / OUTDATED
          </span>
        );
      case 'rank_mismatch':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
            <AlertCircle className="w-3 h-3" />
            TAXID MISMATCH
          </span>
        );
      case 'ambiguous':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
            <HelpCircle className="w-3 h-3" />
            AMBIGUOUS
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
            <AlertCircle className="w-3 h-3" />
            UNRESOLVED
          </span>
        );
    }
  };

  const synonymCount = taxa.filter(t => t.status === 'synonym').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Taxonomy Validation & NCBI Integration</h2>
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-slate-100 text-slate-700">
              {taxa.length} taxa tracked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Verifies scientific names and Linnaean ranks against the NCBI Taxonomy database. Detects reclassifications (e.g. <em>Clostridium difficile</em> &rarr; <em>Clostridioides difficile</em>, <em>Bacteroidetes</em> &rarr; <em>Bacteroidota</em>), catches mismatched TaxIDs, and prevents scientific name fragmentation.
          </p>
        </div>

        {synonymCount > 0 && (
          <button
            onClick={handleApplyAllSynonyms}
            className="px-3 py-2 text-xs font-semibold rounded bg-teal-800 hover:bg-teal-900 text-white flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apply Accepted Names to All ({synonymCount})</span>
          </button>
        )}
      </div>

      {/* Live NCBI Explorer Widget */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
          Live NCBI Taxonomy Query & Nomenclature Verifier
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            value={liveQuery}
            onChange={(e) => setLiveQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLiveLookup()}
            placeholder="Type any taxon name (e.g. Faecalibacterium prausnitzii, Propionibacterium acnes, Bacteroidetes)..."
            className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded px-3 py-2 focus:outline-hidden focus:border-teal-700 font-mono"
          />
          <button
            onClick={handleLiveLookup}
            disabled={isSearchingLive}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shrink-0"
          >
            {isSearchingLive ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Query NCBI</span>
          </button>
        </div>

        {liveResult && (
          <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 italic text-sm">{liveResult.cleaned_name}</span>
                {getStatusBadge(liveResult.status)}
              </div>
              {liveResult.ncbi_taxid && (
                <a
                  href={`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${liveResult.ncbi_taxid}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-800 hover:underline flex items-center gap-1 text-[11px] font-mono"
                >
                  <span>NCBI TaxID: {liveResult.ncbi_taxid}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {liveResult.accepted_name && liveResult.status === 'synonym' && (
              <div className="text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 font-medium">
                Accepted Scientific Name: <strong className="italic">{liveResult.accepted_name}</strong> (Rank: {liveResult.rank})
              </div>
            )}

            {liveResult.lineage && (
              <div className="text-slate-600 font-mono text-[11px]">
                <span className="text-slate-400">Lineage: </span>
                {liveResult.lineage.join(' > ')}
              </div>
            )}

            {liveResult.notes && (
              <p className="text-slate-500 text-[11px] italic">{liveResult.notes}</p>
            )}
          </div>
        )}
      </div>

      {/* Main Filter & Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by taxon name or TaxID..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:border-teal-700"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded text-xs font-medium">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({taxa.length})
            </button>
            <button
              onClick={() => setFilterStatus('verified')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterStatus === 'verified' ? 'bg-white text-emerald-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Verified
            </button>
            <button
              onClick={() => setFilterStatus('synonym')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterStatus === 'synonym' ? 'bg-white text-amber-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Synonyms ({synonymCount})
            </button>
            <button
              onClick={() => setFilterStatus('unresolved')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterStatus === 'unresolved' ? 'bg-white text-rose-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unresolved
            </button>
          </div>
        </div>

        {/* Taxa Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Reported Taxon Name</th>
                <th className="py-2.5 px-3">Linnaean Rank</th>
                <th className="py-2.5 px-3">NCBI TaxID</th>
                <th className="py-2.5 px-3">Accepted Scientific Name</th>
                <th className="py-2.5 px-3">Curatorial Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredTaxa.map((t, idx) => {
                const isSyn = t.status === 'synonym';
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {getStatusBadge(t.status)}
                    </td>

                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-sans italic">
                      {t.raw_name}
                    </td>

                    <td className="py-2.5 px-3 capitalize text-slate-600 font-sans">
                      {t.rank || '—'}
                    </td>

                    <td className="py-2.5 px-3">
                      {t.ncbi_taxid ? (
                        <a
                          href={`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${t.ncbi_taxid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-800 hover:underline flex items-center gap-1 font-mono"
                        >
                          <span>{t.ncbi_taxid}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 font-sans">Unassigned</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-sans italic">
                      {t.accepted_name && t.accepted_name !== t.raw_name ? (
                        <span className="text-teal-900 font-semibold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          {t.accepted_name}
                        </span>
                      ) : (
                        <span className="text-slate-500">{t.accepted_name || t.raw_name}</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                      {isSyn && t.accepted_name ? (
                        <button
                          onClick={() => handleApplyAcceptedName(t)}
                          className="px-2 py-1 text-xs font-semibold rounded bg-teal-800 hover:bg-teal-900 text-white flex items-center gap-1 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          <span>Accept Name</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">No change required</span>
                      )}
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
