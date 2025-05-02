export const formatDate = (dateString?: string) => {
  if (!dateString) {
    return { date: "N/A", time: "N/A" };
}
    // Split the ISO string at 'T' to separate date and time
    const [date, timeWithOffset] = dateString.split('T');
    
    // Get just the hours and minutes from the time part
    const time = timeWithOffset.split('.')[0];
    const [hours, minutes] = time.split(':');
    
    // Format time with AM/PM
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const formattedHour = hour % 12 || 12;
    
    return {
      date,
      time: `${formattedHour}:${minutes} ${ampm}`
    };
  };