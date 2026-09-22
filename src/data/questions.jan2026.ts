export type QuestionType = 'multiple-choice' | 'constructed-response'

export type RegentsQuestion = {
  id: number
  title: string
  type: QuestionType
  choices: string[]
  correctAnswer: string
  referenceTableNeeded: boolean
  referenceTablePages: string[]
  hintLevel1: string
  hintLevel2: string
  hintLevel3: string
  explanation: string
  commonMistake?: string
  questionImage: string
  stimulusImages: string[]
}

const PLACEHOLDER_QUESTION_IMAGE = '/exam-images/jan-2026/placeholder-question.svg'

// Note: Q5 is constructed-response metadata for future UI support.
// If current quiz flow is multiple-choice only, keep this record for reveal/explanation logic and grading expansion.
export const jan2026QuestionsQ1toQ5: RegentsQuestion[] = [
  {
    id: 1,
    title: 'Question 1',
    type: 'multiple-choice',
    choices: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'],
    correctAnswer: 'Choice 3',
    referenceTableNeeded: false,
    referenceTablePages: [],
    hintLevel1: 'Focus on what the cosmic microwave background radiation actually is.',
    hintLevel2: 'Think about what happened to the early universe as it expanded and cooled.',
    hintLevel3: 'CMBR is leftover energy from the early universe; cooling made the universe transparent, then matter clumped into galaxies in denser regions.',
    explanation:
      'The best answer connects three ideas: CMBR is energy left over from the early universe, expansion caused cooling and transparency, and galaxies formed where matter density was greater. These points match the Big Bang evidence pattern.',
    commonMistake:
      'Mixing up CMBR with visible light from modern stars instead of relic radiation from the early universe.',
    questionImage: PLACEHOLDER_QUESTION_IMAGE,
    stimulusImages: [],
  },
  {
    id: 2,
    title: 'Question 2',
    type: 'multiple-choice',
    choices: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'],
    correctAnswer: 'Choice 2',
    referenceTableNeeded: false,
    referenceTablePages: [],
    hintLevel1: 'Use the trend shown on the Hubble graph.',
    hintLevel2: 'Relate distance to recessional velocity, then connect red shift to galaxy motion.',
    hintLevel3: 'The graph shows farther galaxies generally move away faster, and red shift is evidence they are receding.',
    explanation:
      'Choice 2 is correct because the Hubble relationship shows a general increase in recessional velocity with distance. Red shift supports that those galaxies are moving away from Earth.',
    commonMistake:
      'Assuming all galaxies move at similar speeds regardless of distance and ignoring the overall graph trend.',
    questionImage: PLACEHOLDER_QUESTION_IMAGE,
    stimulusImages: [],
  },
  {
    id: 3,
    title: 'Question 3',
    type: 'multiple-choice',
    choices: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'],
    correctAnswer: 'Choice 1',
    referenceTableNeeded: false,
    referenceTablePages: [],
    hintLevel1: 'Identify what the graph trend says about distance and speed.',
    hintLevel2: 'Expansion evidence depends on how recessional velocity changes as distance increases.',
    hintLevel3: 'If galaxies farther away have larger recessional velocities, that is evidence the universe is expanding.',
    explanation:
      'Choice 1 is supported because the graph indicates recessional velocity increases with distance. That pattern is the classic evidence for universal expansion.',
    commonMistake: 'Choosing an option that describes local motion instead of the large-scale distance-velocity trend.',
    questionImage: PLACEHOLDER_QUESTION_IMAGE,
    stimulusImages: [],
  },
  {
    id: 4,
    title: 'Question 4',
    type: 'multiple-choice',
    choices: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'],
    correctAnswer: 'Choice 1',
    referenceTableNeeded: true,
    referenceTablePages: ['Properties of Common Stars'],
    hintLevel1: 'Compare Betelgeuse and the Sun by stage and mass.',
    hintLevel2: 'A larger star burns fuel faster and can fuse heavier elements during later stages.',
    hintLevel3: 'Betelgeuse has fused helium into heavier elements and, because it is much more massive than the Sun, it has a shorter total lifespan.',
    explanation:
      'Choice 1 is correct. Betelgeuse is an evolved high-mass star that has already fused helium into heavier nuclei. High-mass stars use fuel rapidly, so they live shorter lives than lower-mass stars like the Sun.',
    commonMistake: 'Thinking bigger stars always live longer; in reality, higher mass means faster fuel consumption and shorter lifespan.',
    questionImage: PLACEHOLDER_QUESTION_IMAGE,
    stimulusImages: [],
  },
  {
    id: 5,
    title: 'Question 5',
    type: 'constructed-response',
    choices: [],
    correctAnswer: 'Model answer: Betelgeuse has greater mass, producing higher core pressure and temperature, which causes faster nucleosynthesis.',
    referenceTableNeeded: true,
    referenceTablePages: ['Properties of Common Stars'],
    hintLevel1: 'Compare stellar mass and what it does to core conditions.',
    hintLevel2: 'Greater mass increases gravitational compression in the core.',
    hintLevel3: 'Higher core pressure and temperature in Betelgeuse speed nuclear fusion reactions, so nucleosynthesis proceeds faster than in the Sun.',
    explanation:
      'A complete response should explain that Betelgeuse’s greater mass causes stronger gravitational compression, raising core pressure and temperature. Those conditions increase fusion rates, so heavier elements are produced faster than in the Sun.',
    commonMistake:
      'Only stating that Betelgeuse is larger without linking mass to pressure, temperature, and faster fusion.',
    questionImage: PLACEHOLDER_QUESTION_IMAGE,
    stimulusImages: [],
  },
]
