import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdminDashboard from './AdminDashboard';
import UserInterface from './UserInterface';

function App() {
  return (
    <Router>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/" element={<UserInterface />} />
        </Routes>
      </motion.div>
    </Router>
  );
}

export default App;