import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import s3 from '@/components/utils/awsConfig';

export async function POST(req) {
  try {
    const { orderData, formData } = await req.json();

    // Create a PDF document
    const doc = new PDFDocument();
    const chunks = [];

    // Collect PDF chunks
    doc.on('data', chunk => chunks.push(chunk));

    // Write PDF content
    doc.fontSize(20).text('Site Survey Details', { align: 'center' });
    doc.moveDown();

    // Customer Information
    doc.fontSize(16).text('Customer Information');
    doc.fontSize(12);
    doc.text(`Customer Name: ${orderData.customer.name}`);
    doc.text(`Email: ${orderData.customer.email}`);
    doc.text(`Mobile: ${orderData.customer.mobile}`);
    doc.moveDown();

    // Add other sections as in your original code...

    // Finalize the PDF
    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          const filename = `site-survey-${orderData._id}-${Date.now()}.pdf`;
          
          const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: filename,
            Body: pdfBuffer,
            ContentType: 'application/pdf'
          };

          const uploadResult = await s3.upload(uploadParams).promise();
          
          resolve(NextResponse.json({ 
            success: true, 
            pdfUrl: uploadResult.Location 
          }));
        } catch (error) {
          reject(NextResponse.json({ 
            success: false, 
            error: error.message 
          }, { status: 500 }));
        }
      });
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}