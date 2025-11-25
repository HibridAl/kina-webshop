'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { parseCSVData, parseJSONData, validateImportData, type SupplierImportData, type ImportResult } from '@/lib/supplier-import';
import { Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { getSuppliers } from '@/lib/db';
import type { Supplier } from '@/lib/types';

export default function SupplierImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'csv' | 'json' | 'rest'>('csv');
  const [restApiUrl, setRestApiUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<SupplierImportData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const data = await getSuppliers();
        setSuppliers(data);
        if (data.length > 0) {
          setSelectedSupplier(data[0].id);
        }
      } catch (error) {
        console.error('Unable to load suppliers', error);
        setErrors(['Unable to load suppliers. Please ensure Supabase is configured.']);
      }
    }
    loadSuppliers();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile || null);
    setPreviewData([]);
    setErrors([]);
    setResult(null);
  };

  const handlePreview = async () => {
    if (!file && !restApiUrl) {
      setErrors(['Please select a file or provide REST API URL']);
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      let parsedData: SupplierImportData[] = [];

      if (importType === 'rest') {
        const response = await fetch(restApiUrl);
        if (!response.ok) throw new Error('Failed to fetch from API');
        const apiData = await response.json();
        parsedData = parseJSONData(apiData);
      } else if (file) {
        const content = await file.text();
        if (importType === 'csv') {
          parsedData = parseCSVData(content);
        } else if (importType === 'json') {
          parsedData = parseJSONData(content);
        }
      }

      const validation = validateImportData(parsedData);
      if (!validation.valid) {
        setErrors(validation.errors.slice(0, 10)); // Show first 10 errors
      } else {
        setPreviewData(parsedData.slice(0, 10)); // Show first 10 items
      }
    } catch (error) {
      setErrors([`Error: ${String(error)}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedSupplier) {
      setErrors(['Please select a supplier']);
      return;
    }

    if (previewData.length === 0) {
      setErrors(['No data to import']);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplier,
          importType,
          data: previewData,
        }),
      });

      const data = await response.json();
      setResult(data);
      setPreviewData([]);
    } catch (error) {
      setErrors([`Import failed: ${String(error)}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Import Products from Supplier</h1>

      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <label className="block text-sm font-semibold mb-2">Supplier</label>
        <select
          value={selectedSupplier}
          onChange={(e) => setSelectedSupplier(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2"
        >
          {suppliers.length === 0 && <option value="">No suppliers found</option>}
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-2">
          Products will be created or updated for the selected supplier.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Import Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Import Type Selection */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Import Type</h2>
            <div className="space-y-3">
              {['csv', 'json', 'rest'].map((type) => (
                <label key={type} className="flex items-center gap-3 cursor-pointer p-3 border border-border rounded-lg hover:bg-muted transition-colors">
                  <input
                    type="radio"
                    name="importType"
                    value={type}
                    checked={importType === type}
                    onChange={(e) => {
                      setImportType(e.target.value as 'csv' | 'json' | 'rest');
                      setFile(null);
                      setPreviewData([]);
                    }}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium capitalize">{type}</p>
                    <p className="text-xs text-muted-foreground">
                      {type === 'csv' && 'Upload CSV file with columns: SKU, Name, Price, Stock'}
                      {type === 'json' && 'Upload JSON file with array of products'}
                      {type === 'rest' && 'Connect to REST API endpoint'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* File Upload or API URL */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              {importType === 'rest' ? 'API Configuration' : 'Upload File'}
            </h2>

            {importType === 'rest' ? (
              <div>
                <label className="block text-sm font-medium mb-2">REST API URL</label>
                <input
                  type="url"
                  value={restApiUrl}
                  onChange={(e) => setRestApiUrl(e.target.value)}
                  placeholder="https://api.supplier.com/products"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  API should return a JSON array of products
                </p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent transition-colors">
                <input
                  type="file"
                  accept={importType === 'csv' ? '.csv' : '.json'}
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium">
                    {file ? file.name : `Choose ${importType.toUpperCase()} file`}
                  </p>
                  <p className="text-xs text-muted-foreground">or drag and drop</p>
                </label>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handlePreview}
              disabled={loading || (!file && !restApiUrl)}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Preview Data'
              )}
            </Button>
            <Button
              onClick={handleImport}
              disabled={previewData.length === 0 || loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Importing...' : 'Import All'}
            </Button>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-destructive font-semibold">
                <AlertCircle className="w-5 h-5" />
                Import Errors
              </div>
              <ul className="space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx} className="text-sm text-destructive">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Import Result */}
          {result && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold mb-3">
                <CheckCircle className="w-5 h-5" />
                Import Successful
              </div>
              <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                <p>Imported: <span className="font-bold">{result.imported}</span> products</p>
                {result.failed > 0 && (
                  <p>Failed: <span className="font-bold">{result.failed}</span></p>
                )}
                <p>Time: {new Date(result.timestamp).toLocaleString()}</p>
                {result.errors?.length > 0 && (
                  <ul className="text-xs text-red-600 dark:text-red-400 list-disc ml-4">
                    {result.errors.slice(0, 3).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-6 sticky top-20">
            <h2 className="text-xl font-semibold mb-4">
              Preview ({previewData.length} items)
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {previewData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No data to preview
                </p>
              ) : (
                previewData.map((item, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-3 space-y-1">
                    <p className="font-mono text-xs text-muted-foreground">{item.sku}</p>
                    <p className="font-semibold text-sm line-clamp-1">{item.name}</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-accent">${item.price.toFixed(2)}</span>
                      <span className="text-muted-foreground">Stock: {item.stock}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSV Example */}
      <div className="mt-12 bg-muted/30 border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">CSV Format Example</h3>
        <div className="bg-background rounded p-4 font-mono text-sm overflow-x-auto">
          <pre>{`SKU,Name,Price,Stock,Category,OEM_Numbers,Description
MG4-OIL-001,Synthetic Engine Oil 5W-30,45.99,100,Maintenance & Fluids,MG4-OIL-001,Premium synthetic oil
MG4-BRAKE-001,Front Brake Pads Set,65.00,80,Brakes,MG4-BRAKE-001,Ceramic brake pads
MG4-AIR-001,Engine Air Filter,24.50,150,Air & Fuel,"MG4-AIR-001,A2004700",OEM air filter`}</pre>
        </div>
      </div>
    </div>
  );
}
