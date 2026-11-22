import React, { useState, useEffect } from 'react';
import { 
  Database, Upload, FileText, CheckCircle2, AlertTriangle, 
  Trash2, RefreshCw, Eye, ArrowRight, Layers 
} from 'lucide-react';
import { 
  getAdminDatasets, 
  previewDatasetCsv, 
  importDatasetRecords, 
  deleteDataset 
} from '../../services/api';

export const DatasetManagementPage = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [datasetName, setDatasetName] = useState('');
  const [datasetDesc, setDatasetDesc] = useState('');
  const [fieldMapping, setFieldMapping] = useState({
    original_text: '',
    disaster_type: '',
    raw_location: '',
    state: '',
    district: '',
    latitude: '',
    longitude: ''
  });
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const data = await getAdminDatasets();
      setDatasets(data);
    } catch (err) {
      console.error('Failed to load datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setDatasetName(file.name.replace(/\.[^/.]+$/, ""));

    const formData = new FormData();
    formData.append('file', file);

    try {
      setPreviewing(true);
      const preview = await previewDatasetCsv(formData);
      setPreviewData(preview);

      // Auto-detect columns
      const cols = preview.columns || [];
      const autoMap = { ...fieldMapping };
      cols.forEach(c => {
        const cl = c.toLowerCase();
        if (cl.includes('text') || cl.includes('tweet') || cl.includes('desc')) autoMap.original_text = c;
        if (cl.includes('disaster') || cl.includes('hazard') || cl.includes('event')) autoMap.disaster_type = c;
        if (cl.includes('loc') || cl.includes('place')) autoMap.raw_location = c;
        if (cl.includes('state')) autoMap.state = c;
        if (cl.includes('district')) autoMap.district = c;
        if (cl.includes('lat')) autoMap.latitude = c;
        if (cl.includes('lon') || cl.includes('lng')) autoMap.longitude = c;
      });
      setFieldMapping(autoMap);
    } catch (err) {
      alert('Error parsing CSV file: ' + (err.response?.data?.detail || err.message));
    } finally {
      setPreviewing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || !datasetName) return;
    try {
      setImporting(true);
      const payload = {
        name: datasetName,
        source_description: datasetDesc || 'Imported research dataset',
        records: previewData.preview_rows, // In production could be full batch parsed client/server
        field_mapping: fieldMapping
      };
      const res = await importDatasetRecords(payload);
      setImportResult(res);
      setSelectedFile(null);
      setPreviewData(null);
      await loadDatasets();
    } catch (err) {
      alert('Import failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (datasetId) => {
    if (!window.confirm(`Are you sure you want to remove dataset ${datasetId} and its imported records?`)) return;
    try {
      await deleteDataset(datasetId);
      await loadDatasets();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F4EDE0]/10">
        <div>
          <h1 className="font-serif text-3xl text-[#F4EDE0] font-normal">Dataset Ingestion & Provenance</h1>
          <p className="text-xs text-[#F4EDE0]/60 mt-1">
            Import, inspect schemas, and manage external research disaster datasets with isolated provenance.
          </p>
        </div>
        <button
          onClick={loadDatasets}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4EDE0]/5 hover:bg-[#F4EDE0]/10 text-xs text-[#F4EDE0]/70 border border-[#F4EDE0]/10"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Provenance Isolation Notice */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs flex items-start gap-3">
        <Database className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Provenance Boundary:</strong> Imported research records (e.g. HumAID, India-Nepal Disaster Corpus, PetaBencana)
          are tagged with <code>data_origin: "imported_dataset"</code>. They are segregated from genuine citizen dispatches to prevent contamination of live operational metrics.
        </div>
      </div>

      {/* Upload & Ingestion Panel */}
      <section className="glass-panel p-6 rounded-2xl border border-[#F4EDE0]/10 space-y-5">
        <h2 className="font-serif text-xl text-[#F4EDE0]">Ingest Research Dataset (CSV / JSON)</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-[#F4EDE0]/20 rounded-2xl p-6 text-center hover:border-[#FF6B58]/40 transition-colors flex flex-col items-center justify-center space-y-3">
            <Upload className="w-8 h-8 text-[#FF6B58]" />
            <div className="text-xs text-[#F4EDE0]/80">
              <label className="cursor-pointer text-[#FF6B58] font-semibold hover:underline">
                <span>Select CSV file from disk</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <div className="text-[11px] text-[#F4EDE0]/40 mt-1">Structured CSV columns will be analyzed automatically</div>
            </div>
            {selectedFile && (
              <span className="text-xs font-mono text-emerald-400">Selected: {selectedFile.name}</span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[#F4EDE0]/60 block mb-1">Dataset Name</label>
              <input
                type="text"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                placeholder="e.g. India-Nepal Flood Tweet Corpus 2026"
                className="w-full bg-[#0D1527] border border-[#F4EDE0]/15 rounded-xl px-3 py-2 text-[#F4EDE0] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[#F4EDE0]/60 block mb-1">Source / Citation Description</label>
              <input
                type="text"
                value={datasetDesc}
                onChange={(e) => setDatasetDesc(e.target.value)}
                placeholder="e.g. Research corpus from Mendeley Data / QCRI HumAID"
                className="w-full bg-[#0D1527] border border-[#F4EDE0]/15 rounded-xl px-3 py-2 text-[#F4EDE0] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Schema Mapping & Preview */}
        {previewData && (
          <div className="space-y-4 pt-4 border-t border-[#F4EDE0]/10">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base text-[#F4EDE0]">Column Mapping & Schema Alignment</h3>
              <span className="text-[11px] font-mono text-[#F4EDE0]/40">{previewData.columns.length} columns detected</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {['original_text', 'disaster_type', 'raw_location', 'state', 'district', 'latitude', 'longitude'].map((targetField) => (
                <div key={targetField} className="space-y-1">
                  <label className="text-[#F4EDE0]/50 text-[11px] capitalize">{targetField.replace('_', ' ')}</label>
                  <select
                    value={fieldMapping[targetField] || ''}
                    onChange={(e) => setFieldMapping({ ...fieldMapping, [targetField]: e.target.value })}
                    className="w-full bg-[#0D1527] border border-[#F4EDE0]/15 rounded-xl px-2.5 py-1.5 text-[#F4EDE0] focus:outline-none"
                  >
                    <option value="">-- None / Default --</option>
                    {previewData.columns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto rounded-xl border border-[#F4EDE0]/10 bg-[#0D1527]/40 p-3">
              <div className="text-[11px] font-mono text-[#F4EDE0]/50 mb-2">Sample Parsed Rows (First 5):</div>
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-[#F4EDE0]/10 text-[#F4EDE0]/40 font-mono">
                    {previewData.columns.slice(0, 5).map((c) => (
                      <th key={c} className="py-1.5 px-2">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EDE0]/5 font-mono text-[#F4EDE0]/70">
                  {previewData.preview_rows.map((row, i) => (
                    <tr key={i}>
                      {previewData.columns.slice(0, 5).map((c) => (
                        <td key={c} className="py-1 px-2 max-w-xs truncate">{row[c]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleConfirmImport}
                disabled={importing || !fieldMapping.original_text}
                className="px-5 py-2.5 rounded-xl bg-[#FF6B58] hover:bg-[#FF8575] text-[#14213D] font-semibold text-xs transition-all disabled:opacity-50"
              >
                {importing ? 'Importing Dataset...' : 'Confirm Ingestion into Repository'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Ingested Datasets Table */}
      <section className="glass-panel p-6 rounded-2xl border border-[#F4EDE0]/10 space-y-4">
        <h2 className="font-serif text-xl text-[#F4EDE0]">Ingested Datasets Catalog</h2>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#F4EDE0]/40 font-mono">Loading dataset catalog...</div>
        ) : datasets.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#F4EDE0]/40">
            No external datasets currently ingested. Upload a CSV above to populate.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F4EDE0]/10 text-[#F4EDE0]/40 font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3">Dataset ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Records Ingested</th>
                  <th className="py-2.5 px-3">Import Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EDE0]/5">
                {datasets.map((ds) => (
                  <tr key={ds.dataset_id} className="hover:bg-[#F4EDE0]/5 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-[#FF6B58]">{ds.dataset_id}</td>
                    <td className="py-3 px-3 font-medium text-[#F4EDE0]">{ds.name}</td>
                    <td className="py-3 px-3 text-[#F4EDE0]/60 max-w-xs truncate">{ds.source_description}</td>
                    <td className="py-3 px-3 font-mono text-emerald-400">{ds.imported_count}</td>
                    <td className="py-3 px-3 text-[#F4EDE0]/40">{new Date(ds.imported_at).toLocaleDateString()}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDelete(ds.dataset_id)}
                        className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Delete dataset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
