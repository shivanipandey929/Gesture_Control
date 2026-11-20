export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

export interface Step {
  num: number;
  title: string;
  desc: string;
  ingredientsUsed?: string[];
  timerSeconds?: number;
  timerName?: string;
}

export interface Recipe {
  id: string;
  name: string;
  hindiName: string;
  emoji: string;
  prepTime: string;
  cookTime: string;
  servingsBase: number;
  ingredients: Ingredient[];
  steps: Step[];
}

export function resolveStepText(
  desc: string,
  ingredients: Ingredient[],
  multiplier: number
): string {
  return desc.replace(/\{(\w+)\}/g, (match, key) => {
    const ing = ingredients.find((i) => i.id === key);
    if (!ing) return match;
    const scaled = Math.round(ing.amount * multiplier * 10) / 10;
    return `${scaled} ${ing.unit}`;
  });
}

export const RECIPES: Recipe[] = [
  {
    id: 'chai',
    name: 'Masala Chai',
    hindiName: 'मसाला चाय',
    emoji: '☕',
    prepTime: '5 min',
    cookTime: '8 min',
    servingsBase: 2,
    ingredients: [
      { id: 'water', name: 'Water', amount: 300, unit: 'ml' },
      { id: 'milk', name: 'Milk', amount: 200, unit: 'ml' },
      { id: 'tea', name: 'Black Tea Leaves (Chai Patti)', amount: 10, unit: 'g' },
      { id: 'ginger', name: 'Fresh Ginger (crushed)', amount: 15, unit: 'g' },
      { id: 'cardamom', name: 'Green Cardamom Pods', amount: 3, unit: 'pcs' },
      { id: 'cloves', name: 'Cloves', amount: 2, unit: 'pcs' },
      { id: 'sugar', name: 'Sugar', amount: 15, unit: 'g' },
    ],
    steps: [
      {
        num: 1,
        title: 'Crush Spices',
        desc: 'Crush {ginger} ginger, {cardamom} cardamom pods, and {cloves} cloves lightly in a mortar and pestle to release their aromatic oils.',
        ingredientsUsed: ['ginger', 'cardamom', 'cloves'],
      },
      {
        num: 2,
        title: 'Boil Aromatics',
        desc: 'Add {water} water to saucepan with crushed ginger and spices. Bring to a rolling boil over medium heat.',
        ingredientsUsed: ['water', 'ginger', 'cardamom', 'cloves'],
        timerSeconds: 180,
        timerName: 'Aromatics Boil',
      },
      {
        num: 3,
        title: 'Add Tea Leaves',
        desc: 'Add {tea} black tea leaves and {sugar} sugar. Simmer on medium-low heat until the water turns a deep amber color.',
        ingredientsUsed: ['tea', 'sugar'],
        timerSeconds: 120,
        timerName: 'Tea Steeping',
      },
      {
        num: 4,
        title: 'Add Milk & Simmer',
        desc: 'Pour in {milk} milk. Let chai come to a full boil twice, lowering the heat each time to develop rich body.',
        ingredientsUsed: ['milk'],
        timerSeconds: 180,
        timerName: 'Milk Simmer',
      },
      {
        num: 5,
        title: 'Strain & Serve',
        desc: 'Turn off the heat. Strain the hot masala chai through a fine mesh sieve into cups and enjoy steaming hot.',
        ingredientsUsed: [],
      },
    ],
  },
  {
    id: 'poha',
    name: 'Kanda Batata Poha',
    hindiName: 'कांदा बटाटा पोहा',
    emoji: '🍚',
    prepTime: '10 min',
    cookTime: '12 min',
    servingsBase: 2,
    ingredients: [
      { id: 'poha', name: 'Thick Poha (Flattened Rice)', amount: 200, unit: 'g' },
      { id: 'potato', name: 'Potato (peeled & finely diced)', amount: 100, unit: 'g' },
      { id: 'onion', name: 'Onion (finely chopped)', amount: 80, unit: 'g' },
      { id: 'peanuts', name: 'Raw Peanuts', amount: 40, unit: 'g' },
      { id: 'mustard', name: 'Mustard Seeds (Rai)', amount: 5, unit: 'g' },
      { id: 'chili', name: 'Green Chilies (chopped)', amount: 2, unit: 'pcs' },
      { id: 'curry_leaves', name: 'Curry Leaves', amount: 10, unit: 'pcs' },
      { id: 'turmeric', name: 'Turmeric Powder (Haldi)', amount: 3, unit: 'g' },
      { id: 'oil', name: 'Cooking Oil', amount: 20, unit: 'ml' },
      { id: 'lemon', name: 'Lemon Juice', amount: 15, unit: 'ml' },
      { id: 'coriander', name: 'Fresh Coriander', amount: 15, unit: 'g' },
    ],
    steps: [
      {
        num: 1,
        title: 'Rinse Poha',
        desc: 'Gently rinse {poha} thick poha in a colander under running water for 1 minute. Drain completely and let soften.',
        ingredientsUsed: ['poha'],
      },
      {
        num: 2,
        title: 'Fry Peanuts',
        desc: 'Heat {oil} oil in a kadai/pan. Fry {peanuts} peanuts on medium heat until golden and crunchy. Remove and set aside.',
        ingredientsUsed: ['oil', 'peanuts'],
        timerSeconds: 120,
        timerName: 'Peanut Crisp',
      },
      {
        num: 3,
        title: 'Temper Aromatics',
        desc: 'In the remaining oil, crackle {mustard} mustard seeds, then add {curry_leaves} curry leaves and {chili} green chilies until fragrant.',
        ingredientsUsed: ['mustard', 'curry_leaves', 'chili'],
      },
      {
        num: 4,
        title: 'Cook Potatoes & Onions',
        desc: 'Add finely diced {potato} potatoes and chopped {onion} onions with a pinch of salt. Sauté covered until potatoes are fork-tender.',
        ingredientsUsed: ['potato', 'onion'],
        timerSeconds: 300,
        timerName: 'Potatoes Sauté',
      },
      {
        num: 5,
        title: 'Toss with Turmeric & Poha',
        desc: 'Add {turmeric} turmeric powder, a pinch of salt, and drained poha. Gently toss with a spatula to coat without breaking rice flakes.',
        ingredientsUsed: ['turmeric', 'poha'],
      },
      {
        num: 6,
        title: 'Steam & Garnish',
        desc: 'Cover with lid on lowest heat to steam for 3 minutes. Turn off heat, add {lemon} lemon juice, fried peanuts, and {coriander} fresh coriander.',
        ingredientsUsed: ['lemon', 'peanuts', 'coriander'],
        timerSeconds: 180,
        timerName: 'Poha Steam',
      },
    ],
  },
  {
    id: 'dal',
    name: 'Dal Tadka',
    hindiName: 'दाल तड़का',
    emoji: '🍲',
    prepTime: '10 min',
    cookTime: '20 min',
    servingsBase: 4,
    ingredients: [
      { id: 'toor_dal', name: 'Toor Dal (Yellow Pigeon Peas)', amount: 200, unit: 'g' },
      { id: 'water', name: 'Water', amount: 600, unit: 'ml' },
      { id: 'turmeric', name: 'Turmeric Powder', amount: 3, unit: 'g' },
      { id: 'salt', name: 'Salt', amount: 8, unit: 'g' },
      { id: 'ghee', name: 'Ghee (Clarified Butter)', amount: 30, unit: 'ml' },
      { id: 'cumin', name: 'Cumin Seeds (Jeera)', amount: 5, unit: 'g' },
      { id: 'garlic', name: 'Garlic Cloves (finely minced)', amount: 6, unit: 'pcs' },
      { id: 'tomato', name: 'Tomatoes (chopped)', amount: 100, unit: 'g' },
      { id: 'chili_powder', name: 'Kashmiri Chili Powder', amount: 5, unit: 'g' },
      { id: 'coriander', name: 'Fresh Coriander', amount: 20, unit: 'g' },
    ],
    steps: [
      {
        num: 1,
        title: 'Pressure Cook Dal',
        desc: 'Rinse {toor_dal} toor dal until water runs clear. Cook in pressure cooker with {water} water, {turmeric} turmeric powder, and {salt} salt for 4 whistles.',
        ingredientsUsed: ['toor_dal', 'water', 'turmeric', 'salt'],
        timerSeconds: 900,
        timerName: 'Dal Cooking',
      },
      {
        num: 2,
        title: 'Whisk Dal',
        desc: 'Release steam naturally. Whisk the cooked dal with a wire whisk until smooth and creamy. Adjust water consistency.',
        ingredientsUsed: [],
      },
      {
        num: 3,
        title: 'Prepare Sizzling Tadka',
        desc: 'Heat {ghee} ghee in a small pan. Add {cumin} cumin seeds and let them splutter. Add minced {garlic} garlic until golden brown.',
        ingredientsUsed: ['ghee', 'cumin', 'garlic'],
        timerSeconds: 120,
        timerName: 'Garlic Browning',
      },
      {
        num: 4,
        title: 'Add Tomatoes & Chili',
        desc: 'Add chopped {tomato} tomatoes and {chili_powder} chili powder. Cook until tomatoes soften and ghee separates from the sides.',
        ingredientsUsed: ['tomato', 'chili_powder'],
        timerSeconds: 240,
        timerName: 'Tadka Simmer',
      },
      {
        num: 5,
        title: 'Pour Tadka & Simmer',
        desc: 'Pour the sizzling tadka immediately into the hot dal. Cover with lid for 2 minutes to lock in smoky aromas.',
        ingredientsUsed: [],
        timerSeconds: 120,
        timerName: 'Aroma Infusion',
      },
      {
        num: 6,
        title: 'Final Garnish',
        desc: 'Stir well, garnish generously with chopped {coriander} fresh coriander, and serve hot with steamed basmati rice.',
        ingredientsUsed: ['coriander'],
      },
    ],
  },
  {
    id: 'jeera-rice',
    name: 'Jeera Rice',
    hindiName: 'जीरा राइस',
    emoji: '🍚',
    prepTime: '20 min',
    cookTime: '15 min',
    servingsBase: 3,
    ingredients: [
      { id: 'rice', name: 'Aged Basmati Rice', amount: 250, unit: 'g' },
      { id: 'water', name: 'Water', amount: 450, unit: 'ml' },
      { id: 'ghee', name: 'Ghee', amount: 25, unit: 'ml' },
      { id: 'cumin', name: 'Cumin Seeds (Jeera)', amount: 8, unit: 'g' },
      { id: 'bay_leaf', name: 'Bay Leaf (Tejpatta)', amount: 1, unit: 'pc' },
      { id: 'cardamom', name: 'Green Cardamom', amount: 2, unit: 'pcs' },
      { id: 'cinnamon', name: 'Cinnamon Stick (1 inch)', amount: 1, unit: 'pc' },
      { id: 'salt', name: 'Salt', amount: 6, unit: 'g' },
    ],
    steps: [
      {
        num: 1,
        title: 'Soak Basmati Rice',
        desc: 'Wash {rice} basmati rice gently 3 times. Soak in cold water for 20 minutes, then drain completely.',
        ingredientsUsed: ['rice'],
        timerSeconds: 1200,
        timerName: 'Rice Soaking',
      },
      {
        num: 2,
        title: 'Bloom Whole Spices',
        desc: 'Heat {ghee} ghee in a heavy-bottom pot. Add {cumin} cumin seeds, {bay_leaf} bay leaf, {cardamom} cardamom, and {cinnamon} cinnamon stick until aromatic.',
        ingredientsUsed: ['ghee', 'cumin', 'bay_leaf', 'cardamom', 'cinnamon'],
        timerSeconds: 60,
        timerName: 'Spice Bloom',
      },
      {
        num: 3,
        title: 'Gently Sauté Rice',
        desc: 'Add drained basmati rice to the spiced ghee. Sauté gently on medium heat for 2 minutes to coat every grain.',
        ingredientsUsed: ['rice'],
        timerSeconds: 120,
        timerName: 'Grain Sauté',
      },
      {
        num: 4,
        title: 'Add Water & Boil',
        desc: 'Pour {water} boiling water and {salt} salt. Stir once and let it come to a vigorous rolling boil.',
        ingredientsUsed: ['water', 'salt'],
      },
      {
        num: 5,
        title: 'Cover & Dum Simmer',
        desc: 'Cover pot with tight lid. Turn flame to absolute lowest simmer and cook undisturbed for 12 minutes.',
        ingredientsUsed: [],
        timerSeconds: 720,
        timerName: 'Dum Simmer',
      },
      {
        num: 6,
        title: 'Rest & Fluff',
        desc: 'Turn off heat. Let rest covered for 5 minutes. Fluff gently with a fork and serve fragrant rice.',
        ingredientsUsed: [],
      },
    ],
  },
  {
    id: 'upma',
    name: 'Vegetable Rava Upma',
    hindiName: 'सूजी वेज उपमा',
    emoji: '🍲',
    prepTime: '10 min',
    cookTime: '12 min',
    servingsBase: 2,
    ingredients: [
      { id: 'rava', name: 'Roasted Semolina (Rava)', amount: 150, unit: 'g' },
      { id: 'water', name: 'Water', amount: 450, unit: 'ml' },
      { id: 'mustard', name: 'Mustard Seeds (Rai)', amount: 5, unit: 'g' },
      { id: 'urad_dal', name: 'Urad Dal (Split Gram)', amount: 5, unit: 'g' },
      { id: 'chili', name: 'Green Chilies (chopped)', amount: 2, unit: 'pcs' },
      { id: 'ginger', name: 'Fresh Ginger (grated)', amount: 10, unit: 'g' },
      { id: 'veggies', name: 'Diced Carrots & Green Peas', amount: 80, unit: 'g' },
      { id: 'ghee', name: 'Ghee or Oil', amount: 20, unit: 'ml' },
      { id: 'curry_leaves', name: 'Curry Leaves', amount: 8, unit: 'pcs' },
      { id: 'lemon', name: 'Lemon Juice', amount: 10, unit: 'ml' },
    ],
    steps: [
      {
        num: 1,
        title: 'Dry Roast Rava',
        desc: 'Roast {rava} rava in pan over medium flame for 3 minutes until fragrant and lightly golden.',
        ingredientsUsed: ['rava'],
        timerSeconds: 180,
        timerName: 'Rava Roast',
      },
      {
        num: 2,
        title: 'Temper Aromatics',
        desc: 'Heat {ghee} ghee. Splutter {mustard} mustard seeds, {urad_dal} urad dal, {curry_leaves} curry leaves, {ginger} grated ginger, and {chili} green chilies.',
        ingredientsUsed: ['ghee', 'mustard', 'urad_dal', 'curry_leaves', 'ginger', 'chili'],
      },
      {
        num: 3,
        title: 'Sauté Veggies',
        desc: 'Add diced {veggies} carrots and peas with a pinch of salt. Sauté for 3 minutes until tender-crisp.',
        ingredientsUsed: ['veggies'],
        timerSeconds: 180,
        timerName: 'Veggie Sauté',
      },
      {
        num: 4,
        title: 'Boil Water',
        desc: 'Add {water} water and a pinch of salt. Bring to a rolling bubbling boil.',
        ingredientsUsed: ['water'],
        timerSeconds: 120,
        timerName: 'Water Boil',
      },
      {
        num: 5,
        title: 'Stream in Rava',
        desc: 'Slowly pour roasted rava in a steady stream while whisking continuously to prevent lumps.',
        ingredientsUsed: ['rava'],
      },
      {
        num: 6,
        title: 'Steam & Garnish',
        desc: 'Cover tightly on low heat for 3 minutes. Turn off heat, add {lemon} lemon juice, and fluff with a fork.',
        ingredientsUsed: ['lemon'],
        timerSeconds: 180,
        timerName: 'Upma Steam',
      },
    ],
  },
  {
    id: 'maggi',
    name: 'Street-Style Maggi Masala',
    hindiName: 'मसाला मैगी',
    emoji: '🍜',
    prepTime: '5 min',
    cookTime: '7 min',
    servingsBase: 1,
    ingredients: [
      { id: 'noodles', name: 'Maggi Noodles with Tastemaker', amount: 140, unit: 'g' },
      { id: 'water', name: 'Water', amount: 350, unit: 'ml' },
      { id: 'onion', name: 'Onion (finely chopped)', amount: 40, unit: 'g' },
      { id: 'tomato', name: 'Tomato (finely chopped)', amount: 40, unit: 'g' },
      { id: 'peas', name: 'Green Peas', amount: 30, unit: 'g' },
      { id: 'chili', name: 'Green Chili (chopped)', amount: 1, unit: 'pc' },
      { id: 'butter', name: 'Butter or Oil', amount: 15, unit: 'g' },
      { id: 'chili_powder', name: 'Red Chili Powder', amount: 2, unit: 'g' },
      { id: 'chaat_masala', name: 'Chaat Masala', amount: 2, unit: 'g' },
      { id: 'coriander', name: 'Fresh Coriander', amount: 10, unit: 'g' },
    ],
    steps: [
      {
        num: 1,
        title: 'Sauté Aromatics',
        desc: 'Melt {butter} butter in pan. Sauté chopped {onion} onions and {chili} green chili for 2 minutes until translucent.',
        ingredientsUsed: ['butter', 'onion', 'chili'],
        timerSeconds: 120,
        timerName: 'Onion Sauté',
      },
      {
        num: 2,
        title: 'Add Veggies & Spices',
        desc: 'Add {tomato} tomatoes, {peas} green peas, {chili_powder} chili powder, and {chaat_masala} chaat masala. Cook until tomatoes soften.',
        ingredientsUsed: ['tomato', 'peas', 'chili_powder', 'chaat_masala'],
        timerSeconds: 180,
        timerName: 'Tadka Cook',
      },
      {
        num: 3,
        title: 'Add Water & Tastemaker',
        desc: 'Pour {water} water. Stir in the Maggi tastemaker packets and bring to a rolling boil.',
        ingredientsUsed: ['water'],
      },
      {
        num: 4,
        title: 'Cook Noodles',
        desc: 'Break {noodles} noodle cakes into halves. Add to boiling water and cook uncovered on medium heat for 2 minutes.',
        ingredientsUsed: ['noodles'],
        timerSeconds: 120,
        timerName: 'Noodle Boil',
      },
      {
        num: 5,
        title: 'Simmer Broth',
        desc: 'Simmer gently until noodles absorb the spicy broth to your desired sauciness (approx 2 mins).',
        ingredientsUsed: [],
        timerSeconds: 120,
        timerName: 'Noodle Simmer',
      },
      {
        num: 6,
        title: 'Garnish & Serve',
        desc: 'Top with chopped {coriander} fresh coriander and an optional pat of butter. Serve steaming hot!',
        ingredientsUsed: ['coriander'],
      },
    ],
  },
];
