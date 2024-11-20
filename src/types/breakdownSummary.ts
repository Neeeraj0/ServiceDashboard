export type BreakdownSummary = {
    _id: string;
    contactperson: string;
    contactnumber: string;
    contactemail: string;
    image: string;
    subject: string;
    summery: string;
    type: string;
    status: boolean;
    deviceid: string;
    TimeStamp: string;
    queryStatus: string;
    lastUpdated?: string; // lastUpdated may not be available on all tasks
    orderModels: (string | number)[]; // This can be an array of strings or numbers
  }


  