import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
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
  Download,
  User,
  Lock,
  UserX,
  Plus,
  Trash2,
  Edit,
  LogOut,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zhrztgxvpteituddnuqu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpocnp0Z3h2cHRlaXR1ZGRudXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMDAzNDksImV4cCI6MjA5Nzc3NjM0OX0.RZM7IQpgr3vjI4wnmPNsph-0wI6GJb9-iLngwBlU4XI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
                const displayVal = columnName === 'Category' ? translateCategoryVal(val) : val;
                return (
                  <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={(e) => handleCheckboxChange(val, e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={displayVal}>{displayVal}</span>
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

// Category translation utility
const translateCategoryVal = (val) => {
  const categoryDisplayNames = {
    'CCS': 'CCS',
    'FS': 'FS',
    'IRGB': 'IRGB',
    'MO': 'MO',
    'Parcel': 'Parcel',
    'PLI': 'PLI(4% of total)',
    'PLI Direct Cost': 'PLI-Direct Cost',
    'RPLI': 'RPLI(4% of total)',
    'RPLI Direct Cost': 'RPLI-Direct Cost'
  };
  return categoryDisplayNames[val] || val;
};

// SVG-based responsive Chart Components
function SVGPieChart({ data, colors }) {
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  if (total === 0) return <div style={{ color: 'var(--text-muted)', padding: '20px', fontSize: '0.85rem' }}>No data to display</div>;

  let accumulatedAngle = 0;
  const radius = 80;
  const cx = 90;
  const cy = 90;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        {data.map((item, idx) => {
          if (!item.value || item.value <= 0) return null;
          const percentage = item.value / total;
          const angle = percentage * 360;
          
          const x1 = cx + radius * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
          const y1 = cy + radius * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
          
          accumulatedAngle += angle;
          
          const x2 = cx + radius * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
          const y2 = cy + radius * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          const pathData = `
            M ${cx} ${cy}
            L ${x1} ${y1}
            A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
            Z
          `;
          
          const color = colors[idx % colors.length];
          return (
            <path 
              key={idx}
              d={pathData} 
              fill={color} 
              stroke="var(--bg-card)" 
              strokeWidth="1.5"
              style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
            >
              <title>{item.label}: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.value)} ({(percentage * 100).toFixed(1)}%)</title>
            </path>
          );
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignSelf: 'center', textAlign: 'left', maxWidth: '280px', fontSize: '0.8rem' }}>
        {data.map((item, idx) => {
          if (!item.value || item.value <= 0) return null;
          const color = colors[idx % colors.length];
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: color, borderRadius: '2px', flexShrink: 0 }}></span>
              <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.label}>
                {item.label}: <strong>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.value)}</strong> ({(item.value / total * 100).toFixed(1)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SVGBarChart({ data, colors }) {
  const maxVal = Math.max(...data.map(item => Math.max(item.value || 0, item.value2 || 0)), 1);
  const chartHeight = 220;
  const chartWidth = 550;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const graphWidth = chartWidth - paddingLeft - paddingRight;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '10px' }}>
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ maxWidth: '650px' }}>
        {/* Y Axis Gridlines and Labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + graphHeight * (1 - ratio);
          const gridVal = new Intl.NumberFormat('en-IN', { notation: 'compact', compactDisplay: 'short' }).format(maxVal * ratio);
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3" />
              <text x={paddingLeft - 10} y={y + 3} fill="var(--text-muted)" fontSize="9" textAnchor="end">{gridVal}</text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, idx) => {
          const x = paddingLeft + (graphWidth / data.length) * idx;
          const barWidth = (graphWidth / data.length) * 0.65;
          const barSpacing = (graphWidth / data.length) * 0.175;
          
          const bar1Height = ((item.value || 0) / maxVal) * graphHeight;
          const bar1Y = paddingTop + graphHeight - bar1Height;
          const color1 = colors[0 % colors.length];

          const hasTwoBars = item.value2 !== undefined;
          const singleBarWidth = hasTwoBars ? barWidth / 2 - 2 : barWidth;

          return (
            <g key={idx}>
              {/* Bar 1 */}
              <rect 
                x={x + barSpacing} 
                y={bar1Y} 
                width={singleBarWidth} 
                height={bar1Height} 
                fill={color1} 
                rx="3"
                style={{ transition: 'all 0.3s', cursor: 'pointer' }}
              >
                <title>{item.label}: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.value)}</title>
              </rect>

              {/* Bar 2 */}
              {hasTwoBars && (
                <rect 
                  x={x + barSpacing + singleBarWidth + 4} 
                  y={paddingTop + graphHeight - ((item.value2 || 0) / maxVal) * graphHeight} 
                  width={singleBarWidth} 
                  height={((item.value2 || 0) / maxVal) * graphHeight} 
                  fill={colors[1 % colors.length]} 
                  rx="3"
                  style={{ transition: 'all 0.3s', cursor: 'pointer' }}
                >
                  <title>{item.label} (Allotted/P2): {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.value2)}</title>
                </rect>
              )}

              {/* Label */}
              <text 
                x={x + barSpacing + barWidth / 2} 
                y={chartHeight - paddingBottom + 16} 
                fill="var(--text-secondary)" 
                fontSize="9" 
                textAnchor="middle"
              >
                {item.label.length > 10 ? item.label.substring(0, 9) + '..' : item.label}
              </text>
            </g>
          );
        })}
        {/* X Axis line */}
        <line x1={paddingLeft} y1={chartHeight - paddingBottom} x2={chartWidth - paddingRight} y2={chartHeight - paddingBottom} stroke="var(--border-color)" />
      </svg>
    </div>
  );
}

function SVGLineChart({ data, colors }) {
  const maxVal = Math.max(...data.map(item => Math.max(item.value || 0, item.value2 || 0)), 1);
  const chartHeight = 220;
  const chartWidth = 550;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const graphWidth = chartWidth - paddingLeft - paddingRight;

  const points1 = data.map((item, idx) => {
    const x = paddingLeft + (graphWidth / (data.length - 1 || 1)) * idx;
    const y = paddingTop + graphHeight - ((item.value || 0) / maxVal) * graphHeight;
    return `${x},${y}`;
  }).join(' ');

  const pathD1 = points1 ? `M ${points1}` : '';

  const hasLine2 = data.some(item => item.value2 !== undefined);
  const points2 = hasLine2 ? data.map((item, idx) => {
    const x = paddingLeft + (graphWidth / (data.length - 1 || 1)) * idx;
    const y = paddingTop + graphHeight - ((item.value2 || 0) / maxVal) * graphHeight;
    return `${x},${y}`;
  }).join(' ') : '';
  const pathD2 = points2 ? `M ${points2}` : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '10px' }}>
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ maxWidth: '650px' }}>
        {/* Y Gridlines and Labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + graphHeight * (1 - ratio);
          const gridVal = new Intl.NumberFormat('en-IN', { notation: 'compact', compactDisplay: 'short' }).format(maxVal * ratio);
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3" />
              <text x={paddingLeft - 10} y={y + 3} fill="var(--text-muted)" fontSize="9" textAnchor="end">{gridVal}</text>
            </g>
          );
        })}

        {/* Path Line 1 */}
        {pathD1 && (
          <path 
            d={pathD1} 
            fill="none" 
            stroke={colors[0 % colors.length]} 
            strokeWidth="3" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Path Line 2 */}
        {hasLine2 && pathD2 && (
          <path 
            d={pathD2} 
            fill="none" 
            stroke={colors[1 % colors.length]} 
            strokeWidth="3" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Dots & Labels */}
        {data.map((item, idx) => {
          const x = paddingLeft + (graphWidth / (data.length - 1 || 1)) * idx;
          const y1 = paddingTop + graphHeight - ((item.value || 0) / maxVal) * graphHeight;
          const y2 = hasLine2 ? paddingTop + graphHeight - ((item.value2 || 0) / maxVal) * graphHeight : 0;

          return (
            <g key={idx}>
              {/* Dot 1 */}
              <circle cx={x} cy={y1} r="4" fill={colors[0 % colors.length]} stroke="var(--bg-card)" strokeWidth="1.5" style={{ cursor: 'pointer' }}>
                <title>{item.label}: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.value)}</title>
              </circle>

              {/* Dot 2 */}
              {hasLine2 && (
                <circle cx={x} cy={y2} r="4" fill={colors[1 % colors.length]} stroke="var(--bg-card)" strokeWidth="1.5" style={{ cursor: 'pointer' }}>
                  <title>{item.label} (Allotted/P2): {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.value2)}</title>
                </circle>
              )}

              {/* X Label */}
              <text x={x} y={chartHeight - paddingBottom + 16} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">
                {item.label.length > 10 ? item.label.substring(0, 9) + '..' : item.label}
              </text>
            </g>
          );
        })}

        {/* X Axis line */}
        <line x1={paddingLeft} y1={chartHeight - paddingBottom} x2={chartWidth - paddingRight} y2={chartHeight - paddingBottom} stroke="var(--border-color)" />
      </svg>
    </div>
  );
}


const BUDGET_COLUMNS = [
  'Year',
  'Office ID',
  'Office Name',
  'HOA',
  'HOA Description',
  'Allocation Type',
  'Allotted Budget (A)',
  'Reallotted Budget (B)',
  'Distributed Budget (C)',
  'Transferred Budget (D)',
  'Re-Appropritaion Receipt (E)',
  'Re-Appropritaion Transferred (F)',
  'Reserved Budget (G)',
  'Consumed Budget (H)',
  'Consumable Budget (I)',
  'Liability (J)',
  'Approver Remarks'
];

const ELEKHA_COLUMNS = [
  'Month',
  'DDO Code',
  'HO',
  'Division',
  'Region',
  'TE Number',
  'Txn Date',
  'HOA',
  'Description',
  'Receipt (Rs.)',
  'Payment (Rs.)',
  'Remark'
];

export default function App() {
  // Global / Navigation State
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('cebar_tab');
    return saved || 'budget';
  });

  useEffect(() => {
    sessionStorage.setItem('cebar_tab', activeTab);
  }, [activeTab]);
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('cebar_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('cebar_user');
  });
  const [loginUserId, setLoginUserId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showUserTooltip, setShowUserTooltip] = useState(false);

  // Force Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // User Management State (SA only)
  const [usersList, setUsersList] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [manageUserId, setManageUserId] = useState('');
  const [manageName, setManageName] = useState('');
  const [manageMobileNo, setManageMobileNo] = useState('');
  const [manageOffice, setManageOffice] = useState('');
  const [manageType, setManageType] = useState('View');
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userManagementError, setUserManagementError] = useState('');

  // Database Synchronization State (SA only)
  const [syncTable, setSyncTable] = useState('Budget'); // 'Budget' or 'e-Lekha'
  const [syncFile, setSyncFile] = useState(null);
  const [syncHeaders, setSyncHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [syncMode, setSyncMode] = useState('append'); // 'append' or 'replace'
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');
  const [syncError, setSyncError] = useState('');
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

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

  // Analysis Mode State
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState('all'); // 'all', 'over', 'under', 'no_allotment'

  // Chart Mode State for Budget
  const [isChartMode, setIsChartMode] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState('pie'); // 'pie', 'bar', 'line'
  const [selectedChartGroupBy, setSelectedChartGroupBy] = useState('region'); // 'region', 'status', 'hoa'
  const [selectedChartMetric, setSelectedChartMetric] = useState('consumed'); // 'consumed', 'alloted', 'elekha'

  // Chart Mode State for Vertical Revenue
  const [isRevenueChartMode, setIsRevenueChartMode] = useState(false);
  const [selectedRevenueChartType, setSelectedRevenueChartType] = useState('bar'); // 'bar', 'line', 'pie'

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

  // Load and Parse from Supabase Database
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        // Helper to fetch all rows from a table using parallel chunked pagination
        async function fetchTableRows(tableName) {
          const limit = 1000;
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
            
          if (countError) throw countError;
          const totalRows = count || 0;
          
          const pages = Math.ceil(totalRows / limit);
          const promises = [];
          
          for (let i = 0; i < pages; i++) {
            const from = i * limit;
            const to = from + limit - 1;
            promises.push(
              supabase
                .from(tableName)
                .select('*')
                .range(from, to)
                .then(({ data, error }) => {
                  if (error) throw error;
                  return data;
                })
            );
          }
          
          const results = [];
          const batchSize = 15;
          for (let i = 0; i < promises.length; i += batchSize) {
            const batch = promises.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch);
            results.push(...batchResults.flat());
          }
          return results;
        }

        // Helper to convert DB objects/values to trimmed strings to preserve codebase compatibility
        function convertDbRowsToStrings(rows) {
          return rows.map(row => {
            const obj = {};
            for (const [key, value] of Object.entries(row)) {
              if (value === null || value === undefined) {
                obj[key] = '';
              } else {
                obj[key] = String(value).trim();
              }
            }
            return obj;
          });
        }
        
        // Fetch all tables from Supabase in parallel
        const [rawHoaList, rawMapping, rawDdoMapping, rawElekha, rawBudget] = await Promise.all([
          fetchTableRows('Revenue_hoa'),
          fetchTableRows('office_mapping'),
          fetchTableRows('Revenue DDO Mapping'),
          fetchTableRows('e-Lekha'),
          fetchTableRows('Budget')
        ]);

        const hoas = convertDbRowsToStrings(rawHoaList);
        const mapping = convertDbRowsToStrings(rawMapping);
        const ddoMap = convertDbRowsToStrings(rawDdoMapping);
        const elekhaRaw = convertDbRowsToStrings(rawElekha);
        const budgetRaw = convertDbRowsToStrings(rawBudget);

        // Build mapping maps
        const officeIdToNameMap = {};
        const officeIdToRegionMap = {};
        mapping.forEach(m => {
          const id = m['Office ID'];
          const name = m['Office Name'];
          const reg = m['Region'];
          if (id) {
            officeIdToNameMap[id] = name;
            officeIdToRegionMap[id] = reg;
          }
        });

        // Build description-to-HOA map from Revenue_hoa (do not overwrite with generic e-Lekha codes!)
        const descToHoaMap = {};
        hoas.forEach(item => {
          const code = item['HOA Code'];
          const desc = item['Description']?.toLowerCase();
          if (code && desc) {
            descToHoaMap[desc] = code;
          }
        });

        // Map e-Lekha generic HOA codes to detailed HOA Codes using Description
        const elekhaToRevenueHoaMap = {
          '48 speed post doc_ddd': '120100101020100',
          'atm annual maintenance charge account': '120100200260000',
          'aadhaar new aadhar enrollment': '120100200230100',
          'aadhaar other biometric/demography updation': '120100200220100',
          'commission for popsk transactions': '120100200190000',
          'commission on indian postal orders': '120100102030000',
          'commission on inland money orders': '120100102100000',
          'commission on railway prss': '120100108000000',
          'commission on revenue/non postal stamps': '120100200120000',
          'custom duty on outward international mails': '120101000000000',
          'e-payment service charges- education': '120100800040100',
          'e-payment service charges- finance': '120100800040100',
          'fees for communication of marks to candidates': '120100800180100',
          'fees from contractors': '120100800340000',
          'media post': '120100800110000',
          'neft/rtgs charges from customer': '120100200250000',
          'posb_cheque book issuance fee': '120100200030000',
          'prc -international express airmail service': '120100101250100',
          'prc -international tracked packet service': '120100101280100',
          'prc e-post services.': '120100101120100',
          'prc- india post parcel-retail': '120100101220100',
          'prc- international air parcel': '120100101260100',
          'prc- joint parcel product(railways)': '120100101220100',
          'prc- magazine post': '120100101330000',
          'prc-business post': '120100101030100',
          'prc-india post parcel -contractual': '120100101220100',
          'prc-international letters (registered)': '120100101270100',
          'prc-registered letter/article': '120100101310100',
          'prc-remotely managed franking machine': '120100101230100',
          'prc-speed post parcel': '120100101290100',
          'post boxes & bags': '120100200050000',
          'postage realized in cash for ordinary services': '120100101010100',
          'rent & taxes': '120100200060100',
          'retail post': '120100800010100',
          'revenue - logistics post (surface)': '120100800130100',
          'revenue on account of pmjjby': '120100800570100',
          'sale of philatelystamps through bureaux/pos/exhibi': '120100101160300',
          'sale of postage stamps': '120100101100100',
          'sale of publications & blank form etc.': '120100800190100',
          'sale of service stamps': '120100101110100',
          'sale of special stamps & other materials': '120100800370100',
          'sale of waste paper dead stock etc': '120100800340000',
          'direct post': '120100101060000',
          'bill mail service': '120100101090000',
          'deduct refunds': '120100800440000',
          'examination fee etc.': '120100800180100',
          'joint parcel product(railways)': '120100101220100',
          'logistics post': '120100800130100',
          'registered parcel': '120100101300100',
          'speed post': '120100101020100',
          'speed post parcel': '120100101290100',
          'business post': '120100101030100',
          'magazine post': '120100101330000'
        };

        const elekha = elekhaRaw.map(row => {
          const originalHoa = String(row.HOA || '').trim();
          let mappedHoa = originalHoa;
          const descClean = String(row.Description || '').trim().toLowerCase();
          
          // Custom rules for PLI, RPLI, PLI Direct Cost, RPLI Direct Cost
          if (descClean.includes('rpli') && (descClean.includes('direct cost') || descClean.includes('branch') || descClean.includes('allowance') || descClean.includes('salary') || descClean.includes('salaries') || descClean.includes('office expense') || descClean.includes('medical') || descClean.includes('dte') || descClean.includes('ltc'))) {
            mappedHoa = '3201031010901';
          } else if (descClean.includes('pli') && !descClean.includes('rpli') && (descClean.includes('direct cost') || descClean.includes('branch') || descClean.includes('allowance') || descClean.includes('salary') || descClean.includes('salaries') || descClean.includes('office expense') || descClean.includes('medical') || descClean.includes('dte') || descClean.includes('ltc'))) {
            mappedHoa = '3201031010801';
          } else if (descClean.includes('rpli') && (descClean.includes('wla') || descClean.includes('whole life'))) {
            mappedHoa = '80140210201';
          } else if (descClean.includes('pli') && !descClean.includes('rpli') && (descClean.includes('wla') || descClean.includes('whole life'))) {
            mappedHoa = '80140110201';
          } else if (descClean.includes('rpli') && (descClean.includes('cwla') || descClean.includes('convertible wla') || descClean.includes('convertible whole life'))) {
            mappedHoa = '80140210301';
          } else if (descClean.includes('pli') && !descClean.includes('rpli') && (descClean.includes('cwla') || descClean.includes('convertible wla') || descClean.includes('convertible whole life'))) {
            mappedHoa = '80140110301';
          } else if (descClean.includes('rpli') && (descClean.includes('aea') || descClean.includes('anticipated ea') || descClean.includes('anticipated endowment'))) {
            mappedHoa = '80140210501';
          } else if (descClean.includes('pli') && !descClean.includes('rpli') && (descClean.includes('aea') || descClean.includes('anticipated ea') || descClean.includes('anticipated endowment'))) {
            mappedHoa = '80140110501';
          } else if (descClean.includes('rpli') && (descClean.includes('cps') || descClean.includes('children'))) {
            mappedHoa = '80140210701';
          } else if (descClean.includes('pli') && !descClean.includes('rpli') && (descClean.includes('cps') || descClean.includes('children'))) {
            mappedHoa = '80140110701';
          } else if (descClean.includes('pli') && descClean.includes('jea')) {
            mappedHoa = '80140110601';
          } else if (descClean.includes('rpli') && (descClean.includes('gy') || descClean.includes('gp') || descClean.includes('gram priya'))) {
            mappedHoa = '80140210601';
          } else if (descClean.includes('rpli') && (descClean.includes('ea') || descClean.includes('endowment')) && !descClean.includes('aea') && !descClean.includes('anticipated') && !descClean.includes('jea') && !descClean.includes('joint')) {
            mappedHoa = '80140210401';
          } else if (descClean.includes('pli') && !descClean.includes('rpli') && (descClean.includes('ea') || descClean.includes('endowment')) && !descClean.includes('aea') && !descClean.includes('anticipated') && !descClean.includes('jea') && !descClean.includes('joint')) {
            mappedHoa = '80140110401';
          }
          
          return {
            ...row,
            HOA: originalHoa,
            MappedHOA: mappedHoa
          };
        });

        // Process Budget data with standard naming & HOA resolution
        const budget = budgetRaw.map(row => {
          const officeId = row['Office ID'];
          const officeName = officeIdToNameMap[officeId] || row['Office Name'] || '';
          
          let region = officeIdToRegionMap[officeId] || row['Region'] || '';
          if (!region && officeName.toLowerCase().includes('navsari')) {
            region = 'SGR';
          }

          let hoa = row['HOA'];
          if (hoa.includes('E') || hoa.includes('e')) {
            const descLower = row['HOA Description']?.toLowerCase();
            if (descToHoaMap[descLower]) {
              hoa = descToHoaMap[descLower];
            }
          }

          return {
            'Office ID': officeId,
            'Name of Unit (HO/Division)': officeName,
            'Region': region,
            'HOA': hoa,
            'Description': row['HOA Description'] || '',
            'APT Alloted': String(
              parseNumber(row['Allotted Budget (A)']) +
              parseNumber(row['Reallotted Budget (B)']) -
              parseNumber(row['Distributed Budget (C)']) -
              parseNumber(row['Transferred Budget (D)']) +
              parseNumber(row['Re-Appropritaion Receipt (E)']) -
              parseNumber(row['Re-Appropritaion Transferred (F)']) +
              parseNumber(row['Reserved Budget (G)'])
            ),
            'APT Consumed': row['Consumed Budget (H)'] || '0'
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
          setSelectedMonth('All'); // Show all data by default
          setElekhaColumnFilters({}); // No initial month filter (shows all data)
          
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
        console.error("Error loading Supabase database data:", err);
        setError("Error: Failed to retrieve data from Supabase database. Make sure your database tables are populated and credentials are set correctly.");
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setUsersList(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && currentUser && currentUser.type === 'SA') {
      fetchUsers();
    }
  }, [isLoggedIn, currentUser, fetchUsers]);

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

  // Helper for cascading filters on e-Lekha
  const getFilteredElekhaDataForColumn = (excludeColumnName) => {
    return elekhaData.filter(row => {
      // 1. Column filters (checks for selected values, excluding the active column)
      for (const [colName, selectedSet] of Object.entries(elekhaColumnFilters)) {
        if (colName === excludeColumnName) continue;
        if (selectedSet && selectedSet.size > 0) {
          const val = (row[colName] === undefined || row[colName] === null) ? '' : String(row[colName]).trim();
          if (!selectedSet.has(val)) {
            return false;
          }
        }
      }

      // 2. Region Filter
      if (filterRegion !== 'All' && row.Region !== filterRegion) {
        return false;
      }
      // 3. DDO Code Filter
      if (filterDdoCode.trim() !== '') {
        if (String(row['DDO Code']).trim() !== filterDdoCode.trim()) return false;
      }
      // 4. HOA Filter
      if (filterHoa.trim() !== '') {
        if (!String(row.HOA).includes(filterHoa.trim())) return false;
      }
      // 5. Global Search
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
  };

  // e-Lekha filtered data (computed locally in React)
  const filteredElekhaData = useMemo(() => {
    return getFilteredElekhaDataForColumn('');
  }, [elekhaData, filterRegion, filterDdoCode, filterHoa, elekhaSearch, elekhaColumnFilters]);

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

  // Helper for cascading filters on Budget
  const getFilteredDataForColumn = (excludeColumnName) => {
    return mappedBudgetData.filter(row => {
      // 1. Region filter
      if (budgetRegion !== 'All' && row.Region !== budgetRegion) {
        return false;
      }

      // 2. Search filter (searches by Name of Unit, Office ID, HOA, Description, Region)
      if (budgetSearch.trim() !== '') {
        const search = budgetSearch.toLowerCase();
        const unitMatch = String(row['Name of Unit (HO/Division)'] || '').toLowerCase().includes(search);
        const idMatch = String(row['Office ID'] || '').toLowerCase().includes(search);
        const hoaMatch = String(row.HOA || '').toLowerCase().includes(search);
        const descMatch = String(row.Description || '').toLowerCase().includes(search);
        const regionMatch = String(row.Region || '').toLowerCase().includes(search);
        if (!unitMatch && !idMatch && !hoaMatch && !descMatch && !regionMatch) return false;
      }

      // 3. Status filter (based on APT Consumed %)
      if (budgetFilterStatus !== 'All') {
        const pct = row['APT Consumed %'];
        if (budgetFilterStatus === 'Over' && pct <= 100) return false;
        if (budgetFilterStatus === 'Warning' && (pct < 85 || pct > 100)) return false;
        if (budgetFilterStatus === 'Safe' && pct >= 85) return false;
      }

      // 4. Custom percentage search
      if (pctSearchVal.trim() !== '') {
        const targetPct = parseFloat(pctSearchVal);
        if (!isNaN(targetPct)) {
          const valToCompare = pctSearchType === 'apt' ? row['APT Consumed %'] : row['e-Lekha Consumed %'];
          if (valToCompare < targetPct) {
            return false;
          }
        }
      }

      // 5. Analysis filter (if active)
      if (isAnalysisMode && selectedAnalysisType !== 'all') {
        const aptAllotedVal = row['APT Alloted'];
        const aptConsumedVal = row['APT Consumed'];
        const elekhaConsumedVal = row['e-lekha Consumed'] || 0;
        
        if (selectedAnalysisType === 'over') {
          if (!(aptAllotedVal > 0 && aptConsumedVal > aptAllotedVal)) return false;
        } else if (selectedAnalysisType === 'under') {
          if (!(aptAllotedVal > 0 && (aptConsumedVal / aptAllotedVal) <= 0.20)) return false;
        } else if (selectedAnalysisType === 'no_allotment') {
          if (!(aptAllotedVal === 0 && elekhaConsumedVal > 0)) return false;
        }
      }

      // 6. Column filters (checks for selected values, excluding active column)
      for (const [colName, selectedSet] of Object.entries(budgetColumnFilters)) {
        if (colName === excludeColumnName) continue;
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

      return true;
    });
  };

  // Budget filtered data (computed locally in React)
  const filteredBudgetData = useMemo(() => {
    return getFilteredDataForColumn('');
  }, [mappedBudgetData, budgetSearch, budgetRegion, budgetFilterStatus, budgetColumnFilters, pctSearchVal, pctSearchType, isAnalysisMode, selectedAnalysisType]);

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

  // Analysis Statistics
  const analysisStats = useMemo(() => {
    let overCount = 0, overAllotted = 0, overConsumed = 0;
    let underCount = 0, underAllotted = 0, underConsumed = 0;
    let noAllotCount = 0, noAllotConsumed = 0;

    mappedBudgetData.forEach(row => {
      if (budgetRegion !== 'All' && row.Region !== budgetRegion) return;
      if (budgetSearch.trim() !== '') {
        const search = budgetSearch.toLowerCase();
        const unitMatch = String(row['Name of Unit (HO/Division)'] || '').toLowerCase().includes(search);
        const idMatch = String(row['Office ID'] || '').toLowerCase().includes(search);
        const hoaMatch = String(row.HOA || '').toLowerCase().includes(search);
        const descMatch = String(row.Description || '').toLowerCase().includes(search);
        const regionMatch = String(row.Region || '').toLowerCase().includes(search);
        if (!unitMatch && !idMatch && !hoaMatch && !descMatch && !regionMatch) return;
      }

      const aptAllotedVal = row['APT Alloted'];
      const aptConsumedVal = row['APT Consumed'];
      const elekhaConsumedVal = row['e-lekha Consumed'] || 0;

      if (aptAllotedVal > 0 && aptConsumedVal > aptAllotedVal) {
        overCount++;
        overAllotted += aptAllotedVal;
        overConsumed += aptConsumedVal;
      }

      if (aptAllotedVal > 0 && (aptConsumedVal / aptAllotedVal) <= 0.20) {
        underCount++;
        underAllotted += aptAllotedVal;
        underConsumed += aptConsumedVal;
      }

      if (aptAllotedVal === 0 && elekhaConsumedVal > 0) {
        noAllotCount++;
        noAllotConsumed += elekhaConsumedVal;
      }
    });

    return {
      overCount, overAllotted, overConsumed,
      underCount, underAllotted, underConsumed,
      noAllotCount, noAllotConsumed
    };
  }, [mappedBudgetData, budgetRegion, budgetSearch]);

  // Aggregated Budget Chart Data
  const budgetChartData = useMemo(() => {
    if (selectedChartGroupBy === 'region') {
      const regionData = {};
      filteredBudgetData.forEach(row => {
        const reg = row.Region || 'Unknown';
        if (!regionData[reg]) regionData[reg] = { allotted: 0, consumed: 0, elekha: 0 };
        regionData[reg].allotted += row['APT Alloted'] || 0;
        regionData[reg].consumed += row['APT Consumed'] || 0;
        regionData[reg].elekha += row['e-lekha Consumed'] || 0;
      });

      return Object.entries(regionData).map(([reg, vals]) => ({
        label: reg,
        value: selectedChartMetric === 'alloted' ? vals.allotted : selectedChartMetric === 'consumed' ? vals.consumed : vals.elekha,
        value2: selectedChartMetric === 'consumed' ? vals.allotted : undefined
      }));
    }

    if (selectedChartGroupBy === 'status') {
      let safe = 0, warning = 0, over = 0;
      filteredBudgetData.forEach(row => {
        const pct = row['APT Consumed %'] || 0;
        if (pct > 100) over++;
        else if (pct >= 85) warning++;
        else safe++;
      });
      return [
        { label: 'Safe (< 85%)', value: safe },
        { label: 'Warning (85%-100%)', value: warning },
        { label: 'Over (> 100%)', value: over }
      ];
    }

    if (selectedChartGroupBy === 'hoa') {
      const hoaData = {};
      filteredBudgetData.forEach(row => {
        const hoa = row.HOA || 'Unknown';
        if (!hoaData[hoa]) hoaData[hoa] = { allotted: 0, consumed: 0, elekha: 0 };
        hoaData[hoa].allotted += row['APT Alloted'] || 0;
        hoaData[hoa].consumed += row['APT Consumed'] || 0;
        hoaData[hoa].elekha += row['e-lekha Consumed'] || 0;
      });

      return Object.entries(hoaData)
        .map(([hoa, vals]) => ({
          label: hoa,
          value: selectedChartMetric === 'alloted' ? vals.allotted : selectedChartMetric === 'consumed' ? vals.consumed : vals.elekha,
          value2: selectedChartMetric === 'consumed' ? vals.allotted : undefined
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    }

    return [];
  }, [filteredBudgetData, selectedChartGroupBy, selectedChartMetric]);

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
      const hoa = String(row.MappedHOA || row.HOA || '').trim();
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

      // Check receipts or payments value
      let valStr = '';
      if (hoa === '3201031010801' || hoa === '3201031010901') {
        valStr = row['Payment (Rs.)'];
      } else {
        valStr = row['Receipt (Rs.)'];
      }

      if (!valStr || valStr === '-') continue;
      let valAmount = parseFloat(valStr.replace(/,/g, '').trim());
      if (isNaN(valAmount)) continue;

      // Apply 4% for PLI and RPLI categories
      if (hoa.startsWith('801401') || hoa.startsWith('801402')) {
        valAmount = valAmount * 0.04;
      }

      const inP1 = isInPeriod(row, 1);
      const inP2 = isInPeriod(row, 2);

      if (inP1) {
        const key = `${hoa}_${groupVal}_1`;
        valMap[key] = (valMap[key] || 0) + valAmount;
      }
      if (inP2) {
        const key = `${hoa}_${groupVal}_2`;
        valMap[key] = (valMap[key] || 0) + valAmount;
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
    const categoriesOrder = ['CCS', 'FS', 'IRGB', 'MO', 'Parcel', 'PLI', 'PLI Direct Cost', 'RPLI', 'RPLI Direct Cost'].filter(cat => {
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
    const { uniqueUnits } = verticalRevenueReportData;
    const result = {};
    
    const catsToCalc = ['CCS', 'FS', 'IRGB', 'MO', 'Parcel', 'PLI', 'PLI Direct Cost', 'RPLI', 'RPLI Direct Cost'];
    catsToCalc.forEach(cat => {
      let p1Sum = 0;
      let p2Sum = 0;
      uniqueUnits.forEach(g => {
        p1Sum += verticalRevenueReportData.p1CatTotals[`${cat}_${g.name}`] || 0;
        p2Sum += verticalRevenueReportData.p2CatTotals[`${cat}_${g.name}`] || 0;
      });
      result[cat] = { p1: p1Sum, p2: p2Sum };
    });

    const kpiResult = {
      CCS: result['CCS'] || { p1: 0, p2: 0 },
      FS: result['FS'] || { p1: 0, p2: 0 },
      IRGB: result['IRGB'] || { p1: 0, p2: 0 },
      MO: result['MO'] || { p1: 0, p2: 0 },
      Parcel: result['Parcel'] || { p1: 0, p2: 0 },
      PLI: {
        p1: (result['PLI']?.p1 || 0) + (result['PLI Direct Cost']?.p1 || 0),
        p2: (result['PLI']?.p2 || 0) + (result['PLI Direct Cost']?.p2 || 0)
      },
      RPLI: {
        p1: (result['RPLI']?.p1 || 0) + (result['RPLI Direct Cost']?.p1 || 0),
        p2: (result['RPLI']?.p2 || 0) + (result['RPLI Direct Cost']?.p2 || 0)
      }
    };
    
    let grossP1 = 0;
    let grossP2 = 0;
    catsToCalc.forEach(cat => {
      grossP1 += result[cat]?.p1 || 0;
      grossP2 += result[cat]?.p2 || 0;
    });
    kpiResult['Gross'] = { p1: grossP1, p2: grossP2 };
    
    return kpiResult;
  }, [verticalRevenueReportData]);

  // Aggregated Vertical Revenue Chart Data (excluding Gross)
  const revenueChartData = useMemo(() => {
    if (!revenueKpis) return [];
    const categories = ['CCS', 'FS', 'IRGB', 'MO', 'Parcel', 'PLI', 'RPLI'];
    return categories.map(cat => ({
      label: translateCategoryVal(cat),
      value: revenueKpis[cat]?.p1 || 0,
      value2: revenueKpis[cat]?.p2 || 0
    }));
  }, [revenueKpis]);

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


  // Authentication Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUserId || !loginPassword) {
      setLoginError('User ID and Password are required.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', loginUserId.trim())
        .single();

      if (error || !data) {
        setLoginError('Invalid User ID or password.');
        return;
      }

      if (data.password !== loginPassword) {
        setLoginError('Invalid User ID or password.');
        return;
      }

      // Successful login
      setCurrentUser(data);
      setIsLoggedIn(true);
      localStorage.setItem('cebar_user', JSON.stringify(data));
      setLoginUserId('');
      setLoginPassword('');
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('An error occurred during login. Please try again.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('cebar_user');
    setActiveTab('budget');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordChangeError('');
    if (!newPassword || !confirmNewPassword) {
      setPasswordChangeError('All fields are required.');
      return;
    }
    if (newPassword === 'Ahd@12345') {
      setPasswordChangeError('New password cannot be the default password.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('Passwords do not match.');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ password: newPassword, needs_password_change: false })
        .eq('user_id', currentUser.user_id);

      if (error) throw error;

      // Update local state
      const updatedUser = { ...currentUser, password: newPassword, needs_password_change: false };
      setCurrentUser(updatedUser);
      localStorage.setItem('cebar_user', JSON.stringify(updatedUser));
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordChangeError('Failed to change password. Please try again.');
    }
  };

  // User Management Handlers (SA only)
  const handleCreateOrUpdateUser = async (e) => {
    e.preventDefault();
    setUserManagementError('');

    if (!manageUserId || !manageName || !manageMobileNo || !manageOffice) {
      setUserManagementError('All fields are required.');
      return;
    }

    if (manageUserId.length !== 8 || !/^\d+$/.test(manageUserId)) {
      setUserManagementError('User ID must be exactly 8 digits.');
      return;
    }

    if (manageMobileNo.length !== 10 || !/^\d+$/.test(manageMobileNo)) {
      setUserManagementError('Mobile Number must be exactly 10 digits.');
      return;
    }

    try {
      if (isEditingUser) {
        // Master user cannot have their type changed from SA
        if (manageUserId === '10032853' && manageType !== 'SA') {
          setUserManagementError('Master user must be of type SA.');
          return;
        }

        const { error } = await supabase
          .from('users')
          .update({
            name: manageName.trim(),
            mobile_no: manageMobileNo.trim(),
            office: manageOffice.trim(),
            type: manageType
          })
          .eq('user_id', manageUserId);

        if (error) throw error;
      } else {
        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('user_id')
          .eq('user_id', manageUserId)
          .single();

        if (existingUser) {
          setUserManagementError('User ID already exists.');
          return;
        }

        const { error } = await supabase
          .from('users')
          .insert([{
            user_id: manageUserId,
            name: manageName.trim(),
            mobile_no: manageMobileNo.trim(),
            office: manageOffice.trim(),
            type: manageType,
            password: 'Ahd@12345',
            needs_password_change: true
          }]);

        if (error) throw error;
      }

      // Refresh list and close modal
      await fetchUsers();
      setShowUserModal(false);
      resetUserManagementForm();
    } catch (err) {
      console.error('User save error:', err);
      setUserManagementError('Failed to save user. Please try again.');
    }
  };

  const resetUserManagementForm = () => {
    setManageUserId('');
    setManageName('');
    setManageMobileNo('');
    setManageOffice('');
    setManageType('View');
    setIsEditingUser(false);
    setUserManagementError('');
  };

  const handleEditClick = (user) => {
    setManageUserId(user.user_id);
    setManageName(user.name);
    setManageMobileNo(user.mobile_no);
    setManageOffice(user.office);
    setManageType(user.type);
    setIsEditingUser(true);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (userId === '10032853') {
      alert('Master user ID cannot be deleted.');
      return;
    }

    const userToDelete = usersList.find(u => u.user_id === userId);
    if (userToDelete?.type === 'SA' && currentUser.user_id !== '10032853') {
      alert('Only the master user 10032853 can delete SA users.');
      return;
    }

    if (!confirm(`Are you sure you want to delete user ${userId}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      await fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleResetUserPassword = async (userId) => {
    if (!confirm(`Are you sure you want to reset password for user ${userId} to default password (Ahd@12345)?`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from('users')
        .update({ password: 'Ahd@12345', needs_password_change: true })
        .eq('user_id', userId);

      if (error) throw error;
      alert(`Password for user ${userId} reset successfully to Ahd@12345.`);
      await fetchUsers();
    } catch (err) {
      console.error('Error resetting password:', err);
      alert('Failed to reset password. Please try again.');
    }
  };

  // Database Synchronization Handlers (SA only)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSyncFile(file);
    setSyncError('');
    setSyncSuccess(false);
    setSyncProgress('Parsing file...');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Parse rows to JSON
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (json.length === 0) {
          throw new Error('The selected file is empty.');
        }

        // Get headers of first sheet
        const headersJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headers = headersJson[0] ? headersJson[0].map(h => String(h).trim()) : [];
        
        if (headers.length === 0) {
          throw new Error('No column headers detected in the file.');
        }

        setSyncHeaders(headers);
        setParsedRows(json);

        // Pre-build default mappings
        const targetCols = syncTable === 'Budget' ? BUDGET_COLUMNS : ELEKHA_COLUMNS;
        const initialMapping = {};
        
        targetCols.forEach(targetCol => {
          const normalizedTarget = targetCol.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          const match = headers.find(h => {
            const normalizedHeader = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            return normalizedHeader === normalizedTarget || 
                   normalizedHeader.includes(normalizedTarget) || 
                   normalizedTarget.includes(normalizedHeader);
          });
          
          initialMapping[targetCol] = match || '';
        });

        setColumnMapping(initialMapping);
        setSyncProgress(`Loaded file successfully. Found ${json.length} rows.`);
      } catch (err) {
        console.error('File parse error:', err);
        setSyncError(`Error reading file: ${err.message || err}`);
        setSyncFile(null);
        setSyncHeaders([]);
        setParsedRows([]);
        setColumnMapping({});
        setSyncProgress('');
      }
    };

    reader.onerror = () => {
      setSyncError('Error reading file.');
      setSyncFile(null);
      setSyncProgress('');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleStartSync = async () => {
    if (!syncFile || parsedRows.length === 0) {
      setSyncError('Please upload a file first.');
      return;
    }

    const activeMapping = { ...columnMapping };
    const targetCols = syncTable === 'Budget' ? BUDGET_COLUMNS : ELEKHA_COLUMNS;
    
    const mappedCount = Object.values(activeMapping).filter(v => !!v).length;
    if (mappedCount === 0) {
      setSyncError('No columns are mapped. Please map at least one column to import data.');
      return;
    }

    if (!confirm(`Are you sure you want to save ${parsedRows.length} rows to the "${syncTable}" table in Supabase in ${syncMode.toUpperCase()} mode?`)) {
      return;
    }

    setIsSyncing(true);
    setSyncError('');
    setSyncSuccess(false);
    setSyncProgress('Preparing synchronization...');

    try {
      const dbTable = syncTable === 'Budget' ? 'Budget' : 'e-Lekha';

      // 1. If REPLACE mode is active, delete all records first
      if (syncMode === 'replace') {
        setSyncProgress('Deleting existing table records in Supabase...');
        const { error: deleteError } = await supabase
          .from(dbTable)
          .delete()
          .neq('id', -1);

        if (deleteError) {
          throw new Error(`Failed to clear table records: ${deleteError.message}`);
        }
      }

      // 2. Format parsed rows into DB schema objects
      setSyncProgress('Formatting records for database insertion...');
      const formattedRows = parsedRows.map(row => {
        const dbRecord = {};
        
        targetCols.forEach(col => {
          const fileColName = activeMapping[col];
          if (fileColName) {
            let val = row[fileColName];
            
            if (syncTable === 'Budget') {
              if (col === 'Year') {
                dbRecord[col] = val ? parseInt(String(val).replace(/\D/g, ''), 10) : null;
              } else if (col === 'HOA') {
                let hoaVal = '';
                if (val !== undefined && val !== null && val !== '') {
                  const num = Number(val);
                  if (!isNaN(num)) {
                    hoaVal = num.toFixed(0);
                  } else {
                    hoaVal = String(val).trim();
                  }
                }
                if (hoaVal && /^\d+$/.test(hoaVal)) {
                  hoaVal = hoaVal.padStart(15, '0');
                }
                dbRecord[col] = hoaVal;
              } else if ([
                'Allotted Budget (A)',
                'Reallotted Budget (B)',
                'Distributed Budget (C)',
                'Transferred Budget (D)',
                'Re-Appropritaion Receipt (E)',
                'Re-Appropritaion Transferred (F)',
                'Reserved Budget (G)',
                'Consumed Budget (H)',
                'Consumable Budget (I)',
                'Liability (J)'
              ].includes(col)) {
                dbRecord[col] = val ? parseFloat(String(val).replace(/[^0-9.-]/g, '')) : 0;
              } else {
                dbRecord[col] = val ? String(val).trim() : '';
              }
            } else {
              // e-Lekha formatting
              if (col === 'DDO Code' || col === 'TE Number') {
                dbRecord[col] = val ? parseInt(String(val).replace(/\D/g, ''), 10) : null;
              } else if (col === 'HOA') {
                let hoaVal = '';
                if (val !== undefined && val !== null && val !== '') {
                  const num = Number(val);
                  if (!isNaN(num)) {
                    hoaVal = num.toFixed(0);
                  } else {
                    hoaVal = String(val).trim();
                  }
                }
                if (hoaVal && /^\d+$/.test(hoaVal)) {
                  hoaVal = hoaVal.padStart(15, '0');
                }
                dbRecord[col] = hoaVal.substring(0, 15);
              } else if (col === 'Receipt (Rs.)' || col === 'Payment (Rs.)') {
                dbRecord[col] = val ? String(val).trim() : '0';
              } else {
                dbRecord[col] = val ? String(val).trim() : '';
              }
            }
          }
        });
        
        return dbRecord;
      });

      // 3. Batch upload the formatted records in chunks of 500
      const CHUNK_SIZE = 500;
      const totalChunks = Math.ceil(formattedRows.length / CHUNK_SIZE);
      
      for (let i = 0; i < totalChunks; i++) {
        const chunk = formattedRows.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        setSyncProgress(`Uploading batch ${i + 1} of ${totalChunks} (${chunk.length} rows)...`);
        
        const { error: insertError } = await supabase
          .from(dbTable)
          .insert(chunk);

        if (insertError) {
          throw new Error(`Failed to insert batch ${i + 1}: ${insertError.message}`);
        }
      }

      setSyncProgress('Upload complete! Finalizing synchronization...');
      setSyncSuccess(true);
      
      // Clear sync states
      setSyncFile(null);
      setSyncHeaders([]);
      setParsedRows([]);
      setColumnMapping({});
      setFileInputKey(Date.now());
    } catch (err) {
      console.error('Database Sync Error:', err);
      setSyncError(`Sync failed: ${err.message || err}`);
    } finally {
      setIsSyncing(false);
    }
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
        <p style={{ color: 'var(--text-secondary)' }}>Fetching real-time financial datasets from Supabase database...</p>
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

  if (!isLoggedIn) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        fontFamily: 'var(--font-sans)',
        padding: '20px',
        position: 'relative'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '450px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px',
          boxShadow: 'var(--shadow-premium)',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🪙</div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '10px'
          }}>CEBAR</h1>
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            marginBottom: '30px',
            lineHeight: '1.4'
          }}>
            Circle Expenditure, Budget and Accounting Review
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>User ID</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Enter 8-digit User ID" 
                  value={loginUserId}
                  onChange={(e) => setLoginUserId(e.target.value.replace(/\D/g, '').substring(0, 8))}
                  className="custom-input"
                  style={{ paddingLeft: '38px', width: '100%', height: '42px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Enter Password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="custom-input"
                  style={{ paddingLeft: '38px', paddingRight: '40px', width: '100%', height: '42px', boxSizing: 'border-box' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {loginError && (
              <div style={{
                color: 'var(--color-error)',
                fontSize: '0.85rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={16} />
                <span>{loginError}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="pg-btn" 
              style={{
                width: '100%',
                height: '42px',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                fontWeight: 'bold',
                border: 'none',
                marginTop: '10px'
              }}
            >
              Sign In
            </button>
          </form>
        </div>

        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          textAlign: 'right',
          fontFamily: 'monospace',
          maxWidth: '300px',
          lineHeight: '1.4'
        }}>
          Desigend and developed by Vishal Gorvadiya, AAO, O/o The Cheif PMG, Ahd.
        </div>
      </div>
    );
  }

  if (currentUser && currentUser.needs_password_change) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        fontFamily: 'var(--font-sans)',
        padding: '20px',
        position: 'relative'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '450px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px',
          boxShadow: 'var(--shadow-premium)',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔑</div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '10px'
          }}>Change Password</h1>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginBottom: '30px',
            lineHeight: '1.4'
          }}>
            For security reasons, you are required to change your password from the default <strong>Ahd@12345</strong> before accessing the dashboard.
          </p>

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  placeholder="Enter New Password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="custom-input"
                  style={{ paddingLeft: '38px', width: '100%', height: '42px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  placeholder="Confirm New Password" 
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="custom-input"
                  style={{ paddingLeft: '38px', width: '100%', height: '42px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {passwordChangeError && (
              <div style={{
                color: 'var(--color-error)',
                fontSize: '0.85rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={16} />
                <span>{passwordChangeError}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="pg-btn" 
              style={{
                width: '100%',
                height: '42px',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                fontWeight: 'bold',
                border: 'none',
                marginTop: '10px'
              }}
            >
              Update Password
            </button>
          </form>
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
        </div>
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
              <div 
                className="user-badge-container" 
                style={{ position: 'relative', display: 'inline-block' }}
                onMouseEnter={() => setShowUserTooltip(true)}
                onMouseLeave={() => setShowUserTooltip(false)}
              >
                <span className="user-badge" style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  cursor: 'help'
                }}>
                  👤 {currentUser.name.toUpperCase()} ({currentUser.type})
                </span>
                
                {showUserTooltip && (
                  <div className="user-tooltip" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px',
                    boxShadow: 'var(--shadow-premium)',
                    zIndex: 2000,
                    minWidth: '240px',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '0.8rem',
                    lineHeight: '1.4',
                    color: 'var(--text-primary)'
                  }}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '4px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                      User Profile Details
                    </div>
                    <div><strong>User ID:</strong> {currentUser.user_id}</div>
                    <div><strong>Name:</strong> {currentUser.name}</div>
                    <div><strong>Mobile No:</strong> {currentUser.mobile_no || '–'}</div>
                    <div><strong>Office:</strong> {currentUser.office || '–'}</div>
                    <div><strong>Type:</strong> {currentUser.type === 'SA' ? 'Super Admin (SA)' : 'Reader (View)'}</div>
                  </div>
                )}
              </div>
              <button 
                onClick={handleLogout}
                className="pg-btn"
                style={{
                  height: '32px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--color-error)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                title="Log Out"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
          <button 
            className="theme-toggle-btn" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Theme"
            style={{ height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

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
          {currentUser && currentUser.type === 'SA' && (
            <>
              <button 
                className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <User size={16} /> User Management
              </button>
              <button 
                className={`tab-btn ${activeTab === 'sync' ? 'active' : ''}`}
                onClick={() => setActiveTab('sync')}
              >
                <RefreshCw size={16} /> Database Sync
              </button>
            </>
          )}
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

                <button
                  type="button"
                  className={`pg-btn ${isAnalysisMode ? 'active' : ''}`}
                  onClick={() => {
                    setIsAnalysisMode(!isAnalysisMode);
                    setSelectedAnalysisType('all');
                    if (isChartMode) setIsChartMode(false);
                  }}
                  style={{
                    height: '32px',
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 'bold',
                    backgroundColor: isAnalysisMode ? 'var(--color-primary)' : 'var(--bg-input)',
                    color: isAnalysisMode ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    marginLeft: '8px'
                  }}
                >
                  <AlertTriangle size={14} /> Analysis
                </button>

                <button
                  type="button"
                  className={`pg-btn ${isChartMode ? 'active' : ''}`}
                  onClick={() => {
                    setIsChartMode(!isChartMode);
                    if (isAnalysisMode) setIsAnalysisMode(false);
                  }}
                  style={{
                    height: '32px',
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 'bold',
                    backgroundColor: isChartMode ? 'var(--color-primary)' : 'var(--bg-input)',
                    color: isChartMode ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <BarChart2 size={14} /> Chart
                </button>
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

            {/* Analysis Collapsible Panel */}
            {isAnalysisMode && (
              <div 
                className="analysis-panel" 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.25rem',
                  marginTop: '1rem',
                  padding: '1.25rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                {/* Over-Utilized card */}
                <div 
                  className={`analysis-card ${selectedAnalysisType === 'over' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedAnalysisType(selectedAnalysisType === 'over' ? 'all' : 'over');
                    setBudgetPage(0);
                  }}
                  style={{
                    backgroundColor: selectedAnalysisType === 'over' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-card)',
                    border: selectedAnalysisType === 'over' ? '2px solid var(--color-error)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ color: 'var(--color-error)', fontWeight: 700, margin: 0 }}>Over-Utilized Units</h4>
                    <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {analysisStats.overCount} Units
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                    Units where APT Consumed is &gt; 100% of APT Allotted.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>Allotted: <strong>{formatINR(analysisStats.overAllotted)}</strong></span>
                    <span>Consumed: <strong>{formatINR(analysisStats.overConsumed)}</strong></span>
                  </div>
                </div>

                {/* Under-Utilized card */}
                <div 
                  className={`analysis-card ${selectedAnalysisType === 'under' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedAnalysisType(selectedAnalysisType === 'under' ? 'all' : 'under');
                    setBudgetPage(0);
                  }}
                  style={{
                    backgroundColor: selectedAnalysisType === 'under' ? 'rgba(249, 115, 22, 0.15)' : 'var(--bg-card)',
                    border: selectedAnalysisType === 'under' ? '2px solid var(--color-warning)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ color: 'var(--color-warning)', fontWeight: 700, margin: 0 }}>Not Utilized (0% - 20%)</h4>
                    <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {analysisStats.underCount} Units
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                    Units where utilization is between 0% and 20% of allotment.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>Allotted: <strong>{formatINR(analysisStats.underAllotted)}</strong></span>
                    <span>Consumed: <strong>{formatINR(analysisStats.underConsumed)}</strong></span>
                  </div>
                </div>

                {/* Consumed without Allotment card */}
                <div 
                  className={`analysis-card ${selectedAnalysisType === 'no_allotment' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedAnalysisType(selectedAnalysisType === 'no_allotment' ? 'all' : 'no_allotment');
                    setBudgetPage(0);
                  }}
                  style={{
                    backgroundColor: selectedAnalysisType === 'no_allotment' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card)',
                    border: selectedAnalysisType === 'no_allotment' ? '2px solid var(--color-info)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ color: 'var(--color-info)', fontWeight: 700, margin: 0 }}>Consumed Without Allotment</h4>
                    <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {analysisStats.noAllotCount} Units
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                    Units where e-Lekha expenditure exists without any budget allotment.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>e-Lekha Consumed: <strong>{formatINR(analysisStats.noAllotConsumed)}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* Chart Collapsible Panel */}
            {isChartMode && budgetChartData.length > 0 && (
              <div 
                className="chart-panel" 
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  marginTop: '1rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Group By</label>
                      <select 
                        className="custom-select" 
                        value={selectedChartGroupBy} 
                        onChange={(e) => {
                          setSelectedChartGroupBy(e.target.value);
                          if (e.target.value === 'status') {
                            setSelectedChartType('pie'); // default status to pie
                          }
                        }}
                        style={{ height: '32px', minWidth: '120px', padding: '2px 8px', fontSize: '0.8rem' }}
                      >
                        <option value="region">Region</option>
                        <option value="status">Status</option>
                        <option value="hoa">HOA Code (Top 10)</option>
                      </select>
                    </div>

                    {selectedChartGroupBy !== 'status' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Metric</label>
                        <select 
                          className="custom-select" 
                          value={selectedChartMetric} 
                          onChange={(e) => setSelectedChartMetric(e.target.value)}
                          style={{ height: '32px', minWidth: '180px', padding: '2px 8px', fontSize: '0.8rem' }}
                        >
                          <option value="consumed">APT Consumed vs Allotted</option>
                          <option value="alloted">APT Allotted Only</option>
                          <option value="elekha">e-Lekha Consumed Only</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
                    {['pie', 'bar', 'line'].map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedChartType(t)}
                        className={`pg-btn ${selectedChartType === t ? 'active' : ''}`}
                        style={{
                          height: '30px',
                          padding: '0 12px',
                          fontSize: '0.8rem',
                          backgroundColor: selectedChartType === t ? 'var(--color-primary)' : 'var(--bg-input)'
                        }}
                      >
                        {t.toUpperCase()} CHART
                      </button>
                    ))}
                  </div>
                </div>

                {selectedChartType === 'pie' ? (
                  <SVGPieChart 
                    data={budgetChartData} 
                    colors={['#0ea5e9', '#10b981', '#f97316', '#a855f7', '#f43f5e', '#818cf8', '#a78bfa', '#ec4899', '#f59e0b', '#3b82f6']} 
                  />
                ) : selectedChartType === 'bar' ? (
                  <SVGBarChart 
                    data={budgetChartData} 
                    colors={['#0ea5e9', '#f97316']} 
                  />
                ) : (
                  <SVGLineChart 
                    data={budgetChartData} 
                    colors={['#0ea5e9', '#f97316']} 
                  />
                )}
                {selectedChartType !== 'pie' && selectedChartGroupBy !== 'status' && selectedChartMetric === 'consumed' && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '15px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#0ea5e9', borderRadius: '2px' }}></span>
                      <span>APT Consumed</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#f97316', borderRadius: '2px' }}></span>
                      <span>APT Allotted</span>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                            allValues={getFilteredDataForColumn('Office ID').map(d => d['Office ID'])} 
                            selectedFilters={budgetColumnFilters['Office ID']} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="Name of Unit (HO/Division)" 
                            columnName="Name of Unit (HO/Division)" 
                            allValues={getFilteredDataForColumn('Name of Unit (HO/Division)').map(d => d['Name of Unit (HO/Division)'])} 
                            selectedFilters={budgetColumnFilters['Name of Unit (HO/Division)']} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="Region" 
                            columnName="Region" 
                            allValues={getFilteredDataForColumn('Region').map(d => d.Region)} 
                            selectedFilters={budgetColumnFilters.Region} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="HOA" 
                            columnName="HOA" 
                            allValues={getFilteredDataForColumn('HOA').map(d => d.HOA)} 
                            selectedFilters={budgetColumnFilters.HOA} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="Description" 
                            columnName="Description" 
                            allValues={getFilteredDataForColumn('Description').map(d => d.Description)} 
                            selectedFilters={budgetColumnFilters.Description} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th className="text-right">
                          <ColumnHeaderFilter 
                            title="APT Alloted" 
                            columnName="APT Alloted" 
                            allValues={getFilteredDataForColumn('APT Alloted').map(d => String(d['APT Alloted'] || 0))} 
                            selectedFilters={budgetColumnFilters['APT Alloted']} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th className="text-right">
                          <ColumnHeaderFilter 
                            title="APT Consumed" 
                            columnName="APT Consumed" 
                            allValues={getFilteredDataForColumn('APT Consumed').map(d => String(d['APT Consumed'] || 0))} 
                            selectedFilters={budgetColumnFilters['APT Consumed']} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th className="text-right">
                          <ColumnHeaderFilter 
                            title="e-Lekha Consumed" 
                            columnName="e-lekha Consumed" 
                            allValues={getFilteredDataForColumn('e-lekha Consumed').map(d => String(d['e-lekha Consumed'] || 0))} 
                            selectedFilters={budgetColumnFilters['e-lekha Consumed']} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th className="text-right">
                          <ColumnHeaderFilter 
                            title="Diff. (APT - e-Lekha)" 
                            columnName="Diff. (APT - e-Lekha)" 
                            allValues={getFilteredDataForColumn('Diff. (APT - e-Lekha)').map(d => String(d['Diff. (APT - e-Lekha)'] || 0))} 
                            selectedFilters={budgetColumnFilters['Diff. (APT - e-Lekha)']} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th className="text-right">
                          <ColumnHeaderFilter 
                            title="APT Consumed %" 
                            columnName="APT Consumed %" 
                            allValues={getFilteredDataForColumn('APT Consumed %').map(d => typeof d['APT Consumed %'] === 'number' ? d['APT Consumed %'].toFixed(2) : String(d['APT Consumed %']))} 
                            selectedFilters={budgetColumnFilters['APT Consumed %']} 
                            onChange={(col, val) => setBudgetColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th className="text-right">
                          <ColumnHeaderFilter 
                            title="e-Lekha Consumed %" 
                            columnName="e-Lekha Consumed %" 
                            allValues={getFilteredDataForColumn('e-Lekha Consumed %').map(d => typeof d['e-Lekha Consumed %'] === 'number' ? d['e-Lekha Consumed %'].toFixed(2) : String(d['e-Lekha Consumed %']))} 
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
                            allValues={getFilteredElekhaDataForColumn('Txn Date').map(d => d['Txn Date'])} 
                            selectedFilters={elekhaColumnFilters['Txn Date']} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="Month" 
                            columnName="Month" 
                            allValues={getFilteredElekhaDataForColumn('Month').map(d => d.Month)} 
                            selectedFilters={elekhaColumnFilters.Month} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="Region" 
                            columnName="Region" 
                            allValues={getFilteredElekhaDataForColumn('Region').map(d => d.Region)} 
                            selectedFilters={elekhaColumnFilters.Region} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="DDO" 
                            columnName="DDO Code" 
                            allValues={getFilteredElekhaDataForColumn('DDO Code').map(d => d['DDO Code'])} 
                            selectedFilters={elekhaColumnFilters['DDO Code']} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="HO" 
                            columnName="HO" 
                            allValues={getFilteredElekhaDataForColumn('HO').map(d => d.HO)} 
                            selectedFilters={elekhaColumnFilters.HO} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="Division" 
                            columnName="Division" 
                            allValues={getFilteredElekhaDataForColumn('Division').map(d => d.Division)} 
                            selectedFilters={elekhaColumnFilters.Division} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="HOA" 
                            columnName="HOA" 
                            allValues={getFilteredElekhaDataForColumn('HOA').map(d => d.HOA)} 
                            selectedFilters={elekhaColumnFilters.HOA} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="Description" 
                            columnName="Description" 
                            allValues={getFilteredElekhaDataForColumn('Description').map(d => d.Description)} 
                            selectedFilters={elekhaColumnFilters.Description} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th className="text-right">
                          <ColumnHeaderFilter 
                            title="Receipts" 
                            columnName="Receipt (Rs.)" 
                            allValues={getFilteredElekhaDataForColumn('Receipt (Rs.)').map(d => String(d['Receipt (Rs.)'] || '0').trim())} 
                            selectedFilters={elekhaColumnFilters['Receipt (Rs.)']} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th className="text-right">
                          <ColumnHeaderFilter 
                            title="Payments" 
                            columnName="Payment (Rs.)" 
                            allValues={getFilteredElekhaDataForColumn('Payment (Rs.)').map(d => String(d['Payment (Rs.)'] || '0').trim())} 
                            selectedFilters={elekhaColumnFilters['Payment (Rs.)']} 
                            onChange={(col, val) => setElekhaColumnFilters(prev => ({ ...prev, [col]: val }))} 
                          />
                        </th>
                        <th>
                          <ColumnHeaderFilter 
                            title="Remark" 
                            columnName="Remark" 
                            allValues={getFilteredElekhaDataForColumn('Remark').map(d => String(d['Remark'] || '').trim())} 
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
                {/* Vertical Revenue KPIs Summary Bar */}
                {revenueKpis && (
                  <div 
                    className="budget-summary-bar" 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                      gap: '0.75rem', 
                      marginBottom: '1.5rem' 
                    }}
                  >
                    {['CCS', 'FS', 'IRGB', 'MO', 'Parcel', 'PLI', 'RPLI', 'Gross'].map(cat => {
                      const data = revenueKpis[cat] || { p1: 0, p2: 0 };
                      const label = translateCategoryVal(cat);
                      const isGross = cat === 'Gross';
                      
                      return (
                        <div 
                          key={cat} 
                          className="budget-summary-card"
                          style={{
                            padding: '0.75rem',
                            border: isGross ? '1.5px solid var(--color-primary)' : '1px solid var(--border-color)',
                            backgroundColor: isGross ? 'rgba(14, 165, 233, 0.05)' : 'var(--bg-card)',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <h5 style={{ fontSize: '0.75rem', margin: '0 0 6px 0', textTransform: 'uppercase', color: isGross ? 'var(--color-primary)' : 'var(--text-secondary)' }}>
                            {label}
                          </h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{getPeriodLabel(1)}:</span>
                              <span>{formatINR(data.p1)}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{getPeriodLabel(2)}:</span>
                              <span>{formatINR(data.p2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.25rem 0', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Displaying Period comparison: <strong>Period 1</strong> vs <strong>Period 2</strong> (Grouped by {generatedConfig.groupBy === 'ho' ? 'HO' : generatedConfig.groupBy === 'division' ? 'Division' : 'Region'})
                  </div>
                  
                  <button
                    type="button"
                    className={`pg-btn ${isRevenueChartMode ? 'active' : ''}`}
                    onClick={() => setIsRevenueChartMode(!isRevenueChartMode)}
                    style={{
                      height: '32px',
                      padding: '0 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 'bold',
                      backgroundColor: isRevenueChartMode ? 'var(--color-primary)' : 'var(--bg-input)',
                      color: isRevenueChartMode ? 'white' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <BarChart2 size={14} /> Chart Options
                  </button>
                </div>

                {/* Revenue Chart Collapsible Panel */}
                {isRevenueChartMode && revenueChartData.length > 0 && (
                  <div 
                    className="chart-panel" 
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.5rem',
                      marginBottom: '1.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Vertical Revenue Category Comparison</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Comparing total receipts of Period 1 (P1) vs Period 2 (P2) across categories.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {['bar', 'line', 'pie'].map(t => (
                          <button
                            key={t}
                            onClick={() => setSelectedRevenueChartType(t)}
                            className={`pg-btn ${selectedRevenueChartType === t ? 'active' : ''}`}
                            style={{
                              height: '30px',
                              padding: '0 12px',
                              fontSize: '0.8rem',
                              backgroundColor: selectedRevenueChartType === t ? 'var(--color-primary)' : 'var(--bg-input)'
                            }}
                          >
                            {t.toUpperCase()} CHART
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedRevenueChartType === 'pie' ? (
                      <SVGPieChart 
                        data={revenueChartData} 
                        colors={['#38bdf8', '#34d399', '#f97316', '#a78bfa', '#fb7185', '#60a5fa', '#f472b6']} 
                      />
                    ) : selectedRevenueChartType === 'bar' ? (
                      <SVGBarChart 
                        data={revenueChartData} 
                        colors={['#38bdf8', '#34d399']} 
                      />
                    ) : (
                      <SVGLineChart 
                        data={revenueChartData} 
                        colors={['#38bdf8', '#34d399']} 
                      />
                    )}

                    {selectedRevenueChartType !== 'pie' && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '15px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#38bdf8', borderRadius: '2px' }}></span>
                          <span>{getPeriodLabel(1)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#34d399', borderRadius: '2px' }}></span>
                          <span>{getPeriodLabel(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                        const clsRow = `rev-row-${cat.toLowerCase().replace(/\s+/g, '-')}`;
                        const clsTotal = `rev-row-${cat.toLowerCase().replace(/\s+/g, '-')}-total`;

                        return (
                          <React.Fragment key={cat}>
                            {/* Render detail HOA rows under this category (if detail is selected) */}
                            {generatedConfig.reportType === 'Detail' && hoas.map(hoa => {
                              const hoaCode = String(hoa['HOA Code'] || '').trim();
                              return (
                                <tr key={hoaCode} className={clsRow}>
                                  <td style={{ fontWeight: 600 }}>{translateCategoryVal(cat)}</td>
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
                              <td style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{translateCategoryVal(cat)} Total</td>
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

        {/* Tab 4: User Management View (SA only) */}
        {activeTab === 'users' && currentUser && currentUser.type === 'SA' && (
          <>
            <div className="card-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
              <div>
                <h2>User Management</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Create, edit, reset passwords, and delete user credentials.
                </p>
              </div>
              <button 
                onClick={() => {
                  resetUserManagementForm();
                  setShowUserModal(true);
                }}
                className="pg-btn"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 'bold',
                  height: '38px',
                  padding: '0 1.25rem'
                }}
              >
                <Plus size={16} /> Add User
              </button>
            </div>

            <div className="table-wrapper" style={{ marginTop: '1.5rem' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Mobile No.</th>
                    <th>Office</th>
                    <th>Type</th>
                    <th>Status / Password</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    const isMaster = u.user_id === '10032853';
                    const isSA = u.type === 'SA';
                    const canDelete = !isMaster && (!isSA || currentUser.user_id === '10032853');

                    return (
                      <tr key={u.user_id}>
                        <td>
                          <code style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{u.user_id}</code>
                          {isMaster && (
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '0.7rem',
                              backgroundColor: 'rgba(99, 102, 241, 0.2)',
                              color: '#818cf8',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 'bold'
                            }}>
                              MASTER
                            </span>
                          )}
                        </td>
                        <td style={{ fontWeight: 500 }}>{u.name}</td>
                        <td>{u.mobile_no}</td>
                        <td>{u.office}</td>
                        <td>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: u.type === 'SA' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: u.type === 'SA' ? '#f87171' : '#34d399'
                          }}>
                            {u.type}
                          </span>
                        </td>
                        <td>
                          {u.needs_password_change ? (
                            <span style={{ color: 'var(--color-warning)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Key size={12} /> Default (Requires Change)
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-success)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={12} /> Set
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => handleEditClick(u)}
                              className="pg-btn"
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.8rem',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-input)',
                                color: 'var(--text-primary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              disabled={isMaster && currentUser.user_id !== '10032853'}
                            >
                              <Edit size={12} /> Edit
                            </button>
                            <button 
                              onClick={() => handleResetUserPassword(u.user_id)}
                              className="pg-btn"
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.8rem',
                                border: '1px solid var(--color-warning)',
                                color: 'var(--color-warning)',
                                backgroundColor: 'transparent',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              disabled={isMaster}
                            >
                              <RefreshCw size={12} /> Reset Pass
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.user_id)}
                              className="pg-btn"
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.8rem',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: 'var(--color-error)',
                                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              disabled={!canDelete}
                              title={isMaster ? 'Master user cannot be deleted' : (!canDelete ? 'Only Master user can delete SA users' : '')}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Dialog for Add/Edit User */}
            {showUserModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px'
              }}>
                <div style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  width: '100%',
                  maxWidth: '480px',
                  padding: '30px',
                  boxShadow: 'var(--shadow-premium)'
                }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>
                    {isEditingUser ? 'Edit User Details' : 'Add New User'}
                  </h3>

                  <form onSubmit={handleCreateOrUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>User ID (8-digit)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 10032853" 
                        className="custom-input"
                        value={manageUserId}
                        onChange={(e) => setManageUserId(e.target.value.replace(/\D/g, '').substring(0, 8))}
                        disabled={isEditingUser}
                        style={{ height: '38px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. GORVADIYA" 
                        className="custom-input"
                        value={manageName}
                        onChange={(e) => setManageName(e.target.value)}
                        style={{ height: '38px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Mobile No. (10-digit)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 9033201981" 
                        className="custom-input"
                        value={manageMobileNo}
                        onChange={(e) => setManageMobileNo(e.target.value.replace(/\D/g, '').substring(0, 10))}
                        style={{ height: '38px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Office</label>
                      <input 
                        type="text" 
                        placeholder="e.g. CO Ahd" 
                        className="custom-input"
                        value={manageOffice}
                        onChange={(e) => setManageOffice(e.target.value)}
                        style={{ height: '38px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>User Type</label>
                      <select 
                        className="custom-select" 
                        value={manageType}
                        onChange={(e) => setManageType(e.target.value)}
                        disabled={manageUserId === '10032853'}
                        style={{ height: '38px', width: '100%' }}
                      >
                        <option value="View">View (Reader)</option>
                        <option value="SA">SA (Administrator)</option>
                      </select>
                    </div>

                    {!isEditingUser && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        ℹ️ New users are assigned the default password <strong>Ahd@12345</strong> and must change it on their first login.
                      </div>
                    )}

                    {userManagementError && (
                      <div style={{
                        color: 'var(--color-error)',
                        fontSize: '0.8rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <AlertTriangle size={14} />
                        <span>{userManagementError}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowUserModal(false);
                          resetUserManagementForm();
                        }}
                        className="pg-btn"
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="pg-btn"
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          border: 'none',
                          fontWeight: 'bold'
                        }}
                      >
                        Save User
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 5: Database Sync View (SA only) */}
        {activeTab === 'sync' && currentUser && currentUser.type === 'SA' && (
          <>
            <div className="card-title-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <h2>Database Synchronization</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Upload Excel (.xlsx/.xls) or CSV files to synchronize financial datasets with Supabase.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
              {/* Target Table Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>1. Select Target Database Table</label>
                <select 
                  className="custom-select"
                  value={syncTable}
                  onChange={(e) => {
                    setSyncTable(e.target.value);
                    setSyncFile(null);
                    setSyncHeaders([]);
                    setParsedRows([]);
                    setColumnMapping({});
                    setSyncProgress('');
                    setSyncError('');
                    setSyncSuccess(false);
                    setFileInputKey(Date.now());
                  }}
                  style={{ maxWidth: '300px', height: '38px' }}
                >
                  <option value="Budget">Budget (public.Budget)</option>
                  <option value="e-Lekha">e-Lekha (public.e-Lekha)</option>
                </select>
              </div>

              {/* File Upload Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>2. Choose File (Excel .xlsx / .xls or CSV)</label>
                <input 
                  key={fileInputKey}
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileChange}
                  className="custom-input"
                  style={{ 
                    maxWidth: '400px', 
                    padding: '8px', 
                    border: '1px dashed var(--border-color)', 
                    backgroundColor: 'var(--bg-input)',
                    height: 'auto'
                  }}
                />
              </div>

              {/* Mappings and Preview */}
              {syncFile && syncHeaders.length > 0 && (
                <div style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px'
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    3. Match Column Headings (Destination &harr; Uploaded File)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Verify how columns from your file align with Supabase fields. Remap headers using the dropdowns if necessary.
                  </p>

                  <div className="table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <table className="premium-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Destination Database Field</th>
                          <th>Uploaded File Column Header</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(columnMapping).map((dbField) => (
                          <tr key={dbField}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dbField}</td>
                            <td>
                              <select
                                className="custom-select"
                                value={columnMapping[dbField]}
                                onChange={(e) => {
                                  const selectedVal = e.target.value;
                                  setColumnMapping(prev => ({
                                    ...prev,
                                    [dbField]: selectedVal
                                  }));
                                }}
                                style={{ width: '100%', height: '32px', minWidth: '180px' }}
                              >
                                <option value="">-- Don't Import / Skip --</option>
                                {syncHeaders.map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Sync Mode Option */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>4. Select Synchronization Mode</label>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input 
                          type="radio" 
                          name="syncMode" 
                          value="append" 
                          checked={syncMode === 'append'} 
                          onChange={(e) => setSyncMode(e.target.value)}
                        />
                        <span><strong>Add at last (Append)</strong> — Add new records without changing existing data</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input 
                          type="radio" 
                          name="syncMode" 
                          value="replace" 
                          checked={syncMode === 'replace'} 
                          onChange={(e) => setSyncMode(e.target.value)}
                        />
                        <span style={{ color: 'var(--color-warning)' }}><strong>Replace entire data (Overwrite)</strong> — Erase existing table rows and upload fresh</span>
                      </label>
                    </div>
                  </div>

                  {/* Action Sync Button */}
                  <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button
                      onClick={handleStartSync}
                      disabled={isSyncing}
                      className="pg-btn"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        fontWeight: 'bold',
                        height: '42px',
                        padding: '0 2rem',
                        opacity: isSyncing ? 0.7 : 1
                      }}
                    >
                      {isSyncing ? 'Uploading & Syncing...' : 'Upload and Save to Supabase'}
                    </button>

                    {isSyncing && (
                      <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)' }}></div>
                    )}
                  </div>
                </div>
              )}

            {/* Database Sync Overlay Modal (centered popup) */}
            {(isSyncing || !!syncError || syncSuccess) && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px'
              }}>
                <div style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  width: '100%',
                  maxWidth: '450px',
                  padding: '30px',
                  boxShadow: 'var(--shadow-premium)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px'
                }}>
                  {isSyncing && (
                    <>
                      <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)' }}></div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Synchronizing Database</h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{syncProgress}</p>
                    </>
                  )}

                  {syncError && (
                    <>
                      <AlertTriangle size={48} style={{ color: 'var(--color-error)' }} />
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-error)' }}>Sync Failed</h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>{syncError}</p>
                      <button 
                        onClick={() => {
                          setSyncError('');
                          setIsSyncing(false);
                          setSyncProgress('');
                        }}
                        className="pg-btn"
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          border: 'none',
                          fontWeight: 'bold',
                          width: '100%',
                          height: '38px',
                          marginTop: '10px'
                        }}
                      >
                        Close
                      </button>
                    </>
                  )}

                  {syncSuccess && (
                    <>
                      <CheckCircle size={48} style={{ color: 'var(--color-success)' }} />
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>Data Saved</h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>The financial records have been successfully saved to Supabase.</p>
                      <button 
                        onClick={() => {
                          setSyncSuccess(false);
                          setSyncProgress('');
                          window.location.reload();
                        }}
                        className="pg-btn"
                        style={{
                          backgroundColor: 'var(--color-success)',
                          color: 'white',
                          border: 'none',
                          fontWeight: 'bold',
                          width: '100%',
                          height: '38px',
                          marginTop: '10px'
                        }}
                      >
                        OK
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            </div>
          </>
        )}

      </main>
      
      {/* 6. Footer */}
      <footer style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        borderTop: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          CEBAR Database Dashboard • Synchronized with Supabase database (Real-time mode active)
        </div>
        <div style={{
          textAlign: 'right',
          fontFamily: 'monospace',
          color: 'var(--text-muted)',
          fontSize: '0.75rem'
        }}>
          Desigend and developed by Vishal Gorvadiya, AAO, O/o The Cheif PMG, Ahd.
        </div>
      </footer>
    </div>
  );
}
