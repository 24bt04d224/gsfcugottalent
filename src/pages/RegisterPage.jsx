import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DigitalPassModal from '../components/DigitalPassModal';
import { useAuth } from '../context/AuthContext';
import { 
  saveRegistration, 
  generateWhatsAppLink, 
  generateEmailLink 
} from '../services/registrationService';
import { TALENT_CATEGORIES, SCHOOLS_AND_DEPARTMENTS, EVENT_DETAILS } from '../data/eventData';
import { 
  validateStudentEnrollment 
} from '../services/studentVerificationService';
import { 
  User, Sparkles, ArrowRight, ArrowLeft, MessageSquare, ExternalLink, ShieldCheck, 
  CheckCircle2, QrCode, AlertCircle, Music, Upload, Play, Pause, FileAudio, Mail, Loader2, Plus, Trash2, Users,
  Lock
} from 'lucide-react';

export default function RegisterPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [registrationId, setRegistrationId] = useState('');
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [registeredRecord, setRegisteredRecord] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifiedStudent, setVerifiedStudent] = useState(null);

  // Audio track upload state
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: '',
    enrollmentNo: '',
    schoolDept: SCHOOLS_AND_DEPARTMENTS[0],
    semester: '1st Semester',
    phone: '',
    email: '',
    category: 'singing',
    participationType: 'Solo', // 'Solo' | 'Duo' | 'Team'

    performanceName: '',
    numParticipants: '1',
    description: '',
    driveLink: '',
  });

  // Additional team members array (for Duo and Team formats)
  const [teamMembers, setTeamMembers] = useState([]);
  const [memberErrors, setMemberErrors] = useState({});

  const [errors, setErrors] = useState({});

  // Auto-fill verified user details from Google Auth
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.displayName || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const handleEnrollmentChange = (e) => {
    const rawVal = e.target.value.toUpperCase();
    setFormData((prev) => ({ ...prev, enrollmentNo: rawVal }));

    const clean = rawVal.trim();
    if (!clean) {
      setVerifiedStudent(null);
      setErrors((prev) => ({ ...prev, enrollmentNo: '' }));
      return;
    }

    const verification = validateStudentEnrollment(clean);
    if (verification.valid && verification.student) {
      const student = verification.student;
      setVerifiedStudent(student);
      setFormData((prev) => ({
        ...prev,
        enrollmentNo: clean,
        schoolDept: student.school || prev.schoolDept,
        semester: student.semester || prev.semester,
        email: prev.email || student.suggestedEmail || '',
      }));
      setErrors((prev) => ({
        ...prev,
        enrollmentNo: '',
      }));
    } else {
      setVerifiedStudent(null);
      if (clean.length >= 6) {
        setErrors((prev) => ({
          ...prev,
          enrollmentNo: verification.error || 'Invalid GSFC University enrollment number format.'
        }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFormatChange = (e) => {
    const newFormat = e.target.value;
    const oldFormat = formData.participationType;

    if (newFormat === oldFormat) return;

    if (newFormat === 'Solo') {
      if (teamMembers.length > 0 && teamMembers.some(m => m.name.trim() || m.enrollmentNumber.trim())) {
        const confirmChange = window.confirm(
          "Changing to Solo will remove the additional performer details from this registration. Continue?"
        );
        if (!confirmChange) return;
      }
      setTeamMembers([]);
      setMemberErrors({});
    } else if (newFormat === 'Duo') {
      if (teamMembers.length > 0) {
        setTeamMembers([teamMembers[0]]);
      } else {
        setTeamMembers([{ name: '', enrollmentNumber: '', verifiedStudent: null }]);
      }
    } else if (newFormat === 'Team') {
      if (teamMembers.length === 0) {
        setTeamMembers([{ name: '', enrollmentNumber: '', verifiedStudent: null }]);
      }
    }

    setFormData((prev) => ({ ...prev, participationType: newFormat }));
  };

  const addTeamMember = () => {
    if (1 + teamMembers.length >= 10) return;
    setTeamMembers((prev) => [...prev, { name: '', enrollmentNumber: '', verifiedStudent: null }]);
  };

  const removeTeamMember = (indexToRemove) => {
    setTeamMembers((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setMemberErrors((prev) => {
      const copy = { ...prev };
      delete copy[indexToRemove];
      return copy;
    });
  };

  const updateTeamMember = (index, field, value) => {
    const val = field === 'enrollmentNumber' ? value.toUpperCase() : value;
    setTeamMembers((prev) =>
      prev.map((m, idx) => {
        if (idx !== index) return m;
        const updated = { ...m, [field]: val };
        
        // Auto-verify if updating enrollmentNumber
        if (field === 'enrollmentNumber') {
          const cleanEnroll = val.trim();
          const verification = validateStudentEnrollment(cleanEnroll);
          if (verification.valid && verification.student) {
            updated.name = verification.student.name || updated.name;
            updated.verifiedStudent = verification.student;
          } else {
            updated.verifiedStudent = null;
          }
        }
        return updated;
      })
    );
    if (memberErrors[index]?.[field]) {
      setMemberErrors((prev) => ({
        ...prev,
        [index]: { ...prev[index], [field]: '' }
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    const cleanEnroll = formData.enrollmentNo.trim().toUpperCase();

    if (!cleanEnroll) {
      newErrors.enrollmentNo = 'Enrollment Number is required';
    } else {
      const verification = validateStudentEnrollment(cleanEnroll);
      if (!verification.valid) {
        newErrors.enrollmentNo = verification.error || 'Invalid GSFC University enrollment number.';
      }
    }

    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.phone.trim() || formData.phone.length < 10) newErrors.phone = 'Valid 10-digit phone number required';
    if (!formData.email.trim() || !formData.email.includes('@')) newErrors.email = 'Valid student email required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.performanceName.trim()) newErrors.performanceName = 'Performance title is required';
    if (!formData.description.trim()) newErrors.description = 'Short description is required';

    const newMemberErrors = {};
    let hasMemberErrors = false;

    if (formData.participationType === 'Duo' || formData.participationType === 'Team') {
      if (teamMembers.length === 0 && formData.participationType === 'Duo') {
        setTeamMembers([{ name: '', enrollmentNumber: '', verifiedStudent: null }]);
      }

      const primaryEnrollment = formData.enrollmentNo.trim().toUpperCase();
      const seenEnrollments = new Set();
      if (primaryEnrollment) seenEnrollments.add(primaryEnrollment);

      teamMembers.forEach((m, idx) => {
        const errs = {};
        const nameVal = m.name.trim();
        const enrollVal = m.enrollmentNumber.trim().toUpperCase();

        if (!enrollVal) {
          errs.enrollmentNumber = 'Enrollment number is required';
        } else if (enrollVal === primaryEnrollment) {
          errs.enrollmentNumber = 'Primary participant cannot be added as a team member';
        } else if (seenEnrollments.has(enrollVal)) {
          errs.enrollmentNumber = 'This student has already been added to the performance.';
        } else {
          const verification = validateStudentEnrollment(enrollVal);
          if (!verification.valid) {
            errs.enrollmentNumber = verification.error || 'Invalid student enrollment number.';
          } else {
            seenEnrollments.add(enrollVal);
          }
        }

        if (!nameVal) errs.name = 'Full name is required';

        if (Object.keys(errs).length > 0) {
          newMemberErrors[idx] = errs;
          hasMemberErrors = true;
        }
      });
    }

    setErrors(newErrors);
    setMemberErrors(newMemberErrors);
    return Object.keys(newErrors).length === 0 && !hasMemberErrors;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAudioSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;


    if (file.size > 15 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        audioFile: 'File exceeds 15MB limit. Please upload a smaller MP3 or provide your Google Drive link below.'
      }));
      return;
    }

    setAudioFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAudioPreviewUrl(objectUrl);
    setIsPlayingPreview(false);
    setErrors((prev) => ({ ...prev, audioFile: '' }));
  };

  const removeAudioFile = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAudioFile(null);
    setAudioPreviewUrl(null);
    setIsPlayingPreview(false);
  };

  const toggleAudioPreview = () => {
    if (!audioRef.current) return;
    if (isPlayingPreview) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingPreview(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const calcCount = formData.participationType === 'Solo' ? 1 : (1 + teamMembers.length);
      const payload = {
        ...formData,
        participationFormat: formData.participationType.toLowerCase(),
        teamMembers: formData.participationType === 'Solo' ? [] : teamMembers,
        numParticipants: calcCount.toString()
      };

      const record = await saveRegistration(payload, audioFile);
      setRegisteredRecord(record);
      setRegistrationId(record.id);
      setSubmitted(true);
      setPassModalOpen(true);

      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#C96B35', '#C49A3A', '#B65A3A', '#68734A', '#F4E7D0']
        });
      } catch {}
    } catch (err) {
      setSubmitError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    removeAudioFile();
    setSubmitted(false);
    setRegisteredRecord(null);
    setSubmitError('');
    setVerifiedStudent(null);
    setStep(1);
    setTeamMembers([]);
    setMemberErrors({});

    setFormData({
      fullName: '',
      enrollmentNo: '',
      schoolDept: SCHOOLS_AND_DEPARTMENTS[0],
      semester: '1st Semester',
      phone: '',
      email: '',
      category: 'singing',
      participationType: 'Solo',
      performanceName: '',
      numParticipants: '1',
      description: '',
      driveLink: '',
    });
  };

  const getCategoryTitle = (catId) => {
    const match = TALENT_CATEGORIES.find((c) => c.id === catId);
    return match ? match.title : catId;
  };

  const currentTotalPerformers = formData.participationType === 'Solo' ? 1 : (1 + teamMembers.length);


  return (
    <div className="min-h-screen bg-[#08080a] text-[#F4E7D0] flex flex-col font-sans relative overflow-hidden">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10">
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-mono text-[#B5ACA0] hover:text-[#C96B35] mb-3 sm:mb-4 transition-colors min-h-[40px]">
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Event Homepage
            </Link>
            <h1 className="font-bebas text-3xl xs:text-4xl sm:text-6xl uppercase tracking-wide text-[#F4E7D0] mb-1">
              OFFICIAL <span className="text-[#C96B35]">REGISTRATION</span>
            </h1>
            <p className="font-hand text-xl xs:text-2xl text-[#C49A3A]">
              "Take The Stage — Auditions: 22 October 2026"
            </p>
          </div>

          {!submitted ? (
            <div className="bg-[#0f0e13] border border-[#C49A3A]/20 rounded-2xl p-4 xs:p-6 sm:p-10 shadow-2xl relative">
              
              {/* Step Progress Header */}
              <div className="mb-8 sm:mb-10">
                <div className="flex items-center justify-between mb-3 text-[10px] xs:text-xs font-mono">
                  <span className={`uppercase font-bold ${step >= 1 ? 'text-[#C96B35]' : 'text-[#B5ACA0]'}`}>
                    <span className="hidden sm:inline">STEP 01: YOUR DETAILS</span>
                    <span className="sm:hidden">01 DETAILS</span>
                  </span>
                  <span className={`uppercase font-bold ${step >= 2 ? 'text-[#C96B35]' : 'text-[#B5ACA0]'}`}>
                    <span className="hidden sm:inline">STEP 02: YOUR TALENT</span>
                    <span className="sm:hidden">02 TALENT</span>
                  </span>
                  <span className={`uppercase font-bold ${step === 3 ? 'text-[#C96B35]' : 'text-[#B5ACA0]'}`}>
                    <span className="hidden sm:inline">STEP 03: REVIEW</span>
                    <span className="sm:hidden">03 REVIEW</span>
                  </span>
                </div>
                
                <div className="w-full h-1.5 bg-[#C49A3A]/20 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-[#C96B35] transition-all duration-500"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>
              </div>

              {/* STEP 01: YOUR DETAILS */}
              {step === 1 && (
                <div className="space-y-5 sm:space-y-6">
                  <div className="border-b border-[#C49A3A]/20 pb-4 mb-4 sm:mb-6">
                    <h2 className="font-bebas text-xl sm:text-2xl text-[#F4E7D0] flex items-center gap-2 tracking-wide">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#C96B35] shrink-0" /> STUDENT IDENTIFICATION
                    </h2>
                    <p className="text-xs text-[#B5ACA0] font-sans">
                      Enter your details as Primary Participant / Team Lead.
                    </p>
                  </div>

                  {/* GOOGLE AUTHENTICATION VERIFIED BADGE */}
                  {user && (
                    <div className="p-3.5 rounded-xl bg-black/60 border border-[#FFBF00]/30 flex items-center justify-between gap-3 text-xs font-mono">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName}
                            className="w-8 h-8 rounded-full border border-[#FFBF00]/40 object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#FFBF00]/20 text-[#FFBF00] flex items-center justify-center font-bold text-xs border border-[#FFBF00]/30">
                            {(user.displayName || user.name || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-[#F4E7D0] font-semibold flex items-center gap-1.5 text-xs">
                            <span>{user.displayName || user.name}</span>
                            <span className="text-[9px] text-[#FFBF00] bg-[#FFBF00]/15 px-1.5 py-0.5 rounded border border-[#FFBF00]/30 uppercase font-bold tracking-wider">
                              AUTHENTICATED
                            </span>
                          </p>
                          <p className="text-[#C9C5BD]/70 text-[11px]">{user.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#68734A] flex items-center gap-1 bg-[#68734A]/15 px-2 py-1 rounded border border-[#68734A]/30 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> VERIFIED
                      </span>
                    </div>
                  )}

                  {/* ENROLLMENT NUMBER INPUT FIRST */}
                  <div>
                    <label className="block text-xs font-mono text-[#F4E7D0] uppercase mb-2">
                      Enrollment Number *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="enrollmentNo"
                        value={formData.enrollmentNo}
                        onChange={handleEnrollmentChange}
                        placeholder="Enter enrollment number"
                        className="w-full bg-[#08080a] border border-[#C49A3A]/25 rounded-lg px-4 py-3 text-sm text-[#F4E7D0] placeholder-[#B5ACA0]/50 focus:outline-none focus:border-[#C96B35] transition-colors font-mono uppercase tracking-wider pr-28"
                      />
                      {verifiedStudent ? (
                        <span className="absolute right-3 top-3 text-[#68734A] flex items-center gap-1.5 text-xs font-mono font-bold bg-[#68734A]/15 px-2.5 py-1 rounded border border-[#68734A]/30">
                          <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                        </span>
                      ) : (
                        formData.enrollmentNo.trim().length >= 4 && (
                          <span className="absolute right-3 top-3.5 text-[#B5ACA0] text-xs font-mono">
                            Auto-checking...
                          </span>
                        )
                      )}
                    </div>
                    {errors.enrollmentNo && (
                      <p className="text-xs text-red-400 mt-1.5 font-mono flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.enrollmentNo}
                      </p>
                    )}

                    {/* ENROLLMENT PATTERN VERIFIED BANNER */}
                    {verifiedStudent && (
                      <div className="mt-3 p-3.5 rounded-lg bg-[#141812] border border-[#68734A]/40 flex items-start justify-between gap-3 animate-in fade-in">
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#68734A] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-mono text-[10px] uppercase font-bold text-[#68734A] tracking-wider block">
                              GSFC UNIVERSITY ENROLLMENT PATTERN VERIFIED
                            </span>
                            <p className="font-bold text-xs text-[#F4E7D0]">
                              {formData.fullName ? formData.fullName : 'GSFCU Student Performer'}
                            </p>
                            <p className="text-[11px] text-[#B5ACA0] font-sans">
                              {verifiedStudent.course} • {verifiedStudent.school}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[#68734A] bg-[#68734A]/20 px-2.5 py-0.5 rounded border border-[#68734A]/40 shrink-0 font-bold">
                          {verifiedStudent.semester}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#F4E7D0] uppercase mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Aarav Patel"
                      className="w-full bg-[#08080a] border border-[#C49A3A]/25 rounded-lg px-4 py-3 text-sm text-[#F4E7D0] placeholder-[#B5ACA0]/50 focus:outline-none focus:border-[#C96B35] transition-colors font-sans"
                    />
                    {errors.fullName && <p className="text-xs text-red-400 mt-1 font-mono">{errors.fullName}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs font-mono text-[#F4E7D0] uppercase mb-2">
                        School / Department
                      </label>
                      <select
                        name="schoolDept"
                        value={formData.schoolDept}
                        onChange={handleChange}
                        className="w-full bg-[#08080a] border border-[#C49A3A]/25 rounded-lg px-4 py-3 text-sm text-[#F4E7D0] focus:outline-none focus:border-[#C96B35] transition-colors font-sans"
                      >
                        {SCHOOLS_AND_DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#F4E7D0] uppercase mb-2">
                        Semester
                      </label>
                      <select
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        className="w-full bg-[#08080a] border border-[#C49A3A]/25 rounded-lg px-4 py-3 text-sm text-[#F4E7D0] focus:outline-none focus:border-[#C96B35] transition-colors font-sans"
                      >
                        <option value="1st Semester">1st Semester</option>
                        <option value="2nd Semester">2nd Semester</option>
                        <option value="3rd Semester">3rd Semester</option>
                        <option value="4th Semester">4th Semester</option>
                        <option value="5th Semester">5th Semester</option>
                        <option value="6th Semester">6th Semester</option>
                        <option value="7th Semester">7th Semester</option>
                        <option value="8th Semester">8th Semester</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs font-mono text-[#F4E7D0] uppercase mb-2">WhatsApp / Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="10-digit mobile number"
                        className="w-full bg-[#08080a] border border-[#C49A3A]/25 rounded-lg px-4 py-3 text-sm text-[#F4E7D0] placeholder-[#B5ACA0]/50 focus:outline-none focus:border-[#C96B35] transition-colors font-sans"
                      />
                      {errors.phone && <p className="text-xs text-red-400 mt-1 font-mono">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#F4E7D0] uppercase mb-2 flex items-center justify-between">
                        <span>Student Email *</span>
                        {verifiedStudent?.name && (
                          <span className="text-[10px] text-[#68734A] flex items-center gap-1 font-mono">
                            <Lock className="w-3 h-3" /> Official
                          </span>
                        )}
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="student@gsfcuniversity.ac.in"
                        readOnly={Boolean(verifiedStudent?.name && verifiedStudent?.email)}
                        className={`w-full bg-[#08080a] border border-[#C49A3A]/25 rounded-lg px-4 py-3 text-sm text-[#F4E7D0] placeholder-[#B5ACA0]/50 focus:outline-none focus:border-[#C96B35] transition-colors font-sans ${verifiedStudent?.name && verifiedStudent?.email ? 'cursor-not-allowed bg-[#0d0c11] opacity-90' : ''}`}
                      />
                      {errors.email && <p className="text-xs text-red-400 mt-1 font-mono">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="pt-4 sm:pt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full sm:w-auto bg-[#C96B35] hover:bg-[#B65A3A] text-[#F4E7D0] font-mono font-bold text-xs uppercase tracking-wider px-6 sm:px-8 py-3.5 rounded-md shadow-lg flex items-center justify-center gap-2 transition-all border border-[#C96B35] hover:border-[#B65A3A] min-h-[44px]"
                    >
                      PROCEED TO PERFORMANCE DETAILS <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 02: YOUR TALENT */}
              {step === 2 && (
                <div className="space-y-5 sm:space-y-6">
                  <div className="border-b border-[#C49A3A]/20 pb-4 mb-4 sm:mb-6">
                    <h2 className="font-bebas text-xl sm:text-2xl text-[#F4E7D0] flex items-center gap-2 tracking-wide">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#C49A3A] shrink-0" /> PERFORMANCE SPECIFICATIONS
                    </h2>
                    <p className="text-xs text-[#B5ACA0] font-sans">Details about your act, participation format, and stage needs.</p>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs font-mono text-[#F4E7D0] uppercase mb-2">Talent Category</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full bg-[#08080a] border border-[#C49A3A]/25 rounded-lg px-4 py-3 text-sm text-[#F4E7D0] focus:outline-none focus:border-[#C96B35] transition-colors font-sans"
                      >
                        {TALENT_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.title} ({cat.subtitle})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#F4E7D0] uppercase mb-2">Participation Format</label>
                      <select
                        name="participationType"
                        value={formData.participationType}
                        onChange={handleFormatChange}
                        className="w-full bg-[#08080a] border border-[#C49A3A]/25 rounded-lg px-4 py-3 text-sm text-[#F4E7D0] focus:outline-none focus:border-[#C96B35] transition-colors font-sans font-bold"
                      >
                        <option value="Solo">Solo Act (1 Performer)</option>
                        <option value="Duo">Duo (2 Performers)</option>
                        <option value="Team">Team (3–10 Performers)</option>

                      </select>
                    </div>
                  </div>

                  {/* DYNAMIC PERFORMER DETAILS SECTION */}
                  {/* DUO FORMAT */}
                  {formData.participationType === 'Duo' && (
                    <div className="p-4 sm:p-5 rounded-xl bg-[#08080a] border border-[#C49A3A]/25 space-y-4 animate-in fade-in duration-200">
                      <div className="border-b border-[#C49A3A]/15 pb-2">
                        <h3 className="font-bebas text-lg text-[#F4E7D0] tracking-wide uppercase flex items-center gap-2">
                          <User className="w-4 h-4 text-[#C96B35]" /> PERFORMANCE PARTNER
                        </h3>
                        <p className="text-xs text-[#B5ACA0] font-sans">Enter the details of your performance partner.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-mono text-[#F4E7D0] uppercase mb-2">Partner Enrollment Number *</label>
                            <input
                              type="text"
                              value={teamMembers[0]?.enrollmentNumber || ''}
                              onChange={(e) => updateTeamMember(0, 'enrollmentNumber', e.target.value)}
                              placeholder="Enter enrollment number"
                              className="w-full bg-[#0f0e13] border border-[#C49A3A]/25 rounded-lg px-4 py-3 text-sm text-[#F4E7D0] placeholder-[#B5ACA0]/50 focus:outline-none focus:border-[#C96B35] font-mono uppercase"
                            />
                            {memberErrors[0]?.enrollmentNumber && <p className="text-xs text-red-400 mt-1 font-mono">{memberErrors[0].enrollmentNumber}</p>}
                          </div>

                          <div>
                            <label className="block text-xs font-mono text-[#F4E7D0] uppercase mb-2">
                              Partner Full Name *
                            </label>
                            <input
                              type="text"
                              value={teamMembers[0]?.name || ''}
                              onChange={(e) => updateTeamMember(0, 'name', e.target.value)}
                              placeholder="e.g. Rahul Patel"
                              className="w-full bg-[#0f0e13] border border-[#C49A3A]/25 rounded-lg px-4 py-3 text-sm text-[#F4E7D0] placeholder-[#B5ACA0]/50 focus:outline-none focus:border-[#C96B35] font-sans"
                            />
                            {memberErrors[0]?.name && <p className="text-xs text-red-400 mt-1 font-mono">{memberErrors[0].name}</p>}
                          </div>
                        </div>

                        {teamMembers[0]?.verifiedStudent && (
                          <div className="p-3 rounded-lg bg-[#141812] border border-[#68734A]/40 flex items-center gap-2.5 text-xs text-[#F4E7D0]">
                            <CheckCircle2 className="w-4 h-4 text-[#68734A] shrink-0" />
                            <span>
                              Pattern Verified: {teamMembers[0].verifiedStudent.course} ({teamMembers[0].verifiedStudent.school})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TEAM FORMAT */}
                  {formData.participationType === 'Team' && (
                    <div className="p-4 sm:p-5 rounded-xl bg-[#08080a] border border-[#C49A3A]/25 space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between border-b border-[#C49A3A]/15 pb-2">
                        <div>
                          <h3 className="font-bebas text-lg text-[#F4E7D0] tracking-wide uppercase flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#C96B35]" /> TEAM MEMBERS
                          </h3>
                          <p className="text-xs text-[#B5ACA0] font-sans">Add everyone performing on stage with you (Team Lead is already included).</p>
                        </div>
                        <span className="font-mono text-xs text-[#C96B35] font-bold px-3 py-1 rounded-full bg-[#C96B35]/15 border border-[#C96B35]/30">
                          {currentTotalPerformers} / 10 PERFORMERS
                        </span>
                      </div>

                      {teamMembers.map((member, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-[#0f0e13] border border-[#C49A3A]/20 relative space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-[#C49A3A] font-bold uppercase">
                              TEAM MEMBER 0{idx + 1}
                            </span>
                            {teamMembers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTeamMember(idx)}
                                className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors uppercase font-bold flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> REMOVE
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-mono text-[#B5ACA0] uppercase mb-1">Enrollment Number *</label>
                              <input
                                type="text"
                                value={member.enrollmentNumber}
                                onChange={(e) => updateTeamMember(idx, 'enrollmentNumber', e.target.value)}
                                placeholder="Enter enrollment number"
                                className="w-full bg-[#08080a] border border-[#C49A3A]/25 rounded-lg px-3.5 py-2.5 text-xs text-[#F4E7D0] placeholder-[#B5ACA0]/50 focus:outline-none focus:border-[#C96B35] font-mono uppercase"
                              />
                              {memberErrors[idx]?.enrollmentNumber && <p className="text-xs text-red-400 mt-1 font-mono">{memberErrors[idx].enrollmentNumber}</p>}
                            </div>

                            <div>
                              <label className="block text-[11px] font-mono text-[#B5ACA0] uppercase mb-1">
                                Member Name *
                              </label>
                              <input
                                type="text"
                                value={member.name}
                                onChange={(e) => updateTeamMember(idx, 'name', e.target.value)}
                                placeholder="Enter full name"
                                className="w-full bg-[#08080a] border border-[#C49A3A]/25 rounded-lg px-3.5 py-2.5 text-xs text-[#F4E7D0] placeholder-[#B5ACA0]/50 focus:outline-none focus:border-[#C96B35] font-sans"
                              />
                              {memberErrors[idx]?.name && <p className="text-xs text-red-400 mt-1 font-mono">{memberErrors[idx].name}</p>}
                            </div>
                          </div>

                          {member.verifiedStudent && (
                            <div className="p-2.5 rounded bg-[#141812] border border-[#68734A]/30 text-xs text-[#F4E7D0] flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#68734A] shrink-0" />
                              <span className="text-[11px] font-sans">
                                Pattern Verified: {member.verifiedStudent.course}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                        {currentTotalPerformers < 10 ? (
                          <button
                            type="button"
                            onClick={addTeamMember}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#C96B35]/20 hover:bg-[#C96B35] text-[#C96B35] hover:text-[#F4E7D0] border border-[#C96B35]/40 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" /> ADD TEAM MEMBER
                          </button>
                        ) : (
                          <span className="text-xs font-mono text-amber-400 font-bold uppercase px-3 py-1.5 rounded bg-amber-950/40 border border-amber-500/30">
                            Maximum team size reached (10 performers max).
                          </span>
                        )}
                      </div>
                    </div>
                  )}


                  <div>
                    <label className="block text-xs font-mono text-[#F4E7D0] uppercase mb-2">Performance Name / Title *</label>
                    <input
                      type="text"
                      name="performanceName"
                      value={formData.performanceName}
                      onChange={handleChange}
                      placeholder="e.g. Garba Fusion Beat / Acoustic Rhapsody / Skit on Campus Life"
                      className="w-full bg-[#08080a] border border-[#C49A3A]/25 rounded-lg px-4 py-3 text-sm text-[#F4E7D0] placeholder-[#B5ACA0]/50 focus:outline-none focus:border-[#C96B35] transition-colors font-sans"
                    />
                    {errors.performanceName && <p className="text-xs text-red-400 mt-1 font-mono">{errors.performanceName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#F4E7D0] uppercase mb-2">Total Performers on Stage (Auto-Calculated)</label>
                    <input
                      type="text"
                      readOnly
                      value={`${currentTotalPerformers} Performer(s)`}
                      className="w-full bg-[#08080a]/80 border border-[#C49A3A]/25 rounded-lg px-4 py-3 text-sm text-[#C49A3A] font-mono font-bold cursor-not-allowed select-none"

                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#F4E7D0] uppercase mb-2">Short Description & Stage Setup / Props Needed *</label>
                    <textarea
                      name="description"
                      rows="4"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe your act, backing tracks, instruments or special props required..."
                      className="w-full bg-[#08080a] border border-[#C49A3A]/25 rounded-lg px-4 py-3 text-sm text-[#F4E7D0] placeholder-[#B5ACA0]/50 focus:outline-none focus:border-[#C96B35] transition-colors resize-none font-sans"
                    />
                    {errors.description && <p className="text-xs text-red-400 mt-1 font-mono">{errors.description}</p>}
                  </div>

                  {/* AUDIO / BACKING TRACK UPLOAD SECTION */}
                  <div className="p-4 sm:p-5 rounded-xl bg-[#08080a] border border-[#C49A3A]/25 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#C49A3A]/15 pb-2">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-[#C96B35]" />
                        <span className="font-mono text-xs uppercase font-bold text-[#F4E7D0]">
                          STAGE AUDIO / BACKING TRACK (OPTIONAL)
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#B5ACA0]">MP3 / WAV (MAX 15MB)</span>
                    </div>

                    <p className="text-xs text-[#B5ACA0] font-sans">
                      Singers, dancers, or skit performers can attach their backing track so sound engineers are prepared ahead of auditions.
                    </p>


                    {!audioFile ? (
                      <div>
                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#C49A3A]/30 hover:border-[#C96B35] rounded-xl cursor-pointer bg-[#0f0e13] hover:bg-[#C96B35]/5 transition-all text-center group">
                          <Upload className="w-8 h-8 text-[#C49A3A] group-hover:text-[#C96B35] mb-2 transition-colors" />
                          <span className="font-mono text-xs text-[#F4E7D0] uppercase font-bold">
                            Click or Drag Track File Here
                          </span>
                          <span className="text-[11px] text-[#B5ACA0] font-sans mt-1">
                            Supports .mp3, .wav, .m4a, .aac (Up to 15MB)
                          </span>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleAudioSelect}
                            className="hidden"
                          />
                        </label>
                        {errors.audioFile && <p className="text-xs text-red-400 mt-2 font-mono">{errors.audioFile}</p>}
                      </div>
                    ) : (

                      <div className="p-3.5 sm:p-4 rounded-lg bg-[#14141c] border border-[#C96B35]/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#C96B35]/20 flex items-center justify-center text-[#C96B35] shrink-0">
                            <FileAudio className="w-5 h-5" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-mono font-bold text-[#F4E7D0] truncate max-w-[200px] sm:max-w-[280px]">
                              {audioFile.name}
                            </p>
                            <span className="text-[10px] text-[#68734A] font-mono">
                              {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • READY FOR STAGE
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {audioPreviewUrl && (
                            <button
                              type="button"
                              onClick={toggleAudioPreview}
                              className="px-3 py-1.5 rounded bg-[#C49A3A]/20 hover:bg-[#C49A3A]/30 border border-[#C49A3A]/40 text-xs font-mono text-[#F4E7D0] flex items-center gap-1.5 transition-colors"
                            >
                              {isPlayingPreview ? <Pause className="w-3.5 h-3.5 text-[#C96B35]" /> : <Play className="w-3.5 h-3.5 text-[#C49A3A]" />}
                              <span>{isPlayingPreview ? 'Pause' : 'Test Play'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={removeAudioFile}
                            className="text-xs font-mono text-red-400 hover:text-red-300 px-2 py-1 transition-colors"
                          >
                            Remove
                          </button>
                        </div>

                        {audioPreviewUrl && (
                          <audio
                            ref={audioRef}
                            src={audioPreviewUrl}
                            onEnded={() => setIsPlayingPreview(false)}
                            className="hidden"
                          />
                        )}
                      </div>
                    )}


                    <div>
                      <label className="block text-[11px] font-mono text-[#B5ACA0] uppercase mb-1">
                        OR GOOGLE DRIVE / CLOUD AUDIO LINK (OPTIONAL)
                      </label>
                      <input
                        type="url"
                        name="driveLink"
                        value={formData.driveLink}
                        onChange={handleChange}
                        placeholder="https://drive.google.com/file/d/... (ensure link sharing is set to Anyone)"
                        className="w-full bg-[#0f0e13] border border-[#C49A3A]/20 rounded-lg px-3.5 py-2.5 text-xs text-[#F4E7D0] placeholder-[#B5ACA0]/40 focus:outline-none focus:border-[#C96B35] transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-4 sm:pt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-6 py-3 rounded-md border border-[#C49A3A]/25 text-xs font-mono text-[#B5ACA0] hover:text-[#F4E7D0] uppercase transition-colors min-h-[44px] flex items-center justify-center"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="bg-[#C96B35] hover:bg-[#B65A3A] text-[#F4E7D0] font-mono font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-md shadow-lg flex items-center justify-center gap-2 transition-all border border-[#C96B35] hover:border-[#B65A3A] min-h-[44px]"
                    >
                      REVIEW REGISTRATION <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 03: REVIEW & SUBMIT */}
              {step === 3 && (
                <div className="space-y-5 sm:space-y-6">
                  <div className="border-b border-[#C49A3A]/20 pb-4 mb-4 sm:mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="font-bebas text-xl sm:text-2xl text-[#F4E7D0] flex items-center gap-2 tracking-wide">
                        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#C96B35] shrink-0" /> REVIEW SUMMARY
                      </h2>
                      <p className="text-xs text-[#B5ACA0] font-sans">Confirm your entry before final submission.</p>
                    </div>
                    <span className="font-mono text-xs text-[#C49A3A] font-bold px-3 py-1 rounded bg-[#C49A3A]/10 border border-[#C49A3A]/30 uppercase">
                      TOTAL PERFORMERS: {currentTotalPerformers}
                    </span>
                  </div>

                  <div className="space-y-4 font-sans text-xs">
                    
                    {/* PRIMARY PARTICIPANT / TEAM LEAD */}
                    <div className="p-4 rounded-lg bg-[#08080a] border border-[#C49A3A]/20 space-y-2">
                      <div className="flex items-center justify-between border-b border-[#C49A3A]/15 pb-2">
                        <span className="font-mono text-[#C49A3A] uppercase font-bold">
                          {formData.participationType === 'Team' ? 'PRIMARY PARTICIPANT / TEAM LEAD' : 'PRIMARY PARTICIPANT'}
                        </span>

                        <button onClick={() => setStep(1)} className="text-[11px] text-[#C96B35] font-mono hover:underline p-1">EDIT</button>
                      </div>
                      <p><span className="text-[#B5ACA0]">Full Name:</span> <strong className="text-[#F4E7D0]">{formData.fullName}</strong></p>
                      <p><span className="text-[#B5ACA0]">Enrollment No:</span> <strong className="text-[#F4E7D0] font-mono">{formData.enrollmentNo}</strong></p>
                      <p><span className="text-[#B5ACA0]">Department:</span> <span className="text-[#F4E7D0]">{formData.schoolDept}</span> ({formData.semester})</p>
                      <p className="break-all"><span className="text-[#B5ACA0]">Contact:</span> <span className="text-[#F4E7D0]">{formData.phone}</span> | <span className="text-[#F4E7D0]">{formData.email}</span></p>
                    </div>

                    {/* DUO / TEAM MEMBERS ROSTER */}
                    {formData.participationType === 'Duo' && teamMembers.length > 0 && (
                      <div className="p-4 rounded-lg bg-[#08080a] border border-[#C49A3A]/20 space-y-2">
                        <div className="flex items-center justify-between border-b border-[#C49A3A]/15 pb-2">
                          <span className="font-mono text-[#C96B35] uppercase font-bold">PERFORMANCE PARTNER</span>
                          <button onClick={() => setStep(2)} className="text-[11px] text-[#C96B35] font-mono hover:underline p-1">EDIT</button>
                        </div>
                        <p><span className="text-[#B5ACA0]">Partner Name:</span> <strong className="text-[#F4E7D0]">{teamMembers[0].name}</strong></p>
                        <p><span className="text-[#B5ACA0]">Partner Enrollment:</span> <strong className="text-[#F4E7D0] font-mono">{teamMembers[0].enrollmentNumber}</strong></p>
                      </div>
                    )}

                    {formData.participationType === 'Team' && teamMembers.length > 0 && (
                      <div className="p-4 rounded-lg bg-[#08080a] border border-[#C49A3A]/20 space-y-2">
                        <div className="flex items-center justify-between border-b border-[#C49A3A]/15 pb-2">
                          <span className="font-mono text-[#C96B35] uppercase font-bold">TEAM MEMBERS ({teamMembers.length})</span>
                          <button onClick={() => setStep(2)} className="text-[11px] text-[#C96B35] font-mono hover:underline p-1">EDIT</button>
                        </div>
                        <ul className="space-y-2 pt-1">
                          {teamMembers.map((m, idx) => (
                            <li key={idx} className="flex items-center justify-between p-2 rounded bg-[#0f0e13] border border-white/5 font-mono text-xs">
                              <span className="text-[#F4E7D0] font-bold">
                                0{idx + 1} — {m.name}
                              </span>
                              <span className="text-[#C49A3A] font-semibold">{m.enrollmentNumber}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* PERFORMANCE DETAILS */}

                    <div className="p-4 rounded-lg bg-[#08080a] border border-[#C49A3A]/20 space-y-2">
                      <div className="flex items-center justify-between border-b border-[#C49A3A]/15 pb-2">
                        <span className="font-mono text-[#C49A3A] uppercase font-bold">PERFORMANCE DETAILS</span>
                        <button onClick={() => setStep(2)} className="text-[11px] text-[#C96B35] font-mono hover:underline p-1">EDIT</button>
                      </div>
                      <p><span className="text-[#B5ACA0]">Format:</span> <strong className="text-[#C96B35] uppercase">{formData.participationType} Act</strong></p>
                      <p><span className="text-[#B5ACA0]">Category:</span> <strong className="text-[#F4E7D0] font-bebas text-base uppercase tracking-wide">{getCategoryTitle(formData.category)}</strong></p>
                      <p><span className="text-[#B5ACA0]">Title:</span> <span className="text-[#C96B35] font-bold">{formData.performanceName}</span></p>
                      <p><span className="text-[#B5ACA0]">Total Performers:</span> <span className="text-[#F4E7D0] font-mono font-bold">{currentTotalPerformers} Person(s)</span></p>

                      <p><span className="text-[#B5ACA0]">Description:</span> <span className="text-[#F4E7D0]">{formData.description}</span></p>

                      {(audioFile || formData.driveLink) && (
                        <div className="pt-2 border-t border-[#C49A3A]/15 mt-2 space-y-1">
                          <span className="text-[#B5ACA0] block">Audio / Backing Track:</span>
                          {audioFile && (
                            <p className="font-mono text-[#68734A] flex items-center gap-1.5">
                              <FileAudio className="w-3.5 h-3.5" /> {audioFile.name} (Attached)
                            </p>
                          )}
                          {formData.driveLink && (
                            <p className="font-mono text-xs text-[#C49A3A] truncate">
                              Cloud Link: {formData.driveLink}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {submitError && (
                    <div className="mt-4 p-4 rounded-lg bg-red-950/40 border border-red-500/50 flex items-start gap-3 text-red-200 text-xs">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-mono uppercase text-red-300">Registration Notice</strong>
                        <p>{submitError}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 sm:pt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={isSubmitting}
                      className="px-6 py-3 rounded-md border border-[#C49A3A]/25 text-xs font-mono text-[#B5ACA0] hover:text-[#F4E7D0] uppercase transition-colors min-h-[44px] flex items-center justify-center disabled:opacity-50"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-[#C96B35] hover:bg-[#B65A3A] text-[#F4E7D0] font-mono font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-md shadow-xl flex items-center justify-center gap-2 transition-all border border-[#C96B35] hover:border-[#B65A3A] min-h-[44px] disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> SUBMITTING TO CLOUD...
                        </>
                      ) : (
                        'SUBMIT REGISTRATION →'
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* SUCCESS STATE SCREEN */
            <div className="bg-[#0f0e13] border border-[#C96B35]/40 rounded-2xl p-6 sm:p-12 text-center shadow-2xl relative overflow-hidden animate-modal-content">

              
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#68734A]/15 border border-[#68734A]/30 mx-auto mb-4 sm:mb-6 flex items-center justify-center text-[#68734A]">
                <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>

              <span className="font-mono text-[10px] sm:text-xs tracking-widest text-[#C49A3A] uppercase block mb-2 font-bold">
                REGISTRATION RECEIVED
              </span>

              <h2 className="font-bebas text-3xl xs:text-4xl sm:text-5xl uppercase text-[#F4E7D0] mb-2 tracking-wide">
                REGISTRATION CONFIRMED
              </h2>

              <p className="text-xs sm:text-sm text-[#B5ACA0] max-w-md mx-auto mb-6 font-sans">
                Your entry has been securely logged into the official GSFC University event roster. View or print your digital pass below.
              </p>

              {/* ID Badge */}
              <div className="inline-block p-3.5 sm:p-4 rounded-xl bg-[#08080a] border border-[#C49A3A]/25 mb-6 sm:mb-8 max-w-full">
                <span className="text-[9px] sm:text-[10px] font-mono text-[#B5ACA0] block uppercase mb-1">YOUR OFFICIAL REGISTRATION ID</span>
                <span className="font-bebas text-3xl sm:text-4xl text-[#C96B35] tracking-wider block">
                  {registrationId}
                </span>
                <span className="text-[10px] font-mono text-[#F4E7D0] block mt-1">
                  FORMAT: <span className="text-[#C96B35] font-bold uppercase">{registeredRecord?.participationType || 'SOLO'}</span> ({registeredRecord?.numParticipants || 1} PERFORMER)
                </span>
              </div>

              {/* Digital VIP Entry Pass Callout */}
              <div className="max-w-md mx-auto mb-6 sm:mb-8 p-5 rounded-xl bg-gradient-to-r from-[#C96B35]/15 via-[#C49A3A]/10 to-[#B65A3A]/15 border border-[#C96B35]/40 text-center hover-lift">

                <div className="flex items-center justify-center gap-2 mb-2 text-[#C49A3A]">
                  <QrCode className="w-5 h-5 text-[#C96B35]" />
                  <span className="font-mono text-xs uppercase font-bold tracking-wider">OFFICIAL PASS READY</span>
                </div>
                <p className="text-xs text-[#B5ACA0] mb-4 font-sans">
                  Bring your scannable digital badge on your mobile phone or print a paper pass for entry at the auditorium gates.
                </p>
                <button
                  type="button"
                  onClick={() => setPassModalOpen(true)}
                  className="w-full bg-[#C96B35] hover:bg-[#B65A3A] text-[#F4E7D0] font-mono font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-md flex items-center justify-center gap-2 transition-all shadow-xl hover:scale-[1.01] border border-[#C96B35] min-h-[44px] btn-hover-subtle"

                >
                  <QrCode className="w-4 h-4" /> VIEW OFFICIAL DIGITAL PASS & QR TICKET
                </button>
              </div>

              {/* Instant WhatsApp & Email Confirmation Notifications */}
              {registeredRecord && (
                <div className="max-w-md mx-auto mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  <a
                    href={generateWhatsAppLink(registeredRecord)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-xl bg-[#0f1712] border border-emerald-500/30 hover:border-emerald-500/60 flex items-center gap-3 transition-colors group btn-hover-subtle"

                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">SEND TO WHATSAPP</span>
                      <span className="text-[11px] text-[#B5ACA0] block truncate">Backup ID on phone</span>
                    </div>
                  </a>

                  <a
                    href={generateEmailLink(registeredRecord)}
                    className="p-3.5 rounded-xl bg-[#14141c] border border-[#C49A3A]/30 hover:border-[#C49A3A]/60 flex items-center gap-3 transition-colors group btn-hover-subtle"

                  >
                    <div className="w-9 h-9 rounded-full bg-[#C49A3A]/20 flex items-center justify-center text-[#C49A3A] shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-mono text-[#C49A3A] uppercase font-bold block">SAVE VIA EMAIL</span>
                      <span className="text-[11px] text-[#B5ACA0] block truncate">Send copy to inbox</span>
                    </div>
                  </a>
                </div>
              )}

              {/* WhatsApp Group Invitation */}
              <div className="p-5 sm:p-6 rounded-xl bg-[#0f1712] border border-emerald-500/35 mb-6 sm:mb-8 max-w-md mx-auto text-left shadow-xl hover-lift">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 animate-whatsapp-pulse">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bebas text-xl sm:text-2xl text-[#F4E7D0] tracking-wide uppercase leading-tight">
                      Join the Official WhatsApp Group
                    </h3>
                    <p className="text-xs sm:text-sm text-[#B5ACA0] font-sans leading-relaxed mt-1">
                      Stay updated with event announcements, important information, and updates.
                    </p>

                  </div>
                </div>

                <a
                  href="https://chat.whatsapp.com/LETsJjET2As6fXFHCA8iAh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-[#F4E7D0] font-mono font-bold text-xs uppercase tracking-wider py-3.5 px-5 rounded-md flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-[1.01] border border-emerald-500/50 min-h-[44px] cursor-pointer btn-hover-subtle animate-whatsapp-pulse"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Join WhatsApp Group</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                </a>
              </div>



              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link
                  to="/"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-md bg-[#C49A3A]/10 hover:bg-[#C49A3A]/20 border border-[#C49A3A]/25 text-xs font-mono font-bold text-[#F4E7D0] uppercase tracking-wider transition-colors min-h-[44px] flex items-center justify-center"
                >
                  RETURN TO HOME
                </Link>

                <button
                  onClick={resetForm}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-md bg-[#C96B35]/20 hover:bg-[#C96B35] text-[#C96B35] hover:text-[#F4E7D0] border border-[#C96B35]/40 text-xs font-mono font-bold uppercase tracking-wider transition-all min-h-[44px] flex items-center justify-center"
                >
                  REGISTER ANOTHER ACT
                </button>
              </div>

            </div>
          )}

        </div>
      </main>

      <DigitalPassModal
        isOpen={passModalOpen}
        onClose={() => setPassModalOpen(false)}
        registration={registeredRecord}
      />

      <Footer />
    </div>
  );
}
