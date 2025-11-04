import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import { createTheme } from "@mui/material/styles";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { AppProvider } from "@toolpad/core/AppProvider";
import {
  DashboardLayout,
  type SidebarFooterProps,
} from "@toolpad/core/DashboardLayout";
import {
  Account,
  AccountPreview,
  AccountPopoverFooter,
  SignOutButton,
  type AccountPreviewProps,
} from "@toolpad/core/Account";
import type { Navigation, Router, Session } from "@toolpad/core/AppProvider";
import { DemoProvider } from "@toolpad/core/internal";
import logo from "../assets/logo-white.png";
import userPfp from "../assets/iitgn-logo.png";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../Store";
import { logout } from "../Store/Login";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import backdrop from "../assets/IITGN-evening.jpg";
import DashboardPage from "../Components/Dashboard";
import Project from "../Components/AddProject";
import AddToQueueIcon from "@mui/icons-material/AddToQueue";
import QuickDetection from "../Components/Quick";
import { useNavigate } from "react-router-dom";
import TimelapseIcon from "@mui/icons-material/Timelapse";
import AdvancedRun from "../Components/Advanced";

// ---- Navigation ----
const NAVIGATION: Navigation = [
  { kind: "header", title: "Main items" },
  { segment: "dashboard", title: "Dashboard", icon: <DashboardIcon /> },
  { segment: "project", title: "New Project", icon: <AddToQueueIcon /> },
  { segment: "quick", title: "Quick File Check", icon: <RocketLaunchIcon /> },
  { segment: "advanced", title: "Advanced Scan", icon: <TimelapseIcon /> },
];

// ---- Theme ----
const demoTheme = createTheme({
  cssVariables: { colorSchemeSelector: "data-toolpad-color-scheme" },
  colorSchemes: { light: true, dark: true },
  breakpoints: { values: { xs: 0, sm: 600, md: 600, lg: 1200, xl: 1536 } },
});

// ---- Mock Data ----
const user = {
  name: "John Doe",
  rollNo: "123456",
  email: "john@iitgn.ac.in",
  image: "https://avatars.githubusercontent.com/u/19550456",
};

// ---- Toolbar ----
function CustomToolbarActions() {
  return <Stack direction="row" alignItems="center" spacing={2}></Stack>;
}

// ---- Sidebar Footer ----
function AccountSidebarPreview(props: AccountPreviewProps & { mini: boolean }) {
  const { handleClick, open, mini } = props;
  return (
    <Stack direction="column" p={0}>
      <Divider />
      <AccountPreview
        variant={mini ? "condensed" : "expanded"}
        handleClick={handleClick}
        open={open}
      />
    </Stack>
  );
}

function SidebarFooterAccountPopover() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  return (
    <Stack direction="column">
      <AccountPopoverFooter>
        <SignOutButton
          onClick={() => {
            dispatch(logout());
            navigate("/login");
          }}
        />
      </AccountPopoverFooter>
    </Stack>
  );
}

const createPreviewComponent = (mini: boolean) => {
  return function PreviewComponent(props: AccountPreviewProps) {
    return <AccountSidebarPreview {...props} mini={mini} />;
  };
};

function SidebarFooterAccount({ mini }: SidebarFooterProps) {
  const PreviewComponent = React.useMemo(
    () => createPreviewComponent(mini),
    [mini]
  );
  return (
    <Account
      slots={{
        preview: PreviewComponent,
        popoverContent: SidebarFooterAccountPopover,
      }}
    />
  );
}

// ---- Dashboard Layout ----
export default function Dashboard() {
  // const loggedIn = useSelector((state: RootState) => state.login.isLoggedIn);
  const loggedIn = true; // TODO:--- IGNORE ---
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const name = useSelector((state: RootState) => state.user.name);
  const email = useSelector((state: RootState) => state.user.email);

  const [pathname, setPathname] = React.useState("/dashboard");
  const router = React.useMemo<Router>(
    () => ({
      pathname,
      searchParams: new URLSearchParams(),
      navigate: (path) => setPathname(String(path)),
    }),
    [pathname]
  );

  React.useEffect(() => {
    if (!loggedIn) {
      navigate("/");
    }
  }, [loggedIn, navigate]);

  const [session, setSession] = React.useState<Session | null>({
    user: { name, email, image: userPfp },
  });
  const authentication = React.useMemo(
    () => ({
      signIn: () =>
        setSession({
          user: { name, email, image: userPfp },
        }),
      signOut: () => dispatch(logout()),
    }),
    []
  );

  return (
    <DemoProvider>
      <AppProvider
        navigation={NAVIGATION}
        router={router}
        theme={demoTheme}
        authentication={authentication}
        session={session}
        branding={{
          logo: <img src={logo} className="w-10 h-10" />,
          title: "IIT Gandhinagar",
        }}
      >
        {/* BACKDROP */}
        <Box
          sx={{
            minHeight: "100vh",
            backgroundImage: `url("${backdrop}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
          }}
        >
          {/* Overlay */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(8px)",
              zIndex: 0,
            }}
          />

          <Box sx={{ position: "relative", zIndex: 1 }}>
            <DashboardLayout
              sx={{
                "& .MuiDrawer-paper": {
                  bgcolor: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(12px)",
                },
                "& .MuiAppBar-root": {
                  bgcolor: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(12px)",
                },
              }}
              slots={{
                toolbarActions: CustomToolbarActions,
                sidebarFooter: SidebarFooterAccount,
              }}
            >
              {/* ✅ Page Switcher */}
              {pathname === "/dashboard" && <DashboardPage />}
              {pathname === "/project" && <Project />}
              {pathname === "/quick" && <QuickDetection />}
              {pathname === "/advanced" && <AdvancedRun />}
            </DashboardLayout>
          </Box>
        </Box>
      </AppProvider>
    </DemoProvider>
  );
}
