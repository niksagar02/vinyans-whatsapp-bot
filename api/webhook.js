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

// Only accept POST webhook events after verification
if (req.method !== "POST") {
return res.status(405).send("Method not allowed");
}

try {
console.log(
"Webhook received:",
JSON.stringify(req.body, null, 2)
);


const value =
  req.body?.entry?.[0]?.changes?.[0]?.value;

const message = value?.messages?.[0];

// Ignore delivery reports and events without a new message
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

const sendWhatsAppMessage = async (payload) => {
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
        ...payload
      })
    }
  );

  const responseData = await whatsappResponse.json();

  if (!whatsappResponse.ok) {
    console.error(
      "WhatsApp reply failed:",
      JSON.stringify(responseData, null, 2)
    );

    throw new Error("WhatsApp API reply failed");
  }

  console.log(
    "WhatsApp reply sent:",
    JSON.stringify(responseData, null, 2)
  );
};

const sendText = async (text) => {
  await sendWhatsAppMessage({
    type: "text",
    text: {
      preview_url: false,
      body: text
    }
  });
};

const sendList = async ({
  body,
  buttonText,
  sectionTitle,
  rows
}) => {
  await sendWhatsAppMessage({
    type: "interactive",
    interactive: {
      type: "list",
      body: {
        text: body
      },
      action: {
        button: buttonText,
        sections: [
          {
            title: sectionTitle,
            rows
          }
        ]
      }
    }
  });
};

const sendDegreeQuestion = async () => {
  await sendList({
    body:
      "Hi! Welcome to Vinyans India. 👋\n\nLet me ask you a few quick questions so our team can understand what you need and guide you better.\n\nWhat degree are you targeting?",
    buttonText: "Choose degree",
    sectionTitle: "Degree options",
    rows: [
      {
        id: "degree_bachelors",
        title: "Bachelor's",
        description: "BA, BSc, BEng, BBA, etc."
      },
      {
        id: "degree_masters",
        title: "Master's",
        description: "MA, MS, MSc, MBA, etc."
      },
      {
        id: "degree_doctoral",
        title: "Doctoral",
        description: "PhD, EdD, DBA, etc."
      },
      {
        id: "degree_postdoc",
        title: "Postdoc",
        description: "Research fellow or associate"
      }
    ]
  });
};

const sendCountryQuestion = async () => {
  await sendList({
    body: "Which country are you targeting?",
    buttonText: "Choose country",
    sectionTitle: "Country options",
    rows: [
      {
        id: "country_usa_canada",
        title: "USA / Canada"
      },
      {
        id: "country_uk",
        title: "UK"
      },
      {
        id: "country_australia",
        title: "Australia"
      },
      {
        id: "country_germany_europe",
        title: "Germany / Europe"
      },
      {
        id: "country_not_decided",
        title: "Not decided yet"
      },
      {
        id: "country_custom",
        title: "Other country",
        description: "Type your preferred country"
      }
    ]
  });
};

const sendJourneyQuestion = async () => {
  await sendList({
    body: "Where are you in your study-abroad journey?",
    buttonText: "Choose stage",
    sectionTitle: "Journey stage",
    rows: [
      {
        id: "journey_exploring",
        title: "Just exploring",
        description: "I am at an early stage"
      },
      {
        id: "journey_researching",
        title: "Researching",
        description: "Comparing programs and countries"
      },
      {
        id: "journey_ready",
        title: "Ready to apply"
      },
      {
        id: "journey_applied",
        title: "Already applied",
        description: "I may need visa support"
      },
      {
        id: "journey_custom",
        title: "Other stage",
        description: "Type your current stage"
      }
    ]
  });
};

const sendNeedQuestion = async () => {
  await sendList({
    body: "What do you need most right now?",
    buttonText: "Choose support",
    sectionTitle: "Support needed",
    rows: [
      {
        id: "need_shortlisting",
        title: "University shortlist"
      },
      {
        id: "need_funding",
        title: "Scholarships / funding"
      },
      {
        id: "need_sop_lor",
        title: "SOP / LOR support"
      },
      {
        id: "need_visa",
        title: "Visa guidance"
      },
      {
        id: "need_mentor",
        title: "Speak to a mentor"
      },
      {
        id: "need_custom",
        title: "Other support",
        description: "Type what you need"
      }
    ]
  });
};

const sendCandidateDetailsQuestion = async () => {
  await sendText(
    "Thank you! Please share your details in this format so our team can review them:\n\nName:\nCurrent qualification:\nCGPA/Percentage:\nTarget intake, if decided:\n\nA Vinyans mentor will reach out to you shortly.\n\nType MENU anytime to start over."
  );
};

const messageText =
  message.type === "text"
    ? message.text?.body?.trim() || ""
    : "";

const normalizedText = messageText.toLowerCase();

const selectedOptionId =
  message.interactive?.list_reply?.id ||
  message.interactive?.button_reply?.id ||
  "";

// Start or restart the chatbot
if (
  [
    "hi",
    "hello",
    "hey",
    "menu",
    "start",
    "vinyans",
    "profile"
  ].includes(normalizedText)
) {
  await sendDegreeQuestion();

  return res.status(200).json({
    status: "degree question sent"
  });
}

// Degree selected
if (selectedOptionId.startsWith("degree_")) {
  await sendCountryQuestion();

  return res.status(200).json({
    status: "country question sent"
  });
}

// Country selected
if (selectedOptionId === "country_custom") {
  await sendText(
    "Sure. Please type your preferred country like this:\n\nCOUNTRY: France"
  );

  return res.status(200).json({
    status: "custom country requested"
  });
}

if (selectedOptionId.startsWith("country_")) {
  await sendJourneyQuestion();

  return res.status(200).json({
    status: "journey question sent"
  });
}

if (normalizedText.startsWith("country:")) {
  await sendJourneyQuestion();

  return res.status(200).json({
    status: "custom country received"
  });
}

// Journey selected
if (selectedOptionId === "journey_custom") {
  await sendText(
    "Sure. Please type your current stage like this:\n\nJOURNEY: I have shortlisted three universities"
  );

  return res.status(200).json({
    status: "custom journey requested"
  });
}

if (selectedOptionId.startsWith("journey_")) {
  await sendNeedQuestion();

  return res.status(200).json({
    status: "support question sent"
  });
}

if (normalizedText.startsWith("journey:")) {
  await sendNeedQuestion();

  return res.status(200).json({
    status: "custom journey received"
  });
}

// Support selected
if (selectedOptionId === "need_custom") {
  await sendText(
    "Sure. Please type what you need like this:\n\nNEED: I need help choosing the right course"
  );

  return res.status(200).json({
    status: "custom support requested"
  });
}

if (selectedOptionId.startsWith("need_")) {
  await sendCandidateDetailsQuestion();

  return res.status(200).json({
    status: "candidate details requested"
  });
}

if (normalizedText.startsWith("need:")) {
  await sendCandidateDetailsQuestion();

  return res.status(200).json({
    status: "custom support received"
  });
}

// Candidate details received
const appearsToContainCandidateDetails =
  normalizedText.includes("name:") &&
  (
    normalizedText.includes("qualification:") ||
    normalizedText.includes("current qualification:")
  );

if (appearsToContainCandidateDetails) {
  await sendText(
    "Thank you! We have received your details successfully. A Vinyans mentor will review them and contact you shortly.\n\nType MENU anytime to start again."
  );

  return res.status(200).json({
    status: "candidate details received"
  });
}

// Fallback response
await sendText(
  'Please type "MENU" to begin or restart the Vinyans questionnaire.'
);

return res.status(200).json({
  status: "menu instruction sent"
});


} catch (error) {
console.error("Webhook processing error:", error);


return res.status(200).json({
  status: "message received but processing failed"
});


}
};
