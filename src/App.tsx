import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/dashboard/Dashboard";
import Schedule from "@/pages/schedule/Schedule";
import Monitor from "@/pages/monitor/Monitor";
import Energy from "@/pages/energy/Energy";
import Maintenance from "@/pages/maintenance/Maintenance";
import Handover from "@/pages/handover/Handover";
import Environment from "@/pages/environment/Environment";
import Ledger from "@/pages/ledger/Ledger";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/energy" element={<Energy />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/handover" element={<Handover />} />
          <Route path="/environment" element={<Environment />} />
          <Route path="/ledger" element={<Ledger />} />
        </Route>
      </Routes>
    </Router>
  );
}
