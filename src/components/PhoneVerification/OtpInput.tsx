"use client"

import { Dispatch, SetStateAction } from 'react';
import OtpInput from 'otp-input-react';

interface OtpInputComponentProps {
  otp: string;
  setOtp: Dispatch<SetStateAction<string>>;
  loading: boolean;
  onVerify: () => void;
  onResend: () => void;
}

export const OtpInputComponent = ({
  otp,
  setOtp,
  loading,
  onVerify,
  onResend
}: OtpInputComponentProps) => {
  return (
    <div className="max-w-md w-full mx-auto text-center bg-white px-4 sm:px-8 py-10 rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Enter Verification Code</h1>
      <p className="text-gray-600 mb-6">We sent a code to your phone</p>
      <OtpInput
        value={otp}
        onChange={setOtp}
        OTPLength={6}
        otpType="number"
        autoFocus
        disabled={loading}
        className="otp-container"
      />
      <button
        className={`w-full rounded-xl px-6 py-3 mt-6 text-white transition-colors ${
          otp.length === 6 && !loading
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-gray-400 cursor-not-allowed'
        }`}
        disabled={otp.length !== 6 || loading}
        onClick={onVerify}
      >
        {loading ? 'Verifying...' : 'Verify Code'}
      </button>
      <div className="text-sm text-gray-500 mt-4">
        Didn't receive code?{' '}
        <button 
          className="font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400"
          onClick={onResend}
          disabled={loading}
        >
          Resend
        </button>
      </div>
    </div>
  );
};