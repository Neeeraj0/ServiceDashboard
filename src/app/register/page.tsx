"use client"

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import Image from 'next/image';

type UserRole = 'serviceengineer' | 'servicehead' | undefined;

interface RegisterFormData {
  email: string;
  name: string;
  phone: string;
  role: UserRole;
}

export default function Register() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    name: '',
    phone: '',
    role: undefined,
  });
  
  const router = useRouter();
  const { setUserData } = useUser();
  const {userData} = useUser();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : value,
    }));
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
  
    if (!formData.role) {
      console.error('Role is required');
      return;
    }
  
    try {
      setUserData({
        ...formData,
        role: formData.role as UserRole, 
      });

      console.log(userData);
      console.log(formData.email, formData.name, formData.phone, formData.role);
      router.push('/verify-phone');
    } catch (error) {
      console.error('Error during registration:', error);
    }
  };
  const isFormValid = formData.email && formData.name && formData.role;
  return (
    <div className="font-sans">
      <div className="min-h-screen flex items-center justify-center py-6 px-4">
        <div className="grid md:grid-cols-2 items-center gap-4 max-w-6xl w-full">
          <div className="border border-gray-100 rounded-lg p-6 max-w-md bg-gray-100 shadow-lg max-md:mx-auto">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="mb-8">
                <h3 className="text-gray-800 text-3xl font-extrabold">Register</h3>
              </div>

              <div>
                <label className="text-gray-800 text-sm mb-2 block">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full text-sm text-gray-800 border border-gray-300 px-4 py-3 rounded-lg outline-blue-600"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="text-gray-800 text-sm mb-2 block">Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full text-sm text-gray-800 border border-gray-300 px-4 py-3 rounded-lg outline-blue-600"
                  placeholder="Enter name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="text-gray-800 text-sm mb-2 block">Role</label>
                <select
                  name="role"
                  required
                  className="w-full text-sm text-gray-800 border border-gray-300 px-4 py-3 rounded-lg outline-blue-600"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="">Select Role</option>
                  <option value="serviceengineer">Service Engineer</option>
                  <option value="servicehead">Service Head</option>
                </select>
              </div>

              <button
                type="submit"
                className={`w-full shadow-xl py-3 px-4 text-sm tracking-wide rounded-lg text-white transition-colors
                  ${isFormValid 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                  }`}
                disabled={!isFormValid}
              >
                Sign up
              </button>

              <p className="text-sm mt-8 text-center text-gray-800">
                Already have an account?
                <a href="/login" className="text-blue-600 font-semibold hover:underline ml-1">
                  Login here
                </a>
              </p>
            </form>
          </div>

          <div className="max-w-[600px] max-md:mt-8 relative h-[600px]">
            <Image
              src="/images/login/landing.png"
              alt="Registration Image"
              fill
              className="object-cover rounded-lg"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}