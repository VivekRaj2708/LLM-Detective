# LLM Detective 🔍

An advanced AI-powered document analysis system that uses machine learning to detect AI-generated content in PDF documents. The system provides real-time OCR processing with intelligent text classification and visual highlighting through a modern web interface.

## 🌟 Features

- **Real-time PDF OCR Processing**: WebSocket-based PDF text extraction with live progress tracking
- **AI Content Detection**: Advanced machine learning classification of text as AI-generated, human-written, humanised, polished, or undetermined
- **Interactive Web Interface**: Modern React-based dashboard with glassmorphic design and cosmic aesthetics
- **Visual Analytics**: Color-coded text highlighting with percentage breakdowns and interactive tooltips
- **Live Progress Monitoring**: Real-time scanning progress with the ability to stop processing mid-way
- **Pagination & Navigation**: Efficient page-by-page analysis results with jump-to-page functionality
- **OpenTelemetry Integration**: Comprehensive distributed tracing for monitoring and debugging

## 🚀 Tech Stack

### Backend
- **FastAPI**: High-performance async web framework
- **PyMuPDF (fitz)**: PDF processing and manipulation
- **Tesseract OCR**: Optical character recognition
- **OpenTelemetry**: Distributed tracing and observability
- **WebSockets**: Real-time bidirectional communication
- **pdf2image**: PDF to image conversion
- **httpx**: Async HTTP client for ML model requests

### Frontend
- **React 19**: Modern React with hooks and context
- **TypeScript**: Type-safe JavaScript development
- **Material-UI**: Component library with custom styling
- **Vite**: Fast build tool and development server
- **WebSocket API**: Real-time communication with backend
- **Framer Motion**: Smooth animations and transitions

### Machine Learning
- **PyTorch**: Deep learning framework
- **Safetensors**: Secure tensor serialization
- **Custom Classification Model**: Fine-tuned for AI content detection

## 📁 Project Structure

```
LLM-Detective/
├── README.md
├── backend/                          # FastAPI Backend Server
│   ├── Main.py                      # Main FastAPI application
│   ├── requirements.txt             # Python dependencies
│   ├── Run.sh                      # Server startup script
│   ├── credentials.json            # Firebase credentials
│   ├── __pycache__/                # Python cache files
│   ├── Model/                      # AI Classification Model
│   │   ├── config.json
│   │   ├── gitattributes
│   │   ├── model.safetensors
│   │   ├── special_tokens_map.json
│   │   ├── tokenizer_config.json
│   │   └── vocab.txt
│   ├── Static/                     # Static web assets
│   ├── Templates/                  # Jinja2 HTML templates
│   │   ├── OCR-Test.html
│   │   └── PDF-OCR.html
│   ├── Tesseract/                  # OCR Processing Module
│   │   ├── OCR.py                 # OCR implementation
│   │   └── __pycache__/
│   ├── Test/                       # Unit Tests
│   │   └── XMLConversion.py       # PDF to XML conversion tests
│   ├── uploads/                    # File upload storage
│   │   ├── *.pdf                  # Uploaded PDF files
│   │   ├── *.zip                  # Compressed uploads
│   │   └── [folders]/             # Organized uploads
│   └── Utils/                      # Utility Modules
│       ├── File.py                # File operations & PDF processing
│       ├── Para.py                # Paragraph splitting utilities
│       ├── PDF.py                 # PDF highlighting functions
│       ├── Group.py               # Text grouping utilities
│       ├── Request.py             # HTTP request utilities
│       ├── Server.py              # Server utilities
│       └── __pycache__/
├── frontend/                        # React Frontend Application
│   ├── package.json                # Node.js dependencies
│   ├── vite.config.ts             # Vite configuration
│   ├── tsconfig.json              # TypeScript configuration
│   ├── eslint.config.js           # ESLint configuration
│   ├── index.html                 # HTML entry point
│   ├── README.md                  # Frontend documentation
│   ├── public/                    # Public static assets
│   │   └── vite.svg
│   └── src/                       # Source code
│       ├── main.tsx              # Application entry point
│       ├── index.css             # Global styles
│       ├── Router.tsx            # React Router configuration
│       ├── Store.ts              # Redux store configuration
│       ├── Firebase.ts           # Firebase configuration
│       ├── assets/               # Static assets
│       │   ├── *.svg, *.png, *.jpg  # Images and icons
│       │   └── Background.jpg     # UI backgrounds
│       ├── Components/           # React Components
│       │   ├── AddProject.tsx    # Project creation component
│       │   ├── Dashboard.tsx     # Main dashboard component
│       │   └── Quick.tsx         # AI Detection interface
│       ├── Pages/                # Page Components
│       │   ├── Dashboard.tsx     # Dashboard page
│       │   ├── Home.tsx          # Landing page
│       │   └── Login.tsx         # Authentication page
│       └── Store/                # Redux State Management
│           └── Login.ts          # Authentication state
├── model/                           # External ML Model Server
│   └── API.py                      # Model API endpoint
└── test/                           # Test Files & Sample Data
    ├── *.pdf                      # Sample PDF documents
    ├── test.zip                   # Test archives
    └── OCR/                       # OCR test cases
        └── *.pdf, *.jpg           # Test images and documents
```

## 🛠️ Installation & Setup

### Prerequisites
- **Python 3.8+**
- **Node.js 16+**
- **Tesseract OCR** installed on system
- **Git**

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/VivekRaj2708/LLM-Detective.git
   cd LLM-Detective/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Install additional requirements**
   ```bash
   pip install pdf2image Pillow pdfminer.six PyMuPDF opentelemetry-api opentelemetry-sdk opentelemetry-instrumentation-fastapi opentelemetry-exporter-otlp
   ```

5. **Start the backend server**
   ```bash
   python Main.py
   # Or use the startup script
   chmod +x Run.sh && ./Run.sh
   ```

   The backend will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

### ML Model Server Setup

1. **Start the classification model server**
   ```bash
   cd ../model
   python API.py
   ```

   The model API will be available at `http://localhost:3344`

## 🚀 Usage

### Web Interface

1. **Access the application** at `http://localhost:5173`
2. **Upload a PDF** by dragging and dropping or clicking to browse
3. **Click "ACTIVATE ANALYSIS"** to start the OCR and AI detection process
4. **Monitor progress** with the real-time progress bar
5. **Stop processing** anytime using the "STOP ANALYSIS" button
6. **View results** with color-coded text highlighting:
   - 🔴 **Red**: AI-generated content
   - 🟠 **Orange**: Humanised AI content
   - 🟢 **Green**: Human-written content
   - 🔵 **Blue**: Polished content
   - 🟣 **Purple**: Cannot be determined

7. **Navigate results** using pagination controls
8. **Jump to specific pages** using the page input field

### API Endpoints

#### WebSocket Endpoints
- `ws://localhost:5000/ws/ocr/pdf` - Real-time PDF OCR processing
- `ws://localhost:5000/ws/upload` - File upload with progress tracking

#### REST Endpoints
- `POST /api/ocr` - Single image OCR processing
- `POST /api/ocr/pdf` - Batch PDF processing
- `GET /OCR` - OCR test interface
- `GET /` - Main web interface

## 🔧 Configuration

### Environment Variables
Create `.env` files in both frontend and backend directories:

**Backend `.env`:**
```env
MODEL_API_URL=http://localhost:3344/api/get
UPLOAD_DIR=uploads
TESSERACT_PATH=/usr/bin/tesseract
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
```

**Frontend `.env`:**
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_WS_BASE_URL=ws://localhost:5000
```

### Tesseract Configuration
Ensure Tesseract OCR is properly installed:

```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# macOS
brew install tesseract

# Windows
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
```

## 📊 Monitoring & Observability

The application includes comprehensive OpenTelemetry integration for distributed tracing:

- **Jaeger**: View distributed traces at `http://localhost:16686`
- **Custom metrics**: Monitor OCR processing performance
- **Error tracking**: Comprehensive error logging and tracing

To start Jaeger for tracing:
```bash
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 14268:14268 \
  jaegertracing/all-in-one:latest
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m unittest Test.XMLConversion
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature-name`
3. **Commit changes**: `git commit -am 'Add feature'`
4. **Push to branch**: `git push origin feature-name`
5. **Submit a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Vivek Raj** - [@VivekRaj2708](https://github.com/VivekRaj2708)

## 🙏 Acknowledgments

- **OpenTelemetry** for comprehensive observability
- **Material-UI** for beautiful React components
- **FastAPI** for high-performance async web framework
- **Tesseract OCR** for optical character recognition
- **PyMuPDF** for PDF processing capabilities

---

**🔍 LLM Detective** - Detecting AI-generated content with precision and style.
