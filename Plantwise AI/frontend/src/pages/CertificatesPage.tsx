import React, { useState, useEffect } from 'react';
import { Printer, QrCode, Search, Trees, X } from 'lucide-react';
import { api } from '../services/api';
import type { CertificateItem } from '../types';
import { ComplianceDisclaimer } from '../components/common/ComplianceDisclaimer';

interface CertificatesPageProps {
  initialData?: any;
}

export const CertificatesPage: React.FC<CertificatesPageProps> = ({ initialData }) => {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  
  // Form fields for new certificate
  const [projectName, setProjectName] = useState<string>(initialData?.siteName ? `${initialData.siteName} Afforestation Drive` : 'Mumbai Urban Green Drive');
  const [planterName, setPlanterName] = useState<string>('Priyanshu Sharma');
  const [planterRole, setPlanterRole] = useState<string>('Citizen / Volunteer');
  const [organization, setOrganization] = useState<string>('Independent Citizen Initiative');
  const [locationName, setLocationName] = useState<string>(initialData?.siteName || 'Bandra Seaside Promenade, Mumbai');
  const [latitude, setLatitude] = useState<number>(initialData?.latitude || 19.0435);
  const [longitude, setLongitude] = useState<number>(initialData?.longitude || 72.8198);
  const [landType, setLandType] = useState<string>(initialData?.landType || 'Municipal Public Ground');
  const [treesCount, setTreesCount] = useState<number>(initialData?.targetTrees || 50);
  const [speciesInput, setSpeciesInput] = useState<string>('Neem, Karanj, Bakul, Jamun');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Verification modal state
  const [verifyHashInput, setVerifyHashInput] = useState<string>('');
  const [verifyResult, setVerifyResult] = useState<any>(null);

  useEffect(() => {
    fetchCertificates();
    if (initialData) {
      setShowCreateModal(true);
    }
  }, [initialData]);

  const fetchCertificates = async () => {
    try {
      const data = await api.getCertificates();
      setCertificates(data);
      if (data.length > 0 && !selectedCert) {
        setSelectedCert(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
    }
  };

  const handleCreateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        project_name: projectName,
        planter_name: planterName,
        planter_role: planterRole,
        organization,
        location_name: locationName,
        district: 'Maharashtra',
        latitude,
        longitude,
        land_type: landType,
        trees_count: treesCount,
        species_planted: speciesInput.split(',').map(s => s.trim()).filter(Boolean),
        authority_reference: 'Tree Authority Record: MC/TREE/2026/P-882',
        compliance_score: 92
      };

      const created = await api.issueCertificate(payload);
      setCertificates(prev => [created, ...prev]);
      setSelectedCert(created);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to issue certificate:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleVerifyHash = async () => {
    if (!verifyHashInput) return;
    try {
      const res = await api.verifyCertificate(verifyHashInput.trim());
      setVerifyResult(res);
    } catch (err) {
      setVerifyResult({ valid: false, message: 'Verification error' });
    }
  };

  return (
    <div className="py-8 px-6 sm:px-10 lg:px-12 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-forest-100 text-forest-800 dark:bg-forest-900/60 dark:text-forest-300 border border-forest-200 dark:border-forest-800">
              Verifiable Ledger
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Digital Plantation Certificates
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Cryptographically signed digital certificates for verified afforestation projects.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-forest-700 hover:bg-forest-800 text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-subtle"
        >
          Issue Certificate
        </button>
      </div>

      <ComplianceDisclaimer compact className="no-print" />

      {/* Main Grid: Certificate View + Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CERTIFICATE DISPLAY (8 Cols) */}
        <div className="lg:col-span-8 space-y-3">
          {selectedCert ? (
            <div className="space-y-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between no-print text-xs">
                <span className="font-mono text-zinc-500 text-[11px]">
                  ID: {selectedCert.certificate_id}
                </span>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-border dark:border-zinc-700 hover:bg-forest-50 dark:hover:bg-zinc-700 hover:text-forest-800 hover:border-forest-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
              </div>

              {/* Certificate Sheet */}
              <div className="p-8 sm:p-12 rounded-2xl bg-card dark:bg-zinc-900 border border-forest-200 dark:border-forest-900/60 text-center space-y-6 shadow-card">
                {/* Header */}
                <div className="space-y-1.5 border-b border-border dark:border-zinc-800 pb-5">
                  <div className="w-12 h-12 mx-auto rounded-full bg-forest-100 dark:bg-forest-900/60 flex items-center justify-center text-forest-800 dark:text-forest-300 mb-2 border border-forest-200 dark:border-forest-800">
                    <Trees className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-forest-700 dark:text-forest-400 block">
                    Government of Maharashtra • Urban Forestry
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Digital Plantation Certificate
                  </h2>
                </div>

                {/* Body */}
                <div className="space-y-4 max-w-md mx-auto text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  <p>
                    This document certifies that <strong className="text-zinc-900 dark:text-white font-bold">{selectedCert.planter_name}</strong>
                    {selectedCert.organization && ` (${selectedCert.organization})`}, has completed a verified native plantation of
                  </p>

                  <div className="p-4 rounded-xl bg-forest-50/80 dark:bg-forest-950/40 border border-forest-200 dark:border-forest-900 space-y-0.5 my-2">
                    <span className="text-2xl font-bold text-forest-900 dark:text-forest-100 font-sans block">
                      {selectedCert.trees_count} Trees
                    </span>
                    <span className="text-xs text-forest-700 dark:text-forest-400 font-medium block">
                      {selectedCert.species_planted.join(', ')}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Location: <strong className="text-zinc-900 dark:text-white">{selectedCert.location_name}</strong> ({selectedCert.land_type})<br />
                    Coordinates: <span className="font-mono text-zinc-600 dark:text-zinc-400">{selectedCert.latitude.toFixed(4)}° N, {selectedCert.longitude.toFixed(4)}° E</span>
                  </p>
                </div>

                {/* Footer */}
                <div className="grid grid-cols-3 gap-4 pt-5 border-t border-border dark:border-zinc-800 text-left text-xs items-center">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block uppercase font-medium">Record ID</span>
                    <strong className="font-mono text-zinc-800 dark:text-zinc-200 text-xs block">{selectedCert.certificate_id}</strong>
                    <span className="text-[10px] text-forest-700 dark:text-forest-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-forest-600 inline-block"></span> Verified Status
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="p-1.5 bg-white rounded-lg border border-zinc-200 shadow-xs">
                      <QrCode className="w-10 h-10 text-zinc-900" />
                    </div>
                  </div>

                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block uppercase font-medium">Date</span>
                    <strong className="text-zinc-800 dark:text-zinc-200 text-xs block">{new Date(selectedCert.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-xl bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 text-center text-xs text-zinc-400">
              Select a certificate from the registry to view
            </div>
          )}
        </div>

        {/* SIDEBAR: Registry & Verifier (4 Cols) */}
        <div className="lg:col-span-4 space-y-4 no-print">
          {/* Authenticity Verifier */}
          <div className="p-4 rounded-xl bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 shadow-card space-y-2.5">
            <h3 className="font-semibold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-forest-600"></span>
              Verify Certificate Hash
            </h3>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Enter Hash / ID..."
                value={verifyHashInput}
                onChange={(e) => setVerifyHashInput(e.target.value)}
                className="flex-1 bg-surface-elevated dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
              />
              <button
                onClick={handleVerifyHash}
                className="px-3.5 py-1.5 rounded-lg bg-forest-700 hover:bg-forest-800 text-white text-xs font-medium cursor-pointer transition-colors shadow-xs"
              >
                Verify
              </button>
            </div>

            {verifyResult && (
              <div className={`p-3 rounded-lg text-xs space-y-0.5 ${verifyResult.valid ? 'bg-forest-50/80 dark:bg-forest-950/40 text-forest-950 dark:text-forest-200 border border-forest-200 dark:border-forest-800' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                {verifyResult.valid ? (
                  <>
                    <strong className="block text-forest-800 dark:text-forest-300 font-semibold">Verified Authentic</strong>
                    <p className="text-[11px] text-forest-700 dark:text-forest-400">{verifyResult.project_name} ({verifyResult.trees_count} Trees)</p>
                  </>
                ) : (
                  <p>{verifyResult.message || 'Invalid Certificate'}</p>
                )}
              </div>
            )}
          </div>

          {/* Registry List */}
          <div className="p-4 rounded-xl bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 shadow-card space-y-3">
            <h3 className="font-semibold text-xs text-zinc-900 dark:text-white">
              Issued Registry ({certificates.length})
            </h3>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {certificates.map((cert) => {
                const isSelected = selectedCert?.id === cert.id;
                return (
                  <div
                    key={cert.id}
                    onClick={() => setSelectedCert(cert)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer text-xs space-y-1 ${
                      isSelected
                        ? 'bg-forest-50/90 dark:bg-forest-950/50 border-forest-400 dark:border-forest-700 text-forest-950 dark:text-forest-100 shadow-xs'
                        : 'bg-card dark:bg-zinc-900 border-border dark:border-zinc-800 hover:border-forest-300 dark:hover:border-forest-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-zinc-900 dark:text-white truncate">
                        {cert.project_name}
                      </h4>
                      <span className="font-mono text-[10px] text-forest-700 dark:text-forest-400 shrink-0 font-medium">
                        {cert.trees_count} trees
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                      {cert.planter_name} • {cert.location_name.split(',')[0]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Issue Certificate */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card dark:bg-zinc-900 max-w-lg w-full rounded-2xl p-6 shadow-xl border border-border dark:border-zinc-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Issue Digital Certificate
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Record a completed plantation project</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCertificate} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-surface-elevated dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Planter Name
                  </label>
                  <input
                    type="text"
                    required
                    value={planterName}
                    onChange={(e) => setPlanterName(e.target.value)}
                    className="w-full bg-surface-elevated dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full bg-surface-elevated dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Location Name
                  </label>
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full bg-surface-elevated dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Trees Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={treesCount}
                    onChange={(e) => setTreesCount(Number(e.target.value))}
                    className="w-full bg-surface-elevated dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Species Planted (Comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={speciesInput}
                  onChange={(e) => setSpeciesInput(e.target.value)}
                  className="w-full bg-surface-elevated dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 mt-2 rounded-lg bg-forest-700 hover:bg-forest-800 text-white text-xs font-medium cursor-pointer transition-colors shadow-subtle"
              >
                {isSubmitting ? 'Issuing...' : 'Create Certificate Record'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
