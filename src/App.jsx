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

// Formats numbers with commas according to Indian Numbering System
const formatIndianNumber = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '0.00';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export default function App() {
  // Navigation / Tab state
  const [activeTab, setActiveTab] = useState('budget'); // 'budget', 'elekha', 'mapping', 'vertical', 'settings'

  // User Management State
  const [currentUser, setCurrentUser] = useState(null); // { username, role: 'admin'|'user' }
  const [usersList, setUsersList] = useState([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // User Management Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [userManagementError, setUserManagementError] = useState('');
  const [userManagementSuccess, setUserManagementSuccess] = useState('');

  // Password Change State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPasswordChange, setNewPasswordChange] = useState('');
  const [confirmPasswordChange, setConfirmPasswordChange] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');

  // Raw data state
  const [budgetData, setBudgetData] = useState([]);
  const [elekhaData, setElekhaData] = useState([]);
  const [officeMappingData, setOfficeMappingData] = useState([]);
  const [revenueHoaData, setRevenueHoaData] = useState([]);
  const [revenueDdoMappingData, setRevenueDdoMappingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Pagination state for Budget
  const [budgetPage, setBudgetPage] = useState(1);
  const [budgetRowsPerPage, setBudgetRowsPerPage] = useState(15);

  // Pagination state for e-Lekha
  const [elekhaPage, setElekhaPage] = useState(1);
  const [elekhaRowsPerPage, setElekhaRowsPerPage] = useState(15);

  // Filters for Budget Dashboard
  const [budgetRegionFilter, setBudgetRegionFilter] = useState('ALL');
  const [budgetHoaFilter, setBudgetHoaFilter] = useState('ALL');
  const [budgetSearchTerm, setBudgetSearchTerm] = useState('');

  // Filters for e-Lekha Dashboard
  const [elekhaRegionFilter, setElekhaRegionFilter] = useState('ALL');
  const [elekhaDdoFilter, setElekhaDdoFilter] = useState('ALL');
  const [elekhaHoaFilter, setElekhaHoaFilter] = useState('ALL');
  const [elekhaSearchTerm, setElekhaSearchTerm] = useState('');

  // Setup / Config State for Vertical Revenue Report
  const [comparisonType, setComparisonType] = useState('Month'); // 'Month' or 'DateRange'
  
  // Month-based selections
  const [p1FromMonth, setP1FromMonth] = useState('2025-04');
  const [p1ToMonth, setP1ToMonth] = useState('2025-09');
  const [p2FromMonth, setP2FromMonth] = useState('2025-10');
  const [p2ToMonth, setP2ToMonth] = useState('2026-03');

  // Custom date-based selections
  const [p1FromDate, setP1FromDate] = useState('2025-04-01');
  const [p1ToDate, setP1ToDate] = useState('2025-09-30');
  const [p2FromDate, setP2FromDate] = useState('2025-10-01');
  const [p2ToDate, setP2ToDate] = useState('2026-03-31');

  // Vertical Revenue filters
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedUnits, setSelectedUnits] = useState([]); // Empty array = ALL
  const [reportType, setReportType] = useState('Detail'); // 'Detail' or 'Summary'

  // Generated state to lock configuration when "Generate Report" is clicked
  const [generatedConfig, setGeneratedConfig] = useState(null);

  // Fetch initial data from public CSVs or local storage fallback
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [bRes, eRes, oRes, rhRes, rdRes] = await Promise.all([
          fetch('/budget report.csv').then(r => r.text()),
          fetch('/e-Lekha.csv').then(r => r.text()),
          fetch('/Office_Mapping.csv').then(r => r.text()),
          fetch('/Revenue_HOA.csv').then(r => r.text()),
          fetch('/revenue ddo mapping.csv').then(r => r.text())
        ]);

        const parsedBudget = csvToObjects(bRes);
        const parsedElekha = csvToObjects(eRes);
        const parsedMapping = csvToObjects(oRes);
        const parsedRevenueHoa = csvToObjects(rhRes);
        const parsedRevenueDdo = csvToObjects(rdRes);

        setBudgetData(parsedBudget);
        setElekhaData(parsedElekha);
        setOfficeMappingData(parsedMapping);
        setRevenueHoaData(parsedRevenueHoa);
        setRevenueDdoMappingData(parsedRevenueDdo);
      } catch (err) {
        console.error('Error loading CSV datasets:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Set Theme
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  // Auth Initialization & User list loading from Supabase
  useEffect(() => {
    async function initAuth() {
      try {
        setIsAuthLoading(true);
        // Check local storage for active session
        const storedUser = localStorage.getItem('cebar_user');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }

        // Fetch users list from Supabase
        const { data, error } = await supabase.from('users').select('*');
        if (!error && data) {
          setUsersList(data);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsAuthLoading(false);
      }
    }
    initAuth();
  }, []);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginUsername || !loginPassword) {
      setLoginError('Please enter both username and password.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', loginUsername.trim())
        .single();

      if (error || !data) {
        setLoginError('Invalid username or password.');
        return;
      }

      if (data.password !== loginPassword.trim()) {
        setLoginError('Invalid username or password.');
        return;
      }

      const userSession = { username: data.username, role: data.role };
      setCurrentUser(userSession);
      localStorage.setItem('cebar_user', JSON.stringify(userSession));
      setLoginUsername('');
      setLoginPassword('');
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('An error occurred during login. Please try again.');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('cebar_user');
  };

  // Handle Add User (Admin only)
  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserManagementError('');
    setUserManagementSuccess('');

    if (!newUsername || !newPassword) {
      setUserManagementError('Please enter username and password.');
      return;
    }

    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', newUsername.trim())
        .single();

      if (existingUser) {
        setUserManagementError('Username already exists.');
        return;
      }

      const { error } = await supabase.from('users').insert([
        { username: newUsername.trim(), password: newPassword.trim(), role: newRole }
      ]);

      if (error) {
        setUserManagementError('Failed to add user: ' + error.message);
        return;
      }

      setUserManagementSuccess(`User "${newUsername.trim()}" added successfully!`);
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      
      // Refresh user list
      const { data } = await supabase.from('users').select('*');
      if (data) setUsersList(data);
    } catch (err) {
      setUserManagementError('An error occurred while adding user.');
    }
  };

  // Handle Delete User (Admin only)
  const handleDeleteUser = async (usernameToDelete) => {
    if (usernameToDelete === currentUser?.username) {
      alert('You cannot delete your own logged in account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user "${usernameToDelete}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('users').delete().eq('username', usernameToDelete);
      if (error) {
        alert('Failed to delete user: ' + error.message);
        return;
      }
      setUsersList(prev => prev.filter(u => u.username !== usernameToDelete));
    } catch (err) {
      alert('Error deleting user.');
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (!currentPassword || !newPasswordChange || !confirmPasswordChange) {
      setPasswordChangeError('All fields are required.');
      return;
    }

    if (newPasswordChange !== confirmPasswordChange) {
      setPasswordChangeError('New passwords do not match.');
      return;
    }

    try {
      // Verify current password
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', currentUser.username)
        .single();

      if (error || !data || data.password !== currentPassword) {
        setPasswordChangeError('Current password is incorrect.');
        return;
      }

      // Update password
      const { error: updateErr } = await supabase
        .from('users')
        .update({ password: newPasswordChange })
        .eq('username', currentUser.username);

      if (updateErr) {
        setPasswordChangeError('Failed to update password: ' + updateErr.message);
        return;
      }

      setPasswordChangeSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPasswordChange('');
      setConfirmPasswordChange('');
    } catch (err) {
      setPasswordChangeError('Error changing password.');
    }
  };

  // -------------------------------------------------------------
  // Filter Options lists
  // -------------------------------------------------------------
  const budgetRegions = useMemo(() => {
    const set = new Set();
    budgetData.forEach(item => {
      if (item.Region) set.add(item.Region);
    });
    return Array.from(set).sort();
  }, [budgetData]);

  const budgetHoas = useMemo(() => {
    const set = new Set();
    budgetData.forEach(item => {
      if (item.HOA) set.add(item.HOA);
    });
    return Array.from(set).sort();
  }, [budgetData]);

  const elekhaRegions = useMemo(() => {
    const set = new Set();
    elekhaData.forEach(item => {
      if (item.Region) set.add(item.Region);
    });
    return Array.from(set).sort();
  }, [elekhaData]);

  const elekhaDdos = useMemo(() => {
    const set = new Set();
    elekhaData.forEach(item => {
      if (item['DDO Code']) set.add(item['DDO Code']);
    });
    return Array.from(set).sort();
  }, [elekhaData]);

  const elekhaHoas = useMemo(() => {
    const set = new Set();
    elekhaData.forEach(item => {
      if (item.HOA) set.add(item.HOA);
    });
    return Array.from(set).sort();
  }, [elekhaData]);

  // Available regions for Vertical report
  const verticalRegions = useMemo(() => {
    const set = new Set();
    revenueDdoMappingData.forEach(item => {
      if (item.Region) set.add(item.Region);
    });
    return Array.from(set).sort();
  }, [revenueDdoMappingData]);

  // Available units based on selectedRegion
  const availableUnitsForRegion = useMemo(() => {
    const filtered = selectedRegion === 'ALL'
      ? revenueDdoMappingData
      : revenueDdoMappingData.filter(d => d.Region === selectedRegion);

    const set = new Set();
    filtered.forEach(d => {
      if (d.HO) set.add(d.HO);
    });
    return Array.from(set).sort();
  }, [revenueDdoMappingData, selectedRegion]);

  // Filtered Budget Data
  const filteredBudgetData = useMemo(() => {
    return budgetData.filter(row => {
      if (budgetRegionFilter !== 'ALL' && row.Region !== budgetRegionFilter) return false;
      if (budgetHoaFilter !== 'ALL' && row.HOA !== budgetHoaFilter) return false;
      if (budgetSearchTerm.trim() !== '') {
        const query = budgetSearchTerm.toLowerCase();
        const officeId = String(row['Office ID'] || '').toLowerCase();
        const unitName = String(row['Name of Unit (HO/Division)'] || '').toLowerCase();
        const desc = String(row['Description'] || '').toLowerCase();
        const hoa = String(row['HOA'] || '').toLowerCase();
        if (!officeId.includes(query) && !unitName.includes(query) && !desc.includes(query) && !hoa.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [budgetData, budgetRegionFilter, budgetHoaFilter, budgetSearchTerm]);

  // Paginated Budget Data
  const paginatedBudgetData = useMemo(() => {
    const startIndex = (budgetPage - 1) * budgetRowsPerPage;
    return filteredBudgetData.slice(startIndex, startIndex + budgetRowsPerPage);
  }, [filteredBudgetData, budgetPage, budgetRowsPerPage]);

  const totalBudgetPages = Math.ceil(filteredBudgetData.length / budgetRowsPerPage) || 1;

  // Filtered e-Lekha Data
  const filteredElekhaData = useMemo(() => {
    return elekhaData.filter(row => {
      if (elekhaRegionFilter !== 'ALL' && row.Region !== elekhaRegionFilter) return false;
      if (elekhaDdoFilter !== 'ALL' && row['DDO Code'] !== elekhaDdoFilter) return false;
      if (elekhaHoaFilter !== 'ALL' && row.HOA !== elekhaHoaFilter) return false;
      if (elekhaSearchTerm.trim() !== '') {
        const query = elekhaSearchTerm.toLowerCase();
        const teNo = String(row['TE Number'] || '').toLowerCase();
        const ddo = String(row['DDO Code'] || '').toLowerCase();
        const ho = String(row['HO'] || '').toLowerCase();
        const desc = String(row['Description'] || '').toLowerCase();
        const hoa = String(row['HOA'] || '').toLowerCase();
        const remark = String(row['Remark'] || '').toLowerCase();
        if (!teNo.includes(query) && !ddo.includes(query) && !ho.includes(query) && !desc.includes(query) && !hoa.includes(query) && !remark.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [elekhaData, elekhaRegionFilter, elekhaDdoFilter, elekhaHoaFilter, elekhaSearchTerm]);

  // Paginated e-Lekha Data
  const paginatedElekhaData = useMemo(() => {
    const startIndex = (elekhaPage - 1) * elekhaRowsPerPage;
    return filteredElekhaData.slice(startIndex, startIndex + elekhaRowsPerPage);
  }, [filteredElekhaData, elekhaPage, elekhaRowsPerPage]);

  const totalElekhaPages = Math.ceil(filteredElekhaData.length / elekhaRowsPerPage) || 1;

  // Summary Metrics for Budget
  const budgetMetrics = useMemo(() => {
    let totalAlloted = 0;
    let totalAptConsumed = 0;
    let totalElekhaConsumed = 0;

    filteredBudgetData.forEach(row => {
      totalAlloted += parseNumber(row['APT Alloted']);
      totalAptConsumed += parseNumber(row['APT Consumed']);
      totalElekhaConsumed += parseNumber(row['e-lekha Consumed']);
    });

    const diff = totalAptConsumed - totalElekhaConsumed;
    const aptConsumedPct = totalAlloted > 0 ? (totalAptConsumed / totalAlloted) * 100 : 0;
    const elekhaConsumedPct = totalAlloted > 0 ? (totalElekhaConsumed / totalAlloted) * 100 : 0;

    return {
      totalAlloted,
      totalAptConsumed,
      totalElekhaConsumed,
      diff,
      aptConsumedPct,
      elekhaConsumedPct
    };
  }, [filteredBudgetData]);

  // Summary Metrics for e-Lekha
  const elekhaMetrics = useMemo(() => {
    let totalReceipts = 0;
    let totalPayments = 0;

    filteredElekhaData.forEach(row => {
      totalReceipts += parseNumber(row['Receipt (Rs.)']);
      totalPayments += parseNumber(row['Payment (Rs.)']);
    });

    const netAmount = totalReceipts - totalPayments;
    return {
      totalReceipts,
      totalPayments,
      netAmount,
      totalTransactions: filteredElekhaData.length
    };
  }, [filteredElekhaData]);

  // -------------------------------------------------------------
  // Generate Vertical Revenue Matrix Calculations
  // -------------------------------------------------------------
  const handleGenerateReport = () => {
    setGeneratedConfig({
      type: comparisonType,
      p1From: p1FromMonth,
      p1To: p1ToMonth,
      p2From: p2FromMonth,
      p2To: p2ToMonth,
      p1FromDate,
      p1ToDate,
      p2FromDate,
      p2ToDate,
      region: selectedRegion,
      units: [...selectedUnits],
      reportType
    });
  };

  const verticalRevenueReportData = useMemo(() => {
    if (!generatedConfig) return null;

    const { type, p1From, p1To, p2From, p2To, p1FromDate, p1ToDate, p2FromDate, p2ToDate, region, units } = generatedConfig;

    // Filter DDO mapping based on region and selected units
    let validDdos = revenueDdoMappingData;
    if (region !== 'ALL') {
      validDdos = validDdos.filter(d => d.Region === region);
    }
    if (units.length > 0) {
      validDdos = validDdos.filter(d => units.includes(d.HO));
    }

    // Map DDO Code -> HO (Unit Name)
    const ddoToUnitMap = {};
    validDdos.forEach(d => {
      const code = String(d['DDO Code'] || '').trim();
      if (code) {
        ddoToUnitMap[code] = d.HO;
      }
    });

    // Unique HO Unit names in list
    const uniqueUnitsSet = new Set();
    validDdos.forEach(d => {
      if (d.HO) uniqueUnitsSet.add(d.HO);
    });
    const uniqueUnits = Array.from(uniqueUnitsSet).sort().map(name => ({
      name,
      label: name
    }));

    // Date / Month range matching helper functions
    const isDateInP1 = (dateStr, monthStr) => {
      if (type === 'Month') {
        if (!monthStr) return false;
        // YYYY-MM comparison
        return monthStr >= p1From && monthStr <= p1To;
      } else {
        if (!dateStr) return false;
        // DD/MM/YYYY or YYYY-MM-DD parsing
        let parsed = dateStr;
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            parsed = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
        return parsed >= p1FromDate && parsed <= p1ToDate;
      }
    };

    const isDateInP2 = (dateStr, monthStr) => {
      if (type === 'Month') {
        if (!monthStr) return false;
        return monthStr >= p2From && monthStr <= p2To;
      } else {
        if (!dateStr) return false;
        let parsed = dateStr;
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            parsed = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
        return parsed >= p2FromDate && parsed <= p2ToDate;
      }
    };

    // Filter e-Lekha data to only valid DDOs
    const targetElekha = elekhaData.filter(row => {
      const ddo = String(row['DDO Code'] || '').trim();
      return ddoToUnitMap[ddo] !== undefined;
    });

    // Categories in Revenue_HOA.csv (CCS, FS, IRGB, MO, Parcel)
    const categoriesOrder = ['CCS', 'FS', 'IRGB', 'MO', 'Parcel'];
    const groupedHoas = {
      CCS: [],
      FS: [],
      IRGB: [],
      MO: [],
      Parcel: []
    };

    revenueHoaData.forEach(h => {
      const cat = h.Category ? h.Category.trim() : '';
      if (groupedHoas[cat]) {
        groupedHoas[cat].push(h);
      }
    });

    // Matrix stores
    // p1Totals: { "HOACode_UnitName": number }
    // p2Totals: { "HOACode_UnitName": number }
    const p1Totals = {};
    const p2Totals = {};

    targetElekha.forEach(row => {
      const ddo = String(row['DDO Code'] || '').trim();
      const unitName = ddoToUnitMap[ddo];
      const hoaCode = String(row['HOA'] || '').trim();
      const dateStr = String(row['Txn Date'] || '').trim();
      const monthStr = String(row['Month'] || '').trim();

      const receipts = parseNumber(row['Receipt (Rs.)']);
      const payments = parseNumber(row['Payment (Rs.)']);
      const net = receipts - payments;

      const key = `${hoaCode}_${unitName}`;

      if (isDateInP1(dateStr, monthStr)) {
        p1Totals[key] = (p1Totals[key] || 0) + net;
      }
      if (isDateInP2(dateStr, monthStr)) {
        p2Totals[key] = (p2Totals[key] || 0) + net;
      }
    });

    // Subtotals per HOA across units
    const rowP1Gross = {};
    const rowP2Gross = {};

    // Category Subtotals
    const p1CatTotals = {};
    const p2CatTotals = {};
    const catP1Gross = {};
    const catP2Gross = {};

    // Grand Totals per Unit
    const unitP1Gross = {};
    const unitP2Gross = {};

    let grandP1Gross = 0;
    let grandP2Gross = 0;

    categoriesOrder.forEach(cat => {
      const hoas = groupedHoas[cat] || [];
      catP1Gross[cat] = 0;
      catP2Gross[cat] = 0;

      hoas.forEach(h => {
        const hoaCode = String(h['HOA Code'] || '').trim();
        rowP1Gross[hoaCode] = 0;
        rowP2Gross[hoaCode] = 0;

        uniqueUnits.forEach(u => {
          const key = `${hoaCode}_${u.name}`;
          const val1 = p1Totals[key] || 0;
          const val2 = p2Totals[key] || 0;

          rowP1Gross[hoaCode] += val1;
          rowP2Gross[hoaCode] += val2;

          const catUnitKey = `${cat}_${u.name}`;
          p1CatTotals[catUnitKey] = (p1CatTotals[catUnitKey] || 0) + val1;
          p2CatTotals[catUnitKey] = (p2CatTotals[catUnitKey] || 0) + val2;

          unitP1Gross[u.name] = (unitP1Gross[u.name] || 0) + val1;
          unitP2Gross[u.name] = (unitP2Gross[u.name] || 0) + val2;
        });

        catP1Gross[cat] += rowP1Gross[hoaCode];
        catP2Gross[cat] += rowP2Gross[hoaCode];
      });

      grandP1Gross += catP1Gross[cat];
      grandP2Gross += catP2Gross[cat];
    });

    return {
      uniqueUnits,
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
  }, [generatedConfig, revenueDdoMappingData, revenueHoaData, elekhaData]);

  // Helper text for Period Headers
  const getPeriodLabel = (periodNum) => {
    if (!generatedConfig) return `P${periodNum}`;
    const { type, p1From, p1To, p2From, p2To, p1FromDate, p1ToDate, p2FromDate, p2ToDate } = generatedConfig;
    if (periodNum === 1) {
      return type === 'Month' ? `${p1From} to ${p1To}` : `${p1FromDate} to ${p1ToDate}`;
    } else {
      return type === 'Month' ? `${p2From} to ${p2To}` : `${p2FromDate} to ${p2ToDate}`;
    }
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
      'TE Number', 'Txn Date', 'Month', 'Region', 'DDO Code', 'HO', 'Division', 'HOA', 'Description', 'Receipts', 'Payments', 'Remark'
    ];
    csvRows.push(header.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    filteredElekhaData.forEach(row => {
      const line = [
        row['TE Number'], row['Txn Date'], row['Month'], row['Region'], row['DDO Code'], row['HO'], row['Division'], row['HOA'], row['Description'],
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
              <th>TE Number</th>
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
          <td>${row['TE Number'] || '–'}</td>
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
      <div className="loader-container cebar-loader" style={{ minHeight: '80vh' }}>
        <div className="seal-loader">
          <div className="seal-ring ring-outer"></div>
          <div className="seal-ring ring-inner"></div>
          <div className="seal-core">🪙</div>
        </div>
        <h2 className="loader-title">CEBAR</h2>
        <p className="loader-subtitle">Consolidated Expenditure & Budget Analysis Report</p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Loading financial intelligence data...</p>
      </div>
    );
  }

  // Mandatory Login Gate
  if (!currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDarkMode ? 'var(--bg-primary)' : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '1.5rem'
      }}>
        <div className="card shadow-glass" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="seal-loader" style={{ margin: '0 auto 1rem auto', width: '56px', height: '56px' }}>
              <div className="seal-core" style={{ fontSize: '1.8rem' }}>🪙</div>
            </div>
            <h1 className="header-title" style={{ fontSize: '1.8rem' }}>CEBAR</h1>
            <p className="header-subtitle" style={{ fontSize: '0.85rem' }}>Government of India Financial Portal</p>
          </div>

          <form onSubmit={handleLogin}>
            {loginError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} />
                <span>{loginError}</span>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Enter your username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="filter-input"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
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
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', justifyContent: 'center', fontWeight: 600 }}>
              Sign In to CEBAR
            </button>
          </form>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', margin: '0 auto' }}
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              <span>Toggle {isDarkMode ? 'Light' : 'Dark'} Mode</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Top Header */}
      <header style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="seal-loader" style={{ width: '40px', height: '40px' }}>
            <div className="seal-core" style={{ fontSize: '1.3rem' }}>🪙</div>
          </div>
          <div>
            <h1 className="header-title" style={{ fontSize: '1.4rem', margin: 0 }}>CEBAR</h1>
            <p className="header-subtitle" style={{ fontSize: '0.75rem', margin: 0 }}>Consolidated Expenditure & Budget Analysis Report</p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* User badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-card)',
            padding: '0.4rem 0.8rem',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem'
          }}>
            <User size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span style={{ fontWeight: 600 }}>{currentUser.username}</span>
            <span style={{
              fontSize: '0.7rem',
              padding: '0.1rem 0.4rem',
              borderRadius: '10px',
              background: currentUser.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
              color: currentUser.role === 'admin' ? '#ef4444' : '#3b82f6',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              {currentUser.role}
            </span>
          </div>

          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="btn btn-secondary"
            title="Change Password"
            style={{ padding: '0.5rem' }}
          >
            <Key size={16} />
          </button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="btn btn-secondary"
            title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
            style={{ padding: '0.5rem' }}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={handleLogout}
            className="btn btn-danger"
            title="Sign Out"
            style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <nav style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 2rem',
        display: 'flex',
        gap: '0.5rem'
      }}>
        <button
          className={`tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
          onClick={() => setActiveTab('budget')}
        >
          <BarChart2 size={16} />
          <span>Budget Performance</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'elekha' ? 'active' : ''}`}
          onClick={() => setActiveTab('elekha')}
        >
          <Coins size={16} />
          <span>e-Lekha Transactions</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'vertical' ? 'active' : ''}`}
          onClick={() => setActiveTab('vertical')}
        >
          <TrendingUp size={16} />
          <span>Vertical Revenue Report</span>
        </button>

        {currentUser.role === 'admin' && (
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <User size={16} />
            <span>User Management</span>
          </button>
        )}
      </nav>

      {/* Content Container */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
        
        {/* ========================================================= */}
        {/* TAB 1: BUDGET PERFORMANCE DASHBOARD */}
        {/* ========================================================= */}
        {activeTab === 'budget' && (
          <div>
            {/* Header / Title */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Budget Allotment & Consumption Analysis</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                  Monitoring APT vs e-Lekha expenditure across circles and Head of Account (HOA)
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleExportBudgetCSV} className="btn btn-secondary">
                  <Download size={16} />
                  <span>Export CSV</span>
                </button>
                <button onClick={handleExportBudgetExcel} className="btn btn-primary">
                  <Download size={16} />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <div className="card shadow-glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Total APT Alloted</p>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0.4rem 0 0 0', color: 'var(--text-primary)' }}>
                      {formatINR(budgetMetrics.totalAlloted)}
                    </h3>
                  </div>
                  <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.6rem', borderRadius: '12px', color: '#3b82f6' }}>
                    <BarChart2 size={22} />
                  </div>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Total budget allotted across filtered units
                </div>
              </div>

              <div className="card shadow-glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>APT Consumed</p>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0.4rem 0 0 0', color: '#10b981' }}>
                      {formatINR(budgetMetrics.totalAptConsumed)}
                    </h3>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.6rem', borderRadius: '12px', color: '#10b981' }}>
                    <TrendingUp size={22} />
                  </div>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong>{budgetMetrics.aptConsumedPct.toFixed(2)}%</strong> of allotted budget
                </div>
              </div>

              <div className="card shadow-glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>e-Lekha Consumed</p>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0.4rem 0 0 0', color: '#06b6d4' }}>
                      {formatINR(budgetMetrics.totalElekhaConsumed)}
                    </h3>
                  </div>
                  <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.6rem', borderRadius: '12px', color: '#06b6d4' }}>
                    <Coins size={22} />
                  </div>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong>{budgetMetrics.elekhaConsumedPct.toFixed(2)}%</strong> verified in e-Lekha
                </div>
              </div>

              <div className="card shadow-glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Variance (APT - e-Lekha)</p>
                    <h3 style={{
                      fontSize: '1.6rem',
                      fontWeight: 700,
                      margin: '0.4rem 0 0 0',
                      color: budgetMetrics.diff < 0 ? '#ef4444' : budgetMetrics.diff > 0 ? '#f59e0b' : 'var(--text-primary)'
                    }}>
                      {formatINR(budgetMetrics.diff)}
                    </h3>
                  </div>
                  <div style={{
                    background: budgetMetrics.diff < 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    padding: '0.6rem',
                    borderRadius: '12px',
                    color: budgetMetrics.diff < 0 ? '#ef4444' : '#f59e0b'
                  }}>
                    <AlertTriangle size={22} />
                  </div>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {budgetMetrics.diff === 0 ? 'Fully reconciled' : budgetMetrics.diff > 0 ? 'Unbooked APT balance' : 'Excess e-Lekha booking'}
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="card shadow-glass" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                
                {/* Search Input */}
                <div style={{ flex: '1 1 280px', position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Search by Office ID, Unit Name, HOA or Description..."
                    value={budgetSearchTerm}
                    onChange={(e) => {
                      setBudgetSearchTerm(e.target.value);
                      setBudgetPage(1);
                    }}
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                  />
                </div>

                {/* Region Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Region:</label>
                  <select
                    className="filter-select"
                    value={budgetRegionFilter}
                    onChange={(e) => {
                      setBudgetRegionFilter(e.target.value);
                      setBudgetPage(1);
                    }}
                  >
                    <option value="ALL">All Regions</option>
                    {budgetRegions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* HOA Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>HOA:</label>
                  <select
                    className="filter-select"
                    value={budgetHoaFilter}
                    onChange={(e) => {
                      setBudgetHoaFilter(e.target.value);
                      setBudgetPage(1);
                    }}
                  >
                    <option value="ALL">All Head of Accounts (HOA)</option>
                    {budgetHoas.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Reset Filters */}
                {(budgetRegionFilter !== 'ALL' || budgetHoaFilter !== 'ALL' || budgetSearchTerm !== '') && (
                  <button
                    onClick={() => {
                      setBudgetRegionFilter('ALL');
                      setBudgetHoaFilter('ALL');
                      setBudgetSearchTerm('');
                      setBudgetPage(1);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                  >
                    <RefreshCw size={14} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Data Table */}
            <div className="card shadow-glass" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Office ID</th>
                      <th>Unit Name (HO/Division)</th>
                      <th>Region</th>
                      <th>HOA Code</th>
                      <th>Description</th>
                      <th style={{ textAlign: 'right' }}>APT Alloted (₹)</th>
                      <th style={{ textAlign: 'right' }}>APT Consumed (₹)</th>
                      <th style={{ textAlign: 'right' }}>e-Lekha Consumed (₹)</th>
                      <th style={{ textAlign: 'right' }}>Diff (APT - e-Lekha)</th>
                      <th style={{ textAlign: 'center' }}>APT %</th>
                      <th style={{ textAlign: 'center' }}>e-Lekha %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBudgetData.length === 0 ? (
                      <tr>
                        <td colSpan="11" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                          No budget records match the selected filter criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedBudgetData.map((row, idx) => {
                        const alloted = parseNumber(row['APT Alloted']);
                        const aptCons = parseNumber(row['APT Consumed']);
                        const elekhaCons = parseNumber(row['e-lekha Consumed']);
                        const diff = parseNumber(row['Diff. (APT - e-Lekha)']);

                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row['Office ID'] || '–'}</td>
                            <td>{row['Name of Unit (HO/Division)'] || '–'}</td>
                            <td>
                              <span className="badge badge-info">{row.Region || '–'}</span>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-cyan)' }}>{row.HOA || '–'}</td>
                            <td style={{ maxWidth: '300px', whiteSpace: 'normal' }}>{row.Description || '–'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatIndianNumber(alloted)}</td>
                            <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{formatIndianNumber(aptCons)}</td>
                            <td style={{ textAlign: 'right', color: '#06b6d4', fontWeight: 600 }}>{formatIndianNumber(elekhaCons)}</td>
                            <td style={{
                              textAlign: 'right',
                              fontWeight: 700,
                              color: diff < 0 ? '#ef4444' : diff > 0 ? '#f59e0b' : 'var(--text-primary)'
                            }}>
                              {formatIndianNumber(diff)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`badge ${parseNumber(row['APT Consumed %']) > 100 ? 'badge-danger' : 'badge-success'}`}>
                                {row['APT Consumed %'] || '0.00%'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="badge badge-info">
                                {row['e-Lekha Consumed %'] || '0.00%'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Pagination */}
              <div style={{
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Showing <strong>{filteredBudgetData.length === 0 ? 0 : (budgetPage - 1) * budgetRowsPerPage + 1}</strong> to <strong>{Math.min(budgetPage * budgetRowsPerPage, filteredBudgetData.length)}</strong> of <strong>{filteredBudgetData.length}</strong> entries
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <span>Rows per page:</span>
                    <select
                      className="filter-select"
                      value={budgetRowsPerPage}
                      onChange={(e) => {
                        setBudgetRowsPerPage(Number(e.target.value));
                        setBudgetPage(1);
                      }}
                      style={{ padding: '0.25rem 0.5rem' }}
                    >
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setBudgetPage(prev => Math.max(prev - 1, 1))}
                      disabled={budgetPage === 1}
                      style={{ padding: '0.4rem 0.6rem' }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: '0.85rem', padding: '0 0.5rem', fontWeight: 600 }}>
                      Page {budgetPage} of {totalBudgetPages}
                    </span>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setBudgetPage(prev => Math.min(prev + 1, totalBudgetPages))}
                      disabled={budgetPage === totalBudgetPages}
                      style={{ padding: '0.4rem 0.6rem' }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: e-LEKHA TRANSACTIONS DASHBOARD */}
        {/* ========================================================= */}
        {activeTab === 'elekha' && (
          <div>
            {/* Header / Title */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>e-Lekha Financial Ledger & Transactions</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                  Granular receipts and payments data retrieved from e-Lekha government portal
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleExportElekhaCSV} className="btn btn-secondary">
                  <Download size={16} />
                  <span>Export CSV</span>
                </button>
                <button onClick={handleExportElekhaExcel} className="btn btn-primary">
                  <Download size={16} />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <div className="card shadow-glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Total Receipts</p>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0.4rem 0 0 0', color: '#10b981' }}>
                      {formatINR(elekhaMetrics.totalReceipts)}
                    </h3>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.6rem', borderRadius: '12px', color: '#10b981' }}>
                    <Coins size={22} />
                  </div>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Total gross revenue receipts
                </div>
              </div>

              <div className="card shadow-glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Total Payments</p>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0.4rem 0 0 0', color: '#ef4444' }}>
                      {formatINR(elekhaMetrics.totalPayments)}
                    </h3>
                  </div>
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '0.6rem', borderRadius: '12px', color: '#ef4444' }}>
                    <BarChart2 size={22} />
                  </div>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Total gross expenditure disbursements
                </div>
              </div>

              <div className="card shadow-glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Net Financial Cash Flow</p>
                    <h3 style={{
                      fontSize: '1.6rem',
                      fontWeight: 700,
                      margin: '0.4rem 0 0 0',
                      color: elekhaMetrics.netAmount >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      {formatINR(elekhaMetrics.netAmount)}
                    </h3>
                  </div>
                  <div style={{
                    background: elekhaMetrics.netAmount >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    padding: '0.6rem',
                    borderRadius: '12px',
                    color: elekhaMetrics.netAmount >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    <TrendingUp size={22} />
                  </div>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Receipts minus Payments balance
                </div>
              </div>

              <div className="card shadow-glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Filtered Transactions</p>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0.4rem 0 0 0', color: 'var(--text-primary)' }}>
                      {elekhaMetrics.totalTransactions.toLocaleString('en-IN')}
                    </h3>
                  </div>
                  <div style={{ background: 'rgba(147, 51, 234, 0.15)', padding: '0.6rem', borderRadius: '12px', color: '#9333ea' }}>
                    <FileText size={22} />
                  </div>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Total ledger line entries
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="card shadow-glass" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                
                {/* Search Input */}
                <div style={{ flex: '1 1 280px', position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Search TE Number, DDO, HO, Description, Remark..."
                    value={elekhaSearchTerm}
                    onChange={(e) => {
                      setElekhaSearchTerm(e.target.value);
                      setElekhaPage(1);
                    }}
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                  />
                </div>

                {/* Region Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Region:</label>
                  <select
                    className="filter-select"
                    value={elekhaRegionFilter}
                    onChange={(e) => {
                      setElekhaRegionFilter(e.target.value);
                      setElekhaPage(1);
                    }}
                  >
                    <option value="ALL">All Regions</option>
                    {elekhaRegions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* DDO Code Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>DDO Code:</label>
                  <select
                    className="filter-select"
                    value={elekhaDdoFilter}
                    onChange={(e) => {
                      setElekhaDdoFilter(e.target.value);
                      setElekhaPage(1);
                    }}
                  >
                    <option value="ALL">All DDO Codes</option>
                    {elekhaDdos.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* HOA Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>HOA:</label>
                  <select
                    className="filter-select"
                    value={elekhaHoaFilter}
                    onChange={(e) => {
                      setElekhaHoaFilter(e.target.value);
                      setElekhaPage(1);
                    }}
                  >
                    <option value="ALL">All HOA Codes</option>
                    {elekhaHoas.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Reset Filters */}
                {(elekhaRegionFilter !== 'ALL' || elekhaDdoFilter !== 'ALL' || elekhaHoaFilter !== 'ALL' || elekhaSearchTerm !== '') && (
                  <button
                    onClick={() => {
                      setElekhaRegionFilter('ALL');
                      setElekhaDdoFilter('ALL');
                      setElekhaHoaFilter('ALL');
                      setElekhaSearchTerm('');
                      setElekhaPage(1);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                  >
                    <RefreshCw size={14} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Data Table */}
            <div className="card shadow-glass" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>TE Number</th>
                      <th>Txn Date</th>
                      <th>Month</th>
                      <th>Region</th>
                      <th>DDO Code</th>
                      <th>HO</th>
                      <th>Division</th>
                      <th>HOA</th>
                      <th>Description</th>
                      <th style={{ textAlign: 'right' }}>Receipts (₹)</th>
                      <th style={{ textAlign: 'right' }}>Payments (₹)</th>
                      <th>Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedElekhaData.length === 0 ? (
                      <tr>
                        <td colSpan="12" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                          No e-Lekha transactions match the selected filter criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedElekhaData.map((row, idx) => {
                        const rec = parseNumber(row['Receipt (Rs.)']);
                        const pay = parseNumber(row['Payment (Rs.)']);

                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{row['TE Number'] || '–'}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{row['Txn Date'] || '–'}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{row['Month'] || '–'}</td>
                            <td>
                              <span className="badge badge-info">{row.Region || '–'}</span>
                            </td>
                            <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{row['DDO Code'] || '–'}</td>
                            <td>{row.HO || '–'}</td>
                            <td>{row.Division || '–'}</td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.HOA || '–'}</td>
                            <td style={{ maxWidth: '240px', whiteSpace: 'normal' }}>{row.Description || '–'}</td>
                            <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                              {rec > 0 ? formatIndianNumber(rec) : '–'}
                            </td>
                            <td style={{ textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>
                              {pay > 0 ? formatIndianNumber(pay) : '–'}
                            </td>
                            <td style={{ maxWidth: '180px', whiteSpace: 'normal', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                              {row.Remark || '–'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Pagination */}
              <div style={{
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Showing <strong>{filteredElekhaData.length === 0 ? 0 : (elekhaPage - 1) * elekhaRowsPerPage + 1}</strong> to <strong>{Math.min(elekhaPage * elekhaRowsPerPage, filteredElekhaData.length)}</strong> of <strong>{filteredElekhaData.length}</strong> entries
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <span>Rows per page:</span>
                    <select
                      className="filter-select"
                      value={elekhaRowsPerPage}
                      onChange={(e) => {
                        setElekhaRowsPerPage(Number(e.target.value));
                        setElekhaPage(1);
                      }}
                      style={{ padding: '0.25rem 0.5rem' }}
                    >
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setElekhaPage(prev => Math.max(prev - 1, 1))}
                      disabled={elekhaPage === 1}
                      style={{ padding: '0.4rem 0.6rem' }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: '0.85rem', padding: '0 0.5rem', fontWeight: 600 }}>
                      Page {elekhaPage} of {totalElekhaPages}
                    </span>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setElekhaPage(prev => Math.min(prev + 1, totalElekhaPages))}
                      disabled={elekhaPage === totalElekhaPages}
                      style={{ padding: '0.4rem 0.6rem' }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: VERTICAL REVENUE REPORT (MATRIX) */}
        {/* ========================================================= */}
        {activeTab === 'vertical' && (
          <div>
            {/* Header / Title */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Vertical Revenue Comparison Report</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                  Cross-period vertical revenue matrix categorized by HOA (CCS, FS, IRGB, MO, Parcel) across units
                </p>
              </div>
              
              {generatedConfig && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={handleExportCSV} className="btn btn-secondary">
                    <Download size={16} />
                    <span>Export CSV</span>
                  </button>
                  <button onClick={handleExportExcel} className="btn btn-primary">
                    <Download size={16} />
                    <span>Export Excel</span>
                  </button>
                </div>
              )}
            </div>

            {/* Setup Control Panel Card */}
            <div className="card shadow-glass" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                Report Parameters & Period Setup
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                
                {/* 1. Comparison Mode Toggle */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    1. Comparison Type
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn ${comparisonType === 'Month' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setComparisonType('Month')}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Month Range
                    </button>
                    <button
                      type="button"
                      className={`btn ${comparisonType === 'DateRange' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setComparisonType('DateRange')}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Custom Dates
                    </button>
                  </div>
                </div>

                {/* 2. Region & HO Unit Selector */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    2. Region Filter
                  </label>
                  <select
                    className="filter-select"
                    value={selectedRegion}
                    onChange={(e) => {
                      setSelectedRegion(e.target.value);
                      setSelectedUnits([]); // Reset selected units
                    }}
                    style={{ width: '100%' }}
                  >
                    <option value="ALL">All Regions</option>
                    {verticalRegions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* 3. Detail vs Summary Type */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    3. Report Format
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn ${reportType === 'Detail' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setReportType('Detail')}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Detail (HOA Wise)
                    </button>
                    <button
                      type="button"
                      className={`btn ${reportType === 'Summary' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setReportType('Summary')}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Summary Only
                    </button>
                  </div>
                </div>

              </div>

              {/* Period selection inputs */}
              <div style={{
                marginTop: '1.25rem',
                paddingTop: '1.25rem',
                borderTop: '1px dashed var(--border-color)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem'
              }}>
                {/* Period 1 selection */}
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Period 1 (P1) Range</span>
                  </h4>
                  {comparisonType === 'Month' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>From Month:</label>
                        <input type="month" className="filter-input" value={p1FromMonth} onChange={e => setP1FromMonth(e.target.value)} style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>To Month:</label>
                        <input type="month" className="filter-input" value={p1ToMonth} onChange={e => setP1ToMonth(e.target.value)} style={{ width: '100%' }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>From Date:</label>
                        <input type="date" className="filter-input" value={p1FromDate} onChange={e => setP1FromDate(e.target.value)} style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>To Date:</label>
                        <input type="date" className="filter-input" value={p1ToDate} onChange={e => setP1ToDate(e.target.value)} style={{ width: '100%' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Period 2 selection */}
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Period 2 (P2) Range</span>
                  </h4>
                  {comparisonType === 'Month' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>From Month:</label>
                        <input type="month" className="filter-input" value={p2FromMonth} onChange={e => setP2FromMonth(e.target.value)} style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>To Month:</label>
                        <input type="month" className="filter-input" value={p2ToMonth} onChange={e => setP2ToMonth(e.target.value)} style={{ width: '100%' }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>From Date:</label>
                        <input type="date" className="filter-input" value={p2FromDate} onChange={e => setP2FromDate(e.target.value)} style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>To Date:</label>
                        <input type="date" className="filter-input" value={p2ToDate} onChange={e => setP2ToDate(e.target.value)} style={{ width: '100%' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Specific HO Multi-select Filter */}
              <div style={{ marginTop: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                  Filter Specific Head Offices (HO) (Optional - leave unchecked for ALL):
                </label>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  maxHeight: '110px',
                  overflowY: 'auto',
                  padding: '0.5rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)'
                }}>
                  {availableUnitsForRegion.map(unit => {
                    const isChecked = selectedUnits.includes(unit);
                    return (
                      <button
                        type="button"
                        key={unit}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedUnits(selectedUnits.filter(u => u !== unit));
                          } else {
                            setSelectedUnits([...selectedUnits, unit]);
                          }
                        }}
                        style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '14px',
                          fontSize: '0.8rem',
                          border: isChecked ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          background: isChecked ? 'rgba(6, 182, 212, 0.2)' : 'var(--bg-card)',
                          color: isChecked ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        {unit} {isChecked ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generate Action Button */}
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleGenerateReport}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 2rem', fontWeight: 700, fontSize: '0.95rem' }}
                >
                  <RefreshCw size={18} />
                  <span>Generate Matrix Report</span>
                </button>
              </div>
            </div>

            {/* Generated Matrix Table View */}
            {!verticalRevenueReportData ? (
              <div className="card shadow-glass" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-tertiary)' }}>
                <TrendingUp size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <h3 style={{ color: 'var(--text-secondary)' }}>No Report Generated Yet</h3>
                <p style={{ maxWidth: '500px', margin: '0.5rem auto 0 auto', fontSize: '0.9rem' }}>
                  Please select your desired period parameters above and click <strong>"Generate Matrix Report"</strong> to compute the vertical revenue matrix.
                </p>
              </div>
            ) : (
              <div className="card shadow-glass" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="custom-table vertical-matrix-table">
                    <thead>
                      <tr>
                        <th rowSpan="2" style={{ verticalAlign: 'middle', borderRight: '1px solid var(--border-color)' }}>Category</th>
                        <th rowSpan="2" style={{ verticalAlign: 'middle', borderRight: '1px solid var(--border-color)' }}>HOA</th>
                        <th rowSpan="2" style={{ verticalAlign: 'middle', borderRight: '1px solid var(--border-color)', minWidth: '220px' }}>Description</th>
                        
                        {verticalRevenueReportData.uniqueUnits.map(g => (
                          <th key={g.name} colSpan="2" style={{ textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>
                            {g.label}
                          </th>
                        ))}
                        
                        <th colSpan="2" style={{ textAlign: 'center', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--text-primary)' }}>
                          Gross Total
                        </th>
                      </tr>
                      <tr>
                        {verticalRevenueReportData.uniqueUnits.map(g => (
                          <React.Fragment key={g.name}>
                            <th style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{getPeriodLabel(1)}</th>
                            <th style={{ textAlign: 'right', fontSize: '0.75rem', color: '#10b981', borderRight: '1px solid var(--border-color)' }}>{getPeriodLabel(2)}</th>
                          </React.Fragment>
                        ))}
                        <th style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--accent-cyan)', background: 'rgba(59, 130, 246, 0.15)' }}>{getPeriodLabel(1)}</th>
                        <th style={{ textAlign: 'right', fontSize: '0.75rem', color: '#10b981', background: 'rgba(59, 130, 246, 0.15)' }}>{getPeriodLabel(2)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verticalRevenueReportData.categoriesOrder.map(cat => {
                        const hoas = verticalRevenueReportData.groupedHoas[cat] || [];
                        const isDetail = generatedConfig.reportType === 'Detail';
                        const catCls = cat.toLowerCase();

                        return (
                          <React.Fragment key={cat}>
                            {/* Detail HOA Rows */}
                            {isDetail && hoas.map(hoa => {
                              const hoaCode = String(hoa['HOA Code'] || '').trim();
                              return (
                                <tr key={hoaCode} className={`${catCls}-row`}>
                                  <td style={{ fontWeight: 600, borderRight: '1px solid var(--border-color)' }}>{cat}</td>
                                  <td style={{ fontFamily: 'monospace', fontWeight: 600, borderRight: '1px solid var(--border-color)' }}>{hoaCode}</td>
                                  <td style={{ borderRight: '1px solid var(--border-color)' }}>{hoa['Description']}</td>
                                  
                                  {verticalRevenueReportData.uniqueUnits.map(g => {
                                    const v1 = verticalRevenueReportData.p1Totals[`${hoaCode}_${g.name}`] || 0;
                                    const v2 = verticalRevenueReportData.p2Totals[`${hoaCode}_${g.name}`] || 0;
                                    return (
                                      <React.Fragment key={g.name}>
                                        <td style={{ textAlign: 'right' }}>{v1 !== 0 ? formatIndianNumber(v1) : '–'}</td>
                                        <td style={{ textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>{v2 !== 0 ? formatIndianNumber(v2) : '–'}</td>
                                      </React.Fragment>
                                    );
                                  })}

                                  {/* HOA Row Gross */}
                                  <td style={{ textAlign: 'right', fontWeight: 600, background: 'rgba(255,255,255,0.03)' }}>
                                    {verticalRevenueReportData.rowP1Gross[hoaCode] !== 0 ? formatIndianNumber(verticalRevenueReportData.rowP1Gross[hoaCode]) : '–'}
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 600, background: 'rgba(255,255,255,0.03)' }}>
                                    {verticalRevenueReportData.rowP2Gross[hoaCode] !== 0 ? formatIndianNumber(verticalRevenueReportData.rowP2Gross[hoaCode]) : '–'}
                                  </td>
                                </tr>
                              );
                            })}

                            {/* Subtotal Row per Category */}
                            <tr className={`${catCls}-total`} style={{ fontWeight: 700 }}>
                              <td colSpan="3" style={{ borderRight: '1px solid var(--border-color)' }}>
                                {cat} Total Subtotal
                              </td>
                              
                              {verticalRevenueReportData.uniqueUnits.map(g => {
                                const c1 = verticalRevenueReportData.p1CatTotals[`${cat}_${g.name}`] || 0;
                                const c2 = verticalRevenueReportData.p2CatTotals[`${cat}_${g.name}`] || 0;
                                return (
                                  <React.Fragment key={g.name}>
                                    <td style={{ textAlign: 'right' }}>{c1 !== 0 ? formatIndianNumber(c1) : '–'}</td>
                                    <td style={{ textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>{c2 !== 0 ? formatIndianNumber(c2) : '–'}</td>
                                  </React.Fragment>
                                );
                              })}

                              <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                {formatIndianNumber(verticalRevenueReportData.catP1Gross[cat] || 0)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                {formatIndianNumber(verticalRevenueReportData.catP2Gross[cat] || 0)}
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}

                      {/* Grand Total Row */}
                      <tr className="grand-total-row">
                        <td colSpan="3" style={{ borderRight: '1px solid var(--border-color)', fontSize: '0.95rem' }}>
                          GROSS TOTAL REVENUE
                        </td>
                        
                        {verticalRevenueReportData.uniqueUnits.map(g => (
                          <React.Fragment key={g.name}>
                            <td style={{ textAlign: 'right' }}>
                              {formatIndianNumber(verticalRevenueReportData.unitP1Gross[g.name] || 0)}
                            </td>
                            <td style={{ textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                              {formatIndianNumber(verticalRevenueReportData.unitP2Gross[g.name] || 0)}
                            </td>
                          </React.Fragment>
                        ))}

                        <td style={{ textAlign: 'right', fontSize: '1rem' }}>
                          {formatIndianNumber(verticalRevenueReportData.grandP1Gross)}
                        </td>
                        <td style={{ textAlign: 'right', fontSize: '1rem' }}>
                          {formatIndianNumber(verticalRevenueReportData.grandP2Gross)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: USER MANAGEMENT (ADMIN ONLY) */}
        {/* ========================================================= */}
        {activeTab === 'settings' && currentUser?.role === 'admin' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>User Access & Role Management</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                Control platform user accounts and permissions stored in Supabase database
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              
              {/* Add User Card */}
              <div className="card shadow-glass" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={18} style={{ color: 'var(--accent-cyan)' }} />
                  <span>Create New User Account</span>
                </h3>

                <form onSubmit={handleAddUser}>
                  {userManagementError && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                      {userManagementError}
                    </div>
                  )}
                  {userManagementSuccess && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                      {userManagementSuccess}
                    </div>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                      Username
                    </label>
                    <input
                      type="text"
                      className="filter-input"
                      placeholder="e.g. jdoe"
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                      Initial Password
                    </label>
                    <input
                      type="password"
                      className="filter-input"
                      placeholder="Set password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                      Role
                    </label>
                    <select
                      className="filter-select"
                      value={newRole}
                      onChange={e => setNewRole(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="user">Standard User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    <Plus size={16} />
                    <span>Add User to Supabase</span>
                  </button>
                </form>
              </div>

              {/* Users List Table Card */}
              <div className="card shadow-glass" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={18} style={{ color: 'var(--accent-cyan)' }} />
                  <span>Existing User Accounts ({usersList.length})</span>
                </h3>

                <div style={{ overflowX: 'auto' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((user) => (
                        <tr key={user.id || user.username}>
                          <td style={{ fontWeight: 600 }}>{user.username}</td>
                          <td>
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '10px',
                              background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                              color: user.role === 'admin' ? '#ef4444' : '#3b82f6',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}>
                              {user.role}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteUser(user.username)}
                              className="btn btn-danger"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                              disabled={user.username === currentUser.username}
                              title={user.username === currentUser.username ? "Cannot delete self" : "Delete user"}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="card shadow-glass" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={18} style={{ color: 'var(--accent-cyan)' }} />
              <span>Change Password</span>
            </h3>

            <form onSubmit={handleChangePassword}>
              {passwordChangeError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  {passwordChangeError}
                </div>
              )}
              {passwordChangeSuccess && (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  {passwordChangeSuccess}
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  className="filter-input"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  New Password
                </label>
                <input
                  type="password"
                  className="filter-input"
                  placeholder="Enter new password"
                  value={newPasswordChange}
                  onChange={e => setNewPasswordChange(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="filter-input"
                  placeholder="Confirm new password"
                  value={confirmPasswordChange}
                  onChange={e => setConfirmPasswordChange(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        padding: '1rem 2rem',
        textAlign: 'center',
        color: 'var(--text-tertiary)',
        fontSize: '0.8rem'
      }}>
        CEBAR © 2026 Consolidated Expenditure & Budget Analysis Report • Government Financial System
      </footer>
    </div>
  );
}
