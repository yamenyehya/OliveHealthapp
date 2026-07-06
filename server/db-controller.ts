import { MongoClient, Db, ObjectId } from "mongodb";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { Article, Report, User } from "../src/types.js";

const LOCAL_DB_DIR = path.join(process.cwd(), "data");
const LOCAL_DB_PATH = path.join(LOCAL_DB_DIR, "db.json");

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let isMongo = false;

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove non-alphanumeric chars except space and hyphen
    .replace(/[\s_-]+/g, "-") // replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}

// Seed data
const DEFAULT_ARTICLES: Article[] = [
  {
    id: "diabetes-101",
    title: "Understanding Type 2 Diabetes: Prevention and Management",
    summary: "A comprehensive guide on preventing and managing Type 2 Diabetes through lifestyle changes, diet, and clinical guidance.",
    content: `## What is Type 2 Diabetes?
Type 2 diabetes is a chronic condition that affects how your body metabolizes glucose (sugar), an important source of fuel for your body. With type 2 diabetes, your body either resists the effects of insulin—a hormone that regulates the movement of sugar into your cells—or doesn't produce enough insulin to maintain normal glucose levels.

### Key Risk Factors
* **Weight:** Being overweight or obese is a primary risk factor.
* **Inactivity:** The less active you are, the greater your risk. Physical activity helps control weight, uses up glucose as energy, and makes cells more sensitive to insulin.
* **Family History:** Your risk increases if a parent or sibling has type 2 diabetes.
* **Age:** Although you can develop diabetes at any age, the risk increases as you get older, especially after age 45.

### Symptoms of Type 2 Diabetes
Symptoms of type 2 diabetes often develop slowly. In fact, you can have type 2 diabetes for years and not know it. When symptoms do appear, they may include:
1. Increased thirst and frequent urination
2. Increased hunger
3. Unintended weight loss
4. Fatigue
5. Blurry vision
6. Slow-healing sores or frequent infections

### Lifestyle Management and Treatment
Management of type 2 diabetes involves a combination of lifestyle adjustments and, in many cases, medical support:
* **Healthy Eating:** Focus on high-fiber, low-fat foods like fruits, vegetables, and whole grains. Reduce intake of refined carbohydrates and sweets.
* **Regular Exercise:** Aim for at least 150 minutes of moderate aerobic exercise per week (e.g., brisk walking, cycling, swimming).
* **Weight Loss:** Losing 5% to 7% of your body weight can significantly improve blood sugar control.
* **Monitoring:** Regularly check and log your blood sugar levels to track how different foods and activities affect your numbers.
* **Medication:** Some individuals may require oral medications (like metformin) or insulin therapy as prescribed by their physician.

Always consult your healthcare provider before starting any major changes to your medical regimen or diet.`,
    category: "Chronic Conditions",
    tags: ["diabetes", "nutrition", "insulin", "blood sugar"],
    source: "World Health Organization (WHO) & Mayo Clinic",
    approved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "hypertension-102",
    title: "Managing Hypertension: Salt, Stress, and Exercise Connection",
    summary: "Learn how lifestyle choices, stress management, and sodium reduction can naturally lower blood pressure and protect cardiovascular health.",
    content: `## Introduction to Hypertension
Hypertension, commonly known as high blood pressure, is a serious medical condition where the force of the blood against your artery walls is consistently too high. This forces your heart to work harder to pump blood. Over time, uncontrolled high blood pressure increases the risk of heart disease, stroke, and kidney failure.

### The Sodium Connection
Excessive sodium intake causes the body to retain fluid, which increases blood volume and places extra pressure on your blood vessels. 
* **The Guideline:** Most health organizations recommend limiting sodium intake to under **2,300 mg per day**, with an ideal limit of **1,500 mg per day** for most adults.
* **Actionable Step:** Avoid highly processed foods, canned soups, and salty snacks. Use herbs, spices, and lemon juice to flavor your meals instead of table salt.

### Physical Activity and Heart Health
Regular physical activity makes your heart stronger and more efficient at pumping blood, which reduces the effort needed and lowers the pressure in your arteries.
* **Recommended Activity:** Engage in at least 30 minutes of moderate physical activity (like brisk walking or cycling) on most days of the week.
* **Benefits:** Exercise can lower systolic blood pressure by an average of 5 to 8 mm Hg.

### Chronic Stress and Blood Pressure
When you are under stress, your body produces a surge of hormones (like adrenaline and cortisol) that temporarily increase your heart rate and constrict blood vessels. Chronic stress can lead to long-term elevated blood pressure if managed through unhealthy coping mechanisms like overeating, smoking, or drinking alcohol.
* **Stress Reduction Techniques:**
  1. **Deep Breathing Exercises:** Spend 5-10 minutes practicing slow, deep abdominal breathing.
  2. **Mindfulness Meditation:** Helps calm the nervous system and lowers circulating stress hormones.
  3. **Quality Sleep:** Lack of sleep is linked to increased blood pressure and heightened stress levels.

Hypertension is often called a "silent killer" because it rarely displays obvious symptoms. Regularly check your blood pressure and partner with a trusted healthcare provider for diagnosis and treatment.`,
    category: "Cardiovascular Health",
    tags: ["hypertension", "blood pressure", "heart", "diet"],
    source: "American Heart Association (AHA) & Harvard Medical School",
    approved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "sleep-hygiene-103",
    title: "The Science of Sleep Hygiene: Restoring Your Circadian Rhythm",
    summary: "Understand the biochemical mechanisms of sleep and discover practical, evidence-based habits to maximize rest and recovery.",
    content: `## The Architecture of Sleep
Sleep is not merely a passive state of rest; it is an active, highly regulated biological process crucial for cellular repair, memory consolidation, and immunological defense. Your sleep-wake cycle is governed by your **Circadian Rhythm**—a 24-hour internal biological clock managed by the suprachiasmatic nucleus in the brain, which responds directly to environmental light cues.

### The Melatonin Cascade
Melatonin is the hormone responsible for signaling to your body that it is time to sleep. It is secreted by the pineal gland in response to darkness. Exposure to artificial light—specifically **blue light** emitted by smartphones, tablets, and computers—suppresses melatonin synthesis, tricking your brain into thinking it is still daytime and delaying sleep onset.

### Practical Steps for Ideal Sleep Hygiene
Implementing a structured bedtime routine can drastically improve sleep latency (the time it takes to fall asleep) and sleep efficiency (the percentage of time in bed spent asleep):

1. **Establish a Consistent Schedule:** Go to bed and wake up at the exact same time every day, including weekends. This reinforces your circadian rhythm.
2. **Optimize Your Sleep Environment:** Ensure your bedroom is dark, quiet, and cool (ideally between 60°F and 67°F or 15°C to 19°C).
3. **Impose a Digital Sunset:** Discontinue screen usage at least 60 minutes before bedtime. Keep electronics out of the sleeping quarters.
4. **Be Mindful of Stimulants:** Avoid caffeine, large meals, and alcohol for 4 to 6 hours before retiring. While alcohol may make you drowsy, it disrupts REM sleep and leads to fragmented rest.
5. **Develop a Calming Bedtime Routine:** Read a physical book, practice light stretching, or listen to soothing music to signal to your nervous system that it is time to wind down.

If you suffer from chronic insomnia or suspect you have a sleep disorder (such as sleep apnea), seek evaluation from a qualified sleep specialist or physician.`,
    category: "General Wellness",
    tags: ["sleep", "circadian rhythm", "stress", "mental health"],
    source: "National Sleep Foundation & sleephealth.org",
    approved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "flu-vs-cold-104",
    title: "Influenza vs. Common Cold: Diagnosing and Managing Symptoms",
    summary: "How to differentiate between seasonal flu and a standard head cold, and when it is absolutely critical to see a doctor.",
    content: `## Is it a Cold or the Flu?
Because seasonal influenza (the flu) and the common cold share many symptoms, it can be difficult (or even impossible) to tell the difference between them based on symptoms alone. In general, the flu is much worse than the common cold, and symptoms are more intense and begin more abruptly.

### Symptom Comparison Chart
Understanding how symptoms present can help guide your self-care and medical decisions:

| Symptom | Common Cold | Influenza (Flu) |
|---|---|---|
| **Onset of Symptoms** | Gradual | Abrupt, sudden |
| **Fever** | Rare | High (100°F - 102°F), lasts 3-4 days |
| **Aches & Pains** | Slight, mild | Severe, widespread |
| **Chills & Shivering** | Uncommon | Fairly common |
| **Fatigue & Weakness** | Mild, occasional | Severe, can last up to 2-3 weeks |
| **Sneezing & Stuffy Nose**| Very common | Sometimes |
| **Sore Throat** | Common | Sometimes |
| **Chest Discomfort/Cough**| Mild to moderate | Common, can become severe |
| **Headache** | Rare | Very common and intense |

### Home Management and Recovery
For both cold and flu, standard supportive treatments can expedite relief:
* **Hydration:** Drink plenty of fluids (water, herbal teas, clear broths) to thin mucus and prevent dehydration.
* **Rest:** Rest allows your body to direct vital energy toward immune defense.
* **Symptomatic Relief:** Over-the-counter pain relievers (like acetaminophen or ibuprofen) can alleviate headaches and muscle aches. Decongestants can help relieve nasal congestion. *Never give aspirin to children or teenagers due to the risk of Reye's syndrome.*

### Warning Signs: When to Seek Immediate Care
Seek professional emergency medical attention immediately if you or a loved one experience any of the following:
* Difficulty breathing or shortness of breath
* Persistent pain or pressure in the chest
* Confusion, dizziness, or inability to arouse
* Severe muscle pain or weakness
* Seizures or inability to keep fluids down
* Fever or cough that improves but then returns or worsens

For high-risk individuals—including children under 5, adults over 65, pregnant women, and people with chronic health conditions—antiviral medications (like oseltamivir/Tamiflu) may be prescribed by a doctor within the first 48 hours of flu onset to shorten the duration and severity of the illness.`,
    category: "Infectious Diseases",
    tags: ["flu", "cold", "influenza", "symptoms", "immune"],
    source: "Centers for Disease Control and Prevention (CDC)",
    approved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "mindfulness-105",
    title: "Mindfulness and Stress Reduction: Cognitive Benefits Explained",
    summary: "Discover the scientific evidence showing how simple daily mindfulness exercises can reshape brain structure, reduce anxiety, and improve focus.",
    content: `## The Neurobiology of Mindfulness
Mindfulness is the practice of purposely bringing your attention to the present moment without judgment. Once considered solely a spiritual practice, clinical neuroscience has demonstrated that regular mindfulness meditation leads to objective, measurable changes in brain structure and neural connectivity—a process known as neuroplasticity.

### Brain Reorganization
Functional MRI scans of individuals who practice mindfulness consistently show positive changes in key neural centers:
1. **The Amygdala:** This is the brain's "fight-or-flight" fear center. Mindfulness has been shown to decrease the physical size and cellular activity of the amygdala, resulting in a reduced physiological response to stress.
2. **The Prefrontal Cortex:** Responsible for executive decision-making, planning, and emotional regulation. Mindfulness increases gray matter density in this region, improving cognitive control.
3. **The Hippocampus:** Crucial for memory and learning. Practicing mindfulness strengthens this area, preserving memory and cognitive flexibility under stress.

### Practical Exercises to Lower Daily Stress
You do not need to sit for hours in silent meditation to experience the stress-reducing benefits of mindfulness. Simple, brief exercises can be easily integrated into a busy mobile-first routine:

* **The 4-7-8 Breathing Technique:** 
  1. Inhale quietly through your nose for **4 seconds**.
  2. Hold your breath for **7 seconds**.
  3. Exhale completely and audibly through your mouth for **8 seconds**.
  4. Repeat this loop 4 times to instantly activate the parasympathetic nervous system, slowing your heart rate and inducing calm.
* **Sensory Grounding (The 5-4-3-2-1 Method):**
  When feeling anxious or overwhelmed, pause and identify:
  - **5** things you can see around you.
  - **4** things you can physically touch/feel.
  - **3** things you can hear.
  - **2** things you can smell.
  - **1** thing you can taste.
  This simple mindfulness exercise immediately breaks the loop of anxious overthinking by anchoring your awareness in your immediate environment.

Incorporating these scientific practices into your daily life can help reduce stress-induced inflammation, lower resting blood pressure, and build psychological resilience.`,
    category: "Mental Health",
    tags: ["mindfulness", "stress", "anxiety", "neuroscience", "breathing"],
    source: "Harvard Health Publishing & Journal of Clinical Psychiatry",
    approved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "cholesterol-106",
    title: "Managing Cholesterol: Lipoproteins and Atherosclerosis Prevention",
    summary: "An in-depth guide on LDL, HDL, triglycerides, and dietary adjustments to prevent plaque buildup in arteries.",
    content: `## The Biology of Cholesterol
Cholesterol is a waxy, fat-like substance that your body needs to build cell membranes, make hormones (such as estrogen and testosterone), and produce vitamin D. However, too much cholesterol in the blood can combine with other substances to form plaque, which sticks to the walls of your arteries and leads to atherosclerosis.

### LDL vs. HDL: The Lipoprotein Carriers
Because cholesterol is a fat, it cannot travel through the bloodstream on its own. It is carried by proteins called **lipoproteins**:
* **Low-Density Lipoprotein (LDL):** Often called "bad" cholesterol. LDL carries cholesterol from your liver to the cells that need it. If there is too much LDL, it can build up in artery walls.
* **High-Density Lipoprotein (HDL):** Known as "good" cholesterol. HDL absorbs excess cholesterol in your blood and carries it back to the liver, which flushes it from the body.

### What is Atherosclerosis?
Atherosclerosis is the narrowing and hardening of arteries caused by plaque buildup. This restricts blood flow and can lead to blood clots, heart attacks, or strokes.

### Practical Steps to Optimize Lipid Profiles
1. **Incorporate Soluble Fiber:** Foods like oats, barley, brussels sprouts, and pears contain soluble fiber, which binds to cholesterol in the digestive system and drags it out of the body before it can be absorbed.
2. **Focus on Monounsaturated Fats:** Swap saturated fats (butter, lard, fatty meats) with heart-healthy monounsaturated fats (extra virgin olive oil, avocados, almonds, walnuts).
3. **Eliminate Trans Fats:** Partially hydrogenated oils raise LDL and lower HDL. Read ingredient labels carefully.
4. **Increase Cardiovascular Exercise:** Aerobic exercise (running, fast walking, swimming) increases the efficiency of HDL cholesterol clearance.
5. **Consider Clinical Therapeutics:** When dietary changes are insufficient, physicians may prescribe statins to reduce the liver's production of cholesterol.

Always monitor your lipid panel regularly through simple blood tests and work with your physician on individual risk management.`,
    category: "Cardiovascular Health",
    tags: ["cholesterol", "heart", "atherosclerosis", "lipoproteins"],
    source: "AHA & Mayo Clinic Guidelines",
    approved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "gut-brain-axis-107",
    title: "The Gut-Brain Axis: How Microbiome Health Affects Mood and Brain Function",
    summary: "Discover the link between your digestive system and your brain, and how diet impacts anxiety and depression.",
    content: `## The Second Brain in Your Gut
Did you know your gut contains over 100 million neurons? This dense neural network is called the **Enteric Nervous System (ENS)**, and it communicates directly with your brain through the vagus nerve. This bidirectional communication system is known as the **Gut-Brain Axis**.

### Neurotransmitter Production in the Gut
A massive portion of your body's neurotransmitters—which regulate mood, anxiety, and sleep—are actually synthesized in the digestive tract:
* **Serotonin:** Approximately **90% to 95%** of the body's serotonin is produced by gut cells and influenced by gut bacteria. Serotonin is vital for stabilizing mood and feelings of well-being.
* **GABA:** This inhibitory neurotransmitter helps calm anxiety and promote relaxation. Many beneficial gut microbes synthesize GABA.

### The Role of the Microbiome
The gut microbiome consists of trillions of bacteria, fungi, and other microbes. A diverse, healthy microbiome maintains gut barrier integrity. If the gut barrier is compromised (a state often colloquially termed "leaky gut"), inflammatory markers can enter the bloodstream, cross the blood-brain barrier, and trigger neuroinflammation, which is linked to clinical depression and anxiety.

### Dietary Strategies for a Happy Gut and Mind
1. **Eat Prebiotic Foods:** Prebiotics are non-digestible fibers that feed beneficial gut microbes. Good sources include garlic, onions, leeks, asparagus, and bananas.
2. **Incorporate Probiotics:** Fermented foods like Greek yogurt, kefir, sauerkraut, kimchi, and kombucha deliver live beneficial bacteria to your digestive tract.
3. **Limit Ultra-Processed Foods:** Diets high in refined sugars and artificial additives feed inflammatory microbes and reduce microbiome diversity.
4. **Manage Stress:** High stress levels can physically alter gut motility and weaken the protective lining of your digestive tract, harming your microbial community.

Prioritize your gut nutrition to bolster your mental health, and discuss severe digestive or mood symptoms with your clinical team.`,
    category: "Mental Health",
    tags: ["microbiome", "gut-brain axis", "mental health", "nutrition"],
    source: "Harvard Health & Nature Medicine",
    approved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "asthma-action-108",
    title: "Understanding Asthma: Airway Hyperresponsiveness and Control Plans",
    summary: "Learn about the physiological mechanisms of asthma, how to identify common triggers, and how to execute an effective clinical action plan.",
    content: `## What Happens During an Asthma Attack?
Asthma is a chronic inflammatory disorder of the airways characterized by airway hyperresponsiveness, mucosal edema (swelling), and excessive mucus production. During an asthma exacerbation (attack), the muscles surrounding the airways constrict (bronchospasm), making it extremely difficult for air to pass into and out of the lungs.

### Identifying Asthma Triggers
Asthma symptoms can be triggered by a wide range of environmental and physiological factors:
* **Allergens:** Pollen, dust mites, mold spores, and pet dander.
* **Irritants:** Cigarette smoke, chemical fumes, strong perfumes, and air pollution.
* **Exercise:** Physical exertion, especially in cold, dry air, can trigger bronchoconstriction.
* **Infections:** Respiratory viral infections (such as colds or the flu) are common exacerbators.

### Developing a Personalized Asthma Action Plan
An Asthma Action Plan is a highly effective, personalized tool developed with your doctor to help you monitor and manage your asthma. It is typically divided into three color-coded zones:

1. **Green Zone (Doing Well):**
   - Symptoms: No coughing, wheezing, or shortness of breath. Can perform normal daily activities.
   - Action: Continue daily long-term control medications (such as inhaled corticosteroids) as prescribed to prevent swelling.
2. **Yellow Zone (Caution / Flare-Up):**
   - Symptoms: Mild cough, slight wheeze, or chest tightness. Wake up at night due to asthma.
   - Action: Take quick-relief "rescue" medications (like albuterol) immediately. Contact your provider if symptoms do not return to the Green Zone within a few hours.
3. **Red Zone (Medical Alert / Danger):**
   - Symptoms: Severe breathing difficulty, struggle to speak in full sentences, ribs pulling in during breaths (retractions). Rescue inhaler does not help.
   - Action: Use rescue medications immediately and seek emergency medical care or go to the nearest emergency department without delay.

Never skip daily maintenance inhalers even when feeling completely healthy, as they keep underlying chronic airway inflammation controlled.`,
    category: "Chronic Conditions",
    tags: ["asthma", "pulmonology", "allergies", "respiratory"],
    source: "Global Initiative for Asthma (GINA) & NIH",
    approved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "hydration-science-109",
    title: "The Science of Hydration: Fluid Balance, Electrolytes, and Performance",
    summary: "An evidence-based overview of optimal daily fluid intake, the biological importance of electrolytes, and the dangers of overhydration.",
    content: `## The Biological Importance of Water
Water is the primary constituent of the human body, accounting for approximately **60%** of an adult's body weight. It is essential for regulating body temperature, lubricating joints, transporting nutrients, removing metabolic waste, and maintaining cellular structure and blood volume.

### Fluid Loss and Dehydration
Your body constantly loses water through breathing, sweating, and urination. When fluid output exceeds fluid intake, dehydration occurs. Even mild dehydration (losing just 1% to 2% of body weight in water) can lead to:
- Headache, fatigue, and lethargy
- Impaired cognitive focus and short-term memory
- Decreased physical endurance and muscle strength
- Dark-colored urine and dry mouth

### Electrolytes: The Chemical Regulators
Hydration is not just about water; it is equally about **electrolytes**—specifically sodium, potassium, chloride, magnesium, and calcium. These minerals carry electrical charges that are essential for:
- Muscle contractions (including your heart)
- Nerve signal transmission
- Maintaining osmotic balance inside and outside of cells

### Recommended Daily Fluid Intake
There is no single "correct" amount of water for everyone, as needs depend on age, activity level, climate, and health status.
- **The Standard Guideline:** The National Academies of Sciences, Engineering, and Medicine suggest an average daily fluid intake of about **15.5 cups (3.7 liters)** for men and **11.5 cups (2.7 liters)** for women. Note that this includes fluids from foods, which typically contribute about 20% of daily intake.
- **The Urine Test:** The simplest way to monitor hydration is checking urine color. Aim for a pale, straw-like yellow. Dark yellow indicates dehydration; clear water-like urine may mean you are drinking more than necessary.

### The Danger of Overhydration (Hyponatremia)
Drinking extreme amounts of pure water without replacing electrolytes can dilute sodium levels in your blood, causing a dangerous condition called **hyponatremia** (water intoxication). This can cause cells to swell, leading to confusion, headaches, seizures, and in severe cases, death. This is particularly common in endurance athletes.

Stay hydrated by drinking steadily throughout the day and consuming mineral-rich whole foods.`,
    category: "General Wellness",
    tags: ["hydration", "nutrition", "electrolytes", "wellness"],
    source: "National Academies of Sciences & Mayo Clinic",
    approved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "vaccines-memory-110",
    title: "Vaccines and Immunological Memory: How the Human Immune System Prepares",
    summary: "An educational exploration of adaptive immunity, antibody production, and how vaccines train your body to fight future infections.",
    content: `## The Immune Defense System
Your body is constantly exposed to pathogens (viruses, bacteria, and parasites) capable of causing disease. To protect itself, the body relies on a highly sophisticated immune system. While the innate immune system acts as an immediate, non-specific barrier, the **Adaptive Immune System** provides targeted, highly specific defense and creates long-term immunity.

### The Role of T and B Lymphocytes
The adaptive immune response centers around two main types of white blood cells:
1. **B Cells (Antibody Factory):** B cells identify foreign molecules (antigens) on the surface of pathogens. Once activated, they transform into plasma cells that produce millions of Y-shaped proteins called **antibodies**. These antibodies bind specifically to the pathogen, neutralizing it or marking it for destruction by other immune cells.
2. **T Cells (The Coordinators and Destroyers):** Helper T cells coordinate the overall immune response. Killer (cytotoxic) T cells directly target and destroy your body's cells that have already been infected by a virus.

### How Immunological Memory is Born
During an active infection, a small fraction of activated B and T cells convert into **Memory Cells**. These cells persist in your lymph nodes and spleen for decades, maintaining a blueprint of the specific pathogen. If the same pathogen enters your body again, these memory cells recognize it instantly and launch a massive, targeted attack, neutralizing the threat before you even feel sick.

### How Vaccines Emulate the Process
Vaccines are designed to train your immune system without causing the actual illness. They expose your adaptive immune system to a harmless, non-replicating component of a pathogen (such as an inactivated virus, a single protein subunit, or a piece of genetic material like mRNA):
* **Training Phase:** Your immune system treats the vaccine as a live threat, generating antibodies and creating a robust library of Memory B and T cells.
* **Real-World Protection:** If you are later exposed to the actual, live pathogen, your memory cells activate immediately, clearing the infection rapidly and preventing severe illness or complications.

Vaccination is a safe and highly effective method to build collective community immunity (herd immunity), protecting vulnerable populations who cannot receive certain vaccines.`,
    category: "Infectious Diseases",
    tags: ["vaccines", "immunology", "pathogens", "antibodies", "science"],
    source: "World Health Organization (WHO) & CDC",
    approved: true,
    createdAt: new Date().toISOString()
  }
];

// Helper to construct local DB template
function createLocalDbTemplate() {
  const hash = bcrypt.hashSync("yamen1234*", 10);
  const articlesWithSlugs = DEFAULT_ARTICLES.map(art => ({
    ...art,
    slug: art.slug || generateSlug(art.title)
  }));
  return {
    users: [
      {
        id: "owner-admin-id",
        email: "yamenyehya608@gmail.com",
        passwordHash: hash,
        role: "admin",
        savedArticles: [],
        readingHistory: [],
        createdAt: new Date().toISOString()
      }
    ],
    articles: articlesWithSlugs,
    reports: [],
    verificationRequests: []
  };
}

export async function initDb() {
  const uri = process.env.MONGODB_URI;
  if (uri && uri.trim() !== "") {
    try {
      console.log("Connecting to MongoDB...");
      mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
      await mongoClient.connect();
      mongoDb = mongoClient.db();
      isMongo = true;
      console.log("MongoDB connected successfully!");

      // Verify or seed owner-admin
      const usersColl = mongoDb.collection("users");
      const admin = await usersColl.findOne({ email: "yamenyehya608@gmail.com" });
      if (!admin) {
        console.log("Seeding owner admin account into MongoDB...");
        const hash = await bcrypt.hash("yamen1234*", 10);
        await usersColl.insertOne({
          email: "yamenyehya608@gmail.com",
          passwordHash: hash,
          role: "admin",
          savedArticles: [],
          readingHistory: [],
          createdAt: new Date().toISOString()
        });
      } else if (admin.role !== "admin") {
        console.log("Ensuring owner account has admin permissions...");
        await usersColl.updateOne({ email: "yamenyehya608@gmail.com" }, { $set: { role: "admin" } });
      }

      // Verify or seed articles (upsert individually so new default articles propagate)
      const articlesColl = mongoDb.collection("articles");
      console.log("Synchronizing default medical articles into MongoDB...");
      for (const art of DEFAULT_ARTICLES) {
        const existing = await articlesColl.findOne({ $or: [{ id: art.id }, { title: art.title }] });
        const artWithSlug = {
          ...art,
          slug: art.slug || generateSlug(art.title)
        };
        if (!existing) {
          await articlesColl.insertOne(artWithSlug);
          console.log(`Seeded new default article: ${art.title}`);
        } else if (!existing.slug) {
          // If article exists but slug is missing, update it
          await articlesColl.updateOne({ _id: existing._id }, { $set: { slug: artWithSlug.slug } });
          console.log(`Updated missing slug for: ${art.title}`);
        }
      }
    } catch (err: any) {
      console.log("MongoDB is not configured or reachable. Falling back to local database storage mode.");
      isMongo = false;
      initLocalDb();
    }
  } else {
    console.log("No MONGODB_URI found. Utilizing local JSON-file database fallback.");
    isMongo = false;
    initLocalDb();
  }
}

function initLocalDb() {
  if (!fs.existsSync(LOCAL_DB_DIR)) {
    fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const template = createLocalDbTemplate();
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(template, null, 2), "utf-8");
    console.log("Local JSON database created and seeded successfully at:", LOCAL_DB_PATH);
  } else {
    // Check if the owner admin account exists, if not, patch it in
    try {
      const data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf-8"));
      let updated = false;

      if (!data.reports) {
        data.reports = [];
        updated = true;
      }
      if (!data.verificationRequests) {
        data.verificationRequests = [];
        updated = true;
      }

      const admin = data.users.find((u: any) => u.email === "yamenyehya608@gmail.com");
      if (!admin) {
        console.log("Patching local JSON database to insert yamenyehya608@gmail.com admin...");
        const hash = bcrypt.hashSync("yamen1234*", 10);
        data.users.push({
          id: "owner-admin-id",
          email: "yamenyehya608@gmail.com",
          passwordHash: hash,
          role: "admin",
          savedArticles: [],
          readingHistory: [],
          createdAt: new Date().toISOString()
        });
        updated = true;
      } else if (admin.role !== "admin") {
        console.log("Upgrading owner role to admin in local JSON DB...");
        admin.role = "admin";
        updated = true;
      }

      // Check for missing default articles and append them
      for (const art of DEFAULT_ARTICLES) {
        const hasArt = data.articles.some((a: any) => a.id === art.id || a.title === art.title);
        if (!hasArt) {
          data.articles.push(art);
          updated = true;
          console.log(`Patched missing article into local database: ${art.title}`);
        }
      }

      if (updated) {
        fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
      }
    } catch (e) {
      console.error("Error reading/patching local JSON-file DB, recreating it:", e);
      const template = createLocalDbTemplate();
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(template, null, 2), "utf-8");
    }
  }
}

function readLocalData(): any {
  try {
    const raw = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading local db file, recreating:", err);
    const template = createLocalDbTemplate();
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(template, null, 2), "utf-8");
    return template;
  }
}

function writeLocalData(data: any) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to local db file:", err);
  }
}

// DATABASE OPERATIONS ADAPTER

export async function getArticles(approvedOnly = true): Promise<Article[]> {
  if (isMongo && mongoDb) {
    const filter = approvedOnly ? { approved: true } : {};
    const items = await mongoDb.collection("articles").find(filter).toArray();
    return items.map(item => ({
      id: item._id.toString(),
      title: item.title,
      slug: item.slug || generateSlug(item.title),
      summary: item.summary,
      content: item.content,
      category: item.category,
      tags: item.tags,
      source: item.source,
      approved: item.approved,
      createdAt: item.createdAt
    })) as Article[];
  } else {
    const data = readLocalData();
    let list = data.articles;
    if (approvedOnly) {
      list = list.filter((a: any) => a.approved);
    }
    return list.map((a: any) => ({
      ...a,
      slug: a.slug || generateSlug(a.title)
    }));
  }
}

export async function getArticle(id: string): Promise<Article | null> {
  if (isMongo && mongoDb) {
    let item = null;
    try {
      item = await mongoDb.collection("articles").findOne({ _id: new ObjectId(id) });
    } catch {
      // If it's a string key rather than ObjectId
      item = await mongoDb.collection("articles").findOne({ id: id });
    }
    if (!item) return null;
    return {
      id: item._id.toString(),
      title: item.title,
      slug: item.slug || generateSlug(item.title),
      summary: item.summary,
      content: item.content,
      category: item.category,
      tags: item.tags,
      source: item.source,
      approved: item.approved,
      createdAt: item.createdAt
    } as Article;
  } else {
    const data = readLocalData();
    const art = data.articles.find((a: any) => a.id === id);
    if (!art) return null;
    return {
      ...art,
      slug: art.slug || generateSlug(art.title)
    };
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (isMongo && mongoDb) {
    const item = await mongoDb.collection("articles").findOne({ slug: slug });
    if (!item) {
      // Try searching for match where slug matches title's generated slug
      const all = await mongoDb.collection("articles").find({}).toArray();
      const match = all.find(item => (item.slug || generateSlug(item.title)) === slug);
      if (!match) return null;
      return {
        id: match._id.toString(),
        title: match.title,
        slug: match.slug || generateSlug(match.title),
        summary: match.summary,
        content: match.content,
        category: match.category,
        tags: match.tags,
        source: match.source,
        approved: match.approved,
        createdAt: match.createdAt
      } as Article;
    }
    return {
      id: item._id.toString(),
      title: item.title,
      slug: item.slug || generateSlug(item.title),
      summary: item.summary,
      content: item.content,
      category: item.category,
      tags: item.tags,
      source: item.source,
      approved: item.approved,
      createdAt: item.createdAt
    } as Article;
  } else {
    const data = readLocalData();
    const art = data.articles.find((a: any) => a.slug === slug || generateSlug(a.title) === slug);
    if (!art) return null;
    return {
      ...art,
      slug: art.slug || generateSlug(art.title)
    };
  }
}

export async function createArticle(article: Omit<Article, "id" | "createdAt" | "slug"> & { id?: string; createdAt?: string; slug?: string }): Promise<Article> {
  const generatedSlug = article.slug || generateSlug(article.title);
  const newArticle: Article = {
    id: article.id || `article-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: article.title,
    slug: generatedSlug,
    summary: article.summary,
    content: article.content,
    category: article.category,
    tags: article.tags,
    source: article.source,
    approved: article.approved ?? true,
    createdAt: article.createdAt || new Date().toISOString()
  };

  if (isMongo && mongoDb) {
    const res = await mongoDb.collection("articles").insertOne(newArticle);
    newArticle.id = res.insertedId.toString();
    return newArticle;
  } else {
    const data = readLocalData();
    data.articles.unshift(newArticle);
    writeLocalData(data);
    return newArticle;
  }
}

export async function updateArticle(id: string, updates: Partial<Article>): Promise<Article | null> {
  // If title is updated, we may optionally update slug if not explicitly locked or updated
  const updatedData = { ...updates };
  if (updatedData.title && !updatedData.slug) {
    updatedData.slug = generateSlug(updatedData.title);
  }

  if (isMongo && mongoDb) {
    let filter = {};
    try {
      filter = { _id: new ObjectId(id) };
    } catch {
      filter = { id: id };
    }
    const updateObj = { $set: updatedData };
    await mongoDb.collection("articles").updateOne(filter, updateObj);
    return getArticle(id);
  } else {
    const data = readLocalData();
    const idx = data.articles.findIndex((a: any) => a.id === id);
    if (idx === -1) return null;
    data.articles[idx] = { ...data.articles[idx], ...updatedData };
    writeLocalData(data);
    return data.articles[idx];
  }
}

export async function deleteArticle(id: string): Promise<boolean> {
  if (isMongo && mongoDb) {
    let filter = {};
    try {
      filter = { _id: new ObjectId(id) };
    } catch {
      filter = { id: id };
    }
    const res = await mongoDb.collection("articles").deleteOne(filter);
    return (res.deletedCount ?? 0) > 0;
  } else {
    const data = readLocalData();
    const lenBefore = data.articles.length;
    data.articles = data.articles.filter((a: any) => a.id !== id);
    writeLocalData(data);
    return data.articles.length < lenBefore;
  }
}

export async function getReports(): Promise<Report[]> {
  if (isMongo && mongoDb) {
    const items = await mongoDb.collection("reports").find({}).toArray();
    return items.map(item => ({
      id: item._id.toString(),
      articleId: item.articleId,
      articleTitle: item.articleTitle,
      userId: item.userId,
      userEmail: item.userEmail,
      reason: item.reason,
      details: item.details,
      resolved: item.resolved,
      createdAt: item.createdAt
    })) as Report[];
  } else {
    const data = readLocalData();
    return data.reports || [];
  }
}

export async function createReport(report: Omit<Report, "id" | "createdAt" | "resolved">): Promise<Report> {
  const newReport: Report = {
    id: `report-${Date.now()}`,
    articleId: report.articleId,
    articleTitle: report.articleTitle,
    userId: report.userId,
    userEmail: report.userEmail,
    reason: report.reason,
    details: report.details,
    resolved: false,
    createdAt: new Date().toISOString()
  };

  if (isMongo && mongoDb) {
    const res = await mongoDb.collection("reports").insertOne(newReport);
    newReport.id = res.insertedId.toString();
    return newReport;
  } else {
    const data = readLocalData();
    if (!data.reports) data.reports = [];
    data.reports.unshift(newReport);
    writeLocalData(data);
    return newReport;
  }
}

export async function resolveReport(id: string): Promise<boolean> {
  if (isMongo && mongoDb) {
    let filter = {};
    try {
      filter = { _id: new ObjectId(id) };
    } catch {
      filter = { id: id };
    }
    const res = await mongoDb.collection("reports").updateOne(filter, { $set: { resolved: true } });
    return (res.modifiedCount ?? 0) > 0;
  } else {
    const data = readLocalData();
    const idx = data.reports.findIndex((r: any) => r.id === id);
    if (idx === -1) return false;
    data.reports[idx].resolved = true;
    writeLocalData(data);
    return true;
  }
}

export async function getUserByEmail(email: string): Promise<any | null> {
  if (isMongo && mongoDb) {
    const item = await mongoDb.collection("users").findOne({ email: email.toLowerCase().trim() });
    if (!item) return null;
    return {
      id: item._id.toString(),
      email: item.email,
      passwordHash: item.passwordHash,
      role: item.role,
      savedArticles: item.savedArticles || [],
      readingHistory: item.readingHistory || [],
      settings: item.settings || {},
      verificationStatus: item.verificationStatus || null,
      verificationDeclinedAt: item.verificationDeclinedAt || null,
      notification: item.notification || null,
      createdAt: item.createdAt
    };
  } else {
    const data = readLocalData();
    const item = data.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase().trim());
    return item || null;
  }
}

export async function getUserById(id: string): Promise<any | null> {
  if (isMongo && mongoDb) {
    let filter = {};
    try {
      filter = { _id: new ObjectId(id) };
    } catch {
      filter = { id: id };
    }
    const item = await mongoDb.collection("users").findOne(filter);
    if (!item) return null;
    return {
      id: item._id.toString(),
      email: item.email,
      passwordHash: item.passwordHash,
      role: item.role,
      savedArticles: item.savedArticles || [],
      readingHistory: item.readingHistory || [],
      settings: item.settings || {},
      verificationStatus: item.verificationStatus || null,
      verificationDeclinedAt: item.verificationDeclinedAt || null,
      notification: item.notification || null,
      createdAt: item.createdAt
    };
  } else {
    const data = readLocalData();
    const item = data.users.find((u: any) => u.id === id);
    return item || null;
  }
}

export async function createUser(user: { email: string; passwordHash: string; role: 'user' | 'admin' }): Promise<any> {
  const newUser = {
    email: user.email.toLowerCase().trim(),
    passwordHash: user.passwordHash,
    role: user.role || "user",
    savedArticles: [],
    readingHistory: [],
    createdAt: new Date().toISOString()
  };

  if (isMongo && mongoDb) {
    const res = await mongoDb.collection("users").insertOne(newUser);
    return { id: res.insertedId.toString(), ...newUser };
  } else {
    const data = readLocalData();
    const userWithId = { id: `user-${Date.now()}`, ...newUser };
    data.users.push(userWithId);
    writeLocalData(data);
    return userWithId;
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<any | null> {
  if (isMongo && mongoDb) {
    let filter = {};
    try {
      filter = { _id: new ObjectId(id) };
    } catch {
      filter = { id: id };
    }
    const updateObj = { $set: updates };
    await mongoDb.collection("users").updateOne(filter, updateObj);
    return getUserById(id);
  } else {
    const data = readLocalData();
    const idx = data.users.findIndex((u: any) => u.id === id);
    if (idx === -1) return null;
    data.users[idx] = { ...data.users[idx], ...updates };
    writeLocalData(data);
    return data.users[idx];
  }
}

export async function getVerificationRequests(): Promise<any[]> {
  if (isMongo && mongoDb) {
    const items = await mongoDb.collection("verification_requests").find({}).toArray();
    return items.map(item => ({
      id: item._id.toString(),
      userId: item.userId,
      userEmail: item.userEmail,
      info: item.info,
      files: item.files || [],
      status: item.status,
      createdAt: item.createdAt
    }));
  } else {
    const data = readLocalData();
    return data.verificationRequests || [];
  }
}

export async function createVerificationRequest(req: any): Promise<any> {
  const newReq = {
    userId: req.userId,
    userEmail: req.userEmail,
    info: req.info,
    files: req.files || [],
    status: req.status || "pending",
    createdAt: new Date().toISOString()
  };

  if (isMongo && mongoDb) {
    const res = await mongoDb.collection("verification_requests").insertOne(newReq);
    return { id: res.insertedId.toString(), ...newReq };
  } else {
    const data = readLocalData();
    if (!data.verificationRequests) data.verificationRequests = [];
    const withId = { id: `req-${Date.now()}`, ...newReq };
    data.verificationRequests.unshift(withId);
    writeLocalData(data);
    return withId;
  }
}

export async function updateVerificationRequest(id: string, status: 'pending' | 'accepted' | 'declined'): Promise<boolean> {
  if (isMongo && mongoDb) {
    let filter = {};
    try {
      filter = { _id: new ObjectId(id) };
    } catch {
      filter = { id: id };
    }
    const res = await mongoDb.collection("verification_requests").updateOne(filter, { $set: { status } });
    return (res.modifiedCount ?? 0) > 0;
  } else {
    const data = readLocalData();
    const idx = data.verificationRequests?.findIndex((r: any) => r.id === id);
    if (idx === undefined || idx === -1) return false;
    data.verificationRequests[idx].status = status;
    writeLocalData(data);
    return true;
  }
}

export async function getDoctors(): Promise<any[]> {
  if (isMongo && mongoDb) {
    const items = await mongoDb.collection("users").find({ role: "doctor" }).toArray();
    return items.map(item => ({
      id: item._id.toString(),
      email: item.email,
      role: item.role,
      doctorProfile: item.doctorProfile || null,
      createdAt: item.createdAt
    }));
  } else {
    const data = readLocalData();
    const list = data.users.filter((u: any) => u.role === "doctor") || [];
    return list.map((item: any) => ({
      id: item.id,
      email: item.email,
      role: item.role,
      doctorProfile: item.doctorProfile || null,
      createdAt: item.createdAt
    }));
  }
}

export async function getReviews(doctorId?: string): Promise<any[]> {
  if (isMongo && mongoDb) {
    const filter = doctorId ? { doctorId } : {};
    const items = await mongoDb.collection("reviews").find(filter).toArray();
    return items.map(item => ({
      id: item._id.toString(),
      doctorId: item.doctorId,
      userId: item.userId,
      userEmail: item.userEmail,
      rating: item.rating,
      text: item.text,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
  } else {
    const data = readLocalData();
    if (!data.reviews) data.reviews = [];
    let list = data.reviews;
    if (doctorId) {
      list = list.filter((r: any) => r.doctorId === doctorId);
    }
    return list;
  }
}

export async function createReview(review: any): Promise<any> {
  const newReview = {
    doctorId: review.doctorId,
    userId: review.userId,
    userEmail: review.userEmail,
    rating: review.rating,
    text: review.text,
    createdAt: new Date().toISOString()
  };

  if (isMongo && mongoDb) {
    const res = await mongoDb.collection("reviews").insertOne(newReview);
    return { id: res.insertedId.toString(), ...newReview };
  } else {
    const data = readLocalData();
    if (!data.reviews) data.reviews = [];
    const withId = { id: `rev-${Date.now()}`, ...newReview };
    data.reviews.unshift(withId);
    writeLocalData(data);
    return withId;
  }
}

export async function updateReview(id: string, userId: string, updates: { rating: number; text: string }): Promise<any> {
  if (isMongo && mongoDb) {
    let filter = {};
    try {
      filter = { _id: new ObjectId(id), userId };
    } catch {
      filter = { id, userId };
    }
    const updateObj = { $set: { rating: updates.rating, text: updates.text, updatedAt: new Date().toISOString() } };
    const res = await mongoDb.collection("reviews").findOneAndUpdate(filter, updateObj, { returnDocument: "after" });
    if (!res) return null;
    const val = res.value || res;
    return val ? { id: val._id.toString(), ...val } : null;
  } else {
    const data = readLocalData();
    if (!data.reviews) data.reviews = [];
    const idx = data.reviews.findIndex((r: any) => r.id === id && r.userId === userId);
    if (idx === -1) return null;
    data.reviews[idx] = { 
      ...data.reviews[idx], 
      rating: updates.rating, 
      text: updates.text, 
      updatedAt: new Date().toISOString() 
    };
    writeLocalData(data);
    return data.reviews[idx];
  }
}

export async function deleteReview(id: string, userId: string): Promise<boolean> {
  if (isMongo && mongoDb) {
    let filter = {};
    try {
      filter = { _id: new ObjectId(id), userId };
    } catch {
      filter = { id, userId };
    }
    const res = await mongoDb.collection("reviews").deleteOne(filter);
    return (res.deletedCount ?? 0) > 0;
  } else {
    const data = readLocalData();
    if (!data.reviews) data.reviews = [];
    const lenBefore = data.reviews.length;
    data.reviews = data.reviews.filter((r: any) => r.id !== id || r.userId !== userId);
    writeLocalData(data);
    return data.reviews.length < lenBefore;
  }
}
