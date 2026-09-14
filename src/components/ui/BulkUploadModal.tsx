'use client';

import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Download, RefreshCw } from 'lucide-react';

export interface BulkUploadColumn {
  key: string;
  label: string;
  required?: boolean;
  type?: 'string' | 'number';
  min?: number;
  max?: number;
}

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  columns: BulkUploadColumn[];
  templateHeaders: string[];
  onUpload: (rows: Record<string, any>[]) => Promise<{ success: number; errors: string[] }>;
}

export function BulkUploadModal({
  isOpen,
  onClose,
  title,
  description,
  columns,
  templateHeaders,
  onUpload,
}: BulkUploadModalProps) {
  const [step, setStep] = useState<'pick' | 'preview' | 'uploading' | 'result'>('pick');
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadResult, setUploadResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('pick');
    setParsedRows([]);
    setValidationErrors([]);
    setUploadResult(null);
    setIsUploading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([templateHeaders]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, '_')}_template.csv`);
  };

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

        if (jsonData.length === 0) {
          setValidationErrors(['File is empty or has no data rows.']);
          return;
        }

        // Map headers to column keys (case-insensitive)
        const headers = Object.keys(jsonData[0]);
        const columnMap: Record<string, string> = {};
        for (const col of columns) {
          const match = headers.find(
            (h) => h.toLowerCase().trim() === col.key.toLowerCase() || h.toLowerCase().trim() === col.label.toLowerCase()
          );
          if (match) {
            columnMap[match] = col.key;
          }
        }

        // Remap rows
        const rows = jsonData.map((row) => {
          const mapped: Record<string, any> = {};
          for (const [originalKey, mappedKey] of Object.entries(columnMap)) {
            mapped[mappedKey] = row[originalKey];
          }
          return mapped;
        });

        // Validate
        const errors: string[] = [];
        rows.forEach((row, i) => {
          for (const col of columns) {
            if (col.required && (row[col.key] === undefined || row[col.key] === '')) {
              errors.push(`Row ${i + 1}: Missing required field "${col.label}"`);
            }
            if (col.type === 'number' && row[col.key] !== undefined && row[col.key] !== '') {
              const val = Number(row[col.key]);
              if (isNaN(val)) {
                errors.push(`Row ${i + 1}: "${col.label}" must be a number`);
              } else {
                if (col.min !== undefined && val < col.min) {
                  errors.push(`Row ${i + 1}: "${col.label}" must be at least ${col.min}`);
                }
                if (col.max !== undefined && val > col.max) {
                  errors.push(`Row ${i + 1}: "${col.label}" must be at most ${col.max}`);
                }
                row[col.key] = val;
              }
            }
          }
        });

        setParsedRows(rows);
        setValidationErrors(errors);
        setStep('preview');
      };
      reader.readAsArrayBuffer(file);
    },
    [columns]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleConfirmUpload = async () => {
    setIsUploading(true);
    try {
      const result = await onUpload(parsedRows);
      setUploadResult(result);
      setStep('result');
    } catch (err: any) {
      setUploadResult({ success: 0, errors: [err.message || 'Upload failed'] });
      setStep('result');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step: Pick File */}
          {step === 'pick' && (
            <div className="space-y-4">
              {/* Download Template */}
              <button
                onClick={downloadTemplate}
                className="w-full p-3 border border-dashed border-slate-300 rounded-lg text-xs text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="font-medium">Download CSV Template</span>
              </button>

              {/* File Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="p-8 border-2 border-dashed border-sky-300 rounded-xl bg-sky-50/50 text-center cursor-pointer hover:bg-sky-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="w-10 h-10 text-sky-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">
                  Drop CSV or Excel file here
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports .csv, .xlsx, .xls
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              {validationErrors.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-amber-800">
                    <AlertCircle className="w-4 h-4" />
                    <span>Validation Issues ({validationErrors.length})</span>
                  </div>
                  <ul className="text-amber-700 text-[11px] space-y-0.5 ml-6 list-disc">
                    {validationErrors.slice(0, 10).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {validationErrors.length > 10 && (
                      <li>...and {validationErrors.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Preview: {parsedRows.length} row{parsedRows.length !== 1 ? 's' : ''} found
                </span>
                <button
                  onClick={() => { setStep('pick'); setParsedRows([]); setValidationErrors([]); }}
                  className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                >
                  Choose different file
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-semibold text-slate-600">#</th>
                      {columns.map((col) => (
                        <th key={col.key} className="px-3 py-2 font-semibold text-slate-600">
                          {col.label}
                          {col.required && <span className="text-rose-500 ml-0.5">*</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 20).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                        {columns.map((col) => (
                          <td key={col.key} className="px-3 py-1.5 text-slate-700 font-mono">
                            {row[col.key] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedRows.length > 20 && (
                  <div className="px-3 py-2 text-[11px] text-slate-500 bg-slate-50 text-center">
                    Showing 20 of {parsedRows.length} rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step: Uploading */}
          {step === 'uploading' && (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-slate-700">Processing records...</p>
              <p className="text-xs text-slate-500 mt-1">Encrypting and saving to database</p>
            </div>
          )}

          {/* Step: Result */}
          {step === 'result' && uploadResult && (
            <div className="space-y-4">
              {uploadResult.success > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">
                      {uploadResult.success} record{uploadResult.success !== 1 ? 's' : ''} uploaded successfully
                    </p>
                    <p className="text-xs text-emerald-600">Data has been saved and encrypted.</p>
                  </div>
                </div>
              )}
              {uploadResult.errors.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <p className="text-sm font-bold text-rose-800">
                      {uploadResult.errors.length} error{uploadResult.errors.length !== 1 ? 's' : ''} occurred
                    </p>
                  </div>
                  <ul className="text-xs text-rose-700 space-y-0.5 ml-7 list-disc max-h-40 overflow-y-auto">
                    {uploadResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-2 shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-slate-600 border border-slate-200 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors"
          >
            {step === 'result' ? 'Close' : 'Cancel'}
          </button>
          {step === 'preview' && (
            <button
              onClick={handleConfirmUpload}
              disabled={isUploading || parsedRows.length === 0}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white rounded-md text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Confirm Upload ({parsedRows.length} rows)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
