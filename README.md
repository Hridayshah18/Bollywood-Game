# 🎬 Bollywood Game

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

**A Bollywood-themed browser quiz game built with Next.js, React, TypeScript, and CSS.**

> *A fast, filmi challenge where players test their Bollywood memory through dialogues, actors, movie clues, and iconic line completions.*

Bollywood Game is an interactive quiz experience that presents players with short five-question sessions pulled from a curated Bollywood content catalog. Players can start a mixed round or choose from four game modes: Dialogue Duel, Movie Pyramid, Finish the Line, and Who Said It?. The game tracks score, combo bonuses, correct answers, XP, coins, high score, and session-level content history to keep recent questions from repeating.

---

## 📋 Table of Contents

* [Key Features](#-key-features)
* [Gameplay](#-gameplay)
* [Tech Stack](#-tech-stack)
* [Repository Structure](#-repository-structure)
* [Installation](#-installation)
* [How to Play](#-how-to-play)
* [Controls](#-controls)
* [Game Architecture](#-game-architecture)
* [Screenshots](#-screenshots)
* [Live Demo](#-live-demo)
* [Limitations & Future Work](#️-limitations--future-work)
* [Contributing](#-contributing)
* [License](#-license)
* [Authors](#-authors)
* [Acknowledgments](#-acknowledgments)

---

## ✨ Key Features

* **Four Bollywood Quiz Modes:** Includes Dialogue Duel, Movie Pyramid, Finish the Line, and Who Said It? challenges.
* **Interactive Question Flow:** Players answer multiple-choice questions and move through five rounds per session.
* **Dynamic Score Tracking:** Correct answers add points, while combo streaks add bonus points.
* **Progress & Rewards System:** XP, coins, streak, and high score are tracked in browser storage.
* **Content Diversity Logic:** A session blacklist prevents recently used canonical questions and related clues from repeating too quickly.
* **Animated Interface:** Framer Motion and CSS transitions power screen changes, hover states, reveal panels, and confetti effects.
* **Sound Toggle:** The game generates simple tap, correct, and wrong answer tones with the browser AudioContext API.
* **Responsive Browser Design:** CSS media queries adapt navigation, cards, answer grids, and result layouts for smaller screens.

---

## 🎮 Gameplay

The objective is to answer as many Bollywood questions correctly as possible across a five-round session.

The game starts on a home screen with quick access to a mixed round and four themed challenge cards. Each round displays one question, four answer options, the current score, round progress, and combo status. The player selects an answer with a click or tap.

For standard dialogue, actor, and finish-the-line challenges, the player chooses one option and immediately receives feedback. For Movie Pyramid questions, the player starts with one clue and can reveal additional clues before answering; each extra clue lowers the available points for that question.

Correct answers add the challenge's point value plus any combo bonus. Wrong answers reset the combo. At the end of five rounds, the result screen shows the final score, correct answer count, earned XP, earned coins, and whether the score is a new personal best. The player can start another round or return home.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| ---------- | ------- |
| Next.js | App framework and local development server |
| React | Component-based game interface |
| TypeScript | Typed game data, state, and content logic |
| CSS3 | Styling, layout, responsive design, and visual effects |
| Framer Motion | Screen transitions and animated UI interactions |
| Lucide React | Interface icons |
| Web Audio API | Generated feedback tones for taps and answers |
| localStorage | Persistent XP, coins, streak, and high score |
| sessionStorage | Per-session content blacklist history |

This project has npm dependencies and runs as a Next.js application. It is not a plain static `index.html` game; there is no `index.html` file in the repository. Use the npm scripts in `package.json` to run, build, test, or start the project.

---

## 📂 Repository Structure

```text
bollywood-game/
│
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── data/
│   └── raw/
│       ├── dialogue-duel.json
│       ├── finish-the-line.json
│       ├── movie-pyramid.json
│       └── who-said-it.json
├── lib/
│   ├── content-engine.test.ts
│   ├── content-engine.ts
│   ├── game-data.ts
│   └── master-content-manager.ts
├── public/
│   └── assets/
│       ├── bollyverse-hero.png
│       └── bollyverse-hero-traditional.png
├── .gitignore
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json
```

| File / Folder | Purpose |
| ------------- | ------- |
| `app/page.tsx` | Main game UI, screens, state, scoring, sound, and user interactions |
| `app/layout.tsx` | Next.js root layout and metadata |
| `app/globals.css` | Global styling, animations, responsive rules, and visual design |
| `data/raw/` | Raw JSON content for dialogue, actor, pyramid, and finish-the-line modes |
| `lib/game-data.ts` | Curated challenge definitions and shared challenge types |
| `lib/content-engine.ts` | Challenge validation, diverse selection, and session blacklist logic |
| `lib/master-content-manager.ts` | Imports raw content, builds generated challenge variants, filters, and selects sessions |
| `lib/content-engine.test.ts` | Node test coverage for content selection, validation, filtering, and blacklist behavior |
| `public/assets/` | Hero artwork used by the game interface |
| `package.json` | Project metadata, dependencies, and npm scripts |
| `next.config.mjs` | Next.js configuration |

---

## 🚀 Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/bollywood-game.git
cd bollywood-game
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

Start the production server after building:

```bash
npm start
```

Run the test suite:

```bash
npm test
```

Then open the local URL shown by Next.js in your browser, usually `http://localhost:3000`.

---

## 🕹️ How to Play

1. Open the game in the browser.
2. Click **Start Playing** for a mixed session, or choose one of the four game cards.
3. Read the Bollywood question, dialogue, line prompt, or clue set.
4. Select one of the multiple-choice answers.
5. In Movie Pyramid, optionally reveal another clue before answering.
6. Review the correct or incorrect feedback after each answer.
7. Continue until all five rounds are complete.
8. Check your final score, correct answers, XP, coins, and personal best on the result screen.
9. Click **One more round** to play again or **Back home** to return to the home screen.

---

## 🎯 Controls

| Action | Control |
| ------ | ------- |
| Start mixed game | `Start Playing` button click |
| Choose game mode | Game card click |
| Select answer | Answer button click |
| Reveal extra Movie Pyramid clue | `Reveal another clue` button click |
| Continue to next round | `Next challenge` button click |
| View final results | `See results` button click |
| Restart game | `One more round` button click |
| Return home | Brand, `Exit`, or `Back home` button click |
| Toggle sound | Sound icon button click |
| Open mobile menu | Menu button click |

The current implementation is button and mouse/touch driven. No keyboard gameplay controls are implemented in the code.

---

## 🧠 Game Architecture

### 1. Game Initialization

The Next.js app renders from `app/page.tsx`. On load, React initializes the home screen, validates the content catalog, reads saved progress from `localStorage`, and restores the session content blacklist from `sessionStorage` when available.

### 2. State Management

Game state is handled with React `useState` and `useRef`. The main state includes the active screen, saved XP/coins/streak/high score, sound preference, selected rounds, current round index, score, combo, and number of correct answers. Save data is written back to `localStorage` whenever it changes.

### 3. User Interaction

Buttons and game cards trigger event handlers for starting a session, selecting modes, answering questions, revealing pyramid clues, moving to the next round, exiting, restarting, and toggling sound. Question options are shuffled with `useMemo` for each challenge.

### 4. Core Game Logic

`MASTER_CONTENT_MANAGER.selectSession()` selects five challenges using filters, preferred mode, preferred difficulty, and a session blacklist. Correct answers add points, and active combos add a bonus. Movie Pyramid questions reduce available points when extra clues are revealed. Finishing the fifth round updates XP, coins, and high score.

### 5. UI Updates

The interface updates through React rendering and conditional screen components. Framer Motion animates screen transitions, cards, clue reveals, result panels, and tap states. CSS handles layout, responsive behavior, hover states, answer feedback, and confetti animation.

---

## 📸 Screenshots

[Add screenshot here]

---

## 🌐 Live Demo

[Play Bollywood Game here](https://YOUR_USERNAME.github.io/bollywood-game/)

---

## ⚠️ Limitations & Future Work

* [ ] Add more Bollywood questions/content
* [ ] Improve mobile responsiveness
* [ ] Add background music
* [ ] Add difficulty level selection in the UI
* [ ] Add a leaderboard
* [ ] Add keyboard controls for answer selection
* [ ] Add accessibility improvements for focus states and screen reader feedback
* [ ] Add a real daily challenge reset system
* [ ] Replace placeholder leaderboard/profile elements with working features

---

## 🤝 Contributing

Contributions are welcome. To contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the game locally.
5. Submit a pull request.

```bash
git checkout -b feature/your-feature-name
```

---

## 📜 License

This project is intended to be released under the **MIT License**. Add a `LICENSE` file before publishing if you want others to reuse or contribute to the project.

---

## 👨‍💻 Authors

| Name | GitHub |
| ---- | ------ |
| Hriday Shah | [@Hridayshah18](https://github.com/Hridayshah18) |
| mokshesh sheth | [@shethmokshesh08-jpg](https://github.com/shethmokshesh08-jpg) |
---

## 🙌 Acknowledgments

* Browser APIs used for storage, scrolling, and generated audio feedback
* Next.js, React, TypeScript, Framer Motion, and Lucide React
* Bollywood films, dialogues, and entertainment culture that inspired the game content

---
