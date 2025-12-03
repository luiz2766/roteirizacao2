import React, { useState, useMemo, useEffect } from 'react';
import { Dataset, ColumnType } from '../types';
import { Search } from 'lucide-react';

interface Props {
  dataset: Dataset;
}

const DataGrid: React.FC<Props> = ({ dataset }) => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  
  // Requirement: "Exibir filtro por coluna PEDIDOS"
  const defaultCol = useMemo(() => {
    const pedidosCol = dataset.columns.find(c => c.name.toUpperCase().includes('PEDIDO'));
    return pedidosCol ? pedidosCol.name : dataset.columns[0]?.name || '';
  }, [dataset.columns]);

  const [filterCol, setFilterCol] = useState<string>(defaultCol);
  const [filterVal, setFilterVal] = useState<string>('');

  // Update default col if dataset changes
  useEffect(() => {
      setFilterCol(defaultCol);
  }, [defaultCol]);

  // Apply Filter
  const filteredRows = useMemo(() => {
    if (!filterVal || !filterCol) return dataset.rows;

    return dataset.rows.filter(row => {
      const cellValue = row[filterCol];
      if (cellValue === null || cellValue === undefined) return false;
      return String(cellValue).toLowerCase().includes(filterVal.toLowerCase());
    });
  }, [dataset.rows, filterCol, filterVal]);

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const currentRows = filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const renderCell = (value: any, type: ColumnType) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-300 italic">-</span>;
    }
    if (type === ColumnType.DATE && value instanceof Date) {
      return value.toLocaleDateString('pt-BR');
    }
    return String(value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h3 className="text-lg font-bold text-gray-800">Visualização de Dados (Tabela Completa)</h3>
           <span className="text-sm text-gray-500">{filteredRows.length.toLocaleString('pt-BR')} linhas encontradas</span>
        </div>

        {/* Filter UI */}
        <div className="flex items-center gap-2">
            <select 
                value={filterCol} 
                onChange={(e) => setFilterCol(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 max-w-[150px]"
            >
                {dataset.columns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                ))}
            </select>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-4 h-4 text-gray-500" />
                </div>
                <input 
                    type="text" 
                    value={filterVal}
                    onChange={(e) => { setFilterVal(e.target.value); setPage(0); }}
                    placeholder={`Filtrar...`} 
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5" 
                />
            </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {dataset.columns.map(col => (
                <th key={col.name} className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {col.name} 
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentRows.length > 0 ? (
                currentRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    {dataset.columns.map(col => (
                    <td key={col.name} className="p-4 text-sm text-gray-700 whitespace-nowrap">
                        {renderCell(row[col.name], col.type)}
                    </td>
                    ))}
                </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={dataset.columns.length} className="p-8 text-center text-gray-500">
                        Nenhum resultado encontrado.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-200 flex items-center justify-between">
        <button 
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            Anterior
        </button>
        <span className="text-sm text-gray-600">
            Página {page + 1} de {totalPages === 0 ? 1 : totalPages}
        </span>
        <button 
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            Próximo
        </button>
      </div>
    </div>
  );
};

export default DataGrid;