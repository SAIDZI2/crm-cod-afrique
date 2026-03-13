'use client';

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BarChartProps {
  data: Record<string, string | number>[];
  bars: { key: string; color: string; label: string }[];
  xKey: string;
  layout?: 'horizontal' | 'vertical';
}

export function BarChart({ data, bars, xKey, layout = 'horizontal' }: BarChartProps) {
  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" fontSize={12} />
          <YAxis dataKey={xKey} type="category" fontSize={12} width={120} />
          <Tooltip />
          <Legend />
          {bars.map((bar) => (
            <Bar key={bar.key} dataKey={bar.key} fill={bar.color} name={bar.label} />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        {bars.map((bar) => (
          <Bar key={bar.key} dataKey={bar.key} fill={bar.color} name={bar.label} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
