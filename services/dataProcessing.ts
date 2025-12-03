import { DataRow, ColumnProfile, ColumnType, Dataset, KPI } from '../types';
import * as XLSX from 'xlsx';

// Helper to determine column type
const detectColumnType = (values: any[]): ColumnType => {
  let numCount = 0;
  let dateCount = 0;
  let boolCount = 0;
  let validCount = 0;

  for (const v of values) {
    if (v === null || v === undefined || v === '') continue;
    validCount++;
    
    if (typeof v === 'number') numCount++;
    else if (typeof v === 'boolean') boolCount++;
    else if (v instanceof Date) dateCount++;
    else if (!isNaN(Number(v)) && typeof v !== 'boolean') numCount++;
    else if (!isNaN(Date.parse(v)) && String(v).length > 5 && !/^\d+$/.test(String(v))) dateCount++; 
  }

  if (validCount === 0) return ColumnType.STRING;
  
  const threshold = 0.8;
  if (numCount / validCount > threshold) return ColumnType.NUMBER;
  if (dateCount / validCount > threshold) return ColumnType.DATE;
  if (boolCount / validCount > threshold) return ColumnType.BOOLEAN;
  
  return ColumnType.STRING;
};

export const parseFile = async (file: File): Promise<Dataset> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

        if (!jsonData || jsonData.length === 0) {
          throw new Error("Não foram encontrados dados no arquivo.");
        }

        const headers = Object.keys(jsonData[0]);
        const columns: ColumnProfile[] = headers.map(header => {
          const values = jsonData.map(row => row[header]);
          const type = detectColumnType(values);
          const distinctValues = new Set(values.map(v => String(v))).size;
          
          let profile: ColumnProfile = {
            name: header,
            type,
            distinctCount: distinctValues,
            nullCount: values.filter(v => v === null || v === undefined || v === '').length,
            exampleValues: values.slice(0, 5),
          };

          if (type === ColumnType.NUMBER) {
            const nums = values.map(v => Number(v)).filter(v => !isNaN(v));
            if (nums.length > 0) {
              profile.min = Math.min(...nums);
              profile.max = Math.max(...nums);
              const sum = nums.reduce((a, b) => a + b, 0);
              profile.sum = sum;
              profile.avg = sum / nums.length;
            }
          }

          return profile;
        });

        // Normalize rows
        const normalizedRows = jsonData.map(row => {
          const newRow: DataRow = {};
          columns.forEach(col => {
            const rawVal = row[col.name];
            if (col.type === ColumnType.NUMBER) {
               newRow[col.name] = rawVal !== null ? Number(rawVal) : 0;
            } else if (col.type === ColumnType.DATE) {
               if (rawVal instanceof Date) {
                  newRow[col.name] = rawVal;
               } else if (rawVal) {
                  const d = new Date(rawVal);
                  newRow[col.name] = !isNaN(d.getTime()) ? d : null;
               } else {
                  newRow[col.name] = null;
               }
            } else {
               newRow[col.name] = rawVal !== null ? String(rawVal) : "";
            }
          });
          return newRow;
        });

        resolve({
          name: file.name,
          rows: normalizedRows,
          columns,
          totalRows: normalizedRows.length
        });

      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

export const generateAutomaticKPIs = (dataset: Dataset): KPI[] => {
  const kpis: KPI[] = [];

  // Helper to find column loosely
  const findCol = (namePart: string) => dataset.columns.find(c => c.name.toUpperCase().includes(namePart.toUpperCase()));
  // Helper to find column strictly
  const findStrictCol = (name: string) => dataset.columns.find(c => c.name.toUpperCase() === name.toUpperCase());

  // 1. Total de Registros
  kpis.push({
    label: "Total de Registros",
    value: dataset.totalRows.toLocaleString('pt-BR'),
    color: "blue"
  });

  // 2. Peso Total (PESO PEDIDO)
  const pesoCol = findCol("PESO") || findCol("WEIGHT");
  if (pesoCol && pesoCol.sum !== undefined) {
    kpis.push({
      label: "Peso Total",
      value: pesoCol.sum.toLocaleString('pt-BR', { maximumFractionDigits: 2 }),
      color: "green"
    });
  } else {
      kpis.push({ label: "Peso Total", value: "-", color: "gray" });
  }

  // 3. Valor Total (VALOR)
  const valorCol = findStrictCol("VALOR") || findCol("VALOR") || findCol("AMOUNT");
  if (valorCol && valorCol.sum !== undefined) {
    kpis.push({
      label: "Valor Total",
      value: valorCol.sum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      color: "blue"
    });
  } else {
      kpis.push({ label: "Valor Total", value: "-", color: "gray" });
  }

  // 4. Número de Cidades Únicas (Cidades)
  const cidadesCol = findCol("Cidades") || findCol("Cidade") || findCol("City");
  if (cidadesCol) {
      kpis.push({
          label: "Número de Cidades Únicas",
          value: cidadesCol.distinctCount.toLocaleString('pt-BR'),
          color: "gray"
      });
  } else {
      kpis.push({ label: "Cidades Únicas", value: "-", color: "gray" });
  }

  return kpis;
};

export const prepareChartData = (dataset: Dataset) => {
  const charts: any[] = [];
  
  // Helpers
  const findCol = (namePart: string) => dataset.columns.find(c => c.name.toUpperCase().includes(namePart.toUpperCase()));
  
  const cidadesCol = findCol("Cidades") || findCol("Cidade");
  const valorCol = dataset.columns.find(c => c.name.toUpperCase() === "VALOR") || findCol("VALOR");

  // --- Gráfico 1: Top 10 Cidades por VALOR (Barra Horizontal) ---
  if (cidadesCol && valorCol) {
      const aggMap = new Map<string, number>();
      
      dataset.rows.forEach(row => {
          const city = String(row[cidadesCol.name] || "Indefinido");
          const val = Number(row[valorCol.name] || 0);
          aggMap.set(city, (aggMap.get(city) || 0) + val);
      });

      const sortedData = Array.from(aggMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      charts.push({
          type: 'bar',
          title: 'Top 10 Cidades por VALOR',
          data: sortedData,
          xAxis: 'name', // Categories on Y axis for horizontal bar usually, but library handles 'layout="vertical"'
          yAxis: 'value' // Value on X axis
      });
  }

  // --- Gráfico 2: Distribuição de Cidades (Donut) ---
  if (cidadesCol) {
      const countMap = new Map<string, number>();
      dataset.rows.forEach(row => {
          const city = String(row[cidadesCol.name] || "Indefinido");
          countMap.set(city, (countMap.get(city) || 0) + 1);
      });

      const pieData = Array.from(countMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Top 10 slices for readability

      charts.push({
          type: 'pie',
          title: 'Distribuição de Cidades',
          data: pieData,
          dataKey: 'value',
          nameKey: 'name'
      });
  }

  return charts;
};