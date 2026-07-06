import React, { useState, useEffect } from "react";
import { 
  Search, Star, Phone, Mail, Instagram, Facebook, MapPin, 
  MessageSquare, User, Clock, Edit3, Trash2, X, ChevronRight, Award,
  CheckCircle, ShieldAlert
} from "lucide-react";
import { User as UserType } from "../types.js";

interface DoctorsViewProps {
  user: UserType | null;
  token: string;
}

interface DoctorWithProfile {
  id: string;
  email: string;
  role: string;
  doctorProfile: {
    specialty: string;
    profilePicture?: string;
    phone?: string;
    email?: string;
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    clinicLocationUrl?: string;
  } | null;
}

interface Review {
  id: string;
  doctorId: string;
  userId: string;
  userEmail: string;
  rating: number;
  text: string;
  createdAt: string;
  updatedAt?: string;
}

export default function DoctorsView({ user, token }: DoctorsViewProps) {
  const [doctors, setDoctors] = useState<DoctorWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");

  // Selected Doctor details modal
  const [selectedDoc, setSelectedDoc] = useState<DoctorWithProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Write/Edit Review Form state
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/doctors");
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      } else {
        setError("Failed to retrieve doctors registry.");
      }
    } catch (err) {
      setError("Unable to connect to service.");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (docId: string) => {
    setReviewsLoading(true);
    setReviewError(null);
    setReviewSuccess(null);
    try {
      const res = await fetch(`/api/doctors/${docId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSelectDoctor = (doc: DoctorWithProfile) => {
    setSelectedDoc(doc);
    fetchReviews(doc.id);
    
    // Clear form states
    setRating(5);
    setReviewText("");
    setEditingReviewId(null);
    setReviewError(null);
    setReviewSuccess(null);
  };

  const handleCloseModal = () => {
    setSelectedDoc(null);
    setReviews([]);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !user) return;

    if (!reviewText.trim()) {
      setReviewError("Please provide a text comment for your review.");
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const isEditing = !!editingReviewId;
      const url = isEditing 
        ? `/api/doctors/${selectedDoc.id}/reviews/${editingReviewId}` 
        : `/api/doctors/${selectedDoc.id}/reviews`;
      
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ rating, text: reviewText.trim() })
      });

      const data = await res.json();
      if (res.ok) {
        setReviewSuccess(isEditing ? "Review updated successfully!" : "Review posted successfully!");
        setReviewText("");
        setRating(5);
        setEditingReviewId(null);
        fetchReviews(selectedDoc.id);
      } else {
        setReviewError(data.error || "Failed to submit review.");
      }
    } catch (err) {
      setReviewError("Could not connect to clinical server.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReviewClick = (rev: Review) => {
    setEditingReviewId(rev.id);
    setRating(rev.rating);
    setReviewText(rev.text);
    setReviewError(null);
    setReviewSuccess(null);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!selectedDoc || !window.confirm("Are you sure you want to delete your review?")) return;

    setReviewError(null);
    setReviewSuccess(null);

    try {
      const res = await fetch(`/api/doctors/${selectedDoc.id}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        setReviewSuccess("Review deleted successfully.");
        fetchReviews(selectedDoc.id);
      } else {
        const data = await res.json();
        setReviewError(data.error || "Failed to delete review.");
      }
    } catch (err) {
      setReviewError("Network error.");
    }
  };

  // Filter list of doctors
  const filteredDoctors = doctors.filter((doc) => {
    const specialty = doc.doctorProfile?.specialty?.toLowerCase() || "general practice";
    const emailMatch = doc.email.toLowerCase().includes(searchQuery.toLowerCase());
    const specialtyMatch = specialty.includes(searchQuery.toLowerCase());
    
    const matchesSearch = emailMatch || specialtyMatch;
    const matchesSpecialty = selectedSpecialty === "all" || specialty === selectedSpecialty;

    return matchesSearch && matchesSpecialty;
  });

  const getInitials = (email: string) => {
    const part = email.split("@")[0];
    return part.substring(0, 2).toUpperCase();
  };

  const getDoctorDisplayName = (email: string) => {
    const part = email.split("@")[0];
    return `Dr. ${part.charAt(0).toUpperCase() + part.slice(1)}`;
  };

  const SPECIALTIES_LIST = [
    "cardiology", "neurology", "pediatrics", "dermatology", "surgery", "psychiatry",
    "internal medicine", "family medicine", "gynecology", "orthopedics", "oncology",
    "ophthalmology", "otolaryngology", "urology", "endocrinology", "gastroenterology", "radiology", "anesthesiology", "general practice"
  ];

  // Check if current user already has a review for the active doctor
  const userExistingReview = reviews.find((r) => r.userId === user?.id);

  return (
    <div className="px-4 py-6 pb-24 space-y-6 max-w-7xl mx-auto" id="doctors-view-page">
      {/* Header */}
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-xl font-black text-gray-950 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-600" />
          Verified Medical Specialists
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Consult real clinical specialists, review verified licenses, and browse community patient care ratings.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by doctor name or clinical specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50/60 border border-gray-100 pl-10 pr-4 py-2 text-xs rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="bg-gray-50/60 border border-gray-100 px-3 py-2 text-xs rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:w-56"
        >
          <option value="all">All Specialties</option>
          {SPECIALTIES_LIST.map((spec) => (
            <option key={spec} value={spec}>
              {spec.charAt(0).toUpperCase() + spec.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Main Listing Grid */}
      {loading ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-gray-400 font-medium">Accessing verified medical listings...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 p-6 text-center rounded-3xl max-w-md mx-auto">
          <p className="text-xs text-rose-700 font-bold mb-1">Clinic directory unreachable</p>
          <p className="text-[11px] text-rose-500">{error}</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="bg-gray-50 border border-gray-100 py-16 text-center rounded-3xl">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500 font-bold">No verified clinical specialists found</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Try altering your search keywords or specialty filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doc) => {
            const specialtyLabel = doc.doctorProfile?.specialty || "general practice";
            const capitalizedSpecialty = specialtyLabel.charAt(0).toUpperCase() + specialtyLabel.slice(1);
            return (
              <div 
                key={doc.id}
                onClick={() => handleSelectDoctor(doc)}
                className="bg-white border border-gray-100 hover:border-emerald-100 hover:shadow-xs p-5 rounded-3xl transition-all cursor-pointer flex gap-4 group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50/50 border border-emerald-100 overflow-hidden flex items-center justify-center shrink-0">
                  {doc.doctorProfile?.profilePicture ? (
                    <img src={doc.doctorProfile.profilePicture} alt="Doctor" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-black text-emerald-800">{getInitials(doc.email)}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-black text-gray-950 group-hover:text-emerald-950 truncate transition-colors">
                      {getDoctorDisplayName(doc.email)}
                    </h3>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </div>
                  
                  <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    {capitalizedSpecialty}
                  </p>

                  <p className="text-[10px] text-gray-400 truncate">
                    {doc.doctorProfile?.phone || "Clinic contact not published"}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-[10px] text-emerald-800 font-bold">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-emerald-600" /> View Profile & Reviews
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DOCTOR DETAIL AND REVIEW MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-gray-100 flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 overflow-hidden flex items-center justify-center shrink-0">
                  {selectedDoc.doctorProfile?.profilePicture ? (
                    <img src={selectedDoc.doctorProfile.profilePicture} alt="Doctor profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-black text-emerald-800">{getInitials(selectedDoc.email)}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-black text-gray-950">{getDoctorDisplayName(selectedDoc.email)}</h2>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    {selectedDoc.doctorProfile?.specialty 
                      ? selectedDoc.doctorProfile.specialty.charAt(0).toUpperCase() + selectedDoc.doctorProfile.specialty.slice(1)
                      : "General Practice"
                    }
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {selectedDoc.id}</p>
                </div>
              </div>

              <button 
                onClick={handleCloseModal}
                className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              
              {/* Clinical Public Contact Info Card */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3.5">
                <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
                  Public Contact & Clinic Location
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {selectedDoc.doctorProfile?.phone && (
                    <div className="flex items-center gap-2.5 text-xs text-gray-700">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium">{selectedDoc.doctorProfile.phone}</span>
                    </div>
                  )}

                  {selectedDoc.doctorProfile?.email && (
                    <div className="flex items-center gap-2.5 text-xs text-gray-700">
                      <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium break-all">{selectedDoc.doctorProfile.email}</span>
                    </div>
                  )}

                  {selectedDoc.doctorProfile?.instagram && (
                    <div className="flex items-center gap-2.5 text-xs text-gray-700">
                      <Instagram className="w-4 h-4 text-emerald-600 shrink-0" />
                      <a 
                        href={selectedDoc.doctorProfile.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-800 hover:underline font-bold"
                      >
                        Instagram profile
                      </a>
                    </div>
                  )}

                  {selectedDoc.doctorProfile?.tiktok && (
                    <div className="flex items-center gap-2.5 text-xs text-gray-700">
                      <Instagram className="w-4 h-4 text-emerald-600 shrink-0" />
                      <a 
                        href={selectedDoc.doctorProfile.tiktok} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-800 hover:underline font-bold"
                      >
                        TikTok Profile
                      </a>
                    </div>
                  )}

                  {selectedDoc.doctorProfile?.facebook && (
                    <div className="flex items-center gap-2.5 text-xs text-gray-700">
                      <Facebook className="w-4 h-4 text-emerald-600 shrink-0" />
                      <a 
                        href={selectedDoc.doctorProfile.facebook} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-800 hover:underline font-bold"
                      >
                        Facebook Page
                      </a>
                    </div>
                  )}
                </div>

                {selectedDoc.doctorProfile?.clinicLocationUrl && (
                  <div className="pt-2 border-t border-gray-200">
                    <a 
                      href={selectedDoc.doctorProfile.clinicLocationUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white border border-emerald-100 hover:bg-emerald-50 text-emerald-950 font-bold text-xs py-2 px-3.5 rounded-xl inline-flex items-center gap-2 transition-all shadow-2xs"
                    >
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      Open Clinic Location in Google Maps
                    </a>
                  </div>
                )}

                {/* If absolutely nothing is published */}
                {!selectedDoc.doctorProfile?.phone && 
                 !selectedDoc.doctorProfile?.email && 
                 !selectedDoc.doctorProfile?.instagram && 
                 !selectedDoc.doctorProfile?.tiktok && 
                 !selectedDoc.doctorProfile?.facebook && 
                 !selectedDoc.doctorProfile?.clinicLocationUrl && (
                   <p className="text-[11px] text-gray-400 italic">This doctor has not published public contact channels yet.</p>
                 )}
              </div>

              {/* Patient Reviews Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" /> Patient Care Reviews ({reviews.length})
                  </h3>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg text-xs font-bold text-emerald-800">
                      <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500 shrink-0" />
                      {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)} / 5.0
                    </div>
                  )}
                </div>

                {reviewsLoading ? (
                  <div className="text-center py-4 text-[11px] text-gray-400">Loading patient reviews...</div>
                ) : reviews.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-6">No clinical reviews published for this doctor yet.</p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((rev) => {
                      const isOwner = user?.id === rev.userId;
                      return (
                        <div key={rev.id} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 space-y-2 relative">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-800">
                                {rev.userEmail.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-black text-gray-800">{rev.userEmail.split("@")[0]}</p>
                                <p className="text-[9px] text-gray-400 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {new Date(rev.createdAt).toLocaleDateString()}
                                  {rev.updatedAt && <span className="italic">(edited)</span>}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Rating stars display */}
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star 
                                    key={s} 
                                    className={`w-3 h-3 ${s <= rev.rating ? "fill-emerald-500 text-emerald-500" : "text-gray-200"}`} 
                                  />
                                ))}
                              </div>

                              {isOwner && (
                                <div className="flex gap-1 pl-2 border-l border-gray-200 ml-1">
                                  <button 
                                    onClick={() => handleEditReviewClick(rev)}
                                    className="p-1 text-gray-400 hover:text-emerald-700 transition-colors"
                                    title="Edit review"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteReview(rev.id)}
                                    className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                                    title="Delete review"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{rev.text}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Write/Edit Review Form Container */}
              <div className="border-t border-gray-100 pt-6 space-y-4">
                <h4 className="text-xs font-black text-gray-950 uppercase tracking-wider">
                  {editingReviewId ? "Modify Your Review" : "Write a Patient Care Review"}
                </h4>

                {!user ? (
                  <div className="bg-rose-50 border border-rose-100 p-3.5 text-center rounded-2xl">
                    <p className="text-[11px] text-rose-700 font-bold">Authentication required</p>
                    <p className="text-[10px] text-rose-500 mt-0.5">Please sign up or log in to leave reviews on clinical profiles.</p>
                  </div>
                ) : userExistingReview && !editingReviewId ? (
                  <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between gap-3">
                    <p className="text-[11px] text-emerald-950 font-medium">
                      You have already submitted a review for this doctor. To make adjustments, click the edit button above on your review.
                    </p>
                    <button 
                      onClick={() => handleEditReviewClick(userExistingReview)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg shrink-0 transition-colors"
                    >
                      Edit Review
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    {reviewError && (
                      <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl font-bold">
                        {reviewError}
                      </div>
                    )}
                    {reviewSuccess && (
                      <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-3.5 py-2.5 rounded-xl font-bold animate-pulse-once">
                        {reviewSuccess}
                      </div>
                    )}

                    {/* Star selection picker */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Patient Rating
                      </label>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setRating(s)}
                            className="p-1 text-gray-300 hover:scale-110 transition-transform"
                          >
                            <Star 
                              className={`w-6 h-6 ${s <= rating ? "fill-emerald-500 text-emerald-500" : "text-gray-200"}`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Review text comment */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Review comment / feedback
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Detail your care experience, clinical communication, advice usefulness, bedside manner..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        {submittingReview ? "Saving review..." : (editingReviewId ? "Save Modifications" : "Submit Patient Review")}
                      </button>
                      
                      {editingReviewId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReviewId(null);
                            setRating(5);
                            setReviewText("");
                          }}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
