"use client"

import { Dispatch, SetStateAction } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface PhoneInputComponentProps {
  phone: string;
  setPhone: Dispatch<SetStateAction<string>>;
  isPhoneValid: boolean;
  loading: boolean;
  onSubmit: () => void;
}

export const PhoneInputComponent = ({
  phone,
  setPhone,
  isPhoneValid,
  loading,
  onSubmit
}: PhoneInputComponentProps) => {
  return (
    <div className="max-w-md w-full mx-auto text-center bg-white px-4 sm:px-8 py-10 rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Phone Verification</h1>
      <p className="text-gray-600 mb-6">Enter your phone number to receive a verification code</p>
      <PhoneInput
        country={'us'}
        value={phone}
        onChange={(value) => setPhone(value)}
        containerClass="!w-full mb-4"
        inputClass="!w-full !h-12 !text-lg"
        disabled={loading}
        specialLabel=""
      />
      <button
        onClick={onSubmit}
        className={`w-full rounded-xl px-6 py-3 mt-2 text-white transition-colors ${
          isPhoneValid && !loading
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-gray-400 cursor-not-allowed'
        }`}
        disabled={!isPhoneValid || loading}
      >
        {loading ? 'Sending...' : 'Send Verification Code'}
      </button>
    </div>
  );
};