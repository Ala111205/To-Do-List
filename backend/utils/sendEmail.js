const SibApiV3Sdk = require("sib-api-v3-sdk");

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

async function sendEmail(to, subject, htmlContent) {
  try {
    await tranEmailApi.sendTransacEmail({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: "To-Do List App",
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    });

    return true;
  } catch (error) {
    console.error(
      "Brevo email failed:",
      error.response?.text || error.message
    );
    console.log("FULL BREVO ERROR:", error);
    return false;
  }
}

module.exports = sendEmail;