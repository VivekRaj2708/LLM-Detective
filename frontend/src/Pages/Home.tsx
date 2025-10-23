import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SchoolIcon from "@mui/icons-material/School";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import IntegrationInstructionsIcon from "@mui/icons-material/IntegrationInstructions";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import useMediaQuery from "@mui/material/useMediaQuery";

// Assets (assuming these paths are correct)
import brain from "../assets/Brain.png";
import logo from "../assets/Logo.png";

// ---------------- GlowBlob ----------------
const GlowBlob: React.FC = () => (
  <>
    {/* Electric Cyan Glow */}
    <div className="pointer-events-none absolute -left-40 -top-40 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-[#00FFFF]/30 via-[#00FFFF]/10 to-[#FF00FF]/5 blur-3xl transform-gpu animate-blob opacity-60" />
    {/* Vibrant Magenta Glow */}
    <div className="pointer-events-none absolute -right-40 -bottom-40 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#FF00FF]/25 via-[#FF00FF]/10 to-[#00FFFF]/5 blur-2xl transform-gpu animate-blob animation-delay-2000 opacity-60" />
  </>
);

// ---------------- Navbar Components ----------------

const NavLink: React.FC<{
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}> = ({ children, href = "/", onClick }) => (
  <Link
    to={href}
    onClick={onClick}
    className="text-sm text-xl text-white text-gray-300/80 hover:text-cyan-400 hover:shadow-text-cyan transition-colors duration-200 px-3 py-2 rounded-md font-medium tracking-wide"
  >
    {children}
  </Link>
);

const MobileMenu: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col p-8 transition-opacity duration-300 ease-in-out">
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="p-2 text-white hover:text-cyan-400"
        >
          <CloseIcon className="h-8 w-8" />
        </button>
      </div>
      <div className="flex flex-col items-start space-y-4 mt-10">
        <NavLink href="/" onClick={onClose}>
          Home
        </NavLink>
        <NavLink href="#" onClick={onClose}>
          About
        </NavLink>
        <NavLink href="#" onClick={onClose}>
          Terms
        </NavLink>
        <button
          onClick={() => {
            navigate("/login");
            onClose();
          }}
          className="mt-6 w-full text-center px-6 py-3 rounded-xl bg-gradient-to-r from-magenta-500 to-cyan-500 text-black font-bold shadow-lg transform transition duration-300 hover:scale-[1.02]"
        >
          Login
        </button>
      </div>
    </div>
  );
};

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isLoggedIn = false; // Replace with redux state if needed
  const navigate = useNavigate();
  const handleAuthAction = () => {
    navigate("/login");
  };

  return (
    <header className="w-full z-40 relative">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between glass-dark border-b border-gray-800/60 rounded-none md:rounded-2xl md:mt-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="IITGnGPT"
            className="h-10 w-10 object-contain neon-shadow-sm"
          />
          <div>
            <div className="text-white font-extrabold tracking-widest text-lg">
              IITGnGPT
            </div>
            <div className="text-xs text-cyan-400 -mt-1 font-mono tracking-wider">
              AI Detection
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <NavLink href="/">Home</NavLink>
          <NavLink href="#">About</NavLink>
          <NavLink href="#">Terms</NavLink>

          <button
            onClick={handleAuthAction}
            className="ml-4 px-6 py-2 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#00FFFF] text-black font-bold shadow-neon-sm transform transition duration-300 hover:scale-105 hover:shadow-neon focus:outline-none"
          >
            {isLoggedIn ? "Logout" : "Login"}
          </button>
        </div>

        <button
          className="md:hidden text-white p-2"
          onClick={() => setIsMenuOpen(true)}
        >
          <MenuIcon className="h-7 w-7" />
        </button>
      </nav>
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </header>
  );
};

// ---------------- Hero ----------------
const Hero: React.FC = () => {
  const isMobile = useMediaQuery("(max-width:640px)"); // Tailwind's 'sm' breakpoint

  const loginButtonText = isMobile ? (
    <>
      View Mobile Site
      <ArrowForwardIcon className="opacity-90" />
    </>
  ) : (
    <>
      Login to Dashboard
      <ArrowForwardIcon className="opacity-90" />
    </>
  );

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32 flex flex-col lg:flex-row items-center gap-10">
      <div className="flex-1 text-center lg:text-left">
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight text-white">
          <span className="text-[#00FFFF] drop-shadow-neon-cyan">
            AI Detection
          </span>{" "}
          for Academia &{" "}
          <span className="text-[#FF00FF] drop-shadow-neon-magenta">
            Research
          </span>
        </h1>
        <p className="mt-6 text-gray-300 max-w-xl text-lg opacity-85">
          Protect academic integrity with fast, research-optimized detection.
          Run precise checks tuned for thesis, journals, and academic writing —
          **privacy-first**, premium-grade confidence scores.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            to={isMobile ? "#" : "/login"} // Keep it as a link or change to button/anchor if no route exists
            className={`inline-flex items-center gap-3 px-8 py-3 rounded-full font-extrabold shadow-lg transform transition hover:scale-105 ${
              isMobile
                ? "bg-gray-700 text-gray-300 cursor-not-allowed opacity-80"
                : "bg-gradient-to-r from-[#FF00FF] to-[#00FFFF] text-black"
            }`}
          >
            {loginButtonText}
          </Link>
          <a
            href="#features"
            className="text-sm text-gray-200/80 px-4 py-2 rounded-md border border-[#00FFFF]/30 hover:bg-[#00FFFF]/10 transition font-medium tracking-wide"
          >
            Learn more
          </a>
        </div>
      </div>

      <div className="flex-1 flex justify-center lg:justify-end mt-10 lg:mt-0">
        <img
          src={brain}
          alt="AI Detection Illustration"
          className="max-w-full lg:max-w-lg drop-shadow-neon-lg animate-pulse-slow"
        />
      </div>
    </section>
  );
};

// ---------------- FeatureCard ----------------
interface FeatureCardProps {
  title: string;
  desc: string;
  Icon: any;
}
const FeatureCard: React.FC<FeatureCardProps> = ({ title, desc, Icon }) => (
  <div className="p-6 glass-dark border border-[#00FFFF]/20 rounded-xl backdrop-blur-md hover:scale-[1.02] transform transition shadow-xl shadow-black/50 hover:border-[#FF00FF]/40 cursor-pointer">
    <div className="flex items-start gap-4">
      <div className="p-3 rounded-lg bg-gradient-to-br from-[#00FFFF]/30 to-[#FF00FF]/10 neon-shadow-sm-cyan">
        {Icon}
      </div>
      <div>
        <div className="font-semibold text-white text-lg tracking-wide">
          {title}
        </div>
        <div className="text-sm text-gray-300/80 mt-1">{desc}</div>
      </div>
    </div>
  </div>
);

// ---------------- Features ----------------
const Features: React.FC = () => (
  <section id="features" className="max-w-7xl mx-auto px-6 py-20">
    <div className="text-center">
      <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
        Built for <span className="text-[#00FFFF]">researchers</span>, educators
        and institutions
      </h3>
      <p className="mt-3 text-gray-300 max-w-2xl mx-auto text-lg opacity-85">
        A focused toolset: accurate detection, interpretable scores, and
        academic workflows.
      </p>
    </div>

    <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
      <FeatureCard
        title="Research-Optimized"
        desc="Scoring tuned for complex academic prose and citation analysis."
        Icon={<SchoolIcon className="h-6 w-6 text-[#00FFFF]" />}
      />
      <FeatureCard
        title="Privacy First"
        desc="No content stored by default; deployable on-premises for ultimate control."
        Icon={<PrivacyTipIcon className="h-6 w-6 text-[#00FFFF]" />}
      />
      <FeatureCard
        title="API & Integrations"
        desc="Seamless integration with LMS, Turnitin-style workflows, and CSV export."
        Icon={
          <IntegrationInstructionsIcon className="h-6 w-6 text-[#00FFFF]" />
        }
      />
    </div>
  </section>
);

// ---------------- TrustedBy ----------------
const TrustedBy: React.FC = () => (
  <section className="max-w-7xl mx-auto px-6 py-12">
    <div className="glass-dark border border-gray-800/80 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-black/50">
      <div>
        <div className="text-xs text-gray-300 tracking-wider font-mono">
          TRUSTED BY
        </div>
        <div className="mt-2 text-white font-bold text-xl tracking-tight">
          Universities • Research Labs • Journals
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 opacity-90">
        {["IITGN", "ResearchLab", "Journal"].map((name) => (
          <div
            key={name}
            className="h-10 w-28 bg-white/5 rounded-md flex items-center justify-center font-bold text-white tracking-wider transition transform hover:scale-105 hover:bg-white/10 border border-[#FF00FF]/20 shadow-inner shadow-black/30"
          >
            {name}
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ---------------- Footer ----------------
const Footer: React.FC = () => (
  <footer className="mt-12 border-t border-gray-800/70">
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
      <div className="text-center md:text-left">
        © {new Date().getFullYear()} IITGnGPT — All rights reserved.
      </div>
      <div className="flex items-center gap-6 mt-3 md:mt-0">
        <a
          href="#"
          className="hover:text-[#00FFFF] transition font-mono tracking-wider"
        >
          Privacy
        </a>
        <a
          href="#"
          className="hover:text-[#00FFFF] transition font-mono tracking-wider"
        >
          Terms
        </a>
        <a
          href="#"
          className="hover:text-[#00FFFF] transition font-mono tracking-wider"
        >
          Contact
        </a>
      </div>
    </div>
  </footer>
);

// ---------------- Home Page ----------------
const Home: React.FC = () => (
  <div className="relative min-h-screen text-gray-200 overflow-x-hidden">
    {/* Background - Deep Space/Cyberpunk */}
    <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_#0A1433_0%,_#000000_80%)] z-0 pointer-events-none">
      <GlowBlob />
      <div className="absolute inset-0 bg-[linear-gradient(transparent,rgba(255,255,255,0.01))]" />
    </div>

    {/* Content */}
    <div className="relative z-20">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <TrustedBy />
      </main>
      <Footer />
    </div>

    {/* Global Styles and Animations */}
    <style>{`
      /* Custom utility classes not natively in Tailwind for the theme */
      .glass-dark {
        background-color: rgba(10, 20, 51, 0.3); /* Darker, less opaque background */
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .neon-shadow-sm {
        filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.6));
      }
      .neon-shadow-sm-cyan {
        box-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
      }
      .drop-shadow-neon-cyan {
        filter: drop-shadow(0 0 6px #00FFFF) drop-shadow(0 0 12px rgba(0, 255, 255, 0.3));
      }
      .drop-shadow-neon-magenta {
        filter: drop-shadow(0 0 6px #FF00FF) drop-shadow(0 0 12px rgba(255, 0, 255, 0.3));
      }
      .drop-shadow-neon-lg {
        filter: drop-shadow(0 0 10px #00FFFF) drop-shadow(0 0 20px #FF00FF);
      }
      .shadow-neon-sm {
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
      }
      .shadow-neon {
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.6), 0 0 20px rgba(255, 0, 255, 0.4);
      }
      @keyframes blob {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(-20px, 20px) scale(1.1); }
        66% { transform: translate(20px, -15px) scale(0.9); }
      }
      .animate-blob { animation: blob 10s infinite cubic-bezier(0.645, 0.045, 0.355, 1); }

      @keyframes pulse-slow {
        0%, 100% { opacity: 0.95; }
        50% { opacity: 1; }
      }
      .animate-pulse-slow { animation: pulse-slow 6s infinite; }
      .animation-delay-2000 { animation-delay: 2s; }
    `}</style>
  </div>
);

export default Home;
