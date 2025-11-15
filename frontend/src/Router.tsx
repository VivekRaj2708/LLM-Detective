import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import NotFoundPage from "./Pages/404";
import { loadUserFromCookie } from "./Store/Login";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "./Store";
import { useEffect } from "react";


function Router() {
  const dispatch = useDispatch<AppDispatch>();
  dispatch(loadUserFromCookie());

  useEffect(() => {}, [dispatch]);
  
  return (
    <HashRouter>
      <Routes>
        <Route index element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  );
}

export default Router;

