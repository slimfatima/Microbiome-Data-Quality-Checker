import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  AlertTriangle, CheckCircle, AlertCircle, FileText, 
  ArrowRight, Database, Dna, Activity, Award
} from 'lucide-react';
import { DatasetBundle, QCReportSummary, ValidationIssue } from '../types/microbiome';
import { ActiveTab } from './Header';

interface DashboardViewProps {
  currentDataset: DatasetBundle;
  report: QCReportSummary;
  onSelectDataset: (key: string) => void;
  onSelectTab: (tab: ActiveTab) => void;
  onSelectIssue: (issue: ValidationIssue) => void;
}

const SEVERITY_COLORS = {
  critical: '#dc2626',
  warning: '#f59e0b',
  notice: '#0284c7',
  pass: '#16a34a'
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentDataset,
  report,
  onSelectDataset,
  onSelectTab,
  onSelectIssue
}) => {
  // Category data for BarChart
  const categoryChartData = [
    {
      category: 'Metadata',
      Critical: report.category_breakdown.metadata.critical,
      Warning: report.category_breakdown.metadata.warning,
      Notice: report.category_breakdown.metadata.notice,
      Passed: report.category_breakdown.metadata.pass
    },
    {
      category: 'Taxonomy',
      Critical: report.category_breakdown.taxonomy.critical,
      Warning: report.category_breakdown.taxonomy.warning,
      Notice: report.category_breakdown.taxonomy.notice,
      Passed: report.category_breakdown.taxonomy.pass
    },
    {
      category: 'Signatures',
      Critical: report.category_breakdown.signatures.critical,
      Warning: report.category_breakdown.signatures.warning,
      Notice: report.category_breakdown.signatures.notice,
      Passed: report.category_breakdown.signatures.pass
    },
    {
      category: 'Experiments',
      Critical: report.category_breakdown.experiments.critical,
      Warning: report.category_breakdown.experiments.warning,
      Notice: report.category_breakdown.experiments.notice,
      Passed: report.category_breakdown.experiments.pass
    }
  ];

  // Pie chart data
  const pieData = [
    { name: 'Critical Errors', value: report.critical_count, color: SEVERITY_COLORS.critical },
    { name: 'Warnings', value: report.warning_count, color: SEVERITY_COLORS.warning },
    { name: 'Informational', value: report.notice_count, color: SEVERITY_COLORS.notice },
    { name: 'Passed Checks', value: report.passed_count, color: SEVERITY_COLORS.pass }
  ].filter(d => d.value > 0);

  // Group sample sizes
  const groupCounts: Record<string, number> = {};
  currentDataset.samples.forEach(s => {
    const grp = s.experimental_group || 'Unspecified';
    groupCounts[grp] = (groupCounts[grp] || 0) + 1;
  });
  const groupChartData = Object.entries(groupCounts).map(([group, count]) => ({
    group: group.length > 16 ? group.slice(0, 16) + '...' : group,
    samples: count
  }));

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-6">
      {/* Top Benchmark Quick-Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-slate-500">Active Dataset</span>
          <h2 className="text-base font-bold text-slate-900 mt-0.5">{currentDataset.name}</h2>
          <p className="text-xs text-slate-600 mt-0.5">{currentDataset.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium mr-1">Load Benchmark:</span>
          <button
            onClick={() => onSelectDataset('crc_cohort')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded border transition-colors ${
              currentDataset.id === 'crc_cohort'
                ? 'bg-teal-50 border-teal-600 text-teal-800'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            CRC Cohort (Flawed)
          </button>
          <button
            onClick={() => onSelectDataset('longitudinal_infant')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded border transition-colors ${
              currentDataset.id === 'longitudinal_infant'
                ? 'bg-teal-50 border-teal-600 text-teal-800'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            Infant Longitudinal
          </button>
          <button
            onClick={() => onSelectDataset('pristine_validated')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded border transition-colors ${
              currentDataset.id === 'pristine_validated'
                ? 'bg-teal-50 border-teal-600 text-teal-800'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            Pristine Benchmark (100%)
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Quality Score */}
        <div className={`p-4 rounded-lg border ${getScoreColor(report.quality_score)} flex flex-col justify-between`}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider">Quality Score</span>
            <Award className="w-4 h-4 opacity-75" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-mono font-bold">{report.quality_score}</span>
            <span className="text-xs ml-1 font-mono">/ 100</span>
          </div>
          <span className="text-[11px] mt-1 font-medium">
            {report.quality_score >= 90 ? 'Publication Grade' : report.quality_score >= 70 ? 'Requires Revision' : 'Critical Defects'}
          </span>
        </div>

        {/* Total Samples */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs uppercase font-mono tracking-wider">Total Samples</span>
            <Database className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-mono font-bold text-slate-900">{report.total_samples}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Across 1 experiment</span>
        </div>

        {/* Critical Errors */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs uppercase font-mono tracking-wider">Critical Errors</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-mono font-bold text-rose-600">{report.critical_count}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Blocks analysis</span>
        </div>

        {/* Warnings */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs uppercase font-mono tracking-wider">Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-mono font-bold text-amber-600">{report.warning_count}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Review recommended</span>
        </div>

        {/* Informational */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-sky-600">
            <span className="text-xs uppercase font-mono tracking-wider">Notices</span>
            <Activity className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-mono font-bold text-sky-600">{report.notice_count}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Format standardization</span>
        </div>

        {/* Taxa & Signatures */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs uppercase font-mono tracking-wider">Taxa / Signatures</span>
            <Dna className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-mono font-bold text-slate-900">{report.total_taxa}</span>
            <span className="text-xs font-mono text-slate-400 mx-1">/</span>
            <span className="text-2xl font-mono font-bold text-slate-900">{report.total_signatures}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Evaluated items</span>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issues by Validation Module */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Validation Breakdown by Pipeline Domain</h3>
              <p className="text-xs text-slate-500">Inspection findings across metadata, taxonomy, signatures, and experiment setup</p>
            </div>
            <span className="text-xs font-mono text-slate-500 uppercase">{report.validation_profile}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                />
                <Bar dataKey="Critical" fill={SEVERITY_COLORS.critical} stackId="a" />
                <Bar dataKey="Warning" fill={SEVERITY_COLORS.warning} stackId="a" />
                <Bar dataKey="Notice" fill={SEVERITY_COLORS.notice} stackId="a" />
                <Bar dataKey="Passed" fill={SEVERITY_COLORS.pass} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-red-600 inline-block" />
              <span>Critical Error</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" />
              <span>Warning</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-sky-600 inline-block" />
              <span>Notice</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" />
              <span>Passed</span>
            </div>
          </div>
        </div>

        {/* Severity Proportions */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Severity Distribution</h3>
            <p className="text-xs text-slate-500">Overall ratio of clean vs flagged findings</p>
          </div>

          <div className="h-52 w-full my-auto">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No items to display
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 flex justify-between text-xs font-mono">
            <span className="text-slate-500">Total Findings:</span>
            <span className="font-bold text-slate-800">{report.issues.length} flagged</span>
          </div>
        </div>
      </div>

      {/* Priority Action Issues Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Priority Issues Requiring Curatorial Action</h3>
            <p className="text-xs text-slate-500">Click any issue to inspect affected records, rule evidence, and suggested fixes</p>
          </div>
          <button
            onClick={() => onSelectTab('reports')}
            className="text-xs font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1"
          >
            <span>View Full Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {report.issues.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-lg border border-slate-100">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-900">All Quality Checks Passed</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Dataset satisfies all required metadata, taxonomy, and statistical criteria. Ready for downstream differential abundance modeling and repository submission.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Domain</th>
                  <th className="py-2.5 px-3">Record ID</th>
                  <th className="py-2.5 px-3">Field</th>
                  <th className="py-2.5 px-3">Detected Issue</th>
                  <th className="py-2.5 px-3">Suggested Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.issues.slice(0, 6).map((iss, i) => (
                  <tr 
                    key={iss.id || i}
                    onClick={() => onSelectIssue(iss)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        iss.severity === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        iss.severity === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}>
                        {iss.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 capitalize font-medium text-slate-700">{iss.category}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{iss.record_id}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{iss.field}</td>
                    <td className="py-2.5 px-3 text-slate-800 max-w-xs truncate">{iss.message}</td>
                    <td className="py-2.5 px-3 text-teal-800 font-medium">
                      {iss.suggested_correction !== undefined ? (
                        <span className="font-mono bg-teal-50 px-1.5 py-0.5 rounded text-[11px] border border-teal-200">
                          {String(iss.suggested_correction)}
                        </span>
                      ) : (
                        <span className="text-slate-400">Manual review</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
