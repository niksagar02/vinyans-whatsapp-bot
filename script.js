const chat = document.querySelector("#chat");
const form = document.querySelector("#composer");
const input = document.querySelector("#messageInput");

let stepIndex = 0;
let awaitingCustomAnswer = false;
let awaitingCandidateDetails = false;
const answers = {};

const steps = [
  {
    key: "degree",
    question: "What degree are you targeting?",
    options: [
      {
        id: "bachelors",
        title: "Bachelor's",
        description: "BA, BSc, BEng, BBA, etc.",
      },
      {
        id: "masters",
        title: "Master's",
        description: "MA, MS, MSc, MBA, etc.",
      },
      {
        id: "doctoral",
        title: "Doctoral",
        description: "PhD, EdD, DBA, etc.",
      },
      {
        id: "postdoc",
        title: "Postdoc",
        description: "Research fellow, postdoc associate, etc.",
      },
    ],
  },
  {
    key: "country",
    question: "Which country are you targeting?",
    options: [
      { id: "usa_canada", title: "USA / Canada" },
      { id: "uk", title: "UK" },
      { id: "australia", title: "Australia" },
      { id: "germany_europe", title: "Germany / Europe" },
      { id: "not_decided", title: "Not decided yet" },
      {
        id: "custom_country",
        title: "Other country",
        description: "I will type my preference",
        customPrompt: "Sure. Please type your preferred country.",
      },
    ],
  },
  {
    key: "journey",
    question: "Where are you in your journey?",
    options: [
      { id: "exploring", title: "Just exploring", description: "Early stage" },
      {
        id: "researching",
        title: "Researching universities",
        description: "Comparing countries and programs",
      },
      { id: "ready", title: "Ready to apply" },
      {
        id: "visa",
        title: "Already applied",
        description: "Need help with visa",
      },
      {
        id: "custom_journey",
        title: "Other stage",
        description: "I will type where I am",
        customPrompt: "Sure. Please type where you are in your study abroad journey.",
      },
    ],
  },
  {
    key: "need",
    question: "What do you need most right now?",
    options: [
      { id: "shortlisting", title: "University shortlisting" },
      { id: "funding", title: "Scholarships / funding" },
      { id: "sop_lor", title: "SOP / LOR support" },
      { id: "visa_guidance", title: "Visa guidance" },
      {
        id: "mentor",
        title: "Not sure",
        description: "I want to speak to a mentor",
      },
      {
        id: "custom_need",
        title: "Other need",
        description: "I will type what I need",
        customPrompt: "Sure. Please type what you need help with right now.",
      },
    ],
  },
];

function addMessage(text, who = "bot") {
  const bubble = document.createElement("div");
  bubble.className = `message ${who}`;
  bubble.textContent = text;
  chat.append(bubble);
  chat.scrollTop = chat.scrollHeight;
}

function addOptions(options, onPick) {
  const wrap = document.createElement("div");
  wrap.className = "options";

  options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option";
    button.type = "button";
    button.innerHTML = `<strong>${option.title}</strong>${
      option.description ? `<span>${option.description}</span>` : ""
    }`;
    button.addEventListener("click", () => {
      addMessage(option.title, "user");
      wrap.remove();
      onPick(option);
    });
    wrap.append(button);
  });

  chat.append(wrap);
  chat.scrollTop = chat.scrollHeight;
}

function startFlow() {
  stepIndex = 0;
  awaitingCustomAnswer = false;
  awaitingCandidateDetails = false;
  Object.keys(answers).forEach((key) => delete answers[key]);
  chat.innerHTML = "";

  addMessage(
    "Hi! Welcome to Vinyans India. 👋\n\nLet me ask you a few quick questions so our team can understand what you need and guide you better.",
  );
  showStep();
}

function showStep() {
  awaitingCustomAnswer = false;
  const step = steps[stepIndex];
  if (!step) {
    finishFlow();
    return;
  }

  addMessage(step.question);
  addOptions(step.options, (option) => {
    if (option.customPrompt) {
      awaitingCustomAnswer = true;
      addMessage(option.customPrompt);
      return;
    }

    answers[step.key] = option.title;
    stepIndex += 1;
    showStep();
  });
}

function finishFlow() {
  awaitingCandidateDetails = true;
  addMessage(
    "Thank you! Please share your details in this format so it is easy for our team to review:\n\nName:\nCurrent qualification:\nCGPA/Percentage:\nTarget intake, if decided:\n\nA Vinyans mentor will reach out to you shortly.\n\nType MENU anytime to start over.",
  );
}

function handleUserText(raw) {
  const text = raw.trim();
  if (!text) return;

  addMessage(text, "user");
  const normalized = text.toLowerCase();

  if (["hi", "hello", "hey", "menu", "start", "vinyans", "profile"].includes(normalized)) {
    startFlow();
    return;
  }

  if (awaitingCustomAnswer) {
    const step = steps[stepIndex];
    answers[step.key] = text;
    awaitingCustomAnswer = false;
    stepIndex += 1;
    showStep();
    return;
  }

  if (awaitingCandidateDetails) {
    awaitingCandidateDetails = false;
    addMessage(
      "Thanks. We have the details for this preview.\n\nIn the real WhatsApp bot, this reply can be sent to your team or saved as a lead.",
    );
    return;
  }

  addMessage('Please choose one of the options above, or type "MENU" to start over.');
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  handleUserText(input.value);
  input.value = "";
});

startFlow();
