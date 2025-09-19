// Landmark Facts Service - Can be integrated with Claude API or other AI services

export interface LandmarkFactData {
  name: string;
  facts: string[];
  historicalSignificance: string;
  funFact: string;
}

// Enhanced landmark facts database with more comprehensive information
const LANDMARK_FACTS_DB: Record<string, LandmarkFactData> = {
  'Eiffel Tower': {
    name: 'Eiffel Tower',
    facts: [
      'Built between 1887-1889 for the 1889 World Exposition in Paris',
      'Stands 324 meters (1,063 feet) tall, was the world\'s tallest structure until 1930',
      'Made of wrought iron with 18,038 pieces held together by 2.5 million rivets',
      'Weighs approximately 10,100 tons and sways up to 6-7 cm in strong winds',
      'The tower grows about 15 cm in summer due to thermal expansion of the metal'
    ],
    historicalSignificance: 'Originally designed by Gustave Eiffel as a temporary structure for the 1889 World Exposition, it became a symbol of French engineering prowess and the Industrial Revolution. Despite initial criticism, it\'s now an icon of France and architectural achievement.',
    funFact: 'The tower has 72 scientists\' names engraved on it, and during WWII, French resistance fighters cut the elevator cables, forcing German soldiers to climb the stairs!'
  },
  'Louvre Museum': {
    name: 'Louvre Museum',
    facts: [
      'Originally built as a fortress in the late 12th century by Philip II',
      'Transformed into a royal palace before becoming a public museum in 1793',
      'Houses over 380,000 objects and displays 35,000 works of art',
      'Covers 782,910 square feet of exhibition space',
      'The glass pyramid entrance was designed by I.M. Pei and completed in 1989'
    ],
    historicalSignificance: 'Former residence of French kings and queens for centuries, it represents the transformation from royal privilege to public access to art. The Louvre democratized art appreciation and set the standard for world-class museums.',
    funFact: 'If you spent 30 seconds looking at each piece in the Louvre, it would take you 100 days to see everything, and the Mona Lisa has her own mailbox!'
  },
  'Notre-Dame Cathedral': {
    name: 'Notre-Dame Cathedral',
    facts: [
      'Construction began in 1163 under Bishop Maurice de Sully and took nearly 200 years',
      'Features 387 steps to reach the top of the towers',
      'The cathedral\'s rose windows are among the largest in the world',
      'Survived the French Revolution, two World Wars, and a devastating fire in 2019',
      'Victor Hugo\'s 1831 novel helped inspire its 19th-century restoration'
    ],
    historicalSignificance: 'A masterpiece of French Gothic architecture and spiritual center of Paris for over 850 years. It has witnessed coronations, royal weddings, and major historical events including Napoleon\'s coronation.',
    funFact: 'The cathedral\'s bells were melted down during the French Revolution except for Emmanuel, the largest bell, which still rings today and weighs 13 tons!'
  },
  'Sacré-Cœur Basilica': {
    name: 'Sacré-Cœur Basilica',
    facts: [
      'Built between 1875-1914 as a symbol of hope after the Franco-Prussian War',
      'Sits atop Montmartre hill, the highest point in Paris at 130 meters',
      'Made of travertine stone that whitens with age and rain',
      'Features one of the world\'s largest mosaics in its apse',
      'The dome offers 360-degree views of Paris'
    ],
    historicalSignificance: 'Built as a votive offering for France\'s recovery after the Franco-Prussian War and Paris Commune. It represents faith, hope, and national reconciliation during a turbulent period in French history.',
    funFact: 'The basilica\'s white stone actually gets whiter over time when it rains, and there\'s been continuous prayer here 24/7 since 1885!'
  },
  'Arc de Triomphe': {
    name: 'Arc de Triomphe',
    facts: [
      'Commissioned by Napoleon in 1806 to honor his army\'s victories',
      'Took 30 years to complete, finished long after Napoleon\'s death',
      'Stands 50 meters tall and 45 meters wide',
      'The Unknown Soldier\'s flame has burned continuously since 1921',
      'Twelve avenues radiate from the arch, including the Champs-Élysées'
    ],
    historicalSignificance: 'Monument to French military victories and those who died for France. It embodies Napoleon\'s vision of French glory and serves as a focal point for national celebrations and remembrance.',
    funFact: 'The tomb of the Unknown Soldier beneath the arch contains soil from all the battlefields of WWI, and the eternal flame is rekindled every evening at 6:30 PM!'
  }
};

// Function to get landmark facts (can be extended to call external AI APIs)
export const getLandmarkFacts = async (landmarkName: string): Promise<LandmarkFactData> => {
  // Check our database first
  const knownFact = LANDMARK_FACTS_DB[landmarkName];
  if (knownFact) {
    return knownFact;
  }

  // For unknown landmarks, generate generic but relevant facts
  // In production, this could call Claude API or another AI service
  return generateGenericFacts(landmarkName);
};

// Generate facts for unknown landmarks
const generateGenericFacts = (landmarkName: string): LandmarkFactData => {
  const genericTemplates = [
    `${landmarkName} represents the rich architectural heritage of this area`,
    `This location has been an important part of the local community for generations`,
    `The area around ${landmarkName} has witnessed significant historical events`,
    `Local artisans and architects contributed to the unique character of this landmark`,
    `${landmarkName} reflects the cultural evolution of this neighborhood`
  ];

  return {
    name: landmarkName,
    facts: genericTemplates.slice(0, 3),
    historicalSignificance: `${landmarkName} contributes to the cultural and historical landscape of this area, representing the ongoing story of urban development and community life.`,
    funFact: `Every landmark like ${landmarkName} has unique stories waiting to be discovered by curious travelers and history enthusiasts.`
  };
};

// Function to call external AI API (like Claude) for dynamic fact generation
export const generateAIFacts = async (landmarkName: string, context?: string): Promise<LandmarkFactData> => {
  // This would integrate with Claude API or similar service
  // For now, returning from our curated database
  return getLandmarkFacts(landmarkName);
};

// Get facts for multiple landmarks
export const getBatchLandmarkFacts = async (landmarks: string[]): Promise<LandmarkFactData[]> => {
  const promises = landmarks.map(landmark => getLandmarkFacts(landmark));
  return Promise.all(promises);
};
