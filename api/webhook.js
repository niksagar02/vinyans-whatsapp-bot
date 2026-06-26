module.exports = async function handler(req, res) {
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Meta webhook verification
if (req.method === "GET") {
const mode = req.query["hub.mode"];
const token = req.query["hub.verify_token"];
const challenge = req.query["hub.challenge"];

  
if (mode === "subscribe" && token === VERIFY_TOKEN) {
  return res.status(200).send(challenge);
}

return res.status(403).send("Verification failed");


}

// Incoming WhatsApp webhook events
if (req.method === "POST") {
try {
console.log(
"Webhook received:",
JSON.stringify(req.body, null, 2)
);


  const value =
    req.body?.entry?.[0]?.changes?.[0]?.value;

  const message = value?.messages?.[0];

  // Ignore delivery updates and other events without a new message
  if (!message) {
    return res.status(200).json({
      status: "event received"
    });
  }

  const recipientNumber = message.from;

  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.error(
      "Required WhatsApp environment variables are missing."
    );

    return res.status(200).json({
      status: "message received but configuration is missing"
    });
  }

  const replyText =
    "Hi! Welcome to Vinyans India. Your message has been received successfully. Our WhatsApp bot is now connected.";

  const whatsappResponse = await fetch(
    `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientNumber,
        type: "text",
        text: {
          preview_url: false,
          body: replyText
        }
      })
    }
  );

  const responseData = await whatsappResponse.json();

  if (!whatsappResponse.ok) {
    console.error(
      "WhatsApp reply failed:",
      JSON.stringify(responseData, null, 2)
    );

    return res.status(200).json({
      status: "message received but reply failed"
    });
  }

  console.log(
    "WhatsApp reply sent:",
    JSON.stringify(responseData, null, 2)
  );

  return res.status(200).json({
    status: "message received and reply sent"
  });
} catch (error) {
  console.error("Webhook processing error:", error);

  return res.status(200).json({
    status: "message received but processing failed"
  });
}


}

return res.status(405).send("Method not allowed");
};
