import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Collapse,
  Tooltip,
  CircularProgress,
  Tab,
  Tabs,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { styled } from "@mui/system";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, Legend);

// --- TYPE DEFINITIONS & CONSTANTS (Adapted from Quick.tsx) ---
type ColorKey = 0 | 1 | 2 | 3 | 4;
type RawChunk = [string, ColorKey]; // Structure from API response: [text_chunk, class_key]

interface ChunkCounts {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  total: number;
}

// COSMIC AESTHETIC CONSTANTS
const ACCENT_COLOR_PRIMARY = "#FF00FF";
const ACCENT_COLOR_SECONDARY = "#00FFFF";
const TEXT_COLOR_MUTED = "rgba(255, 255, 255, 0.8)";

// Color mapping for AI detection categories (from Quick.tsx)
const colorMap: Record<ColorKey, string> = {
  0: "#ff4d4d", // AI (Red)
  1: "#ffa64d", // Humanised (Orange)
  2: "#33cc33", // Human (Green)
  3: "#4da6ff", // Polished (Blue)
  4: "#b366ff", // Cannot be determined (Purple)
};

// Helper function to map ColorKey to a readable name (from Quick.tsx)
function colorKeyToName(key: ColorKey): string {
  switch (key) {
    case 0:
      return "AI";
    case 1:
      return "Humanised";
    case 2:
      return "Human";
    case 3:
      return "Polished";
    case 4:
      return "Undetermined";
    default:
      return "Unknown";
  }
}

const crystalShardStyle: React.CSSProperties = {
  backdropFilter: "blur(30px) saturate(180%)",
  background: "rgba(30, 30, 30, 0.7)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "2rem",
  boxShadow:
    "0 10px 40px 0 rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)",
  transition: "all 0.3s ease-in-out",
};

const initialChunkCounts: ChunkCounts = {
  0: 0,
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  total: 0,
};

// Styled component for the raw data console output
const DataConsoleBox = styled(Box)(() => ({
  height: "60vh",
  overflowY: "auto",
  padding: "30px",
  borderRadius: "1.5rem",
  background: "rgba(40, 40, 40, 0.7)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
  lineHeight: 1.8,
  fontFamily: '"Consolas", "Courier New", monospace',
  fontSize: "0.95rem",
  whiteSpace: "pre-wrap",
}));

// --- AI Detection API Dashboard Component ---

export default function AdvancedScan() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("Select a PDF file to begin.");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChartOpen, setIsChartOpen] = useState(false);

  // API Results
  const [processedPdfBase64, setProcessedPdfBase64] = useState<string | null>(
    null
  );
  const [rawClassificationData, setRawClassificationData] = useState<
    RawChunk[]
  >([]);

  const [chunkCounts, setChunkCounts] =
    useState<ChunkCounts>(initialChunkCounts);
  const [outputTab, setOutputTab] = useState(0); // 0: PDF Viewer, 1: Raw Data

  // Calculate percentages for the legend and chart dynamically
  const percentages = useMemo<Record<ColorKey, string>>(() => {
    if (chunkCounts.total === 0) {
      return { 0: "0.0", 1: "0.0", 2: "0.0", 3: "0.0", 4: "0.0" };
    }
    return (Object.keys(colorMap) as unknown as ColorKey[]).reduce(
      (acc, key) => {
        acc[key] = ((chunkCounts[key] / chunkCounts.total) * 100).toFixed(1);
        return acc;
      },
      {} as Record<ColorKey, string>
    );
  }, [chunkCounts]);

  // Chart data calculation
  const chartData = useMemo(() => {
    const labels = (Object.keys(colorMap) as unknown as ColorKey[]).map((key) =>
      colorKeyToName(key)
    );
    // Use raw counts for chart data, as Chart.js prefers numbers, not fixed strings
    const dataValues = (Object.keys(colorMap) as unknown as ColorKey[]).map(
      (key) => chunkCounts[key]
    );
    const backgroundColors = Object.values(colorMap);

    return {
      labels: labels,
      datasets: [
        {
          data: dataValues,
          backgroundColor: backgroundColors,
          borderColor: "rgba(255, 255, 255, 0.2)",
          borderWidth: 1,
        },
      ],
    };
  }, [chunkCounts]);

  // Chart options for cosmic aesthetic
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: TEXT_COLOR_MUTED,
          font: {
            size: 14,
            family: '"Poppins", sans-serif',
          },
        },
      },
      title: {
        display: true,
        text: "AI Classification Distribution (Weighted by Text Length)",
        color: ACCENT_COLOR_PRIMARY,
        font: {
          size: 20,
          weight: "700",
          family: '"Poppins", sans-serif',
        },
        padding: {
          top: 10,
          bottom: 30,
        },
      },
      tooltip: {
        backgroundColor: "rgba(30, 30, 30, 0.8)",
        titleColor: ACCENT_COLOR_SECONDARY,
        bodyColor: TEXT_COLOR_MUTED,
        borderColor: ACCENT_COLOR_PRIMARY,
        borderWidth: 1,
        callbacks: {
            // Customize tooltip to show percentage
            label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${value} (Weight) | ${percentage}%`;
            }
        }
      },
    },
  };

  // --- File Handling Logic ---

  const handleFileChange = useCallback((file: File) => {
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setStatus(`Selected file: ${file.name}`);
      setIsChartOpen(false);
      setProcessedPdfBase64(null); // Clear previous results
      setRawClassificationData([]);
      setChunkCounts(initialChunkCounts);
    } else {
      console.error("Invalid file type. Please select a PDF.");
      setSelectedFile(null);
      setStatus("Error: Invalid file type. Please select a PDF.");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileChange(e.dataTransfer.files[0]);
      }
    },
    [handleFileChange]
  );

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // --- API Call Logic ---

  const handleStartAnalysis = useCallback(async () => {
    if (!selectedFile) {
      setStatus("Error: Please select a PDF file first.");
      return;
    }

    setIsProcessing(true);
    setProcessedPdfBase64(null);
    setRawClassificationData([]);
    setChunkCounts(initialChunkCounts);
    setStatus(`Uploading and analyzing "${selectedFile.name}"...`);
    setIsChartOpen(false);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:5000/api/pdf/actual", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ msg: response.statusText }));
        throw new Error(`API Error ${response.status}: ${errorData.msg || response.statusText}`);
      }

      const result = await response.json();
      
      const { pdf_bytes, data } = result;

      if (!pdf_bytes || !data) {
          throw new Error("Invalid response structure from API. Missing pdf_bytes or data.");
      }
      
      // 1. Process Classification Data (Weighted by text length, as in Fin-PDF-High.html)
      let counts: ChunkCounts = { ...initialChunkCounts };
      for (const [text, classKey] of data as RawChunk[]) {
          const weight = text.length; // Using length for weight
          if (classKey in counts) {
              counts[classKey as ColorKey] += weight;
              counts.total += weight;
          }
      }

      // 2. Set Results
      setProcessedPdfBase64(pdf_bytes);
      setRawClassificationData(data);
      setChunkCounts(counts);

      setStatus(result.message || "Analysis complete. Results displayed below.");
      setOutputTab(0); // Switch to PDF View

    } catch (error) {
      console.error("Analysis Failed:", error);
      setStatus(`Analysis Failed: ${error instanceof Error ? error.message : "Network error"}`);
      setProcessedPdfBase64(null);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile]);

  // --- Render Functions ---

  const renderRawDataConsole = () => (
    <DataConsoleBox>
      <Typography
        component="strong"
        sx={{
          color: ACCENT_COLOR_SECONDARY,
          mb: 2,
          fontSize: "1.2rem",
          display: "block",
          borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
          p: 1,
        }}
      >
        [ RAW CLASSIFICATION CHUNKS (Total Chunks: {rawClassificationData.length}) ]
      </Typography>
      <Box component="p" sx={{ margin: 0, whiteSpace: "pre-wrap" }}>
        {rawClassificationData.map(([text, colorKey], chunkIndex) => (
          <Tooltip
            key={chunkIndex}
            title={
              <Typography
                variant="caption"
                sx={{ fontSize: "0.8rem", fontWeight: 600 }}
              >
                {`CLASSIFICATION: ${colorKeyToName(colorKey)} (Weight: ${text.length} chars)`}
              </Typography>
            }
            arrow
            placement="top"
            componentsProps={{
              tooltip: {
                sx: {
                  backgroundColor: colorMap[colorKey] || "#fff",
                  color: colorKey === 2 ? "black" : "white",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
                  backdropFilter: "blur(5px)",
                },
              },
            }}
          >
            <Box
              component="span"
              sx={{
                textDecoration: `underline solid ${colorMap[colorKey] || "#fff"}`,
                textDecorationThickness: "2.5px",
                textUnderlineOffset: "4px",
                marginRight: "4px",
                color: TEXT_COLOR_MUTED,
                transition: "color 0.2s ease",
                textDecorationColor: colorMap[colorKey] || "#fff",
                cursor: "help",
                "&:hover": {
                  color: colorMap[colorKey],
                },
              }}
            >
              {text}
            </Box>
          </Tooltip>
        ))}
      </Box>
    </DataConsoleBox>
  );
  
  const renderPdfViewer = () => (
    <Box
        component="iframe"
        id="pdfViewer"
        title="Processed PDF"
        src={processedPdfBase64 ? `data:application/pdf;base64,${processedPdfBase64}` : ''}
        sx={{
            width: "100%",
            height: "60vh",
            borderRadius: "1.5rem",
            border: `1px solid ${ACCENT_COLOR_SECONDARY}40`,
            backgroundColor: "rgba(40, 40, 40, 0.9)",
            boxShadow: `0 0 15px ${ACCENT_COLOR_SECONDARY}30`,
        }}
    />
  );


  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        background: "transparent",
        color: "#fff",
        fontFamily: '"Poppins", sans-serif',
        padding: { xs: 2, md: 5 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* --- Main Crystal Shard Container (Input & Controls) --- */}
      <Box
        sx={{
          ...crystalShardStyle,
          width: "100%",
          maxWidth: 1000,
          p: { xs: 4, md: 6 },
          mb: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            color: ACCENT_COLOR_PRIMARY,
            fontWeight: 800,
            mb: 4,
            textShadow: `0 0 10px ${ACCENT_COLOR_PRIMARY}80`,
          }}
        >
          API Document Analysis System - `/api/pdf/actual`
        </Typography>

        {/* Drag and Drop Area */}
        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-upload-input")?.click()}
          sx={{
            border: `2px dashed ${
              dragActive ? ACCENT_COLOR_PRIMARY : "rgba(255, 255, 255, 0.2)"
            }`,
            borderRadius: "15px",
            p: { xs: 5, md: 8 },
            width: "100%",
            textAlign: "center",
            cursor: "pointer",
            transition:
              "border 0.3s ease, background 0.3s ease, box-shadow 0.3s ease",
            backgroundColor: dragActive
              ? "rgba(255,0,255,0.1)"
              : "rgba(0, 0, 0, 0.2)",
            "&:hover": {
              border: `2px dashed ${ACCENT_COLOR_PRIMARY}`,
              boxShadow: `0 0 15px ${ACCENT_COLOR_PRIMARY}50`,
            },
          }}
        >
          <input
            type="file"
            id="file-upload-input"
            accept="application/pdf"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
            style={{ display: "none" }}
          />
          <Box id="file-placeholder">
            {selectedFile ? (
              <Box>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="50"
                  height="50"
                  fill={ACCENT_COLOR_PRIMARY}
                  viewBox="0 0 16 16"
                  style={{ display: "block", margin: "0 auto" }}
                >
                  <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3.5V1h4v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
                </svg>
                <Typography
                  sx={{
                    display: "block",
                    fontSize: "20px",
                    mt: 2,
                    color: ACCENT_COLOR_PRIMARY,
                    fontWeight: 600,
                  }}
                >
                  {selectedFile.name.length > 20
                    ? selectedFile.name.substring(0, 20) +
                      "###." +
                      selectedFile.name.split(".").pop()
                    : selectedFile.name}
                </Typography>
                <Typography
                  sx={{ color: TEXT_COLOR_MUTED, fontSize: "14px", mt: 0.5 }}
                >
                  Ready for analysis. Click 'Start' below.
                </Typography>
              </Box>
            ) : (
              <Box>
                <CloudUploadIcon
                  sx={{ fontSize: 50, color: "rgba(255, 255, 255, 0.5)" }}
                />
                <Typography
                  sx={{
                    display: "block",
                    fontSize: "20px",
                    mt: 2,
                    fontWeight: 500,
                  }}
                >
                  Drag & Drop PDF File
                </Typography>
                <Typography
                  sx={{
                    display: "block",
                    fontSize: "14px",
                    color: TEXT_COLOR_MUTED,
                  }}
                >
                  or Click to Open File Browser
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Start Button */}
        <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
          <Button
            id="startBtn"
            onClick={handleStartAnalysis}
            disabled={!selectedFile || isProcessing}
            variant="contained"
            sx={{
              background: ACCENT_COLOR_PRIMARY,
              border: "none",
              padding: "12px 40px",
              borderRadius: "15px",
              color: "black",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: `0 0 15px ${ACCENT_COLOR_PRIMARY}80`,
              "&:hover": {
                background: ACCENT_COLOR_SECONDARY,
                boxShadow: `0 0 25px ${ACCENT_COLOR_SECONDARY}FF`,
                transform: "translateY(-2px)",
              },
              "&:disabled": {
                background: "rgba(255, 255, 255, 0.1)",
                color: "rgba(255, 255, 255, 0.5)",
                boxShadow: "none",
              },
            }}
          >
            {isProcessing ? (
              <CircularProgress size={24} sx={{ color: "black" }} />
            ) : (
              "ACTIVATE ANALYSIS"
            )}
          </Button>
        </Box>

        {/* --- Status & Progress --- */}
        <Box sx={{ mt: 5, width: "100%" }}>
          <Typography
            component="p"
            sx={{
              margin: "10px 0",
              color: isProcessing ? ACCENT_COLOR_SECONDARY : TEXT_COLOR_MUTED,
              fontWeight: 500,
            }}
          >
            SYSTEM STATUS: {status}
          </Typography>

          {isProcessing && (
            <Box sx={{ width: "100%", mb: 3 }}>
              {/* Using indeterminate progress for a single blocking API call */}
              <LinearProgress
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: ACCENT_COLOR_PRIMARY,
                    boxShadow: `0 0 8px ${ACCENT_COLOR_PRIMARY}80`,
                  },
                }}
              />
              <Typography
                variant="body2"
                color={ACCENT_COLOR_PRIMARY}
                sx={{ mt: 1, textAlign: "right", fontWeight: 700 }}
              >
                Processing data, please wait...
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* --- Results Section (Only displays after API success) --- */}
      {processedPdfBase64 && (
        <Box sx={{ width: "100%", maxWidth: 1000, mb: 5 }}>
          {/* Collapsible Chart Section */}
          <Box sx={{ mb: 4, width: "100%" }}>
            <Button
              onClick={() => setIsChartOpen((prev) => !prev)}
              variant="outlined"
              sx={{
                width: "100%",
                mt: 2,
                mb: 2,
                padding: "10px 20px",
                color: ACCENT_COLOR_PRIMARY,
                borderColor: ACCENT_COLOR_PRIMARY,
                fontWeight: 700,
                borderRadius: "10px",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: ACCENT_COLOR_SECONDARY,
                  color: ACCENT_COLOR_SECONDARY,
                  backgroundColor: "rgba(255, 0, 255, 0.1)",
                  boxShadow: `0 0 15px ${ACCENT_COLOR_PRIMARY}40`,
                },
              }}
            >
              {isChartOpen ? "HIDE CLASSIFICATION CHART ▲" : "SHOW CLASSIFICATION CHART ▼"}
            </Button>
            <Collapse in={isChartOpen}>
              <Box
                sx={{
                  ...crystalShardStyle,
                  p: 4,
                  height: "400px",
                  mt: 2,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {chunkCounts.total > 0 ? (
                    // @ts-expect-error
                  <Pie data={chartData} options={chartOptions} />
                ) : (
                  <Typography color={TEXT_COLOR_MUTED}>
                    No classification data found in response.
                  </Typography>
                )}
              </Box>
            </Collapse>
          </Box>

          {/* PDF Viewer / Raw Data Toggle */}
          <Tabs
            value={outputTab}
            onChange={(_, newValue) => setOutputTab(newValue)}
            sx={{
              mb: 2,
              "& .MuiTabs-indicator": { backgroundColor: ACCENT_COLOR_PRIMARY },
            }}
          >
            <Tab
              label="Processed PDF Viewer"
              sx={{ color: outputTab === 0 ? ACCENT_COLOR_PRIMARY : TEXT_COLOR_MUTED, fontWeight: 700 }}
            />
            <Tab
              label="Raw Classification Console"
              sx={{ color: outputTab === 1 ? ACCENT_COLOR_PRIMARY : TEXT_COLOR_MUTED, fontWeight: 700 }}
            />
          </Tabs>

          {/* Content Box */}
          <Box sx={{ position: "relative" }}>
            {outputTab === 0 && renderPdfViewer()}
            {outputTab === 1 && renderRawDataConsole()}
          </Box>
        </Box>
      )}

      {/* --- Legend Panel (Fixed position) --- */}
      <Box
        id="legend"
        sx={{
          ...crystalShardStyle,
          position: "fixed",
          top: { xs: "auto", sm: "150px" },
          bottom: { xs: "20px", sm: "auto" },
          right: "20px",
          width: "220px",
          p: 3,
          zIndex: 10,
        }}
      >
        <Typography
          component="h3"
          sx={{
            fontSize: "18px",
            mb: 2,
            textAlign: "center",
            fontWeight: 700,
            color: ACCENT_COLOR_SECONDARY,
            borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
          }}
        >
          ANALYSIS LEGEND
        </Typography>

        {(Object.keys(colorMap) as unknown as ColorKey[]).map((key) => {
          const color = colorMap[key];
          const name = colorKeyToName(key);
          const percentage = percentages[key];
          return (
            <Box
              key={key}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
                fontSize: "15px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  minWidth: "120px",
                  flexGrow: 1,
                }}
              >
                <span
                  className="color-box"
                  style={{
                    background: color,
                    width: "18px",
                    height: "18px",
                    borderRadius: "4px",
                    marginRight: "10px",
                    boxShadow: `0 0 5px ${color}80`,
                  }}
                ></span>
                <Typography
                  component="span"
                  sx={{ color: TEXT_COLOR_MUTED, fontWeight: 500 }}
                >
                  {name}
                </Typography>
              </Box>
              <Typography
                component="span"
                sx={{
                  color: color,
                  fontWeight: 800,
                  minWidth: "40px",
                  textAlign: "right",
                }}
                id={`perc${key}`}
              >
                {percentage}%
              </Typography>
            </Box>
          );
        })}
        <Typography
          variant="body2"
          sx={{
            mt: 2,
            pt: 1,
            borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
            textAlign: "center",
            color: TEXT_COLOR_MUTED,
          }}
        >
          Total Weighted Chars: {chunkCounts.total}
        </Typography>
      </Box>
    </Box>
  );
}