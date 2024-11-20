export type ACUnit = {
    model: string;
    quantity: number;
};

export type Order = {
    _id: string;
    contactperson: string;
    contactnumber: string;
    summery: string;
    subject: string;
    customerComplaint: string,
    TimeStamp: string;
    queryStatus: string;
    deviceid: string;
    orderModels: ACUnit[] | (string | number | null)[]; // Allow both types
}