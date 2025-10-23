import { useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  LinearProgress,
} from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderZipIcon from "@mui/icons-material/FolderZip";

// --- CONSTANTS ---
const MAX_UPLOAD_SIZE_MB = 50;
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

// --- Utility Functions ---
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// --- Add Project Form ---
export default function AddProjectForm() {
  const [projectName, setProjectName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [buttonText, setButtonText] = useState("Start Project Scan");

  const isFileSizeValid = useMemo(
    () => (file ? file.size <= MAX_UPLOAD_SIZE_BYTES : true),
    [file]
  );

  const handleFileChange = useCallback((selectedFile: File) => {
    if (selectedFile.name.endsWith(".zip")) {
      setFile(selectedFile);
    } else {
      console.error("Invalid file type uploaded. Must be a .zip file.");
      setFile(null);
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0])
        handleFileChange(e.dataTransfer.files[0]);
    },
    [handleFileChange]
  );

  const handleUpload = async () => {
    if (!projectName || !file || !isFileSizeValid) return;
    setUploading(true);
    setButtonText("0% Uploading...");

    const ws = new WebSocket("ws://localhost:5000/ws/upload");

    ws.onopen = () => {
      ws.send(JSON.stringify({ folderName: projectName, fileSize: file.size }));

      const chunkSize = 1024 * 1024;
      let offset = 0;
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          ws.send(event.target.result as ArrayBuffer); // send raw bytes
          offset += chunkSize;
          if (offset < file.size) readNextChunk();
          else ws.send("__END__"); // signal end of file
        }
      };

      const readNextChunk = () => {
        const blob = file.slice(offset, offset + chunkSize);
        reader.readAsArrayBuffer(blob);
      };

      readNextChunk();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data.progress);
      if (data.status === "uploading")
        setButtonText(`${Math.round(data.progress)}% Uploading...`);
      else if (data.status === "extracting")
        setButtonText(`${Math.round(data.progress)}% Extracting...`);
      else if (data.status === "done") {
        setButtonText("Complete ✅");
        setUploading(false);
      }
    };

    ws.onclose = () => console.log("WebSocket closed");
  };

  const textFieldStyle = {
    "& .MuiInputBase-input": { color: "white" },
    "& .MuiInputLabel-root": { color: "white" },
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "white" },
      "&:hover fieldset": { borderColor: "white" },
      "&.Mui-focused fieldset": { borderColor: "white" },
      backgroundColor: "rgba(255,255,255,0.05)",
      borderRadius: "0.75rem",
    },
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4, lg: 8 },
        minHeight: "80vh",
        fontFamily: "Roboto, sans-serif",
      }}
    >
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleUpload();
        }}
        sx={{
          flex: 1,
          minWidth: 240,
          backdropFilter: "blur(20px)",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "1.5rem",
          boxShadow: "0 8px 32px 0 rgba(0,0,0,0.25)",
          p: 2,
        }}
      >
        <Typography
          variant="h5"
          sx={{ color: "white", fontWeight: 700, mb: 4, textAlign: "center" }}
        >
          New Project
        </Typography>

        <TextField
          fullWidth
          label="Project Name"
          variant="outlined"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
          sx={{ mb: 3, ...textFieldStyle }}
        />

        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-upload-input")?.click()}
          sx={{
            border: `2px dashed ${dragActive ? "#FF00FF" : "#00FFFF"}`,
            borderRadius: "1rem",
            p: 4,
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: dragActive
              ? "rgba(0,255,255,0.1)"
              : "rgba(255,255,255,0.05)",
            transition: "all 0.3s",
            mb: 3,
          }}
        >
          <input
            type="file"
            id="file-upload-input"
            accept=".zip"
            onChange={(e) =>
              e.target.files && handleFileChange(e.target.files[0])
            }
            style={{ display: "none" }}
          />
          {!file ? (
            <FileUploadIcon
              sx={{ fontSize: 40, color: dragActive ? "#FF00FF" : "#00FFFF" }}
            />
          ) : (
            <FolderZipIcon
              sx={{
                fontSize: 40,
                color: !isFileSizeValid ? "#ff0000ff" : "#00FFFF",
              }}
            />
          )}
          <Typography sx={{ color: "white", mt: 1, fontWeight: 500 }}>
            {file
              ? file.name
              : "Drag and drop a ZIP folder here, or click to browse."}
          </Typography>
          <Typography variant="caption" sx={{ color: "gray.400" }}>
            Accepted format: .zip
          </Typography>
        </Box>

        {file && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: "0.5rem",
              border: `1px solid ${isFileSizeValid ? "#4ade80" : "#f87171"}`,
            }}
          >
            <Typography variant="subtitle2" sx={{ color: "white" }}>
              File Size: {formatBytes(file.size)}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: "gray.400" }}>
              Allowed Size: {MAX_UPLOAD_SIZE_MB} MB
            </Typography>
            {!isFileSizeValid && (
              <Typography variant="caption" color="error">
                File exceeds the maximum limit!
              </Typography>
            )}
            <Button
              startIcon={<DeleteIcon />}
              onClick={() => setFile(null)}
              size="small"
              sx={{ mt: 1, color: "#f87171" }}
            >
              Remove File
            </Button>
          </Box>
        )}

        <Button
          fullWidth
          type="submit"
          variant="contained"
          disabled={!projectName || !file || !isFileSizeValid || uploading}
          sx={{
            bgcolor: "#05b2b2ff",
            color: "black",
            fontWeight: 700,
            borderRadius: "1rem",
            py: 1.5,
            position: "relative",
            overflow: "hidden",
            "&:hover": { bgcolor: "#00FFFF" },
            "&.Mui-disabled": { bgcolor: "gray.700", color: "gray.400" },
          }}
        >
          {buttonText}
          {uploading && (
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: "4px",
                borderRadius: "0 0 1rem 1rem",
              }}
            />
          )}
        </Button>
      </Box>
    </Box>
  );
}
