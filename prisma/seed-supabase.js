const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env variables manually
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const val = match[2].trim().replace(/^['"]|['"]$/g, "");
          process.env[key] = val;
        }
      }
    }
  }
}

async function main() {
  loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  console.log("Connecting to Supabase via HTTPS REST API...");
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false
    }
  });

  const defaultBadges = [
    {
      id: "1a33261a-8a7e-4050-bf8f-8b9a9d7bb3ff",
      name: "First Step",
      description: "Completed your first study assessment!",
      icon: "Award",
      xpRequired: 10,
    },
    {
      id: "2b9bc081-e9e9-4467-bc2a-bb391f16efea",
      name: "Scholar",
      description: "Reached Level 2 by earning 100+ XP!",
      icon: "GraduationCap",
      xpRequired: 100,
    },
    {
      id: "3cf6b0f1-a9b1-4d64-44cf-9f87ee479427",
      name: "Mastermind",
      description: "Achieved a perfect score on any assessment!",
      icon: "Brain",
      xpRequired: 0,
    },
    {
      id: "4ddc7d4a-134c-4f9f-6395-b85e4a5d892d",
      name: "Speed Demon",
      description: "Completed a Timed Quiz with 80% accuracy or higher!",
      icon: "Zap",
      xpRequired: 0,
    },
    {
      id: "5e2d6229-566a-47ca-bc8f-4f4d3246ebcf",
      name: "Centurion",
      description: "Earned a total of 1000 XP!",
      icon: "Crown",
      xpRequired: 1000,
    },
    {
      id: "6ffbe2c0-282d-466d-a60d-13a48e77df1f",
      name: "Flawless First Run",
      description: "Earned a perfect score on your first attempt of an assessment with no retakes!",
      icon: "Gem",
      xpRequired: 0,
    },
  ];

  // Load 200 generated badges
  const generatedBadges = JSON.parse(
    fs.readFileSync(path.join(__dirname, "badges.json"), "utf8")
  );

  const allBadges = [...defaultBadges, ...generatedBadges];
  console.log(`Upserting ${allBadges.length} badges to 'Badge' table...`);

  // Batch insert/upsert in chunks of 50 to avoid payload limits
  const chunkSize = 50;
  for (let i = 0; i < allBadges.length; i += chunkSize) {
    const chunk = allBadges.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("Badge")
      .upsert(chunk, { onConflict: "name" });

    if (error) {
      console.error(`Error upserting chunk ${i / chunkSize + 1}:`, error);
      process.exit(1);
    }
    console.log(`Successfully upserted chunk ${i / chunkSize + 1}`);
  }

  console.log("Seeding complete!");
}

main().catch(console.error);
