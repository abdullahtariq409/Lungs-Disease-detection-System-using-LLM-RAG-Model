import React from 'react';
import hero from '../assets/hero.png'; // Placeholder image, replace with actual image path

const Hero = () => {
    return (
      <>
      <div className='grid grid-cols-2 h-screen'>
        <div className='flex flex-col items-center justify-center bg-gray-50'>
          <h1 className='text-5xl font-bold text-blue-600 mb-4 text-center'>Your Health Is Our Top Priority</h1>
          <p className='text-lg text-blue-600 mb-8 text-center'>Securely share your comprehensive medical history with doctors and loved ones, for better communication and care.</p>
          <button className='px-7 py-2 text-white border border-transparent rounded-full outline-none bg-red-600 text-sm font-medium font-sans ease-in-out hover:font-extrabold hover:bg-red-500 hover:border-red-500'>Get Started</button>
        </div>
        <div className='flex items-center justify-center bg-gray-50'>
          <img src={hero} alt="Placeholder" className='w-auto' />
        </div>
      </div>

   <div className='grid grid-rows-1 grid-flow-col gap-4 pb-3 bg-gray-50'>
        <div className='flex items-center justify-center rounded-3xl bg-white shadow-2xl text-blue-600 font-bold p-4 text-xl'>
            <p>
                200k+ Users
            </p>
        </div>
        <div className='flex items-center justify-center rounded-3xl bg-white shadow-2xl text-blue-600 font-bold p-4 text-xl'>
            <p>
                100+ Doctors
            </p>
            </div>
        <div className='flex items-center justify-center rounded-3xl bg-white shadow-2xl text-blue-600 font-bold p-4 text-xl'>
            <p>
                50+ Hospitals
            </p>
            </div>
            <div className='flex items-center justify-center rounded-3xl bg-white shadow-2xl text-blue-600 font-bold p-4 text-xl'>
            <p>
            24/7 Support
        </p>
            </div>
            <div className='flex items-center justify-center rounded-3xl bg-white shadow-2xl text-blue-600 font-bold p-4 text-xl'>
            <p>
                Ai-Based Service
            </p>
            </div>

      </div>

      <div className='grid grid-cols-1 items-center pt-12 bg-gray-50 pb-12'>
        <h2 className='text-3xl font-bold text-blue-600 mb-4 text-center '>What we are?</h2>
        <p className='text-lg text-blue-600 text-center pl-16 pr-16'>We are a digital health platform that allows users to securely share their comprehensive medical history with doctors and loved ones, enabling better communication and care.<br/>
        Our platform is designed to empower patients by giving them control over their health information, making it easier for them to access and share their medical records with healthcare providers. We aim to improve the quality of care and enhance the patient experience through our innovative technology.</p>
      </div>
      <div className='grid grid-cols-1 items-center pt-12 pb-12 bg-gray-50 shadow-2xl'>
        <h2 className='text-3xl font-bold text-blue-600 mb-4 text-center '>What other users say</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 px-6'>
          <div className='bg-blue-200 shadow-lg rounded-lg p-6 hover:animate-pulse'>
            <p className='text-lg text-blue-600 font-semibold'>"This platform has revolutionized the way I manage my health records. It's so easy to use!"</p>
            <p className='text-sm text-black mt-4'>- Sarah J.</p>
          </div>
          <div className='bg-blue-200 shadow-lg rounded-lg p-6 hover:animate-pulse'>
            <p className='text-lg text-blue-600 font-semibold'>"I can now share my medical history with my doctor instantly. Highly recommended!"</p>
            <p className='text-sm text-black mt-4'>- John D.</p>
          </div>
          <div className='bg-blue-200 shadow-lg rounded-lg p-6 hover:animate-pulse'>
            <p className='text-lg text-blue-600 font-semibold'>"The AI-based service is a game-changer. It provides insights that I never thought were possible."</p>
            <p className='text-sm text-black mt-4'>- Emily R.</p>
          </div>
          
        </div>
      </div>
      </>
    );
};

export default Hero;