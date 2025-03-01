import { DialogClose } from '@radix-ui/react-dialog';
import { User2, UserCircle2Icon } from 'lucide-react';
import React from 'react';
import { useRouter } from 'next/navigation';
import CloseMark from '../CloseMarks/CloseMark';
import { on } from 'events';


interface ProfilePopoverProps {
  userName: string;
  userRole: string;
  userPhone: string;
  userEmail: string;
  userId: string;
  onClose: () => void; // Function type for the onClose prop
}

const ProfilePopover: React.FC<ProfilePopoverProps> = ({ userName, userRole, userEmail, userPhone, userId, onClose }) => {
    const router = useRouter();

    const handleProfileClick = () => {
        router.push('/account-settings');
        onClose();
    };
    return (
    <div className="absolute p-4 mt-[-40vh] rounded">
      <div
        data-popover="profile-info-popover"
        className="absolute whitespace-normal break-words rounded-lg border border-blue-gray-50 bg-white p-4 font-sans text-sm font-normal text-blue-gray-500 shadow-lg shadow-blue-gray-500/10 focus:outline-none max-w-[40vw] lg:max-w-[20vw]"
        >
        <div className="mb-2 flex items-center justify-between gap-4">
            <UserCircle2Icon width={50} height={50}/>
            <button
                className="select-none rounded-lg bg-gradient-to-tr from-pink-600 to-pink-400 py-2 px-4 text-center align-middle font-sans text-xs font-medium capitalize text-white shadow-md shadow-pink-500/20 transition-all hover:shadow-lg hover:shadow-pink-500/40 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                type="button"
                data-ripple-light="true"
                onClick={handleProfileClick}
                >
                Go To Profile
            </button>
        </div>
        <h6 className="mb-2 flex items-center gap-2 font-sans text-base font-medium leading-relaxed tracking-normal text-blue-gray-900 antialiased">
            <span>{userName}</span> 
        </h6>
        <p className="block font-sans text-sm font-normal leading-normal text-gray-700 antialiased">
            {userRole === "viewAccess" ? "View Access" : userRole === "servicehead" ? "Service Head" : userRole}
        </p>
        <div className="mt-6 flex items-center gap-8 border-t border-blue-gray-50 pt-4">
            <p className="flex items-center gap-1 font-sans text-xs font-normal text-gray-700 antialiased">
            <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16v-5.5A3.5 3.5 0 0 0 7.5 7m3.5 9H4v-5.5A3.5 3.5 0 0 1 7.5 7m3.5 9v4M7.5 7H14m0 0V4h2.5M14 7v3m-3.5 6H20v-6a3 3 0 0 0-3-3m-2 9v4m-8-6.5h1"/>
            </svg>

            {userEmail}
            </p>
        </div>
        <br />
        <div>
        <a
            href="#"
            className="flex items-center gap-1 font-sans text-xs font-normal text-gray-700 antialiased"
            >
            <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4Zm10 5a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1Zm0 3a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1Zm0 3a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1Zm-8-5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm1.942 4a3 3 0 0 0-2.847 2.051l-.044.133-.004.012c-.042.126-.055.167-.042.195.006.013.02.023.038.039.032.025.08.064.146.155A1 1 0 0 0 6 17h6a1 1 0 0 0 .811-.415.713.713 0 0 1 .146-.155c.019-.016.031-.026.038-.04.014-.027 0-.068-.042-.194l-.004-.012-.044-.133A3 3 0 0 0 10.059 14H7.942Z" clip-rule="evenodd"/>
            </svg>

            {userId}
            </a>
        </div>
        <h1 className='mt-4 text-blue-500 cursor-pointer' onClick={onClose}>Close</h1>
        </div>
    </div>
  );
};

export default ProfilePopover;