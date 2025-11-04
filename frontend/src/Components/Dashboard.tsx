import { useState } from "react";
import {
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  TablePagination,
  Paper,
  Tooltip,
  Chip,
  Typography,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description"; // Document/Project Icon
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch"; // Active Projects
import CheckCircleIcon from "@mui/icons-material/CheckCircle"; // Completed
import VisibilityIcon from "@mui/icons-material/Visibility"; // View Report
import { useSelector } from "react-redux";
import type { RootState } from "../Store";
import { ProjectStoreToRow } from "../Utils/TypeCast";
import noProject from "../assets/NoProject.svg";

// --- NEW Data Interfaces ---

export interface ProjectRow {
  id: string;
  title: string;
  lastScanDate: string;
  status: "Completed" | "Scanning" | "Failed";
}

interface AIDashboardProps {
  projectHistory: ProjectRow[];
  totalStorageGB: number;
  usedStorageGB: number;
}

// --- Utility Functions (Adapted) ---

const statusColors: Record<ProjectRow["status"], "success" | "info" | "error"> =
  {
    Completed: "success",
    Scanning: "info",
    Failed: "error",
  };

// Helper to calculate days ago (still useful for 'Last Scan Date')
const getDaysAgo = (dateStr: string) => {
  const today = new Date();
  const date = new Date(dateStr);
  const diffTime = today.getTime() - date.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const formatDateWithSuffix = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  let suffix = "th";
  if (day % 10 === 1 && day !== 11) suffix = "st";
  else if (day % 10 === 2 && day !== 12) suffix = "nd";
  else if (day % 10 === 3 && day !== 13) suffix = "rd";

  return `${day}${suffix} ${month} ${year}`;
};

const NoProjectsMessage = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "350px",
      maxWidth: "1000px",
      mx: "auto",
      mt: 6,
      borderRadius: "1rem",
      backdropFilter: "blur(20px)",
      background: "rgba(255,255,255,0.05)",
      boxShadow: "0 8px 32px 0 rgba(0,0,0,0.25)",
      color: "white",
      textAlign: "center",
      p: 4,
    }}
  >
    <img
      src={noProject}
      alt="No Projects"
      style={{ width: "200px", marginBottom: "20px", opacity: 0.7 }}
    />
    <Typography variant="h6">
      No Projects Found
    </Typography>
    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb:5 }}>
      You haven’t added any projects yet. Once you upload or create a project,
      it will appear here.
    </Typography>
  </Box>
);

// --- Glass Card Component (Unchanged, looks great) ---

const GlassCard = ({ children }: { children: React.ReactNode }) => (
  <Card
    sx={{
      flex: 1,
      minWidth: 240,
      backdropFilter: "blur(20px)",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.2)",
      borderRadius: "1.5rem",
      boxShadow: "0 8px 32px 0 rgba(0,0,0,0.25)",
      p: 2,
      transition: "transform 0.3s, box-shadow 0.3s",
      "&:hover": {
        transform: "translateY(-5px)",
        boxShadow: "0 12px 40px 0 rgba(0,0,0,0.4)",
      },
    }}
  >
    <CardContent>{children}</CardContent>
  </Card>
);

// --- NEW Dashboard Cards Component ---

function AIDetectionDashboardCards({
  projectHistory,
  totalStorageGB,
  usedStorageGB,
}: AIDashboardProps) {
  const totalProjects = projectHistory.length;
  const activeProjects = projectHistory.filter(
    (row) => row.status === "Scanning"
  ).length;
  const storagePercentage = Math.round((usedStorageGB / totalStorageGB) * 100);

  const lastCompletedProject = projectHistory
    .filter((row) => row.status === "Completed")
    .slice(-1)[0];

  let storageColor = "#4ade80"; // Green
  if (storagePercentage > 97) {
    storageColor = "#f87171"; // Red
  } else if (storagePercentage > 85) {
    storageColor = "#facc15"; // Yellow
  }

  return (
    <Box className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mx-auto">
      {/* Total Projects Scanned Card */}
      <GlassCard>
        <Box className="flex flex-col items-center justify-center text-center gap-2">
          <DescriptionIcon sx={{ color: "#38bdf8", fontSize: 40 }} />
          <Typography
            variant="subtitle1"
            sx={{ color: "white", fontWeight: 500 }}
          >
            Total Projects Scanned
          </Typography>
          <Typography variant="h4" sx={{ color: "white", fontWeight: 700 }}>
            {totalProjects}
          </Typography>
        </Box>
      </GlassCard>

      {/* Active Projects Card */}
      <GlassCard>
        <Box className="flex flex-col items-center justify-center text-center gap-2">
          <RocketLaunchIcon sx={{ color: "#facc15", fontSize: 40 }} />
          <Typography
            variant="subtitle1"
            sx={{ color: "white", fontWeight: 500 }}
          >
            Active Scan Jobs
          </Typography>
          <Typography variant="h4" sx={{ color: "white", fontWeight: 700 }}>
            {activeProjects}
          </Typography>
        </Box>
      </GlassCard>

      {/* Storage Used Card (Circular Progress) */}
      <GlassCard>
        <Box className="flex flex-col items-center justify-center text-center gap-2">
          <Box sx={{ position: "relative", display: "inline-flex" }}>
            <CircularProgress
              variant="determinate"
              value={storagePercentage}
              size={60}
              thickness={5}
              sx={{ color: storageColor }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "white", fontWeight: 700 }}
              >
                {storagePercentage}%
              </Typography>
            </Box>
          </Box>
          <Typography
            variant="subtitle1"
            sx={{ color: "white", fontWeight: 500 }}
          >
            Storage Used
          </Typography>
          <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
            {usedStorageGB.toFixed(1)} GB / {totalStorageGB} GB
          </Typography>
        </Box>
      </GlassCard>

      {/* Last Completed Project Card */}
      <GlassCard>
        <Box className="flex flex-col items-center justify-center text-center gap-2">
          <CheckCircleIcon sx={{ color: "#4ade80", fontSize: 40 }} />
          <Typography
            variant="subtitle1"
            sx={{ color: "white", fontWeight: 500 }}
          >
            Last Completed Scan
          </Typography>
          {lastCompletedProject ? (
            <>
              <Typography
                variant="h6"
                sx={{ color: "white", fontWeight: 600, fontSize: "1rem" }}
              >
                {formatDateWithSuffix(lastCompletedProject.lastScanDate)}
              </Typography>
              <Typography sx={{ color: "gray.300" }}>
                {getDaysAgo(lastCompletedProject.lastScanDate)} days ago
              </Typography>
            </>
          ) : (
            <Typography sx={{ color: "gray.300" }}>
              No completed scans
            </Typography>
          )}
        </Box>
      </GlassCard>
    </Box>
  );
}

// --- Main Dashboard Component ---

export default function AIDetectionDashboard() {
  const [page, setPage] = useState(0);
  const rowsPerPage = 3; // Increased rows per page for a larger table

  const usedStorageGB = useSelector((state: RootState) => state.user.storage);
  const projectHistory = ProjectStoreToRow(
    useSelector((state: RootState) => state.project.projects)
  );

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);

  return (
    <Box
      sx={{
        p: 4,
        minHeight: "80vh",
      }}
    >
      {/* Cards */}
      <AIDetectionDashboardCards
        projectHistory={projectHistory}
        totalStorageGB={5}
        usedStorageGB={usedStorageGB}
      />

      {/* Project History Table */}
      {projectHistory.length === 0 ? (
        <NoProjectsMessage />
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: "1rem",
            marginTop: 6,
            overflow: "hidden",
            maxWidth: "1000px", // Set max width for better centering
            mx: "auto",
            backdropFilter: "blur(20px)",
            background: "rgba(255,255,255,0.05)",
            boxShadow: "0 8px 32px 0 rgba(0,0,0,0.25)",
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                {[
                  "Project ID",
                  "Title",
                  "Last Scan Date",
                  "Status",
                  "Actions",
                ].map((head) => (
                  <TableCell
                    key={head}
                    align="center"
                    sx={{
                      color: "#00FFFF",
                      fontWeight: 700,
                      borderBottom: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {projectHistory
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell align="center" sx={{ color: "white" }}>
                      {row.id}
                    </TableCell>
                    <TableCell align="left" sx={{ color: "white" }}>
                      {row.title}
                    </TableCell>
                    <TableCell align="center" sx={{ color: "white" }}>
                      {formatDateWithSuffix(row.lastScanDate)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={row.status}
                        color={statusColors[row.status]}
                        icon={
                          row.status === "Scanning" ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : undefined
                        }
                        sx={{
                          fontWeight: 600,
                          letterSpacing: 0.5,
                          backdropFilter: "blur(5px)",

                          background: (theme) =>
                            `${theme.palette[statusColors[row.status]].light}1A`, // Light semi-transparent background
                          color: (theme) =>
                            theme.palette[statusColors[row.status]].light,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View AI Detection Report">
                        <IconButton
                          onClick={() =>
                            alert(`Viewing report for Project: ${row.title}`)
                          }
                          sx={{ color: "#FF00FF" }}
                          disabled={row.status !== "Completed"}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={projectHistory.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[]}
            sx={{
              "& .MuiTablePagination-actions": { color: "white" },
              color: "white",
              backgroundColor: "rgba(255,255,255,0.07)",
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        </TableContainer>
      )}

      {/* Note: The user object and CertificateModal are now removed as they are no longer relevant */}
    </Box>
  );
}

// EXAMPLE USAGE (Not part of the export, but useful for testing)
/*
const sampleProjects: ProjectRow[] = [
  { id: 'PROJ-001', title: 'Thesis Draft V1.2', lastScanDate: '2024-10-20', status: 'Completed' },
  { id: 'PROJ-002', title: 'Research Paper: Quantum Physics', lastScanDate: '2024-10-23', status: 'Scanning' },
  { id: 'PROJ-003', title: 'Internal Policy Document', lastScanDate: '2024-10-15', status: 'Completed' },
  { id: 'PROJ-004', title: 'Client Report Q3 2024', lastScanDate: '2024-10-10', status: 'Failed' },
  { id: 'PROJ-005', title: 'Marketing Content Batch', lastScanDate: '2024-10-21', status: 'Completed' },
  { id: 'PROJ-006', title: 'Security Audit Documentation', lastScanDate: '2024-09-28', status: 'Completed' },
];

const App = () => (
  <AIDetectionDashboard 
    projectHistory={sampleProjects} 
    totalStorageGB={1000} 
    usedStorageGB={980} // Example for RED alert
    // usedStorageGB={860} // Example for YELLOW alert
    // usedStorageGB={500} // Example for GREEN alert
  />
);
*/
