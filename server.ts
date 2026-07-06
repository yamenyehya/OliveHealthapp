import express from "express";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";

// Load environment variables
dotenv.config();

import {
  initDb,
  getArticles,
  getArticle,
  getArticleBySlug,
  generateSlug,
  createArticle,
  updateArticle,
  deleteArticle,
  getReports,
  createReport,
  resolveReport,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  getVerificationRequests,
  createVerificationRequest,
  updateVerificationRequest,
  getDoctors,
  getReviews,
  createReview,
  updateReview,
  deleteReview
} from "./server/db-controller.js";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "yamen_secret_jwt_key_development_only";

// Lazy-initialize Gemini SDK to prevent crashes if key is initially absent
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it to your environment secrets in the Settings menu.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {}
      }
    });
  }
  return aiClient;
}

// Authentication Middlewares
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Authentication token required" });

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = decoded;
    next();
  });
}

function requireAdmin(req: any, res: any, next: any) {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      res.status(403).json({ error: "Admin permissions required" });
    }
  });
}

// Optional Auth for public endpoints (to trace bookmarks if user is logged in)
function optionalAuthenticate(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    req.user = null;
    return next();
  }
  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      req.user = null;
    } else {
      req.user = decoded;
    }
    next();
  });
}

// ---------------------- API ROUTES ----------------------

// 1. Authentication Routes
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Automatically make yamenyehya608@gmail.com the admin
    const role = email.toLowerCase().trim() === "yamenyehya608@gmail.com" ? "admin" : "user";

    const user = await createUser({
      email,
      passwordHash,
      role
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error creating user" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Check if logging in as owner admin yamenyehya608@gmail.com / yamen1234*
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error logging in" });
  }
});

function getGoogleRedirectUri(req: any): string {
  const host = req.get("host");
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  return `${protocol}://${host}/api/auth/google/callback`;
}

app.get("/api/auth/me", authenticateToken, async (req: any, res: any) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      savedArticles: user.savedArticles || [],
      readingHistory: user.readingHistory || [],
      settings: user.settings || {},
      verificationStatus: user.verificationStatus || null,
      verificationDeclinedAt: user.verificationDeclinedAt || null,
      notification: user.notification || null
    });
  } catch (err: any) {
    res.status(500).json({ error: "Error retrieving profile" });
  }
});

// Clear User Notification
app.post("/api/auth/notifications/clear", authenticateToken, async (req: any, res: any) => {
  try {
    const updated = await updateUser(req.user.id, { notification: null });
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to clear notification" });
  }
});

// Google OAuth Authorization URL
app.get("/api/auth/google/url", (req: any, res: any) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || "333555555555-dummy.apps.googleusercontent.com";
  const redirectUri = getGoogleRedirectUri(req);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent"
  });
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
});

// Google OAuth callback
app.get("/api/auth/google/callback", async (req: any, res: any) => {
  const { code, error } = req.query;
  if (error) {
    return res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: "${error}" }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not configured.");
    }

    const redirectUri = getGoogleRedirectUri(req);
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Google token exchange failed: ${errText}`);
    }

    const tokens: any = await tokenResponse.json();
    const accessToken = tokens.access_token;
    
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!profileResponse.ok) {
      throw new Error("Failed to fetch Google user profile.");
    }

    const profile: any = await profileResponse.json();
    const email = profile.email;
    if (!email) {
      throw new Error("No email returned by Google profile.");
    }

    let user = await getUserByEmail(email);
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(Math.random().toString(36), salt);
      const role = email.toLowerCase().trim() === "yamenyehya608@gmail.com" ? "admin" : "user";
      user = await createUser({
        email,
        passwordHash,
        role
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: "${token}", user: ${JSON.stringify({ id: user.id, email: user.email, role: user.role })} }, '*');
              window.close();
            } else {
              localStorage.setItem("health_platform_token", "${token}");
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. You can close this window now.</p>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("Google OAuth error:", err);
    res.send(`
      <html>
        <head>
          <style>
            body { font-family: -apple-system, sans-serif; padding: 24px; color: #1e293b; background: #f8fafc; line-height: 1.5; }
            .card { max-width: 500px; margin: 40px auto; padding: 32px; background: white; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            h1 { font-size: 20px; color: #0f172a; margin-top: 0; }
            code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; }
            .btn { display: inline-block; background: #606c38; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; text-decoration: none; font-size: 13px; margin-top: 16px; }
            .fallback-notice { margin-top: 16px; padding: 12px; border-radius: 8px; background: #fef3c7; border: 1px solid #fde68a; color: #92400e; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Google OAuth Integration Setup</h1>
            <p>To use Google Sign-In, configure these environment variables in your Settings menu inside Google AI Studio:</p>
            <ul>
              <li><code>GOOGLE_CLIENT_ID</code></li>
              <li><code>GOOGLE_CLIENT_SECRET</code></li>
            </ul>
            <p>Make sure to add the following Authorized redirect URI to your Google Cloud Console Credentials:</p>
            <p><code>${getGoogleRedirectUri(req)}</code></p>
            
            <div class="fallback-notice">
              <strong>Local Development Mode:</strong> For testing purposes inside the preview workspace, you can click the button below to proceed with a simulated local test account (<code>test-user@gmail.com</code>).
            </div>
            <button class="btn" onclick="triggerTestLogin()">Simulate Google Login</button>
          </div>
          <script>
            function triggerTestLogin() {
              fetch('/api/auth/google/simulate-test')
                .then(r => r.json())
                .then(data => {
                  if (window.opener) {
                    window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: data.token, user: data.user }, '*');
                    window.close();
                  } else {
                    localStorage.setItem("health_platform_token", data.token);
                    window.location.href = '/';
                  }
                });
            }
          </script>
        </body>
      </html>
    `);
  }
});

app.get("/api/auth/google/simulate-test", async (req: any, res: any) => {
  try {
    const email = "test-user@gmail.com";
    let user = await getUserByEmail(email);
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash("test1234*", salt);
      user = await createUser({
        email,
        passwordHash,
        role: "user"
      });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Verification Request
app.post("/api/verification/request", authenticateToken, async (req: any, res: any) => {
  const { info, files } = req.body;
  
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "doctor" || user.role === "admin") {
      return res.status(400).json({ error: "You are already a verified professional or administrator." });
    }

    if (user.verificationStatus === "pending") {
      return res.status(400).json({ error: "You already have a verification request pending review." });
    }

    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    if (user.verificationStatus === "declined" && user.verificationDeclinedAt) {
      const declinedTime = new Date(user.verificationDeclinedAt).getTime();
      if (Date.now() - declinedTime < oneWeek) {
        const daysLeft = Math.ceil((oneWeek - (Date.now() - declinedTime)) / (24 * 60 * 60 * 1000));
        return res.status(400).json({ error: `Your previous verification request was declined. You must wait ${daysLeft} more day(s) before applying again.` });
      }
    }

    // Create verification request
    await createVerificationRequest({
      userId: user.id,
      userEmail: user.email,
      info: info || "",
      files: files || [],
      status: "pending"
    });

    // Update user status
    const updatedUser = await updateUser(user.id, {
      verificationStatus: "pending"
    });

    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to submit request" });
  }
});

// Admin: Get all verification requests
app.get("/api/admin/verification/requests", authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const requests = await getVerificationRequests();
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve verification requests" });
  }
});

// Admin: Approve/Decline request
app.post("/api/admin/verification/requests/:id/action", authenticateToken, requireAdmin, async (req: any, res: any) => {
  const { id } = req.params;
  const { action } = req.body; // 'accept' | 'decline'

  if (action !== "accept" && action !== "decline") {
    return res.status(400).json({ error: "Invalid action. Must be accept or decline." });
  }

  try {
    const requests = await getVerificationRequests();
    const verificationReq = requests.find(r => r.id === id);
    if (!verificationReq) {
      return res.status(404).json({ error: "Verification request not found" });
    }

    const applicantId = verificationReq.userId;

    if (action === "accept") {
      await updateVerificationRequest(id, "accepted");
      await updateUser(applicantId, {
        role: "doctor",
        verificationStatus: "accepted",
        verificationDeclinedAt: null,
        notification: "Congratulations! Your application to become a verified medical professional has been ACCEPTED. You now have access to the Doctors Hub."
      });
    } else {
      await updateVerificationRequest(id, "declined");
      await updateUser(applicantId, {
        verificationStatus: "declined",
        verificationDeclinedAt: new Date().toISOString(),
        notification: "We have reviewed your verification request and unfortunately decided to decline it at this time. You can apply again in 1 week."
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Action failed" });
  }
});

// Doctor: Submit Article Draft
app.post("/api/doctor/articles", authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== "doctor" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Only verified doctors can submit articles." });
  }

  const { title, summary, content, category, tags, source } = req.body;
  if (!title || !content || !category) {
    return res.status(400).json({ error: "Title, content, and category are required" });
  }

  try {
    const newArt = await createArticle({
      title,
      summary: summary || "",
      content,
      category,
      tags: tags || [],
      source: source || `Verified Doctor (${req.user.email})`,
      approved: false // Set as unapproved draft!
    });

    res.status(201).json(newArt);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to submit draft article" });
  }
});

// Doctor: Request Article Edit
app.post("/api/doctor/edit-requests", authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== "doctor" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Only verified doctors can request article edits." });
  }

  const { articleId, articleTitle, details } = req.body;
  if (!articleId || !articleTitle || !details) {
    return res.status(400).json({ error: "Article info and edit details are required" });
  }

  try {
    const newRequest = await createReport({
      articleId,
      articleTitle,
      userId: req.user.id,
      userEmail: req.user.email,
      reason: "edit_request" as any,
      details
    });

    res.status(201).json(newRequest);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to submit edit request" });
  }
});

// Doctor: AI Ingestion Draft
app.post("/api/doctor/extract", authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== "doctor" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Only verified doctors can extract content via AI." });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const gemini = getGeminiClient();

    const prompt = `You are a medical content curator. We need to extract and synthesize a highly trusted, educational, structured medical article from the following external source or based on its topic: "${url}".
Extract and generate a complete, rich educational draft with detailed headers.
You must output a single, structured JSON document strictly matching this schema:
{
  "title": "A concise, engaging clinical title",
  "summary": "A 1-2 sentence overview suitable for mobile listing",
  "category": "The specific field (e.g., General Wellness, Mental Health, Infectious Diseases, Chronic Conditions)",
  "tags": ["at least 15 to 25 highly specific and relevant keyword tags (lowercase, 1-2 words each) covering symptoms, systems, prevention, and key clinical concepts mentioned"],
  "content": "A long-form, rich educational body formatted in clean markdown. Use headers (##, ###), bullet points, and charts if helpful. Ensure the tone is extremely trusted, objective, and easy to read on mobile. Limit clinical jargon or define it.",
  "source": "Name of the reference source or synthesized trusted references based on ${url}"
}`;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "summary", "category", "tags", "content", "source"],
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            category: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            content: { type: Type.STRING },
            source: { type: Type.STRING }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Doctor AI Ingestion failed:", err);
    res.status(500).json({ error: `Ingestion failed: ${err.message || "Please check your clinical AI gateway configurations."}` });
  }
});

// Update Doctor Profile
app.put("/api/doctor/profile", authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== "doctor" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Only verified doctors can update their doctor profile." });
  }

  const { specialty, profilePicture, phone, email, instagram, tiktok, facebook, clinicLocationUrl } = req.body;

  if (!specialty) {
    return res.status(400).json({ error: "Doctor Specialty is required." });
  }

  const specialtyLower = specialty.toLowerCase().trim();
  const VALID_SPECIALTIES = [
    "cardiology", "neurology", "pediatrics", "dermatology", "surgery", "psychiatry",
    "internal medicine", "family medicine", "gynecology", "orthopedics", "oncology",
    "ophthalmology", "otolaryngology", "urology", "endocrinology", "gastroenterology", "radiology", "anesthesiology", "general practice"
  ];
  if (!VALID_SPECIALTIES.includes(specialtyLower)) {
    return res.status(400).json({ error: `Invalid specialty selected. Please select from standard specialties.` });
  }

  if (phone) {
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Invalid phone number format. Use numeric characters, spaces, hyphens, and parentheses." });
    }
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid public email format." });
    }
  }

  if (instagram) {
    const instaRegex = /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.]+\/?$/;
    if (!instaRegex.test(instagram)) {
      return res.status(400).json({ error: "Invalid Instagram URL. Format must be: https://instagram.com/username" });
    }
  }

  if (tiktok) {
    const tiktokRegex = /^https:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9_.-]+\/?$/;
    if (!tiktokRegex.test(tiktok)) {
      return res.status(400).json({ error: "Invalid TikTok URL. Format must be: https://tiktok.com/@username" });
    }
  }

  if (facebook) {
    const fbRegex = /^https:\/\/(www\.)?facebook\.com\/[A-Za-z0-9.]+\/?$/;
    if (!fbRegex.test(facebook)) {
      return res.status(400).json({ error: "Invalid Facebook URL. Format must be: https://facebook.com/username" });
    }
  }

  if (clinicLocationUrl) {
    const mapsRegex = /^https:\/\/(www\.)?(google\.com\/maps|maps\.app\.goo\.gl)\/.*$/;
    if (!mapsRegex.test(clinicLocationUrl)) {
      return res.status(400).json({ error: "Invalid Clinic Location link. Must be a valid Google Maps URL (google.com/maps or maps.app.goo.gl)." });
    }
  }

  try {
    const updatedProfile = {
      specialty: specialtyLower,
      profilePicture: profilePicture || undefined,
      phone: phone || undefined,
      email: email || undefined,
      instagram: instagram || undefined,
      tiktok: tiktok || undefined,
      facebook: facebook || undefined,
      clinicLocationUrl: clinicLocationUrl || undefined
    };

    const updatedUser = await updateUser(req.user.id, { doctorProfile: updatedProfile });
    if (!updatedUser) {
      return res.status(500).json({ error: "Failed to update doctor profile." });
    }

    res.json({ success: true, doctorProfile: updatedUser.doctorProfile });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update doctor profile on server" });
  }
});

// Get Verified Doctors
app.get("/api/doctors", async (req, res) => {
  try {
    const doctorsList = await getDoctors();
    res.json(doctorsList);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch doctors list" });
  }
});

// Get Reviews for a specific Doctor
app.get("/api/doctors/:id/reviews", async (req, res) => {
  try {
    const reviews = await getReviews(req.params.id);
    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Create/Add a Review on a Doctor Profile
app.post("/api/doctors/:id/reviews", authenticateToken, async (req: any, res: any) => {
  const doctorId = req.params.id;
  const { rating, text } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating is required and must be between 1 and 5." });
  }
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Review text/comment is required." });
  }

  try {
    const doc = await getUserById(doctorId);
    if (!doc || doc.role !== "doctor") {
      return res.status(404).json({ error: "Doctor not found or invalid role." });
    }

    const existingReviews = await getReviews(doctorId);
    const alreadyReviewed = existingReviews.some((r) => r.userId === req.user.id);
    if (alreadyReviewed) {
      return res.status(400).json({ error: "You can only submit one review per doctor. Please edit your existing review instead." });
    }

    const review = await createReview({
      doctorId,
      userId: req.user.id,
      userEmail: req.user.email,
      rating: Number(rating),
      text: text.trim()
    });

    res.status(201).json(review);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save review" });
  }
});

// Update an existing Review
app.put("/api/doctors/:id/reviews/:reviewId", authenticateToken, async (req: any, res: any) => {
  const { rating, text } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5." });
  }
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Review comment text is required." });
  }

  try {
    const updated = await updateReview(req.params.reviewId, req.user.id, {
      rating: Number(rating),
      text: text.trim()
    });
    if (!updated) {
      return res.status(404).json({ error: "Review not found or unauthorized editing." });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update review" });
  }
});

// Delete an existing Review
app.delete("/api/doctors/:id/reviews/:reviewId", authenticateToken, async (req: any, res: any) => {
  try {
    const success = await deleteReview(req.params.reviewId, req.user.id);
    if (!success) {
      return res.status(404).json({ error: "Review not found or unauthorized deletion." });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// Update Settings / Preferences
app.put("/api/auth/settings", authenticateToken, async (req: any, res: any) => {
  const { theme, language, notifications } = req.body;
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedSettings = {
      theme: theme !== undefined ? theme : (user.settings?.theme || "botanical"),
      language: language !== undefined ? language : (user.settings?.language || "en"),
      notifications: notifications !== undefined ? notifications : (user.settings?.notifications !== false)
    };

    const updated = await updateUser(user.id, { settings: updatedSettings });
    res.json({ success: true, settings: updated.settings });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update preferences on server" });
  }
});

// Update Security Password
app.put("/api/auth/change-password", authenticateToken, async (req: any, res: any) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new passwords are required" });
  }

  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: "Current password does not match" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await updateUser(user.id, { passwordHash });
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update security credentials" });
  }
});

// 2. Health Article Routes
app.get("/api/articles", optionalAuthenticate, async (req: any, res: any) => {
  try {
    // Admins can see all articles including unapproved drafts, normal users only see approved
    const isAdminUser = req.user && req.user.role === "admin";
    const articles = await getArticles(!isAdminUser);
    res.json(articles);
  } catch (err: any) {
    res.status(500).json({ error: "Error fetching articles" });
  }
});

app.get("/api/articles/:id", optionalAuthenticate, async (req: any, res: any) => {
  try {
    const article = await getArticle(req.params.id);
    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    // Only allow view of unapproved articles for admins
    if (!article.approved) {
      const isAdminUser = req.user && req.user.role === "admin";
      if (!isAdminUser) {
        return res.status(403).json({ error: "Article pending approval" });
      }
    }

    // Record in reading history if authenticated
    if (req.user) {
      const user = await getUserById(req.user.id);
      if (user) {
        const updatedHistory = [
          { articleId: article.id, readAt: new Date().toISOString() },
          ...((user.readingHistory || []).filter((h: any) => h.articleId !== article.id))
        ].slice(0, 50); // Keep last 50
        await updateUser(user.id, { readingHistory: updatedHistory });
      }
    }

    res.json(article);
  } catch (err: any) {
    res.status(500).json({ error: "Error fetching article" });
  }
});

app.get("/api/articles/by-slug/:slug", optionalAuthenticate, async (req: any, res: any) => {
  try {
    const article = await getArticleBySlug(req.params.slug);
    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    // Only allow view of unapproved articles for admins
    if (!article.approved) {
      const isAdminUser = req.user && req.user.role === "admin";
      if (!isAdminUser) {
        return res.status(403).json({ error: "Article pending approval" });
      }
    }

    // Record in reading history if authenticated
    if (req.user) {
      const user = await getUserById(req.user.id);
      if (user) {
        const updatedHistory = [
          { articleId: article.id, readAt: new Date().toISOString() },
          ...((user.readingHistory || []).filter((h: any) => h.articleId !== article.id))
        ].slice(0, 50); // Keep last 50
        await updateUser(user.id, { readingHistory: updatedHistory });
      }
    }

    res.json(article);
  } catch (err: any) {
    res.status(500).json({ error: "Error fetching article by slug" });
  }
});

// Add manual article (Admin)
app.post("/api/articles", requireAdmin, async (req, res) => {
  const { title, summary, content, category, tags, source, approved } = req.body;
  if (!title || !summary || !content) {
    return res.status(400).json({ error: "Title, summary, and content are required" });
  }

  try {
    const created = await createArticle({
      title,
      summary,
      content,
      category: category || "General Health",
      tags: tags || [],
      source: source || "Self-published",
      approved: approved !== undefined ? approved : true
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: "Error creating article" });
  }
});

// Update article (Admin)
app.put("/api/articles/:id", requireAdmin, async (req, res) => {
  try {
    const updated = await updateArticle(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Article not found" });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "Error updating article" });
  }
});

// Delete article (Admin)
app.delete("/api/articles/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await deleteArticle(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Article not found" });
    }
    res.json({ success: true, message: "Article successfully deleted" });
  } catch (err: any) {
    res.status(500).json({ error: "Error deleting article" });
  }
});

// Bookmark / Save Article Toggle (User)
app.post("/api/articles/:id/toggle-save", authenticateToken, async (req: any, res: any) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const articleId = req.params.id;
    const article = await getArticle(articleId);
    if (!article) return res.status(404).json({ error: "Article not found" });

    const saved = user.savedArticles || [];
    const isSaved = saved.includes(articleId);
    let updatedSaved: string[];

    if (isSaved) {
      updatedSaved = saved.filter((id: string) => id !== articleId);
    } else {
      updatedSaved = [...saved, articleId];
    }

    await updateUser(user.id, { savedArticles: updatedSaved });
    res.json({ saved: !isSaved, savedArticles: updatedSaved });
  } catch (err: any) {
    res.status(500).json({ error: "Error saving article" });
  }
});

// Report/Flag Article
app.post("/api/articles/:id/report", optionalAuthenticate, async (req: any, res: any) => {
  const { reason, details } = req.body;
  if (!reason) {
    return res.status(400).json({ error: "Reason for report is required" });
  }

  try {
    const article = await getArticle(req.params.id);
    if (!article) return res.status(404).json({ error: "Article not found" });

    const userId = req.user ? req.user.id : "anonymous";
    const userEmail = req.user ? req.user.email : "anonymous@healthplatform.org";

    const report = await createReport({
      articleId: article.id,
      articleTitle: article.title,
      userId,
      userEmail,
      reason,
      details: details || ""
    });

    res.status(201).json({ success: true, message: "Report successfully filed. Thank you for maintaining content quality.", report });
  } catch (err: any) {
    res.status(500).json({ error: "Error filing report" });
  }
});

// 3. Admin Moderation Routes
app.get("/api/admin/reports", requireAdmin, async (req, res) => {
  try {
    const reports = await getReports();
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: "Error fetching moderation reports" });
  }
});

app.post("/api/admin/reports/:id/resolve", requireAdmin, async (req, res) => {
  try {
    const resolved = await resolveReport(req.params.id);
    if (!resolved) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.json({ success: true, message: "Report marked as resolved" });
  } catch (err: any) {
    res.status(500).json({ error: "Error resolving report" });
  }
});

// AI Autogenerated Extraction (Admin)
app.post("/api/admin/extract", requireAdmin, async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const gemini = getGeminiClient();

    const prompt = `You are a medical content curator. We need to extract and synthesize a highly trusted, educational, structured medical article from the following external source or based on its topic: "${url}".
Extract and generate a complete, rich educational draft with detailed headers.
You must output a single, structured JSON document strictly matching this schema:
{
  "title": "A concise, engaging clinical title",
  "summary": "A 1-2 sentence overview suitable for mobile listing",
  "category": "The specific field (e.g., General Wellness, Mental Health, Infectious Diseases, Chronic Conditions)",
  "tags": ["at least 15 to 25 highly specific and relevant keyword tags (lowercase, 1-2 words each) covering symptoms, systems, prevention, and key clinical concepts mentioned"],
  "content": "A long-form, rich educational body formatted in clean markdown. Use headers (##, ###), bullet points, and charts if helpful. Ensure the tone is extremely trusted, objective, and easy to read on mobile. Limit clinical jargon or define it.",
  "source": "Name of the reference source or synthesized trusted references based on ${url}"
}`;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "summary", "category", "tags", "content", "source"],
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            category: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            content: { type: Type.STRING },
            source: { type: Type.STRING }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    // Return unapproved draft to let the admin review/edit before clicking Approve and Publish
    res.json(parsedData);
  } catch (err: any) {
    console.error("AI Ingestion failed:", err);
    res.status(500).json({ error: `Ingestion failed: ${err.message || "Please check your clinical AI gateway configurations."}` });
  }
});

// AI Autogenerated Tags (Admin)
app.post("/api/admin/generate-tags", requireAdmin, async (req, res) => {
  const { title, summary, content, category } = req.body;
  try {
    const gemini = getGeminiClient();
    const prompt = `You are a medical content classifier. Generate at least 15 to 25 highly specific and relevant keyword search tags (comma-separated, lowercase, no numbers, single word or short phrase of 1-2 words) for a medical article with:
Title: "${title || ""}"
Summary: "${summary || ""}"
Category: "${category || ""}"
Content: "${(content || "").substring(0, 1000)}"

Return a raw JSON object matching this schema exactly:
{
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", "tag13", "tag14", "tag15"]
}`;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["tags"],
          properties: {
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ tags: parsed.tags || [] });
  } catch (err: any) {
    console.error("Failed to generate tags:", err);
    res.status(500).json({ error: "Failed to generate tags" });
  }
});

// 4. AI-Powered Assistant Route (Strictly Educational)
app.post("/api/ai/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const gemini = getGeminiClient();
    const dbArticles = await getArticles(true);

    // Filter down matching articles list to save context tokens
    const briefArticlesList = dbArticles.map(art => ({
      id: art.id,
      title: art.title,
      summary: art.summary
    }));

    const systemInstruction = `You are an AI Educational Health Assistant for a modern mobile-first health platform.
Your ONLY role is to provide trusted medical education, explanations of health concepts, and guiding users to verified resources.
- STRICT RESTRICTIONS: You CANNOT make clinical diagnoses, prescribe medicine, evaluate specific lab reports, or provide direct treatment decisions.
- DO NOT say "I diagnose you" or "You have...". Instead say, "This symptom is commonly related to...". Always recommend consulting a healthcare provider for any diagnostic or emergency concern.
- ARTICLE SELECTION & RECOMMENDATION: You have direct access to our verified health database. Your goal is to guide users to these articles when relevant.
Below are the titles and summaries of verified educational articles available in our database:
${JSON.stringify(briefArticlesList, null, 2)}

When answering, if any of these articles are relevant to the user's question, refer to them.
Your output MUST be structured in JSON format so our platform can render beautiful markdown and display recommended article links below your bubble.
Schema:
{
  "text": "Your complete response in elegant, helpful markdown. Use bullet points, bold key terms, and maintain a highly compassionate, trusted medical tone. If referring to a database article, mention its title in the text.",
  "suggestedArticles": [
    {
      "id": "The exact ID of the matching database article from the list above",
      "title": "The exact Title of the matching database article",
      "summary": "Brief summary"
    }
  ]
}
If no database articles are matching, return suggestedArticles as an empty array [].`;

    const chatMessages = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        chatMessages.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      }
    }
    chatMessages.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatMessages,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["text", "suggestedArticles"],
          properties: {
            text: { type: Type.STRING },
            suggestedArticles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "title", "summary"],
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const output = JSON.parse(response.text || "{}");
    res.json(output);
  } catch (err: any) {
    console.error("AI Assistant Chat failed:", err);
    res.status(500).json({ error: `Assistant offline: ${err.message || "Please check your clinical AI gateway configurations."}` });
  }
});


// ---------------------- FRONTEND ROUTING ----------------------

async function startServer() {
  // Initialize Database (Fallback or MongoDB)
  await initDb();

  // Dynamic Sitemap for maximum search engine indexing
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const articles = await getArticles(true);
      const appUrl = process.env.APP_URL || "https://paeonix.onrender.com";
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      
      // Homepage & Static Pages
      const staticPages = [
        { path: "", freq: "daily", priority: "1.0" },
        { path: "/login", freq: "monthly", priority: "0.8" },
        { path: "/signup", freq: "monthly", priority: "0.8" },
        { path: "/assistant", freq: "daily", priority: "0.8" },
        { path: "/saved", freq: "weekly", priority: "0.7" },
        { path: "/profile", freq: "weekly", priority: "0.7" },
        { path: "/settings", freq: "monthly", priority: "0.6" }
      ];

      for (const p of staticPages) {
        xml += `  <url>\n`;
        xml += `    <loc>${appUrl}${p.path}</loc>\n`;
        xml += `    <changefreq>${p.freq}</changefreq>\n`;
        xml += `    <priority>${p.priority}</priority>\n`;
        xml += `  </url>\n`;
      }
      
      // Articles
      for (const art of articles) {
        const slug = art.slug || generateSlug(art.title);
        xml += `  <url>\n`;
        xml += `    <loc>${appUrl}/articles/${slug}</loc>\n`;
        xml += `    <lastmod>${new Date(art.createdAt).toISOString().split('T')[0]}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
      
      xml += `</urlset>`;
      
      res.header("Content-Type", "application/xml");
      res.send(xml);
    } catch (err) {
      console.error("Error generating sitemap:", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Dynamic Robots.txt pointing to the dynamic sitemap
  app.get("/robots.txt", (req, res) => {
    const appUrl = process.env.APP_URL || "https://paeonix.onrender.com";
    const robots = `User-agent: *\nAllow: /\nSitemap: ${appUrl}/sitemap.xml\n`;
    res.header("Content-Type", "text/plain");
    res.send(robots);
  });

  // Server-Side SEO Meta Injection for Article URLs
  app.get("/articles/:slug", async (req: any, res: any, next: any) => {
    const { slug } = req.params;
    try {
      const article = await getArticleBySlug(slug);
      if (!article) {
        return next(); // Pass through to frontend routing (which handles 404/not found)
      }

      let htmlPath = "";
      if (process.env.NODE_ENV === "production") {
        htmlPath = path.join(process.cwd(), "dist", "index.html");
      } else {
        htmlPath = path.join(process.cwd(), "index.html");
      }

      if (!fs.existsSync(htmlPath)) {
        return next();
      }

      let html = fs.readFileSync(htmlPath, "utf-8");

      // Replace title, description, and OpenGraph/Twitter Card metadata
      const title = `${article.title} | PAEONIX Encyclopedia`;
      const description = article.summary;
      const url = `${process.env.APP_URL || "https://paeonix.onrender.com"}/articles/${slug}`;

      // Clean existing title
      html = html.replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`);
      
      // Inject or update meta description
      if (html.includes('<meta name="description"')) {
        html = html.replace(/<meta name="description" content=".*?"/gi, `<meta name="description" content="${description}"`);
      } else {
        html = html.replace('</head>', `  <meta name="description" content="${description}">\n</head>`);
      }

      // Inject rich OpenGraph and Twitter tags
      const ogTags = `
  <!-- PAEONIX SEO Injection -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="PAEONIX">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
`;
      html = html.replace('</head>', `${ogTags}\n</head>`);

      res.send(html);
    } catch (err) {
      console.error("SEO Meta Injection failed:", err);
      next();
    }
  });

  if (process.env.NODE_ENV !== "production") {
    // Mount Vite middleware for dev mode hot-reloading
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Educational Health Platform running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
