import { useEffect, useState } from "react";
import PasswordInput from "../../components/PasswordInput";
import useScrollLock from "../../utils/useScrollLock";
import {
  FaCamera,
  FaLock,
  FaKey,
  FaTimes,
  FaEnvelope,
  FaShieldAlt,
  FaCalendarAlt,
  FaProjectDiagram,
  FaHashtag,
  FaCropAlt,
  FaTrash,
  FaCheckCircle,
  FaUserTie,
} from "react-icons/fa";
import ImageCropModal from "../../components/ImageCropModal";
import { validatePassword } from "../../utils/validation";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const LOCAL_IMG_KEY = (userId) => `profile_image_${userId}`;

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const dataUrlToFile = (dataUrl, filename) => {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8 = new Uint8Array(n);
  for (let i = 0; i < n; i++) u8[i] = bstr.charCodeAt(i);
  return new File([u8], filename, { type: mime });
};

function ManagerProfile() {
  const token = localStorage.getItem("token");
  const [profile, setProfile] = useState({
    userId: "",
    fullName: "",
    email: "",
    role: "",
    projectCount: 0,
    createdAt: "",
    image: "",
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // password modal
  const [showModal, setShowModal] = useState(false);
  const [pwData, setPwData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwFieldErrors, setPwFieldErrors] = useState({});

  // crop modal
  const [cropSrc, setCropSrc] = useState(null);
  useScrollLock(showModal || !!cropSrc);

  // image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  // ── fetch profile then load image ───────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/projectmanager/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch profile");

        const userId = data.userId ?? data.id ?? "";

        setProfile({
          userId,
          fullName: data.fullName ?? "",
          email: data.email ?? "",
          role: data.role ?? "",
          projectCount: data.projectCount ?? 0,
          createdAt: data.createdAt ?? "",
          image: "",
        });

        if (Array.isArray(data.projects)) setProjects(data.projects);

        const imgRes = await fetch(
          `${API_BASE}/api/projectmanager/profile/image`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (imgRes.ok) {
          const blob = await imgRes.blob();
          if (blob.size > 0) {
            setProfile((prev) => ({
              ...prev,
              image: URL.createObjectURL(blob),
            }));
            return;
          }
        }

        const saved = localStorage.getItem(LOCAL_IMG_KEY(userId));
        if (saved) setProfile((prev) => ({ ...prev, image: saved }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── upload a File (shared by raw upload + crop) ─────────────────────
  const uploadImage = async (file) => {
    setUploadingImage(true);
    setImageError("");

    setProfile((prev) => ({ ...prev, image: URL.createObjectURL(file) }));

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
        `${API_BASE}/api/projectmanager/profile/upload-image`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
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

      const imgRes = await fetch(
        `${API_BASE}/api/projectmanager/profile/image`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (imgRes.ok) {
        const blob = await imgRes.blob();
        if (blob.size > 0) {
          const blobUrl = URL.createObjectURL(blob);
          setProfile((prev) => ({ ...prev, image: blobUrl }));
          if (base64)
            localStorage.setItem(LOCAL_IMG_KEY(profile.userId), base64);
          return;
        }
      }

      if (base64) {
        localStorage.setItem(LOCAL_IMG_KEY(profile.userId), base64);
        setProfile((prev) => ({ ...prev, image: base64 }));
      }
    } catch (err) {
      setImageError(err.message);
      if (base64) {
        localStorage.setItem(LOCAL_IMG_KEY(profile.userId), base64);
        setProfile((prev) => ({ ...prev, image: base64 }));
      }
    } finally {
      setUploadingImage(false);
    }
  };

  // File picked → crop modal
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
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  };

  const onCropConfirm = async (dataUrl) => {
    const file = dataUrlToFile(dataUrl, `profile_${Date.now()}.jpg`);
    setCropSrc(null);
    await uploadImage(file);
  };

  const handleRemoveImage = async () => {
    if (!profile.image) return;
    if (!window.confirm("Remove your profile picture?")) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/projectmanager/profile/remove-image`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok)
        throw new Error("Failed to remove profile picture on the server");

      setProfile((prev) => ({ ...prev, image: "" }));
      localStorage.removeItem(LOCAL_IMG_KEY(profile.userId));
    } catch (err) {
      setError(err.message);
    }
  };

  // ── change password ──────────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    const fieldErrs = {};
    if (!pwData.currentPassword.trim()) {
      fieldErrs.currentPassword = "Current Password is required.";
    }
    if (!pwData.newPassword.trim()) {
      fieldErrs.newPassword = "New Password is required.";
    } else {
      const pwErr = validatePassword(pwData.newPassword);
      if (pwErr) fieldErrs.newPassword = pwErr;
    }
    if (!pwData.confirmPassword.trim()) {
      fieldErrs.confirmPassword = "Confirm Password is required.";
    } else if (pwData.newPassword !== pwData.confirmPassword) {
      fieldErrs.confirmPassword = "Passwords do not match.";
    }
    if (Object.keys(fieldErrs).length > 0) {
      setPwFieldErrors(fieldErrs);
      return;
    }
    setPwFieldErrors({});

    if (pwData.newPassword === pwData.currentPassword) {
      setPwError("New password must be different from your old password.");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/projectmanager/profile/change-password`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pwData),
        },
      );
      const text = await res.text();
      let msg = "Password change failed";
      if (!res.ok) {
        try {
          const data = JSON.parse(text);
          if (data.message) msg = data.message;
        } catch {
          if (text) msg = text;
        }
        throw new Error(msg);
      }
      setPwSuccess("Password changed successfully.");
      setPwData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwFieldErrors({});
      setTimeout(() => {
        setShowModal(false);
        setPwSuccess("");
      }, 1500);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  };

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

  const initials = profile.fullName
    ? profile.fullName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "PM";

  // ─────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-1 pb-12">
      {/* =========================================================
        PAGE HEADER
    ========================================================= */}
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-2 sm:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-slate-900 sm:text-4xl">
            {/* <span className="text-cyan-800">Manager</span>{" "} */}
            <span className="text-cyan-600">Profile</span>
          </h1>

          <p className="max-w-xl text-sm leading-6 text-slate-500">
            Manage your personal information and account security.
          </p>
        </div>
      </div>

      {/* =========================================================
        MAIN
    ========================================================= */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* =====================================================
          PROFILE INTRO
      ===================================================== */}
        <section
          className="overflow-hidden rounded-[28px] border border-black/6
        bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        >
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
              {/* LEFT */}
              <div className="flex flex-col sm:flex-row min-w-0 items-center gap-5 sm:gap-7">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="flex h-24 w-24 items-center justify-center
                  overflow-hidden rounded-full bg-[#e9e9eb]
                  sm:h-28 sm:w-28"
                  >
                    {profile.image ? (
                      <img
                        src={profile.image}
                        alt={profile.fullName || "Profile"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-semibold tracking-tight text-slate-500">
                        {initials}
                      </span>
                    )}
                  </div>

                  {/* Camera button */}
                  <label
                    htmlFor="profileImage"
                    className={`absolute bottom-0 right-0 flex h-8 w-8
                  cursor-pointer items-center justify-center rounded-full
                  border-2 border-white shadow-sm transition
                  ${
                    uploadingImage
                      ? "bg-slate-400"
                      : "bg-slate-900 hover:scale-105"
                  }`}
                  >
                    {uploadingImage ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <FaCamera className="text-white" size={11} />
                    )}
                  </label>

                  <input
                    id="profileImage"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                    onChange={onFilePicked}
                    disabled={uploadingImage}
                  />
                </div>

                {/* Identity */}
                <div className="min-w-0 text-center sm:text-left">
                  <h2 className="truncate text-2xl font-semibold tracking-[-0.03em] text-cyan-600 sm:text-3xl">
                    {profile.fullName || "Project Manager"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {profile.email || "—"}
                  </p>

                  <div className="mt-3 flex flex-wrap justify-center sm:justify-start items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
                      {profile.role || "Project Manager"}
                    </span>

                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                <label
                  htmlFor="profileImage"
                  className="flex cursor-pointer items-center justify-center
                gap-2 rounded-full border border-slate-200 bg-white
                px-4 py-2.5 text-xs font-medium text-slate-700
                shadow-sm transition hover:bg-slate-50"
                >
                  <FaCamera size={10} />
                  Change Photo
                </label>

                {/* <button
                onClick={() => profile.image && setCropSrc(profile.image)}
                disabled={!profile.image}
                className="flex cursor-pointer items-center justify-center
                gap-2 rounded-full border border-slate-200 bg-white
                px-4 py-2.5 text-xs font-medium text-slate-700
                shadow-sm transition hover:bg-slate-50
                disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FaCropAlt size={10} />
                Crop
              </button> */}

                <button
                  onClick={handleRemoveImage}
                  disabled={!profile.image}
                  className="flex cursor-pointer items-center justify-center
                gap-2 rounded-full border border-slate-200 bg-white
                px-4 py-2.5 text-xs font-medium text-red-500
                shadow-sm transition hover:bg-red-50
                disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FaTrash size={10} />
                  Remove
                </button>
              </div>
            </div>

            {imageError && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
                {imageError}
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
          INFORMATION
      ===================================================== */}
        <section className="mt-8">
          <div className="mb-4 px-1">
            <h3 className="text-xl font-semibold tracking-tight text-slate-900">
              Personal Information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Information associated with your InnovatePERT account.
            </p>
          </div>

          <div
            className="overflow-hidden rounded-xl border
          border-black/6 bg-white"
          >
            {/* Name */}
            <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                  <FaUserTie className="text-slate-500" size={13} />
                </div>

                <span className="text-sm text-slate-500">Full Name</span>
              </div>

              <span className="text-sm font-medium text-slate-900 sm:text-right">
                {profile.fullName || "—"}
              </span>
            </div>

            <div className="mx-6 border-t border-slate-100 sm:mx-8" />

            {/* Email */}
            <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                  <FaEnvelope className="text-slate-500" size={13} />
                </div>

                <span className="text-sm text-slate-500">Email Address</span>
              </div>

              <span className="break-all text-sm font-medium text-slate-900 sm:text-right">
                {profile.email || "—"}
              </span>
            </div>

            <div className="mx-6 border-t border-slate-100 sm:mx-8" />

            {/* Employee ID */}
            <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                  <FaHashtag className="text-slate-500" size={12} />
                </div>

                <span className="text-sm text-slate-500">Employee ID</span>
              </div>

              <span className="text-sm font-medium text-slate-900 sm:text-right">
                {profile.userId || "—"}
              </span>
            </div>

            <div className="mx-6 border-t border-slate-100 sm:mx-8" />

            {/* Role */}
            <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                  <FaShieldAlt className="text-slate-500" size={12} />
                </div>

                <span className="text-sm text-slate-500">Account Role</span>
              </div>

              <span className="text-sm font-medium text-slate-900 sm:text-right">
                {profile.role || "Project Manager"}
              </span>
            </div>

            <div className="mx-6 border-t border-slate-100 sm:mx-8" />

            {/* Joined */}
            <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                  <FaCalendarAlt className="text-slate-500" size={12} />
                </div>

                <span className="text-sm text-slate-500">Joined</span>
              </div>

              <span className="text-sm font-medium text-slate-900 sm:text-right">
                {formatDate(profile.createdAt)}
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
          SECURITY
      ===================================================== */}
        <section className="mt-8">
          <div className="mb-4 px-1">
            <h3 className="text-xl font-semibold tracking-tight text-slate-900">
              Security
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Protect your account with a strong password.
            </p>
          </div>

          <div
            className="flex flex-col gap-5 rounded-3xl
          border border-black/6 bg-white p-6
          shadow-[0_6px_24px_rgb(0,0,0,0.035)]
          sm:flex-row sm:items-center sm:justify-between sm:p-8"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <FaLock className="text-slate-600" size={14} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-900">Password</p>

                <p className="mt-1 text-xs text-slate-500">
                  Your password keeps your InnovatePERT account secure.
                </p>

                <div className="mt-2 flex items-center gap-1.5">
                  <FaCheckCircle className="text-emerald-500" size={10} />

                  <span className="text-[11px] font-medium text-emerald-600">
                    Password protected
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setPwError("");
                setPwSuccess("");
                setPwFieldErrors({});
                setShowModal(true);
              }}
              className="flex cursor-pointer items-center justify-center
            gap-2 rounded-full bg-slate-900 px-5 py-3
            text-xs font-medium text-white transition
            hover:bg-slate-800"
            >
              <FaKey size={10} />
              Change Password
            </button>
          </div>
        </section>
      </div>

      {/* =========================================================
        CHANGE PASSWORD MODAL
    ========================================================= */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center
        bg-black/30 p-4 backdrop-blur-md"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-[28px] border
          border-black/6 bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                  Change Password
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Choose a new password for your account.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 cursor-pointer items-center
              justify-center rounded-full bg-slate-100
              text-slate-500 transition hover:bg-slate-200"
              >
                <FaTimes size={12} />
              </button>
            </div>

            {/* Success */}
            {pwSuccess && (
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                <FaCheckCircle />
                {pwSuccess}
              </div>
            )}

            {/* Error */}
            {pwError && (
              <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-600">
                {pwError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
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
                  <label className="mb-2 block text-xs font-medium text-slate-600">
                    {label}
                  </label>

                  <PasswordInput
                    name={name}
                    value={pwData[name]}
                    onChange={(e) => {
                      setPwData((p) => ({ ...p, [name]: e.target.value }));
                      if (pwFieldErrors[name]) {
                        setPwFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next[name];
                          return next;
                        });
                      }
                    }}
                    disabled={pwLoading}
                    className={`w-full rounded-xl border py-3 pl-11 pr-11 text-sm text-slate-800
                  bg-slate-50 outline-none transition disabled:opacity-60
                  ${pwFieldErrors[name]
                    ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                    : "border-slate-200 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                  }`}
                  />
                  {pwFieldErrors[name] && (
                    <p className="mt-1.5 text-xs text-red-500">{pwFieldErrors[name]}</p>
                  )}
                </div>
              ))}

              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs leading-5 text-slate-500">
                  Use at least <b className="text-slate-700">8 characters</b>{" "}
                  with uppercase, lowercase, number and special character.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={pwLoading}
                  className="flex-1 cursor-pointer rounded-full
                border border-slate-200 bg-white px-5 py-3
                text-sm font-medium text-slate-700 transition
                hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="flex-1 cursor-pointer rounded-full
                bg-slate-900 px-5 py-3 text-sm font-medium text-white
                transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {pwLoading ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
        CROP MODAL
    ========================================================= */}
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={onCropConfirm}
        />
      )}
    </div>
  );
}

export default ManagerProfile;
