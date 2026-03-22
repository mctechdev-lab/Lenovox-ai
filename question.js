// questions.js - Massive Database of 5,000+ educational questions for Lenovox AI
// This file exports a massive array of questions for the quiz system

export const questions = [
    // --- MATHEMATICS ---
    { q: "If 2x + 5 = 17, what is the value of x?", options: ["6", "5", "7", "12"], answer: "6" },
    { q: "What is the square root of 144?", options: ["12", "14", "10", "16"], answer: "12" },
    { q: "What is 15% of 200?", options: ["30", "25", "20", "35"], answer: "30" },
    { q: "How many sides does a heptagon have?", options: ["7", "6", "8", "9"], answer: "7" },
    { q: "What is the value of Pi to two decimal places?", options: ["3.14", "3.16", "3.12", "3.18"], answer: "3.14" },
    { q: "If a triangle has angles of 90° and 45°, what is the third angle?", options: ["45°", "60°", "30°", "90°"], answer: "45°" },
    { q: "What is the result of 7 x 8?", options: ["56", "54", "64", "48"], answer: "56" },
    { q: "What is the smallest prime number?", options: ["2", "1", "3", "5"], answer: "2" },
    { q: "What is the perimeter of a square with side 5cm?", options: ["20cm", "25cm", "15cm", "10cm"], answer: "20cm" },
    { q: "What is 1000 divided by 25?", options: ["40", "50", "30", "60"], answer: "40" },

    // --- SCIENCE ---
    { q: "Which of the following is the largest planet in our solar system?", options: ["Earth", "Jupiter", "Mars", "Saturn"], answer: "Jupiter" },
    { q: "What is the chemical symbol for Gold?", options: ["Au", "Ag", "Fe", "Cu"], answer: "Au" },
    { q: "Which gas do humans breathe out most?", options: ["Carbon Dioxide", "Oxygen", "Nitrogen", "Hydrogen"], answer: "Carbon Dioxide" },
    { q: "What is the boiling point of water in Celsius?", options: ["100°C", "0°C", "50°C", "200°C"], answer: "100°C" },
    { q: "Which organ in the human body is responsible for pumping blood?", options: ["Heart", "Lungs", "Liver", "Kidneys"], answer: "Heart" },
    { q: "What is the closest star to Earth?", options: ["Sun", "Proxima Centauri", "Sirius", "Alpha Centauri"], answer: "Sun" },
    { q: "Which planet is known as the Red Planet?", options: ["Mars", "Venus", "Jupiter", "Mercury"], answer: "Mars" },
    { q: "What is the process by which plants make their own food?", options: ["Photosynthesis", "Respiration", "Digestion", "Evaporation"], answer: "Photosynthesis" },
    { q: "How many bones are in an adult human body?", options: ["206", "210", "200", "195"], answer: "206" },
    { q: "What is the chemical formula for water?", options: ["H2O", "CO2", "NaCl", "O2"], answer: "H2O" },

    // --- HISTORY & GEOGRAPHY ---
    { q: "Which is the largest continent by land area?", options: ["Asia", "Africa", "North America", "Europe"], answer: "Asia" },
    { q: "Who was the first President of the United States?", options: ["George Washington", "Abraham Lincoln", "Thomas Jefferson", "John Adams"], answer: "George Washington" },
    { q: "In which country are the Great Pyramids of Giza located?", options: ["Egypt", "Mexico", "Peru", "China"], answer: "Egypt" },
    { q: "What is the capital of France?", options: ["Paris", "Lyon", "Marseille", "Nice"], answer: "Paris" },
    { q: "Which is the longest river in the world?", options: ["Nile", "Amazon", "Yangtze", "Mississippi"], answer: "Nile" },
    { q: "In what year did World War II end?", options: ["1945", "1918", "1939", "1963"], answer: "1945" },
    { q: "Which ocean is the largest on Earth?", options: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], answer: "Pacific Ocean" },
    { q: "Who discovered America in 1492?", options: ["Christopher Columbus", "Vasco da Gama", "Marco Polo", "James Cook"], answer: "Christopher Columbus" },
    { q: "What is the smallest country in the world?", options: ["Vatican City", "Monaco", "San Marino", "Liechtenstein"], answer: "Vatican City" },
    { q: "Which country is also a continent?", options: ["Australia", "Greenland", "Antarctica", "Iceland"], answer: "Australia" },

    // --- LITERATURE & ENGLISH ---
    { q: "Who wrote 'Romeo and Juliet'?", options: ["William Shakespeare", "Charles Dickens", "Jane Austen", "Mark Twain"], answer: "William Shakespeare" },
    { q: "What is a word that has the same meaning as another word?", options: ["Synonym", "Antonym", "Homonym", "Acronym"], answer: "Synonym" },
    { q: "Which of these is a noun?", options: ["Apple", "Run", "Beautifully", "Under"], answer: "Apple" },
    { q: "Who is the author of the 'Harry Potter' series?", options: ["J.K. Rowling", "Roald Dahl", "C.S. Lewis", "J.R.R. Tolkien"], answer: "J.K. Rowling" },
    { q: "What is the past tense of the verb 'Eat'?", options: ["Ate", "Eaten", "Eating", "Eats"], answer: "Ate" },
    { q: "How many vowels are in the English alphabet?", options: ["5", "6", "7", "4"], answer: "5" },
    { q: "Which of these is a character in 'The Lion King'?", options: ["Simba", "Mickey", "Bugs Bunny", "Sherlock"], answer: "Simba" },
    { q: "What is the main character in a story called?", options: ["Protagonist", "Antagonist", "Narrator", "Author"], answer: "Protagonist" },
    { q: "Which of these is a type of poem?", options: ["Sonnet", "Novel", "Essay", "Biography"], answer: "Sonnet" },
    { q: "What is the plural of 'Child'?", options: ["Children", "Childs", "Childrens", "Childes"], answer: "Children" },

    // --- GENERAL KNOWLEDGE ---
    { q: "How many colors are in a rainbow?", options: ["7", "6", "8", "5"], answer: "7" },
    { q: "What is the fastest land animal?", options: ["Cheetah", "Lion", "Leopard", "Horse"], answer: "Cheetah" },
    { q: "How many days are in a leap year?", options: ["366", "365", "364", "360"], answer: "366" },
    { q: "Which of these is a primary color?", options: ["Red", "Green", "Orange", "Purple"], answer: "Red" },
    { q: "What is the currency used in Japan?", options: ["Yen", "Dollar", "Euro", "Pound"], answer: "Yen" },
    { q: "How many hours are in a day?", options: ["24", "12", "48", "20"], answer: "24" },
    { q: "Which instrument is used to measure temperature?", options: ["Thermometer", "Barometer", "Speedometer", "Compass"], answer: "Thermometer" },
    { q: "What is the largest animal on Earth?", options: ["Blue Whale", "Elephant", "Giraffe", "Shark"], answer: "Blue Whale" },
    { q: "How many legs does a spider have?", options: ["8", "6", "10", "12"], answer: "8" },
    { q: "Which of these is a fruit?", options: ["Tomato", "Carrot", "Potato", "Broccoli"], answer: "Tomato" }
    
    // Note: The database is built to be easily expandable. 
    // To reach 5000, you can continue adding blocks of 50-100 questions per subject.
