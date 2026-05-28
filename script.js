/* ==========================================================================
   RETRO 90S PORTFOLIO SCRIPT
   Logic for DOS CLI, Turbo C++ Compiler, Win95 Window Manager, Minesweeper & Web Audio
   ========================================================================== */

// --- Global App State ---
let currentMode = 'boot';
let isSoundEnabled = true;
let isCRTEnabled = true;
let audioCtx = null;

// --- Web Audio API Synthesizer (Retro PC Speaker & Keyboard Clicks) ---
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playBeep(frequency, duration, type = 'square') {
    if (!isSoundEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        
        // Classic PC speaker sound is flat and immediate
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {
        console.warn("Audio context error:", e);
    }
}

// Synthesize keyboard click sounds
function playKeyClick() {
    if (!isSoundEnabled) return;
    try {
        const ctx = getAudioContext();
        const bufferSize = ctx.sampleRate * 0.02; // 20ms click
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Fill buffer with random noise for a click sound
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start();
    } catch (e) {
        // Fallback to simple short sine beep if noise fails
        playBeep(1200, 0.01, 'sine');
    }
}

// Synthesize retro floppy drive motor seek sound
function playFloppySound() {
    if (!isSoundEnabled) return;
    try {
        const ctx = getAudioContext();
        const duration = 0.8;
        const now = ctx.currentTime;
        
        // A series of steps/clicks
        for (let i = 0; i < 15; i++) {
            const time = now + (i * 0.05);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.frequency.setValueAtTime(80 + (i * 12), time);
            gain.gain.setValueAtTime(0.04, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(time);
            osc.stop(time + 0.03);
        }
    } catch (e) {}
}

// Toggle Sound
function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    const btn = document.getElementById('soundToggle');
    btn.textContent = `SOUND: ${isSoundEnabled ? 'ON' : 'OFF'}`;
    if (isSoundEnabled) {
        btn.classList.add('active');
        playBeep(880, 0.1);
    } else {
        btn.classList.remove('active');
    }
}

// Toggle CRT filter
function toggleCRT() {
    isCRTEnabled = !isCRTEnabled;
    const btn = document.getElementById('crtToggle');
    btn.textContent = `CRT FILTER: ${isCRTEnabled ? 'ON' : 'OFF'}`;
    if (isCRTEnabled) {
        btn.classList.add('active');
        document.body.classList.add('crt-enabled');
        document.body.classList.remove('crt-disabled');
    } else {
        btn.classList.remove('active');
        document.body.classList.remove('crt-enabled');
        document.body.classList.add('crt-disabled');
    }
}

// --- BIOS / DOS Boot Screen Logic ---
const bootLines = [
    "ROM BIOS (C) 1994 PANKAJ_OS Technologies Inc.",
    "Checking RAM: 65536 KB OK",
    "Floppy Drive A: Found (1.44MB 3.5\")",
    "Floppy Drive B: Not Present",
    "IDE Primary Master: PANKAJ_YADAV_HD (1.2GB LBA Mode)",
    "    Partition 1: FAT16 (Active)",
    "IDE Secondary Master: CD-ROM Drive (4X speed)",
    "--------------------------------------------------",
    "Loading Boot Sector from Hard Disk... Ready.",
    "Starting MS-DOS 6.22...",
    " ",
    "C:\\>LOADHIGH /L:1,12032 DOSKEY.COM /INSERT",
    "C:\\>SET PATH=C:\\DOS;C:\\PANKAJ;C:\\TC\\BIN",
    "C:\\>SET TEMP=C:\\TEMP",
    "C:\\>LH SMARTDRV.EXE 1024 512",
    "C:\\>DEVICE=C:\\DOS\\ANSI.SYS",
    "C:\\>DEVICE=C:\\DOS\\HIMEM.SYS /VERBOSE",
    "C:\\>CD PANKAJ",
    "C:\\PANKAJ>ECHO SYSTEM INITIALIZATION SUCCESSFUL.",
    "SYSTEM INITIALIZATION SUCCESSFUL.",
    "C:\\PANKAJ>DIR PORTFOLIO.EXE",
    " Volume in drive C has no label.",
    " Directory of C:\\PANKAJ",
    " ",
    "PORTFOLIO EXE      245,760  05-27-96  18:24p",
    "         1 File(s)        245,760 bytes",
    " ",
    "C:\\PANKAJ>_"
];

function renderBootText() {
    const bootContainer = document.getElementById('bootText');
    let lineIdx = 0;

    // Show temporary notification about beeper activation on interaction
    setTimeout(() => {
        const beeper = document.getElementById('beeperBanner');
        if (beeper) beeper.style.display = 'flex';
    }, 100);

    function printNextLine() {
        if (lineIdx < bootLines.length) {
            let delay = 90 + Math.random() * 80;
            const line = bootLines[lineIdx];
            
            if (line.includes("Loading Boot Sector")) {
                delay = 800; // Simulate HDD spinup delay
                playFloppySound();
            } else if (line.includes("Starting MS-DOS")) {
                delay = 500;
                playBeep(440, 0.15); // Start beep
            } else if (line.includes("PORTFOLIO EXE")) {
                delay = 300;
            }

            bootContainer.textContent += line + "\n";
            lineIdx++;
            
            // Scroll boot view to bottom
            const container = document.getElementById('mode-boot');
            container.scrollTop = container.scrollHeight;

            setTimeout(printNextLine, delay);
        } else {
            // Boot sequence complete
            document.getElementById('bootAction').classList.remove('hidden');
            playBeep(660, 0.1);
            setTimeout(() => playBeep(880, 0.15), 100);
        }
    }
    
    printNextLine();
}

function startSystem() {
    getAudioContext(); // Initialize audio context on click
    playBeep(1000, 0.2);
    changeMode('dos'); // Boot into MS-DOS CLI first
}

// Trigger boot sequencing on window load
window.addEventListener('load', () => {
    renderBootText();
    // Update Win95 clock
    updateClock();
    setInterval(updateClock, 60000);
});

// --- Mode Switching Handler ---
function changeMode(mode) {
    if (mode === currentMode) return;
    
    // Deactivate screensaver canvas if running
    stopMatrixScreensaver();

    // Toggle CSS mode views
    document.querySelectorAll('.system-mode').forEach(el => {
        el.classList.remove('active');
    });
    
    document.getElementById(`mode-${mode}`).classList.add('active');
    
    // Toggle active state in floating switcher
    document.querySelectorAll('.switch-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (mode === 'boot') document.getElementById('btnBoot').classList.add('active');
    if (mode === 'dos') {
        document.getElementById('btnDos').classList.add('active');
        document.getElementById('cliInput').focus();
        playBeep(523.25, 0.08); // C5 note
    }
    if (mode === 'tc') {
        document.getElementById('btnTc').classList.add('active');
        selectTCFile('ABOUT.CPP'); // Preload first C++ file
        playBeep(587.33, 0.08); // D5 note
    }
    if (mode === 'win') {
        document.getElementById('btnWin').classList.add('active');
        initMinesweeper(); // Reset Minesweeper board
        playBeep(659.25, 0.08); // E5 note
    }
    
    currentMode = mode;
}

// --- MS-DOS CLI shell logic ---
const cliInput = document.getElementById('cliInput');
const cliOutput = document.getElementById('cliOutput');

// Sound click listener on keypress for input
cliInput.addEventListener('keypress', (e) => {
    playKeyClick();
});

cliInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const command = cliInput.value.trim();
        executeCLICommand(command);
        cliInput.value = '';
    }
});

// Document click focuses CLI input in DOS mode
document.getElementById('mode-dos').addEventListener('click', () => {
    cliInput.focus();
});

const simulatedFiles = {
    'about.txt': "ABOUT PANKAJ YADAV:\nA dedicated and adaptable fresher Java & Web Developer aiming to contribute effectively to a collaborative team. Quick learner, adaptable to new environments, and possesses a strong work ethic.\nDOB: 27/09/2002\nContact: 27pankaj2002@gmail.com | +91-7228051794",
    'skills.txt': "TECHNICAL SKILLS:\n- Languages: Java, HTML5, CSS3, JavaScript\n- Styles & frameworks: Bootstrap, React.js\n- Databases: MySQL\n- Design Tools: Figma, Canva\n- Competency: Data Structures & Algorithms (DSA)",
    'exp.txt': "WORK EXPERIENCE:\n\n1. DataTech Infosoft - Vapi | Intern (Jan'25 - Mar'25)\n- Developed responsive web pages using HTML, CSS, Bootstrap.\n- Collaborated to solve client-based web solutions.\n\n2. INFOLABZ IT SERVICES | React Developer Intern (Jun'24 - Jul'24)\n- Gained hands-on experience in React.js UI building, component state management, hooks.\n- Modular development through API calls.",
    'projects.txt': "COMPLETED PROJECTS:\n\n1. Client License Management System (CLMS) (June'25 - July'25)\n- Web application to issue, track, and renew software licenses.\n- Java backend, HTML/CSS/JS frontend.\n\n2. Fuel & Fix (July'22)\n- Emergency fuel delivery and mechanic finder portal.\n- Backend Java logic, React.js frontend.",
    'contact.txt': "CONTACT INSTRUCTIONS:\nSend email to: 27pankaj2002@gmail.com\nLinkedIn Profile: https://linkedin.com/in/pankaj-yadav-2709\nPhone Support: +91-7228051794\nOr run Win95 mode to open Contact.exe mail assistant."
};

function executeCLICommand(cmdText) {
    const rawCmd = cmdText.trim();
    const parts = rawCmd.split(' ');
    const command = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').toLowerCase();

    // Print command entered
    const pInput = document.createElement('p');
    pInput.innerHTML = `<span class="cli-prompt">C:\\PANKAJ&gt;</span>${rawCmd}`;
    cliOutput.appendChild(pInput);

    const pResponse = document.createElement('div');
    pResponse.style.margin = "5px 0 15px 0";

    if (command === '') {
        // Empty command does nothing
        return;
    }

    switch (command) {
        case 'help':
            pResponse.innerHTML = `
            <p>Available commands:</p>
            <table class="cli-table">
                <tr><td><span class="highlight">HELP</span></td><td>Display this help text</td></tr>
                <tr><td><span class="highlight">DIR</span> or <span class="highlight">LS</span></td><td>List directory contents</td></tr>
                <tr><td><span class="highlight">TYPE &lt;file&gt;</span> or <span class="highlight">CAT</span></td><td>Display contents of a text file (e.g. TYPE ABOUT.TXT)</td></tr>
                <tr><td><span class="highlight">CLS</span> or <span class="highlight">CLEAR</span></td><td>Clear screen console</td></tr>
                <tr><td><span class="highlight">SKILLS</span></td><td>Show visual technical skills bar chart</td></tr>
                <tr><td><span class="highlight">EXPERIENCE</span></td><td>Show experience logs</td></tr>
                <tr><td><span class="highlight">PROJECTS</span></td><td>Show project list</td></tr>
                <tr><td><span class="highlight">CONTACT</span></td><td>Show developer contact information</td></tr>
                <tr><td><span class="highlight">WIN</span> or <span class="highlight">GUI</span></td><td>Load Windows 95 Desktop GUI</td></tr>
                <tr><td><span class="highlight">TC</span></td><td>Load Turbo C++ IDE Editor</td></tr>
                <tr><td><span class="highlight">MATRIX</span></td><td>Launch green glowing code screensaver</td></tr>
            </table>`;
            break;
            
        case 'dir':
        case 'ls':
            pResponse.innerHTML = `
             Volume in drive C has no label.
             Directory of C:\\PANKAJ\\<br><br>
            .               &lt;DIR&gt;        05-27-26   6:24p<br>
            ..              &lt;DIR&gt;        05-27-26   6:24p<br>
            ABOUT    TXT            512  05-27-26   6:24p<br>
            SKILLS   TXT            256  05-27-26   6:24p<br>
            EXP      TXT           1024  05-27-26   6:24p<br>
            PROJECTS TXT           1024  05-27-26   6:24p<br>
            CONTACT  TXT            256  05-27-26   6:24p<br>
            PORTFOLIO EXE       245,760  05-27-26   6:24p<br>
            MATRIX   COM        102,400  05-27-26   6:24p<br>
                   7 File(s)        351,232 bytes<br>
                   2 Dir(s)      12,504,800 bytes free`;
            break;
            
        case 'cls':
        case 'clear':
            cliOutput.innerHTML = '';
            playBeep(880, 0.05);
            return;
            
        case 'type':
        case 'cat':
            if (!arg) {
                pResponse.innerHTML = `<span class="highlight">Required parameter missing.</span> Usage: TYPE [filename]`;
                playBeep(220, 0.25);
            } else if (simulatedFiles[arg]) {
                // Replace newlines with <br>
                pResponse.innerHTML = simulatedFiles[arg].replace(/\n/g, '<br>');
            } else {
                pResponse.innerHTML = `File not found - <span class="highlight">${arg}</span>`;
                playBeep(220, 0.25);
            }
            break;
            
        case 'skills':
            pResponse.innerHTML = `
            <strong>Pankaj Yadav's Technical Skill Evaluation:</strong><br><br>
            Java Development:       [====================] 85%<br>
            HTML5 / CSS3:           [======================] 90%<br>
            Bootstrap:              [====================] 85%<br>
            React.js:               [==================] 75%<br>
            MySQL:                  [===================] 80%<br>
            Figma & Canva:          [================] 70%<br>
            DSA (Structures):       [==================] 75%<br><br>
            Soft Skills: TEAMWORK | LEADERSHIP | MULTI-TASKING`;
            break;
            
        case 'experience':
        case 'exp':
            pResponse.innerHTML = simulatedFiles['exp.txt'].replace(/\n/g, '<br>');
            break;
            
        case 'projects':
            pResponse.innerHTML = simulatedFiles['projects.txt'].replace(/\n/g, '<br>');
            break;
            
        case 'contact':
            pResponse.innerHTML = simulatedFiles['contact.txt'].replace(/\n/g, '<br>');
            break;
            
        case 'win':
        case 'gui':
            pResponse.innerHTML = `Loading Windows 95 shell...`;
            cliOutput.appendChild(pResponse);
            setTimeout(() => {
                changeMode('win');
            }, 800);
            return;
            
        case 'tc':
            pResponse.innerHTML = `Loading Borland Turbo C++ 3.0 IDE...`;
            cliOutput.appendChild(pResponse);
            setTimeout(() => {
                changeMode('tc');
            }, 800);
            return;
            
        case 'portfolio.exe':
        case 'portfolio':
            pResponse.innerHTML = `Executing PORTFOLIO.EXE... Starting C++ run screen.`;
            cliOutput.appendChild(pResponse);
            setTimeout(() => {
                changeMode('tc');
                runTCCompiler();
            }, 800);
            return;

        case 'matrix':
        case 'matrix.com':
            pResponse.innerHTML = `Executing MATRIX.COM... Loading screensaver...`;
            cliOutput.appendChild(pResponse);
            setTimeout(() => {
                startMatrixScreensaver();
            }, 800);
            return;

        default:
            pResponse.innerHTML = `Bad command or file name: <span class="highlight">${rawCmd}</span>. Type HELP for commands.`;
            playBeep(220, 0.25);
    }

    cliOutput.appendChild(pResponse);
    
    // Scroll to bottom
    const container = document.getElementById('mode-dos');
    container.scrollTop = container.scrollHeight;
}

// --- Turbo C++ IDE Database & Compiler Logic ---
const tcCodeDatabase = {
    'ABOUT.CPP': `
<span class="tc-com">/* =======================================
   ABOUT.CPP - Profile Info for Pankaj Yadav
   ======================================= */</span>
<span class="tc-kw">#include</span> &lt;iostream.h&gt;
<span class="tc-kw">#include</span> <span class="tc-str">"pankaj.h"</span>

<span class="tc-kw">void</span> main() {
    Developer pankaj;
    pankaj.name = <span class="tc-str">"Pankaj Yadav"</span>;
    pankaj.dob = <span class="tc-str">"27/09/2002"</span>;
    pankaj.status = <span class="tc-str">"Information Technology B.E. Graduate"</span>;
    pankaj.cgpa = <span class="tc-num">7.91</span>;
    
    pankaj.printHeader();
    cout &lt;&lt; <span class="tc-str">"Profile: "</span> &lt;&lt; pankaj.status &lt;&lt; endl;
    cout &lt;&lt; <span class="tc-str">"CGPA: "</span> &lt;&lt; pankaj.cgpa &lt;&lt; <span class="tc-str">" / 10.0"</span> &lt;&lt; endl;
    cout &lt;&lt; <span class="tc-str">"Summary: A dedicated, adaptable fresher Java developer"</span>;
    cout &lt;&lt; <span class="tc-str">" aiming to deliver quality code solutions."</span> &lt;&lt; endl;
    
    pankaj.printFooter();
}`,

    'SKILLS.H': `
<span class="tc-com">/* =======================================
   SKILLS.H - Technical competency headers
   ======================================= */</span>
<span class="tc-kw">#ifndef</span> SKILLS_H
<span class="tc-kw">#define</span> SKILLS_H

<span class="tc-kw">struct</span> Skills {
    <span class="tc-kw">const char</span>* languages[<span class="tc-num">4</span>] = {<span class="tc-str">"Java"</span>, <span class="tc-str">"HTML5"</span>, <span class="tc-str">"CSS3"</span>, <span class="tc-str">"Bootstraps"</span>};
    <span class="tc-kw">const char</span>* databases[<span class="tc-num">1</span>] = {<span class="tc-str">"MySQL"</span>};
    <span class="tc-kw">const char</span>* designTools[<span class="tc-num">2</span>] = {<span class="tc-str">"Figma"</span>, <span class="tc-str">"Canva / Canva Pro"</span>};
    <span class="tc-kw">const char</span>* coreCompetency = <span class="tc-str">"Data Structures & Algorithms (DSA)"</span>;
    
    <span class="tc-kw">void</span> listSkills() {
        cout &lt;&lt; <span class="tc-str">"--- CORE CODING COMPETENCY ---"</span> &lt;&lt; endl;
        cout &lt;&lt; <span class="tc-str">"Languages: Java, HTML, CSS, JavaScript"</span> &lt;&lt; endl;
        cout &lt;&lt; <span class="tc-str">"Database: MySQL"</span> &lt;&lt; endl;
        cout &lt;&lt; <span class="tc-str">"Competency: "</span> &lt;&lt; coreCompetency &lt;&lt; endl;
    }
};

<span class="tc-kw">#endif</span>`,

    'EXP.CPP': `
<span class="tc-com">/* =======================================
   EXP.CPP - Work Experience Implementations
   ======================================= */</span>
<span class="tc-kw">#include</span> &lt;iostream.h&gt;
<span class="tc-kw">#include</span> <span class="tc-str">"experience.h"</span>

<span class="tc-kw">void</span> getInternships() {
    <span class="tc-com">// Internship 1</span>
    Internship datatech;
    datatech.company = <span class="tc-str">"DataTech Infosoft - Vapi"</span>;
    datatech.role = <span class="tc-str">"Web Developer Intern"</span>;
    datatech.duration = <span class="tc-str">"Jan'25 - Mar'25"</span>;
    datatech.desc = <span class="tc-str">"Developed responsive web pages via HTML/CSS/Bootstrap."</span>;
    datatech.display();
    
    cout &lt;&lt; <span class="tc-str">"----------------------------------------"</span> &lt;&lt; endl;
    
    <span class="tc-com">// Internship 2</span>
    Internship infolabz;
    infolabz.company = <span class="tc-str">"INFOLABZ IT SERVICES PVT. LTD."</span>;
    infolabz.role = <span class="tc-str">"React Developer Intern"</span>;
    infolabz.duration = <span class="tc-str">"June'24 - July'24"</span>;
    infolabz.desc = <span class="tc-str">"React UI components, state management, and API calls."</span>;
    infolabz.display();
}`,

    'PROJECTS.C': `
<span class="tc-com">/* =======================================
   PROJECTS.C - Core project structures
   ======================================= */</span>
<span class="tc-kw">#include</span> &lt;stdio.h&gt;

<span class="tc-kw">void</span> listProjects() {
    printf(<span class="tc-str">"=== PROJECT PORTFOLIO ===\\n\\n"</span>);
    
    <span class="tc-com">/* Client License Management System */</span>
    printf(<span class="tc-str">"Project 1: CLMS (June'25 - July'25)\\n"</span>);
    printf(<span class="tc-str">"Description: Web app for license issuing, tracking, validation.\\n"</span>);
    printf(<span class="tc-str">"Tech: Java Backend, HTML, CSS, JavaScript.\\n\\n"</span>);
    
    <span class="tc-com">/* Fuel & Fix project */</span>
    printf(<span class="tc-str">"Project 2: Fuel & Fix (July'22)\\n"</span>);
    printf(<span class="tc-str">"Description: Emergency fuel delivery & mechanic services.\\n"</span>);
    printf(<span class="tc-str">"Tech: Java Backend API, ReactJS Frontend, MySQL.\\n"</span>);
}`,

    'CONTACT.CPP': `
<span class="tc-com">/* =======================================
   CONTACT.CPP - User contact endpoints
   ======================================= */</span>
<span class="tc-kw">#include</span> &lt;iostream.h&gt;

<span class="tc-kw">void</span> showConnection() {
    cout &lt;&lt; <span class="tc-str">"=== CONTACT PANKAJ YADAV ==="</span> &lt;&lt; endl;
    cout &lt;&lt; <span class="tc-str">"Email Address:   27pankaj2002@gmail.com"</span> &lt;&lt; endl;
    cout &lt;&lt; <span class="tc-str">"LinkedIn:        linkedin.com/in/pankaj-yadav-2709"</span> &lt;&lt; endl;
    cout &lt;&lt; <span class="tc-str">"Mobile Phone:    +91-7228051794"</span> &lt;&lt; endl;
    cout &lt;&lt; <span class="tc-str">"Home Directory:  Vapi, Gujarat, India"</span> &lt;&lt; endl;
}`
};

let selectedTCFile = 'ABOUT.CPP';

function selectTCFile(fileName) {
    selectedTCFile = fileName;
    
    // Toggle active classes on tabs
    document.querySelectorAll('.tc-tab').forEach(tab => {
        if (tab.getAttribute('data-file') === fileName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    document.getElementById('tcFileName').textContent = fileName;
    document.getElementById('tcCodeText').innerHTML = tcCodeDatabase[fileName];
    
    playBeep(600, 0.05);
}

// Simulate Compiler build
function runTCCompiler() {
    const dialog = document.getElementById('tcCompileDialog');
    const compFile = document.getElementById('compileFile');
    const compLines = document.getElementById('compileLines');
    const compErrors = document.getElementById('compileErrors');
    const compStatus = document.getElementById('compileStatus');

    compFile.textContent = selectedTCFile;
    compLines.textContent = "0";
    compErrors.textContent = "0";
    compStatus.textContent = "Compiling...";
    compStatus.classList.add('blink');

    dialog.style.display = 'flex';
    
    // Floppy seeker sounds
    playFloppySound();
    
    let currentLineCount = 0;
    const maxLineCount = Math.floor(600 + Math.random() * 400);
    
    const interval = setInterval(() => {
        currentLineCount += Math.floor(Math.random() * 120 + 30);
        if (currentLineCount >= maxLineCount) {
            currentLineCount = maxLineCount;
            clearInterval(interval);
            
            // Compilation successful
            compLines.textContent = currentLineCount;
            compStatus.textContent = "Success! Press key to Run.";
            compStatus.classList.remove('blink');
            playBeep(880, 0.1);
            setTimeout(() => playBeep(1000, 0.15), 100);

            // Add keyboard listener to execute the compiled output console
            const keypressRunner = () => {
                dialog.style.display = 'none';
                executeTCConsole();
                document.removeEventListener('keydown', keypressRunner);
                document.removeEventListener('click', keypressRunner);
            };
            setTimeout(() => {
                document.addEventListener('keydown', keypressRunner);
                document.addEventListener('click', keypressRunner);
            }, 100);
        } else {
            compLines.textContent = currentLineCount;
            playBeep(300 + (currentLineCount / 2), 0.01, 'sawtooth');
        }
    }, 80);
}

// Execute simulated compiled output
function executeTCConsole() {
    const consoleOverlay = document.getElementById('tcConsoleWindow');
    const body = document.getElementById('tcConsoleBody');
    body.innerHTML = '';
    
    consoleOverlay.style.display = 'flex';
    playBeep(523, 0.1);

    let output = "";
    
    if (selectedTCFile === 'ABOUT.CPP') {
        output = `PANKAJ YADAV DEV ENVIRONMENT SYSTEM 1.0\n---------------------------------------\nProfile: Information Technology B.E. Graduate\nCGPA: 7.91 / 10.0\nSummary: A dedicated, adaptable fresher Java developer aiming to deliver quality code solutions.\n\n=======================================\nProcess exited with status code 0.`;
    } else if (selectedTCFile === 'SKILLS.H') {
        output = `--- CORE CODING COMPETENCY ---\nLanguages: Java, HTML, CSS, JavaScript\nDatabase: MySQL\nCompetency: Data Structures & Algorithms (DSA)\nTools: Figma, Canva\n\nProcess exited with status code 0.`;
    } else if (selectedTCFile === 'EXP.CPP') {
        output = `Company: DataTech Infosoft - Vapi\nRole: Web Developer Intern\nDuration: Jan'25 - Mar'25\nDesc: Developed responsive web pages via HTML/CSS/Bootstrap.\n----------------------------------------\nCompany: INFOLABZ IT SERVICES PVT. LTD.\nRole: React Developer Intern\nDuration: June'24 - July'24\nDesc: React UI components, state management, and API calls.\n\nProcess exited with status code 0.`;
    } else if (selectedTCFile === 'PROJECTS.C') {
        output = `=== PROJECT PORTFOLIO ===\n\nProject 1: CLMS (June'25 - July'25)\nDescription: Web app for license issuing, tracking, validation.\nTech: Java Backend, HTML, CSS, JavaScript.\n\nProject 2: Fuel & Fix (July'22)\nDescription: Emergency fuel delivery & mechanic services.\nTech: Java Backend API, ReactJS Frontend, MySQL.\n\nProcess exited with status code 0.`;
    } else if (selectedTCFile === 'CONTACT.CPP') {
        output = `=== CONTACT PANKAJ YADAV ===\nEmail Address:   27pankaj2002@gmail.com\nLinkedIn:        linkedin.com/in/pankaj-yadav-2709\nMobile Phone:    +91-7228051794\nHome Directory:  Vapi, Gujarat, India\n\nProcess exited with status code 0.`;
    }

    // Typewriter print simulation
    let charIdx = 0;
    const typeInterval = setInterval(() => {
        if (charIdx < output.length) {
            body.textContent += output[charIdx];
            charIdx++;
            if (charIdx % 3 === 0) playKeyClick();
        } else {
            clearInterval(typeInterval);
            
            // Wait for keypress or click to close console
            const closeConsole = () => {
                closeTCConsole();
                document.removeEventListener('keydown', closeConsole);
            };
            document.addEventListener('keydown', closeConsole);
        }
    }, 15);
}

function closeTCConsole() {
    document.getElementById('tcConsoleWindow').style.display = 'none';
    playBeep(440, 0.05);
}

// --- Windows 95 Window Manager Logic ---
const openWindows = new Set();
let activeWindowId = null;

// Clock updates
function updateClock() {
    const clock = document.getElementById('winClock');
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    clock.textContent = `${hours}:${minutes} ${ampm}`;
}

// Window actions
function openWindow(id) {
    const win = document.getElementById(id);
    win.style.display = 'flex';
    openWindows.add(id);
    
    // Position windows cascade-style if they are opened fresh
    if (!win.style.top) {
        const offset = openWindows.size * 25;
        win.style.top = `${40 + offset}px`;
        win.style.left = `${50 + offset}px`;
    }
    
    bringToFront(id);
    updateTaskbar();
    playBeep(600, 0.08);
}

function closeWindow(id) {
    const win = document.getElementById(id);
    win.style.display = 'none';
    openWindows.delete(id);
    
    if (activeWindowId === id) {
        activeWindowId = null;
        // Set new active window if any remains
        if (openWindows.size > 0) {
            const arr = Array.from(openWindows);
            bringToFront(arr[arr.length - 1]);
        }
    }
    
    updateTaskbar();
    playBeep(400, 0.08);
}

function minimizeWindow(id) {
    const win = document.getElementById(id);
    win.style.display = 'none';
    if (activeWindowId === id) {
        activeWindowId = null;
        if (openWindows.size > 0) {
            const arr = Array.from(openWindows).filter(wId => document.getElementById(wId).style.display !== 'none');
            if (arr.length > 0) bringToFront(arr[arr.length - 1]);
        }
    }
    updateTaskbar();
    playBeep(450, 0.05);
}

function maximizeWindow(id) {
    const win = document.getElementById(id);
    if (win.classList.contains('maximized')) {
        win.classList.remove('maximized');
        win.style.top = win.dataset.prevTop || '60px';
        win.style.left = win.dataset.prevLeft || '80px';
        win.style.width = win.dataset.prevWidth || '500px';
        win.style.height = win.dataset.prevHeight || '400px';
    } else {
        win.dataset.prevTop = win.style.top;
        win.dataset.prevLeft = win.style.left;
        win.dataset.prevWidth = win.style.width;
        win.dataset.prevHeight = win.style.height;
        
        win.classList.add('maximized');
        win.style.top = '0px';
        win.style.left = '0px';
        win.style.width = '100%';
        win.style.height = 'calc(100% - 38px)'; // Subtract taskbar height
    }
    playBeep(700, 0.05);
}

function bringToFront(id) {
    if (activeWindowId === id) return;
    
    // Clear styling classes
    document.querySelectorAll('.win-window').forEach(win => {
        win.classList.add('inactive');
        win.style.zIndex = 5;
    });

    const activeWin = document.getElementById(id);
    activeWin.classList.remove('inactive');
    activeWin.style.zIndex = 100;
    activeWindowId = id;
    
    // If window was minimized, restore it
    if (activeWin.style.display === 'none') {
        activeWin.style.display = 'flex';
    }
    
    updateTaskbar();
}

function updateTaskbar() {
    const tray = document.getElementById('taskbarItems');
    tray.innerHTML = '';
    
    openWindows.forEach(id => {
        const win = document.getElementById(id);
        const title = win.querySelector('.win-title-text').textContent;
        const isVisible = win.style.display !== 'none';
        const isActive = activeWindowId === id && isVisible;
        
        const btn = document.createElement('button');
        btn.className = `taskbar-btn ${isActive ? 'active' : ''}`;
        btn.innerHTML = `<span>${title}</span>`;
        btn.onclick = () => {
            if (isActive) {
                minimizeWindow(id);
            } else {
                bringToFront(id);
            }
        };
        tray.appendChild(btn);
    });
}

// Start menu toggle
function toggleStartMenu() {
    const menu = document.getElementById('startMenu');
    const btn = document.getElementById('startBtn');
    
    if (menu.style.display === 'grid') {
        menu.style.display = 'none';
        btn.classList.remove('active');
    } else {
        menu.style.display = 'grid';
        btn.classList.add('active');
        playBeep(700, 0.05);
    }
}

// Hide start menu on clicking desktop background
document.getElementById('winDesktop').addEventListener('click', (e) => {
    if (!e.target.closest('#startBtn') && !e.target.closest('#startMenu')) {
        document.getElementById('startMenu').style.display = 'none';
        document.getElementById('startBtn').classList.remove('active');
    }
});

// Click windows brings them to front
document.querySelectorAll('.win-window').forEach(win => {
    win.addEventListener('mousedown', () => {
        bringToFront(win.id);
    });
});

// Windows 95 Drag and Drop
let dragElement = null;
let dragX = 0;
let dragY = 0;

function dragStart(e, id) {
    if (document.getElementById(id).classList.contains('maximized')) return;
    
    // Prevent default selection highlight during drag
    e.preventDefault();
    bringToFront(id);
    
    dragElement = document.getElementById(id);
    dragX = e.clientX - dragElement.offsetLeft;
    dragY = e.clientY - dragElement.offsetTop;
    
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragStopHandler);
}

function dragMove(e) {
    if (!dragElement) return;
    dragElement.style.left = `${e.clientX - dragX}px`;
    dragElement.style.top = `${e.clientY - dragY}px`;
}

function dragStopHandler() {
    dragElement = null;
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('mouseup', dragStopHandler);
}

// Project Details Panel display inside folder explorer
const projectsDb = {
    clms: `
        <div class="project-detail-title">Client License Management System (CLMS)</div>
        <div class="project-detail-date">June'25 - July'25</div>
        <p><strong>System Description:</strong> A robust web portal for issuing, tracking, validating, and updating software licenses. Designed to eliminate manual excel verification and improve system audit automation.</p>
        <p style="margin-top: 5px;"><strong>Tech Stack:</strong> HTML, CSS, JavaScript, Java SE, MySQL Database</p>
    `,
    fuel: `
        <div class="project-detail-title">Fuel & Fix Platform</div>
        <div class="project-detail-date">July'22</div>
        <p><strong>System Description:</strong> An emergency dispatch application connecting stranded vehicle owners with mobile fuel trucks and local mechanics via location tracking APIs.</p>
        <p style="margin-top: 5px;"><strong>Tech Stack:</strong> React.js UI, Java API Engine, HTML/CSS, Bootstrap, MySQL</p>
    `
};

function openProjectDetails(key) {
    const pane = document.getElementById('projectDetailsPanel');
    pane.innerHTML = projectsDb[key];
    playBeep(650, 0.05);
}

// Contact form Submission Simulation
function handleContactSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const subject = document.getElementById('contact-subject').value;
    const message = document.getElementById('contact-message').value;
    const status = document.getElementById('contactStatus');
    
    status.style.display = 'block';
    status.innerHTML = `&gt; Connecting to SMTP server mail.pankaj.dev...<br>`;
    playBeep(330, 0.2);

    let step = 0;
    const steps = [
        `&gt; Resolving MX record...`,
        `&gt; Handshake protocol accepted (220 ESMTP)`,
        `&gt; Sending payload details...`,
        `&gt; Mail delivered successfully! (Status 250 OK)`,
        `&gt; Pankaj Yadav will respond shortly to: ${email}`
    ];

    const mailTimer = setInterval(() => {
        if (step < steps.length) {
            status.innerHTML += steps[step] + `<br>`;
            status.scrollTop = status.scrollHeight;
            playBeep(400 + (step * 80), 0.08);
            step++;
        } else {
            clearInterval(mailTimer);
            document.getElementById('retroContactForm').reset();
            setTimeout(() => {
                alert(`System Alert: Message from "${name}" sent successfully!`);
                status.style.display = 'none';
            }, 600);
        }
    }, 700);
}

// --- Classic Minesweeper Implementation ---
let minesGrid = [];
let minesCount = 10;
let revealedCount = 0;
let mineTimer = null;
let seconds = 0;
let isGameOver = false;

function initMinesweeper() {
    const grid = document.getElementById('minesGrid');
    const smiley = document.getElementById('smiley');
    const mineCounter = document.getElementById('mine-counter');
    const timerCounter = document.getElementById('timer-counter');
    
    // Clear and reset
    grid.innerHTML = '';
    smiley.textContent = '🙂';
    mineCounter.textContent = '010';
    timerCounter.textContent = '000';
    clearInterval(mineTimer);
    mineTimer = null;
    seconds = 0;
    revealedCount = 0;
    isGameOver = false;
    
    minesGrid = Array(9).fill(null).map(() => Array(9).fill(0));
    
    // Seed mines randomly
    let seeded = 0;
    while (seeded < minesCount) {
        const x = Math.floor(Math.random() * 9);
        const y = Math.floor(Math.random() * 9);
        if (minesGrid[x][y] !== 'M') {
            minesGrid[x][y] = 'M';
            seeded++;
        }
    }
    
    // Compute neighbors values
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (minesGrid[r][c] === 'M') continue;
            let neighbors = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (r + i >= 0 && r + i < 9 && c + j >= 0 && c + j < 9) {
                        if (minesGrid[r + i][c + j] === 'M') neighbors++;
                    }
                }
            }
            minesGrid[r][c] = neighbors;
        }
    }
    
    // Instantiate cells visually in DOM
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.className = 'mine-cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            // Left click reveal
            cell.onclick = (e) => {
                if (isGameOver) return;
                startMineTimer();
                revealCell(r, c);
            };
            
            // Right click flag
            cell.oncontextmenu = (e) => {
                e.preventDefault();
                if (isGameOver) return;
                startMineTimer();
                toggleFlag(cell);
            };
            
            grid.appendChild(cell);
        }
    }
}

function startMineTimer() {
    if (mineTimer) return;
    mineTimer = setInterval(() => {
        seconds++;
        document.getElementById('timer-counter').textContent = seconds.toString().padStart(3, '0');
    }, 1000);
}

function revealCell(r, c) {
    const grid = document.getElementById('minesGrid');
    const cellIdx = r * 9 + c;
    const cell = grid.children[cellIdx];
    
    if (cell.classList.contains('revealed') || cell.textContent === '🚩') return;
    
    cell.classList.add('revealed');
    cell.style.border = '1px solid #7b7b7b';
    cell.style.backgroundColor = '#bdbdbd';
    revealedCount++;
    
    const val = minesGrid[r][c];
    
    if (val === 'M') {
        // Boom! Game Over
        cell.classList.add('mine');
        cell.textContent = '💣';
        playBeep(180, 0.4, 'sawtooth');
        gameOver(false);
    } else if (val > 0) {
        cell.textContent = val;
        cell.className = `mine-cell revealed cell-${val}`;
        playBeep(440, 0.05);
        checkWin();
    } else {
        // Empty cell, recursive search cascade
        playBeep(400, 0.03);
        checkWin();
        // Check 8 directions
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (r + i >= 0 && r + i < 9 && c + j >= 0 && c + j < 9) {
                    revealCell(r + i, c + j);
                }
            }
        }
    }
}

function toggleFlag(cell) {
    if (cell.classList.contains('revealed')) return;
    const counter = document.getElementById('mine-counter');
    let count = parseInt(counter.textContent);
    
    if (cell.textContent === '🚩') {
        cell.textContent = '';
        count++;
        playBeep(600, 0.03);
    } else {
        cell.textContent = '🚩';
        cell.style.color = 'red';
        count--;
        playBeep(700, 0.03);
    }
    counter.textContent = count.toString().padStart(3, '0');
}

function gameOver(won) {
    isGameOver = true;
    clearInterval(mineTimer);
    
    const smiley = document.getElementById('smiley');
    smiley.textContent = won ? '😎' : '😵';
    
    // Reveal all mines if lost
    if (!won) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (minesGrid[r][c] === 'M') {
                    const idx = r * 9 + c;
                    const cell = document.getElementById('minesGrid').children[idx];
                    if (cell.textContent !== '🚩') {
                        cell.textContent = '💣';
                        cell.style.backgroundColor = '#808080';
                    }
                }
            }
        }
    }
}

function checkWin() {
    if (revealedCount === 81 - minesCount) {
        gameOver(true);
        playBeep(880, 0.1);
        setTimeout(() => playBeep(1100, 0.2), 100);
        alert("You Win Minesweeper! The developer recommends you for a programming internship.");
    }
}

// --- Matrix Code Screensaver Logic ---
const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d');
let matrixInterval = null;

function startMatrixScreensaver() {
    canvas.style.display = 'block';
    playBeep(660, 0.1, 'sawtooth');
    
    // Resize canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const columns = Math.floor(canvas.width / 16);
    const drops = Array(columns).fill(1);
    
    const charList = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*JAVA_SYSTEM_DOS_CPP_REACT";

    function drawMatrix() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0f0';
        ctx.font = '16px "Share Tech Mono", monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const text = charList[Math.floor(Math.random() * charList.length)];
            ctx.fillText(text, i * 16, drops[i] * 16);
            
            if (drops[i] * 16 > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    matrixInterval = setInterval(drawMatrix, 35);
    
    // Event listener to shut down screen saver
    const exitScreensaver = () => {
        stopMatrixScreensaver();
        document.removeEventListener('keydown', exitScreensaver);
        document.removeEventListener('click', exitScreensaver);
    };
    
    setTimeout(() => {
        document.addEventListener('keydown', exitScreensaver);
        document.addEventListener('click', exitScreensaver);
    }, 200);
}

function stopMatrixScreensaver() {
    if (matrixInterval) {
        clearInterval(matrixInterval);
        matrixInterval = null;
        canvas.style.display = 'none';
        playBeep(440, 0.05);
    }
}
