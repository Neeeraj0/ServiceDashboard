declare module 'otp-input-react' {
    const OtpInput: React.FC<{
      value: string;
      onChange: (value: string) => void;
      OTPLength: number;
      otpType: 'number' | 'text';
      autoFocus?: boolean;
      disabled?: boolean;
      className?: string;
    }>;
    export default OtpInput;
  }
  