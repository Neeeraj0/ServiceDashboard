import { User2 } from "lucide-react";
import LogoutButton from "../Logout/LogOut";
import { useEffect, useState } from "react";
import ProfilePopover from "./ProfilePopOver";

const ProfileSection = () => {
  const [userName, setUserName] = useState("Guest");
  const [userRole, setUserRole] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userId, setUserId] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    const checkUserAccess = () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const decodedToken = JSON.parse(jsonPayload);
          
          setUserName(decodedToken.name);
          setUserRole(decodedToken.role);
          setUserEmail(decodedToken.email);
          setUserPhone(decodedToken.phone);
          setUserId(decodedToken.admin_id);
        } catch (err) {
          console.error("Error decoding token:", err);
          setUserName("");
          setUserRole("");
          setUserEmail("");
          setUserPhone("");
          setUserId("");
        }
      }
    };

    checkUserAccess();
  }, []);

  const togglePopover = () => {
    setIsPopoverOpen(!isPopoverOpen);
  };

  return (
    <div className="relative p-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={togglePopover}>
        <div className="flex-shrink-0">
          <User2 className="h-7 w-7 text-black rounded-xl" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userName}</p>
          <p className="text-sm text-gray-400 dark:text-gray-400 truncate">{userRole === "viewAccess" ? "View Access" : userRole}</p>
        </div>
        <div className="flex-shrink-0">
          <LogoutButton />
        </div>
      </div>

      {isPopoverOpen && (
        <ProfilePopover userName={userName} userRole={userRole} userEmail={userEmail} userPhone={userPhone} userId={userId} onClose={togglePopover} />
      )}
    </div>
  );
};

export default ProfileSection;