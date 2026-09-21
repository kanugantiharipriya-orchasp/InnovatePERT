import {
  FaCheck,
  FaClipboardList,
  FaDraftingCompass,
  FaCode,
  FaVial,
  FaRocket,
} from "react-icons/fa";

const phases = [
  {
    title: "Planning",
    subtitle: "Requirements",
    icon: FaClipboardList,
    status: "completed",
  },
  {
    title: "Analysis",
    subtitle: "System Analysis",
    icon: FaDraftingCompass,
    status: "completed",
  },
  {
    title: "Development",
    subtitle: "Integration",
    icon: FaCode,
    status: "completed",
  },
  {
    title: "Testing",
    subtitle: "Validation",
    icon: FaVial,
    status: "completed",
  },
  {
    title: "Deployment",
    subtitle: "Production",
    icon: FaRocket,
    status: "deployment",
  },
];

function ProjectTimeline() {
  return (
    <div className="w-full overflow-hidden rounded-4xl border border-slate-100 bg-white p-5 shadow-xl shadow-cyan-100/40 sm:p-7 lg:p-8">
      {/* ================= HEADER ================= */}
      <div className="relative mb-10 flex items-center justify-between gap-3">
        {/* ================= LEFT ================= */}
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-800">
            Project Timeline
          </h2>
          {/* On small screens the centered label moves under the title */}
          <span className="mt-0.5 block text-[14px] font-bold uppercase text-cyan-600 sm:hidden">
            Project Progress
          </span>
        </div>

        {/* ================= CENTER ================= */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 text-center sm:block">
          <span className="text-[20px] font-bold uppercase text-cyan-600">
            Project Progress
          </span>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="shrink-0 rounded-2xl bg-linear-to-br from-emerald-50 to-green-50 px-6 py-3 text-center ring-1 ring-emerald-100">
          <div className="text-2xl font-extrabold text-emerald-600">100%</div>

          <div className="text-[10px] font-medium text-slate-500">
            Overall Progress
          </div>
        </div>
      </div>

      {/* ================= TIMELINE ================= */}
      {/* Horizontally scrollable on small screens instead of clipping */}
      <div className="overflow-x-auto">
        <div className="relative min-w-[750px] px-5 pb-5">
        {/* Background Line */}
        <div
          className="
            absolute left-[5%] right-[5%] top-11.5
            h-0.75 rounded-full
            bg-slate-200
          "
        />

        {/* ================= COMPLETED 100% LINE ================= */}

        <div
          className="
            absolute left-[5%] right-[5%] top-11.5 z-1
            h-0.75 rounded-full
            bg-linear-to-r
            from-cyan-400
            via-cyan-500
            to-teal-500
          "
        />

        {/* ================= PHASES ================= */}

        <div className="relative z-10 flex justify-between">
          {phases.map((phase) => {
            const isDeployment = phase.status === "deployment";

            return (
              <div
                key={phase.title}
                className="flex w-[18%] flex-col items-center text-center"
              >
                {/* ================= ICON ================= */}

                <div
                  className={`
                    relative flex h-12 w-12 items-center justify-center
                    rounded-full border-4 border-white
                    shadow-lg
                    transition-all duration-500

                    ${
                      isDeployment
                        ? `
                          bg-linear-to-br
                          from-emerald-500
                          via-green-500
                          to-teal-500
                          text-white
                          shadow-emerald-300/70
                          ring-4 ring-emerald-100
                        `
                        : `
                          bg-linear-to-br
                          from-teal-400
                          to-cyan-600
                          text-white
                          shadow-cyan-300/50
                          ring-1 ring-cyan-200
                        `
                    }
                  `}
                >
                  {/* Deployment Glow */}

                  {isDeployment && (
                    <>
                      <span
                        className="
                          absolute -inset-2
                          animate-ping
                          rounded-full
                          border-2
                          border-emerald-400
                          opacity-20
                        "
                      />

                      <span
                        className="
                          absolute -inset-1
                          rounded-full
                          border
                          border-emerald-300/60
                        "
                      />
                    </>
                  )}

                  {/* Icon */}

                  {isDeployment ? (
                    <FaRocket
                      className="
                        relative z-10
                        text-sm
                        animate-[rocketFloat_2s_ease-in-out_infinite]
                      "
                    />
                  ) : (
                    <FaCheck className="text-sm" />
                  )}
                </div>

                {/* ================= TEXT ================= */}

                <div className="mt-5">
                  <h3
                    className={`
                      text-sm font-bold sm:text-base
                      ${isDeployment ? "text-emerald-600" : "text-slate-800"}
                    `}
                  >
                    {phase.title}
                  </h3>

                  <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
                    {phase.subtitle}
                  </p>

                  {/* ================= STATUS ================= */}

                  {isDeployment ? (
                    <span
                      className="
                        mt-2 inline-flex items-center gap-1.5
                        rounded-full
                        bg-emerald-50
                        px-3 py-1
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-emerald-600
                        ring-1 ring-emerald-100
                      "
                    >
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      Deployed
                    </span>
                  ) : (
                    <span
                      className="
                        mt-2 inline-flex
                        rounded-full
                        bg-emerald-50
                        px-2.5 py-1
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-emerald-600
                      "
                    >
                      Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* ================= FOOTER ================= */}

      <div
        className="
          mt-8 flex flex-col gap-4
          border-t border-slate-100
          pt-5
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* Left */}

        <div className="flex flex-wrap gap-5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-cyan-600" />
            Completed
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Deployed
          </div>
        </div>

        {/* Right */}

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
            <FaCheck className="text-[9px]" />
          </span>
          Project Deployed Successfully
        </div>
      </div>

      {/* ================= ANIMATION ================= */}

      <style>
        {`
          @keyframes rocketFloat {
            0% {
              transform: translateY(0) rotate(0deg);
            }

            25% {
              transform: translateY(-2px) rotate(-3deg);
            }

            50% {
              transform: translateY(-4px) rotate(0deg);
            }

            75% {
              transform: translateY(-2px) rotate(3deg);
            }

            100% {
              transform: translateY(0) rotate(0deg);
            }
          }
        `}
      </style>
    </div>
  );
}

export default ProjectTimeline;
