import React from 'react';
import { FaHome, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Navbar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="flex justify-center space-x-8">
      <button
        className={`flex items-center gap-2 px-6 py-3 font-semibold border rounded-xl transition duration-300 shadow-md ${
          activeTab === 'Home'
            ? 'text-blue-700 border-blue-600 bg-blue-100 hover:bg-blue-600 hover:text-white'
            : 'text-gray-500 border-gray-300'
        }`}
        onClick={() => {
          setActiveTab('Home');
          navigate('/dashboard');
        }}
      >
        <FaHome className="text-lg" />
        Home
      </button>
      <button
        className="flex items-center gap-2 px-6 py-3 text-red-600 font-semibold border border-red-600 rounded-xl bg-white hover:bg-red-600 hover:text-white transition duration-300 shadow-md hover:shadow-lg"
        onClick={handleLogout}
      >
        <FaSignOutAlt className="text-lg" />
        Logout
      </button>
    </div>
  );
};

export default Navbar;
