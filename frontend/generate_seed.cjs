const fs = require("fs");

const niches = [
  { name: "Frontend Development", role_type: "tech" },
  { name: "Backend Engineering", role_type: "tech" },
  { name: "Mobile Development", role_type: "tech" },
  { name: "DevOps & Cloud", role_type: "tech" },
  { name: "Data Science & ML", role_type: "tech" },
  { name: "UX & Design", role_type: "tech" },
  { name: "Security", role_type: "tech" },
  { name: "Blockchain", role_type: "tech" },
  { name: "Game Development", role_type: "tech" },
  { name: "Agriculture", role_type: "non_tech" },
  { name: "Healthcare", role_type: "non_tech" },
  { name: "Education", role_type: "non_tech" },
  { name: "Finance", role_type: "non_tech" },
  { name: "Construction", role_type: "non_tech" },
  { name: "Retail", role_type: "non_tech" },
  { name: "Hospitality", role_type: "non_tech" },
  { name: "Manufacturing", role_type: "non_tech" }
];

const cities = [
  { city: "San Francisco", country: "United States", country_code: "US", lat: 37.77, lng: -122.42 },
  { city: "Berlin", country: "Germany", country_code: "DE", lat: 52.52, lng: 13.40 },
  { city: "Bangalore", country: "India", country_code: "IN", lat: 12.97, lng: 77.59 },
  { city: "London", country: "United Kingdom", country_code: "GB", lat: 51.51, lng: -0.13 },
  { city: "Tokyo", country: "Japan", country_code: "JP", lat: 35.69, lng: 139.69 },
  { city: "S\u00e3o Paulo", country: "Brazil", country_code: "BR", lat: -23.55, lng: -46.63 },
  { city: "Lagos", country: "Nigeria", country_code: "NG", lat: 6.52, lng: 3.38 },
  { city: "Sydney", country: "Australia", country_code: "AU", lat: -33.86, lng: 151.20 },
  { city: "Paris", country: "France", country_code: "FR", lat: 48.85, lng: 2.35 },
  { city: "Toronto", country: "Canada", country_code: "CA", lat: 43.65, lng: -79.38 }
];

const skillsPool = {
  "Frontend Development": ["React", "TypeScript", "Tailwind CSS", "Next.js", "Vue.js", "Angular", "Svelte", "Redux"],
  "Backend Engineering": ["Node.js", "Python", "Go", "Java", "PostgreSQL", "MongoDB", "Redis", "Docker", "Microservices"],
  "Mobile Development": ["Flutter", "React Native", "Swift", "Kotlin", "Dart", "Firebase"],
  "DevOps & Cloud": ["AWS", "Azure", "Kubernetes", "Terraform", "CI/CD", "Prometheus", "GCP"],
  "Data Science & ML": ["Python", "PyTorch", "TensorFlow", "Pandas", "Scikit-Learn", "R", "SQL"],
  "UX & Design": ["Figma", "Adobe XD", "User Research", "Prototyping", "Design Systems"],
  "Security": ["Pentesting", "AppSec", "Network Security", "Ethical Hacking", "SOC", "Encryption"],
  "Blockchain": ["Solidity", "Smart Contracts", "Ethereum", "Rust", "Web3.js", "Defi"],
  "Game Development": ["Unity", "Unreal Engine", "C#", "C++", "Shaders", "3D Modeling"],
  "Agriculture": ["Agronomy", "Farm Management", "Soil Science", "Precision Farming", "Sustainability"],
  "Healthcare": ["Patient Care", "Medical Records", "Nursing", "Healthcare Administration", "Clinical Trials"],
  "Education": ["Curriculum Design", "e-Learning", "Pedagogy", "Educational Technology", "Training"],
  "Finance": ["Wealth Management", "Financial Analysis", "Accounting", "Risk Assessment", "Taxation"],
  "Construction": ["Project Management", "BIM", "Safety Compliance", "Civil Engineering", "Estimating"],
  "Retail": ["Inventory Management", "Visual Merchandising", "E-commerce Operations", "Customer Relations"],
  "Hospitality": ["Event Planning", "Hotel Management", "Customer Service", "Culinary Arts", "Travel Coordination"],
  "Manufacturing": ["Supply Chain", "Quality Control", "Lean Manufacturing", "Industrial Automation", "Six Sigma"]
};

const names = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Quinn", "Avery", "Skyler", "Charlie", "Parker", "Peyton", "Dakota", "Hayden", "Finley", "Emerson", "Sage", "River", "Rowan"];
const surnames = ["Smith", "Garcia", "Kim", "Muller", "Sharma", "Mendez", "Silva", "Okonkwo", "Tanaka", "Chen", "Kumar", "Johnson", "Andersen", "Asante", "Costa", "Popescu", "Al-Hassan", "Wei", "Kowalski", "Shevchenko"];

const profiles = [];
for (let i = 0; i < 600; i++) {
  const nicheObj = niches[i % niches.length];
  const location = cities[Math.floor(Math.random() * cities.length)];
  const nicheSkills = skillsPool[nicheObj.name] || ["Communication", "Problem Solving"];
  const selectedSkills = [];
  const numSkills = 3 + Math.floor(Math.random() * 3);
  for (let j = 0; j < numSkills; j++) {
    const skill = nicheSkills[Math.floor(Math.random() * nicheSkills.length)];
    if (!selectedSkills.includes(skill)) selectedSkills.push(skill);
  }

  const name = names[Math.floor(Math.random() * names.length)] + " " + surnames[Math.floor(Math.random() * surnames.length)];
  const years = 1 + Math.floor(Math.random() * 15);
  
  profiles.push({
    name: name,
    role_type: nicheObj.role_type,
    niche: nicheObj.name,
    skills: selectedSkills,
    experience_years: years,
    city: location.city,
    country: location.country,
    country_code: location.country_code,
    lat: location.lat,
    lng: location.lng,
    bio: `${nicheObj.name} specialist with ${years} years of experience. Passionate about projects in ${location.city} and beyond.`
  });
}

fs.writeFileSync("C:\\Users\\Shayan\\Desktop\\talent.ai\\test\\talentgraph.ai\\backend\\data\\seed_talent.json", JSON.stringify(profiles, null, 2));
console.log("Successfully generated 600 profiles in seed_talent.json");
