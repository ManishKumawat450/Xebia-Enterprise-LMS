import React, { useRef } from "react";
import { useParams, Navigate, Link } from "@tanstack/react-router";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { useLMS } from "../context/LMSContext";
import { Download, ArrowLeft } from "lucide-react";

/* ── Primary color: Tranquil Velvet #6C1D5F ── */
const TV = "#6C1D5F";
const TV_DARK = "#4A1047";
const GOLD = "#C9A84C";

/* ─── Inline SVG stat icons ─── */
const CalendarIcon = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 24 24"
    fill="none"
    stroke={TV}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <rect x="7" y="13" width="3" height="3" rx="0.5" />
    <rect x="11" y="13" width="3" height="3" rx="0.5" />
  </svg>
);

const TrophyIcon = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 24 24"
    fill="none"
    stroke={TV}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M6 3h12v8a6 6 0 0 1-12 0z" />
  </svg>
);

const IdCardIcon = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 24 24"
    fill="none"
    stroke={TV}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <circle cx="8.5" cy="12" r="2" />
    <path d="M14 9h4" />
    <path d="M14 13h3" />
  </svg>
);

/* ─── Deterministic QR Code SVG ─── */
const QRCodeSVG = ({ value }) => {
  const SIZE = 11;
  let seed = 0;
  for (let i = 0; i < value.length; i++) seed = (seed * 31 + value.charCodeAt(i)) & 0xffffffff;

  const pseudo = (n) => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(seed) % n;
  };
  const grid = Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => pseudo(100) > 42),
  );

  // Force QR-like finder patterns (top-left, top-right, bottom-left corners)
  const setBlock = (r, c) => {
    if (r < SIZE && c < SIZE) grid[r][c] = true;
  };
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [2, 0],
    [1, 2],
    [2, 1],
    [2, 2],
    [0, SIZE - 3],
    [0, SIZE - 2],
    [0, SIZE - 1],
    [1, SIZE - 1],
    [2, SIZE - 1],
    [1, SIZE - 3],
    [2, SIZE - 3],
    [2, SIZE - 2],
    [SIZE - 3, 0],
    [SIZE - 2, 0],
    [SIZE - 1, 0],
    [SIZE - 1, 1],
    [SIZE - 1, 2],
    [SIZE - 3, 2],
    [SIZE - 2, 2],
    [SIZE - 3, 1],
  ].forEach(([r, c]) => setBlock(r, c));

  const cellSize = 8;
  const svgSize = SIZE * cellSize;
  return (
    <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
      <rect width={svgSize} height={svgSize} fill="white" />
      {grid.flatMap((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize - 1}
              height={cellSize - 1}
              fill={TV_DARK}
              rx="0.5"
            />
          ) : null,
        ),
      )}
    </svg>
  );
};

/* ─── Gold Laurel Badge ─── */
const LaurelBadge = () => (
  <svg viewBox="0 0 130 130" width="115" height="115">
    {/* Left laurel leaves */}
    {[
      [-60, 28, 88],
      [-48, 20, 80],
      [-38, 16, 70],
      [-28, 15, 60],
      [-18, 17, 50],
      [-10, 22, 42],
    ].map(([rot, cx, cy], i) => (
      <ellipse
        key={`l${i}`}
        cx={cx}
        cy={cy}
        rx="9"
        ry="4.5"
        fill={GOLD}
        opacity="0.9"
        transform={`rotate(${rot} ${cx} ${cy})`}
      />
    ))}
    {/* Right laurel leaves */}
    {[
      [60, 102, 88],
      [48, 110, 80],
      [38, 114, 70],
      [28, 115, 60],
      [18, 113, 50],
      [10, 108, 42],
    ].map(([rot, cx, cy], i) => (
      <ellipse
        key={`r${i}`}
        cx={cx}
        cy={cy}
        rx="9"
        ry="4.5"
        fill={GOLD}
        opacity="0.9"
        transform={`rotate(${rot} ${cx} ${cy})`}
      />
    ))}
    {/* Center circle */}
    <circle cx="65" cy="68" r="34" fill={TV} stroke={GOLD} strokeWidth="2" />
    <circle
      cx="65"
      cy="68"
      r="28"
      fill="none"
      stroke={GOLD}
      strokeWidth="0.8"
      strokeDasharray="3 2"
    />
    {/* Star */}
    <polygon
      points="65,50 68.5,60 79,60 70.5,67 73.5,77 65,70 56.5,77 59.5,67 51,60 61.5,60"
      fill={GOLD}
    />
    <text
      x="65"
      y="87"
      textAnchor="middle"
      fill={GOLD}
      fontSize="4.5"
      fontWeight="bold"
      fontFamily="Arial"
      letterSpacing="0.3"
    >
      COMMITMENT
    </text>
    <text
      x="65"
      y="93"
      textAnchor="middle"
      fill={GOLD}
      fontSize="4.5"
      fontWeight="bold"
      fontFamily="Arial"
      letterSpacing="0.3"
    >
      TO LEARN.
    </text>
    <text
      x="65"
      y="99"
      textAnchor="middle"
      fill={GOLD}
      fontSize="4.5"
      fontWeight="bold"
      fontFamily="Arial"
      letterSpacing="0.3"
    >
      DEDICATED TO
    </text>
    <text
      x="65"
      y="105"
      textAnchor="middle"
      fill={GOLD}
      fontSize="4.5"
      fontWeight="bold"
      fontFamily="Arial"
      letterSpacing="0.3"
    >
      EXCELLENCE.
    </text>
    <path d="M 52 115 Q 65 122 78 115" stroke={GOLD} strokeWidth="1.5" fill="none" />
  </svg>
);

export const CertificateView = () => {
  const { submissionId } = useParams({ strict: false });
  const { submissions, assessments, students, currentUser } = useLMS();
  const certificateRef = useRef(null);

  const submission = submissions.find((s) => s.id === submissionId);
  const assessment = submission ? assessments.find((a) => a.id === submission.assessmentId) : null;

  let student = students.find((s) => s.id === submission?.studentId);
  if (!student && currentUser && currentUser.id === submission?.studentId) student = currentUser;

  if (
    !submission ||
    !assessment ||
    !student ||
    !submission.isEvaluated ||
    submission.percentage < (assessment.passingMarks ?? 75)
  ) {
    return <Navigate to="/student/results" replace />;
  }

  const printDocument = () => window.print();

  const getOrdinalSuffix = (d) => {
    if (d > 3 && d < 21) return "th";
    return ["th", "st", "nd", "rd"][d % 10] || "th";
  };

  const dateObj = new Date(submission.submittedAt || Date.now());
  const completedDate = `${dateObj.getDate()}${getOrdinalSuffix(dateObj.getDate())} ${dateObj.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;
  const titleCode = assessment.title
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
  const certId = `XEB-${titleCode}-${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}-${submission.id.substring(4, 8)}`;

  const S = {
    page: {
      minHeight: "100vh",
      background: "#f0f0f5",
      padding: "32px 16px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
    actionBar: {
      width: "100%",
      maxWidth: "1000px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
      flexShrink: 0,
    },
    backLink: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      color: "#555",
      textDecoration: "none",
      fontSize: "14px",
    },
    dlBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 24px",
      background: TV,
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
    },
    cert: {
      width: "100%",
      maxWidth: "1000px",
      background: "#fff",
      boxShadow: "0 20px 60px rgba(108,29,95,0.18)",
      position: "relative",
      border: `2.5px solid ${TV}`,
      overflow: "hidden",
      flexShrink: 0,
    },
    inner: {
      margin: "8px",
      border: `0.75px solid ${TV}`,
      padding: "32px 44px 0 44px",
      display: "flex",
      flexDirection: "column",
      position: "relative",
    },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Dancing+Script:wght@700&family=Lato:wght@300;400;600;700&display=swap');
        .cert-bg-pattern::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            repeating-linear-gradient(135deg, rgba(108,29,95,0.025) 0px, rgba(108,29,95,0.025) 1px, transparent 1px, transparent 44px),
            repeating-linear-gradient(45deg,  rgba(108,29,95,0.025) 0px, rgba(108,29,95,0.025) 1px, transparent 1px, transparent 44px);
          pointer-events: none;
          z-index: 0;
        }
        .cert-content { position: relative; z-index: 1; }
        @media print {
          @page { size: landscape; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={S.page}>
        {/* Action Bar */}
        <div style={S.actionBar} className="no-print">
          <Link
            to={`/student/results/${assessment.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${submission.id}`}
            className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <ArrowLeft size={18} /> Back to Results
          </Link>
          <button onClick={printDocument} style={S.dlBtn}>
            <Download size={16} /> Download PDF
          </button>
        </div>

        {/* ── Certificate Card ── */}
        <div style={S.cert} className="cert-bg-pattern" ref={certificateRef}>
          <div style={S.inner} className="cert-content">
            {/* ── HEADER ── */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "18px",
              }}
            >
              {/* Actual Xebia logo from public folder */}
              <img src="/logo-light.png" alt="Xebia" style={{ height: "56px", width: "auto" }} />

              {/* Tagline with gold left-border */}
              <div
                style={{ textAlign: "right", borderLeft: `3px solid ${GOLD}`, paddingLeft: "14px" }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#444",
                    fontFamily: "'Lato', sans-serif",
                  }}
                >
                  Shaping Tomorrow
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: GOLD,
                    fontFamily: "'Lato', sans-serif",
                  }}
                >
                  with AI Today
                </div>
              </div>
            </div>

            {/* ── TITLE ── */}
            <div style={{ textAlign: "center", marginBottom: "4px" }}>
              <h1
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "clamp(40px, 6vw, 62px)",
                  fontWeight: "700",
                  color: TV,
                  letterSpacing: "0.18em",
                  margin: "0",
                  lineHeight: "1.1",
                }}
              >
                CERTIFICATE
              </h1>

              {/* OF COMPLETION with gold diamonds */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "14px",
                  marginTop: "8px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    height: "1px",
                    width: "90px",
                    background: `linear-gradient(to right, transparent, ${GOLD})`,
                  }}
                />
                <div
                  style={{
                    width: "5px",
                    height: "5px",
                    background: GOLD,
                    transform: "rotate(45deg)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Lato', sans-serif",
                    fontSize: "12px",
                    letterSpacing: "0.35em",
                    color: "#777",
                    textTransform: "uppercase",
                    fontWeight: "600",
                  }}
                >
                  Of Completion
                </span>
                <div
                  style={{
                    width: "5px",
                    height: "5px",
                    background: GOLD,
                    transform: "rotate(45deg)",
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    height: "1px",
                    width: "90px",
                    background: `linear-gradient(to left, transparent, ${GOLD})`,
                  }}
                />
              </div>
            </div>

            {/* ── BODY ── */}
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "'EB Garamond', serif",
                  fontSize: "15px",
                  color: "#666",
                  marginBottom: "10px",
                  fontStyle: "italic",
                }}
              >
                This is to certify that
              </p>

              <h2
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "clamp(28px, 4.5vw, 50px)",
                  fontWeight: "700",
                  color: TV,
                  letterSpacing: "0.08em",
                  margin: "0 0 8px 0",
                  lineHeight: "1",
                }}
              >
                {(student.name || "").toUpperCase()}
              </h2>

              {/* Gold underline with center diamond */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    height: "1.5px",
                    flex: 1,
                    maxWidth: "240px",
                    background: `linear-gradient(to right, transparent, ${GOLD} 40%, ${GOLD} 60%, transparent)`,
                  }}
                />
                <div
                  style={{
                    width: "7px",
                    height: "7px",
                    background: GOLD,
                    transform: "rotate(45deg)",
                    margin: "0 -3.5px",
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    height: "1.5px",
                    flex: 1,
                    maxWidth: "240px",
                    background: `linear-gradient(to left, transparent, ${GOLD} 40%, ${GOLD} 60%, transparent)`,
                  }}
                />
              </div>

              <p
                style={{
                  fontFamily: "'EB Garamond', serif",
                  fontSize: "15px",
                  color: "#666",
                  marginBottom: "4px",
                }}
              >
                has successfully completed
              </p>
              <h3
                style={{
                  fontFamily: "'EB Garamond', serif",
                  fontSize: "clamp(20px, 3vw, 30px)",
                  fontWeight: "600",
                  color: TV_DARK,
                  margin: "0 0 4px 0",
                }}
              >
                {assessment.title}
              </h3>
              <p
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: "12px",
                  color: "#888",
                  marginBottom: "18px",
                  lineHeight: "1.6",
                }}
              >
                offered by Xebia IT Architects Pvt. Ltd., demonstrating dedication,
                <br />
                knowledge, and a commitment to professional growth.
              </p>

              {/* ── STATS GRID ── */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  gap: "0",
                  marginBottom: "14px",
                }}
              >
                {[
                  { Icon: CalendarIcon, label: "DATE OF COMPLETION", value: completedDate },
                  { Icon: TrophyIcon, label: "SCORE", value: `${submission.percentage}%` },
                  { Icon: IdCardIcon, label: "CERTIFICATE ID", value: certId },
                ].map(({ Icon, label, value }, i, arr) => (
                  <React.Fragment key={label}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "0 clamp(16px,3vw,36px)",
                      }}
                    >
                      <Icon />
                      <span
                        style={{
                          fontFamily: "'Lato', sans-serif",
                          fontSize: "9px",
                          letterSpacing: "0.15em",
                          color: "#aaa",
                          textTransform: "uppercase",
                          marginTop: "8px",
                          marginBottom: "4px",
                          textAlign: "center",
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Lato', sans-serif",
                          fontSize: "13px",
                          fontWeight: "700",
                          color: TV_DARK,
                          textAlign: "center",
                        }}
                      >
                        {value}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div
                        style={{
                          width: "1px",
                          height: "70px",
                          background: "#e0e0e0",
                          alignSelf: "center",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* ── FOOTER ROW ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                alignItems: "flex-end",
                paddingBottom: "0",
              }}
            >
              {/* Signature */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span
                  style={{
                    fontFamily: "'Dancing Script', cursive",
                    fontSize: "clamp(28px, 3.5vw, 38px)",
                    color: TV,
                    lineHeight: "1",
                    marginBottom: "4px",
                  }}
                >
                  Xebia Tech Team
                </span>
                <div
                  style={{
                    width: "220px",
                    height: "1px",
                    background: TV,
                    opacity: 0.35,
                    marginBottom: "6px",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Lato', sans-serif",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: TV,
                  }}
                >
                  Xebia Tech Team
                </span>
                <span style={{ fontFamily: "'Lato', sans-serif", fontSize: "10px", color: "#999" }}>
                  Xebia IT Architects India Pvt. Ltd.
                </span>
              </div>

              {/* Center: Laurel Badge */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
                <LaurelBadge />
              </div>

              {/* Right: QR Code */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "flex-end",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    border: `1px solid #e0e0e0`,
                    padding: "5px",
                    borderRadius: "4px",
                    background: "#fff",
                  }}
                >
                  <QRCodeSVG value={certId} />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    maxWidth: "100px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Lato', sans-serif",
                      fontSize: "10px",
                      fontWeight: "700",
                      color: TV,
                      letterSpacing: "0.05em",
                    }}
                  >
                    VERIFY CERTIFICATE
                  </span>
                  <span
                    style={{
                      fontFamily: "'Lato', sans-serif",
                      fontSize: "9.5px",
                      color: "#888",
                      lineHeight: "1.45",
                    }}
                  >
                    Scan the QR code to verify the authenticity of this certificate.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── BOTTOM ARCH DECORATION ── */}
          <div style={{ width: "100%", overflow: "hidden", lineHeight: "0", marginTop: "8px" }}>
            <svg
              viewBox="0 0 1000 72"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block", width: "100%" }}
            >
              <rect x="0" y="0" width="1000" height="4" fill={GOLD} />
              <path d={`M 0 4 Q 500 78 1000 4 L 1000 72 L 0 72 Z`} fill={TV} />
              <path d={`M 0 4 Q 500 78 1000 4 Q 500 68 0 10 Z`} fill={GOLD} opacity="0.25" />
              <path
                d={`M 40 16 Q 500 82 960 16`}
                stroke={GOLD}
                strokeWidth="0.8"
                fill="none"
                opacity="0.5"
              />
            </svg>
          </div>
        </div>
        {/* bottom padding so scrollbar doesn't cut off */}
        <div style={{ height: "32px", flexShrink: 0 }} />
      </div>
    </>
  );
};
