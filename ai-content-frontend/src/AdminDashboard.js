import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus, FaDownload, FaSpinner } from 'react-icons/fa';
import { motion } from 'framer-motion';

function AdminDashboard() {
  const [url, setUrl] = useState('');
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGenerations();
  }, []);

  const fetchGenerations = async () => {
    const res = await axios.get('https://ai-content-prototype.vercel.app/generations');
    setGenerations(res.data);
  };

  const generate = async (type) => {
    if (!url) return toast.error('Enter a URL');
    setLoading(true);
    try {
      await axios.post('https://ai-content-prototype.vercel.app/generate', { url, type });
      toast.success('Generation complete');
      fetchGenerations();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error generating');
    }
    setLoading(false);
  };

  const exportToCSV = (gen) => {
    const csv = ['Cabang,Facebook Post,Tweet'];
    gen.pairs.forEach(p => csv.push(`${p.cabang},"${p.facebookPost.replace(/"/g, '""')}","${p.tweet.replace(/"/g, '""')}"`));
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `generation_${gen.id}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-green-50">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">Admin Dashboard</h1>
        <div className="card mb-6">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Enter news article URL"
            className="border p-3 w-full mb-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <div className="flex justify-center gap-4">
            <button onClick={() => generate('PRO')} disabled={loading} className="btn btn-pro flex items-center gap-2">
              <FaPlus /> PRO
            </button>
            <button onClick={() => generate('ANTI')} disabled={loading} className="btn btn-anti flex items-center gap-2">
              <FaPlus /> ANTI
            </button>
          </div>
          {loading && <div className="text-center mt-4"><FaSpinner className="animate-spin text-2xl text-blue-500" /></div>}
        </div>
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">Archived Generations</h2>
        <div className="grid gap-4">
          {generations.map(gen => (
            <motion.div key={gen.id} className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <p className="text-lg font-medium">{gen.timestampGenerated.toDate().toLocaleString()} - {gen.articleUrl} ({gen.type})</p>
              <p className="text-sm text-gray-600">Views: {gen.views.length}</p>
              <button onClick={() => exportToCSV(gen)} className="btn btn-copy mt-2 flex items-center gap-2">
                <FaDownload /> Export to CSV
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}

export default AdminDashboard;
