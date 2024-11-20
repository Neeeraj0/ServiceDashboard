export type ShippingAddress = {
    _id: string;
    customerData: {
      shipping_address: Array<{
        line1: string;
        line2?: string;
        city: string;
        state: string;
        pincode: string;
      }>;
    };
  }