const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

// Reusable email sending function with template support
const sendEmail = async ({to, bcc, subject, text, templateName, templateData, attachment}) => {
  try {
    console.log({templateData})
    // Create a transporter using Gmail
    const transporter = nodemailer.createTransport({
      // host: 'smtp.gmail.com',
      host: process.env.GMAIL_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_EMAIL, // Your Gmail address
        pass: process.env.GMAIL_OAUTH, // Your Gmail password (or OAuth2 token if you prefer)
      },
      tls: {
        rejectUnauthorized: true
      }
    });

    transporter.verify(function (error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log("Server is ready to take our messages");
      }
    });

    const defaultHTML = '<p>This is a default HTML message.</p>'
    let renderHtml

    try {
      // Try to render the EJS template with the data
      const templatePath = path.join(__dirname, '../assets/templates', `${templateName}.ejs`);
      renderHtml = await ejs.renderFile(templatePath, templateData || {});

      console.log({renderHtml})
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
      replyTo: 'fauzanamrian12@gmail.com', // The email where replies should be sent
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
