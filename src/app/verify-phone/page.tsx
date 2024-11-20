"use client";

import { useState, useEffect } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { PhoneInputComponent } from "../../components/PhoneVerification/PhoneInput";
import { OtpInputComponent } from "../../components/PhoneVerification/OtpInput";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { useUser } from "../context/UserContext";
import { UserData } from "@/types/user";

const VerifyPhone = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {userData} = useUser();
  const {setUserData} = useUser();

  useEffect(() => {
    // Ensure this only runs on the client-side
    if (typeof window !== "undefined") {
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (!recaptchaContainer) {
        const container = document.createElement("div");
        container.id = "recaptcha-container";
        document.body.appendChild(container);
      }
    }
  }, []);

  
  const generateRecaptcha = () => {
    if (typeof window === "undefined") {
      console.error("Recaptcha cannot be initialized on the server.");
      return null;
    }
  
    if (!document.getElementById("recaptcha-container")) {
      console.error("Recaptcha container not found.");
      return null;
    }
  
    try {
      return new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        },
      );
    } catch (error) {
      console.error("Error generating reCAPTCHA:", error);
      return null;
    }
  };

  const sendOtp = async () => {
    try {
      setLoading(true);
      const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
      const recaptcha = generateRecaptcha();
  
      if (!recaptcha) {
        throw new Error("Failed to initialize reCAPTCHA");
      }
  
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptcha);
  
      sessionStorage.setItem("verificationId", confirmationResult.verificationId);
  
      setShowOtp(true);
      toast.success("OTP sent successfully!");
      setUserData((prevUserData) => ({
        ...prevUserData,
        phone: phone,
      }));
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };  
  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    try {
      setLoading(true);
      const verificationId = sessionStorage.getItem("verificationId");
      if (!verificationId) {
        throw new Error("Verification session expired");
      }
      console.log(userData.name, userData.email, userData.phone, userData.role);
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const result = await signInWithCredential(auth, credential);
      if (result.user) {
        toast.success("Phone verified successfully!");
        console.log(userData);
        console.log(userData.name, userData.email, userData.phone, userData.role);
        handleRegister();
        setTimeout(() =>{
          router.push("/");
        }, 1000)
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast.error(error.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const technicianDetails = {
      email: userData.email,
      name: userData.name, 
      role: userData.role,
      phoneNumber: userData.phone,
    };
    console.log(technicianDetails)
    try {
        const endpoint = userData.role === 'servicehead' 
        // ? 'http://35.154.208.29:8080/api/users/register'
        ? `${process.env.NEXT_PUBLIC_SERVICEHEAD_REGISTER}`
        // : 'http://35.154.208.29:8080/api/technicians/register';
        : `${process.env.NEXT_PUBLIC_TECHNICIAN_REGISTER}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(technicianDetails),
      });  
      console.log('inside the post api');
      if (response.ok) {
        toast.success('Technician registered successfully');
        router.push('/login');
      } else {
        toast.error('Failed to register technician');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      toast.error('Error occurred while registering');
    }
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-6 px-4">
      <div id="recaptcha-container" className="invisible"></div>
      {showOtp ? (
        <OtpInputComponent
          otp={otp}
          setOtp={setOtp}
          loading={loading}
          onVerify={verifyOtp}
          onResend={sendOtp}
        />
      ) : (
        <PhoneInputComponent
          phone={phone}
          setPhone={setPhone}
          isPhoneValid={phone.length >= 10}
          loading={loading}
          onSubmit={sendOtp}
        />
      )}
      <Toaster position="top-center" />
    </div>
  );
};

export default VerifyPhone;
