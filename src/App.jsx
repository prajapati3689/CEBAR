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
