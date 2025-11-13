import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Header = () => {
      const navigate = useNavigate();

  // Function to handle navigation
  const handlelogin = () => {
    navigate('/login');
  }
  const handlesignup =()=>{
    navigate('/signup')
  }
    return (
      <>
  <div className='flex justify-between items-center bg-linear-to-r from-cyan-200 to-blue-400 p-2'>
   
      <img src={logo} alt="Logo" className='h-16 w-16' />
      <div className='flex space-x-4'>
    <button className='px-7 py-1 text-white border border-transparent rounded-full outline-none bg-red-600 text-sm font-medium font-sans  ease-in-out hover:font-extrabold hover:bg-red-500 hover:border-red-500' onClick={handlelogin} >Login</button>
    <button className='px-7 py-1 text-white border border-transparent rounded-full outline-none bg-red-600 text-sm font-medium font-sans  ease-in-out hover:text-blue-200 hover:bg-red-500 hover:border-red-500' onClick={handlesignup}>Sign Up</button>
    </div>

  </div>

      </>
    );
};

export default Header;