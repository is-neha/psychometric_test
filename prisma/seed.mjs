import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const q = (text, trait, options) => ({ text, trait, options });
const o = (label, text, scoring, adminNote) => ({
  label,
  text,
  scoring,
  adminNote,
});

const sections = [
  {
    title: "RIASEC - Career Interests & Work Style",
    description: "Career interests, initiative, practical work, creativity, and collaboration.",
    model: "RIASEC",
    questions: [
      q("Agar tere paas achanak se Rs. 10,000 free ke aa jayen, toh tu kya lena zyada pasand karega?", "Career interests", [
        o("A", "Khet ke liye koi naya jugaad ya hal/tool.", { RIASEC: { Realistic: 3 } }, "Realistic - physical execution"),
        o("B", "Apne YouTube ke liye badiya mic ya camera.", { RIASEC: { Enterprising: 2, Artistic: 2 } }, "Enterprising/Artistic - business and creativity"),
        o("C", "Apne doston ko party dena taaki apna naam bane.", { RIASEC: { Social: 2, Enterprising: 2 } }, "Social/Enterprising - networking"),
      ]),
      q("Jab tu khet me hal lagata hai ya ropai karta hai, toh tujhe usme sabse badiya kya lagta hai?", "Work style", [
        o("A", "Paseena bahana aur khud physically kuch create karna.", { RIASEC: { Realistic: 3 } }, "Realistic"),
        o("B", "Doston ya gaon walon ke sath milkar kaam karna.", { RIASEC: { Social: 3 } }, "Social"),
        o("C", "Ye dekhna ki main baakiyon se kitna jaldi aur badiya kaam nipta sakta hu.", { RIASEC: { Enterprising: 3 } }, "Enterprising - competitive"),
      ]),
      q("Maan le ek bada event ya mela ho raha hai gaon me. Tujhe kya duty pasand aayegi?", "Preferred role", [
        o("A", "Stage, sound, aur tent set karwana.", { RIASEC: { Realistic: 3 } }, "Realistic"),
        o("B", "Bheed ko manage karna aur ladkon ko orders dena.", { RIASEC: { Enterprising: 3 } }, "Enterprising - leadership"),
        o("C", "Logon ka hisaab-kitab aur pahaadi likhna.", { RIASEC: { Conventional: 3 } }, "Conventional"),
      ]),
      q("Tera YouTube channel ka future goal kya hai?", "Creative and business orientation", [
        o("A", "Aisa content banana jo kisi ne na socha ho, ekdum alag aur creative.", { RIASEC: { Artistic: 3, Investigative: 2 } }, "Artistic/Investigative"),
        o("B", "Bohot saare subscribers aur views laana taaki power aur paisa bane.", { RIASEC: { Enterprising: 3 } }, "Enterprising"),
        o("C", "Khud video banane se acha hai main dusre creators ki agency khol lu.", { RIASEC: { Enterprising: 3, Conventional: 1 } }, "Enterprising/Management"),
      ]),
      q("School me jab teacher class me nahi hoti, toh tera main role kya hota hai?", "Group role", [
        o("A", "Poori class ko aawaz dekar control karna ya apni baat sunana.", { RIASEC: { Enterprising: 3 } }, "Enterprising"),
        o("B", "Apne doston ke group ke sath baith kar masti ya aage ki planning.", { RIASEC: { Social: 3 } }, "Social"),
        o("C", "Chup-chaap baith kar mobile me kuch khol kar dekhna.", { RIASEC: { Investigative: 3 } }, "Investigative"),
      ]),
    ],
  },
  {
    title: "HBDI - Thinking Style",
    description: "Analytical, sequential, interpersonal, and imaginative thinking preferences.",
    model: "HBDI",
    questions: [
      q("Jab tujhe apne YouTube channel par koi nayi cheez try karni hoti hai, toh tu kaise shuru karta hai?", "Planning style", [
        o("A", "Pehle paper par poori script aur logic likhta hu, faayde-nuksan sochta hu.", { HBDI: { Analytical: 3 } }, "Blue - analytical"),
        o("B", "Seedha camera on karta hu, jo dimaag me aata hai bolta hu.", { HBDI: { Interpersonal: 2, Imaginative: 2 } }, "Red/Yellow - spontaneous"),
      ]),
      q("School ki padhai me tujhe sabse zyada ghutan ya gussa kis cheez se aata hai?", "Learning preference", [
        o("A", "Ghanto ek hi jagah chup-chaap baithna aur moti kitabein padhna.", { HBDI: { Sequential: 2, Interpersonal: 1 } }, "Action-oriented preference"),
        o("B", "Doston ka aas-paas na hona.", { HBDI: { Interpersonal: 3 } }, "Relational preference"),
        o("C", "Naye ideas na sikhana, bas purani cheezein ratna.", { HBDI: { Imaginative: 3 } }, "Yellow - novelty seeking"),
      ]),
      q("Agar kal subah khet me bohot zaroori kaam hai, par aaj raat dost ka phone aaye ki zaroori panga ho gaya hai, tu kya karega?", "Priority style", [
        o("A", "Dost ke paas chala jaunga, khet ka kaam kal adjust kar lenge.", { HBDI: { Interpersonal: 3 } }, "Red - interpersonal driven"),
        o("B", "Dost ko mana karunga, pehle subah ka kaam zaroori hai.", { HBDI: { Sequential: 3 } }, "Green - disciplined"),
      ]),
      q("Tujhe ek business setup karna hai. Tu kaisa business banayega?", "Business thinking style", [
        o("A", "Jisme har cheez ka perfect rule aur system ho.", { HBDI: { Sequential: 3 } }, "Green"),
        o("B", "Jisme naye-naye experiments aur ideas try kiye ja saken.", { HBDI: { Imaginative: 3 } }, "Yellow"),
        o("C", "Jisme main boss hu aur mere under logon ki team kaam kare.", { HBDI: { Interpersonal: 3 } }, "Red - people/action"),
      ]),
      q("Baat kam, kaam zyada - kya tu is baat ko maanta hai?", "Action versus analysis", [
        o("A", "Haan, mujhe rules ya planning se zyada seedha kaam karna pasand hai.", { HBDI: { Sequential: 2, Interpersonal: 2 } }, "Practical and action-oriented"),
        o("B", "Nahi, pehle soch-samajh kar plan karna zaroori hai.", { HBDI: { Analytical: 3 } }, "Blue - analytical"),
      ]),
    ],
  },
  {
    title: "OCEAN - Personality Traits",
    description: "Broad personality tendencies. Results are descriptive and non-diagnostic.",
    model: "OCEAN",
    questions: [
      q("Agar school me kisi ne tere group ke kisi bande ko dhakka de diya, toh tera pehla reaction kya hota hai?", "Agreeableness", [
        o("A", "Turant uski collar pakad leta hu.", { OCEAN: { Agreeableness: 1 } }, "Low agreeableness / reactive aggression"),
        o("B", "Usko sakhti se bolkar chhod deta hu ki aage se mat karna.", { OCEAN: { Agreeableness: 3 } }, "Moderate agreeableness"),
        o("C", "Teacher ko inform karta hu.", { OCEAN: { Agreeableness: 5 } }, "High agreeableness"),
      ]),
      q("Jab tu apne doston ke group me hota hai, toh wahan tera status kaisa hota hai?", "Extraversion", [
        o("A", "Main leader hu, plan main banata hu aur sab meri sunte hain.", { OCEAN: { Extraversion: 5 } }, "High extraversion/dominance"),
        o("B", "Main baakiyon ke sath rehta hu aur group ka hissa hota hu.", { OCEAN: { Extraversion: 3 } }, "Moderate extraversion"),
      ]),
      q("Tera YouTube aur business ka kaam kaisa chal raha hai?", "Conscientiousness", [
        o("A", "Main roz ek time par video ya kaam karta hu, chahe mann ho ya na ho.", { OCEAN: { Conscientiousness: 5 } }, "High conscientiousness"),
        o("B", "Jab mood karta hai tab bohot mehnat karta hu, warna dino tak kuch nahi.", { OCEAN: { Conscientiousness: 1 } }, "Low consistency / impulse driven"),
      ]),
      q("Agar tera YouTube video flop ho jaye ya field me fasal kharaab ho jaye, toh tujhe kaisa lagta hai?", "Emotional stability", [
        o("A", "Bohot gussa aata hai aur cheezein phekne ka mann karta hai.", { OCEAN: { "Emotional Stability": 1 } }, "High reactivity / low stress tolerance"),
        o("B", "Bura lagta hai, par fir agla kaam shuru kar deta hu.", { OCEAN: { "Emotional Stability": 5 } }, "Resilience"),
      ]),
      q("Kheton ke liye ek naya drone system aaya hai jo bijai karta hai. Tu kya sochega?", "Openness", [
        o("A", "Purana tareeqa hi best hai; main ise use nahi karna chahunga.", { OCEAN: { Openness: 1 } }, "Low openness"),
        o("B", "Main ise apne khet me try karna aur uspar video banana chahunga.", { OCEAN: { Openness: 5 } }, "High openness"),
      ]),
    ],
  },
  {
    title: "EQ - Emotional Intelligence",
    description: "Self-regulation, empathy, social awareness, self-awareness, and conflict resolution.",
    model: "EQ",
    questions: [
      q("School me ek ladke se behas ho gayi aur wo tere ghar walon par gaali de raha hai. Sab log dekh rahe hain. Tu kya karega?", "Self-Regulation", [
        o("A", "Ussi waqt maar-peet shuru kar dunga.", { EQ: { "Self-Regulation": 1 } }, "Poor impulse control"),
        o("B", "Gussa control karke wahan se hat jaunga aur baad me kisi trusted adult ke saath baat suljhaunga.", { EQ: { "Self-Regulation": 5 } }, "Constructive emotional control"),
      ]),
      q("Tere doston ke group me ek ladka aaj bohot dara hua aur chup hai. Tu kya karega?", "Empathy", [
        o("A", "Uska mazaak banaunga aur bolunga ki strong ban.", { EQ: { Empathy: 1 } }, "Low empathy"),
        o("B", "Usko akele me le jaakar poochunga ki kya hua aur kaise madad kar sakta hu.", { EQ: { Empathy: 5 } }, "High empathy"),
      ]),
      q("YouTube channel ke liye ek gaon wale uncle ka tractor shoot karna hai, par wo bohot gusse wale hain. Tu kya karega?", "Social Skills", [
        o("A", "Direct maangunga; mana kiya toh doston ke saath zabardasti le lunga.", { EQ: { "Social Skills": 1 } }, "Poor boundaries"),
        o("B", "Izzat se baat karunga, apna purpose samjhaunga aur unki permission lunga.", { EQ: { "Social Skills": 5 } }, "Respectful social skill"),
      ]),
      q("Tujhe kya lagta hai, school ke teachers aur ghar wale tujhse sabse zyada tang kyun hain?", "Self-Awareness", [
        o("A", "Unko bas meri har cheez se problem hai; main toh sahi hu.", { EQ: { "Self-Awareness": 1 } }, "Possible blind spot"),
        o("B", "Mujhe gussa jaldi aata hai aur kitabi padhai mushkil lagti hai, isliye wo tension lete hain.", { EQ: { "Self-Awareness": 5 } }, "High self-awareness"),
      ]),
      q("YouTube par ek dost ne madad ki thi. Ab paise aane lage hain toh wo zyada hissa maang raha hai. Tu kya karega?", "Conflict Resolution", [
        o("A", "Usko gaali dekar block kar dunga.", { EQ: { "Conflict Resolution": 1 } }, "Avoidant/aggressive conflict response"),
        o("B", "Baith kar contribution aur paise ka saaf hisaab banaunga aur fair agreement karunga.", { EQ: { "Conflict Resolution": 5 } }, "Negotiation and boundaries"),
      ]),
    ],
  },
];

async function main() {
  const adminHash = await bcrypt.hash("admin123", 12);
  const userHash = await bcrypt.hash("student123", 12);

  await db.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", passwordHash: adminHash, role: "ADMIN" },
  });
  await db.user.upsert({
    where: { username: "student" },
    update: {},
    create: { username: "student", passwordHash: userHash, role: "USER" },
  });

  const existing = await db.questionnaire.findFirst({
    where: { title: "Psychometric Test for 11th Grader", version: 1 },
  });
  if (existing) return;

  await db.questionnaire.create({
    data: {
      title: "Psychometric Test for 11th Grader",
      audience: "11th Grade Students",
      version: 1,
      description:
        "A practical, non-diagnostic assessment covering career interests, thinking preferences, personality tendencies, and emotional intelligence.",
      sections: {
        create: sections.map((section, sectionIndex) => ({
          title: section.title,
          description: section.description,
          position: sectionIndex + 1,
          questions: {
            create: section.questions.map((question, questionIndex) => ({
              text: question.text,
              trait: question.trait,
              model: section.model,
              position: questionIndex + 1,
              options: {
                create: question.options.map((option, optionIndex) => ({
                  label: option.label,
                  text: option.text,
                  position: optionIndex + 1,
                  scoringJson: JSON.stringify(option.scoring),
                  adminNote: option.adminNote,
                })),
              },
            })),
          },
        })),
      },
    },
  });
}

main()
  .then(() => console.log("Seed complete. Demo users: admin/admin123 and student/student123"))
  .finally(() => db.$disconnect());
