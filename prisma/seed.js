const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const crypto = require("crypto");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: ["info", "warn", "error"],
});

// Hash password helper using PBKDF2
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Seeding MindSpark Database...");

  // 1. Seed Badges
  const badges = [
    {
      name: "First Step",
      description: "Completed your first study assessment!",
      icon: "Award",
      xpRequired: 10,
    },
    {
      name: "Scholar",
      description: "Reached Level 2 by earning 100+ XP!",
      icon: "GraduationCap",
      xpRequired: 100,
    },
    {
      name: "Mastermind",
      description: "Achieved a perfect score on any assessment!",
      icon: "Brain",
      xpRequired: 0,
    },
    {
      name: "Speed Demon",
      description: "Completed a Timed Quiz with 80% accuracy or higher!",
      icon: "Zap",
      xpRequired: 0,
    },
    {
      name: "Centurion",
      description: "Earned a total of 1000 XP!",
      icon: "Crown",
      xpRequired: 1000,
    },
    {
      name: "Flawless First Run",
      description: "Earned a perfect score on your first attempt of an assessment with no retakes!",
      icon: "Gem",
      xpRequired: 0,
    },
  ];

  // Load 200 generated badges from badges.json
  try {
    const fs = require("fs");
    const path = require("path");
    const generatedBadges = JSON.parse(
      fs.readFileSync(path.join(__dirname, "badges.json"), "utf8")
    );
    badges.push(...generatedBadges);
  } catch (err) {
    console.warn("Could not load generated badges:", err);
  }

  console.log(`Seeding milestone badges (${badges.length} total)...`);
  for (const b of badges) {
    await prisma.badge.upsert({
      where: { name: b.name },
      update: {},
      create: b,
    });
  }

  // 2. Create Demo User
  console.log("Creating demo student account...");
  const demoEmail = "demo@mindspark.edu";
  const passwordHash = hashPassword("password123");
  
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      xp: 140,
      level: 2,
    },
    create: {
      email: demoEmail,
      name: "Demo Student",
      passwordHash,
      xp: 140,
      level: 2,
    },
  });

  // Unlock "First Step" and "Scholar" badges for the demo user
  const firstStepBadge = await prisma.badge.findUnique({ where: { name: "First Step" } });
  const scholarBadge = await prisma.badge.findUnique({ where: { name: "Scholar" } });
  
  if (firstStepBadge) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: user.id, badgeId: firstStepBadge.id } },
      update: {},
      create: { userId: user.id, badgeId: firstStepBadge.id },
    });
  }

  if (scholarBadge) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: user.id, badgeId: scholarBadge.id } },
      update: {},
      create: { userId: user.id, badgeId: scholarBadge.id },
    });
  }

  // 3. Create Sample Document
  console.log("Creating sample AI document...");
  const doc = await prisma.document.create({
    data: {
      userId: user.id,
      title: "Introduction to Artificial Intelligence",
      fileType: "pdf",
      fileSize: 154200,
      status: "COMPLETED",
      content: "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn. The term is also applied to any machine that exhibits traits associated with a human mind such as learning and problem-solving. AI has various subfields including Machine Learning, which focuses on training algorithms to recognize patterns, and Deep Learning, which uses artificial neural networks inspired by the structure of the brain. Natural Language Processing (NLP) enables machines to understand human language, while Computer Vision allows systems to parse visual inputs. Turing Test is a historical benchmark for machine intelligence proposed by Alan Turing. Supervised Learning utilizes labeled datasets, whereas Unsupervised Learning works on unlabeled data to find hidden groupings.",
    },
  });

  // 4. Create Sample Reviewer Notes
  console.log("Creating sample reviewer notes...");
  const reviewerNotes = [
    {
      sectionTitle: "Core Concepts of AI",
      bullets: [
        "Artificial Intelligence (AI) simulates human reasoning, learning, and decision-making capabilities inside machine algorithms.",
        "The Turing Test, designed by Alan Turing in 1950, is a foundational benchmark for measuring a machine's ability to exhibit intelligent behavior equivalent to or indistinguishable from a human.",
        "AI applications span cross-disciplinary domains including autonomous driving, medical diagnoses, robotic automation, and search ranking."
      ],
      keyTerms: [
        { term: "Artificial Intelligence", definition: "The science of training computers to perform tasks that typically require human intelligence." },
        { term: "Turing Test", definition: "A test of a machine's capability to demonstrate intelligent behavior indistinguishable from a human." }
      ]
    },
    {
      sectionTitle: "Subfields of Artificial Intelligence",
      bullets: [
        "Machine Learning (ML) is a core subset of AI focused on developing systems that learn and improve from experience without explicit programming.",
        "Deep Learning (DL) leverages multi-layered artificial neural networks (inspired by biological brains) to parse complex representations.",
        "Natural Language Processing (NLP) covers computational linguistics, enabling machines to read, translate, and synthesize human languages.",
        "Computer Vision allows computer systems to capture and analyze digital images or videos to extract high-level visual understanding."
      ],
      keyTerms: [
        { term: "Machine Learning", definition: "A subfield of AI focused on algorithms that learn patterns from datasets to make predictions." },
        { term: "Deep Learning", definition: "A subset of machine learning based on artificial neural networks with multiple representation layers." },
        { term: "Natural Language Processing", definition: "The domain of AI concerned with the interactions between computers and natural human languages." }
      ]
    },
    {
      sectionTitle: "Learning Paradigms in ML",
      bullets: [
        "Supervised Learning trains models on labeled historical datasets where both inputs and correct ground-truth outputs are provided.",
        "Unsupervised Learning groups unlabeled data based on hidden mathematical patterns, commonly used for clustering and dimensionality reduction."
      ],
      keyTerms: [
        { term: "Supervised Learning", definition: "A machine learning paradigm where the algorithm is trained on input-output pairs that are labeled." },
        { term: "Unsupervised Learning", definition: "A paradigm where models learn patterns from unlabeled data without human supervision." }
      ]
    }
  ];

  const reviewer = await prisma.reviewer.create({
    data: {
      documentId: doc.id,
      userId: user.id,
      title: doc.title,
      summary: "This reviewer covers the fundamentals of Artificial Intelligence, exploring core subfields like Machine Learning, Deep Learning, Natural Language Processing, and Computer Vision. It outlines key differences between Supervised and Unsupervised learning paradigms, and highlights Alan Turing's Turing Test as a benchmark for machine cognitive intelligence.",
      notesJson: JSON.stringify(reviewerNotes),
    },
  });

  // 5. Seed Assessments for the 7 Study Modes
  console.log("Generating demo assessments...");

  // Mode 1: Multiple Choice
  const mcQuestions = {
    questions: [
      {
        question: "Which subfield of AI is concerned with training computers to read, translate, and synthesize human languages?",
        options: ["Machine Learning", "Natural Language Processing", "Computer Vision", "Deep Learning"],
        correctIndex: 1,
        explanation: "Natural Language Processing (NLP) is the specific domain of AI dealing with how computers analyze and generate natural human languages."
      },
      {
        question: "What historical benchmark for machine intelligence evaluates if a machine's responses are indistinguishable from a human's?",
        options: ["The Turing Test", "The Feigenbaum Test", "The Turing Completeness", "The Neural Benchmark"],
        correctIndex: 0,
        explanation: "Proposed by Alan Turing in 1950, the Turing Test measures a machine's ability to exhibit intelligent behavior indistinguishable from a human."
      },
      {
        question: "Which learning paradigm relies on training models using datasets that contain both inputs and their corresponding correct labels?",
        options: ["Unsupervised Learning", "Reinforcement Learning", "Supervised Learning", "Self-Directed Learning"],
        correctIndex: 2,
        explanation: "Supervised Learning trains algorithms on labeled training datasets (input-output pairs) so the model can learn mapping rules."
      }
    ]
  };

  await prisma.assessment.create({
    data: {
      reviewerId: reviewer.id,
      userId: user.id,
      type: "MULTIPLE_CHOICE",
      title: "Multiple Choice Mode",
      questions: JSON.stringify(mcQuestions),
    },
  });

  // Mode 2: True/False
  const tfQuestions = {
    questions: [
      {
        statement: "Unsupervised learning requires labeled historical datasets to find mathematical clusters in data.",
        correctAnswer: false,
        explanation: "Unsupervised learning works on unlabeled data. Supervised learning is the paradigm that requires labeled datasets."
      },
      {
        statement: "Deep Learning uses artificial neural networks inspired by the biological structure of the brain.",
        correctAnswer: true,
        explanation: "Deep Learning utilizes artificial neural networks with multiple layers, modeled loosely on biological neural pathways in animal brains."
      },
      {
        statement: "Machine learning is a subset of artificial intelligence.",
        correctAnswer: true,
        explanation: "Yes, Machine Learning is a specific subfield within the broader domain of Artificial Intelligence."
      }
    ]
  };

  await prisma.assessment.create({
    data: {
      reviewerId: reviewer.id,
      userId: user.id,
      type: "TRUE_FALSE",
      title: "True or False Mode",
      questions: JSON.stringify(tfQuestions),
    },
  });

  // Mode 3: Fill in the Blanks
  const fibQuestions = {
    questions: [
      {
        text: "The [blank] proposed by Alan Turing is a historical benchmark, whereas [blank] learning trains models on labeled historical datasets.",
        answers: ["Turing Test", "Supervised"],
        explanation: "The Turing Test is a historical benchmark for intelligence, and Supervised learning is defined by its use of labeled training datasets."
      },
      {
        text: "Deep Learning uses multi-layered [blank] networks to parse representations, and NLP deals with [blank] languages.",
        answers: ["neural", "human"],
        explanation: "Deep learning operates using artificial neural networks, and NLP operates on natural human language interaction."
      }
    ]
  };

  await prisma.assessment.create({
    data: {
      reviewerId: reviewer.id,
      userId: user.id,
      type: "FILL_IN_THE_BLANK",
      title: "Fill in the Blanks Mode",
      questions: JSON.stringify(fibQuestions),
    },
  });

  // Mode 4: Matching Type
  const matchingQuestions = {
    pairs: [
      { left: "Computer Vision", right: "Parsing and understanding digital images or video frames." },
      { left: "Machine Learning", right: "Algorithms that improve iteratively from dataset patterns without explicit programming." },
      { left: "Deep Learning", right: "Multi-layered network models simulating brain nodes." },
      { left: "Turing Test", definition: "Alan Turing benchmark measuring conversational human equivalence." },
      { left: "Unsupervised Learning", right: "Grouping unlabeled data into natural mathematical patterns." }
    ]
  };

  // Fix: Matching format expects array of objects with left/right fields
  // Let's make sure the fourth pair has right instead of definition
  matchingQuestions.pairs[3].right = "Alan Turing benchmark measuring conversational human equivalence.";

  await prisma.assessment.create({
    data: {
      reviewerId: reviewer.id,
      userId: user.id,
      type: "MATCHING",
      title: "Matching Mode",
      questions: JSON.stringify(matchingQuestions),
    },
  });

  // Mode 5: Flashcards
  const flashcardQuestions = {
    flashcards: [
      { front: "Artificial Intelligence", back: "The science and engineering of making intelligent machines capable of cognitive tasks." },
      { front: "Turing Test", back: "An intelligence benchmark where a machine attempts to converse indistinguishably from a human." },
      { front: "Supervised Learning", back: "A model-training paradigm using explicit input-output labels." },
      { front: "Unsupervised Learning", back: "Grouping unlabeled dataset entries based on internal mathematical clustering." },
      { front: "Computer Vision", back: "AI subfield enabling machines to analyze and understand visual inputs like images and video." }
    ]
  };

  await prisma.assessment.create({
    data: {
      reviewerId: reviewer.id,
      userId: user.id,
      type: "FLASHCARD",
      title: "Flashcard Mode",
      questions: JSON.stringify(flashcardQuestions),
    },
  });

  // Mode 6: Identification
  const identQuestions = {
    questions: [
      {
        question: "What is the specific subfield of AI concerned with training models to recognize visual structures in images and videos?",
        answer: "Computer Vision",
        acceptedVariations: ["computer vision", "vision AI", "CV"],
        explanation: "Computer Vision is the subfield of AI that enables machines to process and interpret visual information from the world."
      },
      {
        question: "What is the machine learning paradigm that finds hidden structures or clusters in unlabeled data?",
        answer: "Unsupervised Learning",
        acceptedVariations: ["unsupervised learning", "unsupervised ML", "unsupervised"],
        explanation: "Unsupervised learning algorithms learn groupings and associations from unlabeled datasets without human direction."
      },
      {
        question: "Who designed the historical benchmark test for machine intelligence in 1950?",
        answer: "Alan Turing",
        acceptedVariations: ["alan turing", "Alan Mathison Turing", "Turing"],
        explanation: "British mathematician and computer scientist Alan Turing proposed the test (originally the Imitation Game) in 1950."
      }
    ]
  };

  await prisma.assessment.create({
    data: {
      reviewerId: reviewer.id,
      userId: user.id,
      type: "IDENTIFICATION",
      title: "Identification Mode",
      questions: JSON.stringify(identQuestions),
    },
  });

  // Mode 7: Timed Quiz
  const timedQuestions = {
    questions: [
      {
        question: "Which of the following is a subset of Machine Learning that utilizes multi-layered artificial neural networks?",
        options: ["Expert Systems", "Deep Learning", "Linear Regression", "Natural Language Processing"],
        correctIndex: 1,
        timeLimit: 12,
        explanation: "Deep Learning is a specialized subfield of Machine Learning utilizing multi-layered (deep) neural network models."
      },
      {
        question: "True or False: Alan Turing proposed the Turing Test in the year 2000.",
        options: ["True", "False"],
        correctIndex: 1, // index of False
        timeLimit: 10,
        explanation: "False. Alan Turing proposed the test in 1950 in his seminal paper 'Computing Machinery and Intelligence'."
      },
      {
        question: "Which learning paradigm relies on feedback loops from actions rather than static training databases?",
        options: ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Concept Learning"],
        correctIndex: 2,
        timeLimit: 15,
        explanation: "Reinforcement Learning relies on feedback (rewards/punishments) from actions taken in an environment to learn optimal behaviors."
      }
    ]
  };

  await prisma.assessment.create({
    data: {
      reviewerId: reviewer.id,
      userId: user.id,
      type: "TIMED",
      title: "Timed Quiz Mode",
      questions: JSON.stringify(timedQuestions),
    },
  });

  console.log("Database seeded successfully!");
  console.log("Demo Credentials:");
  console.log(`Email: ${demoEmail}`);
  console.log("Password: password123");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
