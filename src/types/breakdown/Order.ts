export type ACUnit = {
    model: string;
    quantity: number;
};

export type Order = {
    _id: string;
    contactperson: string;
    contactnumber: string;
    address: string;
    summary: string;
    subject: string;
    status: boolean,
    customerComplaint: string;
    TimeStamp: string;
    queryStatus: string;
    deviceid: string;
    orderModels: ACUnit[] | (string | number | null)[]; // Allow both types
}