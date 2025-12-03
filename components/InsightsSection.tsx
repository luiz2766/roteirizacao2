import React from 'react';
import { AIAnalysis } from '../types';
import { TrendingUp, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';

interface Props {
  analysis: AIAnalysis | null;
  loading: boolean;
}

const InsightCard: React.FC<{ title: string; icon: React.ReactNode; items: string[]; colorClass: string }> = ({ title, icon, items, colorClass }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
    <div className={`flex items-center gap-2 mb-4 ${colorClass}`}>
      {icon}
      <h4 className="font-semibold text-lg">{title}</h4>
    </div>
    <ul className="space-y-3 flex-1">
      {items.length === 0 ? (
        <li className="text-gray-400 italic text-sm">No insights available.</li>
      ) : (
        items.map((item, i) => (
          <li key={i} className="flex items-start text-gray-600 text-sm leading-relaxed">
            <span className={`mr-2 mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${colorClass.replace('text', 'bg')}`}></span>
            {item}
          </li>
        ))
      )}
    </ul>
  </div>
);

const InsightsSection: React.FC<Props> = ({ analysis, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
         {[1,2,3,4].map(i => (
             <div key={i} className="bg-gray-100 h-64 rounded-xl"></div>
         ))}
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI Strategic Insights</span>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Gemini 2.5</span>
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InsightCard 
          title="Trends Identified" 
          icon={<TrendingUp className="w-5 h-5"/>} 
          items={analysis.trends} 
          colorClass="text-blue-600"
        />
        <InsightCard 
          title="Anomalies & Outliers" 
          icon={<AlertTriangle className="w-5 h-5"/>} 
          items={analysis.anomalies} 
          colorClass="text-red-500"
        />
        <InsightCard 
          title="Opportunities" 
          icon={<Lightbulb className="w-5 h-5"/>} 
          items={analysis.opportunities} 
          colorClass="text-amber-500"
        />
        <InsightCard 
          title="Recommendations" 
          icon={<CheckCircle className="w-5 h-5"/>} 
          items={analysis.recommendations} 
          colorClass="text-emerald-600"
        />
      </div>
    </div>
  );
};

export default InsightsSection;