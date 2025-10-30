const SibApiV3Sdk = require("sib-api-v3-sdk");

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

async function sendEmail(to, subject, htmlContent) {
  try {
    const sender = {
      email: "sadham070403@gmail.com",
      name: "To-Do List App",
    };

    const receivers = [{ email: to }];

    const response = await tranEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject,
      htmlContent,
    });

    console.log("✅ Email sent:", response);
  } catch (error) {
    console.error("❌ Error sending email:", error.response?.text || error.message);
    throw error;
  }
}

module.exports = sendEmail;