import RNPrint from 'react-native-print';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

export interface CertificateData {
  studentName: string;
  rollNo?: string;
  department?: string;
  year?: string;
  semester?: string;
  purpose: string;
  requestedAt?: Date;
  approvedAt?: Date;
  teacherName?: string;
  teacherSignature?: string; // base64 image data
}

/**
 * Generates the HTML string for the Bonafide Certificate
 */
const generateCertificateHTML = (data: CertificateData): string => {
  const dateFormatted = data.approvedAt 
    ? data.approvedAt.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
    <html>
      <head>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 40px;
            color: #333;
          }
          .certificate-container {
            border: 10px solid #1e3a8a; /* Deep blue border */
            padding: 50px;
            text-align: center;
            position: relative;
            min-height: 800px;
          }
          .header {
            margin-bottom: 40px;
          }
          .institution-name {
            font-size: 32px;
            font-weight: bold;
            color: #1e3a8a;
            margin: 0;
            text-transform: uppercase;
          }
          .institution-sub {
            font-size: 16px;
            color: #666;
            margin-top: 5px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            text-decoration: underline;
            margin: 40px 0;
            color: #111;
          }
          .content {
            font-size: 20px;
            line-height: 2;
            text-align: justify;
            margin: 0 40px;
          }
          .highlight {
            font-weight: bold;
            border-bottom: 1px dotted #333;
            padding: 0 10px;
          }
          .footer {
            margin-top: 100px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 0 40px;
          }
          .signature-box {
            text-align: center;
            width: 200px;
          }
          .signature-img {
            max-width: 180px;
            max-height: 80px;
            margin-bottom: 10px;
          }
          .signature-line {
            border-top: 2px solid #333;
            margin-top: 10px;
            padding-top: 5px;
            font-weight: bold;
          }
          .date-box {
            text-align: left;
            font-size: 18px;
            font-weight: bold;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            color: rgba(30, 58, 138, 0.05);
            font-weight: bold;
            z-index: -1;
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="watermark">ACAMS</div>
          
          <div class="header">
            <h1 class="institution-name">ACAMS Institution of Technology</h1>
            <p class="institution-sub">Excellence in Education</p>
          </div>

          <div class="title">BONAFIDE CERTIFICATE</div>

          <div class="content">
            This is to certify that Mr./Ms. <span class="highlight">${data.studentName}</span>, 
            Roll No. <span class="highlight">${data.rollNo || '________'}</span>, is a bonafide student of this institution, 
            studying in the <span class="highlight">${data.year || '____'}</span> year / 
            <span class="highlight">${data.semester || '____'}</span> semester, 
            Department of <span class="highlight">${data.department || '________'}</span>.
            <br><br>
            This certificate is issued on the student's request for the purpose of 
            <span class="highlight">${data.purpose}</span>.
            <br><br>
            To the best of our knowledge, the student bears a good moral character and conduct.
          </div>

          <div class="footer">
            <div class="date-box">
              Date: ${dateFormatted}
            </div>
            
            <div class="signature-box">
              ${data.teacherSignature 
                ? `<img src="${data.teacherSignature}" class="signature-img" />` 
                : '<div style="height: 80px;"></div>'}
              <div class="signature-line">
                ${data.teacherName || 'Authorized Signatory'}<br>
                <span style="font-size: 14px; font-weight: normal;">Authorized Signatory</span>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Print the bonafide certificate using the device's native print dialogue
 */
export const printBonafideCertificate = async (data: CertificateData): Promise<void> => {
  try {
    const htmlString = generateCertificateHTML(data);
    await RNPrint.print({
      html: htmlString,
    });
  } catch (error) {
    console.error('Print Error:', error);
    throw error;
  }
};

/**
 * Generate a PDF file of the bonafide certificate (optional)
 * Returns the file path
 */
export const generateBonafidePDF = async (data: CertificateData): Promise<string> => {
  try {
    const htmlString = generateCertificateHTML(data);
    let options = {
      html: htmlString,
      fileName: `Bonafide_${data.studentName.replace(/\s+/g, '_')}`,
      directory: 'Documents',
    };
    
    const file = await RNHTMLtoPDF.convert(options);
    return file.filePath || '';
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};
