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

interface LoginFormData {
  phone: string;
  role: UserRole | null;
}

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
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
  const router = useRouter();
  const { setUserData } = useUser();

  useEffect(() => {
    // Cleanup function for recaptcha
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
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

    try {
      setupRecaptcha();
      const phoneNumber = `+91${formData.phone}`;
      const appVerifier = window.recaptchaVerifier;
      
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      
      setShowOtp(true);
      setUserData({ 
        phone: phoneNumber, 
        role: formData.role // Now this is type-safe
      });
      toast.success('OTP sent successfully!');
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send OTP. Please try again.');
    }
  };

  const verifyOtp = async () => {
    if (!formData.role) {
      toast.error('Please select a role');
      return;
    }

    try {
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;
      
      const endpoint = formData.role === 'servicehead'
        ? 'http://35.154.208.29:8080/api/users/checkUser'
        : 'http://35.154.208.29:8080/api/technicians/checkTechnician';

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
        localStorage.setItem('token', data.token);
        toast.success(`${formData.role === 'servicehead' ? 'Service Head' : 'Technician'} authenticated successfully!`);
        router.push('/');
      } else {
        toast.error(`${formData.role === 'servicehead' ? 'Service Head' : 'Technician'} not found`);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Invalid OTP. Please try again.');
    }
  };

  const handleRoleChange = (selectedRole: string) => {
    if (selectedRole === 'serviceengineer' || selectedRole === 'servicehead') {
      setFormData(prev => ({ ...prev, role: selectedRole }));
    } else {
      setFormData(prev => ({ ...prev, role: null }));
    }
  };

  const isFormValid = formData.phone.length === 10 && formData.role !== null;

  return (
    <div className="font-sans bg-white">
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
                  <option value="serviceengineer">Service Engineer</option>
                  <option value="servicehead">Service Head</option>
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
                {showOtp ? 'Verify OTP' : 'Send OTP'}
              </button>

              <p className="text-sm mt-8 text-center text-gray-800">
                Don't have an account?
                <a href="/register" className="text-blue-600 font-semibold hover:underline ml-1">
                  Register here
                </a>
              </p>
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