'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useUser } from '../context/UserContext';
import { UserRole } from '../../types/user';
import Image from 'next/image';
import OtpInput from 'react-otp-input';
import toast from 'react-hot-toast';
import axios from 'axios';

interface LoginFormData {
  phone: string;
  role: UserRole | null;
}

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult: any;
  }
}

export default function Login() {
  const [formData, setFormData] = useState<LoginFormData>({
    phone: '',
    role: null,
  });
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New loading state
  const [isVerifying, setIsVerifying] = useState(false); // Added verifying state
  const router = useRouter();
  const { setUserData } = useUser();

  useEffect(() => {
    // Cleanup function for recaptcha
    return () => {
      if (window.recaptchaVerifier) {
        console.log("Cleaning up reCAPTCHA verifier");
        window.recaptchaVerifier = undefined; // Clear the property safely
      } else {
        console.log("No reCAPTCHA verifier to clean up");
      }
    };
  }, []);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha', {
        size: 'invisible',
        callback: () => {
          console.log('Recaptcha verified');
        },
      });
    }
  };

  const sendOtp = async () => {
    if (!formData.role) {
      toast.error('Please select a role');
      return;
    }
    setIsLoading(true); 
    try {
      setupRecaptcha();
      const phoneNumber = `+91${formData.phone}`;
      const appVerifier = window.recaptchaVerifier;
      
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      
      setShowOtp(true);
      setUserData({ 
        phone: phoneNumber, 
        role: formData.role 
      });
      toast.success('OTP sent successfully!');
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending OTP:', error);
    }
  };

  // const verifyOtp = async () => {
  //   if (!formData.role) {
  //     toast.error('Please select a role');
  //     return;
  //   }
    
  //   setIsVerifying(true);
    
  //   try {
  //     // Confirm OTP with Firebase
  //     const result = await window.confirmationResult.confirm(otp);
  //     const user = result.user;
      
  //     // Determine which endpoint to use based on role
  //     let endpoint;
  //     if (formData.role === 'servicehead') {
  //       endpoint = `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/users/checkUser`;
  //     } else if (formData.role === 'viewAccess') {
  //       endpoint = `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/users/checkUser`;
  //     } else {
  //       endpoint = `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/technicians/checkTechnician`;
  //     }
      
  //     // Check if user exists
  //     const response = await fetch(endpoint, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         phone: `+91${formData.phone}`,
  //       }),
  //     });
      
  //     const data = await response.json();
      
  //     if (response.ok && data.exists) {
  //       // Store authentication token
  //       localStorage.setItem('authToken', data.token);
        
  //       // Fetch technicians list
  //       try {
  //         const techResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/technicians/getTechnicians`, {
  //           method: 'GET',
  //           headers: {
  //             'Content-Type': 'application/json',
  //             'Authorization': `Bearer ${data.token}` // Using the token for authorization
  //           }
  //         });
          
  //         if (techResponse.ok) {
  //           const techniciansData = await techResponse.json();
  //           // Store technicians data in localStorage
  //           localStorage.setItem('technicians', JSON.stringify(techniciansData));
  //         } else {
  //           console.error('Failed to fetch technicians list');
  //         }
  //       } catch (techError) {
  //         console.error('Error fetching technicians:', techError);
  //       }
        
  //       // Success message and redirect
  //       toast.success(`${formData.role === 'servicehead' ? 'Service Head' : formData.role === 'viewAccess' ? 'View Access' : 'Technician'} authenticated successfully!`);
  //       router.push('/');
  //     } else {
  //       toast.error(`${formData.role === 'servicehead' ? 'Service Head' : formData.role === 'viewAccess' ? 'View Access' : 'Technician'} not found`);
  //     }
  //   } catch (error) {
  //     console.error('Error verifying OTP:', error);
  //     toast.error('Invalid OTP. Please try again.');
  //   } finally {
  //     setIsVerifying(false);
  //   }
  // };  

  const verifyOtp = async () => {
    if (!formData.role) {
      toast.error('Please select a role');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;
      
      let endpoint;
      if (formData.role === 'servicehead') {
          endpoint = `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/users/checkUser`;
      } else if (formData.role === 'viewAccess') {
          endpoint = `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/users/checkUser`;
      } else {
          endpoint = `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/technicians/checkTechnician`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: `+91${formData.phone}`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.exists) {
        localStorage.setItem('authToken', data.token);
        toast.success(`${formData.role === 'servicehead' ? 'Service Head' : formData.role === 'viewAccess' ? 'View Access' : 'Technician'} authenticated successfully!`);
        router.push('/');
      } else {
        toast.error(`${formData.role === 'servicehead' ? 'Service Head' : 'Technician'} not found`);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Invalid OTP. Please try again.');
    } finally{
      setIsVerifying(false);
    }
  };
  const handleRoleChange = (selectedRole: string) => {
    if (selectedRole === 'viewAccess' || selectedRole === 'servicehead') {
      setFormData(prev => ({ ...prev, role: selectedRole }));
    } else {
      setFormData(prev => ({ ...prev, role: null }));
    }
  };

  const isFormValid = formData.phone.length === 10 && formData.role !== null;

  return (
    <div className="font-sans bg-white">
      <img src={"/images/logo/airexpert_logo.svg"} width={200} height={200 }/>
      <div className="min-h-screen flex items-center justify-center py-6 px-4">
        <div className="grid md:grid-cols-2 items-center gap-4 max-w-6xl w-full">
          <div className="rounded-lg p-6 max-w-md shadow-lg max-md:mx-auto">
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="mb-8">
                <h3 className="text-gray-800 text-3xl font-extrabold">Login</h3>
              </div>

              <div>
                <label className="text-gray-800 text-sm mb-2 block">Role</label>
                <select
                  name="role"
                  required
                  className="w-full text-sm text-gray-800 border border-gray-300 px-4 py-3 rounded-lg outline-blue-600"
                  value={formData.role || ''}
                  onChange={(e) => handleRoleChange(e.target.value)}
                >
                  <option value="">Select Role</option>
                  <option value="servicehead">Service Head</option>
                  <option value="viewAccess">View Access</option>
                </select>
              </div>

              <div>
                <label className="text-gray-800 text-sm mb-2 block">Phone</label>
                <input
                  name="phone"
                  type="tel"
                  pattern="[0-9]{10}"
                  required
                  className="w-full text-sm text-gray-800 border border-gray-300 px-4 py-3 rounded-lg outline-blue-600"
                  placeholder="Enter 10-digit phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  maxLength={10}
                />
              </div>

              {showOtp && (
                <div>
                  <label className="text-gray-800 text-sm mb-2 block">Enter OTP</label>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    numInputs={6}
                    renderInput={(props) => <input {...props} />}
                    inputStyle="w-12 h-12 text-center border border-gray-300 rounded-lg mx-1"
                    containerStyle="flex justify-center gap-2"
                  />
                </div>
              )}

              <button
                type="button"
                className="w-full shadow-xl py-3 px-4 text-sm tracking-wide rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={showOtp ? verifyOtp : sendOtp}
                disabled={!isFormValid || (showOtp && !otp)}
              >
                  {isVerifying ? 'Verifying...' : isLoading ? 'Sending...' : (showOtp ? 'Verify OTP' : 'Send OTP')}
                </button>
            </form>
          </div>

          <div className="max-w-[600px] max-md:mt-8 relative h-[600px]">
            <Image
              src="/images/login/landing.png"
              alt="Login Image"
              fill
              className="object-cover rounded-lg"
              priority
            />
          </div>
        </div>
      </div>
      <div id="recaptcha"></div>
    </div>
  );
}