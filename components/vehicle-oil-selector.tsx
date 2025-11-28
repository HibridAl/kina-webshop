'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  ChineseMake,
  OilSelectorDataset,
  OilSelectorMakeEntry,
  OilSelectorModelEntry,
  OilSelectorVehicleRecord,
  OilSelectorSystem,
} from '@/lib/oil-selector';
import { CHINESE_MAKES } from '@/lib/oil-selector';
import { getBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { PostgrestError } from '@supabase/supabase-js';
import { LocalizedText } from '@/components/ui/localized-text';
import { useLocale } from '@/hooks/use-locale';

type LoadState = 'idle' | 'loading' | 'error' | 'ready';

interface OilRecommendation {
  make: string;
  model: string;
  type: string;
  hash: string;
  system_name: string;
  capacities: string[] | null;
  uses: Record<string, any> | null;
}

export function VehicleOilSelector() {
  const { locale } = useLocale();
  const [selectedMake, setSelectedMake] = useState<ChineseMake | null>(null);
  const [dataset, setDataset] = useState<OilSelectorDataset | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedModelKey, setSelectedModelKey] = useState<string | null>(null);
  const [selectedTypeHash, setSelectedTypeHash] = useState<string | null>(null);
  const [modelSearch, setModelSearch] = useState('');

  useEffect(() => {
    if (!selectedMake) {
      setSelectedMake(CHINESE_MAKES[0]);
    }
  }, [selectedMake]);

  // Load per-make JSON lazily when a make is selected
  useEffect(() => {
    if (!selectedMake) return;

    setLoadState('loading');
    setErrorMessage(null);
    setDataset(null);
    setSelectedModelKey(null);
    setSelectedTypeHash(null);

    const client = getBrowserClient();

    client
      .from('oil_recommendations')
      .select('make, model, type, hash, system_name, capacities, uses')
      .eq('make', selectedMake)
      .then(({ data, error }: { data: OilRecommendation[] | null, error: PostgrestError | null }) => {
        if (error) {
          throw error;
        }

        const makeEntry: OilSelectorMakeEntry = {};

        (data || []).forEach((row: OilRecommendation) => {
          const modelKey: string = row.model;
          const hash: string = row.hash;

          if (!makeEntry[modelKey]) {
            makeEntry[modelKey] = {} as OilSelectorModelEntry;
          }

          if (!makeEntry[modelKey][hash]) {
            makeEntry[modelKey][hash] = {
              vehicle: {
                make: row.make,
                model: row.model,
                type: row.type,
                hash: row.hash,
              },
              results: {},
            } as OilSelectorVehicleRecord;
          }

          const system: OilSelectorSystem = {
            capacities: (row.capacities as string[] | null) ?? undefined,
            uses: (row.uses as Record<string, any> | null) ?? undefined,
          };

          makeEntry[modelKey][hash].results[row.system_name] = system;
        });

        const newDataset: OilSelectorDataset = {
          [selectedMake]: makeEntry,
        };

        setDataset(newDataset);
        setLoadState('ready');
      })
      .catch((err: Error) => {
        console.error('Error loading oil selector data from Supabase:', err);
        setErrorMessage(
          err instanceof Error ? err.message : 'Failed to load dataset from Supabase.'
        );
        setLoadState('error');
      });
  }, [selectedMake]);

  useEffect(() => {
    setModelSearch('');
  }, [selectedMake]);

  const makeEntry = useMemo(() => {
    if (!dataset || !selectedMake) return null;
    return dataset[selectedMake] ?? null;
  }, [dataset, selectedMake]);

  const models = useMemo(() => {
    if (!makeEntry) return [];
    return Object.keys(makeEntry).sort();
  }, [makeEntry]);

  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return models;
    const needle = modelSearch.toLowerCase();
    return models.filter((modelKey) => modelKey.toLowerCase().includes(needle));
  }, [models, modelSearch]);

  const typesForSelectedModel: OilSelectorVehicleRecord[] = useMemo(() => {
    if (!makeEntry || !selectedModelKey) return [];
    const modelEntry = makeEntry[selectedModelKey];
    if (!modelEntry) return [];
    return Object.values(modelEntry);
  }, [makeEntry, selectedModelKey]);

  const selectedTypeRecord = useMemo(() => {
    if (!makeEntry || !selectedModelKey || !selectedTypeHash) return null;
    const modelEntry = makeEntry[selectedModelKey];
    if (!modelEntry) return null;
    return modelEntry[selectedTypeHash] ?? null;
  }, [makeEntry, selectedModelKey, selectedTypeHash]);

  const systems = useMemo(() => {
    if (!selectedTypeRecord) return [];
    return Object.entries(selectedTypeRecord.results) as [string, OilSelectorSystem][];
  }, [selectedTypeRecord]);

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            <LocalizedText hu="Válassza ki járművét" en="Select Your Vehicle" />
          </h2>
          <p className="text-muted-foreground">
            <LocalizedText
              hu="Válassza ki a kínai márkát, modellt és motortípust, hogy megtekinthesse a gyártó által javasolt olajokat és kenőanyagokat. Az ajánlások a hivatalos csereperiódusokra és kapacitásokra épülnek."
              en="Choose your Chinese brand, model, and engine to see recommended oils and lubricants. This uses the manufacturer’s official intervals and capacities."
            />
          </p>
        </div>

        {/* Step 1: Brand */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide text-muted-foreground">
            <LocalizedText hu="1. Márka" en="1. Brand" />
          </h3>
          <div className="flex flex-wrap gap-2">
            {CHINESE_MAKES.map((make) => (
              <Button
                key={make}
                variant={selectedMake === make ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMake(make)}
              >
                {make}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading / error state after brand selection */}
        {selectedMake && loadState === 'loading' && (
          <div className="mb-8">
            <Skeleton className="h-32" />
            <p className="mt-3 text-sm text-muted-foreground">
              <LocalizedText
                hu={`Adatok betöltése ehhez a márkához: ${selectedMake}…`}
                en={`Loading data for ${selectedMake}...`}
              />
            </p>
          </div>
        )}

        {selectedMake && loadState === 'error' && (
          <div className="mb-8 border border-destructive/30 bg-destructive/10 rounded-lg p-4 text-sm text-destructive">
            <LocalizedText
              hu="Nem sikerült betölteni az olajválasztó adatait."
              en={errorMessage || 'Failed to load oil selector data.'}
            />
            <p className="mt-2 text-destructive/90">
              <LocalizedText
                hu="Ellenőrizze, hogy az „oil_recommendations” tábla létezik-e a Supabase-ben, és tartalmazza-e az MG/BYD/Omoda/Geely/Haval sorokat."
                en="Ensure the “oil_recommendations” table exists in Supabase and includes the MG/BYD/Omoda/Geely/Haval rows."
              />
            </p>
          </div>
        )}

        {/* Step 2: Model */}
        {selectedMake && loadState === 'ready' && (
          <div className="mb-8 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <LocalizedText hu="2. Modell" en="2. Model" />
            </h3>
            {models.length > 0 && (
              <input
                type="text"
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                placeholder={locale === 'hu' ? 'Modellek keresése' : 'Search models'}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            )}
            {models.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                <LocalizedText hu="Ehhez a márkához egyelőre nincs elérhető modell." en="No models found for this brand yet." />
              </p>
            ) : filteredModels.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                <LocalizedText
                  hu={
                    <>
                      Egyetlen modell sem felel meg a következő keresésnek: „{modelSearch}”. Próbáljon meg másik kifejezést.
                    </>
                  }
                  en={
                    <>
                      No models match “{modelSearch}”. Try a different query.
                    </>
                  }
                />
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto border border-border rounded-lg p-3 bg-card">
                {filteredModels.map((modelKey) => (
                  <button
                    key={modelKey}
                    type="button"
                    onClick={() => {
                      setSelectedModelKey(modelKey);
                      setSelectedTypeHash(null);
                    }}
                    className={`text-left text-sm px-3 py-2 rounded-md transition-colors ${
                      selectedModelKey === modelKey
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {modelKey}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Engine / Type */}
        {selectedMake && selectedModelKey && loadState === 'ready' && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide text-muted-foreground">
              <LocalizedText hu="3. Motor / kivitel" en="3. Engine / Type" />
            </h3>
            {typesForSelectedModel.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                <LocalizedText hu="Ehhez a modellhez egyelőre nincs elérhető motortípus." en="No engine types found for this model." />
              </p>
            ) : (
              <div className="space-y-2">
                {typesForSelectedModel.map((record) => (
                  <button
                    key={record.vehicle.hash}
                    type="button"
                    onClick={() => setSelectedTypeHash(record.vehicle.hash)}
                    className={`w-full text-left px-4 py-3 rounded-md border text-sm transition-colors ${
                      selectedTypeHash === record.vehicle.hash
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <div className="font-semibold">{record.vehicle.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {record.vehicle.model}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {selectedTypeRecord && systems.length > 0 && (
          <div className="mt-10 border-t border-border pt-8">
            <h3 className="text-xl font-bold mb-4">
              <LocalizedText hu="Ajánlott folyadékok és kapacitások" en="Recommended Fluids & Capacities" />
            </h3>
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {selectedTypeRecord.vehicle.type}
                </p>
                <p className="text-xs text-muted-foreground">
                  <LocalizedText
                    hu="Tekintse meg a motorhoz szűrt kompatibilis alkatrészeket."
                    en="Browse compatible parts filtered by this engine."
                  />
                </p>
              </div>
              <Button asChild variant="default">
                <Link
                  href={`/products?search=${encodeURIComponent(
                    selectedTypeRecord.vehicle.type
                  )}`}
                >
                  <LocalizedText hu="Kompatibilis alkatrészek böngészése" en="Shop compatible parts" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              <LocalizedText
                hu={
                  <>
                    A(z) {selectedTypeRecord.vehicle.type} kivitel gyártói adatai alapján.
                  </>
                }
                en={
                  <>
                    Based on manufacturer data for{' '}
                    <span className="font-semibold">{selectedTypeRecord.vehicle.type}</span>.
                  </>
                }
              />
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {systems.map(([systemName, system]) => (
                <div
                  key={systemName}
                  className="bg-card border border-border rounded-lg p-4 space-y-3"
                >
                  <h4 className="font-semibold text-sm">{systemName}</h4>

                  {system.capacities && system.capacities.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        <LocalizedText hu="Kapacitások" en="Capacities" />
                      </p>
                      <ul className="text-xs space-y-0.5">
                        {system.capacities.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {system.uses && (
                    <div className="space-y-3">
                      {Object.entries(system.uses).map(
                        ([usageName, usageConfig]) => (
                          <div key={usageName} className="border-t border-border pt-3">
                            <p className="text-xs font-medium mb-1">
                              <LocalizedText
                                hu={
                                  <>
                                    Felhasználás: {usageName}
                                  </>
                                }
                                en={
                                  <>
                                    Use: {usageName}
                                  </>
                                }
                              />
                            </p>
                            {usageConfig.interval && (
                              <ul className="text-xs text-muted-foreground space-y-0.5 mb-2">
                                {usageConfig.interval.map((i) => (
                                  <li key={i}>{i}</li>
                                ))}
                              </ul>
                            )}
                            {usageConfig.products && (
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                  <LocalizedText hu="Ajánlott termékek" en="Recommended products" />
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(usageConfig.products).map(
                                    ([code, product]) => (
                                      <a
                                        key={code}
                                        href={product.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs hover:border-accent hover:text-accent transition-colors"
                                      >
                                        <span className="font-mono text-[10px] text-muted-foreground">
                                          {code}
                                        </span>
                                        <span>{product.name}</span>
                                      </a>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
