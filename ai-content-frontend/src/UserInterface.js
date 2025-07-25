import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSearch, FaCopy } from 'react-icons/fa';
import { motion } from 'framer-motion';

function UserInterface() {
  const [cabang, setCabang] = useState('');
  const [generations, setGenerations] = useState([]);
  const [selectedGen, setSelectedGen] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitted(true);
    try {
      const res = await axios.get(`https://your-backend-url.vercel.app/generations/${cabang}`);
      if (res.data.error) return toast.error(res.data.error);
      setGenerations(res.data);
      setSelectedGen(res.data[0]);
      await axios.post('https://your-backend-url.vercel.app/view', { generationId: res.data[0].id, cabang });
    } catch (error) {
      toast.error('Error fetching content');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!', { icon: <FaCopy /> });
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-green-50 to-blue-50">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-800">User Content Viewer</h1>
        <div className="card mb-6">
          <input
            type="text"
            value={cabang}
            onChange={e => setCabang(e.target.value.toUpperCase())}
            placeholder="Enter your Cabang name (e.g., CABANG – KEPONG)"
            className="border p-3 w-full mb-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300"
          />
          <button onClick={handleSubmit} className="btn btn-copy w-full flex justify-center items-center gap-2">
            <FaSearch /> Submit
          </button>
        </div>
        {submitted && generations.length === 0 && <p className="text-center text-red-500">No content available—contact admin.</p>}
        {generations.length > 0 && (
          <>
            <select
              onChange={e => setSelectedGen(generations.find(g => g.id === e.target.value))}
              className="border p-3 w-full mb-6 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {generations.map(gen => (
                <option key={gen.id} value={gen.id}>
                  {gen.timestamp.toLocaleString()} - {gen.articleUrl.slice(0, 30)}... ({gen.type})
                </option>
              ))}
            </select>
            {selectedGen && (
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <h2 className="text-xl font-semibold mb-2 text-blue-700">Facebook Post</h2>
                  <p className="whitespace-pre-wrap text-gray-700">{selectedGen.pair.facebookPost}</p>
                  <button onClick={() => copyToClipboard(selectedGen.pair.facebookPost)} className="btn btn-copy mt-4 flex items-center gap-2">
                    <FaCopy /> Copy Facebook
                  </button>
                </motion.div>
                <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <h2 className="text-xl font-semibold mb-2 text-blue-700">Tweet</h2>
                  <p className="whitespace-pre-wrap text-gray-700">{selectedGen.pair.tweet}</p>
                  <button onClick={() => copyToClipboard(selectedGen.pair.tweet)} className="btn btn-copy mt-4 flex items-center gap-2">
                    <FaCopy /> Copy Tweet
                  </button>
                </motion.div>
              </div>
            )}
          </>
        )}
      </motion.div>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}

export default UserInterface;