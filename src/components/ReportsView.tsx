import React, { useState } from 'react';
import { 
  Download, Printer, FileText, CheckCircle, AlertTriangle, 
  AlertCircle, ShieldCheck, History, ArrowRight 
} from 'lucide-react';
import { QCReportSummary, AuditRecord } from '../types/microbiome';

interface ReportsViewProps {
  report: QCReportSummary;
  auditTrail: AuditRecord[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  report,
  auditTrail
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filteredIssues = report.issues.filter(i => {
    if (filterSeverity === 'all') return true;
    return i.severity === filterSeverity;
  });

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `microbiome_qc_report_${Date.now()}.json`);
    dlAnchorElem.click();
  };

  const downloadCSV = () => {
    const headers = ['id', 'severity', 'category', 'rule_id', 'rule_name', 'record_id', 'field', 'detected_value', 'suggested_correction', 'message', 'rationale'];
    const rows = report.issues.map(iss => [
      iss.id,
      iss.severity,
      iss.category,
      iss.rule_id,
      `"${iss.rule_name.replace(/"/g, '""')}"`,
      iss.record_id,
      iss.field,
      `"${String(iss.detected_value ?? '').replace(/"/g, '""')}"`,
      `"${String(iss.suggested_correction ?? '').replace(/"/g, '""')}"`,
      `"${iss.message.replace(/"/g, '""')}"`,
      `"${iss.rationale.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `microbiome_qc_issues_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadHTML = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Microbiome QC Report - ${report.dataset_name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1e293b; background: #f8fafc; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    h1 { font-size: 24px; margin-top: 0; color: #0f172a; }
    h2 { font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 0; }
    .score { font-size: 42px; font-weight: bold; color: ${report.quality_score >= 90 ? '#15803d' : report.quality_score >= 70 ? '#b45309' : '#b91c1c'}; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }
    .kpi { background: #f1f5f9; padding: 16px; border-radius: 6px; }
    .kpi span { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
    .kpi strong { display: block; font-size: 24px; color: #0f172a; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: bold; color: #475569; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; text-transform: uppercase; }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-notice { background: #e0f2fe; color: #075985; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Microbiome Data Quality Control Report</h1>
    <p><strong>Dataset:</strong> ${report.dataset_name} | <strong>Profile:</strong> ${report.validation_profile} | <strong>Date:</strong> ${new Date(report.validation_date).toLocaleString()}</p>
    <p><strong>Software Engine:</strong> ${report.software_version}</p>
    
    <div class="kpi-grid">
      <div class="kpi">
        <span>Quality Score</span>
        <strong class="score">${report.quality_score} / 100</strong>
      </div>
      <div class="kpi">
        <span>Critical Errors</span>
        <strong style="color: #b91c1c">${report.critical_count}</strong>
      </div>
      <div class="kpi">
        <span>Warnings</span>
        <strong style="color: #b45309">${report.warning_count}</strong>
      </div>
      <div class="kpi">
        <span>Evaluated Samples</span>
        <strong>${report.total_samples}</strong>
      </div>
    </div>
  </div>

  <div class="card">
    <h2>Identified Quality Issues (${report.issues.length})</h2>
    <table>
      <thead>
        <tr>
          <th>Severity</th>
          <th>Domain</th>
          <th>Record ID</th>
          <th>Field</th>
          <th>Issue Message</th>
          <th>Suggested Correction</th>
        </tr>
      </thead>
      <tbody>
        ${report.issues.map(i => `
          <tr>
            <td><span class="badge badge-${i.severity}">${i.severity}</span></td>
            <td>${i.category}</td>
            <td><code>${i.record_id}</code></td>
            <td><code>${i.field}</code></td>
            <td>${i.message}</td>
            <td><strong>${i.suggested_correction !== undefined ? i.suggested_correction : '—'}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `microbiome_qc_report_${Date.now()}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Buttons */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Comprehensive Quality-Control Report</h2>
          <p className="text-xs text-slate-500 mt-1">
            Publication-grade verification report conforming to STREGA and Nature Microbiology reporting standards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={downloadHTML}
            className="px-3 py-2 text-xs font-semibold rounded bg-teal-800 hover:bg-teal-900 text-white flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download HTML Report</span>
          </button>

          <button
            onClick={downloadCSV}
            className="px-3 py-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={downloadJSON}
            className="px-3 py-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>JSON</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 text-xs font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Report Summary Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">QC Summary Dossier</span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{report.dataset_name}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Evaluated on {new Date(report.validation_date).toLocaleDateString()} with profile: <strong>{report.validation_profile}</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono text-slate-400 uppercase block">Reproducibility Index</span>
            <div className="flex items-baseline justify-end gap-1 mt-0.5">
              <span className={`text-4xl font-mono font-bold ${
                report.quality_score >= 90 ? 'text-emerald-700' : report.quality_score >= 70 ? 'text-amber-700' : 'text-rose-700'
              }`}>
                {report.quality_score}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 100</span>
            </div>
          </div>
        </div>

        {/* Severity Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">Critical Errors</span>
            <span className="text-2xl font-bold font-mono text-rose-700">{report.critical_count}</span>
            <span className="text-[11px] text-rose-600 block mt-1">Must be resolved prior to modeling</span>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">Warnings</span>
            <span className="text-2xl font-bold font-mono text-amber-700">{report.warning_count}</span>
            <span className="text-[11px] text-amber-600 block mt-1">May bias variance estimation</span>
          </div>

          <div className="p-3 bg-sky-50 border border-sky-200 rounded">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 block">Notices</span>
            <span className="text-2xl font-bold font-mono text-sky-700">{report.notice_count}</span>
            <span className="text-[11px] text-sky-600 block mt-1">Format standardization</span>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">Passed Checks</span>
            <span className="text-2xl font-bold font-mono text-emerald-700">{report.passed_count}</span>
            <span className="text-[11px] text-emerald-600 block mt-1">Satisfies MIMARKS invariants</span>
          </div>
        </div>

        {/* Filtered Issues Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">All Flagged Inconsistencies & Recommendations</h4>
            
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded text-xs">
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-2 py-0.5 rounded ${filterSeverity === 'all' ? 'bg-white font-bold shadow-xs' : 'text-slate-600'}`}
              >
                All ({report.issues.length})
              </button>
              <button
                onClick={() => setFilterSeverity('critical')}
                className={`px-2 py-0.5 rounded ${filterSeverity === 'critical' ? 'bg-white text-rose-700 font-bold shadow-xs' : 'text-slate-600'}`}
              >
                Critical ({report.critical_count})
              </button>
              <button
                onClick={() => setFilterSeverity('warning')}
                className={`px-2 py-0.5 rounded ${filterSeverity === 'warning' ? 'bg-white text-amber-700 font-bold shadow-xs' : 'text-slate-600'}`}
              >
                Warnings ({report.warning_count})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Rule ID</th>
                  <th className="py-2.5 px-3">Record</th>
                  <th className="py-2.5 px-3">Field</th>
                  <th className="py-2.5 px-3">Detected Issue</th>
                  <th className="py-2.5 px-3">Evidence / Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredIssues.map((iss, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        iss.severity === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        iss.severity === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}>
                        {iss.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{iss.rule_id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{iss.record_id}</td>
                    <td className="py-2.5 px-3 text-slate-600">{iss.field}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-800">{iss.message}</td>
                    <td className="py-2.5 px-3 font-sans">
                      {iss.suggested_correction !== undefined && (
                        <div className="text-teal-800 font-medium">
                          Suggested: <span className="font-mono bg-teal-50 px-1 rounded border border-teal-200">{String(iss.suggested_correction)}</span>
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500">{iss.evidence}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Trail Section */}
        <div className="space-y-3 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            <h4 className="text-sm font-bold text-slate-900">Curatorial Audit Trail ({auditTrail.length} logged actions)</h4>
          </div>
          <p className="text-xs text-slate-500">
            Immutable log of all accepted, rejected, and manually edited corrections to prevent silent data alteration.
          </p>

          {auditTrail.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded border border-slate-100 text-xs text-slate-500 text-center">
              No curatorial corrections have been made yet in this session.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Record ID</th>
                    <th className="py-2 px-3">Field</th>
                    <th className="py-2 px-3">Action</th>
                    <th className="py-2 px-3">Original &rarr; New</th>
                    <th className="py-2 px-3">Curator Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditTrail.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500">{new Date(rec.timestamp).toLocaleTimeString()}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{rec.record_id}</td>
                      <td className="py-2 px-3 text-slate-600">{rec.field}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          rec.action === 'accepted' ? 'bg-emerald-50 text-emerald-800' :
                          rec.action === 'manual_edit' ? 'bg-teal-50 text-teal-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {rec.action.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-700">
                        <span className="text-rose-600 line-through mr-1">{String(rec.original_value ?? '—')}</span>
                        &rarr;
                        <span className="text-emerald-700 font-bold ml-1">{String(rec.updated_value ?? '—')}</span>
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-600 text-[11px]">{rec.user_note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
