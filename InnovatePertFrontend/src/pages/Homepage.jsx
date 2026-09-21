import { useState, useId, useRef } from "react";
import { useEffect } from "react";
import AuthModal from "../components/AuthModal";
import HomeImg from "../assets/images/InnovatePERT.jpeg";
import HomeImg2 from "../assets/images/InnovatePERT2.jpeg";
import ProjectTimeline from "./ProjectTimeline";
import {
  FaProjectDiagram,
  FaChartLine,
  FaBolt,
  FaShieldAlt,
  FaChartPie,
  FaUsers,
  FaHourglassHalf,
  FaClock,
  FaCheckCircle,
  FaUserTie,
} from "react-icons/fa";
import { motion } from "framer-motion";

const homeImages = [HomeImg, HomeImg2];


const features = [
  {
    icon: <FaProjectDiagram size={20} />,
    title: "PERT Analysis",
    desc: "Calculate expected time, variance and standard deviation from Optimistic, Most Likely and Pessimistic estimates.",
  },
  {
    icon: <FaShieldAlt size={20} />,
    title: "Risk Simulation",
    desc: "Predict completion probability via Z-score analysis and classify project risks automatically.",
  },
  {
    icon: <FaBolt size={20} />,
    title: "Cost Crashing",
    desc: "Compress schedules by optimising critical activities while minimising additional cost.",
  },
  {
    icon: <FaChartLine size={20} />,
    title: "Analytics Dashboard",
    desc: "Live charts for progress, budget utilisation and milestone performance.",
  },
  {
    icon: <FaChartPie size={20} />,
    title: "Reports & Insights",
    desc: "Auto-generate stakeholder-ready reports with actionable insights.",
  },
];

const steps = [
  {
    icon: <FaHourglassHalf size={20} />,
    step: "01",
    title: "Estimate every activity",
    desc: "Capture Optimistic, Most Likely and Pessimistic durations to model uncertainty from day one.",
  },
  {
    icon: <FaProjectDiagram size={20} />,
    step: "02",
    title: "Build the PERT network",
    desc: "Expected times and variance are computed automatically as your plan takes shape.",
  },
  {
    icon: <FaShieldAlt size={20} />,
    step: "03",
    title: "Simulate the risk",
    desc: "Z-score analysis scores your completion probability and flags at-risk activities before they bite.",
  },
  {
    icon: <FaBolt size={20} />,
    step: "04",
    title: "Crash costs, not quality",
    desc: "Compress the schedule at minimum cost and lock in a target date you can actually defend.",
  },
];

const methodStats = [
  { value: "T_e", label: "Expected activity time" },
  { value: "σ²", label: "Variance & deviation" },
  { value: "Z", label: "Completion probability" },
];

const whyItems = [
  {
    icon: <FaClock size={22} />,
    title: "Probabilistic, Not Guesswork",
    desc: "Traditional PM tools rely on single-point estimates. InnovatePERT uses three-point PERT estimation (O, M, P) to model real uncertainty and give you a confidence range, not a false promise.",
  },
  {
    icon: <FaShieldAlt size={22} />,
    title: "Risk You Can Quantify",
    desc: "Z-score analysis converts schedule risk into a completion probability. Every activity is classified as Low, Medium or High risk — so you know exactly where to focus.",
  },
  {
    icon: <FaBolt size={22} />,
    title: "Crash Smart, Not Hard",
    desc: "When deadlines shift, Cost Crashing compresses your schedule at minimum additional cost — preserving quality while meeting your revised target date.",
  },
  {
    icon: <FaChartLine size={22} />,
    title: "Live Analytics & Reports",
    desc: "Dashboards update in real time as project data changes. Generate stakeholder-ready PDF and Excel reports in one click — no spreadsheets required.",
  },
];

const roles = [
  {
    icon: <FaUserTie size={24} />,
    title: "R&D Directors",
    desc: "Get portfolio-wide visibility across every project. See aggregate risk exposure, budget utilisation and milestone health at a glance — then drill into any project in seconds.",
    features: [
      "Portfolio risk overview",
      "Budget utilisation tracking",
      "Cross-project analytics",
    ],
  },
  {
    icon: <FaProjectDiagram size={24} />,
    title: "Project Managers",
    desc: "Build PERT networks, run risk simulations, crash schedules and manage day-to-day activities — all from a single, purpose-built workspace.",
    features: [
      "PERT analysis & scheduling",
      "Activity management",
      "Risk classification",
    ],
  },
  // {
  //   icon: <FaUsers size={24} />,
  //   title: "Teams & Stakeholders",
  //   desc: "Stay aligned with shared dashboards, automated reports and real-time status updates. Everyone sees the same source of truth.",
  //   features: [
  //     "Real-time collaboration",
  //     "Automated reporting",
  //     "Shared dashboards",
  //   ],
  // },
];

/* ── PERT network logo — event nodes joined by activity arrows ── */
function PertLogo() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gId = `pg-${uid}`;
  const aId = `pa-${uid}`;
  return (
    <svg
      viewBox="0 0 36 36"
      className="h-8 w-8 shrink-0"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={gId}
          x1="0"
          y1="0"
          x2="36"
          y2="18"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
        <marker
          id={aId}
          viewBox="0 0 6 6"
          refX="5"
          refY="3"
          markerWidth="3"
          markerHeight="3"
          orient="auto-start-reverse"
        >
          <path d="M0,0.8 L5,3 L0,5.2z" fill="#2563eb" />
        </marker>
      </defs>
      <g>
        <path
          d="M10 18 L15 10.5"
          stroke={`url(#${gId})`}
          strokeWidth="1.8"
          strokeLinecap="round"
          markerEnd={`url(#${aId})`}
        />
        <path
          d="M21 10.5 L26 18"
          stroke={`url(#${gId})`}
          strokeWidth="1.8"
          strokeLinecap="round"
          markerEnd={`url(#${aId})`}
        />
        <path
          d="M10 18 L15 25.5"
          stroke={`url(#${gId})`}
          strokeWidth="1.8"
          strokeLinecap="round"
          markerEnd={`url(#${aId})`}
        />
        <path
          d="M21 25.5 L26 18"
          stroke={`url(#${gId})`}
          strokeWidth="1.8"
          strokeLinecap="round"
          markerEnd={`url(#${aId})`}
        />
        <circle cx="8" cy="18" r="3.2" fill="#2563eb" />
        <circle cx="18" cy="8" r="2.5" fill="#3b82f6" />
        <circle cx="18" cy="18" r="2.5" fill="#0d9488" />
        <circle cx="18" cy="28" r="2.5" fill="#3b82f6" />
        <circle cx="28" cy="18" r="3.2" fill="#2563eb" />
      </g>
    </svg>
  );
}

/* ── Project Network Model card ── */
function ProjectNetworkModel() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % homeImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-md lg:w-140 lg:max-w-full">
      {/* floating chat bubble — top */}
      {/* <div className="absolute -left-6 -top-5 z-10 hidden animate-pulse items-center gap-2 rounded-2xl bg-white p-2.5 pr-4 shadow-lg shadow-blue-900/20 ring-1 ring-slate-200 lg:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-cyan-400 to-blue-500 text-white">
          <FaChartLine size={12} />
        </span>
        <span className="flex flex-col gap-1">
          <span className="h-1.5 w-12 rounded-full bg-slate-200" />
          <span className="h-1.5 w-8 rounded-full bg-slate-200" />
        </span>
      </div> */}

      {/* Device-style mockup frame */}
      <div className="relative overflow-hidden rounded-xl bg-white shadow-2xl shadow-blue-900/30 ring-1 ring-slate-200">
        {/* mockup top bar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700">
            InnovatePERT
          </span>
        </div>

        {/* mockup screen */}
        <div className="relative h-64 overflow-hidden bg-slate-50 sm:h-72 lg:h-88">
          {homeImages.map((image, index) => (
            <img
              key={image}
              src={image}
              alt={`InnovatePERT project preview ${index + 1}`}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-in-out ${
                currentImage === index
                  ? "scale-100 opacity-100"
                  : "scale-105 opacity-0"
              }`}
            />
          ))}
        </div>
      </div>

      {/* floating chat bubble — bottom */}
      {/* <div
        className="absolute -bottom-6 -right-6 z-10 hidden animate-pulse items-center gap-2 rounded-2xl bg-white p-2.5 pr-4 shadow-lg shadow-blue-900/20 ring-1 ring-slate-200 lg:flex"
        style={{ animationDelay: "1.2s" }}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-blue-400 to-teal-500 text-white">
          <FaUsers size={12} />
        </span>
        <span className="flex flex-col gap-1">
          <span className="h-1.5 w-10 rounded-full bg-slate-200" />
          <span className="h-1.5 w-7 rounded-full bg-slate-200" />
        </span>
      </div> */}

      {/* Image indicators */}
      <div className="mt-4 flex justify-center gap-2">
        {homeImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImage(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentImage === index
                ? "w-7 bg-white shadow-md lg:bg-blue-600"
                : "w-2 bg-white/40 lg:bg-blue-300"
            }`}
            aria-label={`Show image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

const speckles = [
  "top-[16%] left-[10%] h-1.5 w-1.5 bg-white/60",
  "top-[28%] left-[22%] h-1 w-1 bg-cyan-200/70",
  "top-[10%] left-[44%] h-1 w-1 bg-white/50",
  "top-[22%] left-[63%] h-1.5 w-1.5 bg-cyan-100/70",
  "top-[38%] left-[6%] h-1 w-1 bg-white/60",
  "top-[46%] left-[36%] h-1 w-1 bg-white/40",
  "top-[14%] left-[82%] h-1 w-1 bg-cyan-100/60",
  "top-[7%] left-[72%] h-1.5 w-1.5 bg-white/50",
  "top-[34%] left-[90%] h-1 w-1 bg-white/40",
  "top-[52%] left-[56%] h-1 w-1 bg-cyan-100/50",
];

/* ── Card Stack Reveal for Why InnovatePERT ── */
function WhyCardsStack({ items }) {
  const count = items.length;
  const [hovered, setHovered] = useState(false);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(rotation);
  const tabVisible = useRef(typeof document === "undefined" ? true : !document.hidden);

  useEffect(() => { rotationRef.current = rotation; }, [rotation]);

  useEffect(() => {
    const handler = () => { tabVisible.current = !document.hidden; };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // Auto-play: cycle cards from back to front every 3 seconds, pause on hover
  useEffect(() => {
    if (hovered || !tabVisible.current || count < 2) return;
    const id = setInterval(() => {
      setRotation((r) => (r + 1) % count);
    }, 3000);
    return () => clearInterval(id);
  }, [hovered, count]);

  // ── Layout constants ──
  const PEEK = 30;
  const CARD_H = 80;
  const collapsedH = (count - 1) * PEEK + CARD_H; // ~170px

  // Fixed container height — same in both states so no gap appears
  const CONTAINER_H = 260;

  const leftItems = items.slice(0, 2);
  const rightItems = items.slice(2, 4);

  return (
    <div
      className="mx-auto w-full max-w-3xl"
      style={{ perspective: 600, height: CONTAINER_H }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Collapsed stack (Desktop only) ── */}
      <div
        className="absolute inset-x-0 top-0 hidden lg:block cursor-pointer transition-all duration-500"
        style={{
          height: collapsedH,
          opacity: hovered ? 0 : 1,
          pointerEvents: hovered ? "none" : "auto",
          transformStyle: "preserve-3d",
        }}
      >
        {items.map((item, index) => {
          const slot = (index + rotation) % count;
          const frontDepth = count - 1 - slot;
          const top = slot * PEEK;
          const depthPx = -frontDepth * 25;
          const scale = 1 - frontDepth * 0.03;
          const blur = Math.max(frontDepth * 0.8, 0);
          const opacity = Math.max(0.4, 1 - frontDepth * 0.15);

          return (
            <div
              key={item.title}
              className="absolute left-0 right-0 flex items-center gap-5 rounded-2xl bg-white p-5 shadow-md ring-1 ring-slate-100"
              style={{
                top: 0,
                zIndex: slot + 1,
                transform: `translateY(${top}px) translateZ(${depthPx}px) scale(${scale})`,
                filter: `blur(${blur}px)`,
                opacity,
              }}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-sm">
                {item.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-[#16244c]">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#16244c]/60">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Expanded grid (Desktop hover & Mobile default) ── */}
      <div
        className="absolute inset-x-0 top-0 grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-500 lg:absolute lg:top-0"
        style={{
          opacity: typeof window !== "undefined" && window.innerWidth < 1024 ? 1 : (hovered ? 1 : 0),
          pointerEvents: typeof window !== "undefined" && window.innerWidth < 1024 ? "auto" : (hovered ? "auto" : "none"),
          position: typeof window !== "undefined" && window.innerWidth < 1024 ? "relative" : "absolute"
        }}
      >
        {/* Left column — cards 0,1 appear first */}
        <div className="flex flex-col gap-4">
          {leftItems.map((item, i) => (
            <div
              key={item.title}
              className="flex items-start md:items-center gap-4 rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-100 transition-all duration-500"
              style={{
                opacity: typeof window !== "undefined" && window.innerWidth < 1024 ? 1 : (hovered ? 1 : 0),
                transform: typeof window !== "undefined" && window.innerWidth < 1024 ? "translateY(0) scale(1)" : (hovered ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)"),
                transitionDelay: typeof window !== "undefined" && window.innerWidth < 1024 ? "0s" : (hovered ? `${i * 0.15}s` : "0s"),
              }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-sm">
                {item.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[#16244c]">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#16244c]/60">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Right column — cards 2,3 appear after left */}
        <div className="flex flex-col gap-4">
          {rightItems.map((item, i) => (
            <div
              key={item.title}
              className="flex items-start md:items-center gap-4 rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-100 transition-all duration-500"
              style={{
                opacity: typeof window !== "undefined" && window.innerWidth < 1024 ? 1 : (hovered ? 1 : 0),
                transform: typeof window !== "undefined" && window.innerWidth < 1024 ? "translateY(0) scale(1)" : (hovered ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)"),
                transitionDelay: typeof window !== "undefined" && window.innerWidth < 1024 ? "0s" : (hovered ? `${0.3 + i * 0.15}s` : "0s"),
              }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-sm">
                {item.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[#16244c]">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#16244c]/60">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Card Deck Spread ───────────────────────────────────────────── */
function CardDeckSpread({ cards }) {
  const [hovered, setHovered] = useState(null);
  const [spread, setSpread] = useState(false);

  // Entrance: cards spread out on mount
  useEffect(() => {
    const t = setTimeout(() => setSpread(true), 300);
    return () => clearTimeout(t);
  }, []);

  const CARD_W = 300;
  const CARD_H = 310;
  const OVERLAP = 140;
  const RADIUS = 18;
  const total = cards.length;
  const totalWidth = CARD_W + (total - 1) * OVERLAP;
  const stackLeft = (totalWidth - CARD_W) / 2;

  return (
    <div className="pt-6">
      {/* Mobile view - vertical stack */}
      <div className="flex flex-col gap-4 lg:hidden">
        {cards.map((f, i) => (
          <div
            key={f.title}
            className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
          >
            <div className="mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-600 text-2xl text-white shadow-sm">
              {f.icon}
            </div>
            <h3 className="text-lg font-bold text-[#16244c]">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#16244c]/60">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Desktop view - animated spread */}
      <div className="hidden lg:flex justify-center">
        <div
          className="relative"
          style={{ width: totalWidth, height: CARD_H + 40 }}
        >
          {cards.map((f, i) => {
            const isHovered = hovered === i;
            const left = spread ? (total - 1 - i) * OVERLAP : stackLeft;
            const top = spread ? 0 : i * 2;
            const blur = hovered !== null && !isHovered ? 2 : 0;
            const delay = i * 0.08;

            return (
              <div
                key={f.title}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: "absolute",
                  left,
                  top,
                  width: CARD_W,
                  height: CARD_H,
                  borderRadius: RADIUS,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                  background: "#fff",
                  zIndex: total - i + (isHovered ? 100 : 0),
                  overflow: "hidden",
                  cursor: "default",
                  transition: `left 0.7s cubic-bezier(0.25,0.8,0.25,1) ${delay}s, top 0.7s cubic-bezier(0.25,0.8,0.25,1) ${delay}s, transform ${isHovered ? '0.3s' : '0.4s'} cubic-bezier(0.25,0.8,0.25,1), filter ${isHovered ? '0.3s' : '0.4s'} cubic-bezier(0.25,0.8,0.25,1)`,
                  transform: isHovered ? "scale(1.08) translateY(-12px)" : "scale(1) translateY(0)",
                  filter: blur ? `blur(${blur}px)` : "none",
                  outline: isHovered ? "2px solid #06b6d4" : "none",
                }}
              >
                <div className="relative flex h-full w-full flex-col p-6">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-600 text-2xl text-white shadow-sm">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[#16244c]">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#16244c]/60">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Homepage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#f0f5fa] font-sans text-[#16244c]">
      {/* ═══════════════ HERO ═══════════════ */}
      <section
        id="overview"
        className="relative overflow-hidden bg-linear-to-b from-[#4cc9f0] via-[#4185c0] to-[#1264e1]"
      >
        {/* soft glows */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />

        {/* confetti-like speckles */}
        {speckles.map((c, i) => (
          <span key={i} className={`pointer-events-none absolute rounded-full ${c}`} />
        ))}

        {/* soft white rings */}
        <div className="pointer-events-none absolute -right-14 -top-12 h-56 w-56 rounded-full bg-white/10 ring-1 ring-inset ring-white/40" />
        <div className="pointer-events-none absolute -bottom-20 -left-14 h-50 w-52 rounded-full bg-white/5 ring-1 ring-inset ring-white/30" />
        <div className="pointer-events-none absolute left-[45%] -top-16 h-32 w-32 rounded-full bg-white/10 ring-1 ring-inset ring-white/40" />

        {/* Large white curved shape — right side */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] rounded-bl-[180px] bg-white xl:w-[52%] lg:block" />
        <div className="pointer-events-none absolute inset-y-10 -right-10 hidden w-[36%] rounded-bl-[140px] bg-linear-to-br from-white/60 to-transparent blur-xl xl:w-[40%] lg:block" />

        {/* fade into page bg */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-linear-to-b from-transparent to-[#f0f5fa]" />

        {/* ── Navbar ── */}
        <header className="fixed z-20 mx-auto flex w-full items-center justify-between px-4 sm:px-5 pt-4 sm:pt-6">
          <div className="flex items-center gap-1.5 sm:gap-2.5 whitespace-nowrap rounded-full bg-white/90 px-3 sm:px-4 py-2 sm:py-2.5 text-base sm:text-lg font-extrabold tracking-tight shadow-lg shadow-blue-900/10 ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl lg:text-2xl">
            <PertLogo />
            <span className="flex items-center">
              Innovate
              <span className="bg-linear-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                PERT
              </span>
            </span>
          </div>

          <div className="ml-auto">
            <button
              onClick={() => setIsLoginOpen(true)}
              className="bg-[linear-gradient(160deg,#e2e8f0_0%,#ffffff_100%)] border border-white/16 rounded-[24px] shadow-[-8px_-8px_24px_0px_rgb(255,255,255),8px_8px_24px_0px_rgba(136,164,191,0.4)] hover:shadow-[inset_8px_8px_24px_0px_rgba(136,164,191,0.4),inset_-8px_-8px_24px_0px_rgb(255,255,255)] hover:border-white/24 active:bg-[linear-gradient(135deg,#e2e8f0_0%,#ffffff_100%)] active:shadow-[inset_8px_8px_24px_0px_rgba(136,164,191,0.4),inset_-8px_-8px_24px_0px_rgb(255,255,255)] group relative cursor-pointer px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-slate-900 transition-all duration-200"
            >
              <span className="relative z-10 flex items-center gap-1 sm:gap-2">
                Sign In
                <span className="text-sm sm:text-base transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </span>
            </button>
          </div>
        </header>

        {/* ── Hero content ── */}
        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 sm:gap-12 px-5 pb-10 pt-28 sm:pt-32 lg:grid-cols-2 lg:gap-14 lg:pt-30">
          {/* Mockup column */}
          <div className="relative order-2 flex min-w-0 w-full justify-center">
            <ProjectNetworkModel />
          </div>

          {/* Text column */}
          <div className="order-1 flex flex-col gap-5 sm:gap-7">
            <h1 className="animate-text-in text-4xl sm:text-5xl font-extrabold leading-[1.20] tracking-tight text-white lg:text-5xl xl:text-6xl">
              <motion.span
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="block"
              >
                Predict Timelines.
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="block"
              >
                Identify Risks.
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="block bg-linear-to-r from-cyan-200 to-white bg-clip-text text-transparent"
              >
                Optimize Delivery.
              </motion.span>
            </h1>

            <p className="max-w-md text-base leading-relaxed text-white/85 sm:text-lg">
              InnovatePERT delivers probabilistic scheduling powered by PERT
              methodology and real-time Cost Crashing — safeguard your budget
              and hit every deadline.
            </p>

            <div className="mt-1 flex flex-wrap gap-3">
              <button
                onClick={() => setIsLoginOpen(true)}
                className="cursor-pointer rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#1d4ed8] shadow-lg shadow-blue-900/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                Enter Workspace →
              </button>
              <button
                onClick={() => scrollTo("features")}
                className="cursor-pointer rounded-full bg-white/15 px-7 py-3.5 text-sm font-semibold text-white ring-1 ring-white/40 transition-all hover:-translate-y-0.5 hover:bg-white/25"
              >
                Explore Features
              </button>
            </div>

            {/* Pill tags */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "PERT Scheduling",
                "Risk Analysis",
                "Cost Crashing",
                "Reports",
              ].map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white/90 shadow-sm ring-1 ring-white/30"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section id="features" className="relative px-5 py-4 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cyan-700">
              Platform Features
            </span>
            <h2 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl text-gray-900">
              Engineered for{" "}
              <span className="text-cyan-600">Complete Control</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[#16244c]/60">
              Intelligent scheduling, risk prediction, cost crashing and live
              analytics — all in one workspace.
            </p>
          </div>

          {/* Card Deck Spread — Framer-style */}
          <CardDeckSpread cards={features} />
        </div>
      </section>

      {/* ═══════════════ WHY INNOVATEPERT ═══════════════ */}
      <section id="why" className="relative px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cyan-700">
              Why InnovatePERT
            </span>
            <h2 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl text-gray-900">
              Not just another{" "}
              <span className="text-cyan-600">project tool</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[#16244c]/60">
              Most project management software treats every estimate as a fact.
              InnovatePERT treats them as what they are — educated guesses — and
              uses the PERT methodology to turn uncertainty into actionable
              insight.
            </p>
          </div>

          <WhyCardsStack items={whyItems} />
        </div>
      </section>

      {/* ═══════════════ BUILT FOR ═══════════════ */}
      <section id="roles" className="relative px-5 pt-15 pb-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cyan-700">
              Built For Your Role
            </span>
            <h2 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl text-gray-900">
              One platform,{" "}
              <span className="text-cyan-600">two stakeholder</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[#16244c]/60">
              Whether you set strategy or manage day-to-day execution,
              InnovatePERT gives you the exact tools and views your role needs.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {roles.map((role) => (
              <div
                key={role.title}
                className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  {role.icon}
                </div>
                <h3 className="text-xl font-bold text-[#16244c]">
                  {role.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#16244c]/60">
                  {role.desc}
                </p>
                <ul className="mt-5 space-y-2">
                  {role.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-[#16244c]/70"
                    >
                      <FaCheckCircle
                        size={13}
                        className="shrink-0 text-cyan-500"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section id="how" className="relative px-5 pb-24 sm:px-8">
        
        {/* Mobile/Tablet fallback for How It Works */}
        <div className="flex flex-col gap-6 lg:hidden max-w-3xl mx-auto mt-8">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 flex flex-col items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-sm">
                {s.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#16244c]">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#16244c]/60">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Expandable Interactive Cards (Desktop only) */}
        <div className="relative mx-auto mt-1 hidden h-82.5 max-w-6xl gap-5 lg:flex">
          {steps.map((s) => (
            <div
              key={s.title}
              className="
                group relative min-w-0 flex-1 overflow-hidden
                rounded-[1.75rem]
                border border-cyan-100/80
                bg-linear-to-br from-white via-[#f9fcfd] to-cyan-50/60
    
                transition-all duration-700
                ease-[cubic-bezier(0.22,1,0.36,1)]

                hover:flex-[1.7]
                hover:border-cyan-200
                hover:shadow-[0_20px_45px_rgba(8,145,178,0.14)]
              "
            >
              {/* Bottom Glow */}
              <div
                className="
                    pointer-events-none absolute -bottom-24 right-0
                    h-52 w-52 rounded-full
                    bg-sky-100/40 blur-3xl
                    opacity-0 transition-opacity duration-700
                    group-hover:opacity-100
                  "
              />

              {/* Top Decorative Line */}
              <div
                className="
                  absolute left-7 right-7 top-7 h-px
                  bg-linear-to-r from-transparent via-cyan-300 to-transparent
                  transition-all duration-500
                  group-hover:via-cyan-100
                "
              />

              {/* Main Content */}
              <div className="relative z-10 h-full p-5">
                {/* Icon */}
                <div
                  className="
                    absolute left-1/2 top-[42%]
                    flex h-19 w-19
                    -translate-x-1/2 -translate-y-1/2
                    items-center justify-center
                    rounded-full bg-white/90
                    shadow-[0_12px_30px_rgba(8,145,178,0.15)]
                    ring-1 ring-cyan-100
                    transition-all duration-700
                    ease-[cubic-bezier(0.22,1,0.36,1)]

                    group-hover:left-7
                    group-hover:top-7
                    group-hover:translate-x-0
                    group-hover:translate-y-0
                    group-hover:scale-100
                  "
                >
                  <div
                    className="
                      absolute inset-1.5 rounded-full
                      border border-cyan-100
                      transition-all duration-500
                      group-hover:scale-105
                      group-hover:border-cyan-100
                    "
                  />

                  <div
                    className="
                          relative flex h-13 w-13
                          items-center justify-center
                          rounded-full
                          bg-linear-to-br from-cyan-600 to-sky-500
                          text-lg text-white
                          shadow-lg shadow-cyan-200/60
                          transition-all duration-500
                          group-hover:rotate-3
                        "
                  >
                    {s.icon}
                  </div>
                </div>

                {/* Decorative Bottom Curves */}
                <div
                  className="
                    pointer-events-none absolute
                    -bottom-20 -right-20
                    h-40 w-80 rounded-[50%]
                    border border-cyan-100/70
                    opacity-0 transition-all duration-700
                    group-hover:opacity-100
                  "
                />

                {/* Expanded Content */}
                <div
                  className="
                    absolute bottom-6 left-7 right-5
                    max-w-90
                    translate-y-4 opacity-0
                    transition-all duration-500

                    group-hover:translate-y-0
                    group-hover:opacity-100
                  "
                >
                  {/* Accent */}
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-1 w-10 rounded-full bg-linear-to-r from-cyan-600 to-sky-400 transition-all duration-500 group-hover:w-14" />
                    <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-extrabold tracking-tight text-[#16244c]">
                    {s.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-xs leading-5 text-[#16244c]/65">
                    {s.desc}
                  </p>

                  {/* Explore */}
                  <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-cyan-600">
                    Explore
                    <span className="text-base transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>

                {/* Collapsed Title */}
                <div
                  className="
                    absolute bottom-6 left-1/2
                    w-full -translate-x-1/2
                    px-3 text-center
                    transition-all duration-500
                    group-hover:translate-y-6
                    group-hover:opacity-0
                  "
                >
                  <h3 className="text-sm font-bold leading-tight text-[#16244c]">
                    {s.title}
                  </h3>
                </div>
              </div>

              {/* Bottom Active Line */}
              <div
                className="
                absolute bottom-0 left-0 h-0.75 w-0
                bg-linear-to-r from-cyan-600 via-cyan-400 to-sky-400
                transition-all duration-700
                group-hover:w-full
               "
              />
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ METHOD STATS ═══════════════ */}
      <section className="px-5 pb-24 sm:px-9">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white px-3 py-8 sm:py-5 shadow-sm ring-1 ring-slate-100 sm:px-1">
          <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-2 lg:grid-cols-3 lg:gap-30">
            {methodStats.map((m, index) => (
              <div
                key={m.label}
                className="flex flex-col items-center gap-1.5 animate-[statReveal_0.7s_ease-out_forwards] opacity-0"
                style={{ animationDelay: `${index * 0.25}s` }}
              >
                <p className="bg-linear-to-r from-cyan-600 to-sky-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent transition-transform duration-300 hover:scale-110 sm:text-3xl">
                  {m.value}
                </p>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#16244c]/50">
                  {m.label}
                </p>
              </div>
            ))}
          </div>

          <style>{`
            @keyframes statReveal {
              from { opacity: 0; transform: translateY(25px) scale(0.9); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section id="cta" className="px-5 pb-24 sm:px-8">
        <ProjectTimeline />
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-[#16244c]/10 bg-white/80 px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <PertLogo />
                <span className="text-lg font-extrabold tracking-tight">
                  Innovate
                  <span className="text-cyan-600">PERT</span>
                </span>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-[#16244c]/60">
                Probabilistic project scheduling powered by PERT methodology —
                predict risk, crash costs and deliver on time, every time.
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#16244c]/70">Platform</h4>
              <ul className="mt-4 space-y-2.5">
                {["PERT Analysis", "Risk Simulation", "Cost Crashing", "Analytics Dashboard"].map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => scrollTo("features")}
                      className="cursor-pointer text-sm text-[#16244c]/60 transition-colors hover:text-cyan-600"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#16244c]/70">Resources</h4>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <button
                    onClick={() => scrollTo("how")}
                    className="cursor-pointer text-sm text-[#16244c]/60 transition-colors hover:text-cyan-600"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("features")}
                    className="cursor-pointer text-sm text-[#16244c]/60 transition-colors hover:text-cyan-600"
                  >
                    Platform Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("cta")}
                    className="cursor-pointer text-sm text-[#16244c]/60 transition-colors hover:text-cyan-600"
                  >
                    Get Started
                  </button>
                </li>
              </ul>
            </div>

            {/* Get started */}
            <div className="flex flex-col items-start gap-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#16244c]/70">Get Started</h4>
              <p className="max-w-xs text-sm leading-relaxed text-[#16244c]/60">
                Sign in to start scheduling smarter — your first project plan is
                minutes away.
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#16244c]/10 pt-8 md:flex-row">
            <p className="text-sm text-[#16244c]/50">
              © 2026{" "}
              <span className="font-semibold text-[#16244c]/70">Orchasp Limited</span>. All rights reserved.
            </p>
            <p className="text-sm text-[#16244c]/50">
              Built for{" "}
              <span className="font-semibold text-[#16244c]/70">R&D Directors</span> &{" "}
              <span className="font-semibold text-[#16244c]/70">Project Managers</span>
            </p>
          </div>
        </div>
      </footer>

      {isLoginOpen && <AuthModal onClose={() => setIsLoginOpen(false)} />}
    </div>
  );
}

export default Homepage;
