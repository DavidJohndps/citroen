const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

// Reusable email sending function with template support
const sendEmail = async ({to, bcc, subject, text, templateName, templateData, attachment}) => {
  try {
    // Create a transporter using Gmail
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_EMAIL, // Your Gmail address
        pass: process.env.GMAIL_OAUTH, // Your Gmail password (or OAuth2 token if you prefer)
      },
    });

    const defaultHTML = '<p>This is a default HTML message.</p>'
    let renderHtml

    try {
      // Try to render the EJS template with the data
      const templatePath = path.join(__dirname, 'templates', `${templateName}.ejs`);
      renderHtml = await ejs.renderFile(templatePath, templateData || {});

      // If renderHtml is empty or undefined, use default HTML
      if (!renderHtml) {
        console.log('Rendered HTML is empty. Using default HTML.');
        renderHtml = text;
      }
    } catch (error) {
      renderHtml = text;
    }

    // Define the email options
    const mailOptions = {
      from: process.env.GMAIL_EMAIL, // Sender's email address
      to: to, // Recipient's email address
      bcc,
      subject: subject, // Subject line
    };

    if(renderHtml) mailOptions.html = renderHtml // HTML body from the template
    else mailOptions.text = text
    if(attachment) mailOptions.attachments = [
      {...attachment}
    ]

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: 'Failed to send email', error };
  }
};

module.exports = sendEmail;
