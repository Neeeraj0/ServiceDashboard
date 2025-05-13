import axios from 'axios'
import { PhoneCall, Calendar, User, MessageSquare, Check, Flag, Logs } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import clsx from 'clsx' // Optional: for class handling
import { Card, CardHeader, CardFooter, CardContent } from '../ui/card'
import { cn } from '../utils/cn'
import { Button } from '../ui/button'
type CallStatus = 'pending' | 'verified' | 'flagged';

const CallVerificationCard = ({ call, onCallUpdated, status }: { 
    call: any, 
    onCallUpdated?: any, 
    status?: CallStatus 
  }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false); // 🔹 New state

  const getStatusStyles = () => {
    switch (status) {
      case "verified":
        return "bg-green-50 border-green-500 dark:bg-green-900/20";
      case "flagged":
        return "bg-red-50 border-red-500 dark:bg-red-900/20";
      default:
        return "bg-amber-50 border-amber-300 dark:bg-amber-900/10";
    }
  };

  const currentStyle = getStatusStyles();

  const formatDate = (timestamp: any) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})`;
  }

  const lastContactLog = call.contactLogs?.length > 0 
    ? call.contactLogs[call.contactLogs.length - 1] 
    : null;

  const animateAndRemove = async (callId: string, status: 'verified' | 'flagged') => {
    setIsRemoving(true);
    setTimeout(() => {
        onCallUpdated && onCallUpdated({ ...call, contactLogs: [...call.contactLogs.slice(0, -1), {
            ...call.contactLogs[call.contactLogs.length - 1],
            verifiedByCustomer: status === 'verified' ? true : false
          }] }, status);
    }, 300); // Wait for fade-out animation
  }

  const handleVerifyCall = async (callId: string) => {
    try {
      setIsVerifying(true);
      toast.loading('Verifying call...');
      const res = await axios.put(`https://production.circolife.vip/api/query/customerCalls/verifyCustomerCall/${callId}`);
      toast.dismiss();

      if (res.status === 200) {
        toast.success('Call verified successfully!');
        animateAndRemove(callId, 'verified'); // 🔹 Trigger animation
      } else {
        toast.error('Failed to verify call');
      }
    } catch (error) {
      console.error('Error verifying call:', error);
      toast.dismiss();
      toast.error('An error occurred while verifying the call');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFlagCall = async (callId: string) => {
    try {
      setIsFlagging(true);
      toast.loading('Flagging call...');
      const res = await axios.put(`http://localhost:5000/api/query/customerCalls/flagCustomerCall/${callId}`);
      toast.dismiss();

      if (res.status === 200) {
        toast.success('Call flagged successfully!');
        animateAndRemove(callId, 'flagged'); // 🔹 Trigger animation
      } else {
        toast.error('Failed to flag call');
      }
    } catch (error) {
      console.error('Error flagging call:', error);
      toast.dismiss();
      toast.error('An error occurred while flagging the call');
    } finally {
      setIsFlagging(false);
    }
  };

  return (
    // <div className={clsx(
    //     `border rounded-xl p-6 mb-4 transition-all ${currentStyle.cardBg}`,
    //     { "opacity-0 scale-95": isRemoving } // 🔹 Animation classes
    //   )}>
    //   <div className="flex justify-between items-start mb-4">
    //     <div className="flex items-center gap-2">
    //       <PhoneCall className="h-5 w-5 text-[#A14996]" />
    //       <div>
    //         <h3 className="text-lg font-semibold text-gray-800">{call.contactperson}</h3>
    //         <p className="text-gray-600">{call.contactnumber}</p>
    //       </div>
    //     </div>
    //     <div className={`${currentStyle.badge} text-white text-sm font-medium px-3 py-1 rounded-full`}>
    //       {currentStyle.badgeText}
    //     </div>
    //   </div>
    <Card className={cn("border-l-4 transition-all hover:shadow-md mt-5", getStatusStyles())}>
        <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
            <div>
            <h3 className="font-semibold text-lg flex items-center gap-1.5">
                <PhoneCall className='text-[#A14996]' />
                {call.contactperson}
            </h3>
            <p className="text-sm text-muted-foreground">{call.customerMobile}</p>
            </div>
        </div>
        </CardHeader>

      {/* <div className="mb-4 pl-7">
        <div className="flex items-start gap-2">
          <MessageSquare className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <p className="text-gray-700">{call.subject}. {call.summery}</p>
        </div>
      </div>

      <div className="flex justify-between items-center pl-7">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {formatDate(call.TimeStamp)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {lastContactLog ? lastContactLog.contactedBy : 'Not assigned'}
          </span>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button 
          className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 flex items-center gap-1"
          onClick={() => handleFlagCall(call._id)}
          disabled={isFlagging}
        >
          {isFlagging ? 'Flagging...' : 'Flag Issue'}
        </button>
        <button 
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-1" 
          onClick={() => handleVerifyCall(call._id)}
          disabled={isVerifying}
        >
          <PhoneCall className="h-4 w-4" />
          {isVerifying ? 'Verifying...' : 'Verify Call'}
        </button>
      </div> */}
      <CardContent className="pb-4">
        {call.contactLogs.map((log: any, index: any) => (
        <div key={index}>
            <div className="flex items-start gap-2 mb-3 rounded-md">
            <MessageSquare className="h-4 w-4 text-gray-500 mt-1" />
            <p className="text-sm">{call.subject} {log.note}</p>
            </div>
            <div className="flex items-start gap-2 mb-3 rounded-md">
            <Logs className="h-4 w-4 text-gray-500 mt-1" />
            <p className="text-sm">{log.note}</p>
            </div>
        </div>
        ))}
        
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(call.TimeStamp)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>{lastContactLog ? lastContactLog.contactedBy : 'Not assigned'}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex justify-end gap-2 bg-gray-50/50 mt-2 rounded-b-lg">
        {status === "pending" && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => handleFlagCall(call._id)}
            >
              <Flag className="h-4 w-4 mr-1" /> Flag Issue
            </Button>
            <Button 
              size="sm" 
              className="bg-green-500 hover:bg-green-600"
              onClick={() => handleVerifyCall(call._id)}
            >
              <Check className="h-4 w-4 mr-1" /> Verify Call
            </Button>
          </>
        )}
        {status !== "pending" && (
          <div className="text-xs text-muted-foreground italic">
            {status === "verified" ? "Verified by admin" : "Flagged for review"}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

export default CallVerificationCard