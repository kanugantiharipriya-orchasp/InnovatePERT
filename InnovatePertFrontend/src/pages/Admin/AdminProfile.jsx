import { useEffect, useState } from "react";
import useScrollLock from "../../utils/useScrollLock";
import AdminSidebar from "./AdminSidebar";
import PasswordInput from "../../components/PasswordInput";
import {
  FaCamera,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
  FaKey,
  FaLock,
  FaEnvelope,
  FaIdCard,
  FaShieldAlt,
  FaCalendarAlt,
  FaCheckCircle,
  FaUserCircle,
} from "react-icons/fa";
import {
  validatePersonName,
  validateEmail,
  validatePassword,
  handleNameInput,
} from "../../utils/validation";

const API_BASE = "http://localhost:8080";

const ADMIN_LOCAL_IMG_KEY = (name) => `admin_profile_image_${name}`;

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function AdminProfile() {
  const getToken = () => localStorage.getItem("token");
  const [showProfilePhoto, setShowProfilePhoto] = useState(false);

  // ── profile ────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
    displayRole: "",
    createdAt: "",
    profilePicture: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "" });

  // ── password modal ─────────────────────────────────────────────────────
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  useScrollLock(showProfilePhoto || showPasswordModal);
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ── ui state ───────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  const flash = (setFn, msg, ms = 3500) => {
    setFn(msg);
    setTimeout(() => setFn(""), ms);
  };

  // ── GET /api/admin/profile ─────────────────────────────────────────────
  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/profile`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch profile (${res.status})`);
      const data = await res.json();

      const name = data.name ?? data.fullName ?? "";

      setProfile({
        name,
        email: data.email ?? "",
        role: data.role ?? "",
        displayRole: data.displayRole ?? data.role ?? "",
        createdAt: data.createdAt ?? "",
        profilePicture: "",
      });

      const imgRes = await fetch(`${API_BASE}/api/admin/profile/image`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (imgRes.ok) {
        const blob = await imgRes.blob();
        if (blob.size > 0) {
          setProfile((prev) => ({
            ...prev,
            profilePicture: URL.createObjectURL(blob),
          }));
          return;
        }
      }

      const saved = localStorage.getItem(ADMIN_LOCAL_IMG_KEY(name));
      if (saved) setProfile((prev) => ({ ...prev, profilePicture: saved }));
    } catch (err) {
      console.error(err);
      setError("Could not load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Open edit form pre-filled
  const openEdit = () => {
    setEditForm({ name: profile.name, email: profile.email });
    setError("");
    setSuccess("");
    setEditMode(true);
  };

  const getProfileErrors = () => {
    const errs = {};
    if (!editForm.name.trim()) errs.name = "Full Name is required";
    else if (editForm.name.trim().length < 2 || editForm.name.trim().length > 50) errs.name = "Full Name should be between 2 and 50 characters";
    else if (!/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(editForm.name)) errs.name = "Name can contain letters and single spaces only.";
    
    if (!editForm.email.trim()) errs.email = "Email is required";
    else {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(editForm.email)) errs.email = "Invalid email";
    }
    return errs;
  };

  // ── PUT /api/admin/profile/update ──────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();

    const errs = getProfileErrors();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSaving(true);
    setError("");
    setFieldErrors({});
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: editForm.name,
          email: editForm.email,
        }),
      });
      if (!res.ok) {
        let msg = `Update failed (${res.status})`;
        try {
          const d = await res.json();
          msg = d.message || msg;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      const responseText = await res.text();
      if (responseText.startsWith("eyJ")) {
        localStorage.setItem("token", responseText);
      }

      setEditMode(false);
      await fetchProfile();
      flash(setSuccess, "Profile updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── PUT /api/admin/profile/change-password ─────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    setFieldErrors({});

    const errs = {};
    if (!password.currentPassword) {
      errs.currentPassword = "Current password is required";
    }

    if (!password.newPassword) {
      errs.newPassword = "New password is required";
    } else {
      if (password.newPassword.length < 8 || password.newPassword.length > 16) {
        errs.newPassword = "Password must be 8-16 characters";
      } else if (!/[A-Z]/.test(password.newPassword)) {
        errs.newPassword = "Password must contain at least one uppercase letter";
      } else if (!/[a-z]/.test(password.newPassword)) {
        errs.newPassword = "Password must contain at least one lowercase letter";
      } else if (!/[0-9]/.test(password.newPassword)) {
        errs.newPassword = "Password must contain at least one number";
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password.newPassword)) {
        errs.newPassword = "Password must contain at least one special character";
      }
    }

    if (!password.confirmPassword) {
      errs.confirmPassword = "Confirm password is required";
    } else if (password.newPassword && password.confirmPassword !== password.newPassword) {
      errs.confirmPassword = "Password do not match";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    if (password.newPassword === password.currentPassword) {
      setPwError("New password must be different from your old password.");
      return;
    }

    setChangingPw(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/profile/change-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: password.currentPassword,
          newPassword: password.newPassword,
          confirmPassword: password.confirmPassword,
        }),
      });

      if (!res.ok) {
        let msg = `Failed to change password (${res.status})`;
        try {
          const text = await res.text();
          try {
            const d = JSON.parse(text);
            msg = d.message || msg;
          } catch {
            if (text) msg = text;
          }
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordModal(false);
      flash(setSuccess, "Password changed successfully.");
    } catch (err) {
      setPwError(err.message);
    } finally {
      setChangingPw(false);
    }
  };

  // ── upload a File to the backend (shared by raw upload + crop) ─────────
  const uploadImage = async (file) => {
    setUploadingImage(true);
    setImageError("");

    // Instant local preview
    setProfile((prev) => ({
      ...prev,
      profilePicture: URL.createObjectURL(file),
    }));

    let base64 = "";
    try {
      base64 = await fileToBase64(file);
    } catch {
      /* ignore */
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(
        `${API_BASE}/api/admin/profile/upload-image`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: formData,
        },
      );

      if (!uploadRes.ok) {
        let msg = `Upload failed (${uploadRes.status})`;
        try {
          const text = await uploadRes.text();
          if (text) msg = text;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      await uploadRes.text();

      const imgRes = await fetch(`${API_BASE}/api/admin/profile/image`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (imgRes.ok) {
        const blob = await imgRes.blob();
        if (blob.size > 0) {
          setProfile((prev) => ({
            ...prev,
            profilePicture: URL.createObjectURL(blob),
          }));
          if (base64)
            localStorage.setItem(ADMIN_LOCAL_IMG_KEY(profile.name), base64);
          return;
        }
      }

      if (base64) {
        localStorage.setItem(ADMIN_LOCAL_IMG_KEY(profile.name), base64);
        setProfile((prev) => ({ ...prev, profilePicture: base64 }));
      }
    } catch (err) {
      setImageError(err.message);
      if (base64) {
        localStorage.setItem(ADMIN_LOCAL_IMG_KEY(profile.name), base64);
        setProfile((prev) => ({ ...prev, profilePicture: base64 }));
      }
    } finally {
      setUploadingImage(false);
    }
  };

  // File picked → upload immediately
  const onFilePicked = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setImageError("Invalid file format. Please upload a JPG, JPEG, or PNG image only.");
      e.target.value = "";
      return;
    }

    setImageError("");
    e.target.value = "";
    uploadImage(file);
  };

  const handleRemoveImage = async () => {
    if (!profile.profilePicture) return;
    if (!window.confirm("Remove your profile picture?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/profile/remove-image`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok)
        throw new Error("Failed to remove profile picture on the server");

      setProfile((prev) => ({ ...prev, profilePicture: "" }));
      localStorage.removeItem(ADMIN_LOCAL_IMG_KEY(profile.name));
      flash(setSuccess, "Profile picture removed.");
    } catch (err) {
      setError(err.message);
    }
  };

  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "A";

  const formatDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  const hasChanges = editForm.name !== profile.name || editForm.email !== profile.email;
  const profileErrs = getProfileErrors ? getProfileErrors() : {};
  const isValid = Object.keys(profileErrs).length === 0;
  const isSaveDisabled = saving || !hasChanges || !isValid;

  // ─────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="relative bg-white min-h-screen">
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <main
        key="profile"
        style={{ "--sidebar-w": sidebarOpen ? "18rem" : "6rem" }}
        className={`relative z-10 flex-1 p-5 transition-all duration-300 lg:p-8 ${
          sidebarOpen ? "ml-72" : "ml-24"
        }`}
      >
        {/* =========================================================
          PAGE HEADER
      ========================================================= */}
        <div className="mx-auto mb-8 max-w-6xl">
          <div className="mb-2 flex items-center gap-2"></div>

          <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-slate-900 sm:text-4xl">
            <span className="text-sky-500">R&D Director</span>{" "}
            <span className="text-slate-700">Profile</span>
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your account and professional information.
          </p>
        </div>

        {/* =========================================================
          GLOBAL MESSAGES
      ========================================================= */}
        <div className="mx-auto max-w-6xl">
          {success && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-medium text-emerald-700">
              <FaCheckCircle />
              {success}
            </div>
          )}

          {error && !editMode && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* =======================================================
            LOADING
        ======================================================= */}
          {loading ? (
            <div className="flex min-h-125 items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-sky-500 border-t-transparent" />
                <p className="text-sm text-slate-400">Loading profile...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* ===================================================
                EXECUTIVE PROFILE CARD
            =================================================== */}
              <section className="overflow-hidden rounded-[30px] border border-black/6 bg-white shadow-[0_10px_40px_rgb(0,0,0,0.045)]">
                {/* TOP PROFILE AREA */}
                <div className="p-6 sm:p-8 lg:p-10">
                  <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                    {/* LEFT — IDENTITY */}
                    <div className="flex min-w-0 items-center gap-5 sm:gap-7">
                      {/* PROFILE IMAGE + REMOVE PHOTO BELOW */}
                      <div className="relative shrink-0 flex flex-col items-center gap-3">
                        {/* PROFILE PHOTO */}
                        <button
                          type="button"
                          onClick={() => {
                            if (profile.profilePicture) {
                              setShowProfilePhoto(true);
                            }
                          }}
                          className={`flex h-24 w-24 items-center justify-center
                          overflow-hidden rounded-full bg-slate-100
                          ring-1 ring-slate-200 sm:h-28 sm:w-28
                          ${profile.profilePicture ? "cursor-pointer" : "cursor-default"}
                          focus:outline-none`}
                        >
                          {profile.profilePicture ? (
                            <img
                              src={profile.profilePicture}
                              alt={profile.name || "Profile"}
                              className="h-full w-full object-cover object-center
                           transition duration-300 hover:scale-105"
                            />
                          ) : (
                            <span className="text-3xl font-bold tracking-tight text-sky-600">
                              {initials}
                            </span>
                          )}
                        </button>

                        {/* CAMERA */}
                        <label
                          htmlFor="adminProfileImage"
                          title="Change profile photo"
                          className={`absolute bottom-10 right-0 flex h-8 w-8 cursor-pointer
      items-center justify-center rounded-full border-2 border-white
      shadow-md transition ${
        uploadingImage
          ? "cursor-not-allowed bg-slate-400"
          : "bg-slate-900 hover:scale-105"
      }`}
                        >
                          {uploadingImage ? (
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <FaCamera className="text-white" size={10} />
                          )}
                        </label>

                        <input
                          id="adminProfileImage"
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          className="hidden"
                          onChange={onFilePicked}
                          disabled={uploadingImage}
                        />

                        {/* REMOVE PHOTO — below the photo */}
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={!profile.profilePicture}
                          className="flex cursor-pointer items-center justify-center gap-1.5
      rounded-full border border-red-200 bg-white px-3 py-1.5
      text-[10px] font-semibold text-red-500 shadow-sm
      transition hover:border-red-300 hover:bg-red-50
      disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FaTrash size={8} />
                          Remove Photo
                        </button>

                        {/* PHOTO PREVIEW MODAL */}
                        {showProfilePhoto && profile.profilePicture && (
                          <div
                            className="fixed inset-0 z-100 flex items-center justify-center
                 bg-black/70 p-4 backdrop-blur-sm"
                            onClick={() => setShowProfilePhoto(false)}
                          >
                            <div
                              className="relative max-h-[90vh] max-w-[90vw]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => setShowProfilePhoto(false)}
                                className="absolute -right-3 -top-3 z-10 flex h-9 w-9
                     items-center justify-center rounded-full
                     bg-white text-xl font-bold text-slate-700
                     shadow-lg transition hover:scale-105"
                              >
                                ×
                              </button>

                              <img
                                src={profile.profilePicture}
                                alt={profile.name || "Profile"}
                                className="max-h-[85vh] max-w-[85vw] rounded-2xl
                     object-contain shadow-2xl"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* IDENTITY DETAILS */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="truncate text-2xl font-bold tracking-[-0.035em] text-slate-900 sm:text-3xl">
                            {profile.name || "R&D Director"}
                          </h2>

                          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </div>

                        <p className="mt-1.5 truncate text-sm text-slate-500">
                          {profile.email || "—"}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                            {profile.displayRole ||
                              profile.role ||
                              "R&D Director"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT — ACTIONS: Edit Profile + Change Password */}
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={openEdit}
                        className="flex cursor-pointer items-center gap-2 rounded-full bg-slate-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                      >
                        <FaEdit size={11} />
                        Edit Profile
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPwError("");
                          setPwSuccess("");
                          setShowPasswordModal(true);
                        }}
                        className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <FaKey size={10} />
                        Change Password
                      </button>
                    </div>
                  </div>

                  {/* IMAGE ERROR */}
                  {imageError && (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
                      {imageError}
                    </div>
                  )}
                </div>

                {/* =================================================
                  PROFILE META
              ================================================= */}
                <div className="grid border-t border-slate-100 sm:grid-cols-3"></div>
              </section>

              {/* ===================================================
                PERSONAL INFORMATION (read-only display)
            =================================================== */}
              <section>
                <div className="mb-4 px-1">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">
                    Personal Information
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Your account and organizational information.
                  </p>
                </div>

                <div className="overflow-hidden rounded-[26px] border border-black/6 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.035)]">
                  <div className="divide-y divide-slate-100">
                    {/* FULL NAME */}
                    <div className="flex flex-col gap-3 px-6 py-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                          <FaUserCircle className="text-slate-500" size={15} />
                        </div>
                        <span className="text-sm font-medium text-slate-500">
                          Full Name
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 sm:text-right">
                        {profile.name || "—"}
                      </span>
                    </div>

                    {/* EMAIL */}
                    <div className="flex flex-col gap-3 px-6 py-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                          <FaEnvelope className="text-slate-500" size={14} />
                        </div>
                        <span className="text-sm font-medium text-slate-500">
                          Email Address
                        </span>
                      </div>
                      <span className="break-all text-sm font-semibold text-slate-900 sm:text-right">
                        {profile.email || "—"}
                      </span>
                    </div>

                    {/* ROLE */}
                    <div className="flex flex-col gap-3 px-6 py-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                          <FaShieldAlt className="text-slate-500" size={14} />
                        </div>
                        <span className="text-sm font-medium text-slate-500">
                          Role
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 sm:text-right">
                        {profile.displayRole || profile.role || "R&D Director"}
                      </span>
                    </div>

                    {/* CREATED */}
                    <div className="flex flex-col gap-3 px-6 py-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                          <FaCalendarAlt className="text-slate-500" size={14} />
                        </div>
                        <span className="text-sm font-medium text-slate-500">
                          Joined
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 sm:text-right">
                        {formatDate(profile.createdAt)}
                      </span>
                    </div>

                    {/* STATUS */}
                    <div className="flex flex-col gap-3 px-6 py-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                          <FaCheckCircle
                            className="text-emerald-500"
                            size={14}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-500">
                          Account Status
                        </span>
                      </div>
                      <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600 sm:text-right">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* =========================================================
          EDIT PROFILE MODAL (glass-style popup)
      ========================================================= */}
        {editMode && (
          <div
            className="fixed inset-0 z-50 flex overflow-y-auto p-4 backdrop-blur-md"
            onClick={() => {
              setEditMode(false);
              setError("");
            }}
          >
            {/* glass scrim */}
            <div className="fixed inset-0 bg-slate-900/30" />

            <div
              className="relative m-auto w-full max-w-lg overflow-hidden rounded-[28px] border border-slate-200/95 bg-white p-6 shadow-[0_25px_80px_rgb(0,0,0,0.18)] sm:p-7"
              onClick={(e) => e.stopPropagation()}
            >
              {/* MODAL HEADER */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                    <FaEdit className="text-slate-700" size={14} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">
                      Edit Profile
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Update your personal account information.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setError("");
                  }}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <FaTimes size={13} />
                </button>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onInput={handleNameInput}
                    onChange={(e) => {
                      setEditForm((p) => ({
                        ...p,
                        name: e.target.value,
                      }));
                      setFieldErrors({});
                    }}
                    disabled={saving}
                    className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-4 focus:ring-sky-500/10 disabled:opacity-60 ${
                      editForm.name !== profile.name && profileErrs.name
                        ? "border-red-500 ring-1 ring-red-500 focus:border-red-500"
                        : "border-slate-200 focus:border-sky-500"
                    }`}
                  />
                  {editForm.name !== profile.name && profileErrs.name && (
                    <p className="mt-1.5 text-xs font-semibold text-red-500">{profileErrs.name}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => {
                      setEditForm((p) => ({
                        ...p,
                        email: e.target.value,
                      }));
                      setFieldErrors({});
                    }}
                    disabled={saving}
                    className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-4 focus:ring-sky-500/10 disabled:opacity-60 ${
                      editForm.email !== profile.email && profileErrs.email
                        ? "border-red-500 ring-1 ring-red-500 focus:border-red-500"
                        : "border-slate-200 focus:border-sky-500"
                    }`}
                  />
                  {editForm.email !== profile.email && profileErrs.email && (
                    <p className="mt-1.5 text-xs font-semibold text-red-500">{profileErrs.email}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setError("");
                    }}
                    disabled={saving}
                    className="cursor-pointer rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaveDisabled}
                    className="flex cursor-pointer items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaSave size={12} />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================
          CHANGE PASSWORD MODAL
      ========================================================= */}
        {showPasswordModal && (
          <div
            className="fixed inset-0 z-50 flex overflow-y-auto p-4 backdrop-blur-md"
            onClick={() => setShowPasswordModal(false)}
          >
            {/* glass scrim */}
            <div className="fixed inset-0 bg-slate-900/30" />

            <div
              className="relative m-auto w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200/95 bg-white shadow-[0_25px_80px_rgb(0,0,0,0.18)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-7">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                    <FaLock className="text-slate-700" size={14} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">
                      Change Password
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Update your account password
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <FaTimes size={13} />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="p-6 sm:p-7">
                {pwSuccess && (
                  <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <FaCheckCircle />
                    {pwSuccess}
                  </div>
                )}

                {pwError && (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {pwError}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  {[
                    {
                      label: "Current Password",
                      name: "currentPassword",
                    },
                    {
                      label: "New Password",
                      name: "newPassword",
                    },
                    {
                      label: "Confirm Password",
                      name: "confirmPassword",
                    },
                  ].map(({ label, name }) => (
                    <div key={name}>
                      <label className="mb-2 block text-xs font-semibold text-slate-600">
                        {label}
                      </label>

                      <PasswordInput
                        name={name}
                        maxLength={22}
                        value={password[name]}
                        onChange={(e) => {
                          setPassword((p) => ({
                            ...p,
                            [name]: e.target.value,
                          }));
                          setFieldErrors((p) => ({ ...p, [name]: "" }));
                        }}
                        disabled={changingPw}
                        className={`w-full rounded-2xl border bg-slate-50 py-3 pl-11 pr-11 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-4 focus:ring-sky-500/10 disabled:opacity-60 ${
                          fieldErrors[name] ? "border-red-500 ring-1 ring-red-500 focus:border-red-500" : "border-slate-200 focus:border-sky-500"
                        }`}
                      />
                      {fieldErrors[name] && <p className="mt-1.5 text-xs font-semibold text-red-500">{fieldErrors[name]}</p>}
                    </div>
                  ))}

                  {/* PASSWORD REQUIREMENT */}
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
                    <p className="text-xs leading-5 text-sky-700">
                      Use at least <b>8 characters</b> with uppercase,
                      lowercase, number and special character.
                    </p>
                  </div>

                  {/* MODAL BUTTONS */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      disabled={changingPw}
                      className="cursor-pointer rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={changingPw}
                      className="flex cursor-pointer items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FaKey size={10} />
                      {changingPw ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminProfile;
