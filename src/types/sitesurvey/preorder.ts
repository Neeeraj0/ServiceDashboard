export type PreorderResponse = {
    customer: {
      customer_id: string;
      name: string;
      email: string;
      mobile: string;
    };
    _id: string;
    AcDetails: {
      ac_type: string;
      subscription_price: number;
      fixedPriceAfter3Years: number;
      model: string;
      installation_price: number;
      plan_year: string;
      deposit: number;
      quantity: number;
      contactPerson: string;
      _id: string;
    }[];
    Ac_totalAmount: number;
    materialsdetails: {
      material_name: string;
      material_price: number;
      quantity: number;
      _id: string;
    }[];
    material_totalAmount: number;
    status: string;
    with_material: boolean;
    pending_amount: number;
    executive_id: string;
    customer_shipping_address: {
      address_line1: string;
      address_line2: string;
      pincode: string;
      city: string;
      country: string;
      state: string;
      addressId: string;
      contactPerson: string;
      contactNumber: string;
    };
    paidamount: number;
    orderingStatus: boolean;
    paymentStatusFullPayment: string;
    paymentStatusToken: string;
    preOrdertimestamp: string;
  }