import nodemailer from 'nodemailer';

export async function sendEmailWithAttachment(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
  pdfBuffer?: Buffer;
  pdfFilename?: string;
  contentType?: string;
}) {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465');
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.SMTP_FROM || 'LeetCode Mentor <your-email@gmail.com>';

  // Check if SMTP is configured
  if (!user || !pass) {
    console.warn('SMTP is not fully configured. Outputting email payload to terminal for demonstration:');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Text preview:', options.text.substring(0, 100));
    console.log('Has PDF Attachment:', !!options.pdfBuffer);
    return { success: true, mocked: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000, // 10 seconds timeout
    socketTimeout: 10000,     // 10 seconds timeout
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.pdfBuffer
      ? [
          {
            filename: options.pdfFilename || 'leetcode-revision-report.pdf',
            content: options.pdfBuffer,
            contentType: options.contentType || 'application/pdf',
          },
        ]
      : [],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
