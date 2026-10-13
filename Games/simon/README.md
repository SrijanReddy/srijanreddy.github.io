# 🕹️ Classic Simon Game (Vanilla JavaScript)

A modern web-based clone of the classic electronic memory game, built using semantic HTML5, CSS3, and modern JavaScript. The engine leverages the **Web Audio API** for real-time sound synthesis (no external audio assets required) and relies strictly on a **functional-composition architecture** to control the game loop.

---

## 🚀 Live Demo
> 💡 **Try it here:** https://ayushpatel-hub.github.io/Simon-Game-JS/

---

## 🛠️ Features

*   **Dynamic Audio Engine:** Synthesizes sound frequencies locally using the Web Audio API (`triangle` oscillators for pads, `sawtooth` for errors).
*   **Responsive Layout:** Implements CSS Grid and Media Queries for a seamless experience across desktop, tablet, and mobile displays.
*   **Micro-interactions:** Smooth visual button press indicators and CSS transition triggers.
*   **Universal Input Handling:** Allows game initiation through both physical keyboard inputs and touch/mouse button triggers.

---

## 🏗️ Architecture & Functional Logic

The codebase heavily utilizes **functional composition** and **nested execution loops** (calling functions inside other functions) to manage state transitions asynchronously without bloating global scopes.

### 🎮 Functional Workflow

The Simon Game Loop
1.Game initializes:Start State.
The game starts at Level 1. The internal sequence array is completely empty, and the score is set to zero.
2.Add a new step:
Game's Turn.
The game randomly picks one of the four colors (usually Green, Red, Yellow, or Blue) and appends it to the end of the existing sequence array.



