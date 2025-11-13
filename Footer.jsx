import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 py-8">
      <div className="container mx-auto flex flex-wrap justify-between">
        <div className="w-full sm:w-1/4 mb-6 sm:mb-0">
          <h4 className="text-lg font-semibold text-blue-600 mb-4">About Us</h4>
          <p>We provide the best medical services to ensure your health and well-being.</p>
        </div>
        <div className="w-full sm:w-1/4 mb-6 sm:mb-0">
          <h4 className="text-lg font-semibold text-blue-600 mb-4">Quick Links</h4>
          <ul>
            <li className="mb-2"><a href="/home" className="hover:text-blue-600">Home</a></li>
            <li className="mb-2"><a href="/services" className="hover:text-blue-600">Services</a></li>
            <li className="mb-2"><a href="/contact" className="hover:text-blue-600">Contact</a></li>
            <li className="mb-2"><a href="/about" className="hover:text-blue-600">About</a></li>
          </ul>
        </div>
        <div className="w-full sm:w-1/4 mb-6 sm:mb-0">
          <h4 className="text-lg font-semibold text-blue-600 mb-4">Contact Us</h4>
          <p>Email: info@medical.com</p>
          <p>Phone: +123 456 7890</p>
          <p>Address: 123 Medical Street, Health City</p>
        </div>
        <div className="w-full sm:w-1/4">
          <h4 className="text-lg font-semibold text-blue-600 mb-4">Follow Us</h4>
          <div className="flex space-x-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-yellow-400 flex items-center">
              <FaFacebook className="mr-2" /> Facebook
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-yellow-400 flex items-center">
              <FaTwitter className="mr-2" /> Twitter
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-yellow-400 flex items-center">
              <FaInstagram className="mr-2" /> Instagram
            </a>
          </div>
        </div>
      </div>
      <div className="text-center text-sm text-gray-500 mt-8">
        &copy; 2023 Medical. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
