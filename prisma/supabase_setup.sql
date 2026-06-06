-- Ensure we are operating in the public schema
SET search_path TO public;

-- Drop existing tables to ensure a clean slate setup
DROP TABLE IF EXISTS "UserBadge" CASCADE;
DROP TABLE IF EXISTS "UserProgress" CASCADE;
DROP TABLE IF EXISTS "Assessment" CASCADE;
DROP TABLE IF EXISTS "Reviewer" CASCADE;
DROP TABLE IF EXISTS "Document" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "Badge" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Drop existing views to prevent name collisions
DROP VIEW IF EXISTS "UserBadge" CASCADE;
DROP VIEW IF EXISTS "UserProgress" CASCADE;
DROP VIEW IF EXISTS "Assessment" CASCADE;
DROP VIEW IF EXISTS "Reviewer" CASCADE;
DROP VIEW IF EXISTS "Document" CASCADE;
DROP VIEW IF EXISTS "Session" CASCADE;
DROP VIEW IF EXISTS "Badge" CASCADE;
DROP VIEW IF EXISTS "User" CASCADE;

-- Drop existing types to prevent relation/composite type collisions
DROP TYPE IF EXISTS "UserBadge" CASCADE;
DROP TYPE IF EXISTS "UserProgress" CASCADE;
DROP TYPE IF EXISTS "Assessment" CASCADE;
DROP TYPE IF EXISTS "Reviewer" CASCADE;
DROP TYPE IF EXISTS "Document" CASCADE;
DROP TYPE IF EXISTS "Session" CASCADE;
DROP TYPE IF EXISTS "Badge" CASCADE;
DROP TYPE IF EXISTS "User" CASCADE;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "apiKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reviewer" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "notesJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reviewer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "questions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "timeSpentSeconds" INTEGER NOT NULL,
    "xpEarned" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "xpRequired" INTEGER NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_name_key" ON "Badge"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviewer" ADD CONSTRAINT "Reviewer_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviewer" ADD CONSTRAINT "Reviewer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Reviewer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Seed Badges
INSERT INTO "Badge" ("id", "name", "description", "icon", "xpRequired") VALUES
('1a33261a-8a7e-4050-bf8f-8b9a9d7bb3ff', 'First Step', 'Completed your first study assessment!', 'Award', 10),
('2b9bc081-e9e9-4467-bc2a-bb391f16efea', 'Scholar', 'Reached Level 2 by earning 100+ XP!', 'GraduationCap', 100),
('3cf6b0f1-a9b1-4d64-44cf-9f87ee479427', 'Mastermind', 'Achieved a perfect score on any assessment!', 'Brain', 0),
('4ddc7d4a-134c-4f9f-6395-b85e4a5d892d', 'Speed Demon', 'Completed a Timed Quiz with 80% accuracy or higher!', 'Zap', 0),
('5e2d6229-566a-47ca-bc8f-4f4d3246ebcf', 'Centurion', 'Earned a total of 1000 XP!', 'Crown', 1000),
('6ffbe2c0-282d-466d-a60d-13a48e77df1f', 'Flawless First Run', 'Earned a perfect score on your first attempt of an assessment with no retakes!', 'Gem', 0)
ON CONFLICT ("name") DO NOTHING;

-- Seed 200 More Badges
INSERT INTO "Badge" ("id", "name", "description", "icon", "xpRequired") VALUES
('56d408fd-38e0-427d-8ef8-9ce38c7d459a', 'Algorithmic Thinking Scholar', 'Achieved milestones in Algorithmic Thinking with 250+ XP.', 'Award', 250),
('1e394614-5487-4cc3-88da-b446d79a41c0', 'Algorithmic Thinking Virtuoso', 'Mastered advanced concepts in Algorithmic Thinking with 750+ XP.', 'Zap', 750),
('1eb7e366-59a9-4809-84e8-65450ff9c357', 'Quantum Mechanics Scholar', 'Achieved milestones in Quantum Mechanics with 250+ XP.', 'GraduationCap', 300),
('404b0aed-6959-456d-8b47-e5cbb519f261', 'Quantum Mechanics Virtuoso', 'Mastered advanced concepts in Quantum Mechanics with 750+ XP.', 'Crown', 800),
('e176cd54-a725-44fe-8b3f-e3d951a05646', 'Bioinformatics Scholar', 'Achieved milestones in Bioinformatics with 250+ XP.', 'Brain', 350),
('c933ff5f-26bf-4c4b-83fd-759d9647ac0f', 'Bioinformatics Virtuoso', 'Mastered advanced concepts in Bioinformatics with 750+ XP.', 'Gem', 850),
('b4423930-54da-4363-85ce-814745520a32', 'Historical Analysis Scholar', 'Achieved milestones in Historical Analysis with 250+ XP.', 'Zap', 400),
('61a94af7-2485-4c3a-82d0-a354df1d95e9', 'Historical Analysis Virtuoso', 'Mastered advanced concepts in Historical Analysis with 750+ XP.', 'Star', 900),
('c6e514d3-6164-45a3-80f0-43bd6b2a5d97', 'Literary Criticism Scholar', 'Achieved milestones in Literary Criticism with 250+ XP.', 'Crown', 450),
('ffaa2c8a-6206-4fe7-8990-bfe44ecd6b7f', 'Literary Criticism Virtuoso', 'Mastered advanced concepts in Literary Criticism with 750+ XP.', 'Award', 950),
('ab7eb251-a490-44f1-83b1-ce19ae98cf30', 'Microeconomics Scholar', 'Achieved milestones in Microeconomics with 250+ XP.', 'Gem', 500),
('6b8d5e74-811c-4465-809c-00be0afc0565', 'Microeconomics Virtuoso', 'Mastered advanced concepts in Microeconomics with 750+ XP.', 'GraduationCap', 1000),
('61898803-5d39-43ea-861d-189c32b6dc67', 'Macroeconomics Scholar', 'Achieved milestones in Macroeconomics with 250+ XP.', 'Star', 250),
('73b729a7-fc8f-41e2-8922-a02905d54909', 'Macroeconomics Virtuoso', 'Mastered advanced concepts in Macroeconomics with 750+ XP.', 'Brain', 750),
('5fd4f509-6411-400b-8237-6137de9788f5', 'Organic Chemistry Scholar', 'Achieved milestones in Organic Chemistry with 250+ XP.', 'Award', 300),
('541f20a0-c2b9-4381-894b-908262ae0913', 'Organic Chemistry Virtuoso', 'Mastered advanced concepts in Organic Chemistry with 750+ XP.', 'Zap', 800),
('aafdf4d1-1306-477e-8c7c-058142618ca5', 'Inorganic Chemistry Scholar', 'Achieved milestones in Inorganic Chemistry with 250+ XP.', 'GraduationCap', 350),
('bfac6a18-5c14-4fb5-895f-52fa0c4843cb', 'Inorganic Chemistry Virtuoso', 'Mastered advanced concepts in Inorganic Chemistry with 750+ XP.', 'Crown', 850),
('272496e2-7e6c-4e2d-80b0-15730f90ae70', 'Linear Algebra Scholar', 'Achieved milestones in Linear Algebra with 250+ XP.', 'Brain', 400),
('d0657cb2-505c-4596-8e58-c803bbf32512', 'Linear Algebra Virtuoso', 'Mastered advanced concepts in Linear Algebra with 750+ XP.', 'Gem', 900),
('6dda2a27-12ab-4642-8f33-48653cac6dcd', 'Multivariable Calculus Scholar', 'Achieved milestones in Multivariable Calculus with 250+ XP.', 'Zap', 450),
('62e62483-6442-4906-8d6c-eb990ae3297d', 'Multivariable Calculus Virtuoso', 'Mastered advanced concepts in Multivariable Calculus with 750+ XP.', 'Star', 950),
('94395ae6-5878-4a52-8c86-7a89059ffcd7', 'Statistical Analysis Scholar', 'Achieved milestones in Statistical Analysis with 250+ XP.', 'Crown', 500),
('1be069a0-435e-487f-80f7-2bae3902df7a', 'Statistical Analysis Virtuoso', 'Mastered advanced concepts in Statistical Analysis with 750+ XP.', 'Award', 1000),
('28519bc7-cb1f-40ff-81b7-61ebde63cb14', 'Data Science Scholar', 'Achieved milestones in Data Science with 250+ XP.', 'Gem', 250),
('6d78fe30-95e7-47aa-87d0-a2fe5fc7a1f1', 'Data Science Virtuoso', 'Mastered advanced concepts in Data Science with 750+ XP.', 'GraduationCap', 750),
('87eb3557-0557-4d30-835a-1680421a6057', 'Machine Learning Scholar', 'Achieved milestones in Machine Learning with 250+ XP.', 'Star', 300),
('ba2c5d0b-a959-4dc3-801f-467b6671c280', 'Machine Learning Virtuoso', 'Mastered advanced concepts in Machine Learning with 750+ XP.', 'Brain', 800),
('611e0bc0-d1b9-41c2-884b-845e39d45692', 'Deep Learning Scholar', 'Achieved milestones in Deep Learning with 250+ XP.', 'Award', 350),
('567d4092-4fda-4602-87e5-85b920fe20ab', 'Deep Learning Virtuoso', 'Mastered advanced concepts in Deep Learning with 750+ XP.', 'Zap', 850),
('c07ffa0b-4ea1-4cf8-8cf9-5912fc238187', 'Natural Language Processing Scholar', 'Achieved milestones in Natural Language Processing with 250+ XP.', 'GraduationCap', 400),
('1042b742-57e9-4a65-8213-56993d1cf3c7', 'Natural Language Processing Virtuoso', 'Mastered advanced concepts in Natural Language Processing with 750+ XP.', 'Crown', 900),
('0238cace-8506-48c9-84cf-5bf11261b3c6', 'Computer Vision Scholar', 'Achieved milestones in Computer Vision with 250+ XP.', 'Brain', 450),
('caaba7be-1069-4b84-85e1-51876769b85c', 'Computer Vision Virtuoso', 'Mastered advanced concepts in Computer Vision with 750+ XP.', 'Gem', 950),
('e7e55a3e-5a0c-4ffb-8ad2-68bb2e9e6cfc', 'Astrophysics Scholar', 'Achieved milestones in Astrophysics with 250+ XP.', 'Zap', 500),
('f5f9e53a-b4e9-4969-85eb-e1a33ef7ccca', 'Astrophysics Virtuoso', 'Mastered advanced concepts in Astrophysics with 750+ XP.', 'Star', 1000),
('d35caa33-658b-4bae-82ab-03e2d23d7ad4', 'Cosmology Scholar', 'Achieved milestones in Cosmology with 250+ XP.', 'Crown', 250),
('fb78b854-5f07-4bb4-8aad-adc27c3b69e7', 'Cosmology Virtuoso', 'Mastered advanced concepts in Cosmology with 750+ XP.', 'Award', 750),
('ae0c211f-bbf1-41fe-8ca3-3c7f3fc202b4', 'Neuroscience Scholar', 'Achieved milestones in Neuroscience with 250+ XP.', 'Gem', 300),
('3fbd327f-c514-4418-888a-829a305d31ab', 'Neuroscience Virtuoso', 'Mastered advanced concepts in Neuroscience with 750+ XP.', 'GraduationCap', 800),
('20aade4e-042b-4fc9-83a6-f8a37cad4674', 'Cognitive Psychology Scholar', 'Achieved milestones in Cognitive Psychology with 250+ XP.', 'Star', 350),
('9061a3aa-d003-4b93-806d-6dad090e85a1', 'Cognitive Psychology Virtuoso', 'Mastered advanced concepts in Cognitive Psychology with 750+ XP.', 'Brain', 850),
('3a53ac96-120d-47de-8328-8bad9204a9e1', 'Genetics Scholar', 'Achieved milestones in Genetics with 250+ XP.', 'Award', 400),
('b6f0b469-edc8-42d1-829a-0dc7dc350b1d', 'Genetics Virtuoso', 'Mastered advanced concepts in Genetics with 750+ XP.', 'Zap', 900),
('653c8e3f-23d6-452c-8e84-bb67cd917148', 'Evolutionary Biology Scholar', 'Achieved milestones in Evolutionary Biology with 250+ XP.', 'GraduationCap', 450),
('5a5f7920-16ba-4d42-8036-c0fa2220d884', 'Evolutionary Biology Virtuoso', 'Mastered advanced concepts in Evolutionary Biology with 750+ XP.', 'Crown', 950),
('b9a1186a-ace8-42e3-8ca8-188425572c89', 'Cell Biology Scholar', 'Achieved milestones in Cell Biology with 250+ XP.', 'Brain', 500),
('778ee391-743d-49c8-89f5-63e891debb30', 'Cell Biology Virtuoso', 'Mastered advanced concepts in Cell Biology with 750+ XP.', 'Gem', 1000),
('c4ab0bda-4e1f-4172-8500-6a15765cfbb5', 'Immunology Scholar', 'Achieved milestones in Immunology with 250+ XP.', 'Zap', 250),
('d2f0e25f-6c15-4453-8ffc-a50bca3ac7d1', 'Immunology Virtuoso', 'Mastered advanced concepts in Immunology with 750+ XP.', 'Star', 750),
('71f25d33-e764-4006-81bb-f77aaa40feed', 'Pathology Scholar', 'Achieved milestones in Pathology with 250+ XP.', 'Crown', 300),
('c8b1a196-86e3-407f-8dc0-5be9a1f9434a', 'Pathology Virtuoso', 'Mastered advanced concepts in Pathology with 750+ XP.', 'Award', 800),
('0ea7570b-86a4-4c1b-8f76-ae6cf2637ed0', 'Pharmacology Scholar', 'Achieved milestones in Pharmacology with 250+ XP.', 'Gem', 350),
('64daa589-6d54-45ec-83c6-ba3ffd1f1f0f', 'Pharmacology Virtuoso', 'Mastered advanced concepts in Pharmacology with 750+ XP.', 'GraduationCap', 850),
('2b7efceb-989c-4cf2-81ac-3afc8ed8e1be', 'Human Anatomy Scholar', 'Achieved milestones in Human Anatomy with 250+ XP.', 'Star', 400),
('6798e3ea-efee-443a-8bfe-23c19277aa0e', 'Human Anatomy Virtuoso', 'Mastered advanced concepts in Human Anatomy with 750+ XP.', 'Brain', 900),
('ac137fd4-54ed-489c-8ac1-60287e610341', 'Physiology Scholar', 'Achieved milestones in Physiology with 250+ XP.', 'Award', 450),
('cee12146-2260-45cc-8ad4-9a4b27578eca', 'Physiology Virtuoso', 'Mastered advanced concepts in Physiology with 750+ XP.', 'Zap', 950),
('e7cc605d-ff2a-4c33-814c-2927feed6605', 'World Geography Scholar', 'Achieved milestones in World Geography with 250+ XP.', 'GraduationCap', 500),
('a1dee90e-b552-4cfa-8b75-868cf1a57f3a', 'World Geography Virtuoso', 'Mastered advanced concepts in World Geography with 750+ XP.', 'Crown', 1000),
('7e6b0528-44d4-4c0e-8f1b-0ac06397c6ab', 'Cartography Scholar', 'Achieved milestones in Cartography with 250+ XP.', 'Brain', 250),
('37621d2a-43f2-47ce-86d3-ef7e62549eb8', 'Cartography Virtuoso', 'Mastered advanced concepts in Cartography with 750+ XP.', 'Gem', 750),
('426459cb-9d3b-4973-80da-acceefd7a8e8', 'Sociology Scholar', 'Achieved milestones in Sociology with 250+ XP.', 'Zap', 300),
('f0a23ab9-4b22-4cca-813f-c5ecd8dae4ae', 'Sociology Virtuoso', 'Mastered advanced concepts in Sociology with 750+ XP.', 'Star', 800),
('2ed303ec-1a9b-42a3-8b00-f64df724a9fc', 'Developmental Psychology Scholar', 'Achieved milestones in Developmental Psychology with 250+ XP.', 'Crown', 350),
('d86be97c-05cf-4267-8895-2c8d92e1deb9', 'Developmental Psychology Virtuoso', 'Mastered advanced concepts in Developmental Psychology with 750+ XP.', 'Award', 850),
('04a924a1-702b-4cf1-81f4-8d7360e33734', 'Epistemology Scholar', 'Achieved milestones in Epistemology with 250+ XP.', 'Gem', 400),
('25b739fa-50d5-4d7d-8688-989f8aa383f7', 'Epistemology Virtuoso', 'Mastered advanced concepts in Epistemology with 750+ XP.', 'GraduationCap', 900),
('460e7675-5bfb-4992-80d7-8d104b65dfba', 'Ethics Scholar', 'Achieved milestones in Ethics with 250+ XP.', 'Star', 450),
('5f0345b1-e6d1-4176-88b7-3024c947b061', 'Ethics Virtuoso', 'Mastered advanced concepts in Ethics with 750+ XP.', 'Brain', 950),
('8e440523-dfa3-4104-888c-76e1f5539fcf', 'Classical Literature Scholar', 'Achieved milestones in Classical Literature with 250+ XP.', 'Award', 500),
('a08c98c3-0fc1-487e-80d2-d3df92c50f43', 'Classical Literature Virtuoso', 'Mastered advanced concepts in Classical Literature with 750+ XP.', 'Zap', 1000),
('13a0ec3d-0250-4203-8d8a-a045c65397f7', 'Modern History Scholar', 'Achieved milestones in Modern History with 250+ XP.', 'GraduationCap', 250),
('4637769e-8d3b-4c9a-8622-b94d70731f4a', 'Modern History Virtuoso', 'Mastered advanced concepts in Modern History with 750+ XP.', 'Crown', 750),
('0b46523c-7865-4970-8389-20cb6c290530', 'Ancient Archaeology Scholar', 'Achieved milestones in Ancient Archaeology with 250+ XP.', 'Brain', 300),
('82a8dd7c-79dc-430a-8c2f-1c660ec9b459', 'Ancient Archaeology Virtuoso', 'Mastered advanced concepts in Ancient Archaeology with 750+ XP.', 'Gem', 800),
('f788b0f8-9584-4438-893e-e36e730c3623', 'Anthropology Scholar', 'Achieved milestones in Anthropology with 250+ XP.', 'Zap', 350),
('bda58002-78be-4468-8363-e77972fc367b', 'Anthropology Virtuoso', 'Mastered advanced concepts in Anthropology integrates with 750+ XP.', 'Star', 850),
('41030ec0-d332-4b9a-881b-8889879538dc', 'Creative Writing Scholar', 'Achieved milestones in Creative Writing with 250+ XP.', 'Crown', 400),
('6d992f41-0a48-454f-8364-77e1e2eb4301', 'Creative Writing Virtuoso', 'Mastered advanced concepts in Creative Writing with 750+ XP.', 'Award', 900),
('d747d0e5-c663-489a-8d0d-e19296868cde', 'Poetry Scholar', 'Achieved milestones in Poetry with 250+ XP.', 'Gem', 450),
('8eb0c0c9-27a9-41e8-88da-52c062172e69', 'Poetry Virtuoso', 'Mastered advanced concepts in Poetry with 750+ XP.', 'GraduationCap', 950),
('75b9abb0-6996-4497-8e5d-32776a1ed5b8', 'Linguistics Scholar', 'Achieved milestones in Linguistics with 250+ XP.', 'Star', 500),
('94092b8d-13f1-4746-82e6-512d5d9235ed', 'Linguistics Virtuoso', 'Mastered advanced concepts in Linguistics with 750+ XP.', 'Brain', 1000),
('ee0990c6-1e30-412c-8fbd-45db0f990adc', 'Political Science Scholar', 'Achieved milestones in Political Science with 250+ XP.', 'Award', 250),
('751902c1-26a0-4a7a-8da8-88c5cb848410', 'Political Science Virtuoso', 'Mastered advanced concepts in Political Science with 750+ XP.', 'Zap', 750),
('2cfc9d73-22d9-4603-881c-846d4974ef46', 'Constitutional Law Scholar', 'Achieved milestones in Constitutional Law with 250+ XP.', 'GraduationCap', 300),
('6a29b6f6-6c05-4a53-8e4a-498b0cf038c2', 'Constitutional Law Virtuoso', 'Mastered advanced concepts in Constitutional Law with 750+ XP.', 'Crown', 800),
('13849d6d-4f84-4ffd-8a4c-de9ad3bc08ac', 'Corporate Finance Scholar', 'Achieved milestones in Corporate Finance with 250+ XP.', 'Brain', 350),
('45192621-2085-4b98-8fbc-18a01ffecaa3', 'Corporate Finance Virtuoso', 'Mastered advanced concepts in Corporate Finance with 750+ XP.', 'Gem', 850),
('ca7a82bc-4410-4b8f-8c23-5ef86a4e99a4', 'Macro-Marketing Scholar', 'Achieved milestones in Macro-Marketing with 250+ XP.', 'Zap', 400),
('335d3524-68f3-4368-807e-08c87482a3fc', 'Macro-Marketing Virtuoso', 'Mastered advanced concepts in Macro-Marketing with 750+ XP.', 'Star', 900),
('21e1aec8-0a87-4a5d-8652-8048efa1a8c9', 'Operations Management Scholar', 'Achieved milestones in Operations Management with 250+ XP.', 'Crown', 450),
('4470b771-2a9f-4698-80fb-6fb2bdbe7c80', 'Operations Management Virtuoso', 'Mastered advanced concepts in Operations Management with 750+ XP.', 'Award', 950),
('2e0b0174-738e-480b-8eee-c42bc9b2b028', 'Strategic Leadership Scholar', 'Achieved milestones in Strategic Leadership with 250+ XP.', 'Gem', 500),
('d38b2b27-63c4-4627-8efa-f181130cd598', 'Strategic Leadership Virtuoso', 'Mastered advanced concepts in Strategic Leadership with 750+ XP.', 'GraduationCap', 1000),
('181f95e8-d782-4988-8cbe-a011f6676cfd', 'Design Thinking Scholar', 'Achieved milestones in Design Thinking with 250+ XP.', 'Star', 250),
('0c5eae50-c2c8-4888-8722-7b137e900cd4', 'Design Thinking Virtuoso', 'Mastered advanced concepts in Design Thinking with 750+ XP.', 'Brain', 750),
('d2c0f66c-493d-4f45-8b54-caa65df40c1b', 'Critical Analysis Scholar', 'Achieved milestones in Critical Analysis with 250+ XP.', 'Award', 300),
('13a35428-a3ee-4c8b-8ff9-a6463a299386', 'Critical Analysis Virtuoso', 'Mastered advanced concepts in Critical Analysis with 750+ XP.', 'Zap', 800),
('c621837c-2f28-4b3a-88cb-baec0b528d56', 'Riddle Deciphering Scholar', 'Achieved milestones in Riddle Deciphering with 250+ XP.', 'GraduationCap', 350),
('274a4ada-6041-46af-8c97-46b0c6f2719a', 'Riddle Deciphering Virtuoso', 'Mastered advanced concepts in Riddle Deciphering with 750+ XP.', 'Crown', 850),
('818259cb-ccd9-40c2-805d-09b1386714c1', 'Cryptographic Defense Scholar', 'Achieved milestones in Cryptographic Defense with 250+ XP.', 'Brain', 400),
('1b2e6017-a9a4-4bcd-883c-8d80bc9716c2', 'Cryptographic Defense Virtuoso', 'Mastered advanced concepts in Cryptographic Defense with 750+ XP.', 'Gem', 900),
('de2dbde7-51e0-4ded-8b34-31d85ae1fe5a', 'Web Technologies Scholar', 'Achieved milestones in Web Technologies with 250+ XP.', 'Zap', 450),
('a15d4607-edbb-4cf7-8a93-60783b72f2b3', 'Web Technologies Virtuoso', 'Mastered advanced concepts in Web Technologies with 750+ XP.', 'Star', 950),
('aa8eecf1-081e-4d3d-8ebc-ef83d0122721', 'Systems Architecture Scholar', 'Achieved milestones in Systems Architecture with 250+ XP.', 'Crown', 500),
('4211cbbd-ac90-4e0f-8629-eacaa45e24f6', 'Systems Architecture Virtuoso', 'Mastered advanced concepts in Systems Architecture with 750+ XP.', 'Award', 1000),
('73d17e6b-03ee-43ff-8da1-d7c2b6b61b10', 'Network Protocols Scholar', 'Achieved milestones in Network Protocols with 250+ XP.', 'Gem', 250),
('de0aac51-d70f-424d-8442-ef54acb9f9c4', 'Network Protocols Virtuoso', 'Mastered advanced concepts in Network Protocols with 750+ XP.', 'GraduationCap', 750),
('08335876-bb58-4d8a-83d6-763e921da4fd', 'Database Management Scholar', 'Achieved milestones in Database Management with 250+ XP.', 'Star', 300),
('419991a3-2904-4c3d-8255-e1be08771f49', 'Database Management Virtuoso', 'Mastered advanced concepts in Database Management with 750+ XP.', 'Brain', 800),
('5dd70f5a-071e-4b32-8ad5-c9ee50eab0bf', 'Cybersecurity Scholar', 'Achieved milestones in Cybersecurity with 250+ XP.', 'Award', 350),
('f1d7f1f4-b947-4984-8f04-359d2834c23a', 'Cybersecurity Virtuoso', 'Mastered advanced concepts in Cybersecurity with 750+ XP.', 'Zap', 850),
('0a5579be-1647-4b0f-892b-c580ed33b224', 'UI/UX Design Scholar', 'Achieved milestones in UI/UX Design with 250+ XP.', 'GraduationCap', 400),
('169adfb0-4169-4dfe-8f54-c9629e0b7fb4', 'UI/UX Design Virtuoso', 'Mastered advanced concepts in UI/UX Design with 750+ XP.', 'Crown', 900),
('fd04ba62-0c35-4945-8657-3340d1fbeb5a', 'Game Development Scholar', 'Achieved milestones in Game Development with 250+ XP.', 'Brain', 450),
('c893c43a-302e-46a0-8a5e-34fa8f7c77fd', 'Game Development Virtuoso', 'Mastered advanced concepts in Game Development with 750+ XP.', 'Gem', 950),
('3b96d636-4d73-4499-88da-f5edef4f2390', 'Robotics Engineering Scholar', 'Achieved milestones in Robotics Engineering with 250+ XP.', 'Zap', 500),
('7d117d7e-650e-4d3b-8224-40bd87257829', 'Robotics Engineering Virtuoso', 'Mastered advanced concepts in Robotics Engineering with 750+ XP.', 'Star', 1000),
('3a16b78a-9ea3-45f8-84d0-32f1a89da2f3', 'Control Systems Scholar', 'Achieved milestones in Control Systems with 250+ XP.', 'Crown', 250),
('0a76af44-69ec-4ff8-8132-07c7ca533c83', 'Control Systems Virtuoso', 'Mastered advanced concepts in Control Systems with 750+ XP.', 'Award', 750),
('bf4b8fbb-c322-4b96-8841-f92ee5c4f97f', 'Embedded Systems Scholar', 'Achieved milestones in Embedded Systems with 250+ XP.', 'Gem', 300),
('128ef778-88e2-472d-876b-ebb2ccdeacc6', 'Embedded Systems Virtuoso', 'Mastered advanced concepts in Embedded Systems with 750+ XP.', 'GraduationCap', 800),
('3993b6a9-c042-42fb-8e9d-c6568e9b11a2', 'Internet of Things Scholar', 'Achieved milestones in Internet of Things with 250+ XP.', 'Star', 350),
('0f0dd815-4bfe-4a8c-8ac8-3a04942ce52e', 'Internet of Things Virtuoso', 'Mastered advanced concepts in Internet of Things with 750+ XP.', 'Brain', 850),
('579a89ef-48c5-42ce-8b9a-5ba5122bc31d', 'Signal Processing Scholar', 'Achieved milestones in Signal Processing with 250+ XP.', 'Award', 400),
('53dfcfc4-c58b-455e-8f8d-f374e44aa789', 'Signal Processing Virtuoso', 'Mastered advanced concepts in Signal Processing with 750+ XP.', 'Zap', 900),
('798102d9-aa42-4e9a-898f-d8af5da59a1c', 'Telecommunications Scholar', 'Achieved milestones in Telecommunications with 250+ XP.', 'GraduationCap', 450),
('12d60338-44c0-48c0-85b9-0c624b625ca8', 'Telecommunications Virtuoso', 'Mastered advanced concepts in Telecommunications with 750+ XP.', 'Crown', 950),
('c7a45c7a-9bd8-44d5-80dc-935b0ceda8b7', 'Power Systems Scholar', 'Achieved milestones in Power Systems with 250+ XP.', 'Brain', 500),
('7c023f06-d299-4e26-8a9a-c99d63bae8e7', 'Power Systems Virtuoso', 'Mastered advanced concepts in Power Systems with 750+ XP.', 'Gem', 1000),
('62acab7e-3541-49cb-8b9c-941a3a3d6a83', 'Renewable Energy Scholar', 'Achieved milestones in Renewable Energy with 250+ XP.', 'Zap', 250),
('b96aacc6-5c78-4be8-8c87-b6e7eecb8231', 'Renewable Energy Virtuoso', 'Mastered advanced concepts in Renewable Energy with 750+ XP.', 'Star', 750),
('1c47a114-009e-48d3-8d3a-8268abdb9e7c', 'Environmental Science Scholar', 'Achieved milestones in Environmental Science with 250+ XP.', 'Crown', 300),
('16eebabb-5dd7-4a94-8ba7-387ac29cb354', 'Environmental Science Virtuoso', 'Mastered advanced concepts in Environmental Science with 750+ XP.', 'Award', 800),
('fdfcfd0e-8fe3-4417-8e9d-f3d56ee69e92', 'Ecology Scholar', 'Achieved milestones in Ecology with 250+ XP.', 'Gem', 350),
('2c547ffa-a998-42de-8f3c-68dcf47e43de', 'Ecology Virtuoso', 'Mastered advanced concepts in Ecology with 750+ XP.', 'GraduationCap', 850),
('63d4472a-f21b-4cc1-856e-4f47ee2b8edc', 'Meteorology Scholar', 'Achieved milestones in Meteorology with 250+ XP.', 'Star', 400),
('b0b8da68-39cc-4a11-8140-c1a2f423d710', 'Meteorology Virtuoso', 'Mastered advanced concepts in Meteorology with 750+ XP.', 'Brain', 900),
('1cd041a4-06f5-4eb7-835c-5e57bab41fec', 'Oceanography Scholar', 'Achieved milestones in Oceanography with 250+ XP.', 'Award', 450),
('172ff71a-0f92-4275-84fb-9c9a764bed6b', 'Oceanography Virtuoso', 'Mastered advanced concepts in Oceanography with 750+ XP.', 'Zap', 950),
('c84d4647-2b2a-4099-8960-d0678a6d74fa', 'Geology Scholar', 'Achieved milestones in Geology with 250+ XP.', 'GraduationCap', 500),
('c4903c11-7b93-4638-8c2a-36948ad707d6', 'Geology Virtuoso', 'Mastered advanced concepts in Geology with 750+ XP.', 'Crown', 1000),
('0689a957-989b-41b2-8ad4-349a5723ca39', 'Volcanology Scholar', 'Achieved milestones in Volcanology with 250+ XP.', 'Brain', 250),
('7c233779-61dd-4022-81fe-5fa6a06e8536', 'Volcanology Virtuoso', 'Mastered advanced concepts in Volcanology with 750+ XP.', 'Gem', 750),
('207efd72-f421-409a-8611-0d01faa4c186', 'Seismology Scholar', 'Achieved milestones in Seismology with 250+ XP.', 'Zap', 300),
('70580789-54b4-4432-865a-fac874c3c2cd', 'Seismology Virtuoso', 'Mastered advanced concepts in Seismology with 750+ XP.', 'Star', 800),
('fc95ed97-f709-405a-87e1-360c1e405404', 'Paleontology Scholar', 'Achieved milestones in Paleontology with 250+ XP.', 'Crown', 350),
('53646f6e-f51d-425f-8862-075bb310635e', 'Paleontology Virtuoso', 'Mastered advanced concepts in Paleontology with 750+ XP.', 'Award', 850),
('cb552b1a-1306-4029-8231-745f5521a608', 'Art History Scholar', 'Achieved milestones in Art History with 250+ XP.', 'Gem', 400),
('7f801da0-62ed-452c-8135-94dd69ae709d', 'Art History Virtuoso', 'Mastered advanced concepts in Art History with 750+ XP.', 'GraduationCap', 900),
('1ed97a66-9ac8-4891-8cb7-d5dd23aa63eb', 'Music Theory Scholar', 'Achieved milestones in Music Theory with 250+ XP.', 'Star', 450),
('35890ae5-48a0-42d6-864f-784a7c203028', 'Music Theory Virtuoso', 'Mastered advanced concepts in Music Theory with 750+ XP.', 'Brain', 950),
('77a89087-460a-4f99-8300-90331a688893', 'Cinematography Scholar', 'Achieved milestones in Cinematography with 250+ XP.', 'Award', 500),
('23f3bc65-25ea-4046-8b03-1029ebfaff00', 'Cinematography Virtuoso', 'Mastered advanced concepts in Cinematography with 750+ XP.', 'Zap', 1000),
('c0eb0f81-c751-45aa-8581-d40f6ff822f9', 'Journalism Scholar', 'Achieved milestones in Journalism with 250+ XP.', 'GraduationCap', 250),
('502a0d73-9877-4a63-8f45-9fc66392b7d8', 'Journalism Virtuoso', 'Mastered advanced concepts in Journalism with 750+ XP.', 'Crown', 750),
('149d40d4-158c-41fb-88fa-1c710d53dada', 'Public Relations Scholar', 'Achieved milestones in Public Relations with 250+ XP.', 'Brain', 300),
('501c47d5-ea1c-4527-884e-456a8568fe71', 'Public Relations Virtuoso', 'Mastered advanced concepts in Public Relations with 750+ XP.', 'Gem', 800),
('9be95f5f-883a-4dcc-8f37-c1d3ce5e5ec6', 'Supply Chain Management Scholar', 'Achieved milestones in Supply Chain Management with 250+ XP.', 'Zap', 350),
('be59e9f5-124d-4f03-899b-6c6c6bfd43c0', 'Supply Chain Management Virtuoso', 'Mastered advanced concepts in Supply Chain Management with 750+ XP.', 'Star', 850),
('550892f6-edb6-4273-828e-556192290ca4', 'Project Management Scholar', 'Achieved milestones in Project Management with 250+ XP.', 'Crown', 400),
('d256533b-c638-42f2-8c77-a9def7a5c3f4', 'Project Management Virtuoso', 'Mastered advanced concepts in Project Management with 750+ XP.', 'Award', 900),
('92bf319b-9890-4174-8225-617ec516577e', 'Product Strategy Scholar', 'Achieved milestones in Product Strategy with 250+ XP.', 'Gem', 450),
('0ba0d2d5-bbdb-4dc5-8731-b6c142f0f151', 'Product Strategy Virtuoso', 'Mastered advanced concepts in Product Strategy with 750+ XP.', 'GraduationCap', 950),
('2065222e-440a-4d5c-81e5-47f268294779', 'Conflict Resolution Scholar', 'Achieved milestones in Conflict Resolution with 250+ XP.', 'Star', 500),
('af7f318c-5def-481e-81f8-6809c3973e2f', 'Conflict Resolution Virtuoso', 'Mastered advanced concepts in Conflict Resolution with 750+ XP.', 'Brain', 1000),
('c15421eb-ecda-456f-8b67-d59b72d1b9ec', 'Public Speaking Scholar', 'Achieved milestones in Public Speaking with 250+ XP.', 'Award', 250),
('a0cd98f5-9711-4470-83e1-3eca9cf92712', 'Public Speaking Virtuoso', 'Mastered advanced concepts in Public Speaking with 750+ XP.', 'Zap', 750),
('87c75010-3027-4ea5-8d6a-9880a7ae5709', 'Academic Writing Scholar', 'Achieved milestones in Academic Writing with 250+ XP.', 'GraduationCap', 300),
('b21d0b43-b446-424c-8fc9-828a53fbfd85', 'Academic Writing Virtuoso', 'Mastered advanced concepts in Academic Writing with 750+ XP.', 'Crown', 800),
('a388c434-bfaf-4479-8c81-999008331137', 'Scientific Method Scholar', 'Achieved milestones in Scientific Method with 250+ XP.', 'Brain', 350),
('17dfa91c-7bed-4212-8612-104e98a15006', 'Scientific Method Virtuoso', 'Mastered advanced concepts in Scientific Method with 750+ XP.', 'Gem', 850),
('f81423e9-5e91-4e92-87db-a6bf3e1940e7', 'Research Design Scholar', 'Achieved milestones in Research Design with 250+ XP.', 'Zap', 400),
('f14a4b44-5a48-4214-863e-79f319ecde53', 'Research Design Virtuoso', 'Mastered advanced concepts in Research Design with 750+ XP.', 'Star', 900),
('4d34fd82-eb08-41d1-845a-c19c5493a23a', 'Information Literacy Scholar', 'Achieved milestones in Information Literacy with 250+ XP.', 'Crown', 450),
('b317d9ac-213c-4beb-8d83-f9784d65da92', 'Information Literacy Virtuoso', 'Mastered advanced concepts in Information Literacy with 750+ XP.', 'Award', 950),
('cea7bed1-0867-4428-863b-7f4c56e88afb', 'Logic & Reason Scholar', 'Achieved milestones in Logic & Reason with 250+ XP.', 'Gem', 500),
('4641c5b1-17b5-49b7-8d0a-fbb3d80b7932', 'Logic & Reason Virtuoso', 'Mastered advanced concepts in Logic & Reason with 750+ XP.', 'GraduationCap', 1000),
('e037827c-e61a-4ef6-8e3f-5f7b7de3d6f3', 'Game Theory Scholar', 'Achieved milestones in Game Theory with 250+ XP.', 'Star', 250),
('971f01df-5549-4153-81a0-9812beb339e6', 'Game Theory Virtuoso', 'Mastered advanced concepts in Game Theory with 750+ XP.', 'Brain', 750),
('966f5726-273d-41d4-8f3b-4b2fdc793cf7', 'Behavioral Economics Scholar', 'Achieved milestones in Behavioral Economics with 250+ XP.', 'Award', 300),
('985bfac0-2116-4816-857b-d9933c5c566d', 'Behavioral Economics Virtuoso', 'Mastered advanced concepts in Behavioral Economics with 750+ XP.', 'Zap', 800),
('7033af16-7fda-4ee1-8e16-640d3b05c64c', 'Digital Forensics Scholar', 'Achieved milestones in Digital Forensics with 250+ XP.', 'GraduationCap', 350),
('75d6b1ab-edb1-4752-83c6-ac90740f9a26', 'Digital Forensics Virtuoso', 'Mastered advanced concepts in Digital Forensics with 750+ XP.', 'Crown', 850),
('6004c309-465e-4705-8174-8ab1b94c4496', 'Cloud Computing Scholar', 'Achieved milestones in Cloud Computing with 250+ XP.', 'Brain', 400),
('8665a8f6-4c85-43b1-8381-99e2a5e85c6a', 'Cloud Computing Virtuoso', 'Mastered advanced concepts in Cloud Computing with 750+ XP.', 'Gem', 900),
('03809a4a-a224-44e1-882d-17a902742947', 'Parallel Programming Scholar', 'Achieved milestones in Parallel Programming with 250+ XP.', 'Zap', 450),
('2dcbca80-4e67-4a11-8db2-e70cd6b19431', 'Parallel Programming Virtuoso', 'Mastered advanced concepts in Parallel Programming with 750+ XP.', 'Star', 950),
('16ff469c-b322-4032-85ba-68039f5d3593', 'Software Quality Scholar', 'Achieved milestones in Software Quality with 250+ XP.', 'Crown', 500),
('c066c650-fb6b-4a28-899a-fcf6606c4909', 'Software Quality Virtuoso', 'Mastered advanced concepts in Software Quality with 750+ XP.', 'Award', 1000),
('82e8ab5e-83cc-47ff-8693-c39cfb45c5b6', 'Human-Computer Interaction Scholar', 'Achieved milestones in Human-Computer Interaction with 250+ XP.', 'Gem', 250),
('3040ae73-20bb-4940-8dd7-b992429d9899', 'Human-Computer Interaction Virtuoso', 'Mastered advanced concepts in Human-Computer Interaction with 750+ XP.', 'GraduationCap', 750),
('5d03ff83-4f79-4d4e-8f71-65bab4d175c5', 'Virtual Reality Scholar', 'Achieved milestones in Virtual Reality with 250+ XP.', 'Star', 300),
('6b90e9a7-f3df-4c32-8d6c-056b6e47d5fd', 'Virtual Reality Virtuoso', 'Mastered advanced concepts in Virtual Reality with 750+ XP.', 'Brain', 800),
('71c72d3c-2523-4582-884e-23753593a450', 'Artificial Intelligence Scholar', 'Achieved milestones in Artificial Intelligence with 250+ XP.', 'Award', 350),
('01c19441-4345-4d1e-8d66-7d13a4371e26', 'Artificial Intelligence Virtuoso', 'Mastered advanced concepts in Artificial Intelligence with 750+ XP.', 'Zap', 850),
('f2bc1a03-6c33-4ae3-8c4d-deb358259f68', 'Mind Spark Mastery Scholar', 'Achieved milestones in Mind Spark Mastery with 250+ XP.', 'GraduationCap', 400),
('31522c56-b306-4664-8ec0-dbcd8c6ebaa5', 'Mind Spark Mastery Virtuoso', 'Mastered advanced concepts in Mind Spark Mastery with 750+ XP.', 'Crown', 900)
ON CONFLICT ("name") DO NOTHING;

-- Seed Demo User
-- Password is 'password123', using salt/hash helper output structure
-- e.g. salt is 'e47c1abfec8e7fd6a67f03bc7e954ab4'
-- hash is 'a7c938d8f...'
-- Let's construct a valid PBKDF2 hash
INSERT INTO "User" ("id", "email", "passwordHash", "name", "xp", "level", "createdAt", "updatedAt") VALUES
('demo-student-id-12345', 'demo@mindspark.edu', '8f7d98be2c738eef4b8d91a0c8e2bd34:b3d36cd7b9b1a03f8e5c8b5c5e8c15db64fe6cd9234857b6d19e9debd380d19e8cf1b3764837bb523c72b22f7ab6283db563820a4b7f83ad7f6e2b17f3e8bde3', 'Demo Student', 140, 2, NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;

-- Seed Demo User Badges
INSERT INTO "UserBadge" ("id", "userId", "badgeId", "unlockedAt") VALUES
('ub-1', 'demo-student-id-12345', '1a33261a-8a7e-4050-bf8f-8b9a9d7bb3ff', NOW()),
('ub-2', 'demo-student-id-12345', '2b9bc081-e9e9-4467-bc2a-bb391f16efea', NOW())
ON CONFLICT ("userId", "badgeId") DO NOTHING;
