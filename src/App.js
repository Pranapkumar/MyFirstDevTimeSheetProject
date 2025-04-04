// src/App.js
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Updated imports for v6
import LoginPage from './LoginPage';
import TimesheetPage from './TimesheetPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes> {/* Replaced Switch */}
          <Route path="/" element={<LoginPage />} /> {/* Updated syntax */}
          <Route path="/timesheet" element={<TimesheetPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;