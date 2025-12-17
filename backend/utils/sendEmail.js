const SibApiV3Sdk = require("sib-api-v3-sdk");

if (!process.env.BREVO_API_KEY) {
  throw new Error("BREVO_API_KEY missing");
}
if (!process.env.BREVO_SENDER_EMAIL) {
  throw new Error("BREVO_SENDER_EMAIL missing");
}

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

async function sendEmail(to, subject, htmlContent) {
  try {
    const response = await tranEmailApi.sendTransacEmail({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: "To-Do List App",
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    });

    console.log("✅ Email sent:", response.messageId || response);
    return true;
  } catch (error) {
    console.error(
      "❌ Brevo email failed:",
      error.response?.text || error.message
    );
    return false; // DO NOT throw
  }
}

module.exports = sendEmail;