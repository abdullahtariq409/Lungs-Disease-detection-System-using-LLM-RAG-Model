import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import log from './../assets/log-sign.png';
import { getAuth, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import app, { auth, googleProvider } from '../firebase';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleback = () => {
    navigate('/');
  };
  const handlesignup = () => {
    navigate('/signup');
  };

  const handlelogin = async (e) => {
    e.preventDefault();
    setError('');
    const authInstance = getAuth(app);
    try {
      const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
      const userUid = userCredential.user.uid;
      if (userUid === "nuDjkv2OFDgYKYiKqMugsIo1YrO2") {
        navigate('/admin');
      } else {
        navigate('/Dashboard');
      }
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  const handleGoogleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userUid = result.user.uid;
      if (userUid === "nuDjkv2OFDgYKYiKqMugsIo1YrO2") {
        navigate('/admin');
      } else {
        navigate('/Dashboard');
      }
    } catch (err) {
      setError('Google sign-in failed');
    }
  };

  return (
    <>
      <div className='bg-blue-700 w-full'>
        <a
          onClick={handleback}
          className="absolute top-4 left-4 text-white bg-red-600 p-2 rounded-3xl font-bold hover:underline cursor-pointer"
        >
          &larr; Back
        </a>
      </div>
      <div className='grid grid-cols-2 bg-cyan-50 pt-6'>
        <img className="w-4/5  object-cover" src={log} alt="Background" />
        <div className='pt-28'>
          <div
            className="relative  overflow-hidden w-[30rem] h-96 mx-auto rounded shadow flex flex-col justify-between p-6 after:absolute after:w-24 after:h-24 after:bg-sky-300 after:-z-10 after:rounded-full after:-top-4 after:-right-4 after:blur-xl border after:[box-shadow:-150px_50px_10px_100px_#7dd3fc]"
            id="login"
          >
            {/* Replace the Google login button */}
            <a
              className="border border-sky-500 bg-sky-50 hover:bg-sky-100 rounded text-sky-500 p-2 font-bold flex flex-row gap-3 justify-center"
              href="#"
              onClick={handleGoogleLogin}
            >
              <span>Log in with</span>
              <img
                src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                alt="Google Icon"
                className="w-6 h-6"
              />
            </a>
            <span className="text-center text-sm font-bold text-black ">or</span>
            <form method="post" action="" className="text-gray-700" onSubmit={handlelogin}>
              <label htmlFor="email" className="text-xs font-bold after:content-['*']">
                Mail
              </label>
              <input
                required
                type="email"
                className="w-full p-2 mb-2 border-2 border-black mt-1 outline-none ring-none focus:ring-2 focus:ring-sky-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <label htmlFor="password" className="text-xs font-bold after:content-['*']">
                Password
              </label>
              <input
                required
                type="password"
                className="w-full p-2 mb-2 border-2 border-black mt-1 outline-none ring-none focus:ring-2 focus:ring-sky-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <a className="block text-right text-xs underline text-black font-bold mb-4" onClick={handlesignup}>
                Signup ...
              </a>
              {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
              <button type="submit" className="w-full rounded bg-sky-500 text-sky-50 p-2 text-center font-bold hover:bg-sky-400">
                Log In
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
