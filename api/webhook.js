module.exports = async function handler(req, res) {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "vinyans_verify_2026";

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

  // Incoming WhatsApp messages
  if (req.method === "POST") {
    console.log("Webhook received:", JSON.stringify(req.body, null, 2));

    return res.status(200).json({ status: "received" });
  }

  return res.status(405).send("Method not allowed");
};
