'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LocalizedText } from '@/components/ui/localized-text';

interface CoverageMetric {
  brand: string;
  total_vehicles: number;
  covered_vehicles: number;
  coverage_percent: number;
}

const MOCK_DATA: CoverageMetric[] = [
  { brand: 'MG', total_vehicles: 12, covered_vehicles: 10, coverage_percent: 83 },
  { brand: 'BYD', total_vehicles: 8, covered_vehicles: 5, coverage_percent: 62 },
  { brand: 'Omoda', total_vehicles: 3, covered_vehicles: 1, coverage_percent: 33 },
  { brand: 'Geely', total_vehicles: 5, covered_vehicles: 0, coverage_percent: 0 },
];

export function AdminCompatibilityDashboard() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Coverage by Brand</CardTitle>
          <CardDescription>Percentage of vehicles with at least one compatible product.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="brand" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value}%`, 'Coverage']}
                labelStyle={{ color: 'black' }}
              />
              <Bar dataKey="coverage_percent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {MOCK_DATA.map((metric) => (
        <Card key={metric.brand}>
          <CardHeader>
            <CardTitle>{metric.brand}</CardTitle>
            <CardDescription>
              {metric.covered_vehicles} / {metric.total_vehicles} vehicles covered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metric.coverage_percent}%
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 mt-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${metric.coverage_percent}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
