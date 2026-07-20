import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/shared/PageHeader';
import { PatientReferralCards } from '../components/patients/PatientReferralCards';
import { Card } from '../components/shared/Card';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorAlert } from '../components/shared/ErrorAlert';
import { StatusBadge } from '../components/shared/StatusBadge';
import { PagePagination } from '../components/shared/PagePagination';
import { useProtocolPatients } from '../hooks/useComplianceSummary';
import { useProtocols } from '../hooks/useLookups';
import { formatPercentage } from '../utils/formatters';
import { COMPLIANCE_COLORS } from '../utils/colors';
import {
  complianceCategoryLabel,
  COMPLIANCE_CATEGORY_HELP,
  COMPLIANCE_RATE_HELP,
} from '../utils/compliance';
import { PATIENT_LIST_PAGE_SIZE, PATIENT_LIST_PAGE_SIZE_OPTIONS, COMPLIANCE_STATUS_OPTIONS } from '../config';
import type { ComplianceCategory } from '../api/types';

export default function PatientList() {
  const [protocolId, setProtocolId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PATIENT_LIST_PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState<'enrollment' | 'activity'>('enrollment');

  const protocols = useProtocols();
  const cursor = page > 1 ? String((page - 1) * pageSize) : undefined;

  useEffect(() => {
    if (!protocolId && protocols.data && protocols.data.length > 0) {
      setProtocolId(protocols.data[0].id);
    }
  }, [protocols.data, protocolId]);

  const patients = useProtocolPatients(protocolId, {
    status: statusFilter || undefined,
    cursor,
    limit: pageSize,
    patientId: activeSearch || undefined,
    dateFilterMode,
  });

  const totalCount = patients.data?.pagination.total_count;
  const rowCount = patients.data?.data.length ?? 0;
  const totalPages = totalCount != null
    ? Math.max(1, Math.ceil(totalCount / pageSize))
    : Math.max(page, patients.data?.pagination.has_more ? page + 1 : page);

  const range = useMemo(() => {
    if (rowCount === 0) {
      return { start: 0, end: 0 };
    }
    const start = (page - 1) * pageSize + 1;
    const end = totalCount != null
      ? Math.min(page * pageSize, totalCount)
      : start + rowCount - 1;
    return { start, end };
  }, [rowCount, page, pageSize, totalCount]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetPagination = () => setPage(1);

  const canNext = totalCount != null
    ? page < totalPages
    : Boolean(patients.data?.pagination.has_more);

  const pageDescription = dateFilterMode === 'activity'
    ? 'Distinct patients with step activity in the selected period. Compliant / Non-Compliant follows the same deviation-based rules as the dashboard.'
    : 'Distinct patients enrolled in the selected protocol during the selected period. Compliant / Non-Compliant follows the same deviation-based rules as the dashboard.';

  return (
    <>
      <PageHeader title="Patient Compliance" description={pageDescription} />

      <PatientReferralCards className="mb-6" />

      <Card title="Patient List">
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Protocol</label>
            <select
              value={protocolId}
              onChange={(e) => { setProtocolId(e.target.value); resetPagination(); }}
              className="w-56 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a protocol...</option>
              {protocols.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.url.split('/').pop()} (v{p.version})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-end">
            {COMPLIANCE_STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value || 'all'}
                type="button"
                onClick={() => { setStatusFilter(value); resetPagination(); }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500">Filter by:</span>
            {(['enrollment', 'activity'] as const).map((mode) => (
              <label key={mode} className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-700">
                <input
                  type="radio"
                  name="dateFilterMode"
                  value={mode}
                  checked={dateFilterMode === mode}
                  onChange={() => { setDateFilterMode(mode); resetPagination(); }}
                  className="accent-blue-600"
                />
                {mode === 'enrollment' ? 'Enrollment Date' : 'Activity Date'}
              </label>
            ))}
          </div>

          <div className="flex-1" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setActiveSearch(searchTerm.trim());
              resetPagination();
            }}
            className="flex items-end gap-2"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Search Patient</label>
              <input
                type="text"
                placeholder="Enter patient ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-56 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Search
            </button>
            {activeSearch && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActiveSearch('');
                  resetPagination();
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        <p className="mb-4 text-xs text-gray-500">{COMPLIANCE_CATEGORY_HELP}</p>

        {!protocolId && (
          <p className="py-4 text-center text-sm text-gray-400">Select a protocol to view patients.</p>
        )}

        {protocolId && patients.isPending && <LoadingSpinner />}
        {patients.error && <ErrorAlert error={patients.error} />}

        {protocolId && patients.data && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="pb-2 pr-4">Patient ID</th>
                    <th className="pb-2 pr-4">Category</th>
                    <th className="pb-2 pr-4" title={COMPLIANCE_RATE_HELP}>Rate</th>
                    <th className="pb-2 pr-4">Steps</th>
                    <th className="pb-2">Deviations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {patients.data.data.map((p) => (
                    <tr key={`${p.patientId}-${p.protocolInstanceId}`} className="hover:bg-gray-50">
                      <td className="py-2 pr-4">
                        <Link to={`/compliance/patients/${encodeURIComponent(p.patientId)}`} className="font-medium text-blue-600 hover:text-blue-700">
                          {p.patientId}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">
                        <StatusBadge
                          label={complianceCategoryLabel(p.complianceCategory)}
                          color={COMPLIANCE_COLORS[p.complianceCategory as ComplianceCategory] ?? { bg: 'bg-gray-100', text: 'text-gray-700' }}
                        />
                      </td>
                      <td className="py-2 pr-4">{formatPercentage(p.complianceRate)}</td>
                      <td className="py-2 pr-4">{p.stepsCompleted}/{p.totalSteps}</td>
                      <td className="py-2">{p.activeDeviations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rowCount === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">No patients match the current filters.</p>
            )}
            <PagePagination
              pageSize={pageSize}
              pageSizeOptions={[...PATIENT_LIST_PAGE_SIZE_OPTIONS]}
              onPageSizeChange={(size) => { setPageSize(size); resetPagination(); }}
              start={range.start}
              end={range.end}
              totalCount={totalCount}
              onPrevious={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
              canPrevious={page > 1}
              canNext={canNext}
            />
          </>
        )}
      </Card>
    </>
  );
}
