/**
 * words.js
 * Purpose: Curated list of 5-letter target words and a larger valid-guess list.
 * Dependencies: None.
 * Responsibilities: Provide the secret-word pool and guess validation dictionary.
 * Interactions: Used by useGameLogic hook.
 */

// Secret word pool – common, recognizable 5-letter words
export const TARGET_WORDS = [
  'APPLE', 'BRAVE', 'CHAIR', 'DANCE', 'EAGLE',
  'FABLE', 'GRACE', 'HAPPY', 'IMAGE', 'JEWEL',
  'KNEEL', 'LEMON', 'MAGIC', 'NIGHT', 'OLIVE',
  'PIANO', 'QUEST', 'RIVER', 'SMILE', 'TIGER',
  'ULTRA', 'VALOR', 'WATER', 'XENON', 'YOUTH',
  'ZEBRA', 'AMBER', 'BLOOM', 'CANOE', 'DRIFT',
  'EMBER', 'FLUTE', 'GLOOM', 'HAVEN', 'INLET',
  'JOUST', 'KNAVE', 'LUNAR', 'MAPLE', 'NOBLE',
  'OCEAN', 'PRISM', 'QUILT', 'RIDGE', 'SHELF',
  'THETA', 'UMBRA', 'VENOM', 'WHEAT', 'YIELD',
  'ABIDE', 'BIOME', 'CLOAK', 'DIGIT', 'EPOCH',
  'FROWN', 'GRAIL', 'HEIST', 'IGLOO', 'JELLY',
  'KAYAK', 'LLAMA', 'MANOR', 'NYMPH', 'OUTDO',
  'PIXIE', 'QUIRK', 'REALM', 'SAVVY', 'TROUT',
  'ULTRA', 'VIOLA', 'WITCH', 'OXIDE', 'ZONAL',
  'AMPLE', 'BENCH', 'CRISP', 'DEPOT', 'EASEL',
  'FLAME', 'GLARE', 'HINGE', 'IRONY', 'JOINT',
  'KUDOS', 'LANCE', 'MIRTH', 'NERVE', 'ONSET',
  'PLUMB', 'QUAFF', 'RELIC', 'SPINE', 'TUNIC',
  'UNITE', 'VIVID', 'WALTZ', 'EXACT', 'YEARN',
  'ABBOT', 'BISON', 'CLAMP', 'DERBY', 'ELBOW',
  'FRESH', 'GRIND', 'HUMID', 'INDEX', 'JUMPY',
  'KINKY', 'LATCH', 'MIXER', 'NOTCH', 'OTTER',
  'PERCH', 'QUERY', 'ROVER', 'SWAMP', 'TITHE',
  'USURP', 'VYING', 'WRING', 'EXPEL', 'YEOMAN',
];

// Extended valid-guess dictionary (includes targets + more words)
export const VALID_WORDS = new Set([
  ...TARGET_WORDS,
  'ADAGE', 'AHEAD', 'ALOFT', 'AMONG', 'ANGEL', 'ANGRY',
  'ANKLE', 'ANTIC', 'ANVIL', 'ARDOR', 'AROSE', 'ARRAY',
  'ASCOT', 'ASIDE', 'ASKED', 'ATONE', 'ATTIC', 'AUDIO',
  'AUGUR', 'AVAIL', 'AVOID', 'AWAKE', 'AWARD', 'AWARE',
  'AWFUL', 'BADLY', 'BAKER', 'BASIC', 'BASIN', 'BASIS',
  'BATCH', 'BEACH', 'BEEFY', 'BEGIN', 'BEING', 'BELOW',
  'BIRCH', 'BIRTH', 'BLACK', 'BLADE', 'BLAND', 'BLANK',
  'BLAZE', 'BLEAK', 'BLEED', 'BLEND', 'BLESS', 'BLISS',
  'BLOND', 'BLOOD', 'BLOWN', 'BLUNT', 'BLURT', 'BLUSH',
  'BONUS', 'BOOST', 'BOOTH', 'BOUND', 'BRAIN', 'BRAND',
  'BREAD', 'BREAK', 'BREED', 'BRICK', 'BRIDE', 'BRIEF',
  'BRING', 'BROAD', 'BROKE', 'BROOD', 'BROOK', 'BROWN',
  'BRUSH', 'BUILT', 'BULLY', 'BUNCH', 'BURST', 'BUYER',
  'CABIN', 'CAMEL', 'CANDY', 'CANON', 'CARGO', 'CARRY',
  'CATCH', 'CEDAR', 'CHAIN', 'CHALK', 'CHAMP', 'CHAOS',
  'CHARM', 'CHASE', 'CHEAP', 'CHEAT', 'CHECK', 'CHEEK',
  'CHESS', 'CHEST', 'CHIEF', 'CHILD', 'CHIME', 'CIVIC',
  'CIVIL', 'CLAIM', 'CLASH', 'CLASP', 'CLASH', 'CLASS',
  'CLEAN', 'CLEAR', 'CLERK', 'CLICK', 'CLIFF', 'CLIMB',
  'CLING', 'CLOCK', 'CLONE', 'CLOSE', 'CLOTH', 'CLOUD',
  'COACH', 'COAST', 'COBRA', 'COMET', 'COMIC', 'COMMA',
  'CORAL', 'CORPS', 'COSTS', 'COUCH', 'COULD', 'COUNT',
  'COURT', 'COVER', 'CRACK', 'CRAFT', 'CRAVE', 'CRAWL',
  'CRAZY', 'CREAM', 'CREED', 'CREEK', 'CREST', 'CRIME',
  'CROSS', 'CROWD', 'CROWN', 'CRUSH', 'CRUST', 'CRUEL',
  'CURVE', 'CYCLE', 'DADDY', 'DAILY', 'DAIRY', 'DAISY',
  'DATED', 'DATES', 'DAUNT', 'DAZED', 'DEATH', 'DECAY',
  'DECRY', 'DEFER', 'DELAY', 'DELTA', 'DENSE', 'DEPTH',
  'DERBY', 'DUSTY', 'DYING', 'EARLY', 'EARTH', 'EIGHT',
  'ELITE', 'EMPTY', 'ENACT', 'ENDED', 'ENEMY', 'ENJOY',
  'ENTER', 'ENTRY', 'EQUAL', 'EQUIP', 'ERROR', 'ESSAY',
  'EVADE', 'EVENT', 'EVERY', 'EVICT', 'EXACT', 'EXALT',
  'EXCEL', 'EXIST', 'EXPEL', 'EXTRA', 'FAINT', 'FAIRY',
  'FAITH', 'FALLS', 'FANCY', 'FARCE', 'FATAL', 'FAULT',
  'FEAST', 'FEVER', 'FEWER', 'FIELD', 'FIEND', 'FIFTH',
  'FIFTY', 'FIGHT', 'FINAL', 'FIRST', 'FIXED', 'FIZZY',
  'FLAKY', 'FLANK', 'FLASK', 'FLASH', 'FLAIR', 'FLEET',
  'FLICK', 'FLING', 'FLOAT', 'FLOOD', 'FLOUR', 'FLUID',
  'FLUSH', 'FOCUS', 'FORGE', 'FORTY', 'FOUND', 'FRAME',
  'FRANK', 'FRAUD', 'FREAK', 'FREED', 'FRONT', 'FROST',
  'FROZE', 'FRUIT', 'FULLY', 'FUNGI', 'FUNNY', 'FURRY',
  'GAILY', 'GAUGE', 'GAVEL', 'GAWKY', 'GIDDY', 'GIANT',
  'GIVEN', 'GIZMO', 'GLAND', 'GLARE', 'GLASS', 'GLINT',
  'GLOBE', 'GLOAT', 'GLOVE', 'GLYPH', 'GOING', 'GOLEM',
  'GORGE', 'GOUGE', 'GOURD', 'GRAFT', 'GRAND', 'GRANT',
  'GRAPH', 'GRASP', 'GRASS', 'GRATE', 'GRAVE', 'GRAZE',
  'GREAT', 'GREED', 'GREEN', 'GREET', 'GRIEF', 'GRIME',
  'GROAN', 'GROSS', 'GROUP', 'GROVE', 'GROWL', 'GROWN',
  'GRUEL', 'GRUFF', 'GRUNT', 'GUARD', 'GUEST', 'GUIDE',
  'GUILD', 'GUILE', 'GUISE', 'GUSTO', 'GYPSY', 'HANDY',
  'HARSH', 'HASTE', 'HAUNT', 'HEART', 'HEAVE', 'HEAVY',
  'HEDGE', 'HELIX', 'HERBS', 'HERON', 'HILTS', 'HIPPO',
  'HOARD', 'HOLLY', 'HOMER', 'HONEY', 'HONOR', 'HORSE',
  'HOTEL', 'HOUND', 'HOUSE', 'HUMAN', 'HUMOR', 'HURRY',
  'ICING', 'IDEAL', 'IDIOM', 'IDIOT', 'INFER', 'INTER',
  'INTRO', 'INURE', 'INVENT', 'LABEL', 'LARGE', 'LASER',
  'LATER', 'LATTE', 'LAUGH', 'LAYER', 'LEAPT', 'LEARN',
  'LEASE', 'LEASH', 'LEGAL', 'LIGHT', 'LIMBO', 'LIMIT',
  'LITHE', 'LIVER', 'LOBBY', 'LOCAL', 'LODGE', 'LOGIC',
  'LONELY', 'LOOSE', 'LOFTY', 'LOVED', 'LOWER', 'LUCID',
  'LUMPY', 'LUSTY', 'LUSTRE', 'LYMPH', 'LYING', 'MAKER',
  'MARSH', 'MATCH', 'MAVEN', 'MAYOR', 'MELEE', 'MERCY',
  'MERIT', 'METAL', 'MICRO', 'MIGHT', 'MIMIC', 'MINOR',
  'MINUS', 'MISER', 'MOCHA', 'MODEL', 'MOIST', 'MONEY',
  'MONKS', 'MORAL', 'MORPH', 'MOTEL', 'MOTIF', 'MOTOR',
  'MOUNT', 'MOURN', 'MOVED', 'MOVER', 'MUDDY', 'MUMMY',
  'MUSIC', 'MUSTY', 'NAIVE', 'NASTY', 'NAVAL', 'NAVAL',
  'NIECE', 'NINJA', 'NINTH', 'NITRO', 'NORTH', 'NOTED',
  'NOVEL', 'NURSE', 'NYMPH', 'OAKEN', 'OASIS', 'OCCUR',
  'OFTEN', 'OMIAL', 'OPTIC', 'ORDER', 'OTHER', 'OUGHT',
  'OUTER', 'OWNER', 'OXIDE', 'OZONE', 'PACED', 'PAINT',
  'PANEL', 'PANIC', 'PAPER', 'PARTY', 'PATCH', 'PAUSE',
  'PEACE', 'PEACH', 'PEARL', 'PEDAL', 'PENNY', 'PHASE',
  'PHONE', 'PHOTO', 'PILOT', 'PINCH', 'PIXEL', 'PLACE',
  'PLAIN', 'PLANE', 'PLANK', 'PLANT', 'PLATE', 'PLAZA',
  'PLEAD', 'PLUCK', 'PLUME', 'PLUNGE', 'POINT', 'POKER',
  'POLAR', 'POPPY', 'PORCH', 'POSED', 'POWER', 'PRESS',
  'PRICE', 'PRIDE', 'PRIME', 'PRINT', 'PRIOR', 'PRIZE',
  'PROBE', 'PROOF', 'PROSE', 'PROUD', 'PROVE', 'PROWL',
  'PSALM', 'PETAL', 'PULSE', 'PUNCH', 'PUPIL', 'PURGE',
  'QUEEN', 'QUICK', 'QUIET', 'QUOTA', 'QUOTE', 'RACER',
  'RADAR', 'RADIO', 'RAINY', 'RAISE', 'RALLY', 'RAMEN',
  'RANCH', 'RANGE', 'RAPID', 'RAVEN', 'REACH', 'REBEL',
  'REIGN', 'RELAX', 'REPAY', 'REPEL', 'RERUN', 'RESET',
  'RISKY', 'RIVAL', 'ROAST', 'ROBES', 'ROCKY', 'ROUGE',
  'ROUGH', 'ROUTE', 'ROYAL', 'RUGBY', 'RULER', 'RUPEE',
  'RUSTY', 'SADLY', 'SAINT', 'SALAD', 'SAUCE', 'SCALE',
  'SCENE', 'SCENT', 'SCOUT', 'SCREAM', 'SENSE', 'SERUM',
  'SERVE', 'SEVEN', 'SHARD', 'SHARE', 'SHARK', 'SHARP',
  'SHEEN', 'SHEEP', 'SHEER', 'SHIFT', 'SHINE', 'SHOCK',
  'SHORE', 'SHORT', 'SHOUT', 'SHRED', 'SHRUB', 'SIEGE',
  'SIREN', 'SIXTH', 'SIXTY', 'SKILL', 'SKULL', 'SLACK',
  'SLAIN', 'SLANT', 'SLASH', 'SLATE', 'SLEEK', 'SLEEP',
  'SLEET', 'SLEPT', 'SLICE', 'SLIDE', 'SLIME', 'SLINK',
  'SLOPE', 'SLOTH', 'SLUMP', 'SLUNK', 'SLURP', 'SNACK',
  'SNAIL', 'SNAKE', 'SNARE', 'SNARL', 'SNEAK', 'SNEER',
  'SNIFF', 'SNORE', 'SNORT', 'SNOUT', 'SNOWY', 'SOBER',
  'SOLAR', 'SOLVE', 'SONIC', 'SOOTY', 'SORRY', 'SOUTH',
  'SPACE', 'SPADE', 'SPARE', 'SPARK', 'SPAWN', 'SPEAK',
  'SPEAR', 'SPEED', 'SPEND', 'SPICE', 'SPILL', 'SPITE',
  'SPOIL', 'SPOKE', 'SPOOK', 'SPORT', 'SPRAY', 'SPREE',
  'SQUAD', 'SQUID', 'STAFF', 'STAGE', 'STAIN', 'STAKE',
  'STALE', 'STALL', 'STAMP', 'STAND', 'STARE', 'START',
  'STASH', 'STATE', 'STAYS', 'STEAL', 'STEAM', 'STEEL',
  'STEEP', 'STEER', 'STERN', 'STICK', 'STIFF', 'STILL',
  'STING', 'STOCK', 'STOIC', 'STONE', 'STOOD', 'STOOL',
  'STORM', 'STORY', 'STOUT', 'STRAP', 'STRAY', 'STRIP',
  'STRUT', 'STUCK', 'STUDY', 'STUMP', 'STUNG', 'STUNK',
  'STYLE', 'SUGAR', 'SUITE', 'SUNNY', 'SUPER', 'SURGE',
  'SWEAR', 'SWEAT', 'SWEEP', 'SWEET', 'SWIFT', 'SWIPE',
  'SWIRL', 'SWOON', 'SWORD', 'SYNTH', 'TABBY', 'TABLE',
  'TALON', 'TANGO', 'TASTE', 'TEACH', 'TEASE', 'TEETH',
  'TEMPO', 'TENSE', 'TEPID', 'TERSE', 'THEIR', 'THIEF',
  'THING', 'THINK', 'THORN', 'THOSE', 'THREE', 'THROW',
  'THUMB', 'TIDAL', 'TIGHTLY', 'TILT', 'TIPSY', 'TIRED',
  'TITAN', 'TODAY', 'TOKEN', 'TORCH', 'TOTAL', 'TOUCH',
  'TOUGH', 'TOXIC', 'TRACE', 'TRACK', 'TRADE', 'TRAIL',
  'TRAIN', 'TRAMP', 'TRASH', 'TREAD', 'TREAT', 'TREND',
  'TRIAL', 'TRIBE', 'TRICK', 'TRIED', 'TROOP', 'TRULY',
  'TRUMP', 'TRUNK', 'TRUST', 'TRUTH', 'TULIP', 'TUMOR',
  'TURBO', 'TWIST', 'TYPED', 'UNTIE', 'UPPER', 'UPSET',
  'USUAL', 'UTTER', 'VAGUE', 'VALID', 'VAULT', 'VEGAN',
  'VICAR', 'VIDEO', 'VIGOR', 'VIRAL', 'VISIT', 'VISTA',
  'VITAL', 'VIXEN', 'VOCAL', 'VODKA', 'VOMIT', 'VOTER',
  'VULVA', 'WAGED', 'WAVER', 'WEARY', 'WEDGE', 'WEIGH',
  'WEIRD', 'WELLS', 'WENCH', 'WHOLE', 'WHOSE', 'WIDER',
  'WIELD', 'WINDY', 'WITCH', 'WOMEN', 'WOODY', 'WORLD',
  'WORRY', 'WORSE', 'WORST', 'WORTH', 'WOULD', 'WOUND',
  'WRATH', 'WRIST', 'WROTE', 'YACHT', 'YELPS', 'YOUNG',
  'YOURS', 'YUCKY', 'ZESTY', 'ZIPPY', 'ZONED',
]);

/**
 * Returns a random target word from the pool.
 * Uses the current date as a seed so the word changes daily,
 * but is consistent throughout the day (like Wordle).
 * @returns {string} uppercase 5-letter word
 */
export function getDailyWord() {
  const now = new Date();
  const dayIndex =
    Math.floor(
      (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
        Date.UTC(2024, 0, 1)) /
        86400000
    ) % TARGET_WORDS.length;
  return TARGET_WORDS[Math.abs(dayIndex)];
}

/**
 * Returns a truly random word (for practice / replay mode).
 * @returns {string} uppercase 5-letter word
 */
export function getRandomWord() {
  return TARGET_WORDS[Math.floor(Math.random() * TARGET_WORDS.length)];
}

/**
 * Checks whether a string is a valid 5-letter guess.
 * @param {string} word
 * @returns {boolean}
 */
export function isValidWord(word) {
  return VALID_WORDS.has(word.toUpperCase());
}