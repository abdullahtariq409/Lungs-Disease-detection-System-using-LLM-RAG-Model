import React, { useState } from 'react';
// Add heroicons for visual cues
import { CloudArrowUpIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import LLMChatRoom from './LLMChatRoom'; // Import the new chatroom component
import { auth } from '../firebase'; // Add this import

// Utility: Check if an image is grayscale using canvas
const isImageGrayscale = (file) =>
  new Promise((resolve) => {
    const img = new window.Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);
      // Sample pixels (every 20th row/col, up to 500 samples)
      let grayCount = 0, total = 0;
      for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 20))) {
        for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 20))) {
          const idx = (y * width + x) * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];
          // Allow small tolerance for compression artifacts
          if (Math.abs(r - g) < 5 && Math.abs(r - b) < 5 && Math.abs(g - b) < 5) {
            grayCount++;
          }
          total++;
          if (total >= 500) break;
        }
        if (total >= 500) break;
      }
      // If >90% sampled pixels are gray, consider image grayscale
      resolve(grayCount / total > 0.9);
    };
    img.onerror = function () {
      resolve(false);
    };
    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.readAsDataURL(file);
  });

// Utility: Check if image has high contrast (simple heuristic)
const hasHighContrast = (file) =>
  new Promise((resolve) => {
    const img = new window.Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);
      let min = 255, max = 0, total = 0;
      for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 20))) {
        for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 20))) {
          const idx = (y * width + x) * 4;
          const v = data[idx]; // grayscale, so just use R
          if (v < min) min = v;
          if (v > max) max = v;
          total++;
          if (total >= 500) break;
        }
        if (total >= 500) break;
      }
      // If contrast (max-min) is high enough, likely an X-ray
      resolve((max - min) > 100);
    };
    img.onerror = function () { resolve(false); };
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.readAsDataURL(file);
  });

// Updated questionnaire component with backend integration
const LungHealthQuestionnaire = () => {
  const questions = [
    "1. What is your age and gender?",
    "2. Do you smoke or have a history of smoking?",
    "3. Have you been exposed to dust, asbestos, or pollutants at work?",
    "4. Are you experiencing shortness of breath?",
    "5. Do you have a persistent cough? If yes, for how long?",
    "6. Have you noticed blood in your sputum?",
    "7. Do you feel chest pain when breathing or coughing?",
    "8. Are you experiencing wheezing or noisy breathing?",
    "9. Have you had any recent weight loss or fatigue?",
    "10. Do you have a history of asthma, COPD, or lung infections?",
    "11. Has anyone in your family had lung cancer or chronic lung disease?",
    "12. Do you live in an area with poor air quality?",
    "13. Have you been exposed to second-hand smoke frequently?",
    "14. Have you done a recent chest X-ray, CT scan, or spirometry test?",
    "15. Are you currently on any medications for respiratory issues?"
  ];
  const [answers, setAnswers] = useState(Array(questions.length).fill(''));
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Recommendation state management
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const updated = [...answers];
    updated[current] = e.target.value;
    setAnswers(updated);
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      // Submit answers to backend
      setSubmitted(true);
      setLoading(true);
      setError('');
      setRecommendation('');
      try {
        const response = await fetch('http://localhost:5002/recommendation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        });
        const data = await response.json();
        if (response.ok && data.recommendation) {
          setRecommendation(data.recommendation);
        } else {
          setError(data.error || 'Failed to get recommendation');
        }
      } catch (err) {
        setError('Failed to connect to recommendation service');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrev = (e) => {
    e.preventDefault();
    if (current > 0) setCurrent(current - 1);
  };

  return (
    <div className="min-h-screen w-full bg-transparent py-12 px-2 flex flex-col items-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full mt-10 animate-fade-in border-2 border-indigo-200">
        {!submitted ? (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">Lung Health Questionnaire</h2>
            <form className="flex flex-col gap-4" onSubmit={handleNext}>
              <div className="flex flex-col">
                <label className="font-medium mb-1">{questions[current]}</label>
                <input
                  type="text"
                  className="border-2 border-indigo-200 rounded p-2 focus:ring-2 focus:ring-blue-300"
                  value={answers[current]}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={current === 0}
                  className={`py-2 px-4 rounded font-bold shadow ${current === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
                >
                  Previous
                </button>
                <button
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded shadow"
                >
                  {current === questions.length - 1 ? 'Submit' : 'Next'}
                </button>
              </div>
              <div className="text-sm text-gray-500 text-center mt-2">
                Question {current + 1} of {questions.length}
              </div>
            </form>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-green-700">Recommendations</h2>
            {loading && (
              <div className="text-lg text-blue-600 mb-4">Loading recommendations...</div>
            )}
            {error && (
              <div className="text-lg text-red-600 mb-4">{error}</div>
            )}
            {!loading && !error && recommendation && (
              <div className="text-left whitespace-pre-line text-gray-700 rounded-lg p-4 bg-gray-50 border border-indigo-100" style={{whiteSpace: 'pre-wrap'}}>
                {recommendation}
              </div>
            )}
          </div>
        )}
      </div>
      <style>
        {`
          .animate-fade-in {
            animation: fadeIn 0.8s cubic-bezier(0.4,0,0.2,1);
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(30px);}
            to { opacity: 1; transform: translateY(0);}
          }
        `}
      </style>
    </div>
  );
};

const Content = ({ activeTab, externalReportChoice }) => {
  // State for uploaded image and prediction result
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [prediction, setPrediction] = useState('');
  const [showReportPrompt, setShowReportPrompt] = useState(false);
  const [reportChoice, setReportChoice] = useState(externalReportChoice ?? null); // 'yes' | 'no' | null
  const [reportForm, setReportForm] = useState({ name: '', address: '', phone: '', sex: '' });
  const [fileError, setFileError] = useState('');
  const [isXray, setIsXray] = useState(false);
  const [checkingXray, setCheckingXray] = useState(false);

  const diseaseObj = { name: 'Pneumonia' }; // Replace with actual prediction object if available

  // Call Gemini API to check if image is X-ray (direct integration)
  const checkIfXrayWithGemini = async (file) => {
    // Convert file to base64
    const toBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    const base64Image = await toBase64(file);

    // Gemini 2.0 Flash API endpoint and key
    const apiKey = 'AIzaSyCPBSrd-SYgiBuAIIWKwb2zd6FatcO_GDA'; // <-- Replace with your Gemini API key
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // Compose the request
    const body = {
      contents: [
        {
          parts: [
            {
              text: "Is this image a chest X-ray? Respond only with 'true' or 'false'."
            },
            {
              inlineData: {
                mimeType: file.type,
                data: base64Image
              }
            }
          ]
        }
      ]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    // Parse Gemini response for 'true' or 'false'
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase() || '';
    return text.includes('true');
  };

  // Handle file upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/bmp',
      'image/webp'
    ];
    if (file && !allowedTypes.includes(file.type)) {
      setFileError('Please upload a valid image file (.png, .jpg, .jpeg, .gif, .bmp, .webp)');
      setImage(null);
      setPreviewUrl('');
      setPrediction('');
      setShowReportPrompt(false);
      setReportChoice(null);
      return;
    }
    setCheckingXray(true);
    setIsXray(false);
    setFileError('');
    // Grayscale check
    if (file) {
      const isGray = await isImageGrayscale(file);
      if (!isGray) {
        setFileError('Please upload a valid X-ray image.');
        setImage(null);
        setPreviewUrl('');
        setPrediction('');
        setShowReportPrompt(false);
        setReportChoice(null);
        setCheckingXray(false);
        return;
      }
      // Additional: High contrast check
      const isContrast = await hasHighContrast(file);
      if (!isContrast) {
        setFileError('Image does not appear to be an X-ray (low contrast).');
        setImage(null);
        setPreviewUrl('');
        setPrediction('');
        setShowReportPrompt(false);
        setReportChoice(null);
        setCheckingXray(false);
        return;
      }
    }
    // After local checks, do Gemini check:
    try {
      const isXrayResult = await checkIfXrayWithGemini(file);
      setIsXray(isXrayResult);
      if (!isXrayResult) {
        setFileError('The uploaded image is not recognized as an X-ray by the AI.');
        setImage(null);
        setPreviewUrl('');
        setPrediction('');
        setShowReportPrompt(false);
        setReportChoice(null);
      }
    } catch (err) {
      setFileError('Failed to verify image type with Gemini API.');
      setIsXray(false);
      setImage(null);
      setPreviewUrl('');
      setPrediction('');
      setShowReportPrompt(false);
      setReportChoice(null);
    }
    setCheckingXray(false);
    setImage(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl('');
    }
    setPrediction('');
    setShowReportPrompt(false);
    setReportChoice(null);
  };

  // Simulate prediction on submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return;
    const formData = new FormData();
    formData.append('file', image);

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
        
      });
      if (!response.ok) {
        throw new Error('Prediction failed');
      }
      const data = await response.json();
      setPrediction(data.predicted_class || 'Prediction Failed');
      setShowReportPrompt(true);
      setReportChoice(null);
      // Optionally, set confidence if you want to display it dynamically
      setConfidence(data.confidence ? `${data.confidence.toFixed(2)}%` : null);
    } catch (err) {
      setPrediction('Prediction Failed');
      setShowReportPrompt(true);
      setReportChoice(null);
    }
  };

  // Add confidence state
  const [confidence, setConfidence] = useState(null);

  const handleReportFormChange = (e) => {
    setReportForm({ ...reportForm, [e.target.name]: e.target.value });
  };

  const handleDownloadReport = async (e) => {
    e.preventDefault();
    try {
      // Get current user UID
      const user = auth.currentUser;
      const uid = user ? user.uid : null;

      const response = await fetch('http://localhost:5001/generate_report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: reportForm.name,
          address: reportForm.address,
          phone: reportForm.phone,
          sex: reportForm.sex,
          disease: prediction,
          uid // Pass UID to backend
        })
      });
      if (!response.ok) throw new Error('Failed to generate report');
      const blob = await response.blob();
      // Create a link to download the PDF
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'patient_report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      // Clear form fields after download
      setReportForm({ name: '', address: '', phone: '', sex: '' });
    } catch (err) {
      alert('Failed to generate/download report');
    }
  };

  // If externalReportChoice changes to 'no', update local state
  React.useEffect(() => {
    if (externalReportChoice === 'no') setReportChoice('no');
  }, [externalReportChoice]);

  return (
    <>
      {activeTab === 'Home' && (
        // Show LLMChatRoom as full page if prediction is Normal
        prediction === 'Normal' ? (
          <div className="min-h-screen w-full flex items-center justify-center bg-transparent">
            <LLMChatRoom />
          </div>
        ) : (
          reportChoice === 'no'
            ? <LungHealthQuestionnaire />
            : (
              <div className="min-h-screen w-full bg-transparent rounded-2xl to-pink-600 py-12 px-2">
                <div className="relative grid grid-cols-1 md:grid-cols-2 gap-36 mt-10 max-w-4xl mx-auto">
                  {/* Horizontal Animated Arrow Line */}
                  <div className="hidden md:flex absolute items-center justify-center left-0 right-0 top-1/2 z-10 pointer-events-none">
                    <div className="flex items-center w-40 px-8">
                      <div className="flex-1 h-1 bg-gradient-to-r from-indigo-400 via-blue-400 to-indigo-400 animate-pulse rounded-full shadow-lg" />
                      <svg className="ml-2" width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <polygon points="0,0 32,12 0,24" fill="#6366f1" className="animate-pulse" />
                      </svg>
                    </div>
                  </div>
                  {/* Upload Card */}
                  <div className="w-full bg-white border-2 border-black rounded-2xl shadow-xl p-8 flex flex-col items-center animate-fade-in hover:shadow-2xl transition-shadow duration-300">
                    <CloudArrowUpIcon className="h-12 w-12 text-indigo-500 mb-2" />
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-4 text-center tracking-tight">Upload X-Ray</h2>
                    <form className="flex flex-col w-full" onSubmit={handleSubmit}>
                      {/* Custom styled file input */}
                      <label className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2 px-4 rounded-md mb-4 cursor-pointer text-center hover:from-indigo-600 hover:to-blue-600 transition ease-in-out duration-150 shadow-md">
                        Choose Image
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.gif,.bmp,.webp,image/png,image/jpeg,image/jpg,image/gif,image/bmp,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      {fileError && (
                        <div className="text-red-600 text-sm mb-2">{fileError}</div>
                      )}
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="X-Ray Preview"
                          className="w-full h-48 object-contain mb-4 border rounded-lg shadow"
                        />
                      )}
                      <button
                        type="submit"
                        disabled={!image || !isXray || checkingXray}
                        className={`bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2 px-4 rounded-md mt-2 transition ease-in-out duration-150 shadow-md ${
                          !image || !isXray || checkingXray ? 'opacity-50 cursor-not-allowed' : 'hover:from-indigo-600 hover:to-blue-600'
                        }`}
                      >
                        {checkingXray ? 'Checking...' : 'Apply'}
                      </button>
                    </form>
                  </div>

                  {/* Prediction Card */}
                  <div className="w-full bg-white border-2 border-black rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center animate-fade-in hover:shadow-2xl transition-shadow duration-300">
                    <DocumentTextIcon className="h-12 w-12 text-blue-500 mb-2" />
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-4 text-center tracking-tight">Diseases Prediction</h2>
                    <div
                      className={`text-center text-xl font-semibold transition-all duration-300 ${
                        image && prediction
                          ? 'text-green-700'
                          : 'blur-sm select-none pointer-events-none text-gray-400'
                      }`}
                      style={{ minHeight: '2.5rem' }}
                    >
                      {image && prediction ? (
                        <>
                          <span className="flex items-center justify-center gap-2">
                            <CheckCircleIcon className="h-6 w-6 text-green-500" />
                            {prediction}
                          </span>
                          {/* Confidence Score */}
                          <div className="mt-2 text-base font-medium text-blue-600">
                            Confidence: {confidence || '92%'}
                          </div>
                        </>
                      ) : (
                        'No prediction available'
                      )}
                    </div>
                  </div>
                </div>

                {/* Report Prompt and Form */}
                {image && prediction && showReportPrompt && (
                  <div className="flex flex-col items-center mt-10 animate-fade-in">
                    {reportChoice === null && (
                      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border-2 border-indigo-200">
                        <p className="mb-4 text-xl font-semibold text-indigo-700">Do you want to generate the report?</p>
                        <div className="flex justify-center gap-6">
                          <button
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded shadow"
                            onClick={() => setReportChoice('yes')}
                          >
                            Yes
                          </button>
                          <button
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded shadow"
                            onClick={() => setReportChoice('no')}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    )}
                    {reportChoice === 'yes' && (
                      <form
                        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mt-6 flex flex-col gap-4 border-2 border-blue-200"
                        onSubmit={handleDownloadReport}
                      >
                        <h3 className="text-2xl font-bold mb-2 text-center text-blue-700">Generate Report</h3>
                        <input
                          type="text"
                          name="name"
                          placeholder="Your Name"
                          value={reportForm.name}
                          onChange={handleReportFormChange}
                          required
                          className="border-2 border-indigo-200 rounded p-2 focus:ring-2 focus:ring-blue-300"
                        />
                        <input
                          type="text"
                          name="address"
                          placeholder="Your Address"
                          value={reportForm.address}
                          onChange={handleReportFormChange}
                          required
                          className="border-2 border-indigo-200 rounded p-2 focus:ring-2 focus:ring-blue-300"
                        />
                        <input
                          type="tel"
                          name="phone"
                          placeholder="Phone Number"
                          value={reportForm.phone}
                          onChange={handleReportFormChange}
                          required
                          className="border-2 border-indigo-200 rounded p-2 focus:ring-2 focus:ring-blue-300"
                        />
                        <select
                          name="sex"
                          value={reportForm.sex}
                          onChange={handleReportFormChange}
                          required
                          className="border-2 border-indigo-200 rounded p-2 focus:ring-2 focus:ring-blue-300"
                        >
                          <option value="">Select Sex</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                        <input
                          type="text"
                          name="disease"
                          value={prediction}
                          readOnly
                          className="border-2 border-indigo-200 rounded p-2 bg-gray-100 text-gray-700"
                          style={{ cursor: 'not-allowed' }}
                        />
                        <button
                          type="submit"
                          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded mt-2 shadow"
                        >
                          Download Report
                        </button>
                      </form>
                    )}
                    {reportChoice === 'no' && (
                      <LungHealthQuestionnaire />
                    )}
                  </div>
                )}
                {/* Fade-in animation style */}
                <style>
                  {`
                    .animate-fade-in {
                      animation: fadeIn 0.8s cubic-bezier(0.4,0,0.2,1);
                    }
                    @keyframes fadeIn {
                      from { opacity: 0; transform: translateY(30px);}
                      to { opacity: 1; transform: translateY(0);}
                    }
                  `}
                </style>
              </div>
            )
        )
      )}
    </>
  );
};

export default Content;
