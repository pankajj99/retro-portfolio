# Retro 90s Coding Portfolio - Pankaj Yadav

A premium, interactive retro developer portfolio for **Pankaj Yadav**, paying homage to the classic coding eras of the 1990s. 

---

## Features

1. **Retro Hardware Console Switcher**: Floating device on the screen to switch themes, toggle CRT screen scanline styling, and enable/disable synthesized sound effects.
2. **Boot Screen**: Recreates a classic 1994 ROM BIOS test and MS-DOS boot sequence, accompanied by floppy disk stepper drive seek sounds.
3. **MS-DOS CLI Prompt**: A fully functional command line interpreter. Type `HELP` for commands like `DIR`, `TYPE ABOUT.TXT`, `SKILLS` (ASCII chart), `MATRIX` (falling code screensaver), `GUI`, and `TC`.
4. **Turbo C++ IDE**: Recreates the classic blue Borland IDE with double borders. Read C++ code representations of the resume (`ABOUT.CPP`, `SKILLS.H`, `EXP.CPP`, etc.). Click **Compile** or **Run** (or use shortcuts) to witness progress bars compiling lines of code, leading to console outputs.
5. **Windows 95 GUI**: A desktop interface with draggable windows, customizable desktop icons, a Start Menu, system clock, a synthesized Mail sender dialog, and a fully functioning **Minesweeper** game.

---

## Project Structure

- `index.html`: The HTML layout containing boot layers, DOS terminals, Borland IDE mockups, and Windows 95 desktop structure.
- `style.css`: Custom theme variables, CRT scanline vignette overlays, flickering effects, Win95 beveled window buttons, and table alignments.
- `script.js`: Audio synthesizers (PC speaker, keystroke noise, floppy motors), CLI input parsers, Win95 window drag/drop manager, Minesweeper gameplay, and screensavers.
- `README.md`: This configuration guide.

---

## Getting Started

### 1. Place Profile Picture (Optional but Recommended)
For your photo to appear inside the Windows 95 *WordPad* resume window, copy your profile picture and save it in the root folder of this project as:
`C:\Users\27pan\.gemini\antigravity\scratch\retro-portfolio\profile.png`

### 2. Start a Local Web Server
Because the browser restricts certain capabilities (like Web Audio contexts or image loading) when loading files directly using the `file://` protocol, you should run the project using a local web server:

**Option A: Using Node (Recommended)**
Run this command from your terminal:
```bash
npx http-server C:\Users\27pan\.gemini\antigravity\scratch\retro-portfolio
```

**Option B: Using Python**
Run this command from your terminal:
```bash
python -m http.server 8000 --directory C:\Users\27pan\.gemini\antigravity\scratch\retro-portfolio
```

Open `http://localhost:8080` (or `http://localhost:8000`) in your browser to view the portfolio.
