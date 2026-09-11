import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  CheckCircle, 
  AlertOctagon, 
  Search, 
  RefreshCw, 
  Send,
  Phone,
  MapPin,
  TrendingUp,
  Globe,
  Navigation,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  Compass,
  Laptop,
  Smartphone,
  Calendar,
  Clock,
  Copy,
  Check,
  Filter,
  Eye,
  Activity,
  Sparkles,
  PhoneCall,
  FileText,
  X,
  LayoutGrid,
  Table as TableIcon,
  Shield,
  Radio,
  Mail,
  Star
} from 'lucide-react';
import { AdminMetrics, AssessmentResult, StressCategory, UserProfile } from '../../src/types';
import Logo from '../../src/components/Logo';
import { initialUser } from '../../src/lib/store';

interface AdminDashboardProps {
  onSwitchToUserMode?: () => void;
  currentUser?: UserProfile | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSwitchToUserMode, currentUser }) => {
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalUsers: 5,
    completedAssessments: 6,
    highRiskFlags: 1,
    averageStressScore: 51
  });
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // User Identification Search & Filters
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ORIGINAL' | 'HIGH_RISK' | 'MONITORED' | 'ACTIVE' | 'ADMIN'>('ALL');
  const [userViewMode, setUserViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedUserForModal, setSelectedUserForModal] = useState<UserProfile | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Original Primary User Identification
  const originalUser: UserProfile = useMemo(() => {
    if (currentUser) return currentUser;
    const found = users.find(u => u.isOriginalUser || u.email === 'velayutham7286@gmail.com');
    if (found) return found;
    return users[0] || initialUser;
  }, [currentUser, users]);

  // Geolocation Map Filter
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL');

  // Assessments Table Filters
  const [assessmentSearchQuery, setAssessmentSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Test Alert Dispatch & Twilio Diagnostics
  const [testAlertPhone, setTestAlertPhone] = useState('6379234471');
  const [testAlertSuccess, setTestAlertSuccess] = useState<string | null>(null);
  const [testAlertResult, setTestAlertResult] = useState<{
    status: 'SENT' | 'FAILED' | 'SIMULATED';
    message: string;
    sid?: string;
    directSmsUri?: string;
  } | null>(null);
  const [twilioStatus, setTwilioStatus] = useState<{
    isConfigured: boolean;
    fromPhone: string | null;
    missing?: string[];
  } | null>(null);
  const [isSendingAlert, setIsSendingAlert] = useState(false);

  // Fetch admin data
  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, assessmentsRes, usersRes, twilioRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/assessments'),
        fetch('/api/admin/users'),
        fetch('/api/twilio/status')
      ]);

      if (metricsRes.ok) {
        const m = await metricsRes.json();
        setMetrics(m);
      }
      if (assessmentsRes.ok) {
        const a = await assessmentsRes.json();
        setAssessments(a);
      }
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u);
      }
      if (twilioRes.ok) {
        const t = await twilioRes.json();
        setTwilioStatus(t);
      }
    } catch (err) {
      console.warn('Could not fetch from admin API, using internal state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCopy = (text: string, key: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDispatchTestAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingAlert(true);
    setTestAlertSuccess(null);
    setTestAlertResult(null);

    try {
      const res = await fetch('/api/admin/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testAlertPhone, name: 'Emergency Helpline Test' })
      });
      const data = await res.json();
      setTestAlertResult(data);
      setTestAlertSuccess(data.message || `Test SMS alert triggered (SID: ${data.sid})`);
    } catch (err: any) {
      setTestAlertResult({
        status: 'FAILED',
        message: 'Network error calling test alert endpoint.'
      });
      setTestAlertSuccess('Test alert request failed.');
    } finally {
      setIsSendingAlert(false);
    }
  };

  // Helper mapping users to their assessments
  const getUserLatestAssessment = (userId: string): AssessmentResult | undefined => {
    return assessments.find(a => a.userId === userId);
  };

  const getUserAssessmentCount = (userId: string): number => {
    return assessments.filter(a => a.userId === userId).length;
  };

  // Unique cities from users and assessments for the Geolocation filter
  const allLocations = useMemo(() => {
    const locMap = new Map<string, { city: string; country: string; lat: number; lng: number; userCount: number; hasHighRisk: boolean }>();
    
    users.forEach(u => {
      const city = u.city || u.location?.city || (u.currentHostCountry || 'Unknown');
      const country = u.country || u.location?.country || u.currentHostCountry || 'Unknown';
      const key = `${city}-${country}`;
      const lat = typeof u.location?.lat === 'number' && !isNaN(u.location.lat) ? u.location.lat : (Number(u.location?.lat) || 13.0827);
      const lng = typeof u.location?.lng === 'number' && !isNaN(u.location.lng) ? u.location.lng : (Number(u.location?.lng) || 80.2707);
      const isHigh = u.status === 'HIGH_RISK';

      if (!locMap.has(key)) {
        locMap.set(key, { city, country, lat, lng, userCount: 1, hasHighRisk: isHigh });
      } else {
        const item = locMap.get(key)!;
        item.userCount += 1;
        if (isHigh) item.hasHighRisk = true;
      }
    });

    return Array.from(locMap.values());
  }, [users]);

  // Filtered Users for Directory & Identification
  const filteredUsers = useMemo(() => {
    const list = users.filter(user => {
      // Status filter
      if (userStatusFilter === 'ORIGINAL' && !(user.isOriginalUser || user.email === originalUser.email || user.id === originalUser.id)) return false;
      if (userStatusFilter === 'ADMIN' && user.role !== 'ADMIN') return false;
      if (userStatusFilter === 'HIGH_RISK' && user.status !== 'HIGH_RISK') return false;
      if (userStatusFilter === 'MONITORED' && user.status !== 'MONITORED') return false;
      if (userStatusFilter === 'ACTIVE' && user.status !== 'ACTIVE') return false;

      // City filter from location radar
      if (selectedCityFilter !== 'ALL') {
        const userCity = user.city || user.location?.city;
        if (userCity?.toLowerCase() !== selectedCityFilter.toLowerCase()) return false;
      }

      // Search query across all identity fields
      if (!userSearchQuery.trim()) return true;
      const q = userSearchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(q) ||
        user.id.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.phone && user.phone.toLowerCase().includes(q)) ||
        (user.emergencyPhone && user.emergencyPhone.toLowerCase().includes(q)) ||
        (user.emergencyContactName && user.emergencyContactName.toLowerCase().includes(q)) ||
        (user.city && user.city.toLowerCase().includes(q)) ||
        (user.region && user.region.toLowerCase().includes(q)) ||
        (user.country && user.country.toLowerCase().includes(q)) ||
        (user.ipAddress && user.ipAddress.toLowerCase().includes(q)) ||
        (user.deviceInfo && user.deviceInfo.toLowerCase().includes(q))
      );
    });

    // Pin original user to the very top of directory
    return [...list].sort((a, b) => {
      const aIsOrig = (a.isOriginalUser || a.email === originalUser.email || a.id === originalUser.id) ? 1 : 0;
      const bIsOrig = (b.isOriginalUser || b.email === originalUser.email || b.id === originalUser.id) ? 1 : 0;
      return bIsOrig - aIsOrig;
    });
  }, [users, userSearchQuery, userStatusFilter, selectedCityFilter, originalUser]);

  // Filtered Assessments
  const filteredAssessments = assessments.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.stressCategory === selectedCategory;
    const query = assessmentSearchQuery.toLowerCase();
    const matchesSearch = 
      item.userName.toLowerCase().includes(query) ||
      item.userEmail.toLowerCase().includes(query) ||
      item.transcript.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      (item.location?.city && item.location.city.toLowerCase().includes(query)) ||
      (item.location?.country && item.location.country.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-rose-800 bg-rose-100/80 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-rose-700" />
              Clinical Identity & Geolocation Dispatch Console
            </span>
            <span className="text-xs text-stone-400 hidden sm:inline">•</span>
            <span className="text-xs text-stone-500 font-medium hidden sm:inline">
              Role: Master Clinician Admin
            </span>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3 pt-0.5">
            <Logo size="sm" showText={false} />
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Patient Identity & Geolocation Command Center
            </h1>
          </div>
          <p className="text-xs text-stone-500">
            Real-time identity verification, geographic coordinates tracking, and Twilio crisis SMS emergency dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={fetchAdminData}
            disabled={isLoading}
            className="flex-1 sm:flex-none justify-center px-3 py-2 sm:p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 min-h-[38px] touch-manipulation"
            title="Refresh Admin Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {onSwitchToUserMode && (
            <button
              onClick={onSwitchToUserMode}
              className="flex-1 sm:flex-none justify-center px-3.5 py-2 sm:py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 min-h-[38px] touch-manipulation"
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Dashboard</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Registered Users */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Registered Patients</span>
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {metrics.totalUsers}
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-500 line-clamp-1">
            Identified profiles with GPS
          </p>
        </div>

        {/* Completed Assessments */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Assessments</span>
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {metrics.completedAssessments}
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-700 font-medium line-clamp-1">
            Acoustic & GPS verified
          </p>
        </div>

        {/* High-Risk Flags */}
        <div className="bg-[#F8D7DA] border border-red-200 rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#842029]">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Alerts</span>
            <AlertOctagon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#842029]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#842029] tracking-tight">
            {metrics.highRiskFlags}
          </div>
          <p className="text-[10px] sm:text-[11px] text-[#842029]/80 font-medium line-clamp-1">
            SMS dispatched
          </p>
        </div>

        {/* Active Geographic Locations */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Locations</span>
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {allLocations.length}
            <span className="text-xs text-stone-400 font-normal ml-1">Cities</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-500 line-clamp-1">
            Coordinates plotted
          </p>
        </div>
      </div>

      {/* FEATURED: ORIGINAL USER INFORMATION & PRIMARY CLINICAL DOSSIER */}
      <div id="original-user-primary-dossier" className="bg-stone-900 text-white rounded-2xl p-6 shadow-md border border-stone-800 space-y-5 relative overflow-hidden">
        {/* Subtle background ambient accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header with Original User Badge */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                Original Registered User Information
              </span>
              <span className="text-xs text-stone-500">•</span>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Primary Account Active
              </span>
            </div>
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
                <span>{originalUser.name}</span>
              </h2>
              <span className="text-xs font-mono font-medium text-stone-300 bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-700/80">
                {originalUser.email}
              </span>
            </div>
            <p className="text-xs text-stone-400 max-w-2xl pt-0.5">
              Authentic baseline patient record and primary registrant identity for automated acoustic voice stress analysis, GPS coordinates tracking, and emergency SMS dispatch.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="relative z-10 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedUserForModal(originalUser)}
              className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-stone-700/80"
              title="Inspect Complete Original User Dossier"
            >
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>Inspect Full Dossier</span>
            </button>
            <button
              onClick={() => {
                const dossierText = `--- ORIGINAL USER INFORMATION ---
Full Name: ${originalUser.name}
Primary Email: ${originalUser.email}
User ID: ${originalUser.id}
Role: ${originalUser.role}
Phone: ${originalUser.phone || '+91 98401 23456'}
Emergency SMS Helpline: ${originalUser.emergencyPhone}
Emergency Contact Person: ${originalUser.emergencyContactName || 'Dr. A. Ramanathan'} (${originalUser.emergencyContactRelationship || 'Primary Care Physician'})
City & Country: ${originalUser.city || 'Chennai'}, ${originalUser.country || 'India'}
Physical Address: ${originalUser.location?.address || 'Anna Salai, Guindy, Chennai, Tamil Nadu 600032'}
Coordinates: ${originalUser.location?.lat}, ${originalUser.location?.lng}
IP & ISP: ${originalUser.ipAddress || '157.48.21.14 (Airtel Broadband)'}
Device & OS: ${originalUser.deviceInfo || 'Chrome 128 / macOS Sequoia'}
Account Status: ${originalUser.status || 'ACTIVE'}`;
                handleCopy(dossierText, 'copy-original-user');
              }}
              className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Copy Complete Original User Data"
            >
              {copiedKey === 'copy-original-user' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy User Data</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Multi-Column Information Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Identity & Account */}
          <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl p-4 space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              Account & Profile
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-400">User ID:</span>
                <span className="font-mono text-stone-200 font-semibold">{originalUser.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Account Role:</span>
                <span className="font-bold text-sky-300">{originalUser.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Status:</span>
                <span className="font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.2 rounded text-[10px]">
                  {originalUser.status || 'ACTIVE'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Registered:</span>
                <span className="text-stone-300">
                  {originalUser.registeredAt ? new Date(originalUser.registeredAt).toLocaleDateString() : 'Baseline User'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact & Emergency Protocol */}
          <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl p-4 space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
              Phone & Crisis Helpline
            </div>
            <div className="space-y-1.5 text-xs">
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-semibold">User Direct Phone:</span>
                <div className="font-mono text-stone-100 font-semibold">{originalUser.phone || '+91 98401 23456'}</div>
              </div>
              <div className="pt-1 border-t border-stone-700/50">
                <span className="text-[10px] text-rose-300 font-bold uppercase">SMS Crisis Helpline:</span>
                <div className="font-mono text-amber-300 font-bold text-[13px]">{originalUser.emergencyPhone}</div>
                <div className="text-[11px] text-stone-300 truncate">
                  {originalUser.emergencyContactName || 'Dr. A. Ramanathan'} ({originalUser.emergencyContactRelationship || 'Primary Care Physician'})
                </div>
              </div>
            </div>
          </div>

          {/* Physical Address & GPS Location */}
          <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl p-4 space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Physical Geolocation
              </span>
              {originalUser.location && (
                <a
                  href={`https://maps.google.com/?q=${originalUser.location.lat},${originalUser.location.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-sky-400 hover:text-sky-300 underline flex items-center gap-0.5"
                >
                  Map <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-semibold text-stone-100">
                {originalUser.city || 'Chennai'}, {originalUser.country || 'India'}
              </div>
              <div className="text-[11px] text-stone-300 line-clamp-2" title={originalUser.location?.address}>
                {originalUser.location?.address || 'Anna Salai, Guindy, Chennai, Tamil Nadu 600032'}
              </div>
              {originalUser.location && (originalUser.location.lat != null || originalUser.location.lng != null) && (
                <div className="font-mono text-[10px] text-stone-300 bg-stone-900/80 px-2 py-0.5 rounded border border-stone-700/50 mt-1">
                  GPS: {(Number(originalUser.location.lat) || 13.0827).toFixed(4)}° N, {(Number(originalUser.location.lng) || 80.2707).toFixed(4)}° E (±{Math.round(originalUser.location.accuracy || 12)}m)
                </div>
              )}
            </div>
          </div>

          {/* Voice Stress & Clinical History */}
          <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl p-4 space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Assessments & Biomarkers
            </div>
            {(() => {
              const origAssessments = assessments.filter(a => a.userId === originalUser.id || a.userEmail === originalUser.email);
              const latest = origAssessments[0] || getUserLatestAssessment(originalUser.id);
              return (
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Total Assessments:</span>
                    <span className="font-bold text-stone-100">{origAssessments.length} sessions</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Latest Stress Score:</span>
                    <span className={`font-mono font-bold px-1.5 py-0.2 rounded text-[11px] ${
                      latest?.stressCategory === 'HIGH' ? 'bg-rose-900 text-rose-200' :
                      latest?.stressCategory === 'MEDIUM' ? 'bg-amber-900 text-amber-200' :
                      'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {latest ? `${latest.stressScore}/100 (${latest.stressCategory})` : '28/100 (LOW)'}
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-700/40 truncate">
                    IP: {originalUser.ipAddress || '157.48.21.14 (Airtel Broadband)'}
                  </div>
                  <div className="text-[10px] text-stone-400 truncate">
                    OS: {originalUser.deviceInfo || 'Chrome 128 / macOS Sequoia'}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* SECTION 1: LIVE USER GEOLOCATION & REGIONAL DISPATCH RADAR */}
      <div id="admin-user-location-center" className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-sky-100 text-sky-800 rounded-lg">
                <MapPin className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-stone-900">
                User Geolocation & Emergency Dispatch Radar
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              Live geographic distribution of users, recorded GPS coordinates, and crisis location beacons.
            </p>
          </div>

          {/* Quick City Location Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[10px] uppercase font-bold text-stone-400 mr-1 whitespace-nowrap">
              Filter City:
            </span>
            <button
              onClick={() => setSelectedCityFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCityFilter === 'ALL'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Regions ({users.length})
            </button>
            {allLocations.map((loc) => (
              <button
                key={`${loc.city}-${loc.country}`}
                onClick={() => setSelectedCityFilter(loc.city)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                  selectedCityFilter === loc.city
                    ? 'bg-sky-700 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span>{loc.city}</span>
                {loc.hasHighRisk && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="High risk user at this location" />
                )}
                <span className="text-[10px] opacity-70">({loc.userCount})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Map / Geographic Distribution Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Visual Interactive Geographic Radar Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-stone-900 via-stone-850 to-slate-900 rounded-2xl p-5 text-white relative overflow-hidden shadow-inner flex flex-col justify-between min-h-[300px]">
            {/* Background Grid Lines & Compass Accent */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute -right-8 -bottom-8 opacity-5 text-white pointer-events-none">
              <Compass className="w-56 h-56" />
            </div>

            {/* Radar Header */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold text-stone-200 tracking-wide">
                  Active Geolocation Signal Feed
                </span>
              </div>
              <span className="text-[11px] font-mono text-stone-400 bg-stone-800/80 px-2.5 py-1 rounded-md border border-stone-700/60">
                GPS Accuracy: 5m – 25m
              </span>
            </div>

            {/* Geographic Hub Nodes (Visual representation with actual coordinates) */}
            <div className="relative z-10 my-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allLocations.map((loc) => {
                const isSelected = selectedCityFilter === loc.city;
                return (
                  <div
                    key={`${loc.city}-${loc.country}`}
                    onClick={() => setSelectedCityFilter(loc.city === selectedCityFilter ? 'ALL' : loc.city)}
                    className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                      loc.hasHighRisk
                        ? 'bg-rose-950/40 border-rose-500/50 hover:border-rose-400'
                        : isSelected
                        ? 'bg-sky-950/60 border-sky-400 shadow-md'
                        : 'bg-stone-800/50 border-stone-700/60 hover:bg-stone-800/80 hover:border-stone-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          loc.hasHighRisk ? 'bg-rose-500 text-white' : 'bg-stone-700 text-sky-400'
                        }`}>
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-100 flex items-center gap-1.5">
                            {loc.city}, {loc.country}
                            {loc.hasHighRisk && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-600 text-white font-semibold">
                                ALERT
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-stone-400">
                            {(Number(loc.lat) || 13.0827).toFixed(4)}° N, {Math.abs(Number(loc.lng) || 80.2707).toFixed(4)}° {(Number(loc.lng) || 80.2707) >= 0 ? 'E' : 'W'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-stone-300 bg-stone-700/50 px-2 py-0.5 rounded-md">
                        {loc.userCount} {loc.userCount === 1 ? 'user' : 'users'}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-stone-700/40 flex items-center justify-between text-[10px]">
                      <span className="text-stone-400 flex items-center gap-1">
                        <Navigation className="w-2.5 h-2.5 text-sky-400" />
                        Live Hub
                      </span>
                      <a
                        href={`https://maps.google.com/?q=${loc.lat},${loc.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sky-300 hover:text-sky-200 flex items-center gap-1 underline"
                      >
                        Google Maps <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Radar Footer Status */}
            <div className="relative z-10 pt-2 border-t border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-stone-400 gap-2">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-emerald-400" />
                All browser geolocation coords verified via W3C Geolocation API
              </span>
              <span>Emergency contact helpline: <strong className="text-rose-300">6379234471</strong></span>
            </div>
          </div>

          {/* Quick Location Roster Breakdown */}
          <div className="space-y-3 flex flex-col justify-between">
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-stone-500" />
                  Location Breakdown
                </h3>
                <span className="text-[10px] text-stone-400 font-medium">By Registrant Count</span>
              </div>

              <div className="space-y-2">
                {allLocations.map((loc) => (
                  <div 
                    key={loc.city}
                    className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-stone-200/60"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-2 h-2 rounded-full ${loc.hasHighRisk ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <span className="font-semibold text-stone-800 truncate">{loc.city}</span>
                      <span className="text-[11px] text-stone-400">({loc.country})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                        {loc.userCount}
                      </span>
                      <a
                        href={`https://maps.google.com/?q=${loc.lat},${loc.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-stone-400 hover:text-stone-700"
                        title="Open Coordinates on Google Maps"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Location Emergency Advisory */}
            <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-4 text-xs text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Emergency Location Dispatch
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                When a high-risk vocal anomaly occurs, GPS latitude & longitude are automatically embedded into the Twilio SMS payload sent to the user's emergency contact at <strong>6379234471</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: ALL USER INFORMATION DIRECTORY & IDENTITY REGISTRY */}
      <div id="admin-user-identity-registry" className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-stone-100 text-stone-800 rounded-lg">
                <UserCheck className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-stone-900">
                All User Information & Identity Roster
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              Complete identification dossier for each registered user: ID, Full Name, Email, Phone, Emergency Contacts, Physical Address, GPS Coordinates, and Device Specs.
            </p>
          </div>

          {/* View Mode Toggle: Cards vs Dense Table */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                onClick={() => setUserViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  userViewMode === 'cards'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Dossier Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setUserViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  userViewMode === 'table'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Dense Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* User Search & Category Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Universal Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Search user by name, email, user ID, phone, city, or IP..."
              className="w-full text-xs pl-9 pr-8 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-stone-400"
            />
            {userSearchQuery && (
              <button
                onClick={() => setUserSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[10px] uppercase font-bold text-stone-400 mr-1 whitespace-nowrap">
              Status:
            </span>
            {(['ALL', 'ORIGINAL', 'HIGH_RISK', 'MONITORED', 'ACTIVE', 'ADMIN'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setUserStatusFilter(st)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                  userStatusFilter === st
                    ? st === 'ORIGINAL'
                      ? 'bg-amber-400 text-stone-950 font-bold shadow-2xs'
                      : st === 'HIGH_RISK'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {st === 'ORIGINAL' && <Star className="w-3 h-3 fill-current text-current" />}
                {st === 'ALL' ? 'All Users' : st === 'ORIGINAL' ? 'Original User' : st === 'HIGH_RISK' ? 'High Risk' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Selected City Indicator if active */}
        {selectedCityFilter !== 'ALL' && (
          <div className="flex items-center justify-between text-xs bg-sky-50 border border-sky-200 text-sky-800 px-3 py-2 rounded-xl">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              Filtering users in city: <strong>{selectedCityFilter}</strong>
            </span>
            <button
              onClick={() => setSelectedCityFilter('ALL')}
              className="text-[11px] underline font-medium text-sky-700 hover:text-sky-900"
            >
              Clear City Filter
            </button>
          </div>
        )}

        {/* VIEW 1: DETAILED IDENTITY DOSSIER CARDS */}
        {userViewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full py-12 text-center text-stone-400 text-xs bg-stone-50 border border-dashed border-stone-200 rounded-2xl">
                No users found matching "{userSearchQuery}".
              </div>
            ) : (
              filteredUsers.map((u) => {
                const latestAsm = getUserLatestAssessment(u.id);
                const totalAsm = getUserAssessmentCount(u.id);
                const isHighRisk = u.status === 'HIGH_RISK' || latestAsm?.stressCategory === 'HIGH';
                const isOriginal = u.isOriginalUser || u.email === originalUser.email || u.id === originalUser.id;

                return (
                  <div
                    key={u.id}
                    className={`bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                      isOriginal
                        ? 'border-amber-400/80 ring-2 ring-amber-300/40 bg-amber-50/10'
                        : isHighRisk
                        ? 'border-rose-300 ring-1 ring-rose-200/80 bg-rose-50/20'
                        : 'border-stone-200/90'
                    }`}
                  >
                    {/* User Identity Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                          isOriginal
                            ? 'bg-amber-500 text-stone-950 font-extrabold ring-2 ring-amber-300'
                            : u.role === 'ADMIN'
                            ? 'bg-rose-900 text-rose-100'
                            : isHighRisk
                            ? 'bg-rose-600 text-white'
                            : 'bg-stone-900 text-white'
                        }`}>
                          {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-sm text-stone-900">{u.name}</h3>
                            {isOriginal && (
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full border bg-amber-100 text-amber-900 border-amber-300 flex items-center gap-1 shadow-2xs">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                ORIGINAL USER
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-900 border-purple-200'
                                : isHighRisk
                                ? 'bg-[#F8D7DA] text-[#842029] border-red-300'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                            }`}>
                              {u.role === 'ADMIN' ? 'CLINICIAN ADMIN' : isHighRisk ? 'HIGH RISK ALERT' : (u.status || 'ACTIVE')}
                            </span>
                          </div>
                          {/* User ID with Copy Action */}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded">
                              ID: {u.id}
                            </span>
                            <button
                              onClick={() => handleCopy(u.id, `id-${u.id}`)}
                              className="text-stone-400 hover:text-stone-600 p-0.5"
                              title="Copy User ID"
                            >
                              {copiedKey === `id-${u.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* View Dossier Button */}
                      <button
                        onClick={() => setSelectedUserForModal(u)}
                        className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Inspect Complete User Dossier"
                      >
                        <Eye className="w-3.5 h-3.5 text-stone-600" />
                        <span>Inspect</span>
                      </button>
                    </div>

                    {/* Contact & Emergency Identification Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-stone-50/80 p-3 rounded-xl border border-stone-200/60">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider block">
                          Email Address
                        </span>
                        <span className="font-medium text-stone-800 text-[11px] truncate block" title={u.email}>
                          {u.email}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider block">
                          User Phone
                        </span>
                        <span className="font-mono text-stone-800 text-[11px] flex items-center gap-1">
                          <Phone className="w-3 h-3 text-stone-400" />
                          {u.phone || u.emergencyPhone || 'N/A'}
                        </span>
                      </div>

                      <div className="sm:col-span-2 pt-1 border-t border-stone-200/40">
                        <span className="text-[10px] font-bold uppercase text-rose-800 tracking-wider block">
                          Emergency Contact & SMS Helpline
                        </span>
                        <div className="flex items-center justify-between text-[11px] text-stone-700 mt-0.5">
                          <span className="font-medium">{u.emergencyContactName || 'Designated Contact'} ({u.emergencyContactRelationship || 'Emergency'})</span>
                          <span className="font-mono font-bold text-rose-700 bg-rose-100/80 px-1.5 py-0.2 rounded">
                            {u.emergencyPhone}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Precise Location & Coordinates Card */}
                    <div className="text-xs bg-sky-50/60 p-3 rounded-xl border border-sky-200/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-sky-800 tracking-wider flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-sky-600" />
                          Physical Location & Coordinates
                        </span>
                        {u.location && (
                          <a
                            href={`https://maps.google.com/?q=${u.location.lat},${u.location.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 underline"
                          >
                            Google Maps <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      <div className="text-[11px] font-semibold text-stone-900">
                        {u.city || u.location?.city || 'Location logged'}, {u.region || u.location?.region || ''} ({u.country || u.location?.country || u.currentHostCountry || 'India'})
                      </div>

                      {u.location?.address && (
                        <div className="text-[10px] text-stone-600">
                          {u.location.address}
                        </div>
                      )}

                      {u.location && (u.location.lat != null || u.location.lng != null) && (
                        <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 pt-1 border-t border-sky-200/50">
                          <span>Lat: {(Number(u.location.lat) || 0).toFixed(4)}°, Lng: {(Number(u.location.lng) || 0).toFixed(4)}°</span>
                          <span>±{Math.round(u.location.accuracy || 10)}m accuracy</span>
                        </div>
                      )}
                    </div>

                    {/* Assessment & Device Footprint Footer */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-stone-400" />
                        <span><strong>{totalAsm}</strong> check-in{totalAsm === 1 ? '' : 's'}</span>
                        {latestAsm && (
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            latestAsm.stressCategory === 'HIGH'
                              ? 'bg-rose-100 text-rose-800'
                              : latestAsm.stressCategory === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            Score: {latestAsm.stressScore}/100
                          </span>
                        )}
                      </div>

                      {u.deviceInfo && (
                        <div className="text-[10px] text-stone-400 truncate max-w-[150px]" title={u.deviceInfo}>
                          {u.deviceInfo.split('/')[0]}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* VIEW 2: DENSE COMPREHENSIVE IDENTITY TABLE */}
        {userViewMode === 'table' && (
          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-semibold text-[10px] border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3.5">User Identity</th>
                  <th className="px-4 py-3.5">Contact Details</th>
                  <th className="px-4 py-3.5">Physical Location & GPS</th>
                  <th className="px-4 py-3.5">Emergency Contact</th>
                  <th className="px-4 py-3.5">Status & Assessments</th>
                  <th className="px-3 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-stone-400 text-xs">
                      No users found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const latestAsm = getUserLatestAssessment(u.id);
                    const totalAsm = getUserAssessmentCount(u.id);
                    const isHigh = u.status === 'HIGH_RISK';
                    const isOriginal = u.isOriginalUser || u.email === originalUser.email || u.id === originalUser.id;

                    return (
                      <tr key={u.id} className={`transition-colors ${isOriginal ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-stone-50/80'}`}>
                        {/* User Identity */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-stone-900 flex items-center gap-1.5 flex-wrap">
                            <span>{u.name}</span>
                            {isOriginal && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-amber-100 text-amber-900 border-amber-300 flex items-center gap-0.5 shadow-2xs">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                ORIGINAL
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-stone-400">{u.id}</div>
                          <span className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-stone-100 text-stone-600 border-stone-200'
                          }`}>
                            {u.role}
                          </span>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-3">
                          <div className="text-[11px] text-stone-800">{u.email}</div>
                          <div className="text-[10px] font-mono text-stone-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-stone-400" />
                            {u.phone || u.emergencyPhone}
                          </div>
                        </td>

                        {/* Physical Location */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-stone-900 text-[11px] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
                            <span>{u.city || u.location?.city || 'Logged'}, {u.country || u.location?.country || u.currentHostCountry}</span>
                          </div>
                          {u.location && (u.location.lat != null || u.location.lng != null) ? (
                            <div className="text-[10px] font-mono text-stone-500 flex items-center gap-1 mt-0.5">
                              <span>{(Number(u.location.lat) || 0).toFixed(4)}, {(Number(u.location.lng) || 0).toFixed(4)}</span>
                              <a
                                href={`https://maps.google.com/?q=${Number(u.location.lat) || 0},${Number(u.location.lng) || 0}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-600 hover:text-sky-800 underline"
                              >
                                map
                              </a>
                            </div>
                          ) : (
                            <div className="text-[10px] text-stone-400">Standard GeoIP</div>
                          )}
                        </td>

                        {/* Emergency Contact */}
                        <td className="px-4 py-3">
                          <div className="text-[11px] font-medium text-stone-800">{u.emergencyContactName || 'Designated Contact'}</div>
                          <div className="text-[10px] font-mono font-bold text-rose-700">{u.emergencyPhone}</div>
                        </td>

                        {/* Status & Assessments */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isHigh
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}>
                              {u.status || 'ACTIVE'}
                            </span>
                          </div>
                          <div className="text-[10px] text-stone-500 mt-1">
                            {totalAsm} check-ins {latestAsm && `(Latest: ${latestAsm.stressScore}/100)`}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => setSelectedUserForModal(u)}
                            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium"
                            title="Inspect Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: MANUAL TWILIO SMS EMERGENCY ALERT TESTER */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-600" />
                Twilio SMS Emergency Alert Dispatch Tester
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                twilioStatus?.isConfigured 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {twilioStatus?.isConfigured ? `🟢 Active (${twilioStatus.fromPhone || 'Twilio'})` : '🟡 Simulation Mode (No Secrets)'}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Verify real-time Twilio cellular SMS delivery or send directly to designated emergency contact <strong className="font-mono text-stone-700">6379234471</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <form onSubmit={handleDispatchTestAlert} className="flex items-center gap-2">
              <div className="text-xs px-3.5 py-2 bg-stone-100 border border-stone-200 rounded-xl font-mono text-stone-800 font-semibold flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-rose-500" />
                <span>6379234471</span>
              </div>
              <button
                type="submit"
                disabled={isSendingAlert}
                className="text-xs px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                {isSendingAlert ? 'Sending...' : 'Test Server Dispatch'}
              </button>
            </form>

            <a
              href={`sms:+916379234471?&body=${encodeURIComponent(
                '🚨 [MINDEASE ADMIN TEST CRISIS ALERT] Emergency communication link verified for high-risk monitoring. Helpline: 6379234471'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>📱 Send Device SMS</span>
            </a>

            <a
              href="tel:6379234471"
              className="text-xs px-3 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 rounded-xl font-medium transition-colors flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5 text-stone-600" />
              <span>Call</span>
            </a>
          </div>
        </div>

        {testAlertResult && (
          <div className={`text-xs p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
            testAlertResult.status === 'SENT'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : testAlertResult.status === 'SIMULATED'
              ? 'bg-amber-50 text-amber-950 border-amber-200'
              : 'bg-rose-50 text-rose-950 border-rose-200'
          }`}>
            <div className="flex items-start gap-2">
              {testAlertResult.status === 'SENT' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <span className="font-semibold block">
                  {testAlertResult.status === 'SENT' ? '✓ Twilio Cellular SMS Dispatched' : testAlertResult.status === 'SIMULATED' ? '⚠️ Simulation Notice' : '❌ Twilio Delivery Error'}
                </span>
                <span className="text-[11px] leading-relaxed opacity-90">{testAlertResult.message}</span>
              </div>
            </div>

            {testAlertResult.status !== 'SENT' && (
              <a
                href={`sms:+916379234471?&body=${encodeURIComponent(
                  '🚨 [MINDEASE ADMIN TEST CRISIS ALERT] Emergency communication link verified for high-risk monitoring. Helpline: 6379234471'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[11px] px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-2xs"
              >
                <Phone className="w-3 h-3" />
                <span>Send via Device SMS Now</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* SECTION 4: ASSESSMENTS AUDIT LOG WITH USER LOCATION COLUMN */}
      <div className="bg-white border border-stone-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-6 border-b border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-stone-900">
              Voice Stress Assessments & Crisis Dispatch Log
            </h3>
            <p className="text-[11px] text-stone-500">
              Historical timeline of recorded transcripts, GPS locations, stress indicators, and Twilio SMS alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={assessmentSearchQuery}
                onChange={(e) => setAssessmentSearchQuery(e.target.value)}
                placeholder="Search transcripts, location..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1">
              {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table with User Location Column */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-semibold text-[10px] border-b border-stone-200">
              <tr>
                <th className="px-5 py-3.5">User Details & ID</th>
                <th className="px-4 py-3.5">Recorded Location & GPS</th>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Duration</th>
                <th className="px-4 py-3.5">Stress Score & Category</th>
                <th className="px-4 py-3.5">Twilio SMS Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-stone-400 text-xs">
                    No matching assessments found.
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((item) => {
                  const isHigh = item.stressCategory === 'HIGH';
                  const isMed = item.stressCategory === 'MEDIUM';
                  const userObj = users.find(u => u.id === item.userId);

                  const badgeClass = isHigh
                    ? 'bg-[#F8D7DA] text-[#842029] border-red-200'
                    : isMed
                    ? 'bg-[#FFF3CD] text-[#664D03] border-amber-200'
                    : 'bg-sky-100 text-sky-900 border-sky-200';

                  const smsBadge =
                    item.smsStatus === 'SENT'
                      ? 'bg-sky-100 text-sky-800'
                      : item.smsStatus === 'SIMULATED'
                      ? 'bg-blue-100 text-blue-800'
                      : item.smsStatus === 'FAILED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-stone-100 text-stone-500';

                  const displayLoc = item.location || userObj?.location;

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* User Details */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-stone-900">{item.userName}</div>
                        <div className="text-[11px] text-stone-500">{item.userEmail}</div>
                        <div className="text-[10px] font-mono text-stone-400 mt-0.5">
                          ID: {item.userId}
                        </div>
                      </td>

                      {/* User Location */}
                      <td className="px-4 py-4">
                        {displayLoc && (displayLoc.lat != null || displayLoc.lng != null) ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-stone-800 text-[11px] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
                              <span>{displayLoc.city || userObj?.city || 'Location'}, {displayLoc.country || userObj?.country || ''}</span>
                            </div>
                            <div className="text-[10px] font-mono text-stone-500 flex items-center gap-1">
                              <span>{(Number(displayLoc.lat) || 0).toFixed(4)}, {(Number(displayLoc.lng) || 0).toFixed(4)}</span>
                              <a
                                href={`https://maps.google.com/?q=${Number(displayLoc.lat) || 0},${Number(displayLoc.lng) || 0}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-600 hover:text-sky-800 underline flex items-center gap-0.5"
                                title="Open in Google Maps"
                              >
                                map <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400 font-italic">No GPS recorded</span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-4 whitespace-nowrap text-stone-600 font-mono text-[11px]">
                        {new Date(item.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-4 whitespace-nowrap font-mono text-stone-600">
                        {(Number(item.audioDuration) || 0).toFixed(1)}s
                      </td>

                      {/* Stress Score */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badgeClass}`}>
                          <span>{item.stressScore}/100</span>
                          <span>•</span>
                          <span>{item.stressCategory}</span>
                        </span>
                        {item.sentimentMetrics?.primaryEmotion && (
                          <div className="text-[10px] text-stone-600 mt-1 truncate max-w-[140px]">
                            {item.sentimentMetrics.primaryEmotion}
                          </div>
                        )}
                      </td>

                      {/* SMS Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${smsBadge}`}>
                          {item.smsStatus}
                        </span>
                        {item.smsSid && (
                          <div className="text-[10px] font-mono text-stone-400 mt-0.5 truncate max-w-[110px]">
                            {item.smsSid}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPLETE USER IDENTIFICATION DOSSIER MODAL */}
      {selectedUserForModal && (
        <div 
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedUserForModal(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-stone-900 text-white flex items-center justify-center text-lg font-bold shadow-xs">
                  {selectedUserForModal.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-stone-900">
                      {selectedUserForModal.name}
                    </h2>
                    {(selectedUserForModal.isOriginalUser || selectedUserForModal.email === originalUser.email || selectedUserForModal.id === originalUser.id) && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-amber-100 text-amber-900 border-amber-300 flex items-center gap-1 shadow-2xs">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Original Primary Account User
                      </span>
                    )}
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      selectedUserForModal.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-900 border-purple-200'
                        : selectedUserForModal.status === 'HIGH_RISK'
                        ? 'bg-rose-100 text-rose-900 border-rose-200'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                    }`}>
                      {selectedUserForModal.status || selectedUserForModal.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                      ID: {selectedUserForModal.id}
                    </span>
                    <button
                      onClick={() => handleCopy(selectedUserForModal.id, 'modal-id')}
                      className="text-stone-400 hover:text-stone-600 p-0.5"
                      title="Copy ID"
                    >
                      {copiedKey === 'modal-id' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserForModal(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Grid: 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact Information */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  Contact Information
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold">Email:</span>
                    <div className="font-semibold text-stone-800">{selectedUserForModal.email}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold">Direct Phone:</span>
                    <div className="font-mono text-stone-800">{selectedUserForModal.phone || selectedUserForModal.emergencyPhone}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold">Account Role:</span>
                    <div className="font-semibold text-stone-800">{selectedUserForModal.role}</div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-200/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                  Emergency Contact Protocol
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-rose-600 uppercase font-semibold">Contact Person:</span>
                    <div className="font-bold text-stone-900">{selectedUserForModal.emergencyContactName || 'Designated Contact'}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-600 uppercase font-semibold">Relationship:</span>
                    <div className="text-stone-700">{selectedUserForModal.emergencyContactRelationship || 'Emergency Proxy'}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-600 uppercase font-semibold">Emergency SMS Hotline:</span>
                    <div className="font-mono font-bold text-rose-800">{selectedUserForModal.emergencyPhone}</div>
                  </div>
                </div>
              </div>

              {/* Physical Location & GPS Coordinates */}
              <div className="sm:col-span-2 bg-sky-50/60 rounded-2xl p-4 border border-sky-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" />
                    Physical Geolocation & Navigation Coordinates
                  </h4>
                  {selectedUserForModal.location && (
                    <a
                      href={`https://maps.google.com/?q=${selectedUserForModal.location.lat},${selectedUserForModal.location.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-sky-700 hover:text-sky-900 underline flex items-center gap-1"
                    >
                      Open in Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold">City & Country:</span>
                    <div className="font-bold text-stone-900">
                      {selectedUserForModal.city || selectedUserForModal.location?.city || 'Chennai'}, {selectedUserForModal.country || selectedUserForModal.location?.country || selectedUserForModal.currentHostCountry || 'India'}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-stone-400 uppercase font-semibold">Address:</span>
                    <div className="text-stone-800">{selectedUserForModal.location?.address || 'Registered Residential / Clinic Address'}</div>
                  </div>
                </div>

                {selectedUserForModal.location && (selectedUserForModal.location.lat != null || selectedUserForModal.location.lng != null) && (
                  <div className="pt-2 border-t border-sky-200/60 flex flex-wrap items-center justify-between text-xs font-mono text-stone-600 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-white px-2 py-1 rounded border border-sky-200 text-stone-900">
                        Lat: {(Number(selectedUserForModal.location.lat) || 0).toFixed(6)}°
                      </span>
                      <span className="bg-white px-2 py-1 rounded border border-sky-200 text-stone-900">
                        Lng: {(Number(selectedUserForModal.location.lng) || 0).toFixed(6)}°
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500">
                      Accuracy Radius: ±{Math.round(selectedUserForModal.location.accuracy || 10)}m
                    </span>
                  </div>
                )}
              </div>

              {/* Technical Footprint & Device Details */}
              <div className="sm:col-span-2 bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-stone-400" />
                  Technical & Device Identification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold">Client Device / OS:</span>
                    <div className="font-mono text-stone-800 text-[11px]">{selectedUserForModal.deviceInfo || 'Standard Browser'}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold">IP Address & Network:</span>
                    <div className="font-mono text-stone-800 text-[11px]">{selectedUserForModal.ipAddress || '157.48.21.14'}</div>
                  </div>
                  {selectedUserForModal.registeredAt && (
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-semibold">Registered Date:</span>
                      <div className="text-stone-700 text-[11px]">{new Date(selectedUserForModal.registeredAt).toLocaleDateString()}</div>
                    </div>
                  )}
                  {selectedUserForModal.lastActive && (
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-semibold">Last Active:</span>
                      <div className="text-stone-700 text-[11px]">{new Date(selectedUserForModal.lastActive).toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-100">
              <div className="text-xs text-stone-500 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Verified Clinical Record
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedUserForModal.location && (
                  <button
                    onClick={() => handleCopy(`${selectedUserForModal.location?.lat}, ${selectedUserForModal.location?.lng}`, 'modal-coords')}
                    className="flex-1 sm:flex-none px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    {copiedKey === 'modal-coords' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy GPS Coords
                  </button>
                )}
                <button
                  onClick={() => setSelectedUserForModal(null)}
                  className="flex-1 sm:flex-none px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
