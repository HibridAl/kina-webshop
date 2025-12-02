'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { SupplierImportRun } from '@/lib/types';

interface SupplierImportHistoryProps {
  history: SupplierImportRun[];
}

// Mock history data until backend is ready
const MOCK_HISTORY = [
  { date: '2025-12-01', success: 120, fail: 2 },
  { date: '2025-12-02', success: 45, fail: 0 },
  { date: '2025-12-03', success: 200, fail: 5 },
  { date: '2025-12-04', success: 150, fail: 1 },
  { date: '2025-12-05', success: 180, fail: 0 },
];

export function SupplierImportHistory({ history }: SupplierImportHistoryProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Recent Import Success</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_HISTORY}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(val) => val.split('-').slice(1).join('/')} />
              <YAxis />
              <Tooltip 
                labelStyle={{ color: 'black' }}
                contentStyle={{ borderRadius: '8px' }}
              />
              <Bar dataKey="success" fill="#22c55e" name="Success" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="fail" fill="#ef4444" name="Failed" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Last 5 Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_HISTORY.slice().reverse().map((run, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  {run.fail === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{run.date}</p>
                    <p className="text-xs text-muted-foreground">
                      {run.success} imported
                    </p>
                  </div>
                </div>
                <Badge variant={run.fail === 0 ? 'secondary' : 'destructive'}>
                  {run.fail > 0 ? `${run.fail} failed` : 'Success'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
