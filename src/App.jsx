import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabase';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  BarChart2, 
  ShieldAlert, 
  FileText, 
  Sun, 
  Moon, 
  ChevronLeft, 
  ChevronRight, 
  Coins,
  AlertCircle,
  Download
} from 'lucide-react';

// Lightweight, high-performance CSV parser
function parseCSV(text) {
  const lines = [];
  let row = [""];
  let inQuotes = false;
  const len = text.length;
  for (let i = 0; i < len; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push("");
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
}

function csvToObjects(text) {
  const lines = parseCSV(text);
  if (lines.length === 0) return [];
  const headers = lines[0].map(h => h.trim());
  const result = [];
  const len = lines.length;
  for (let i = 1; i < len; i++) {
    const row = lines[i];
    if (row.length !== headers.length) continue;
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j].trim();
    }
    result.push(obj);
  }
  return result;
}

// Utility to clean and parse number values
const parseNumber = (val) => {
  if (!val || val === '-' || val === '–' || val === '') return 0;
  const cleaned = String(val).replace(/,/g, '').replace(/%/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// Formats Indian currency (INR)
const formatINR = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(value);
};

// Formats table cells (returns – for 0)
const formatTableValue = (value) => {
  if (value === undefined || value === null || isNaN(value) || value === 0) return '–';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Sorts months chronologically
const getSortedUniqueMonths = (data) => {
  const months = Array.from(new Set(data.map(d => d.Month).filter(Boolean)));
  const monthOrder = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
  };
  return months.sort((a, b) => {
    const parse = (s) => {
      const parts = s.split(' ');
      if (parts.length < 2) return 0;
      const m = parts[0].substring(0, 3);
      const y = parseInt(parts[1], 10);
      return y * 12 + (monthOrder[m] || 0);
    };
    return parse(a) - parse(b);
  });
};

// Column header dropdown filter component
function ColumnHeaderFilter({ title, columnName, allValues, selectedFilters, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Get unique sorted values for this column
  const uniqueValues = useMemo(() => {
    const vals = Array.from(new Set(allValues.map(v => (v === undefined || v === null) ? '' : String(v).trim()).filter(x => x !== '')));
    return vals.sort((a, b) => {
      const numA = parseFloat(a.replace(/,/g, ''));
      const numB = parseFloat(b.replace(/,/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });
  }, [allValues]);

  // Filter values inside dropdown based on search
  const filteredVals = useMemo(() => {
    if (!searchTerm.trim()) return uniqueValues;
    const s = searchTerm.toLowerCase();
    return uniqueValues.filter(v => v.toLowerCase().includes(s));
  }, [uniqueValues, searchTerm]);

  const handleCheckboxChange = (val, checked) => {
    const next = new Set(selectedFilters || []);
    if (checked) {
      next.add(val);
    } else {
      next.delete(val);
    }
    onChange(columnName, next);
  };

  const handleSelectAll = () => {
    onChange(columnName, new Set(uniqueValues));
  };

  const handleClear = () => {
    onChange(columnName, new Set());
  };

  const toggle = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = () => setIsOpen(false);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  const activeCount = selectedFilters ? selectedFilters.size : 0;
  const isFiltered = activeCount > 0 && activeCount < uniqueValues.length;

  return (
    <div className="header-filter-container" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span className="th-title" style={{ whiteSpace: 'nowrap' }}>{title}</span>
      <button 
        type="button" 
        onClick={toggle} 
        className={`filter-toggle-btn ${isFiltered ? 'active' : ''}`}
        style={{
          background: 'none',
          border: 'none',
          color: isFiltered ? 'var(--color-primary)' : 'var(--text-muted)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Filter size={12} />
      </button>

      {isOpen && (
        <div 
          className="header-filter-popup"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px',
            boxShadow: 'var(--shadow-premium)',
            zIndex: 1000,
            minWidth: '220px',
            maxHeight: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter {title}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={handleSelectAll} className="filter-popup-btn">All</button>
              <button type="button" onClick={handleClear} className="filter-popup-btn">Clear</button>
            </div>
          </div>

          <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '4px 8px',
              fontSize: '0.8rem',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)'
            }}
          />

          <div 
            style={{
              overflowY: 'auto',
              maxHeight: '180px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              paddingRight: '4px',
              textAlign: 'left',
              paddingBottom: '100px' // Spacing of approx 5 rows at bottom for easy scrolling/viewing options
            }}
          >
            {filteredVals.length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No matches</span>
            ) : (
              filteredVals.map(val => {
                const isChecked = selectedFilters ? selectedFilters.has(val) : false;
                return (
                  <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={(e) => handleCheckboxChange(val, e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  // Global / Navigation State
  const [activeTab, setActiveTab] = useState('budget'); // 'elekha', 'budget', 'revenue'
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Parsed Datasets
  const [elekhaData, setElekhaData] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [hoaList, setHoaList] = useState([]);
  const [officeMapping, setOfficeMapping] = useState([]);
  const [ddoMappingList, setDdoMappingList] = useState([]);

  // Filter Dropdowns Lists
  const [uniqueMonths, setUniqueMonths] = useState([]);
  const [uniqueRegions, setUniqueRegions] = useState([]);

  // Month selected for standard views (April 2026, May 2026, etc.)
  const [selectedMonth, setSelectedMonth] = useState('All');

  // e-Lekha Tab Filters & Pagination
  const [elekhaSearch, setElekhaSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterDdoCode, setFilterDdoCode] = useState('');
  const [filterHoa, setFilterHoa] = useState('');
  const [elekhaPage, setElekhaPage] = useState(0);
  const [elekhaRowsPerPage, setElekhaRowsPerPage] = useState(25);

  // Budget Tab Filters & Pagination
  const [budgetSearch, setBudgetSearch] = useState('');
  const [budgetRegion, setBudgetRegion] = useState('All');
  const [budgetFilterStatus, setBudgetFilterStatus] = useState('All'); // 'All', 'Over', 'Warning', 'Safe'
  const [budgetPage, setBudgetPage] = useState(0);
  const [budgetRowsPerPage, setBudgetRowsPerPage] = useState(25);

  // Vertical Revenue Report Controls
  const [revenueType, setRevenueType] = useState('Month'); // 'Month' / 'Day'
  const [p1From, setP1From] = useState('');
  const [p1To, setP1To] = useState('');
  const [p2From, setP2From] = useState('');
  const [p2To, setP2To] = useState('');
  
  // Custom Date range filters (when Day type is active)
  const [p1FromDate, setP1FromDate] = useState('2026-04-01');
  const [p1ToDate, setP1ToDate] = useState('2026-04-30');
  const [p2FromDate, setP2FromDate] = useState('2026-04-01');
  const [p2ToDate, setP2ToDate] = useState('2026-05-31');

  const [reportType, setReportType] = useState('Detail'); // 'Detail' / 'Summary'
  const [groupBy, setGroupBy] = useState('ho'); // 'ho' / 'division' / 'region'
  const [generatedConfig, setGeneratedConfig] = useState(null);

  // Expanded Budget rows
  const [expandedBudgetRows, setExpandedBudgetRows] = useState({});

  // Column header dropdown checklist filters
  const [budgetColumnFilters, setBudgetColumnFilters] = useState({});
  const [elekhaColumnFilters, setElekhaColumnFilters] = useState({});
  const [revenueColumnFilters, setRevenueColumnFilters] = useState({});

  // Search by percentage consumed
  const [pctSearchVal, setPctSearchVal] = useState('');
  const [pctSearchType, setPctSearchType] = useState('apt'); // 'apt' / 'elekha'

  const [budgetPageInput, setBudgetPageInput] = useState('1');
  const [elekhaPageInput, setElekhaPageInput] = useState('1');

  useEffect(() => {
    setBudgetPageInput(String(budgetPage + 1));
  }, [budgetPage]);

  useEffect(() => {
    setElekhaPageInput(String(elekhaPage + 1));
  }, [elekhaPage]);

  // Theme Effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // 1. Fetch static mappings and raw budget from Supabase
        const [resHOA, resMapping, resBudget, resDdoMapping] = await Promise.all([
          supabase.from('Revenue_hoa').select('*'),
          supabase.from('office_mapping').select('*'),
          supabase.from('Budget').select('*'),
          supabase.from('Revenue DDO Mapping').select('*')
        ]);

        if (resHOA.error) throw resHOA.error;
        if (resMapping.error) throw resMapping.error;
        if (resBudget.error) throw resBudget.error;
        if (resDdoMapping.error) throw resDdoMapping.error;

        const hoas = resHOA.data;
        const mapping = resMapping.data;
        const budgetRaw = resBudget.data;
        const ddoMap = resDdoMapping.data;

        // 2. Fetch e-Lekha transactions in batches of 20,000 (total ~174k rows)
        let elekha = [];
        let page = 0;
        const pageSize = 20000;
        let hasMore = true;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('e-Lekha')
            .select('*')
            .range(page * pageSize, (page + 1) * pageSize - 1);
            
          if (error) throw error;
          
          if (data && data.length > 0) {
            elekha = elekha.concat(data);
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              page++;
            }
          } else {
            hasMore = false;
          }
        }

        // 3. Map raw Budget table to the format expected by the frontend
        const officeToRegionMap = {};
        mapping.forEach(m => {
          if (m['Office ID'] && m.Region) {
            officeToRegionMap[String(m['Office ID']).trim()] = String(m.Region).trim();
          }
        });

        const budget = budgetRaw.map(row => {
          const officeId = String(row['Office ID'] || '').trim();
          const region = officeToRegionMap[officeId] || '';
          
          // Unify/clean scientific notations (like 3.20E+14)
          let rawHoa = String(row['HOA'] || '').trim();
          const cleanHoa = rawHoa.includes('E') ? String(parseFloat(rawHoa)) : rawHoa;

          return {
            'Office ID': officeId,
            'Name of Unit (HO/Division)': row['Office Name'] || '',
            'Region': region,
            'HOA': cleanHoa,
            'Description': row['HOA Description'] || '',
            'APT Alloted': parseNumber(row['Consumable Budget (I)']),
            'APT Consumed': parseNumber(row['Consumed Budget (H)'])
          };
        });

        setHoaList(hoas);
        setOfficeMapping(mapping);
        setBudgetData(budget);
        setElekhaData(elekha);
        setDdoMappingList(ddoMap);

        // Extract dropdown configuration details
        const sortedMonths = getSortedUniqueMonths(elekha);
        setUniqueMonths(sortedMonths);
        
        // Aggregate all unique region names from Office_Mapping, budget, and e-Lekha
        const regionsSet = new Set();
        mapping.forEach(m => { if (m.Region) regionsSet.add(m.Region.trim()); });
        budget.forEach(b => { if (b.Region) regionsSet.add(b.Region.trim()); });
        elekha.forEach(e => { if (e.Region) regionsSet.add(e.Region.trim()); });
        ddoMap.forEach(d => { if (d.Region) regionsSet.add(d.Region.trim()); });
        
        setUniqueRegions(Array.from(regionsSet).sort());

        // Default month for standard filters
        if (sortedMonths.length > 0) {
          const latestMonth = sortedMonths[sortedMonths.length - 1];
          setSelectedMonth(latestMonth); // Set latest month
          setElekhaColumnFilters({ Month: new Set([latestMonth]) }); // Initialize Column Filter with latest month
          
          // Default Period settings for Vertical Revenue
          setP1From(sortedMonths[0]);
          setP1To(sortedMonths[0]);
          setP2From(sortedMonths[0]);
          setP2To(sortedMonths[sortedMonths.length - 1]);

          // Set default generated config
          setGeneratedConfig({
            type: 'Month',
            p1From: sortedMonths[0],
            p1To: sortedMonths[0],
            p2From: sortedMonths[0],
            p2To: sortedMonths[sortedMonths.length - 1],
            p1FromDate: '2026-04-01',
            p1ToDate: '2026-04-30',
            p2FromDate: '2026-04-01',
            p2ToDate: '2026-05-31',
            reportType: 'Detail',
            groupBy: 'ho'
          });
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading data from Supabase:", err);
        setError(`Error: Failed to retrieve data from Supabase. ${err.message || err}`);
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Build index lookup map for DDO Codes
  const ddoLookupMap = useMemo(() => {
    const map = {};
    ddoMappingList.forEach(item => {
      const code = String(item['DDO Code'] || '').trim();
      if (code) {
        map[code] = {
          ho: item.HO,
          division: item.Division,
          region: item.Region
        };
      }
    });
    return map;
  }, [ddoMappingList]);

  // Build lookup index map for e-Lekha Transactions
  const elekhaLookupMap = useMemo(() => {
    const map = {};
    const len = elekhaData.length;
    for (let i = 0; i < len; i++) {
      const row = elekhaData[i];
      const hoa = String(row.HOA || '').trim();
      if (!hoa) continue;

      const ho = String(row.HO || '').trim().toLowerCase();
      const payVal = parseNumber(row['Payment (Rs.)']) + parseNumber(row['Receipt (Rs.)']);

      if (ho) {
        const key = `${ho}_${hoa}`;
        if (!map[key]) {
          map[key] = { total: 0, txns: [] };
        }
        map[key].total += payVal;
        map[key].txns.push(row);
      }
    }
    return map;
  }, [elekhaData]);

  // e-Lekha filtered data (computed locally in React)
  const filteredElekhaData = useMemo(() => {
    return elekhaData.filter(row => {
      // 1. Column filters (checks for selected values)
      for (const [colName, selectedSet] of Object.entries(elekhaColumnFilters)) {
        if (selectedSet && selectedSet.size > 0) {
          const val = (row[colName] === undefined || row[colName] === null) ? '' : String(row[colName]).trim();
          if (!selectedSet.has(val)) {
            return false;
          }
        }
      }

      // 2. Month Filter (Handled dynamically by column header filter check list)
      // 3. Region Filter
      if (filterRegion !== 'All' && row.Region !== filterRegion) {
        return false;
      }
      // 4. DDO Code Filter
      if (filterDdoCode.trim() !== '') {
        if (String(row['DDO Code']).trim() !== filterDdoCode.trim()) return false;
      }
      // 5. HOA Filter
      if (filterHoa.trim() !== '') {
        if (!String(row.HOA).includes(filterHoa.trim())) return false;
      }
      // 6. Global Search (searches Region, DDO, HO, Division, HOA, Description)
      if (elekhaSearch.trim() !== '') {
        const search = elekhaSearch.toLowerCase();
        const regMatch = String(row.Region || '').toLowerCase().includes(search);
        const ddoMatch = String(row['DDO Code'] || '').toLowerCase().includes(search);
        const hoMatch = String(row.HO || '').toLowerCase().includes(search);
        const divMatch = String(row.Division || '').toLowerCase().includes(search);
        const hoaMatch = String(row.HOA || '').toLowerCase().includes(search);
        const descMatch = String(row.Description || '').toLowerCase().includes(search);
        if (!regMatch && !ddoMatch && !hoMatch && !divMatch && !hoaMatch && !descMatch) return false;
      }
      return true;
    });
  }, [elekhaData, selectedMonth, filterRegion, filterDdoCode, filterHoa, elekhaSearch, elekhaColumnFilters]);

  // e-Lekha Paginated Data
  const paginatedElekhaData = useMemo(() => {
    const start = elekhaPage * elekhaRowsPerPage;
    return filteredElekhaData.slice(start, start + elekhaRowsPerPage);
  }, [filteredElekhaData, elekhaPage, elekhaRowsPerPage]);

  // Budget filtered data (computed locally in React)
  // Mapped Budget Data containing calculated fields and virtual rows (pre-filter)
  const mappedBudgetData = useMemo(() => {
    // 1. Map existing budget rows
    const existingMappedRows = budgetData.map(row => {
      const unitName = String(row['Name of Unit (HO/Division)'] || '').trim();
      const hoa = String(row['HOA'] || '').trim();
      const key = `${unitName.toLowerCase()}_${hoa.toLowerCase()}`;
      const lookup = elekhaLookupMap[key];
      const eLekhaConsumedVal = lookup ? lookup.total : 0;
      
      const aptAllotedVal = parseNumber(row['APT Alloted']);
      const aptConsumedVal = parseNumber(row['APT Consumed']);
      
      const diffVal = aptConsumedVal - eLekhaConsumedVal;
      const aptPctVal = aptAllotedVal > 0 ? (aptConsumedVal / aptAllotedVal) * 100 : 0;
      const elekhaPctVal = aptAllotedVal > 0 ? (eLekhaConsumedVal / aptAllotedVal) * 100 : 0;

      return {
        ...row,
        'APT Alloted': aptAllotedVal,
        'APT Consumed': aptConsumedVal,
        'e-lekha Consumed': eLekhaConsumedVal,
        'Diff. (APT - e-Lekha)': diffVal,
        'APT Consumed %': aptPctVal,
        'e-Lekha Consumed %': elekhaPctVal
      };
    });

    // 2. Build map of existing keys
    const existingBudgetKeys = new Set(
      budgetData.map(row => `${String(row['Name of Unit (HO/Division)'] || '').trim().toLowerCase()}_${String(row['HOA'] || '').trim().toLowerCase()}`)
    );

    // 3. Find unique unit lookup info for Office ID and Region
    const unitToInfoMap = {};
    budgetData.forEach(row => {
      const uName = String(row['Name of Unit (HO/Division)'] || '').trim().toLowerCase();
      if (uName && !unitToInfoMap[uName]) {
        unitToInfoMap[uName] = {
          officeId: row['Office ID'] || '',
          region: row.Region || ''
        };
      }
    });

    // 4. Find virtual rows from e-Lekha
    const virtualRowsMap = {};
    const len = elekhaData.length;
    for (let i = 0; i < len; i++) {
      const row = elekhaData[i];
      const hoa = String(row.HOA || '').trim();
      if (!hoa.startsWith('3201') && !hoa.startsWith('5201')) continue;
      const ho = String(row.HO || '').trim();
      if (!ho) continue;

      const key = `${ho.toLowerCase()}_${hoa.toLowerCase()}`;
      if (existingBudgetKeys.has(key)) continue;

      if (!virtualRowsMap[key]) {
        virtualRowsMap[key] = {
          ho,
          hoa,
          description: row.Description || '',
          payment: 0,
          region: row.Region || ''
        };
      }
      virtualRowsMap[key].payment += (parseNumber(row['Payment (Rs.)']) + parseNumber(row['Receipt (Rs.)']));
    }

    const virtualRows = Object.values(virtualRowsMap)
      .map(vRow => {
        const lookupInfo = unitToInfoMap[vRow.ho.toLowerCase()] || {};
        // Ignore the office which does not have Office ID in the budget report
        if (!lookupInfo.officeId || lookupInfo.officeId.trim() === '') {
          return null;
        }
        return {
          'Office ID': lookupInfo.officeId,
          'Name of Unit (HO/Division)': vRow.ho,
          'Region': lookupInfo.region || vRow.region || '',
          'HOA': vRow.hoa,
          'Description': vRow.description,
          'APT Alloted': 0,
          'APT Consumed': 0,
          'e-lekha Consumed': vRow.payment,
          'Diff. (APT - e-Lekha)': 0 - vRow.payment,
          'APT Consumed %': 0,
          'e-Lekha Consumed %': 0
        };
      })
      .filter(Boolean);

    // 5. Combine existing mapped rows and virtual rows
    return [...existingMappedRows, ...virtualRows];
  }, [budgetData, elekhaLookupMap, elekhaData]);

  // Budget filtered data (computed locally in React)
  const filteredBudgetData = useMemo(() => {
    return mappedBudgetData.filter(row => {
      // 1. Column filters (checks for selected values)
      for (const [colName, selectedSet] of Object.entries(budgetColumnFilters)) {
        if (selectedSet && selectedSet.size > 0) {
          let val = '';
          if (colName === 'APT Consumed %' || colName === 'e-Lekha Consumed %') {
            val = typeof row[colName] === 'number' ? row[colName].toFixed(2) : String(row[colName]);
          } else {
            val = (row[colName] === undefined || row[colName] === null) ? '' : String(row[colName]).trim();
          }
          if (!selectedSet.has(val)) {
            return false;
          }
        }
      }

      // 2. Region filter
      if (budgetRegion !== 'All' && row.Region !== budgetRegion) {
        return false;
      }

      // 3. Search filter (searches by Name of Unit, Office ID, HOA, Description, Region)
      if (budgetSearch.trim() !== '') {
        const search = budgetSearch.toLowerCase();
        const unitMatch = String(row['Name of Unit (HO/Division)'] || '').toLowerCase().includes(search);
        const idMatch = String(row['Office ID'] || '').toLowerCase().includes(search);
        const hoaMatch = String(row.HOA || '').toLowerCase().includes(search);
        const descMatch = String(row.Description || '').toLowerCase().includes(search);
        const regionMatch = String(row.Region || '').toLowerCase().includes(search);
        if (!unitMatch && !idMatch && !hoaMatch && !descMatch && !regionMatch) return false;
      }

      // 4. Status filter (based on APT Consumed %)
      if (budgetFilterStatus !== 'All') {
        const pct = row['APT Consumed %'];
        if (budgetFilterStatus === 'Over' && pct <= 100) return false;
        if (budgetFilterStatus === 'Warning' && (pct < 85 || pct > 100)) return false;
        if (budgetFilterStatus === 'Safe' && pct >= 85) return false;
      }

      // 5. Custom percentage search
      if (pctSearchVal.trim() !== '') {
        const targetPct = parseFloat(pctSearchVal);
        if (!isNaN(targetPct)) {
          const valToCompare = pctSearchType === 'apt' ? row['APT Consumed %'] : row['e-Lekha Consumed %'];
          if (valToCompare < targetPct) {
            return false;
          }
        }
      }

      return true;
    });
  }, [mappedBudgetData, budgetSearch, budgetRegion, budgetFilterStatus, budgetColumnFilters, pctSearchVal, pctSearchType]);

  // Budget Paginated Data
  const paginatedBudgetData = useMemo(() => {
    const start = budgetPage * budgetRowsPerPage;
    return filteredBudgetData.slice(start, start + budgetRowsPerPage);
  }, [filteredBudgetData, budgetPage, budgetRowsPerPage]);

  // Budget tab KPI metrics summary (the 6 stats)
  const budgetKpis = useMemo(() => {
    let allotted = 0;
    let consumedAPT = 0;
    let consumedElekha = 0;
    let diff = 0;

    filteredBudgetData.forEach(row => {
      allotted += parseNumber(row['APT Alloted']);
      consumedAPT += parseNumber(row['APT Consumed']);
      consumedElekha += row['e-lekha Consumed'] || 0;
      diff += row['Diff. (APT - e-Lekha)'] || 0;
    });

    const aptUtil = allotted > 0 ? (consumedAPT / allotted) * 100 : 0;
    const elekhaUtil = allotted > 0 ? (consumedElekha / allotted) * 100 : 0;

    return {
      allotted,
      consumedAPT,
      consumedElekha,
      diff,
      aptUtil,
      elekhaUtil
    };
  }, [filteredBudgetData]);

  // e-Lekha tab KPI metrics summary (the 6 stats)
  const elekhaKpis = useMemo(() => {
    let totalReceipts = 0;
    let totalPayments = 0;
    const uniqueHoasFiltered = new Set();
    const uniqueHosFiltered = new Set();
    const uniqueDivsFiltered = new Set();

    filteredElekhaData.forEach(row => {
      totalReceipts += parseNumber(row['Receipt (Rs.)']);
      totalPayments += parseNumber(row['Payment (Rs.)']);
      if (row.HOA) uniqueHoasFiltered.add(String(row.HOA).trim());
      if (row.HO) uniqueHosFiltered.add(String(row.HO).trim());
      if (row.Division) uniqueDivsFiltered.add(String(row.Division).trim());
    });

    const diff = totalReceipts - totalPayments;

    return {
      totalReceipts,
      totalPayments,
      diff,
      numHoas: uniqueHoasFiltered.size,
      numHos: uniqueHosFiltered.size,
      numDivs: uniqueDivsFiltered.size
    };
  }, [filteredElekhaData]);

  // Dynamic Statistics derived from full dataset
  const datasetStats = useMemo(() => {
    if (elekhaData.length === 0) return { rows: 0, hoas: 0, HOs: 0, divisions: 0, regions: 0 };
    const hoas = new Set();
    const hos = new Set();
    const divisions = new Set();
    const regions = new Set();
    
    elekhaData.forEach(row => {
      if (row.HOA) hoas.add(String(row.HOA).trim());
      if (row.HO) hos.add(String(row.HO).trim());
      if (row.Division) divisions.add(String(row.Division).trim());
      if (row.Region) regions.add(String(row.Region).trim());
    });

    return {
      rows: elekhaData.length,
      hoas: hoas.size,
      hos: hos.size,
      divisions: divisions.size,
      regions: regions.size
    };
  }, [elekhaData]);

  // Compute the Matrix Data structure for the Vertical Revenue Report Comparison
  const verticalRevenueReportData = useMemo(() => {
    if (!generatedConfig || elekhaData.length === 0 || hoaList.length === 0) return null;
    
    const { 
      type: gType, 
      p1From: gP1From, 
      p1To: gP1To, 
      p2From: gP2From, 
      p2To: gP2To, 
      p1FromDate: gP1FromDate,
      p1ToDate: gP1ToDate,
      p2FromDate: gP2FromDate,
      p2ToDate: gP2ToDate,
      reportType: gReportType, 
      groupBy: gGroupBy 
    } = generatedConfig;

    const isInPeriod = (row, periodNum) => {
      if (gType === 'Month') {
        const rowMonth = row.Month;
        if (!rowMonth) return false;
        
        const start = periodNum === 1 ? gP1From : gP2From;
        const end = periodNum === 1 ? gP1To : gP2To;
        
        const startIdx = uniqueMonths.indexOf(start);
        const endIdx = uniqueMonths.indexOf(end);
        const rowIdx = uniqueMonths.indexOf(rowMonth);
        
        if (startIdx === -1 || endIdx === -1 || rowIdx === -1) return false;
        const min = Math.min(startIdx, endIdx);
        const max = Math.max(startIdx, endIdx);
        
        return rowIdx >= min && rowIdx <= max;
      } else {
        const txnDateStr = row['Txn Date'];
        if (!txnDateStr) return false;
        
        const parts = txnDateStr.split('-');
        if (parts.length !== 3) return false;
        const txnDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        
        const start = periodNum === 1 ? gP1FromDate : gP2FromDate;
        const end = periodNum === 1 ? gP1ToDate : gP2ToDate;
        
        return txnDate >= start && txnDate <= end;
      }
    };

    // Extract unique units for columns and map them to DDO codes using revenue_ddo_mapping
    const unitsSet = new Set();
    const divisionToDdosMap = {};
    
    // Build values index map: "HOA_UnitName_Period" -> sum
    const valMap = {}; // key: "HOA_UnitName_Period" -> sum
    
    const len = elekhaData.length;
    for (let i = 0; i < len; i++) {
      const row = elekhaData[i];
      const hoa = String(row.HOA || '').trim();
      const rawDdoCode = String(row['DDO Code'] || '').trim();
      const cleanDdoCode = rawDdoCode.split('.')[0]; // strip decimal parts e.g. 102472.0
      
      if (!hoa) continue;

      // Look up DDO code mapping
      const mapped = ddoLookupMap[cleanDdoCode];
      
      const hoVal = mapped ? mapped.ho : row.HO;
      const divisionVal = mapped ? mapped.division : row.Division;
      const regionVal = mapped ? mapped.region : row.Region;

      // Define column group label based on selection
      let groupVal = '';
      if (gGroupBy === 'ho') {
        groupVal = hoVal;
      } else if (gGroupBy === 'division') {
        groupVal = divisionVal; // group purely by division name!
        if (divisionVal && cleanDdoCode) {
          if (!divisionToDdosMap[divisionVal]) {
            divisionToDdosMap[divisionVal] = new Set();
          }
          divisionToDdosMap[divisionVal].add(cleanDdoCode);
        }
      } else {
        groupVal = regionVal;
      }

      if (!groupVal || groupVal.trim() === '') continue;
      unitsSet.add(groupVal);

      // Check receipts value
      const recStr = row['Receipt (Rs.)'];
      if (!recStr || recStr === '-') continue;
      const recVal = parseFloat(recStr.replace(/,/g, '').trim());
      if (isNaN(recVal)) continue;

      const inP1 = isInPeriod(row, 1);
      const inP2 = isInPeriod(row, 2);

      if (inP1) {
        const key = `${hoa}_${groupVal}_1`;
        valMap[key] = (valMap[key] || 0) + recVal;
      }
      if (inP2) {
        const key = `${hoa}_${groupVal}_2`;
        valMap[key] = (valMap[key] || 0) + recVal;
      }
    }

    const uniqueUnitsSorted = Array.from(unitsSet).sort().map(name => {
      let label = name;
      if (gGroupBy === 'division' && divisionToDdosMap[name]) {
        const ddosStr = Array.from(divisionToDdosMap[name]).sort().join(', ');
        label = `${name} (${ddosStr})`;
      }
      return {
        name,
        label
      };
    });

    const allRawUnits = uniqueUnitsSorted.map(u => u.name);
    const selectedUnits = revenueColumnFilters['Unit'];
    const filteredUnits = uniqueUnitsSorted.filter(u => {
      if (selectedUnits && selectedUnits.size > 0) {
        return selectedUnits.has(u.name);
      }
      return true;
    });

    // Group rows by HOA Category
    const categoriesOrder = ['CCS', 'FS', 'IRGB', 'MO', 'Parcel'].filter(cat => {
      const selectedCats = revenueColumnFilters['Category'];
      if (selectedCats && selectedCats.size > 0) {
        return selectedCats.has(cat);
      }
      return true;
    });

    const groupedHoas = {};
    categoriesOrder.forEach(c => { groupedHoas[c] = []; });

    hoaList.forEach(item => {
      const cat = item.Category || 'Other';
      if (!categoriesOrder.includes(cat)) return;

      const hoaCode = String(item['HOA Code'] || '').trim();
      const desc = String(item.Description || '').trim();

      const selectedHoas = revenueColumnFilters['HOA'];
      if (selectedHoas && selectedHoas.size > 0) {
        if (!selectedHoas.has(hoaCode)) return;
      }

      const selectedDescs = revenueColumnFilters['Description'];
      if (selectedDescs && selectedDescs.size > 0) {
        if (!selectedDescs.has(desc)) return;
      }

      groupedHoas[cat].push(item);
    });

    // Sort HOA rows numerically within each category
    categoriesOrder.forEach(c => {
      groupedHoas[c].sort((a, b) => String(a['HOA Code']).localeCompare(String(b['HOA Code'])));
    });

    // Pre-calculate sums for cells & category subtotals
    const p1Totals = {}; // "HOA_UnitName" -> sum
    const p2Totals = {}; // "HOA_UnitName" -> sum
    const p1CatTotals = {}; // "Category_UnitName" -> sum
    const p2CatTotals = {}; // "Category_UnitName" -> sum

    categoriesOrder.forEach(cat => {
      const hoas = groupedHoas[cat] || [];
      hoas.forEach(hoa => {
        const hoaCode = String(hoa['HOA Code'] || '').trim();
        filteredUnits.forEach(g => {
          const valP1 = valMap[`${hoaCode}_${g.name}_1`] || 0;
          const valP2 = valMap[`${hoaCode}_${g.name}_2`] || 0;

          p1Totals[`${hoaCode}_${g.name}`] = valP1;
          p2Totals[`${hoaCode}_${g.name}`] = valP2;

          p1CatTotals[`${cat}_${g.name}`] = (p1CatTotals[`${cat}_${g.name}`] || 0) + valP1;
          p2CatTotals[`${cat}_${g.name}`] = (p2CatTotals[`${cat}_${g.name}`] || 0) + valP2;
        });
      });
    });

    // Pre-calculate Row & Column Gross Totals
    const rowP1Gross = {}; 
    const rowP2Gross = {};
    const catP1Gross = {}; 
    const catP2Gross = {};
    let grandP1Gross = 0;
    let grandP2Gross = 0;

    categoriesOrder.forEach(cat => {
      catP1Gross[cat] = 0;
      catP2Gross[cat] = 0;
      const hoas = groupedHoas[cat] || [];
      hoas.forEach(hoa => {
        const hoaCode = String(hoa['HOA Code'] || '').trim();
        let r1 = 0;
        let r2 = 0;
        filteredUnits.forEach(g => {
          r1 += p1Totals[`${hoaCode}_${g.name}`] || 0;
          r2 += p2Totals[`${hoaCode}_${g.name}`] || 0;
        });
        rowP1Gross[hoaCode] = r1;
        rowP2Gross[hoaCode] = r2;
        
        catP1Gross[cat] += r1;
        catP2Gross[cat] += r2;
      });
      grandP1Gross += catP1Gross[cat];
      grandP2Gross += catP2Gross[cat];
    });

    const unitP1Gross = {}; 
    const unitP2Gross = {};
    filteredUnits.forEach(g => {
      let u1 = 0;
      let u2 = 0;
      categoriesOrder.forEach(cat => {
        u1 += p1CatTotals[`${cat}_${g.name}`] || 0;
        u2 += p2CatTotals[`${cat}_${g.name}`] || 0;
      });
      unitP1Gross[g.name] = u1;
      unitP2Gross[g.name] = u2;
    });

    return {
      uniqueUnits: filteredUnits,
      allRawUnits,
      categoriesOrder,
      groupedHoas,
      p1Totals,
      p2Totals,
      p1CatTotals,
      p2CatTotals,
      rowP1Gross,
      rowP2Gross,
      catP1Gross,
      catP2Gross,
      grandP1Gross,
      grandP2Gross,
      unitP1Gross,
      unitP2Gross
    };
  }, [generatedConfig, elekhaData, hoaList, uniqueMonths, ddoLookupMap, revenueColumnFilters]);

  // Category KPIs calculation for Vertical Revenue comparison tab
  const revenueKpis = useMemo(() => {
    if (!verticalRevenueReportData) return null;
    const { uniqueUnits, categoriesOrder } = verticalRevenueReportData;
    const result = {};
    
    categoriesOrder.forEach(cat => {
      let p1Sum = 0;
      let p2Sum = 0;
      uniqueUnits.forEach(g => {
        p1Sum += verticalRevenueReportData.p1CatTotals[`${cat}_${g.name}`] || 0;
        p2Sum += verticalRevenueReportData.p2CatTotals[`${cat}_${g.name}`] || 0;
      });
      result[cat] = { p1: p1Sum, p2: p2Sum };
    });
    
    let grossP1 = 0;
    let grossP2 = 0;
    categoriesOrder.forEach(cat => {
      grossP1 += result[cat].p1;
      grossP2 += result[cat].p2;
    });
    result['Gross'] = { p1: grossP1, p2: grossP2 };
    
    return result;
  }, [verticalRevenueReportData]);

  // Period label helper method
  const getPeriodLabel = useCallback((periodNum) => {
    if (!generatedConfig) return periodNum === 1 ? 'P1' : 'P2';
    const { type, p1From, p1To, p2From, p2To, p1FromDate, p1ToDate, p2FromDate, p2ToDate } = generatedConfig;
    if (type === 'Month') {
      if (periodNum === 1) {
        return p1From === p1To ? p1From : `${p1From} to ${p1To}`;
      } else {
        return p2From === p2To ? p2From : `${p2From} to ${p2To}`;
      }
    } else {
      const formatNiceDate = (dStr) => {
        if (!dStr) return '';
        const parts = dStr.split('-');
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0].substring(2)}`;
        }
        return dStr;
      };
      if (periodNum === 1) {
        return `${formatNiceDate(p1FromDate)} to ${formatNiceDate(p1ToDate)}`;
      } else {
        return `${formatNiceDate(p2FromDate)} to ${formatNiceDate(p2ToDate)}`;
      }
    }
  }, [generatedConfig]);

  // Render method for Vertical Revenue category KPIs
  const renderRevenueKpis = () => {
    if (!revenueKpis) return null;
    const categories = ['CCS', 'FS', 'IRGB', 'MO', 'Parcel', 'Gross'];
    return (
      <div className="kpi-grid">
        {categories.map(cat => {
          const p1Val = revenueKpis[cat]?.p1 || 0;
          const p2Val = revenueKpis[cat]?.p2 || 0;
          return (
            <div className="kpi-card" key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="kpi-info" style={{ width: '100%' }}>
                <h4 style={{ textTransform: 'uppercase' }}>{cat === 'Gross' ? 'Gross Total' : `${cat} Category Total`}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{getPeriodLabel(1)}:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{formatINR(p1Val)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{getPeriodLabel(2)}:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{formatINR(p2Val)}</strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Click handler to re-calculate vertical revenue matrix
  const handleGenerate = () => {
    setGeneratedConfig({
      type: revenueType,
      p1From,
      p1To,
      p2From,
      p2To,
      p1FromDate,
      p1ToDate,
      p2FromDate,
      p2ToDate,
      reportType,
      groupBy
    });
  };

  // CSV Export for Budget Report
  const handleExportBudgetCSV = () => {
    const csvRows = [];
    const header = [
      'Office ID', 'Name of Unit (HO/Division)', 'Region', 'HOA', 'Description',
      'APT Alloted', 'APT Consumed', 'e-lekha Consumed', 'Diff. (APT - e-Lekha)',
      'APT Consumed %', 'e-Lekha Consumed %'
    ];
    csvRows.push(header.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    filteredBudgetData.forEach(row => {
      const line = [
        row['Office ID'], row['Name of Unit (HO/Division)'], row['Region'], row['HOA'], row['Description'],
        row['APT Alloted'], row['APT Consumed'], row['e-lekha Consumed'], row['Diff. (APT - e-Lekha)'],
        row['APT Consumed %'], row['e-Lekha Consumed %']
      ];
      csvRows.push(line.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Budget_Report_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Export for Budget Report
  const handleExportBudgetExcel = () => {
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; font-family: Calibri, sans-serif; font-size: 10pt; }
          th, td { border: 1px solid #d4d4d8; padding: 6px 10px; }
          th { background-color: #0f172a; color: #f8fafc; font-weight: bold; }
          .text-right { text-align: right; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Office ID</th>
              <th>Name of Unit (HO/Division)</th>
              <th>Region</th>
              <th>HOA</th>
              <th>Description</th>
              <th>APT Alloted</th>
              <th>APT Consumed</th>
              <th>e-Lekha Consumed</th>
              <th>Diff. (APT - e-Lekha)</th>
              <th>APT Consumed %</th>
              <th>e-Lekha Consumed %</th>
            </tr>
          </thead>
          <tbody>
    `;

    filteredBudgetData.forEach(row => {
      html += `
        <tr>
          <td>${row['Office ID'] || '–'}</td>
          <td>${row['Name of Unit (HO/Division)'] || '–'}</td>
          <td>${row['Region'] || '–'}</td>
          <td>${row['HOA'] || '–'}</td>
          <td>${row['Description'] || '–'}</td>
          <td class="text-right">${row['APT Alloted'] || '–'}</td>
          <td class="text-right">${row['APT Consumed'] || '–'}</td>
          <td class="text-right">${row['e-lekha Consumed'] || '–'}</td>
          <td class="text-right">${row['Diff. (APT - e-Lekha)'] || '–'}</td>
          <td class="text-right">${row['APT Consumed %'] || '–'}</td>
          <td class="text-right">${row['e-Lekha Consumed %'] || '–'}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Budget_Report_Export.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export for e-Lekha Transactions Table
  const handleExportElekhaCSV = () => {
    const csvRows = [];
    const header = [
      'Txn Date', 'Month', 'Region', 'DDO Code', 'HO', 'Division', 'HOA', 'Description', 'Receipts', 'Payments', 'Remark'
    ];
    csvRows.push(header.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    filteredElekhaData.forEach(row => {
      const line = [
        row['Txn Date'], row['Month'], row['Region'], row['DDO Code'], row['HO'], row['Division'], row['HOA'], row['Description'],
        row['Receipt (Rs.)'], row['Payment (Rs.)'], row['Remark']
      ];
      csvRows.push(line.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `e-Lekha_Transactions_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Export for e-Lekha Transactions Table
  const handleExportElekhaExcel = () => {
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; font-family: Calibri, sans-serif; font-size: 10pt; }
          th, td { border: 1px solid #d4d4d8; padding: 6px 10px; }
          th { background-color: #0f172a; color: #f8fafc; font-weight: bold; }
          .text-right { text-align: right; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Txn Date</th>
              <th>Month</th>
              <th>Region</th>
              <th>DDO</th>
              <th>HO</th>
              <th>Division</th>
              <th>HOA</th>
              <th>Description</th>
              <th>Receipts</th>
              <th>Payments</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
    `;

    filteredElekhaData.forEach(row => {
      html += `
        <tr>
          <td>${row['Txn Date'] || '–'}</td>
          <td>${row['Month'] || '–'}</td>
          <td>${row['Region'] || '–'}</td>
          <td>${row['DDO Code'] || '–'}</td>
          <td>${row['HO'] || '–'}</td>
          <td>${row['Division'] || '–'}</td>
          <td>${row['HOA'] || '–'}</td>
          <td>${row['Description'] || '–'}</td>
          <td class="text-right">${row['Receipt (Rs.)'] || '–'}</td>
          <td class="text-right">${row['Payment (Rs.)'] || '–'}</td>
          <td>${row['Remark'] || '–'}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `e-Lekha_Transactions_Export.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export for Vertical Revenue Comparison Matrix
  const handleExportCSV = () => {
    if (!verticalRevenueReportData) return;
    const { uniqueUnits, categoriesOrder, groupedHoas, p1Totals, p2Totals, p1CatTotals, p2CatTotals, rowP1Gross, rowP2Gross, catP1Gross, catP2Gross, grandP1Gross, grandP2Gross, unitP1Gross, unitP2Gross } = verticalRevenueReportData;
    
    const csvRows = [];
    
    // Flat Header
    const header = ['Category', 'HOA', 'Description'];
    uniqueUnits.forEach(g => {
      header.push(`${g.label} (${getPeriodLabel(1)})`);
      header.push(`${g.label} (${getPeriodLabel(2)})`);
    });
    header.push(`Gross Total (${getPeriodLabel(1)})`);
    header.push(`Gross Total (${getPeriodLabel(2)})`);
    csvRows.push(header.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    // Rows
    categoriesOrder.forEach(cat => {
      const hoas = groupedHoas[cat] || [];
      
      // If Detail, show individual HOAs
      if (generatedConfig.reportType === 'Detail') {
        hoas.forEach(hoa => {
          const hoaCode = String(hoa['HOA Code'] || '').trim();
          const row = [cat, hoaCode, hoa['Description']];
          uniqueUnits.forEach(g => {
            const v1 = p1Totals[`${hoaCode}_${g.name}`] || 0;
            const v2 = p2Totals[`${hoaCode}_${g.name}`] || 0;
            row.push(v1);
            row.push(v2);
          });
          row.push(rowP1Gross[hoaCode] || 0);
          row.push(rowP2Gross[hoaCode] || 0);
          csvRows.push(row.map(r => `"${String(r).replace(/"/g, '""')}"`).join(','));
        });
      }

      // Subtotal Row
      const subtotalRow = [`${cat} Total`, '', ''];
      uniqueUnits.forEach(g => {
        const c1 = p1CatTotals[`${cat}_${g.name}`] || 0;
        const c2 = p2CatTotals[`${cat}_${g.name}`] || 0;
        subtotalRow.push(c1);
        subtotalRow.push(c2);
      });
      subtotalRow.push(catP1Gross[cat] || 0);
      subtotalRow.push(catP2Gross[cat] || 0);
      csvRows.push(subtotalRow.map(r => `"${String(r).replace(/"/g, '""')}"`).join(','));
    });

    // Grand Total Row
    const grandRow = ['GROSS TOTAL', '', ''];
    uniqueUnits.forEach(g => {
      grandRow.push(unitP1Gross[g.name] || 0);
      grandRow.push(unitP2Gross[g.name] || 0);
    });
    grandRow.push(grandP1Gross);
    grandRow.push(grandP2Gross);
    csvRows.push(grandRow.map(r => `"${String(r).replace(/"/g, '""')}"`).join(','));

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const rangeText = generatedConfig.type === 'Month' 
      ? `P1_${generatedConfig.p1From}_to_${generatedConfig.p1To}_P2_${generatedConfig.p2From}_to_${generatedConfig.p2To}`
      : `P1_${generatedConfig.p1FromDate}_to_${generatedConfig.p1ToDate}_P2_${generatedConfig.p2FromDate}_to_${generatedConfig.p2ToDate}`;

    link.setAttribute('download', `Vertical_Revenue_Report_${rangeText}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Export for Vertical Revenue Matrix
  const handleExportExcel = () => {
    if (!verticalRevenueReportData) return;
    const { uniqueUnits, categoriesOrder, groupedHoas, p1Totals, p2Totals, p1CatTotals, p2CatTotals, rowP1Gross, rowP2Gross, catP1Gross, catP2Gross, grandP1Gross, grandP2Gross, unitP1Gross, unitP2Gross } = verticalRevenueReportData;
    
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; font-family: Calibri, sans-serif; font-size: 10pt; }
          th, td { border: 1px solid #d4d4d8; padding: 6px 10px; }
          th { background-color: #0f172a; color: #f8fafc; font-weight: bold; }
          .ccs-row { background-color: #f0f9ff; color: #0284c7; }
          .ccs-total { background-color: #bae6fd; color: #0369a1; font-weight: bold; }
          .fs-row { background-color: #f0fdf4; color: #16a34a; }
          .fs-total { background-color: #bbf7d0; color: #15803d; font-weight: bold; }
          .irgb-row { background-color: #fff7ed; color: #ea580c; }
          .irgb-total { background-color: #fed7aa; color: #c2410c; font-weight: bold; }
          .mo-row { background-color: #faf5ff; color: #9333ea; }
          .mo-total { background-color: #e9d5ff; color: #7e22ce; font-weight: bold; }
          .parcel-row { background-color: #fff1f2; color: #e11d48; }
          .parcel-total { background-color: #fecdd3; color: #be123c; font-weight: bold; }
          .grand-total-row { background-color: #f4f4f5; color: #18181b; font-weight: bold; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th rowspan="2">Category</th>
              <th rowspan="2">HOA</th>
              <th rowspan="2">Description</th>
    `;

    uniqueUnits.forEach(g => {
      html += `<th colspan="2" class="text-center">${g.label}</th>`;
    });

    html += `<th colspan="2" class="text-center">Gross Total</th>`;

    html += `
            </tr>
            <tr>
    `;

    uniqueUnits.forEach(() => {
      html += `<th class="text-center">${getPeriodLabel(1)}</th><th class="text-center">${getPeriodLabel(2)}</th>`;
    });

    html += `<th class="text-center">${getPeriodLabel(1)}</th><th class="text-center">${getPeriodLabel(2)}</th>`;

    html += `
            </tr>
          </thead>
          <tbody>
    `;

    categoriesOrder.forEach(cat => {
      const hoas = groupedHoas[cat] || [];
      const clsRow = `${cat.toLowerCase()}-row`;
      const clsTotal = `${cat.toLowerCase()}-total`;

      // If Detail, show individual HOAs
      if (generatedConfig.reportType === 'Detail') {
        hoas.forEach(hoa => {
          const hoaCode = String(hoa['HOA Code'] || '').trim();
          html += `<tr><td class="${clsRow}">${cat}</td><td>${hoaCode}</td><td>${hoa['Description']}</td>`;
          uniqueUnits.forEach(g => {
            const v1 = p1Totals[`${hoaCode}_${g.name}`] || 0;
            const v2 = p2Totals[`${hoaCode}_${g.name}`] || 0;
            html += `<td class="text-right">${v1 ? v1.toFixed(2) : '-'}</td><td class="text-right">${v2 ? v2.toFixed(2) : '-'}</td>`;
          });
          html += `<td class="text-right" style="font-weight:bold">${rowP1Gross[hoaCode] ? rowP1Gross[hoaCode].toFixed(2) : '-'}</td><td class="text-right" style="font-weight:bold">${rowP2Gross[hoaCode] ? rowP2Gross[hoaCode].toFixed(2) : '-'}</td>`;
          html += `</tr>`;
        });
      }

      // Subtotal Row
      html += `<tr class="${clsTotal}"><td class="${clsTotal}">${cat} Total</td><td></td><td></td>`;
      uniqueUnits.forEach(g => {
        const c1 = p1CatTotals[`${cat}_${g.name}`] || 0;
        const c2 = p2CatTotals[`${cat}_${g.name}`] || 0;
        html += `<td class="text-right">${c1 ? c1.toFixed(2) : '-'}</td><td class="text-right">${c2 ? c2.toFixed(2) : '-'}</td>`;
      });
      html += `<td class="text-right" style="font-weight:bold">${catP1Gross[cat] ? catP1Gross[cat].toFixed(2) : '-'}</td><td class="text-right" style="font-weight:bold">${catP2Gross[cat] ? catP2Gross[cat].toFixed(2) : '-'}</td>`;
      html += `</tr>`;
    });

    // Grand Total Bottom Row
    html += `<tr class="grand-total-row"><td>GROSS TOTAL</td><td></td><td></td>`;
    uniqueUnits.forEach(g => {
      const u1 = unitP1Gross[g.name] || 0;
      const u2 = unitP2Gross[g.name] || 0;
      html += `<td class="text-right">${u1 ? u1.toFixed(2) : '-'}</td><td class="text-right">${u2 ? u2.toFixed(2) : '-'}</td>`;
    });
    html += `<td class="text-right">${grandP1Gross ? grandP1Gross.toFixed(2) : '-'}</td><td class="text-right">${grandP2Gross ? grandP2Gross.toFixed(2) : '-'}</td>`;
    html += `</tr>`;

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const rangeText = generatedConfig.type === 'Month' 
      ? `P1_${generatedConfig.p1From}_to_${generatedConfig.p1To}_P2_${generatedConfig.p2From}_to_${generatedConfig.p2To}`
      : `P1_${generatedConfig.p1FromDate}_to_${generatedConfig.p1ToDate}_P2_${generatedConfig.p2FromDate}_to_${generatedConfig.p2ToDate}`;

    link.setAttribute('download', `Vertical_Revenue_Report_${rangeText}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="loader-container" style={{ minHeight: '80vh' }}>
        <div className="spinner"></div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Preparing CEBAR Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Loading local CSV database tables into memory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <div className="empty-state">
          <AlertCircle size={48} style={{ color: 'var(--color-error)' }} />
          <h2 style={{ color: 'var(--text-primary)' }}>Loading Failed</h2>
          <p style={{ maxWidth: '500px' }}>{error}</p>
          <button className="pg-btn" onClick={() => window.location.reload()} style={{ marginTop: '1.5rem' }}>
            <RefreshCw size={16} /> Retry Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      
      {/* 1. Header Area */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🪙 CEBAR - Circle Expenditure, Budget and Accounting Review</h1>
          <p>Real-time expenditure tracking, budget variance analysis, and vertical revenue comparison report</p>
        </div>
        <div className="header-right">
          <button 
            className="theme-toggle-btn" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* 2. Database Status Indicator (Replaces old security advisory) */}
      <div className="security-alert-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
        <div className="alert-message">
          <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
          <div>
            <strong>Offline Mode Active:</strong> Loaded financial datasets locally. 
            All data aggregates and comparisons are computed instantaneously on the client.
          </div>
        </div>
      </div>

      {/* 3. Global Control & Navigation Panel */}
      <div className="controls-panel">
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
            onClick={() => setActiveTab('budget')}
          >
            <BarChart2 size={16} /> Budget Report
          </button>
          <button 
            className={`tab-btn ${activeTab === 'elekha' ? 'active' : ''}`}
            onClick={() => setActiveTab('elekha')}
          >
            <FileText size={16} /> e-Lekha Transactions
          </button>
          <button 
            className={`tab-btn ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue')}
          >
            <Coins size={16} /> Vertical Revenue
          </button>
        </div>

        {/* Global Search Inputs based on active Tab */}
        {activeTab === 'elekha' && (
          <div className="filters-row">
            <div className="input-group">
              <Search className="input-icon" size={16} />
              <input 
                type="text" 
                placeholder="Search Region, DDO, HO, Division, HOA, Description..." 
                className="custom-input"
                value={elekhaSearch}
                onChange={(e) => {
                  setElekhaSearch(e.target.value);
                  setElekhaPage(0);
                }}
                style={{ minWidth: '350px' }}
              />
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="filters-row">
            <div className="input-group">
              <Search className="input-icon" size={16} />
              <input 
                type="text" 
                placeholder="Search Office ID, Name of Unit, Region, HOA, Description..." 
                className="custom-input"
                value={budgetSearch}
                onChange={(e) => {
                  setBudgetSearch(e.target.value);
                  setBudgetPage(0);
                }}
                style={{ minWidth: '350px' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. KPI Summaries Bar */}
      {activeTab === 'elekha' && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-info">
              <h4>Total Receipts (Revenue)</h4>
              <div className="kpi-value">{formatINR(elekhaKpis.totalReceipts)}</div>
            </div>
            <div className="kpi-icon-container allotted">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-info">
              <h4>Total Payments (Expenditure)</h4>
              <div className="kpi-value">{formatINR(elekhaKpis.totalPayments)}</div>
            </div>
            <div className="kpi-icon-container consumed">
              <Coins size={20} />
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-info">
              <h4>Diff (Revenue - Expenditure)</h4>
              <div className="kpi-value" style={{ color: elekhaKpis.diff < 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                {formatINR(elekhaKpis.diff)}
              </div>
            </div>
            <div className="kpi-icon-container remaining">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-info">
              <h4>No. of HOA</h4>
              <div className="kpi-value">{elekhaKpis.numHoas}</div>
            </div>
            <div className="kpi-icon-container ratio">
              <BarChart2 size={20} />
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-info">
              <h4>No. of HO</h4>
              <div className="kpi-value">{elekhaKpis.numHos}</div>
            </div>
            <div className="kpi-icon-container ratio">
              <FileText size={20} />
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-info">
              <h4>No. of Division</h4>
              <div className="kpi-value">{elekhaKpis.numDivs}</div>
            </div>
            <div className="kpi-icon-container ratio">
              <Coins size={20} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'revenue' && renderRevenueKpis()}

      {/* 5. Main Card Content Area */}
      <main className="main-card">
        
        {/* Tab 1: Budget Report View (As per budget report.csv) */}
        {activeTab === 'budget' && (
          <>
            {/* Budget Summary Bar */}
            <div className="budget-summary-bar">
              <div className="budget-summary-card">
                <h5>Total APT Allotted</h5>
                <div className="value">{formatINR(budgetKpis.allotted)}</div>
              </div>
              <div className="budget-summary-card">
                <h5>Total APT Consumed</h5>
                <div className="value">{formatINR(budgetKpis.consumedAPT)}</div>
              </div>
              <div className="budget-summary-card">
                <h5>Total e-Lekha Consumed</h5>
                <div className="value">{formatINR(budgetKpis.consumedElekha)}</div>
              </div>
              <div className="budget-summary-card">
                <h5>Total Diff (APT - e-Lekha)</h5>
                <div className="value" style={{ color: budgetKpis.diff < 0 ? 'var(--color-error)' : 'inherit' }}>
                  {formatINR(budgetKpis.diff)}
                </div>
              </div>
              <div className="budget-summary-card rate">
                <h5>APT Util. Rate</h5>
                <div className="value">{budgetKpis.aptUtil.toFixed(1)}%</div>
              </div>
              <div className="budget-summary-card rate">
                <h5>e-Lekha Util. Rate</h5>
                <div className="value">{budgetKpis.elekhaUtil.toFixed(1)}%</div>
              </div>
            </div>

            {/* Percentage Search & Global filters bar */}
            <div className="pct-search-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter by % Consumed:</span>
                <select 
                  className="custom-select" 
                  value={pctSearchType} 
                  onChange={(e) => setPctSearchType(e.target.value)}
                  style={{ padding: '4px 8px', fontSize: '0.8rem', minWidth: '150px', height: '32px' }}
                >
                  <option value="apt">APT Consumed %</option>
                  <option value="elekha">e-Lekha Consumed %</option>
                </select>
                <input 
                  type="text" 
                  placeholder="e.g. 85" 
                  value={pctSearchVal}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // only digits
                    if (val.length <= 3) {
                      setPctSearchVal(val);
                      setBudgetPage(0);
                    }
                  }}
                  style={{
                    width: '70px',
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    height: '32px',
                    textAlign: 'center'
                  }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>% or more</span>
              </div>

              {/* Status & Region filters */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Region:</span>
                  <select 
                    value={budgetRegion} 
                    onChange={(e) => { setBudgetRegion(e.target.value); setBudgetPage(0); }}
                    className="custom-select"
                    style={{ padding: '4px 8px', fontSize: '0.8rem', height: '32px' }}
                  >
                    <option value="All">All Regions</option>
                    {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status:</span>
                  <select 
                    value={budgetFilterStatus} 
                    onChange={(e) => { setBudgetFilterStatus(e.target.value); setBudgetPage(0); }}
                    className="custom-select"
                    style={{ padding: '4px 8px', fontSize: '0.8rem', height: '32px' }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Over">Over Budget (&gt; 100%)</option>
                    <option value="Warning">Warning (85% - 100%)</option>
                    <option value="Safe">Safe (&lt; 85%)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card-title-row" style={{ marginTop: '1rem' }}>
              <h2>Office Budget Utilization Summary</h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Loaded <strong>{filteredBudgetData.length}</strong> matching records from <code>budget report.csv</code>
              </div>
            </div>

              <>
                <div className="table-wrapper">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>
                          <ColumnHeaderFilter 
                            title="Office ID" 
                            columnName="Office ID" 
                            allValues={budgetData.map(d => d['Office ID'])} 
                            selectedFilters={budgetColumnFilters['Office ID']} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="Name of Unit (HO/Division)" 
                            columnName="Name of Unit (HO/Division)" 
                            allValues={budgetData.map(d => d['Name of Unit (HO/Division)'])} 
                            selectedFilters={budgetColumnFilters['Name of Unit (HO/Division)']} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="Region" 
                            columnName="Region" 
                            allValues={budgetData.map(d => d.Region)} 
                            selectedFilters={budgetColumnFilters.Region} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="HOA" 
                            columnName="HOA" 
                            allValues={budgetData.map(d => d.HOA)} 
                            selectedFilters={budgetColumnFilters.HOA} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="Description" 
                            columnName="Description" 
                            allValues={budgetData.map(d => d.Description)} 
                            selectedFilters={budgetColumnFilters.Description} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th className="text-right">
                          <ColumnHeaderFilter 
                            title="APT Alloted" 
                            columnName="APT Alloted" 
                            allValues={mappedBudgetData.map(d => String(d['APT Alloted'] || 0))} 
                            selectedFilters={budgetColumnFilters['APT Alloted']} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th className="text-right">
                          <ColumnHeaderFilter 
                            title="APT Consumed" 
                            columnName="APT Consumed" 
                            allValues={mappedBudgetData.map(d => String(d['APT Consumed'] || 0))} 
                            selectedFilters={budgetColumnFilters['APT Consumed']} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th className="text-right">
                          <ColumnHeaderFilter 
                            title="e-Lekha Consumed" 
                            columnName="e-lekha Consumed" 
                            allValues={mappedBudgetData.map(d => String(d['e-lekha Consumed'] || 0))} 
                            selectedFilters={budgetColumnFilters['e-lekha Consumed']} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th className="text-right">
                          <ColumnHeaderFilter 
                            title="Diff. (APT - e-Lekha)" 
                            columnName="Diff. (APT - e-Lekha)" 
                            allValues={mappedBudgetData.map(d => String(d['Diff. (APT - e-Lekha)'] || 0))} 
                            selectedFilters={budgetColumnFilters['Diff. (APT - e-Lekha)']} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th className="text-right">
                          <ColumnHeaderFilter 
                            title="APT Consumed %" 
                            columnName="APT Consumed %" 
                            allValues={mappedBudgetData.map(d => typeof d['APT Consumed %'] === 'number' ? d['APT Consumed %'].toFixed(2) : String(d['APT Consumed %']))} 
                            selectedFilters={budgetColumnFilters['APT Consumed %']} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th className="text-right">
                          <ColumnHeaderFilter 
                            title="e-Lekha Consumed %" 
                            columnName="e-Lekha Consumed %" 
                            allValues={mappedBudgetData.map(d => typeof d['e-Lekha Consumed %'] === 'number' ? d['e-Lekha Consumed %'].toFixed(2) : String(d['e-Lekha Consumed %']))} 
                            selectedFilters={budgetColumnFilters['e-Lekha Consumed %']} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBudgetData.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                              <AlertCircle size={24} style={{ color: 'var(--color-warning)' }} />
                              <span style={{ fontWeight: 600 }}>No budget records matching the active filters.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedBudgetData.map((row, idx) => {
                          const pct = row['APT Consumed %'] || 0;
                          let statusColor = 'inherit';
                          if (pct > 100) {
                            statusColor = 'var(--color-error)';
                          } else if (pct >= 85) {
                            statusColor = 'var(--color-warning)';
                          }

                          const rowKey = `${row['Office ID']}_${row['HOA']}`;
                          const isExpanded = !!expandedBudgetRows[rowKey];
                          const eLekhaTxns = elekhaLookupMap[`${String(row['Name of Unit (HO/Division)']).trim().toLowerCase()}_${String(row['HOA']).trim()}`]?.txns || [];

                          return (
                            <React.Fragment key={rowKey}>
                              <tr>
                                <td>
                                  {eLekhaTxns.length > 0 ? (
                                    <button 
                                      onClick={() => setExpandedBudgetRows(prev => ({ ...prev, [rowKey]: !isExpanded }))} 
                                      className="expand-btn"
                                      title="Toggle transactions view"
                                    >
                                      {isExpanded ? '−' : '+'}
                                    </button>
                                  ) : (
                                    <span style={{ display: 'inline-block', width: '30px' }}></span>
                                  )}
                                  <code>{row['Office ID'] || '–'}</code>
                                </td>
                                <td><strong>{row['Name of Unit (HO/Division)'] || '–'}</strong></td>
                                <td>{row['Region'] || '–'}</td>
                                <td><code>{row['HOA'] || '–'}</code></td>
                                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.Description}>
                                  {row.Description || '–'}
                                </td>
                                <td className="text-right">{formatTableValue(row['APT Alloted'])}</td>
                                <td className="text-right" style={{ fontWeight: 500 }}>{formatTableValue(row['APT Consumed'])}</td>
                                <td className="text-right" style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{formatTableValue(row['e-lekha Consumed'])}</td>
                                <td className="text-right" style={{ color: row['Diff. (APT - e-Lekha)'] < 0 ? 'var(--color-error)' : 'inherit' }}>
                                  {formatTableValue(row['Diff. (APT - e-Lekha)'])}
                                </td>
                                <td className="text-right" style={{ fontWeight: 600, color: statusColor }}>
                                  {typeof row['APT Consumed %'] === 'number' ? (row['APT Consumed %'].toFixed(2) + '%') : row['APT Consumed %']}
                                </td>
                                <td className="text-right" style={{ fontWeight: 600 }}>
                                  {typeof row['e-Lekha Consumed %'] === 'number' ? (row['e-Lekha Consumed %'].toFixed(2) + '%') : row['e-Lekha Consumed %']}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="expanded-row">
                                  <td colSpan={11}>
                                    <div className="expanded-content">
                                      <h4>e-Lekha Transactions Breakdown ({eLekhaTxns.length} records)</h4>
                                      <table className="expanded-table">
                                        <thead>
                                          <tr>
                                            <th>Txn Date</th>
                                            <th>Month</th>
                                            <th>Description</th>
                                            <th className="text-right">Payment Amount (Rs.)</th>
                                            <th>Remark</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {eLekhaTxns.map((txn, tIdx) => (
                                            <tr key={tIdx}>
                                              <td>{txn['Txn Date'] || '–'}</td>
                                              <td>{txn['Month'] || '–'}</td>
                                              <td>{txn['Description'] || '–'}</td>
                                              <td className="text-right" style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                                                {txn['Payment (Rs.)'] || '–'}
                                              </td>
                                              <td>{txn['Remark'] || '–'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination and Exports */}
                {filteredBudgetData.length > 0 && (
                  <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Bottom Left Exports */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        onClick={handleExportBudgetCSV} 
                        className="pg-btn" 
                        style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', fontWeight: 600 }}
                      >
                        <Download size={14} /> Export to CSV
                      </button>
                      <button 
                        onClick={handleExportBudgetExcel} 
                        className="pg-btn" 
                        style={{ backgroundColor: '#22c55e', color: 'white', border: 'none', fontWeight: 600 }}
                      >
                        <Download size={14} /> Export to Excel
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div className="pagination-info">
                        Showing <strong>{budgetPage * budgetRowsPerPage + 1}</strong> to <strong>{Math.min((budgetPage + 1) * budgetRowsPerPage, filteredBudgetData.length)}</strong> of <strong>{filteredBudgetData.length}</strong> records
                      </div>
                      <select 
                        className="custom-select" 
                        value={budgetRowsPerPage} 
                        onChange={(e) => {
                          setBudgetRowsPerPage(parseInt(e.target.value, 10));
                          setBudgetPage(0);
                        }}
                        style={{ padding: '0.4rem 2rem 0.4rem 1rem', minWidth: '80px' }}
                      >
                        <option value="25">25 rows</option>
                        <option value="50">50 rows</option>
                        <option value="100">100 rows</option>
                      </select>

                      <div className="pagination-buttons" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                          className="pg-btn" 
                          disabled={budgetPage === 0} 
                          onClick={() => setBudgetPage(prev => Math.max(prev - 1, 0))}
                        >
                          <ChevronLeft size={16} /> Prev
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page:</span>
                          <input 
                            type="text" 
                            className="custom-input" 
                            value={budgetPageInput} 
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, ''); // only digits
                              setBudgetPageInput(val);
                              if (val) {
                                const pNum = parseInt(val, 10) - 1;
                                const maxPage = Math.ceil(filteredBudgetData.length / budgetRowsPerPage) - 1;
                                if (pNum >= 0 && pNum <= maxPage) {
                                  setBudgetPage(pNum);
                                }
                              }
                            }}
                            style={{
                              width: '45px',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--bg-input)',
                              color: 'var(--text-primary)',
                              height: '30px',
                              textAlign: 'center',
                              fontSize: '0.85rem'
                            }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {Math.ceil(filteredBudgetData.length / budgetRowsPerPage)}</span>
                        </div>

                        <button 
                          className="pg-btn" 
                          disabled={(budgetPage + 1) * budgetRowsPerPage >= filteredBudgetData.length} 
                          onClick={() => setBudgetPage(prev => prev + 1)}
                        >
                          Next <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            </>
          )}

        {/* Tab 2: e-Lekha transactions list view */}
        {activeTab === 'elekha' && (
          <>
            <div className="card-title-row">
              <h2>e-Lekha Transactions Table</h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Loaded <strong>{filteredElekhaData.length}</strong> matching transactions
              </div>
            </div>

            <>
              <div className="table-wrapper">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>
                          <ColumnHeaderFilter 
                            title="Txn Date" 
                            columnName="Txn Date" 
                            allValues={elekhaData.map(d => d['Txn Date'])} 
                            selectedFilters={elekhaColumnFilters['Txn Date']} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="Month" 
                            columnName="Month" 
                            allValues={elekhaData.map(d => d.Month)} 
                            selectedFilters={elekhaColumnFilters.Month} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="Region" 
                            columnName="Region" 
                            allValues={elekhaData.map(d => d.Region)} 
                            selectedFilters={elekhaColumnFilters.Region} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="DDO" 
                            columnName="DDO Code" 
                            allValues={elekhaData.map(d => d['DDO Code'])} 
                            selectedFilters={elekhaColumnFilters['DDO Code']} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="HO" 
                            columnName="HO" 
                            allValues={elekhaData.map(d => d.HO)} 
                            selectedFilters={elekhaColumnFilters.HO} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="Division" 
                            columnName="Division" 
                            allValues={elekhaData.map(d => d.Division)} 
                            selectedFilters={elekhaColumnFilters.Division} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="HOA" 
                            columnName="HOA" 
                            allValues={elekhaData.map(d => d.HOA)} 
                            selectedFilters={elekhaColumnFilters.HOA} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="Description" 
                            columnName="Description" 
                            allValues={elekhaData.map(d => d.Description)} 
                            selectedFilters={elekhaColumnFilters.Description} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th className="text-right">
                          <ColumnHeaderFilter 
                            title="Receipts" 
                            columnName="Receipt (Rs.)" 
                            allValues={elekhaData.map(d => String(d['Receipt (Rs.)'] || '0').trim())} 
                            selectedFilters={elekhaColumnFilters['Receipt (Rs.)']} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th className="text-right">
                          <ColumnHeaderFilter 
                            title="Payments" 
                            columnName="Payment (Rs.)" 
                            allValues={elekhaData.map(d => String(d['Payment (Rs.)'] || '0').trim())} 
                            selectedFilters={elekhaColumnFilters['Payment (Rs.)']} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="Remark" 
                            columnName="Remark" 
                            allValues={elekhaData.map(d => String(d['Remark'] || '').trim())} 
                            selectedFilters={elekhaColumnFilters['Remark']} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredElekhaData.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                              <AlertCircle size={24} style={{ color: 'var(--color-warning)' }} />
                              <span style={{ fontWeight: 600 }}>No transactions found matching active filters.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedElekhaData.map((row, idx) => (
                          <tr key={idx}>
                            <td>{row['Txn Date'] || '–'}</td>
                            <td>{row['Month'] || '–'}</td>
                            <td>{row['Region'] || '–'}</td>
                            <td>{row['DDO Code'] || '–'}</td>
                            <td>{row['HO'] || '–'}</td>
                            <td>{row['Division'] || '–'}</td>
                            <td>{row['HOA'] || '–'}</td>
                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.Description}>
                              {row.Description || '–'}
                            </td>
                            <td className="text-right" style={{ color: parseNumber(row['Receipt (Rs.)']) > 0 ? 'var(--color-success)' : 'inherit' }}>
                              {row['Receipt (Rs.)'] || '–'}
                            </td>
                            <td className="text-right" style={{ color: parseNumber(row['Payment (Rs.)']) > 0 ? 'var(--color-warning)' : 'inherit' }}>
                              {row['Payment (Rs.)'] || '–'}
                            </td>
                            <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.Remark}>
                              {row.Remark || '–'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination and Exports */}
                {filteredElekhaData.length > 0 && (
                  <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Bottom Left Exports */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        onClick={handleExportElekhaCSV} 
                        className="pg-btn" 
                        style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', fontWeight: 600 }}
                      >
                        <Download size={14} /> Export to CSV
                      </button>
                      <button 
                        onClick={handleExportElekhaExcel} 
                        className="pg-btn" 
                        style={{ backgroundColor: '#22c55e', color: 'white', border: 'none', fontWeight: 600 }}
                      >
                        <Download size={14} /> Export to Excel
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div className="pagination-info">
                        Showing <strong>{elekhaPage * elekhaRowsPerPage + 1}</strong> to <strong>{Math.min((elekhaPage + 1) * elekhaRowsPerPage, filteredElekhaData.length)}</strong> of <strong>{filteredElekhaData.length}</strong> records
                      </div>
                      <select 
                        className="custom-select" 
                        value={elekhaRowsPerPage} 
                        onChange={(e) => {
                          setElekhaRowsPerPage(parseInt(e.target.value, 10));
                          setElekhaPage(0);
                        }}
                        style={{ padding: '0.4rem 2rem 0.4rem 1rem', minWidth: '80px' }}
                      >
                        <option value="25">25 rows</option>
                        <option value="50">50 rows</option>
                        <option value="100">100 rows</option>
                      </select>

                      <div className="pagination-buttons" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                          className="pg-btn" 
                          disabled={elekhaPage === 0} 
                          onClick={() => setElekhaPage(prev => Math.max(prev - 1, 0))}
                        >
                          <ChevronLeft size={16} /> Prev
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page:</span>
                          <input 
                            type="text" 
                            className="custom-input" 
                            value={elekhaPageInput} 
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, ''); // only digits
                              setElekhaPageInput(val);
                              if (val) {
                                const pNum = parseInt(val, 10) - 1;
                                const maxPage = Math.ceil(filteredElekhaData.length / elekhaRowsPerPage) - 1;
                                if (pNum >= 0 && pNum <= maxPage) {
                                  setElekhaPage(pNum);
                                }
                              }
                            }}
                            style={{
                              width: '45px',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--bg-input)',
                              color: 'var(--text-primary)',
                              height: '30px',
                              textAlign: 'center',
                              fontSize: '0.85rem'
                            }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {Math.ceil(filteredElekhaData.length / elekhaRowsPerPage)}</span>
                        </div>

                        <button 
                          className="pg-btn" 
                          disabled={(elekhaPage + 1) * elekhaRowsPerPage >= filteredElekhaData.length} 
                          onClick={() => setElekhaPage(prev => prev + 1)}
                        >
                          Next <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            </>
          )}

        {/* Tab 3: Rebuilt Vertical Revenue Report View (Horizontal Matrix Comparison Grid) */}
        {activeTab === 'revenue' && (
          <>
            {/* Filter Headers section */}
            <div className="card-title-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem' }}>Vertical Revenue Report Matrix</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    Horizontal comparative revenue flow report grouped by Category and HOA across HO, Division, or Region columns
                  </p>
                </div>
              </div>

              {/* Selector filters row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Type</label>
                  <select 
                    className="custom-select" 
                    value={revenueType} 
                    onChange={(e) => setRevenueType(e.target.value)}
                    style={{ minWidth: '100px' }}
                  >
                    <option value="Month">Month</option>
                    <option value="Day">Day</option>
                  </select>
                </div>

                {revenueType === 'Month' ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Period 1 From</label>
                      <select className="custom-select" value={p1From} onChange={(e) => setP1From(e.target.value)}>
                        {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>To</label>
                      <select className="custom-select" value={p1To} onChange={(e) => setP1To(e.target.value)}>
                        {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Period 2 From</label>
                      <select className="custom-select" value={p2From} onChange={(e) => setP2From(e.target.value)}>
                        {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>To</label>
                      <select className="custom-select" value={p2To} onChange={(e) => setP2To(e.target.value)}>
                        {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Day date range selectors */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Period 1 From</label>
                      <input type="date" className="mini-input" value={p1FromDate} onChange={(e) => setP1FromDate(e.target.value)} style={{ padding: '0.55rem', height: '37px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>To</label>
                      <input type="date" className="mini-input" value={p1ToDate} onChange={(e) => setP1ToDate(e.target.value)} style={{ padding: '0.55rem', height: '37px' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Period 2 From</label>
                      <input type="date" className="mini-input" value={p2FromDate} onChange={(e) => setP2FromDate(e.target.value)} style={{ padding: '0.55rem', height: '37px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>To</label>
                      <input type="date" className="mini-input" value={p2ToDate} onChange={(e) => setP2ToDate(e.target.value)} style={{ padding: '0.55rem', height: '37px' }} />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Report Type</label>
                  <select 
                    className="custom-select" 
                    value={reportType} 
                    onChange={(e) => setReportType(e.target.value)}
                    style={{ minWidth: '100px' }}
                  >
                    <option value="Detail">Detail</option>
                    <option value="Summary">Summary</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Group by</label>
                  <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: '37px' }}>
                    <button 
                      onClick={() => setGroupBy('ho')}
                      style={{ 
                        border: 'none', 
                        padding: '0 0.75rem', 
                        fontSize: '0.8rem', 
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: groupBy === 'ho' ? 'var(--color-primary)' : 'var(--bg-input)',
                        color: groupBy === 'ho' ? 'white' : 'var(--text-secondary)'
                      }}
                    >
                      HO-wise
                    </button>
                    <button 
                      onClick={() => setGroupBy('division')}
                      style={{ 
                        border: 'none', 
                        padding: '0 0.75rem', 
                        fontSize: '0.8rem', 
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: groupBy === 'division' ? 'var(--color-primary)' : 'var(--bg-input)',
                        color: groupBy === 'division' ? 'white' : 'var(--text-secondary)'
                      }}
                    >
                      Division-wise
                    </button>
                    <button 
                      onClick={() => setGroupBy('region')}
                      style={{ 
                        border: 'none', 
                        padding: '0 0.75rem', 
                        fontSize: '0.8rem', 
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: groupBy === 'region' ? 'var(--color-primary)' : 'var(--bg-input)',
                        color: groupBy === 'region' ? 'white' : 'var(--text-secondary)'
                      }}
                    >
                      Region-wise
                    </button>
                  </div>
                </div>

                <button 
                  className="pg-btn" 
                  onClick={handleGenerate} 
                  style={{ 
                    alignSelf: 'flex-end', 
                    height: '37px', 
                    padding: '0 1.5rem', 
                    backgroundColor: 'var(--color-primary)', 
                    color: 'white',
                    fontWeight: 'bold',
                    border: 'none'
                  }}
                >
                  Generate
                </button>
              </div>
            </div>

            {/* Generated Comparative Table section */}
            {!verticalRevenueReportData ? (
              <div className="empty-state" style={{ padding: '3rem 0' }}>
                <AlertCircle />
                <p>Click the <strong>Generate</strong> button to render the vertical revenue matrix comparison.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.25rem 0' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Displaying Period comparison: <strong>Period 1</strong> vs <strong>Period 2</strong> (Grouped by {generatedConfig.groupBy === 'ho' ? 'HO' : generatedConfig.groupBy === 'division' ? 'Division' : 'Region'})
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th rowSpan={2} style={{ verticalAlign: 'middle', borderBottomWidth: '2px' }}>
                          <ColumnHeaderFilter 
                            title="Category" 
                            columnName="Category" 
                            allValues={hoaList.map(d => d.Category)} 
                            selectedFilters={revenueColumnFilters['Category']} 
                            onChange={(col, val) => setRevenueColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th rowSpan={2} style={{ verticalAlign: 'middle', borderBottomWidth: '2px' }}>
                          <ColumnHeaderFilter 
                            title="HOA" 
                            columnName="HOA" 
                            allValues={hoaList.map(d => String(d['HOA Code'] || '').trim())} 
                            selectedFilters={revenueColumnFilters['HOA']} 
                            onChange={(col, val) => setRevenueColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th rowSpan={2} style={{ verticalAlign: 'middle', borderBottomWidth: '2px' }}>
                          <ColumnHeaderFilter 
                            title="Description" 
                            columnName="Description" 
                            allValues={hoaList.map(d => String(d.Description || '').trim())} 
                            selectedFilters={revenueColumnFilters['Description']} 
                            onChange={(col, val) => setRevenueColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        
                        {/* Level 1: Office Column groups */}
                        {verticalRevenueReportData.uniqueUnits.map((u, uIdx) => (
                          <th key={uIdx} colSpan={2} className="text-center" style={{ borderBottom: '1px solid var(--border-color)', borderLeft: '1px solid var(--border-color)' }}>
                            <ColumnHeaderFilter 
                              title={u.label} 
                              columnName="Unit" 
                              allValues={verticalRevenueReportData.allRawUnits} 
                              selectedFilters={revenueColumnFilters['Unit']} 
                              onChange={(col, val) => setRevenueColumnFilters(prev => ({ ...prev, [col]: val }))} 
                            />
                          </th>
                        ))}

                        {/* Gross Total Column Header */}
                        <th colSpan={2} className="text-center" style={{ borderBottom: '1px solid var(--border-color)', borderLeft: '2px solid var(--border-color)', fontWeight: 'bold' }}>
                          Gross Total
                        </th>
                      </tr>
                      <tr>
                        {/* Level 2: Period sub-columns */}
                        {verticalRevenueReportData.uniqueUnits.map((u, uIdx) => (
                          <React.Fragment key={uIdx}>
                            <th className="text-center" style={{ fontSize: '0.75rem', padding: '0.5rem', borderLeft: '1px solid var(--border-color)', borderBottomWidth: '2px' }}>
                              {getPeriodLabel(1)}
                            </th>
                            <th className="text-center" style={{ fontSize: '0.75rem', padding: '0.5rem', borderBottomWidth: '2px' }}>
                              {getPeriodLabel(2)}
                            </th>
                          </React.Fragment>
                        ))}
                        {/* Gross Total Period sub-headers */}
                        <th className="text-center" style={{ fontSize: '0.75rem', padding: '0.5rem', borderLeft: '2px solid var(--border-color)', borderBottomWidth: '2px', fontWeight: 'bold' }}>
                          {getPeriodLabel(1)}
                        </th>
                        <th className="text-center" style={{ fontSize: '0.75rem', padding: '0.5rem', borderBottomWidth: '2px', fontWeight: 'bold' }}>
                          {getPeriodLabel(2)}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {verticalRevenueReportData.categoriesOrder.map(cat => {
                        const hoas = verticalRevenueReportData.groupedHoas[cat] || [];
                        const clsRow = `rev-row-${cat.toLowerCase()}`;
                        const clsTotal = `rev-row-${cat.toLowerCase()}-total`;

                        return (
                          <React.Fragment key={cat}>
                            {/* Render detail HOA rows under this category (if detail is selected) */}
                            {generatedConfig.reportType === 'Detail' && hoas.map(hoa => {
                              const hoaCode = String(hoa['HOA Code'] || '').trim();
                              return (
                                <tr key={hoaCode} className={clsRow}>
                                  <td style={{ fontWeight: 600 }}>{cat}</td>
                                  <td><code>{hoaCode}</code></td>
                                  <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={hoa.Description}>
                                    {hoa.Description || '–'}
                                  </td>
                                  {verticalRevenueReportData.uniqueUnits.map((g, gIdx) => {
                                    const val1 = verticalRevenueReportData.p1Totals[`${hoaCode}_${g.name}`] || 0;
                                    const val2 = verticalRevenueReportData.p2Totals[`${hoaCode}_${g.name}`] || 0;
                                    return (
                                      <React.Fragment key={gIdx}>
                                        <td className="text-right" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>{formatTableValue(val1)}</td>
                                        <td className="text-right">{formatTableValue(val2)}</td>
                                      </React.Fragment>
                                    );
                                  })}
                                  {/* Gross Total cells per row */}
                                  <td className="text-right" style={{ borderLeft: '2px solid var(--border-color)', fontWeight: 600 }}>
                                    {formatTableValue(verticalRevenueReportData.rowP1Gross[hoaCode] || 0)}
                                  </td>
                                  <td className="text-right" style={{ fontWeight: 600 }}>
                                    {formatTableValue(verticalRevenueReportData.rowP2Gross[hoaCode] || 0)}
                                  </td>
                                </tr>
                              );
                            })}

                            {/* Subtotal row for Category */}
                            <tr className={clsTotal}>
                              <td style={{ textTransform: 'uppercase' }}>{cat} Total</td>
                              <td></td>
                              <td></td>
                              {verticalRevenueReportData.uniqueUnits.map((g, gIdx) => {
                                const catVal1 = verticalRevenueReportData.p1CatTotals[`${cat}_${g.name}`] || 0;
                                const catVal2 = verticalRevenueReportData.p2CatTotals[`${cat}_${g.name}`] || 0;
                                return (
                                  <React.Fragment key={gIdx}>
                                    <td className="text-right" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>{formatTableValue(catVal1)}</td>
                                    <td className="text-right">{formatTableValue(catVal2)}</td>
                                  </React.Fragment>
                                );
                              })}
                              {/* Category Gross Total cells */}
                              <td className="text-right" style={{ borderLeft: '2px solid var(--border-color)', fontWeight: 'bold' }}>
                                {formatTableValue(verticalRevenueReportData.catP1Gross[cat] || 0)}
                              </td>
                              <td className="text-right" style={{ fontWeight: 'bold' }}>
                                {formatTableValue(verticalRevenueReportData.catP2Gross[cat] || 0)}
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}

                      {/* Bottom Gross Total Row */}
                      <tr className="rev-row-grand-total">
                        <td style={{ fontWeight: 800 }}>GROSS TOTAL</td>
                        <td></td>
                        <td></td>
                        {verticalRevenueReportData.uniqueUnits.map((g, gIdx) => {
                          const uVal1 = verticalRevenueReportData.unitP1Gross[g.name] || 0;
                          const uVal2 = verticalRevenueReportData.unitP2Gross[g.name] || 0;
                          return (
                            <React.Fragment key={gIdx}>
                              <td className="text-right" style={{ borderLeft: '1px solid var(--border-color)' }}>{formatTableValue(uVal1)}</td>
                              <td className="text-right">{formatTableValue(uVal2)}</td>
                            </React.Fragment>
                          );
                        })}
                        {/* Grand Total cells */}
                        <td className="text-right" style={{ borderLeft: '2px solid var(--border-color)' }}>
                          {formatTableValue(verticalRevenueReportData.grandP1Gross)}
                        </td>
                        <td className="text-right">
                          {formatTableValue(verticalRevenueReportData.grandP2Gross)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bottom Bar Controls (Export options left, Stats right) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  {/* Bottom Left Exports */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                      onClick={handleExportCSV} 
                      className="pg-btn" 
                      style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', fontWeight: 600 }}
                    >
                      <Download size={14} /> Export to CSV
                    </button>
                    <button 
                      onClick={handleExportExcel} 
                      className="pg-btn" 
                      style={{ backgroundColor: '#22c55e', color: 'white', border: 'none', fontWeight: 600 }}
                    >
                      <Download size={14} /> Export to Excel
                    </button>
                  </div>

                  {/* Bottom Right Stats */}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.5px', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                    ROWS: <strong>{datasetStats.rows.toLocaleString()}</strong> | HOAs: <strong>{datasetStats.hoas}</strong> | HOs: <strong>{datasetStats.hos}</strong> | Divisions: <strong>{datasetStats.divisions}</strong> | Regions: <strong>{datasetStats.regions}</strong>
                  </div>
                </div>
              </>
            )}
          </>
        )}

      </main>
      
      {/* 6. Footer */}
      <footer style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid var(--border-color)' }}>
        CEBAR Database Dashboard • Connects to Client CSV Datasets (Offline Mode Active)
      </footer>
    </div>
  );
}
