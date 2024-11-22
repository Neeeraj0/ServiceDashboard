"use client"

import { useState } from "react";
import '../module.style.css';
import { PreorderResponse } from "@/types/sitesurvey/preorder";
import { useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { error } from "console";
interface SiteSurveyFormProps{
    closeModal: () => void;
    orderData: PreorderResponse| null;
}
interface AcDetail {
  ac_type: string;
  model: string;
  quantity: number;
  subscription_price: number;
  installation_price: number;
  plan_year: string;
}
interface MaterialDetail {
  material_name: string;
  material_price: number;
  quantity: number;
}

interface Payload {
  AcDetails: AcDetail[];
  materialsdetails?: MaterialDetail[];
  with_material: boolean;
}

export const generateAndUploadPDF = async (orderData: any, formData: any) => {
  try {
    const response = await fetch('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderData,
        formData
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }

    return data.pdfUrl;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

const SiteSurveyForm: React.FC<SiteSurveyFormProps>  = ({closeModal, orderData}) =>{
    const [formData, setFormData] = useState({
        // AC Details
        splitAC1T: '',
        splitAC1_5T: '',
        splitAC2T: '',
        cassetteAC2T: '',
        cassetteAC3T: '',
        // Material Details
        copperPipeSplit: '',
        copperPipeCassette: '',
        lStand: '',
        rubberStand: '',
        polycabWire: '',
        crossStand: '',
        // Installation Category
        installationType: 'piping_installation',
        // Uninstallation
        uninstallationNeeded: 'no',
        MCBAvailable: 'no',
        EartingAvailable: 'no',
        Fabrication: 'no',
        CoreCutting: 'no',
        CarpentryWork: 'no',
        OptionToStoreMaterial: 'no',
        UnloadingFacality: 'no',
        LadderAvailable: 'no',
        SafetyPrecautionNeeded: 'no',
        safetyPrecautionDetails: '',
        RatBiteChances: 'no',
        attachments: [] as File[] // Use an array to store files
      });

      useEffect(() => {
        if (orderData) {
          const acDetails = orderData.AcDetails.reduce((acc, ac) => {
            switch (ac.model) {
              case 'S10':
                acc.splitAC1T = ac.quantity.toString();
                break;
              case 'S15':
                acc.splitAC1_5T = ac.quantity.toString();
                break;
              case 'S20':
                if (ac.ac_type === 'Split') {
                  acc.splitAC2T = ac.quantity.toString();
                }
                break;
              case 'C20':
                if(ac.ac_type === 'Cassette'){
                    acc.cassetteAC2T = ac.quantity.toString();
                }
                break;
              case 'C30':
                if(ac.ac_type === 'Cassette'){
                  acc.cassetteAC2T = ac.quantity.toString();
                }
                break;
              default:
                break;
            }

            return acc;
          }, {} as Record<string, string>);
    
          const materialDetails = orderData.materialsdetails.reduce((acc, material) => {
            if (material.material_name === 'copper_piping_p') {
              acc.copperPipeSplit = material.quantity.toString();
            }
            if (material.material_name === 'cross_stand_p') {
              acc.crossStand = material.quantity.toString();
            }
            if (material.material_name === 'copper_piping_cassette_p') {
              acc.copperPipeCassette = material.quantity.toString();
            }
            if (material.material_name === 'core_cable_4_p') {
              acc.polycabWire = material.quantity.toString();
            }
            if (material.material_name === 'l_stand_p') {
              acc.lStand = material.quantity.toString();
            }
            if (material.material_name === 'rubber_stand_p') {
              acc.rubberStand = material.quantity.toString();
            }
            return acc;
          }, {} as Record<string, string>);
    
          setFormData((prev) => ({
            ...prev,
            ...acDetails,
            ...materialDetails,
          }));

          console.log(formData);
        }
      }, [orderData]);



      // useEffect(()=>{
      //   console.log('called');
      
      // },[])
    
      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
          ...formData,
          [e.target.name]: e.target.value
        });

        console.log(formData);
      };

      const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
          setFormData({
            ...formData,
            attachments: [...formData.attachments, ...Array.from(e.target.files)] // Convert FileList to Array
          });
        }

        console.log(formData);
      };

      const handleDeleteFile = (index: number) => {
        const updatedAttachments = formData.attachments.filter((_, i) => i !== index); // Remove file by index
        setFormData({
          ...formData,
          attachments: updatedAttachments
        });
    };

    console.log(orderData?.AcDetails.find(ac => ac.model === '15')?.plan_year);

    const handleSubmit = async (): Promise<void> => {
      try {
        if (!orderData) {
          alert('Order data is missing!');
          return;
        }

        console.log('inside the handle submit function');

        let commonSubscriptionPrice = 0;
        let commonInstallationPrice = 0;

        orderData.AcDetails.forEach(ac => {
          if (ac.subscription_price > 0) {
            commonSubscriptionPrice = ac.subscription_price;
          }
          if (ac.installation_price > 0) {
            commonInstallationPrice = ac.installation_price;
          }
        });
        const updatedAcDetails: AcDetail[] = [];
        if (formData.splitAC1T) {
          updatedAcDetails.push({
            ac_type: 'Split',
            model: 'S10',
            quantity: parseInt(formData.splitAC1T, 10) || 0,
            subscription_price: commonSubscriptionPrice || 0,
            installation_price: commonInstallationPrice || 0,
            plan_year: orderData.AcDetails.find(ac => ac.model === '1')?.plan_year || '3+2year',
          });
        }
    
        if (formData.splitAC1_5T) {
          updatedAcDetails.push({
            ac_type: 'Split',
            model: 'S15',
            quantity: parseInt(formData.splitAC1_5T, 10) || 0,
            subscription_price: commonSubscriptionPrice || 0,
            installation_price: commonInstallationPrice || 0,
            plan_year: orderData.AcDetails.find(ac => ac.model === '1.5')?.plan_year || '3+2year',
          });
        }
    
        if (formData.splitAC2T) {
          updatedAcDetails.push({
            ac_type: 'Split',
            model: 'S20',
            quantity: parseInt(formData.splitAC2T, 10) || 0,
            subscription_price: commonSubscriptionPrice || 0,
            installation_price: commonInstallationPrice || 0,
            plan_year: orderData.AcDetails.find(ac => ac.model === '2')?.plan_year || '3+2year',
          });
        }
    
        if (formData.cassetteAC2T) {
          updatedAcDetails.push({
            ac_type: 'Cassette',
            model: 'C20',
            quantity: parseInt(formData.cassetteAC2T, 10) || 0,
            subscription_price: commonSubscriptionPrice || 0,
            // subscription_price: orderData.AcDetails.find(ac => ac.model === '2')?.subscription_price || 0,
            installation_price: commonInstallationPrice || 0,
            // installation_price: orderData.AcDetails.find(ac => ac.model === '2')?.installation_price || 0,
            plan_year: orderData.AcDetails.find(ac => ac.model === '2')?.plan_year || '3+2year',
          });
        }
    
        if (formData.cassetteAC3T) {
          updatedAcDetails.push({
            ac_type: 'Cassette',
            model: 'C30',
            quantity: parseInt(formData.cassetteAC3T, 10) || 0,
            subscription_price: commonSubscriptionPrice || 0,
            // subscription_price: orderData.AcDetails.find(ac => ac.model === '3')?.subscription_price || 0,
            installation_price: commonInstallationPrice || 0,
            // installation_price: orderData.AcDetails.find(ac => ac.model === '3')?.installation_price || 0,
            plan_year: orderData.AcDetails.find(ac => ac.model === '3')?.plan_year || '3+2year',
          });
        }
    
        const updatedMaterials: MaterialDetail[] = [];
    
        if (formData.copperPipeSplit) {
          updatedMaterials.push({
            material_name: 'copper_piping_p',
            material_price: 20, 
            quantity: parseInt(formData.copperPipeSplit, 10) || 0,
          });
        }
    
        if (formData.copperPipeCassette) {
          updatedMaterials.push({
            material_name: 'copper_piping_cassette_p',
            material_price: 20, 
            quantity: parseInt(formData.copperPipeCassette, 10) || 0,
          });
        }

        if(formData.polycabWire){
          updatedMaterials.push({
            material_name: 'core_cable_4_p',
            material_price: 20, 
            quantity: parseInt(formData.polycabWire, 10) || 0,
          });
        }

        if(formData.lStand){
          updatedMaterials.push({
            material_name: 'l_stand_p',
            material_price: 20, 
            quantity: parseInt(formData.lStand, 10) || 0,
          });
        }

        if(formData.rubberStand){
          updatedMaterials.push({
            material_name: 'rubber_stand_p',
            material_price: 299, 
            quantity: parseInt(formData.rubberStand, 10) || 0,
          });
        }

        if(formData.crossStand){
          updatedMaterials.push({
            material_name: 'cross_stand_p',
            material_price: 299, 
            quantity: parseInt(formData.crossStand, 10) || 0,
          });
        }
    
        const withMaterial = updatedMaterials.some((material) => material.quantity > 0);
    
        const payload: Payload = {
          AcDetails: updatedAcDetails,
          with_material: withMaterial,
        };
    
        if (withMaterial) {
          payload.materialsdetails = updatedMaterials;
        }

        const formData1 = new FormData();

        const payload1 = {
          customer: {
            customer_id: orderData.customer.customer_id,
            name: orderData.customer.name,
            email: orderData.customer.email,
            mobile: orderData.customer.mobile,
          },
          customer_shipping_address: {
            address_line1: orderData.customer_shipping_address.address_line1,
            address_line2: orderData.customer_shipping_address.address_line2,
            pincode: orderData.customer_shipping_address.pincode,
            city: orderData.customer_shipping_address.city,
            country: orderData.customer_shipping_address.country,
            state: orderData.customer_shipping_address.state,
            contactPerson: orderData.customer_shipping_address.contactPerson,
            contactNumber: orderData.customer_shipping_address.contactNumber,
          },
          PaymentStatus: orderData.pending_amount,
          materialTotalAmount: orderData.material_totalAmount,
          OrderDate: new Date(orderData.preOrdertimestamp).toISOString(),
          installationType: formData.installationType,
          uninstallationNeeded: formData.uninstallationNeeded,
          MCBAvailable: formData.MCBAvailable,
          EartingAvailable: formData.EartingAvailable,
          Fabrication: formData.Fabrication,
          CoreCutting: formData.CoreCutting,
          CarpentryWork: formData.CarpentryWork,
          OptionToStoreMaterial: formData.OptionToStoreMaterial,
          UnloadingFacality: formData.UnloadingFacality,
          LadderAvailable: formData.LadderAvailable,
          SafetyPrecautionNeeded: formData.SafetyPrecautionNeeded,
          safetyPrecautionDetails: formData.safetyPrecautionDetails,
          RatBiteChances: formData.RatBiteChances,
          PreOrderId: orderData._id,
          AcDetails: updatedAcDetails,
          materialsdetails: withMaterial ? updatedMaterials : [],
          with_material: withMaterial,
        };
        formData1.append('payload', JSON.stringify(payload1));
        formData.attachments.forEach((file) => {
          formData1.append('attachments', file);
        });
        const [response, response1] = await Promise.all([
          axios.put(
            // `${process.env.NEXT_PUBLIC_SALES}${orderData._id}/updatedetails`, 
            // `http://3.110.115.219:5000/api/preOrder/${orderData._id}/updatedetails`, 
            `http://13.201.4.68:8080/api/preOrder/${orderData._id}/updatedetails`, 
            payload
          ),
          axios.post(
            // 'http://35.154.208.29:8080/api/SiteSurveyDetails/SiteSurveyDetails',
            'http://localhost:8000/api/SiteSurveyDetails/SiteSurveyDetails',
            formData1,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          )
        ]);
        toast.success('Data, images, and PDF uploaded successfully!');
        closeModal();
      } catch (error: any) {
        console.error('Error updating data:', error);
        toast.error('Failed to update data!', error);
      }
    };

    return(
        <div className={`modal-overlay overflow-y-auto`}>
          <div className="modal">
            <div className="flex justify-between p-3">
                <h2 className="text-xl font-semibold mb-6">Site Survey Details</h2>
                <button onClick={closeModal} className="bg-red-500 text-white font-semibold p-2 rounded-xl text-sm">Close</button>
            </div>
          <div className='max-h-[80vh] overflow-y-auto px-4'>
          {/* AC Details Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">AC Details</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">1T Split AC :</label>
                    <input
                      type="text"
                      name="splitAC1T"
                      value={formData.splitAC1T}
                      onChange={handleInputChange}
                      className="ml-2 w-32 px-3 py-2 border rounded-md text-sm"
                      placeholder="Units"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">1.5T Split AC :</label>
                    <input
                      type="text"
                      name="splitAC1_5T"
                      value={formData.splitAC1_5T}
                      onChange={handleInputChange}
                      className="ml-2 w-32 px-3 py-2 border rounded-md text-sm"
                      placeholder="Units"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">2T Split AC :</label>
                    <input
                      type="text"
                      name="splitAC2T"
                      value={formData.splitAC2T}
                      onChange={handleInputChange}
                      className="ml-2 w-32 px-3 py-2 border rounded-md text-sm"
                      placeholder="Units"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">2T Cassette AC :</label>
                    <input
                      type="text"
                      name="cassetteAC2T"
                      value={formData.cassetteAC2T}
                      onChange={handleInputChange}
                      className="ml-2 w-32 px-3 py-2 border rounded-md text-sm"
                      placeholder="Units"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">3T Cassette AC :</label>
                    <input
                      type="text"
                      name="cassetteAC3T"
                      value={formData.cassetteAC3T}
                      onChange={handleInputChange}
                      className="ml-2 w-32 px-3 py-2 border rounded-md text-sm"
                      placeholder="Units"
                    />
                  </div>
                </div>
              </div>
            </div>
      
            {/* Material Details Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Material Details</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Copper Pipe Split:</label>
                    <input
                      type="number"
                      name="copperPipeSplit"
                      value={formData.copperPipeSplit}
                      onChange={handleInputChange}
                      className="ml-2 w-32 px-3 py-2 border rounded-md text-sm"
                      placeholder="In Ft"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Rubber Stand :</label>
                    <input
                      type="text"
                      name="rubberStand"
                      value={formData.rubberStand}
                      onChange={handleInputChange}
                      className="ml-2 w-32 px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Cross Stand :</label>
                    <input
                      type="text"
                      name="crossStand"
                      value={formData.crossStand}
                      onChange={handleInputChange}
                      className="ml-2 w-32 px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Copper Pipe Cassette:</label>
                    <input
                      type="text"
                      name="copperPipeCassette"
                      value={formData.copperPipeCassette}
                      onChange={handleInputChange}
                      className="ml-2 w-32 px-3 py-2 border rounded-md text-sm"
                      placeholder="In Ft"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">L Stand :</label>
                    <input
                      type="text"
                      name="lStand"
                      value={formData.lStand}
                      onChange={handleInputChange}
                      className="ml-2 w-32 px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Polycab 4 Core Wire :</label>
                    <input
                      type="text"
                      name="polycabWire"
                      value={formData.polycabWire}
                      onChange={handleInputChange}
                      className="ml-2 w-32 px-3 py-2 border rounded-md text-sm"
                      placeholder="In Ft"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Installation Category Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Type of Installation Category</h3>
              <div className="space-x-6 flex gap-25">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="installationType"
                    value="installation"
                    checked={formData.installationType === 'installation'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-pink-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">Piping and Installation together</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="installationType"
                    value="piping"
                    checked={formData.installationType === 'piping'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-gray-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">Seperate Piping and Installation</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="installationType"
                    value="replacement"
                    checked={formData.installationType === 'replacement'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-gray-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">Replacement</span>
                </label>
              </div>
            </div>
            {/* Uninstallation Section */}
            <div>
              <h3 className="text-lg font-medium mb-4">Uninstallation Needed?</h3>
              <div className="space-x-6 flex">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="uninstallationNeeded"
                    value="yes"
                    checked={formData.uninstallationNeeded === 'yes'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-pink-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="uninstallationNeeded"
                    value="no"
                    checked={formData.uninstallationNeeded === 'no'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-gray-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">No</span>
                </label>
              </div>
            </div>
            
            {/* MCB Available */}
            <div>
              <h3 className="text-lg font-medium mb-4">MCB Available at Customer?</h3>
              <div className="space-x-6 flex">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="MCBAvailable"
                    value="yes"
                    checked={formData.MCBAvailable === 'yes'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-pink-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="MCBAvailable"
                    value="no"
                    checked={formData.MCBAvailable === 'no'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-gray-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">No</span>
                </label>
              </div>
            </div>

            {/* earting available */}
            <div>
              <h3 className="text-lg font-medium mb-4">Earthing Available at Site?</h3>
              <div className="space-x-6 flex">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="EarthingAvailable"
                    value="yes"
                    checked={formData.EartingAvailable === 'yes'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-pink-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="EarthingAvailable"
                    value="no"
                    checked={formData.EartingAvailable === 'no'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-gray-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">No</span>
                </label>
              </div>
            </div>

            {/* Fabrication */}
            <div>
              <h3 className="text-lg font-medium mb-4">Fabrication To be done ?</h3>
              <div className="space-x-6 flex">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="Fabrication"
                    value="yes"
                    checked={formData.Fabrication === 'yes'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-pink-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="Fabrication"
                    value="no"
                    checked={formData.Fabrication === 'no'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-gray-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">No</span>
                </label>
              </div>
            </div>

            {/* core cutting */}
            <div>
              <h3 className="text-lg font-medium mb-4">Core Cutting Needed?</h3>
              <div className="space-x-6 flex">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="CoreCutting"
                    value="yes"
                    checked={formData.CoreCutting === 'yes'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-pink-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="CoreCutting"
                    value="no"
                    checked={formData.CoreCutting === 'no'}
                    onChange={handleInputChange}
                    className="w-4 h-4 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">No</span>
                </label>
              </div>
            </div>

            {/* carpentry work */}

            <div>
              <h3 className="text-lg font-medium mb-4">Carpentry Work to be done?</h3>
              <div className="space-x-6 flex">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="CarpentryWork"
                    value="yes"
                    checked={formData.CarpentryWork === 'yes'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-pink-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="CarpentryWork"
                    value="no"
                    checked={formData.CarpentryWork === 'no'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-gray-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600 ">No</span>
                </label>
              </div>
            </div>

            {/* unloading */}
            <div> 
              <h3 className="text-lg font-medium mb-4">Unloading Facility available ?</h3>
              <div className="space-x-6 flex">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="UnloadingFacality"
                    value="yes"
                    checked={formData.UnloadingFacality === 'yes'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-pink-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="UnloadingFacality"
                    value="no"
                    checked={formData.UnloadingFacality === 'no'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-gray-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">No</span>
                </label>
              </div>
            </div>

            {/* option to store material */}
            <div>
              <h3 className="text-lg font-medium mb-4">Option to store material safely ?</h3>
              <div className="space-x-6 flex">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="OptionToStoreMaterial"
                    value="yes"
                    checked={formData.OptionToStoreMaterial === 'yes'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-pink-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="OptionToStoreMaterial"
                    value="no"
                    checked={formData.OptionToStoreMaterial === 'no'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-gray-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">No</span>
                </label>
              </div>
            </div>

            {/* ladder available */}
            <div>
              <h3 className="text-lg font-medium mb-4">Ladder available with customer ?</h3>
              <div className="space-x-6 flex">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="LadderAvailable"
                    value="yes"
                    checked={formData.LadderAvailable === 'yes'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-pink-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="LadderAvailable"
                    value="no"
                    checked={formData.LadderAvailable === 'no'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-gray-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">No</span>
                </label>
              </div>
            </div>

            {/* rat bite chances */}
            <div>
              <h3 className="text-lg font-medium mb-4">Rat Bite Chances ?</h3>
              <div className="space-x-6 flex">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="RatBiteChances"
                    value="yes"
                    checked={formData.RatBiteChances === 'yes'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-pink-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="RatBiteChances"
                    value="no"
                    checked={formData.RatBiteChances === 'no'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-gray-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">No</span>
                </label>
              </div>
            </div>

            {/* safety precaution */}
            <div>
              <h3 className="text-lg font-medium mb-4">Safety Precaution Needed ?</h3>
              <div className="space-x-6 flex">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="SafetyPrecautionNeeded"
                    value="yes"
                    checked={formData.SafetyPrecautionNeeded === 'yes'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-pink-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="SafetyPrecautionNeeded"
                    value="no"
                    checked={formData.SafetyPrecautionNeeded === 'no'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-gray-600 accent-[#A14996]"
                  />
                  <span className="ml-2 text-sm text-gray-600">No</span>
                </label>
              </div>
              {formData.SafetyPrecautionNeeded === 'yes' && (
              <textarea
                name="safetyPrecautionDetails"
                value={formData.safetyPrecautionDetails}
                onChange={handleInputChange}
                className="mt-2 w-full px-3 py-2 border rounded-md text-sm"
                placeholder="Please provide details..."
              />
              )}
            </div>
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4 w-full">Attachments (if any)</h3>
              <div className="flex flex-row gap-5">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-2 border rounded-md text-sm max-w-50"
                  multiple
                />
                {formData.attachments.length > 0 && (
                  <ul className="grid grid-cols-2 gap-4 mt-4">
                    {formData.attachments.map((file, index) => (
                      <li key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`attachment-${index}`}
                          className="w-32 h-32 object-cover border rounded-md shadow"
                        />
                        <button
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-sm"
                          onClick={() => handleDeleteFile(index)}
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>


                <div className="mb-8">
                    <button
                    type="submit"
                    className="bg-[#A14996] text-white px-4 py-2 rounded-md"
                    onClick={handleSubmit}
                    >
                    Submit
                    </button>
                </div>
            </div>
          </div>
        </div>
    )
}

export default SiteSurveyForm;