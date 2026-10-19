import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DigitalPassModal from '../components/DigitalPassModal';
import CheckInScannerModal from '../components/CheckInScannerModal';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { isFirebaseConfigured } from '../services/firebaseConfig';
import { useAuth } from '../context/AuthContext';

import {
  getRegistrations,
  fetchRegistrationsFromCloud,
  subscribeToRegistrations,
  subscribeToSponsors,
  updateRegistrationStatus,
  updateRegistrationRecord,
  toggleCheckInStatus,
  deleteRegistration,
  exportRegistrationsCSV,
  exportRegistrationsJSON,
  isBackendConfigured,
  generateWhatsAppLink,
  getSponsors,
  fetchSponsorsFromCloud,
  saveSponsorRecord,
  updateSponsorRecord,
  deleteSponsorRecord,
  getBrochure,
  fetchBrochureFromCloud,
  uploadBrochurePDF,
  deleteBrochureRecord,
  migrateFirestoreToBackend
} from '../services/registrationService';
import GoogleSignInButton from '../components/GoogleSignInButton';
import {
  Users, CheckCircle2, Award, Download, Search,
  Lock, QrCode, Trash2, Eye, RefreshCw, Music,
  Play, Pause, ExternalLink, MessageSquare, Database, LogOut, Plus, Edit2, X, User, Building2,
  FileText, Upload, Camera, ShieldCheck, CloudDownload
} from 'lucide-react';

export default function AdminPage() {
  const { user, role, loading, logout, canAccessPortal, isAdmin, isCommittee, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Active Tab state (defaults to 'sponsors' if URL is /admin/sponsors)
  const [activeTab, setActiveTab] = useState(() => {
    return location.pathname.includes('/sponsors') ? 'sponsors' : 'registrations';
  });

  useEffect(() => {
    if (location.pathname.includes('/sponsors')) {
      setActiveTab('sponsors');
    } else {
      setActiveTab('registrations');
    }
  }, [location.pathname]);

  
  const [registrations, setRegistrations] = useState(() => getRegistrations());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormatFilter, setSelectedFormatFilter] = useState('ALL'); // ALL, SOLO, DUO, TEAM
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSchool, setSelectedSchool] = useState('ALL');
  const [selectedPass, setSelectedPass] = useState(null);

  // Sponsor Management State
  const [sponsors, setSponsors] = useState(() => getSponsors());
  const [sponsorFilter, setSponsorFilter] = useState('ALL'); // ALL, PLATINUM, GOLD, SILVER, ACTIVE, INACTIVE
  const [sponsorModalOpen, setSponsorModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [deleteConfirmSponsor, setDeleteConfirmSponsor] = useState(null);

  // Brochure Management State (Requirement 5)
  const [brochure, setBrochure] = useState(() => getBrochure());
  const [isUploadingBrochure, setIsUploadingBrochure] = useState(false);
  const [brochureMsg, setBrochureMsg] = useState('');

  const [sponsorForm, setSponsorForm] = useState({
    name: '',
    category: 'Platinum Sponsor',
    logoUrl: '',
    description: '',
    websiteUrl: '',
    contactPerson: '',
    contactEmail: '',
    status: 'ACTIVE',
    displayOrder: 1
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  
  // Detailed Performer / Team Editing Modal state
  const [detailsRecord, setDetailsRecord] = useState(null);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editMembers, setEditMembers] = useState([]);
  const [editPrimaryName, setEditPrimaryName] = useState('');
  const [editPrimaryEnroll, setEditPrimaryEnroll] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const [quickCheckInId, setQuickCheckInId] = useState('');
  const [checkInMsg, setCheckInMsg] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);



  // Sound Engineer In-Dashboard Audio Player
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    try {
      const data = await fetchRegistrationsFromCloud();
      setRegistrations(data);
      const spData = await fetchSponsorsFromCloud();
      setSponsors(spData);
      const brochData = await fetchBrochureFromCloud();
      setBrochure(brochData);

    } finally {
      setIsSyncing(false);
    }
  };

  const handleMigrateFromFirebase = async () => {
    if (!window.confirm('Import past registrations and sponsors from Firebase Firestore / LocalStorage into your AWS EC2 backend?')) {
      return;
    }
    setIsSyncing(true);
    try {
      const res = await migrateFirestoreToBackend();
      if (res.migratedRegistrations > 0 || res.migratedSponsors > 0) {
        alert(`🎉 Success! Migrated ${res.migratedRegistrations} registrations and ${res.migratedSponsors} sponsors directly into your AWS EC2 backend!`);
        await handleSyncCloud();
      } else {
        alert('Notice: No new records found in Firebase/LocalStorage, or all records are already synced.');
      }
    } catch (err) {
      alert(`Migration error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (canAccessPortal) {
      handleSyncCloud();

      const unsubscribeRegs = subscribeToRegistrations((freshData) => {
        setRegistrations(freshData);
      });

      const unsubscribeSponsors = subscribeToSponsors((freshData) => {
        setSponsors(freshData);
      });

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          handleSyncCloud();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        if (unsubscribeRegs) unsubscribeRegs();
        if (unsubscribeSponsors) unsubscribeSponsors();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [canAccessPortal]);




  const handleStatusChange = async (id, newStatus) => {
    const updated = await updateRegistrationStatus(id, newStatus);
    setRegistrations(updated);
  };

  const handleCheckInToggle = async (id) => {
    const updated = await toggleCheckInStatus(id);
    setRegistrations(updated);
  };

  const handleDelete = async (id, name) => {
    if (!isAdmin && !isCommittee) return;
    if (window.confirm(`Are you sure you want to remove performance registration for ${name} (${id})?`)) {

      const updated = await deleteRegistration(id);
      setRegistrations(updated);
      if (activeTrack && activeTrack.id === id) {
        stopAudio();
      }
      if (detailsRecord && detailsRecord.id === id) {
        setDetailsRecord(null);
      }

    }
  };

  const handleQuickCheckIn = async (e) => {
    e.preventDefault();
    const query = quickCheckInId.trim().toUpperCase();
    if (!query) return;

    // Search by ID, Primary Enrollment, or Team Member Enrollment
    const candidate = registrations.find(
      (r) =>
        r.id.toUpperCase() === query ||
        r.enrollmentNo.toUpperCase() === query ||
        (r.teamMembers || []).some((m) => m.enrollmentNumber.toUpperCase() === query)

    );

    if (candidate) {
      if (candidate.checkedIn) {
        setCheckInMsg(`Notice: ${candidate.fullName} (${candidate.id}) is ALREADY verified and checked in!`);
      } else {
        await handleCheckInToggle(candidate.id);
        setCheckInMsg(`Verified! ${candidate.fullName} (${candidate.id}) successfully CHECKED IN at Stage.`);
      }
      setQuickCheckInId('');
    } else {
      setCheckInMsg(`Error: Candidate or Team Member with Enrollment '${query}' was not found in database.`);

    }
  };

  // Audio Playback Controls
  const playTrack = (candidate) => {
    if (!candidate.trackUrl) return;
    if (activeTrack && activeTrack.id === candidate.id && isPlaying) {
      audioRef.current?.pause();

      setIsPlaying(false);
    } else {
      setActiveTrack(candidate);
      setIsPlaying(true);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch((err) => console.log('Audio autoplay prevented:', err));
        }
      }, 50);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setActiveTrack(null);
    setIsPlaying(false);
  };

  // Open Details Modal & Init Editing State
  const openDetailsModal = (record) => {
    setDetailsRecord(record);
    setEditPrimaryName(record.fullName);
    setEditPrimaryEnroll(record.enrollmentNo);
    setEditMembers(record.teamMembers ? [...record.teamMembers] : []);
    setIsEditingTeam(false);
    setSaveSuccessMsg('');
  };

  const handleSaveTeamEdit = async () => {
    if (!detailsRecord) return;
    
    // Clean members
    const cleanMembers = editMembers.filter(m => m.name.trim() || m.enrollmentNumber.trim());

    const updated = await updateRegistrationRecord(detailsRecord.id, {
      fullName: editPrimaryName,
      enrollmentNo: editPrimaryEnroll,
      teamMembers: cleanMembers
    });

    setRegistrations(updated);
    const updatedTarget = updated.find(r => r.id === detailsRecord.id);
    if (updatedTarget) {
      setDetailsRecord(updatedTarget);
    }
    setIsEditingTeam(false);
    setSaveSuccessMsg('Performer roster updated successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleAddMemberInEdit = () => {
    if (1 + editMembers.length >= 10) return;
    setEditMembers(prev => [...prev, { name: '', enrollmentNumber: '' }]);
  };

  const handleRemoveMemberInEdit = (idx) => {
    setEditMembers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMemberChangeInEdit = (idx, field, value) => {
    setEditMembers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  // SPONSOR MANAGEMENT HANDLERS
  const handleOpenAddSponsor = () => {
    setEditingSponsor(null);
    setSponsorForm({
      name: '',
      category: 'Platinum',
      logoUrl: '',
      description: '',
      websiteUrl: '',
      contactPerson: '',
      contactEmail: '',
      status: 'ACTIVE',
      displayOrder: sponsors.length + 1
    });
    setLogoFile(null);
    setLogoPreview('');
    setSponsorModalOpen(true);
  };

  const handleOpenEditSponsor = (sponsor) => {
    setEditingSponsor(sponsor);
    setSponsorForm({
      name: sponsor.name || '',
      category: sponsor.category || 'Platinum',
      logoUrl: sponsor.logoUrl || '',
      description: sponsor.description || '',
      websiteUrl: sponsor.websiteUrl || '',
      contactPerson: sponsor.contactPerson || '',
      contactEmail: sponsor.contactEmail || '',
      status: sponsor.status || 'ACTIVE',
      displayOrder: sponsor.displayOrder || 1
    });
    setLogoFile(null);
    setLogoPreview(sponsor.logoUrl || '');
    setSponsorModalOpen(true);
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSponsorSubmit = async (e) => {
    e.preventDefault();
    if (!sponsorForm.name.trim()) return;

    if (editingSponsor) {
      const updated = await updateSponsorRecord(editingSponsor.id, sponsorForm, logoFile);
      setSponsors(updated);
    } else {
      const updated = await saveSponsorRecord(sponsorForm, logoFile);
      setSponsors(updated);
    }

    setSponsorModalOpen(false);
    setEditingSponsor(null);
    setLogoFile(null);
  };

  const handleToggleSponsorStatus = async (sponsor) => {
    const newStatus = sponsor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await updateSponsorRecord(sponsor.id, { status: newStatus });
    setSponsors(updated);
  };

  const handleOpenDeleteSponsor = (sponsor) => {
    setDeleteConfirmSponsor(sponsor);
  };

  const handleDeleteSponsorConfirmed = async () => {
    if (!deleteConfirmSponsor) return;
    const updated = await deleteSponsorRecord(deleteConfirmSponsor.id);
    setSponsors(updated);
    setDeleteConfirmSponsor(null);
  };

  // BROCHURE MANAGEMENT HANDLERS (Requirement 5)
  const handleBrochureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setBrochureMsg('Error: Please select a valid PDF brochure file (.pdf only).');
      return;
    }

    setIsUploadingBrochure(true);
    setBrochureMsg('Uploading sponsorship brochure PDF...');
    try {
      const uploaded = await uploadBrochurePDF(file);
      setBrochure(uploaded);
      setBrochureMsg('Sponsorship brochure PDF uploaded successfully!');
      setTimeout(() => setBrochureMsg(''), 4000);
    } catch (err) {
      console.error("Brochure upload error:", err);
      setBrochureMsg('Failed to upload brochure PDF.');
    } finally {
      setIsUploadingBrochure(false);
    }
  };

  const handleDeleteBrochure = async () => {
    if (window.confirm("Are you sure you want to remove the current sponsorship brochure?")) {
      await deleteBrochureRecord();
      setBrochure(null);
      setBrochureMsg('Brochure removed successfully.');
      setTimeout(() => setBrochureMsg(''), 3000);
    }
  };

  // Filtered dataset for Contestants
  const filteredData = registrations.filter((item) => {
    const formatStr = (item.participationType || '').toLowerCase();
    
    // Format Filter
    let matchFormat = true;
    if (selectedFormatFilter === 'SOLO') {
      matchFormat = formatStr === 'solo';
    } else if (selectedFormatFilter === 'DUO') {
      matchFormat = formatStr === 'duo';
    } else if (selectedFormatFilter === 'TEAM') {
      matchFormat = formatStr === 'group' || formatStr === 'team';
    }

    // Search Filter

    const matchSearch =
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.performanceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.teamMembers || []).some(
        (m) =>
          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.enrollmentNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );


    const matchCategory = selectedCategory === 'ALL' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchSchool = selectedSchool === 'ALL' || item.schoolDept.toLowerCase().includes(selectedSchool.toLowerCase());

    return matchFormat && matchSearch && matchCategory && matchSchool;
  });

  // Filtered dataset for Sponsors
  const filteredSponsors = sponsors.filter((s) => {
    const catUpper = (s.category || '').toUpperCase();
    if (sponsorFilter === 'ALL') return true;
    if (sponsorFilter === 'PLATINUM') return catUpper.includes('PLATINUM');
    if (sponsorFilter === 'GOLD') return catUpper.includes('GOLD');
    if (sponsorFilter === 'SILVER') return catUpper.includes('SILVER');
    if (sponsorFilter === 'ACTIVE') return s.status === 'ACTIVE';
    if (sponsorFilter === 'INACTIVE') return s.status === 'INACTIVE';
    return true;
  }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Dynamic KPI Calculations
  const totalCount = registrations.length;
  const soloCount = registrations.filter((r) => (r.participationType || '').toLowerCase() === 'solo').length;
  const duoCount = registrations.filter((r) => (r.participationType || '').toLowerCase() === 'duo').length;
  const teamCount = registrations.filter((r) => {
    const f = (r.participationType || '').toLowerCase();
    return f === 'group' || f === 'team';
  }).length;
  const checkedInCount = registrations.filter((r) => r.checkedIn).length;

  const totalPerformersSum = registrations.reduce((sum, r) => {
    const num = parseInt(r.numParticipants, 10);
    return sum + (isNaN(num) ? 1 + (r.teamMembers || []).length : num);
  }, 0);

  // 1. Loading State (Only on initial cold-start before auth state is determined)
  if (loading && !canAccessPortal && !localStorage.getItem('gsfcu_user_role') && !localStorage.getItem('gsfcu_admin_auth')) {
    return (
      <div className="min-h-screen bg-[#08080a] text-[#F4E7D0] flex flex-col justify-between font-sans">
        <Navbar />
        <div className="flex-grow flex items-center justify-center px-4 py-32">
          <div className="flex flex-col items-center gap-4 text-center">
            <RefreshCw className="w-8 h-8 text-[#E86F2D] animate-spin" />
            <p className="text-xs font-mono tracking-widest text-[#C9C5BD] uppercase">
              Checking Authorization & Event Credentials...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 2. Access Restricted View
  if (!canAccessPortal) {

    return (
      <div className="min-h-screen bg-[#08080a] text-[#F4E7D0] flex flex-col justify-between font-sans">
        <Navbar />
        <div className="flex-grow flex items-center justify-center px-4 py-24 sm:py-32">
          <div className="w-full max-w-md bg-[#0f0e13] border border-[#E86F2D]/30 rounded-2xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
            
            <div className="w-14 h-14 rounded-full bg-[#E86F2D]/15 border border-[#E86F2D]/40 mx-auto mb-4 flex items-center justify-center text-[#E86F2D]">
              <Lock className="w-6 h-6" />
            </div>

            <span className="text-[10px] font-mono tracking-[2px] text-[#E86F2D] uppercase block mb-1 font-semibold">
              ACCESS RESTRICTED
            </span>
            <h1 className="font-bebas text-3xl sm:text-4xl text-[#F4E7D0] tracking-wider uppercase mb-2">
              ORGANIZER PORTAL
            </h1>
            <p className="text-xs text-[#C9C5BD] leading-relaxed font-sans mb-5">
              Secure control room for authorized GSFC University organizing committee heads and event administrators.
            </p>

            {/* Authorized Admin Whitelist Badge */}
            <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-left text-xs font-mono">
              <div className="font-bold flex items-center gap-1.5 mb-1.5 text-amber-400 text-[11px] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Authorized Admin Accounts:</span>
              </div>
              <div className="space-y-1 text-[11px] text-[#F1E8D8]">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <code>24bt04d224@gsfcuniversity.ac.in</code>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <code>24bt04d218@gsfcuniversity.ac.in</code>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <code>24bt04d207@gsfcuniversity.ac.in</code>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <code>24bt04d238@gsfcuniversity.ac.in</code>
                </div>
              </div>
            </div>

            {/* Primary Option: Google Authentication Button for Admins */}
            <GoogleSignInButton
              adminOnly={true}
              buttonText="SIGN IN WITH GOOGLE (ADMIN ACCESS)"
              className="mb-4"
            />




            <div className="mt-6 pt-4 border-t border-white/5">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#E86F2D] hover:underline transition-colors"
              >
                <span>RETURN TO WEBSITE</span>
                <span>→</span>

              </Link>
            </div>

          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 3. Authorized Control Room View

  return (
    <div className="min-h-screen bg-[#08080a] text-[#F4E7D0] flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E86F2D]/25">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-bebas text-3xl sm:text-4xl text-[#F4E7D0] tracking-wide uppercase">
                PORTAL <span className="text-[#E86F2D]">CONTROL ROOM</span>
              </h1>
              
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${
                isAdmin
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-[#E86F2D]/15 border-[#E86F2D]/40 text-[#E86F2D]'
              }`}>
                {isAdmin ? '👑 ADMIN ACCESS' : '⚡ COMMITTEE ACCESS'}
              </span>

              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border ${
                (isBackendConfigured() || isFirebaseConfigured() || isSupabaseConfigured())
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-[#E86F2D]/10 border-[#E86F2D]/30 text-[#E86F2D]'
              }`}>
                <Database className="w-3 h-3" />
                <span>
                  {isBackendConfigured()
                    ? 'MONGODB ATLAS ACTIVE'
                    : isFirebaseConfigured()
                    ? 'FIRESTORE CLOUD ACTIVE'
                    : isSupabaseConfigured()
                    ? 'SUPABASE CLOUD ACTIVE'
                    : 'LOCAL ENGINE READY'}
                </span>
              </div>

            </div>

            <p className="text-xs text-[#C9C5BD] font-sans mt-1">
              Logged in as <strong className="text-[#F1E8D8]">{user?.name || user?.email || 'Committee User'}</strong> ({role})

            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleSyncCloud}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-md bg-[#0f0e13] hover:bg-white/5 border border-[#E86F2D]/30 text-xs font-mono text-[#F4E7D0] flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              title="Sync latest submissions from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#E86F2D] ${isSyncing ? 'animate-spin' : ''}`} />

              <span>{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
            </button>

            <button
              onClick={handleMigrateFromFirebase}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-xs font-mono text-amber-300 font-bold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              title="Pull past registrations from Firebase Firestore directly into AWS EC2"
            >
              <CloudDownload className="w-3.5 h-3.5 text-amber-400" />
              <span>RECALL PAST DATA</span>
            </button>

            <button
              onClick={exportRegistrationsCSV}
              className="px-4 py-2 rounded-md bg-[#E86F2D] hover:bg-[#d05e1f] border border-[#E86F2D] text-xs font-mono text-[#F1E8D8] font-bold flex items-center gap-2 transition-colors shadow-md cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#F1E8D8]" />
              <span>EXPORT CSV</span>
            </button>

            <button
              onClick={exportRegistrationsJSON}
              className="px-3.5 py-2 rounded-md bg-[#0f0e13] hover:bg-white/5 border border-amber-500/30 text-xs font-mono text-amber-300 font-bold flex items-center gap-2 transition-colors shadow-md cursor-pointer"
              title="Download complete JSON database backup"
            >
              <Database className="w-3.5 h-3.5 text-amber-300" />
              <span>BACKUP DB (JSON)</span>
            </button>

            <button
              onClick={logout}
              className="px-3 py-2 rounded-md bg-red-950/20 hover:bg-red-900/40 border border-red-500/30 text-xs font-mono text-red-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>LOGOUT</span>

            </button>
          </div>
        </div>

        {/* Dashboard Section Navigation Bar */}
        <div className="flex items-center gap-2 mb-8 bg-[#0f0e13] p-1.5 rounded-xl border border-[#C49A3A]/25 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('registrations'); navigate('/admin'); }}
            className={`px-4 py-2.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'registrations'
                ? 'bg-[#E86F2D] text-[#F1E8D8] shadow-md'
                : 'text-[#B5ACA0] hover:text-[#F4E7D0] hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>REGISTRATIONS & PERFORMERS</span>
          </button>

          <button
            onClick={() => { setActiveTab('sponsors'); navigate('/admin/sponsors'); }}
            className={`px-4 py-2.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'sponsors'
                ? 'bg-[#E86F2D] text-[#F1E8D8] shadow-md'
                : 'text-[#B5ACA0] hover:text-[#F4E7D0] hover:bg-white/5'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>SPONSORS</span>
          </button>
        </div>

        {/* TAB 1: CONTESTANTS & REGISTRATIONS MANAGEMENT */}
        {activeTab === 'registrations' && (
          <div>
            {/* Quick Gate Check-In Bar */}
            <div className="mb-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-[#0f0e13] via-[#14141c] to-[#0f0e13] border border-[#C96B35]/35 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-[#C49A3A] uppercase tracking-wider font-bold block mb-1">
                    GATE VERIFICATION & EXPRESS PASS SCANNER
                  </span>
                  <h2 className="font-bebas text-xl sm:text-2xl text-[#F4E7D0] tracking-wide">
                    AUDITORIUM GATE CHECK-IN
                  </h2>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setScannerOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-[#F4E7D0] text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg border border-emerald-500/60 transition-all shadow-lg flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Camera className="w-4 h-4 text-emerald-300" />
                    <span>SCAN QR WITH CAMERA</span>
                  </button>

                  <form onSubmit={handleQuickCheckIn} className="flex items-center gap-2 flex-grow md:w-72">
                    <div className="relative flex-grow">
                      <QrCode className="w-4 h-4 text-[#C96B35] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={quickCheckInId}
                        onChange={(e) => setQuickCheckInId(e.target.value)}
                        placeholder="Enter Registration ID or Enrollment"
                        className="w-full bg-[#08080a] border border-[#C49A3A]/30 rounded-lg pl-10 pr-4 py-2.5 text-xs text-[#F4E7D0] placeholder-[#B5ACA0]/50 font-mono focus:outline-none focus:border-[#C96B35]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-[#C96B35] hover:bg-[#B65A3A] text-[#F4E7D0] text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg border border-[#C96B35] transition-colors whitespace-nowrap shadow-md cursor-pointer"
                    >
                      CHECK IN
                    </button>
                  </form>
                </div>
              </div>

              {checkInMsg && (
                <div className={`mt-3 p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
                  checkInMsg.startsWith('Verified')
                    ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/40 border border-amber-500/40 text-amber-300'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{checkInMsg}</span>
                </div>
              )}
            </div>

            {/* Audio Player Bar */}
            {activeTrack && (
              <div className="mb-8 p-4 rounded-xl bg-[#14141c] border-2 border-[#C96B35] shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 animate-in slide-in-from-top duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-[#C96B35]/20 border border-[#C96B35]/40 flex items-center justify-center text-[#C96B35] shrink-0">
                    <Music className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#C96B35] text-[#F4E7D0]">
                        SOUND CONSOLE ACTIVE
                      </span>
                      <span className="font-mono text-xs text-[#C49A3A] font-bold">{activeTrack.id}</span>
                    </div>
                    <p className="font-bold text-[#F4E7D0] text-sm truncate mt-0.5">
                      {activeTrack.fullName} — "{activeTrack.performanceName}"
                    </p>
                    <p className="text-[10px] text-[#B5ACA0] font-mono truncate">
                      Track: {activeTrack.trackFileName || 'Attached MP3 Backing Track'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    onClick={() => playTrack(activeTrack)}
                    className="px-4 py-2 rounded-lg bg-[#C96B35] hover:bg-[#B65A3A] text-[#F4E7D0] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-lg"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPlaying ? 'PAUSE TRACK' : 'RESUME'}</span>
                  </button>

                  {activeTrack.trackUrl && (
                    <a
                      href={activeTrack.trackUrl}
                      download={`${activeTrack.id}_${activeTrack.fullName}_Track.mp3`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#F4E7D0] flex items-center gap-1.5 transition-colors"
                      title="Download Track to Sound Console"
                    >
                      <Download className="w-3.5 h-3.5 text-[#C49A3A]" />
                      <span>Download</span>
                    </a>
                  )}

                  <button
                    onClick={stopAudio}
                    className="text-xs font-mono text-[#B5ACA0] hover:text-white px-2 py-1"
                  >
                    Close Player
                  </button>

                  <audio
                    ref={audioRef}
                    src={activeTrack.trackUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* 6 DYNAMIC KPI CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
              
              <div className="p-4 rounded-xl bg-[#0f0e13] border border-[#C49A3A]/20 shadow-md">
                <div className="flex items-center justify-between text-[#B5ACA0] text-xs font-mono mb-1.5">
                  <span>REGISTRATIONS</span>
                  <Users className="w-4 h-4 text-[#C96B35]" />
                </div>
                <div className="font-bebas text-3xl sm:text-4xl text-[#F4E7D0]">{totalCount}</div>
                <div className="text-[10px] text-[#68734A] font-mono mt-1">Total Entries</div>
              </div>

              <div className="p-4 rounded-xl bg-[#0f0e13] border border-[#C49A3A]/20 shadow-md">
                <div className="flex items-center justify-between text-[#B5ACA0] text-xs font-mono mb-1.5">
                  <span>SOLO ACTS</span>
                  <User className="w-4 h-4 text-[#C49A3A]" />
                </div>
                <div className="font-bebas text-3xl sm:text-4xl text-[#C49A3A]">{soloCount}</div>
                <div className="text-[10px] text-[#B5ACA0] font-mono mt-1">1 Performer Entries</div>
              </div>

              <div className="p-4 rounded-xl bg-[#0f0e13] border border-[#C49A3A]/20 shadow-md">
                <div className="flex items-center justify-between text-[#B5ACA0] text-xs font-mono mb-1.5">
                  <span>DUO ACTS</span>
                  <Users className="w-4 h-4 text-[#C96B35]" />
                </div>
                <div className="font-bebas text-3xl sm:text-4xl text-[#C96B35]">{duoCount}</div>
                <div className="text-[10px] text-[#B5ACA0] font-mono mt-1">2 Performer Duos</div>
              </div>

              <div className="p-4 rounded-xl bg-[#0f0e13] border border-[#C49A3A]/20 shadow-md">
                <div className="flex items-center justify-between text-[#B5ACA0] text-xs font-mono mb-1.5">
                  <span>TEAM ACTS</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-bebas text-3xl sm:text-4xl text-emerald-400">{teamCount}</div>
                <div className="text-[10px] text-[#B5ACA0] font-mono mt-1">3–10 Group Performers</div>
              </div>

              <div className="p-4 rounded-xl bg-[#0f0e13] border border-[#C96B35]/30 shadow-md">
                <div className="flex items-center justify-between text-[#B5ACA0] text-xs font-mono mb-1.5">
                  <span>ON STAGE</span>
                  <Award className="w-4 h-4 text-[#C96B35]" />
                </div>
                <div className="font-bebas text-3xl sm:text-4xl text-[#F4E7D0]">{totalPerformersSum}</div>
                <div className="text-[10px] text-[#C96B35] font-mono font-bold mt-1">Total Performers</div>
              </div>

              <div className="p-4 rounded-xl bg-[#0f0e13] border border-emerald-500/30 shadow-md col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-[#B5ACA0] text-xs font-mono mb-1.5">
                  <span>GATE CHECKED IN</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-bebas text-3xl sm:text-4xl text-emerald-400">
                  {checkedInCount} <span className="text-[#B5ACA0] text-lg">/ {totalCount}</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-mono font-bold mt-1">
                  {totalCount > 0 ? `${Math.round((checkedInCount / totalCount) * 100)}% Verified at Gate` : '0 Verified'}
                </div>
              </div>

            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="p-4 rounded-xl bg-[#0f0e13] border border-[#C49A3A]/20 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              
              <div className="flex items-center gap-1 bg-[#08080a] p-1 rounded-lg border border-[#C49A3A]/20 self-start md:self-auto overflow-x-auto">
                {['ALL', 'SOLO', 'DUO', 'TEAM'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormatFilter(fmt)}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                      selectedFormatFilter === fmt
                        ? 'bg-[#C96B35] text-[#F4E7D0] shadow'
                        : 'text-[#B5ACA0] hover:text-[#F4E7D0] hover:bg-white/5'
                    }`}
                  >
                    {fmt === 'ALL' ? 'ALL FORMATS' : fmt}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-grow max-w-2xl">
                <div className="relative flex-grow">
                  <Search className="w-4 h-4 text-[#B5ACA0] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, enrollment, team member, ID, title..."
                    className="w-full bg-[#08080a] border border-[#C49A3A]/20 rounded-lg pl-9 pr-4 py-2 text-xs text-[#F4E7D0] placeholder-[#B5ACA0]/50 focus:outline-none focus:border-[#C96B35]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-[#08080a] border border-[#C49A3A]/25 rounded-lg px-3 py-2 text-xs text-[#F4E7D0] focus:outline-none focus:border-[#C96B35]"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="singing">Singing</option>
                    <option value="dance">Dance</option>
                    <option value="drama">Drama</option>
                    <option value="instrumental">Instrumental</option>
                    <option value="comedy">Comedy</option>
                    <option value="other">Other</option>
                  </select>

                  <select
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    className="bg-[#08080a] border border-[#C49A3A]/25 rounded-lg px-3 py-2 text-xs text-[#F4E7D0] focus:outline-none focus:border-[#C96B35]"
                  >
                    <option value="ALL">All Schools</option>
                    <option value="SOICT">SOICT (Info & Tech)</option>
                    <option value="SOCEFS">SOCEFS (Chemical & Fire)</option>
                    <option value="SOLS">SOLS (Life Sciences)</option>
                    <option value="SOCIS">SOCIS (Chemical & Industry)</option>
                    <option value="SOM&E">SOM&E (Management & Enterprise)</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Data Table */}
            <div className="bg-[#0f0e13] border border-[#C49A3A]/20 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#C49A3A]/20 bg-[#14141c] font-mono text-[11px] text-[#C49A3A] uppercase tracking-wider">
                      <th className="py-3.5 px-4">REGISTRATION ID</th>
                      <th className="py-3.5 px-4">PRIMARY PARTICIPANT / LEAD</th>
                      <th className="py-3.5 px-4">PARTICIPATION</th>
                      <th className="py-3.5 px-4">TALENT CATEGORY</th>
                      <th className="py-3.5 px-4">PERFORMERS</th>
                      <th className="py-3.5 px-4">PERFORMANCE TITLE</th>
                      <th className="py-3.5 px-4">STATUS</th>
                      <th className="py-3.5 px-4 text-center">CHECK-IN</th>
                      <th className="py-3.5 px-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5 font-sans">
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => {
                        const pCount = parseInt(item.numParticipants, 10) || (1 + (item.teamMembers || []).length);
                        const formatBadge = item.participationType || 'Solo';

                        return (
                          <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-[#C96B35] whitespace-nowrap">
                              {item.id}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#F4E7D0] text-sm">{item.fullName}</div>
                              <div className="font-mono text-[11px] text-[#B5ACA0]">
                                {item.enrollmentNo} • {item.schoolDept}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${
                                formatBadge === 'Team' || formatBadge === 'Group'
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                  : formatBadge === 'Duo'
                                  ? 'bg-[#C96B35]/15 border-[#C96B35]/30 text-[#C96B35]'
                                  : 'bg-white/5 border-white/10 text-[#F4E7D0]'
                              }`}>
                                {formatBadge}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-mono text-[11px] font-bold text-[#C49A3A] uppercase">
                                {item.category}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <button
                                onClick={() => openDetailsModal(item)}
                                className="font-mono text-xs font-bold text-[#F4E7D0] hover:text-[#C96B35] underline decoration-dotted flex items-center gap-1"
                                title="Click to view full performer roster"
                              >
                                <span>{pCount} performer{pCount > 1 ? 's' : ''}</span>
                                <Eye className="w-3 h-3 text-[#C96B35]" />
                              </button>
                            </td>

                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="font-medium text-[#F4E7D0] truncate">{item.performanceName}</div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <select
                                value={item.status}
                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                className="bg-[#08080a] border border-[#C49A3A]/25 rounded px-2.5 py-1 text-[11px] font-mono text-[#F4E7D0] focus:outline-none focus:border-[#C96B35]"
                              >
                                <option value="Registered">Registered</option>
                                <option value="Shortlisted for Auditions">Shortlisted for Auditions</option>
                                <option value="Grand Finalist">Grand Finalist</option>
                                <option value="Disqualified">Disqualified</option>
                              </select>
                            </td>

                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <button
                                onClick={() => handleCheckInToggle(item.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase transition-all ${
                                  item.checkedIn
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-white/5 text-[#B5ACA0] border border-white/10 hover:border-[#C96B35]/40'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{item.checkedIn ? 'Checked In' : 'Pending'}</span>
                              </button>
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => openDetailsModal(item)}
                                  className="px-2.5 py-1 rounded bg-[#C96B35]/15 hover:bg-[#C96B35] text-[#C96B35] hover:text-[#F4E7D0] border border-[#C96B35]/30 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors"
                                  title="View & Edit Performers Roster"
                                >
                                  <span>ROSTER</span>
                                  <Eye className="w-3 h-3" />
                                </button>

                                <a
                                  href={generateWhatsAppLink(item)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white transition-colors"
                                  title="Message Candidate on WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>

                                <button
                                  onClick={() => setSelectedPass(item)}
                                  className="p-1.5 rounded bg-white/5 hover:bg-[#C96B35] text-[#F4E7D0] transition-colors"
                                  title="View Official Digital Pass & QR"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDelete(item.id, item.fullName)}
                                  className="p-1.5 rounded bg-white/5 hover:bg-red-500 text-[#B5ACA0] hover:text-white transition-colors"
                                  title="Delete Candidate"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center py-12 text-sm text-[#B5ACA0] font-mono">
                          No matching performance registrations found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: SPONSOR MANAGEMENT MODULE */}
        {activeTab === 'sponsors' && (
          <div>
            {/* Sponsor Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#C49A3A]/20">
              <div>
                <h2 className="font-bebas text-3xl text-[#F4E7D0] tracking-wide uppercase">
                  Sponsors
                </h2>
                <p className="text-xs text-[#B5ACA0] font-sans mt-0.5">
                  Manage event sponsors and partnership information.
                </p>
              </div>

              <button
                onClick={handleOpenAddSponsor}
                className="px-4 py-2.5 rounded-md bg-[#E86F2D] hover:bg-[#d05e1f] text-[#F1E8D8] text-xs font-mono font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all border border-[#E86F2D] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ ADD SPONSOR</span>
              </button>
            </div>

            {/* Sponsor Filters */}
            <div className="p-4 rounded-xl bg-[#0f0e13] border border-[#C49A3A]/20 mb-6 flex items-center gap-1.5 overflow-x-auto">
              {['ALL', 'PLATINUM', 'GOLD', 'SILVER', 'ACTIVE', 'INACTIVE'].map((f) => (
                <button
                  key={f}
                  onClick={() => setSponsorFilter(f)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                    sponsorFilter === f
                      ? 'bg-[#C96B35] text-[#F4E7D0] shadow'
                      : 'text-[#B5ACA0] hover:text-[#F4E7D0] hover:bg-white/5'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Sponsor Data Table */}
            <div className="bg-[#0f0e13] border border-[#C49A3A]/20 rounded-xl overflow-hidden shadow-xl mb-10">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#C49A3A]/20 bg-[#14141c] font-mono text-[11px] text-[#C49A3A] uppercase tracking-wider">
                      <th className="py-3.5 px-4">LOGO</th>
                      <th className="py-3.5 px-4">SPONSOR</th>
                      <th className="py-3.5 px-4">CATEGORY</th>
                      <th className="py-3.5 px-4">STATUS</th>
                      <th className="py-3.5 px-4 text-center">DISPLAY ORDER</th>
                      <th className="py-3.5 px-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5 font-sans">
                    {filteredSponsors.length > 0 ? (
                      filteredSponsors.map((sp) => (
                        <tr key={sp.id} className="hover:bg-white/[0.02] transition-colors">
                          
                          {/* LOGO */}
                          <td className="py-3.5 px-4">
                            <div className="w-16 h-12 rounded-lg bg-[#08080a] border border-[#C49A3A]/20 flex items-center justify-center overflow-hidden p-1">
                              {sp.logoUrl ? (
                                <img
                                  src={sp.logoUrl}
                                  alt={sp.name}
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <Building2 className="w-5 h-5 text-[#C96B35]" />
                              )}
                            </div>
                          </td>

                          {/* SPONSOR DETAILS */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#F4E7D0] text-sm">{sp.name}</div>
                            {sp.websiteUrl && (
                              <a
                                href={sp.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[11px] text-[#C96B35] hover:underline inline-flex items-center gap-1 mt-0.5"
                              >
                                <span>{sp.websiteUrl.replace(/^https?:\/\//, '')}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {sp.contactPerson && (
                              <div className="text-[10px] text-[#B5ACA0] font-mono mt-0.5">
                                Contact: {sp.contactPerson} {sp.contactEmail ? `(${sp.contactEmail})` : ''}
                              </div>
                            )}
                          </td>

                          {/* CATEGORY */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${
                              (sp.category || '').toUpperCase().includes('PLATINUM')
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                : (sp.category || '').toUpperCase().includes('GOLD')
                                ? 'bg-[#C96B35]/15 border-[#C96B35]/40 text-[#C96B35]'
                                : 'bg-white/5 border-white/15 text-[#F4E7D0]'
                            }`}>
                              {sp.category}
                            </span>
                          </td>

                          {/* STATUS */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleSponsorStatus(sp)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                sp.status === 'ACTIVE'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-white/5 text-[#B5ACA0] border border-white/10 hover:border-[#C96B35]/40'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{sp.status}</span>
                            </button>
                          </td>

                          {/* DISPLAY ORDER */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-[#F4E7D0]">
                            {sp.displayOrder || 1}
                          </td>

                          {/* ACTIONS */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEditSponsor(sp)}
                                className="px-3 py-1 rounded bg-white/5 hover:bg-[#C96B35] text-[#F4E7D0] border border-white/10 text-[11px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => handleOpenDeleteSponsor(sp)}
                                className="px-3 py-1 rounded bg-red-950/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-[11px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-sm text-[#B5ACA0] font-mono">
                          No sponsors found matching filter '{sponsorFilter}'. Click "+ ADD SPONSOR" to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MANAGE SPONSORSHIP BROCHURE SECTION (Requirement 5) */}
            <div className="p-6 rounded-2xl bg-[#0f0e13] border border-[#C49A3A]/30 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-mono text-[#C96B35] font-bold uppercase tracking-wider block">
                    OFFICIAL PARTNERSHIP DOCUMENT
                  </span>
                  <h3 className="font-bebas text-2xl text-[#F4E7D0] tracking-wide">
                    MANAGE SPONSORSHIP BROCHURE (PDF)
                  </h3>
                  <p className="text-xs text-[#B5ACA0] font-sans">
                    Upload, replace, preview, or remove the official sponsorship proposal PDF for prospective sponsors.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-4 py-2.5 rounded-md bg-[#C96B35] hover:bg-[#B65A3A] text-[#F4E7D0] text-xs font-mono font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all border border-[#C96B35] cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>{brochure ? 'REPLACE BROCHURE (PDF)' : 'UPLOAD BROCHURE (PDF)'}</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleBrochureUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {brochureMsg && (
                <div className={`mt-4 p-3 rounded-lg text-xs font-mono flex items-center gap-2 ${
                  brochureMsg.startsWith('Error') || brochureMsg.startsWith('Failed')
                    ? 'bg-red-950/40 border border-red-500/40 text-red-300'
                    : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                }`}>
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>{brochureMsg}</span>
                </div>
              )}

              {brochure ? (
                <div className="mt-4 p-4 rounded-xl bg-[#08080a] border border-[#C49A3A]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-950/30 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-[#F4E7D0] text-sm block">{brochure.fileName}</span>
                      <span className="text-[10px] font-mono text-[#B5ACA0]">
                        {brochure.fileSize} • Uploaded: {new Date(brochure.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={brochure.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#F4E7D0] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#C49A3A]" />
                      <span>PREVIEW PDF</span>
                    </a>

                    <button
                      onClick={handleDeleteBrochure}
                      className="px-3.5 py-2 rounded-md bg-red-950/20 hover:bg-red-700 text-red-300 hover:text-white border border-red-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>REMOVE</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-6 rounded-xl bg-[#08080a] border border-dashed border-white/15 text-center text-xs text-[#B5ACA0] font-mono">
                  No sponsorship brochure PDF has been uploaded yet. Click "UPLOAD BROCHURE (PDF)" to attach one.
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* TEAM ROSTER DETAILS & ADMIN EDIT MODAL */}
      {detailsRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#0e0e13] border border-[#C49A3A]/30 rounded-2xl shadow-2xl p-6 text-[#F4E7D0] my-8 font-sans">
            
            <div className="flex items-center justify-between pb-4 border-b border-[#C49A3A]/20">
              <div>
                <span className="text-[10px] font-mono text-[#C96B35] font-bold uppercase tracking-wider block">
                  PERFORMANCE REGISTRATION ROSTER — {detailsRecord.id}
                </span>
                <h2 className="font-bebas text-2xl text-[#F4E7D0] tracking-wide">
                  "{detailsRecord.performanceName}"
                </h2>
              </div>
              <button
                onClick={() => setDetailsRecord(null)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#B5ACA0] hover:text-[#F4E7D0] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono text-emerald-300">
                {saveSuccessMsg}
              </div>
            )}

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#08080a] border border-[#C49A3A]/20 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="font-mono text-[#B5ACA0] uppercase">PRIMARY PARTICIPANT / LEAD</span>
                  <span className="font-bold text-[#C96B35] uppercase">{detailsRecord.participationType || 'Solo'}</span>
                </div>
                
                {isEditingTeam ? (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[9px] font-mono text-[#B5ACA0] block">NAME</label>
                      <input
                        type="text"
                        value={editPrimaryName}
                        onChange={(e) => setEditPrimaryName(e.target.value)}
                        className="w-full bg-[#101014] border border-[#C49A3A]/30 rounded px-2.5 py-1 text-xs text-[#F4E7D0]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-[#B5ACA0] block">ENROLLMENT NO</label>
                      <input
                        type="text"
                        value={editPrimaryEnroll}
                        onChange={(e) => setEditPrimaryEnroll(e.target.value)}
                        className="w-full bg-[#101014] border border-[#C49A3A]/30 rounded px-2.5 py-1 text-xs text-[#F4E7D0] font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="font-bebas text-2xl text-[#F4E7D0]">{detailsRecord.fullName}</span>
                    <div className="font-mono text-[11px] text-[#B5ACA0]">
                      Enrollment: <strong className="text-[#F4E7D0]">{detailsRecord.enrollmentNo}</strong> • Dept: {detailsRecord.schoolDept}
                    </div>
                    <div className="font-mono text-[11px] text-[#B5ACA0] mt-0.5">
                      Phone: {detailsRecord.phone} • Email: {detailsRecord.email}
                    </div>
                  </div>
                )}
              </div>

              {/* TEAM MEMBERS LIST */}
              <div className="p-4 rounded-xl bg-[#08080a] border border-white/10 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="font-mono text-[11px] text-[#C49A3A] font-bold uppercase">
                    PERFORMER ROSTER ({(detailsRecord.teamMembers || []).length + 1} TOTAL PERFORMERS)
                  </span>

                  {(isAdmin || isCommittee) && !isEditingTeam && (
                    <button
                      onClick={() => setIsEditingTeam(true)}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-[#C96B35] text-xs font-mono text-[#F4E7D0] flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>EDIT ROSTER</span>
                    </button>
                  )}
                </div>

                {isEditingTeam ? (
                  <div className="space-y-3">
                    {editMembers.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-[#14141c] p-2.5 rounded-lg border border-white/5">
                        <span className="font-mono text-[10px] text-[#C96B35] font-bold w-6">#{idx + 2}</span>
                        <input
                          type="text"
                          value={m.name}
                          onChange={(e) => handleMemberChangeInEdit(idx, 'name', e.target.value)}
                          placeholder="Performer Name"
                          className="flex-grow bg-[#08080a] border border-[#C49A3A]/20 rounded px-2.5 py-1 text-xs text-[#F4E7D0]"
                        />
                        <input
                          type="text"
                          value={m.enrollmentNumber}
                          onChange={(e) => handleMemberChangeInEdit(idx, 'enrollmentNumber', e.target.value)}
                          placeholder="Enrollment No"
                          className="w-32 bg-[#08080a] border border-[#C49A3A]/20 rounded px-2.5 py-1 text-xs text-[#F4E7D0] font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMemberInEdit(idx)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {1 + editMembers.length < 10 && (
                      <button
                        type="button"
                        onClick={handleAddMemberInEdit}
                        className="w-full py-2 rounded-lg border border-dashed border-[#C49A3A]/30 text-xs font-mono text-[#C49A3A] hover:bg-[#C49A3A]/10 flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> ADD PERFORMER TO ROSTER
                      </button>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingTeam(false)}
                        className="px-3 py-1.5 rounded border border-white/10 text-xs font-mono text-[#B5ACA0]"
                      >
                        CANCEL
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveTeamEdit}
                        className="px-4 py-1.5 rounded bg-[#C96B35] text-xs font-mono font-bold text-[#F4E7D0]"
                      >
                        SAVE ROSTER CHANGES
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-2 bg-[#14141c] rounded flex items-center justify-between text-xs font-mono border-l-2 border-[#C96B35]">
                      <span className="font-bold text-[#F4E7D0]">1. {detailsRecord.fullName} (Lead)</span>
                      <span className="text-[#B5ACA0]">{detailsRecord.enrollmentNo}</span>
                    </div>

                    {(detailsRecord.teamMembers || []).map((m, idx) => (
                      <div key={idx} className="p-2 bg-[#14141c] rounded flex items-center justify-between text-xs font-mono">
                        <span className="text-[#F4E7D0]">{idx + 2}. {m.name}</span>
                        <span className="text-[#B5ACA0]">{m.enrollmentNumber}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-end">
              <button
                onClick={() => setDetailsRecord(null)}
                className="px-5 py-2 rounded-md bg-[#C96B35] text-xs font-mono font-bold text-[#F4E7D0]"
              >
                CLOSE ROSTER
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ADD / EDIT SPONSOR MODAL (Requirement 3) */}
      {sponsorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 font-sans">
          <div className="relative w-full max-w-xl bg-[#0e0e13] border border-[#C49A3A]/30 rounded-2xl shadow-2xl p-6 sm:p-8 text-[#F4E7D0] my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#C49A3A]/20">
              <div>
                <span className="text-[10px] font-mono text-[#C96B35] font-bold uppercase tracking-wider block">
                  {editingSponsor ? 'EDIT SPONSOR RECORD' : 'CREATE NEW EVENT SPONSOR'}
                </span>
                <h2 className="font-bebas text-2xl sm:text-3xl text-[#F4E7D0] tracking-wide">
                  {editingSponsor ? editingSponsor.name : 'ADD NEW SPONSOR'}
                </h2>
              </div>
              <button
                onClick={() => setSponsorModalOpen(false)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#B5ACA0] hover:text-[#F4E7D0] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSponsorSubmit} className="mt-6 space-y-4 text-xs">
              
              {/* SPONSOR NAME * */}
              <div>
                <label className="block text-[10px] font-mono text-[#B5ACA0] uppercase tracking-wider mb-1">
                  SPONSOR NAME <span className="text-[#C96B35]">*</span>
                </label>
                <input
                  type="text"
                  value={sponsorForm.name}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })}
                  placeholder="e.g. ABC Company Ltd."
                  className="w-full bg-[#08080a] border border-[#C49A3A]/30 rounded-lg px-4 py-2.5 text-xs text-[#F4E7D0] focus:outline-none focus:border-[#C96B35]"
                  required
                />
              </div>

              {/* SPONSOR LOGO * */}
              <div>
                <label className="block text-[10px] font-mono text-[#B5ACA0] uppercase tracking-wider mb-1">
                  SPONSOR LOGO <span className="text-[#C96B35]">*</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    onChange={handleLogoFileChange}
                    className="w-full text-xs text-[#B5ACA0] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-mono file:bg-[#C96B35]/20 file:text-[#C96B35] hover:file:bg-[#C96B35]/30 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={sponsorForm.logoUrl}
                    onChange={(e) => {
                      setSponsorForm({ ...sponsorForm, logoUrl: e.target.value });
                      setLogoPreview(e.target.value);
                    }}
                    placeholder="Or enter image logo URL (e.g. https://domain.com/logo.png)"
                    className="w-full bg-[#08080a] border border-[#C49A3A]/20 rounded-lg px-4 py-2 text-xs text-[#F4E7D0] focus:outline-none focus:border-[#C96B35] font-mono"
                  />
                  {logoPreview && (
                    <div className="p-3 bg-[#08080a] border border-white/10 rounded-lg flex items-center gap-3">
                      <span className="text-[10px] font-mono text-[#B5ACA0]">Preview:</span>
                      <div className="h-16 max-w-xs flex items-center justify-center p-1 bg-[#14141c] rounded border border-white/5">
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CATEGORY * (Requirement 3: strictly Platinum Sponsor, Gold Sponsor, Silver Sponsor) & STATUS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[#B5ACA0] uppercase tracking-wider mb-1">
                    SPONSORSHIP CATEGORY <span className="text-[#C96B35]">*</span>
                  </label>
                  <select
                    value={sponsorForm.category}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, category: e.target.value })}
                    className="w-full bg-[#08080a] border border-[#C49A3A]/30 rounded-lg px-4 py-2.5 text-xs text-[#F4E7D0] focus:outline-none focus:border-[#C96B35]"
                  >
                    <option value="Platinum">Platinum</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#B5ACA0] uppercase tracking-wider mb-1">
                    STATUS
                  </label>
                  <select
                    value={sponsorForm.status}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, status: e.target.value })}
                    className="w-full bg-[#08080a] border border-[#C49A3A]/30 rounded-lg px-4 py-2.5 text-xs text-[#F4E7D0] focus:outline-none focus:border-[#C96B35]"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              {/* DISPLAY ORDER & WEBSITE URL (2 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[#B5ACA0] uppercase tracking-wider mb-1">
                    DISPLAY ORDER
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sponsorForm.displayOrder}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, displayOrder: e.target.value })}
                    className="w-full bg-[#08080a] border border-[#C49A3A]/30 rounded-lg px-4 py-2.5 text-xs text-[#F4E7D0] focus:outline-none focus:border-[#C96B35] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#B5ACA0] uppercase tracking-wider mb-1">
                    WEBSITE URL (OPTIONAL)
                  </label>
                  <input
                    type="url"
                    value={sponsorForm.websiteUrl}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, websiteUrl: e.target.value })}
                    placeholder="https://company.com"
                    className="w-full bg-[#08080a] border border-[#C49A3A]/30 rounded-lg px-4 py-2.5 text-xs text-[#F4E7D0] focus:outline-none focus:border-[#C96B35]"
                  />
                </div>
              </div>

              {/* CONTACT PERSON & CONTACT EMAIL (2 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[#B5ACA0] uppercase tracking-wider mb-1">
                    CONTACT PERSON
                  </label>
                  <input
                    type="text"
                    value={sponsorForm.contactPerson}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, contactPerson: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full bg-[#08080a] border border-[#C49A3A]/30 rounded-lg px-4 py-2.5 text-xs text-[#F4E7D0] focus:outline-none focus:border-[#C96B35]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#B5ACA0] uppercase tracking-wider mb-1">
                    CONTACT EMAIL
                  </label>
                  <input
                    type="email"
                    value={sponsorForm.contactEmail}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, contactEmail: e.target.value })}
                    placeholder="contact@company.com"
                    className="w-full bg-[#08080a] border border-[#C49A3A]/30 rounded-lg px-4 py-2.5 text-xs text-[#F4E7D0] focus:outline-none focus:border-[#C96B35]"
                  />
                </div>
              </div>

              {/* SHORT DESCRIPTION (OPTIONAL) */}
              <div>
                <label className="block text-[10px] font-mono text-[#B5ACA0] uppercase tracking-wider mb-1">
                  SHORT DESCRIPTION (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  value={sponsorForm.description}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, description: e.target.value })}
                  placeholder="Brief summary of the partnership..."
                  className="w-full bg-[#08080a] border border-[#C49A3A]/30 rounded-lg px-4 py-2.5 text-xs text-[#F4E7D0] focus:outline-none focus:border-[#C96B35]"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSponsorModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-[#C49A3A]/25 text-xs font-mono text-[#B5ACA0] hover:text-[#F4E7D0] uppercase transition-colors"
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-md bg-[#E86F2D] hover:bg-[#d05e1f] text-[#F1E8D8] text-xs font-mono font-bold uppercase tracking-wider shadow-lg border border-[#E86F2D]"
                >
                  SAVE SPONSOR
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmSponsor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 font-sans">
          <div className="relative w-full max-w-md bg-[#0e0e13] border border-red-500/30 rounded-2xl shadow-2xl p-6 text-[#F4E7D0]">
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/40 mx-auto flex items-center justify-center text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="font-bebas text-2xl text-[#F4E7D0] tracking-wide uppercase">
                Delete Sponsor?
              </h3>

              <p className="text-xs text-[#B5ACA0]">
                This sponsor (<strong className="text-[#F4E7D0]">{deleteConfirmSponsor.name}</strong>) will be removed from the public website.
              </p>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeleteConfirmSponsor(null)}
                  className="px-4 py-2 rounded-md border border-white/15 text-xs font-mono text-[#B5ACA0] hover:text-[#F4E7D0] uppercase transition-colors"
                >
                  CANCEL
                </button>

                <button
                  onClick={handleDeleteSponsorConfirmed}
                  className="px-5 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg border border-red-500"
                >
                  DELETE SPONSOR
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DIGITAL PASS MODAL */}

      {selectedPass && (
        <DigitalPassModal
          registration={selectedPass}
          onClose={() => setSelectedPass(null)}
        />
      )}

      {/* QR CHECK-IN CAMERA SCANNER MODAL */}
      <CheckInScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onCheckInComplete={(updatedList) => {
          setRegistrations(updatedList);
        }}
      />


      <Footer />
    </div>
  );
}
