import React from 'react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, LabelList
} from 'recharts';

interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter';
  title: string;
  data: any[];
  xAxis?: string;
  yAxis?: string;
  dataKey?: string;
  nameKey?: string;
}

interface Props {
  charts: ChartConfig[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#a855f7', '#f43f5e'];

// Custom formatter for PT-BR
const formatValue = (value: any): string => {
  if (value instanceof Date) {
    return value.toLocaleDateString('pt-BR');
  }
  if (typeof value === 'number') {
    // "Exibir o valor formatado em milhar (ex.: “65,56 mil”)"
    if (Math.abs(value) >= 1000) {
        return (value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + ' mil';
    }
    return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }
  return String(value);
};

// Formatter specifically for tooltips to be precise
const formatTooltipValue = (value: any): string => {
   if (typeof value === 'number') {
      return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
   }
   return String(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg z-50 text-left">
        <p className="text-sm font-semibold text-gray-700 mb-1">{String(label)}</p>
        {payload.map((p: any, idx: number) => (
          <p key={idx} className="text-sm" style={{ color: p.color }}>
            {p.name}: {formatTooltipValue(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ChartsContainer: React.FC<Props> = ({ charts }) => {
  if (charts.length === 0) {
    return (
        <div className="text-center p-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-400">Dados insuficientes para gerar os gráficos solicitados.</p>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {charts.map((chart, index) => (
        <div key={index} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]">
          <h4 className="text-lg font-semibold text-gray-800 mb-6">{chart.title}</h4>
          <div className="flex-1 w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {chart.type === 'bar' ? (
                // Horizontal Bar Chart
                <BarChart data={chart.data} layout="vertical" margin={{ top: 5, right: 60, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} tickFormatter={formatValue} />
                  <YAxis dataKey={chart.xAxis} type="category" width={100} tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} tickFormatter={(val) => String(val).substring(0, 15)} />
                  <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                  <Bar dataKey={chart.yAxis!} fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24}>
                    <LabelList 
                        dataKey={chart.yAxis!} 
                        position="right" 
                        fontSize={11} 
                        fill="#64748b" 
                        formatter={(val: any) => formatValue(val)} 
                    />
                  </Bar>
                </BarChart>
              ) : chart.type === 'pie' ? (
                // Donut Chart
                <PieChart>
                  <Pie
                    data={chart.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey={chart.dataKey!}
                    nameKey={chart.nameKey!}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chart.data.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              ) : (
                // Fallback (should not happen based on constraints)
                <LineChart data={chart.data}>
                   <Line dataKey={chart.yAxis!} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChartsContainer;