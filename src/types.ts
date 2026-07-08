export interface DoctorProfile {
  specialty: string;
  profilePicture?: string; // base64 compressed string
  phone?: string;
  email?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  clinicLocationUrl?: string;
}

export interface DoctorReview {
  id: string;
  doctorId: string; // The user ID of the doctor
  userId: string; // The user ID of the reviewer
  userEmail: string; // The reviewer email
  rating: number; // 1-5 rating
  text: string; // Review comment
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  role: 'user' | 'admin' | 'doctor';
  savedArticles: string[]; // List of article IDs
  readingHistory: {
    articleId: string;
    readAt: string;
  }[];
  chatHistory?: ChatMessage[];
  settings?: {
    theme?: string;
    language?: string;
    notifications?: boolean;
    doctorContactNum?: string;
    doctorContactMethod?: 'whatsapp' | 'sms';
  };
  verificationStatus?: 'pending' | 'accepted' | 'declined' | null;
  verificationDeclinedAt?: string | null;
  notification?: string | null;
  createdAt: string;
  doctorProfile?: DoctorProfile;
}

export interface Article {
  id: string;
  title: string;
  slug?: string; // SEO-friendly slug
  summary: string;
  content: string; // Detailed educational body in markdown
  category: string;
  tags: string[];
  source: string; // Trusted medical source/reference
  approved: boolean; // Needs admin approval if generated from link
  createdAt: string;
  readTime?: number; // Estimated read time in minutes
}

export interface Report {
  id: string;
  articleId: string;
  articleTitle: string;
  userId: string;
  userEmail: string;
  reason: 'outdated' | 'incorrect' | 'unsafe' | 'irrelevant';
  details: string;
  resolved: boolean;
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userEmail: string;
  info: string;
  files: { name: string; type: string; dataUrl: string }[];
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  createdAt: string;
  suggestedArticles?: { id: string; title: string; summary: string }[];
  threadId?: string;
  threadTitle?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: 'user' | 'admin' | 'doctor';
  };
}
