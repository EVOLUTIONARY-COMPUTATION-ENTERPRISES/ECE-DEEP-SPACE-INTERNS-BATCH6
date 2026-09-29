const design = { length: 37.5, wingspan: 24, height: 56.8, mass: 2050000, payload: 24000, engines: 3, boosters: 2, tanks: 1, crew: "2–7" };
const $ = id => document.getElementById(id);
const builder = { stage: 0, generation: 0, population: [], best: null, objective: "balanced", target: 96, populationSize: 80 };

const isroData = [
  { group: "Earth Observation", evolved: 43, extinct: 7, total: 50, evolvedPct: 86.0, extinctPct: 14.0, health: "Active Cycle", healthClass: "health-active", insight: "High turnover (7 extinct / 14%): Generational optical/radar sensor upgrades (IRS to Cartosat/Resourcesat/Oceansat) and orbital bus replacement." },
  { group: "Communication Satellites", evolved: 39, extinct: 4, total: 43, evolvedPct: 90.7, extinctPct: 9.3, health: "Robust Lineage", healthClass: "health-robust", insight: "Active orbital replenishment (4 extinct / 9.3%): Transponder band transitions (C/Ku to high-throughput Ka/Q/V) across the INSAT and GSAT geostationary fleet." },
  { group: "Navigation Satellites", evolved: 11, extinct: 0, total: 11, evolvedPct: 100.0, extinctPct: 0.0, health: "Flawless Heritage", healthClass: "health-flawless", insight: "Constellation consistency (0 extinct / 100% evolved): IRNSS/NavIC regional positioning constellation maintains strict architecture backward compatibility." },
  { group: "Space Science Missions", evolved: 7, extinct: 0, total: 7, evolvedPct: 100.0, extinctPct: 0.0, health: "Flawless Heritage", healthClass: "health-flawless", insight: "Ultra-high mission assurance (0 extinct / 100% evolved): Interplanetary and deep-space missions (Chandrayaan, Mangalyaan, AstroSat, Aditya-L1) with multi-generation lineage." },
  { group: "Technology Demonstration Missions", evolved: 22, extinct: 2, total: 24, evolvedPct: 91.67, extinctPct: 8.33, health: "High Conversion", healthClass: "health-robust", insight: "High conversion efficiency (2 extinct / 91.67% evolved): Experimental atmospheric reentry and reusable demonstrators (SRE, CARE, RLV-TD, POEM) feed forward into operational programs." },
  { group: "TOTAL", evolved: 122, extinct: 13, total: 135, evolvedPct: 90.37, extinctPct: 9.63, health: "Fleet Baseline", healthClass: "health-robust", insight: "Fleet-wide empirical baseline: 90.37% survival/evolution rate sets an empirical aerospace ground-truth for evolutionary computation algorithms." }
];

let dashboardMode = "realtime"; // "realtime" or "historical"

// --- AI Parameter Tuning Model ---
function computeAiTuning(domainGroup) {
  const d = isroData.find(item => item.group === domainGroup) || isroData.find(item => item.group === "TOTAL");
  const S = d.evolvedPct / 100;
  const E = d.extinctPct / 100;
  const H = -((S > 0 ? S * Math.log2(S) : 0) + (E > 0 ? E * Math.log2(E) : 0));
  
  const mutationRate = Number((0.04 + 0.12 * E + 0.05 * H).toFixed(3));
  const crossoverRate = Number((0.75 + 0.22 * S).toFixed(3));
  const elitismRatio = Number((0.08 + 0.16 * S).toFixed(3));
  
  let domainWeights = { geo: 0.20, pay: 0.25, eng: 0.15, rel: 0.20, mass: 0.20 };
  let predictedGens = 11;

  if (d.group === "Earth Observation") {
    domainWeights = { geo: 0.25, pay: 0.35, eng: 0.10, rel: 0.15, mass: 0.15 };
    predictedGens = 14;
  } else if (d.group === "Communication Satellites") {
    domainWeights = { geo: 0.18, pay: 0.32, eng: 0.15, rel: 0.20, mass: 0.15 };
    predictedGens = 12;
  } else if (d.group === "Navigation Satellites") {
    domainWeights = { geo: 0.28, pay: 0.18, eng: 0.14, rel: 0.28, mass: 0.12 };
    predictedGens = 9;
  } else if (d.group === "Space Science Missions") {
    domainWeights = { geo: 0.20, pay: 0.20, eng: 0.15, rel: 0.35, mass: 0.10 };
    predictedGens = 8;
  } else if (d.group === "Technology Demonstration Missions") {
    domainWeights = { geo: 0.22, pay: 0.22, eng: 0.22, rel: 0.20, mass: 0.14 };
    predictedGens = 13;
  }

  return {
    domain: d.group,
    evolvedPct: d.evolvedPct,
    extinctPct: d.extinctPct,
    entropy: H.toFixed(2),
    mutationRate,
    crossoverRate,
    elitismRatio,
    predictedGens,
    weights: domainWeights
  };
}

let currentTuning = computeAiTuning("TOTAL");

function updateAiTunerUI() {
  const t = currentTuning;
  if ($("aiMutation")) $("aiMutation").textContent = `${(t.mutationRate * 100).toFixed(1)}%`;
  if ($("aiMutationBar")) $("aiMutationBar").style.width = `${Math.min(100, (t.mutationRate / 0.15) * 100)}%`;
  
  if ($("aiCrossover")) $("aiCrossover").textContent = `${(t.crossoverRate * 100).toFixed(1)}%`;
  if ($("aiCrossoverBar")) $("aiCrossoverBar").style.width = `${t.crossoverRate * 100}%`;
  
  if ($("aiElitism")) $("aiElitism").textContent = `${(t.elitismRatio * 100).toFixed(1)}%`;
  if ($("aiElitismBar")) $("aiElitismBar").style.width = `${Math.min(100, (t.elitismRatio / 0.30) * 100)}%`;
  
  if ($("aiConvergence")) $("aiConvergence").textContent = `~${t.predictedGens} gens`;
  if ($("aiEntropyText")) $("aiEntropyText").textContent = `Entropy H=${t.entropy}`;
  if ($("aiTuningState")) $("aiTuningState").textContent = `CALIBRATED · ${t.domain.toUpperCase()}`;

  // Automatically update the dynamic evolution vs extinction proportions
  renderIsroDataset();
}

// --- Dynamic Evolution vs. Extinction Proportions Engine ---
function getDynamicDomainProportions() {
  if (dashboardMode === "historical") {
    return isroData.map(d => ({
      ...d,
      displayS: d.evolvedPct,
      displayE: d.extinctPct,
      displayEvolved: d.evolved,
      displayExtinct: d.extinct,
      delta: 0
    }));
  }

  const t = currentTuning;
  const bestScore = builder.best ? builder.best.score : (builder.population.length ? Math.max(...builder.population.map(c => c.score)) : 68);
  const genFactor = Math.min(1.18, Math.max(0.72, (bestScore / 90.37)));
  
  const mutDelta = (t.mutationRate - 0.074);
  const eliteDelta = (t.elitismRatio - 0.225);
  const crossDelta = (t.crossoverRate - 0.949);

  return isroData.map(d => {
    const baseS = d.evolvedPct;
    let domainSensitivity = 1.0;
    if (d.group === "Earth Observation") domainSensitivity = 1.35;
    if (d.group === "Space Science Missions" || d.group === "Navigation Satellites") domainSensitivity = 0.55;

    let simS = baseS * genFactor + (eliteDelta * 32 * domainSensitivity) - (mutDelta * 52 * domainSensitivity) + (crossDelta * 18);
    simS = Math.max(12, Math.min(100, Number(simS.toFixed(1))));
    const simE = Number((100 - simS).toFixed(1));
    const simEvolved = Math.round(d.total * (simS / 100));
    const simExtinct = Math.max(0, d.total - simEvolved);
    const delta = Number((simS - baseS).toFixed(1));

    return {
      ...d,
      displayS: simS,
      displayE: simE,
      displayEvolved: simEvolved,
      displayExtinct: simExtinct,
      delta
    };
  });
}

function updateLivePopBar() {
  if (!$("livePopWrap")) return;
  const pop = builder.population;
  if (!pop || pop.length === 0) {
    if ($("livePopGen")) $("livePopGen").textContent = "0";
    if ($("livePopStats")) $("livePopStats").textContent = `${builder.populationSize} Genomes (Ready to initialize)`;
    if ($("livePopEvolved")) $("livePopEvolved").style.width = "100%";
    if ($("livePopExtinct")) $("livePopExtinct").style.width = "0%";
    return;
  }

  // Viability threshold for current generation: candidates scoring >= 65 survive
  const threshold = Math.min(75, Math.max(50, (builder.best ? builder.best.score - 25 : 60)));
  const evolvedCount = pop.filter(c => c.score >= threshold).length;
  const extinctCount = pop.length - evolvedCount;
  const evolvedPct = ((evolvedCount / pop.length) * 100).toFixed(1);
  const extinctPct = (100 - evolvedPct).toFixed(1);

  if ($("livePopGen")) $("livePopGen").textContent = String(builder.generation);
  if ($("livePopStats")) $("livePopStats").textContent = `${evolvedCount} Evolved (${evolvedPct}%) · ${extinctCount} Extinct (${extinctPct}%)`;
  if ($("livePopEvolved")) $("livePopEvolved").style.width = `${evolvedPct}%`;
  if ($("livePopExtinct")) $("livePopExtinct").style.width = `${extinctPct}%`;
}

// --- Live Canvas Fitness Convergence Chart ---
let fitnessHistory = [];

function drawChart() {
  const canvas = $("fitnessCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== rect.width * (window.devicePixelRatio || 1) && rect.width > 0) {
    canvas.width = rect.width * (window.devicePixelRatio || 1);
    canvas.height = rect.height * (window.devicePixelRatio || 1);
  }
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const padLeft = 40, padRight = 16, padTop = 16, padBottom = 22;
  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;

  ctx.strokeStyle = "#16344d";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#63829b";
  ctx.font = `${Math.max(10, 10 * (window.devicePixelRatio || 1))}px sans-serif`;
  ctx.textAlign = "right";

  [40, 60, 80, 100].forEach(val => {
    const y = padTop + plotH * (1 - (val - 30) / 70);
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(w - padRight, y);
    ctx.stroke();
    ctx.fillText(String(val), padLeft - 6, y + 4);
  });

  const isroY = padTop + plotH * (1 - (90.37 - 30) / 70);
  ctx.strokeStyle = "rgba(255, 212, 121, 0.75)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(padLeft, isroY);
  ctx.lineTo(w - padRight, isroY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#ffd479";
  ctx.textAlign = "left";
  ctx.fillText("ISRO 90.4%", padLeft + 6, isroY - 4);

  if (fitnessHistory.length < 1) return;

  const maxGen = Math.max(12, fitnessHistory[fitnessHistory.length - 1].gen);
  const getX = g => padLeft + (g / maxGen) * plotW;
  const getY = val => padTop + plotH * (1 - Math.max(0, Math.min(70, val - 30)) / 70);

  if (fitnessHistory.length > 1) {
    ctx.strokeStyle = "rgba(92, 228, 223, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    fitnessHistory.forEach((pt, i) => {
      const x = getX(pt.gen);
      const y = getY(pt.avg);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  ctx.strokeStyle = "#82e6aa";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  fitnessHistory.forEach((pt, i) => {
    const x = getX(pt.gen);
    const y = getY(pt.best);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  const last = fitnessHistory[fitnessHistory.length - 1];
  const lastX = getX(last.gen);
  const lastY = getY(last.best);
  ctx.fillStyle = "#82e6aa";
  ctx.beginPath();
  ctx.arc(lastX, lastY, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

// --- Population Diversity Metric ---
function computeDiversity(pop) {
  if (!pop || pop.length <= 1) return "0.0";
  const avgL = pop.reduce((sum, c) => sum + c.genome.length, 0) / pop.length;
  const avgW = pop.reduce((sum, c) => sum + c.genome.wingspan, 0) / pop.length;
  const avgM = pop.reduce((sum, c) => sum + c.genome.mass, 0) / pop.length;
  
  const dev = pop.reduce((sum, c) => {
    return sum + (Math.abs(c.genome.length - avgL) / avgL + Math.abs(c.genome.wingspan - avgW) / avgW + Math.abs(c.genome.mass - avgM) / avgM) / 3;
  }, 0) / pop.length;
  return (dev * 100).toFixed(1);
}

// --- Spacecraft Profile & Comparisons ---
function renderProfile() {
  const rows = [
    ["Length", "37.5 m"],
    ["Wingspan", "24.0 m"],
    ["Launch-pad height", "56.8 m"],
    ["Launch mass", "2,050,000 kg"],
    ["Payload to LEO", "24,000 kg"],
    ["Crew capacity", "2–7"],
    ["Main engines", "3"],
    ["Solid boosters", "2"],
    ["External tanks", "1"]
  ];
  $("profile").innerHTML = rows.map(r => `<div class="profile-row"><strong>${r[0]}</strong><span>${r[1]}</span></div>`).join("");
  $("specs").innerHTML = [
    ["PAYLOAD RATIO", `${(design.payload / design.mass * 100).toFixed(2)}%`],
    ["HEIGHT / LENGTH", `${(design.height / design.length).toFixed(2)}×`],
    ["CREW RANGE", design.crew]
  ].map(r => `<div class="spec"><b>${r[0]}</b><span>${r[1]}</span></div>`).join("");
}

function renderComparison() {
  const rows = [
    ["Design method", "Multi-objective evolutionary optimization tuned by ISRO empirical survival data", "Requirements, analysis, design reviews, qualification gates, and controlled redesign", "EC algorithm automated trade-off search guided by domain telemetry"],
    ["Optimization focus", "8 objectives: aerodynamics, mass, thermal, structure, propulsion, power, reliability, payload", "Usually staged discipline optimization with explicit verification gates", "Broader automated trade-off search in conceptual domain"],
    ["Candidate generation", "Initial population (20–300 candidates); AI-guided recombination", "Design teams and analysis models generate controlled alternatives", "Population-based computational search"],
    ["Variation mechanism", "Domain-calibrated mutation and elitism derived from 135 space missions", "Human-led redesign, parameter studies, and configuration changes", "Algorithmic mutation & crossover"],
    ["Design evidence", "ISRO historical dataset benchmark (90.37% fleet survival rate)", "Simulation validation, hardware tests, qualification, and certification", "Empirical aerospace dataset integration"],
    ["Avionics", "Evolutionary redundancy & fault-tolerant architecture", "Redundancy and fault tolerance engineered to safety standards", "Adaptive concept language versus standards-based assurance"],
    ["Mission ambition", "LEO to deep space, Moon, Mars, asteroids, outer planets", "Mission vehicles bounded by validated propulsion and life support", "Broader stated mission scope than demonstrated evidence"],
    ["Human–AI relationship", "Real-time AI parameter tuning with continuous telemetry feedback", "Human operators, certified automation, and mission control procedures", "AI acts as co-design optimizer and parameter tuner"]
  ];
  $("comparison").innerHTML = rows.map(r => `<tr><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join("")}

function rand(min, max) { return min + Math.random() * (max - min); }

// --- SVG Shuttle Rendering ---
function renderShuttle(genome = design, score = null) {
  const length = Number(genome.length) || design.length;
  const wingspan = Number(genome.wingspan) || design.wingspan;
  const mass = Number(genome.mass) || design.mass;
  const payload = Number(genome.payload) || design.payload;
  
  const lengthScale = Math.max(0.82, Math.min(1.18, length / design.length));
  const spanScale = Math.max(0.78, Math.min(1.22, wingspan / design.wingspan));
  
  const nose = 20 - 18 * (lengthScale - 1);
  const tail = 610 + 24 * (lengthScale - 1);
  
  $("shuttleWings").setAttribute("d", `M${nose} 190 L205 ${120 - 25 * (spanScale - 1)} L${tail - 75} ${150 - 12 * (spanScale - 1)} L${tail} 205 L${tail - 80} ${260 + 12 * (spanScale - 1)} L205 ${280 + 25 * (spanScale - 1)} L${nose} 220Z`);
  $("shuttleHull").setAttribute("d", `M${185 - nose / 5} ${130 - 10 * (lengthScale - 1)} L${470 + 24 * (lengthScale - 1)} 135 Q${540 + 20 * (lengthScale - 1)} 145 ${570 + 24 * (lengthScale - 1)} 205 Q${540 + 20 * (lengthScale - 1)} 260 ${470 + 24 * (lengthScale - 1)} 270 L${185 - nose / 5} ${275 + 10 * (lengthScale - 1)} Q${125 - nose / 4} 205 ${185 - nose / 5} ${130 - 10 * (lengthScale - 1)}Z`);
  $("payloadBay").setAttribute("d", `M235 190 L${465 + 20 * (lengthScale - 1)} 185 L${500 + 20 * (lengthScale - 1)} 225 L235 230Z`);
  
  const engines = $("engineCluster").querySelectorAll("circle");
  engines.forEach((engine, index) => {
    engine.setAttribute("cx", String(505 + index * 32 + 24 * (lengthScale - 1)));
    engine.setAttribute("r", String(13 + 3 * (spanScale - 1)));
  });
  
  $("shuttleModel").setAttribute("transform", `translate(115 60) translate(${(1 - lengthScale) * 145} ${(1 - spanScale) * 28}) scale(${lengthScale} ${spanScale})`);
  $("shuttleLabel").textContent = score === null ? "ECE-1" : `ECE-1 · GEN ${builder.generation}`;
  $("lengthLabel").textContent = `${length.toFixed(1)} m LENGTH`;
  $("spanLabel").textContent = `${wingspan.toFixed(1)} m WINGSPAN`;
  $("lengthDimension").setAttribute("x1", String(135 + (lengthScale - 1) * 150));
  $("lengthDimension").setAttribute("x2", String(675 - (1 - lengthScale) * 150));
  $("spanDimension").setAttribute("y1", String(120 + (1 - spanScale) * 28));
  $("spanDimension").setAttribute("y2", String(300 - (1 - spanScale) * 28));
  $("bestFitness").textContent = score === null ? "—" : `${score}/100`;
  
  $("specs").innerHTML = [
    ["PAYLOAD RATIO", `${(payload / mass * 100).toFixed(2)}%`],
    ["HEIGHT / LENGTH", `${(design.height / length).toFixed(2)}×`],
    ["CURRENT FITNESS", score === null ? "BASELINE" : `${score}/100`]
  ].map(r => `<div class="spec"><b>${r[0]}</b><span>${r[1]}</span></div>`).join("");
}

function makeGenome() {
  return {
    length: rand(30, 45),
    wingspan: rand(18, 30),
    mass: rand(1700000, 2400000),
    payload: rand(16000, 30000),
    engines: Math.round(rand(2, 5)),
    reliability: rand(0.35, 0.8)
  };
}

// --- Fitness Function with AI-Tuned Weights ---
function fitness(genome) {
  const objective = $("buildObjective") ? $("buildObjective").value : "balanced";
  const objMult = {
    payload: objective === "payload" ? 1.25 : 0.85,
    crew: objective === "crew" ? 1.25 : 0.85,
    reliability: objective === "reliability" ? 1.25 : 0.85,
    balanced: 1.0
  };
  const tw = currentTuning.weights;
  const fit = (a, b, tolerance) => Math.max(0, 1 - Math.abs(a - b) / tolerance);
  const payloadRatio = genome.payload / genome.mass;
  const targetRatio = design.payload / design.mass;

  const geoScore = (fit(genome.length / design.length, 1, 0.22) * 0.5 + fit(genome.wingspan / design.wingspan, 1, 0.25) * 0.5) * tw.geo;
  const payScore = fit(payloadRatio / targetRatio, 1, 0.55) * tw.pay * objMult.payload;
  const engScore = fit(genome.engines / design.engines, 1, 1) * tw.eng * objMult.crew;
  const relScore = genome.reliability * tw.rel * objMult.reliability;
  const massScore = fit(genome.mass / design.mass, 1, 0.5) * tw.mass * objMult.balanced;

  const total = (geoScore + payScore + engScore + relScore + massScore) * 100;
  return Math.round(Math.min(100, Math.max(0, total)));
}

function stageLog(message) {
  const existing = $("stageLog").innerHTML.includes("user-controlled") ? "" : $("stageLog").innerHTML;
  $("stageLog").innerHTML = existing + `<div class="stage-event">${message}</div>`;
  $("stageLog").scrollTop = $("stageLog").scrollHeight;
}

function updateBuilder() {
  const best = builder.best;
  $("generation").textContent = builder.generation;
  $("bestFitness").textContent = best ? `${best.score}/100` : "—";
  
  const diversity = computeDiversity(builder.population);
  if ($("diversityVal")) $("diversityVal").textContent = builder.population.length ? `${diversity}%` : "—";

  if ($("benchmarkDelta")) {
    if (best) {
      const diff = (best.score - 90.37).toFixed(1);
      if (best.score >= 90.37) {
        $("benchmarkDelta").textContent = `+${diff}% EXCEEDED`;
        $("benchmarkDelta").style.color = "var(--green)";
      } else {
        $("benchmarkDelta").textContent = `${diff}% TO TARGET`;
        $("benchmarkDelta").style.color = "var(--gold)";
      }
    } else {
      $("benchmarkDelta").textContent = "90.4% TARGET";
      $("benchmarkDelta").style.color = "var(--gold)";
    }
  }

  $("fitnessProgress").style.width = `${best ? Math.min(100, best.score) : 0}%`;
  renderShuttle(best ? best.genome : design, best?.score ?? null);
  renderCandidates();
  updateLivePopBar();
  renderIsroDataset();
}

function initialize() {
  builder.objective = $("buildObjective").value;
  builder.target = Number($("targetFitness").value);
  builder.populationSize = Math.max(20, Math.min(300, Number($("populationSize").value) || 80));
  builder.population = Array.from({ length: builder.populationSize }, () => ({ genome: makeGenome(), score: 0 }));
  builder.generation = 0;
  builder.best = null;
  builder.stage = 1;
  fitnessHistory = [];
  
  $("resetBuilder").disabled = false;
  $("builderState").textContent = "STAGE 2";
  $("stageButton").textContent = "Stage 2: Evaluate initial population";
  stageLog(`[AI Tuner Active] Mission brief accepted: ${$("buildObjective").selectedOptions[0].text}. Domain: ${currentTuning.domain}. Target: ${builder.target}/100.`);
  stageLog(`Initialized ${builder.populationSize} candidate shuttle genomes. AI hyperparameters: &mu;=${(currentTuning.mutationRate*100).toFixed(1)}%, p_c=${(currentTuning.crossoverRate*100).toFixed(1)}%, e=${(currentTuning.elitismRatio*100).toFixed(1)}%.`);
  updateBuilder();
  drawChart();
}

function evaluate() {
  builder.population.forEach(candidate => { candidate.score = fitness(candidate.genome); });
  builder.population.sort((a, b) => b.score - a.score);
  builder.best = { ...builder.population[0], genome: { ...builder.population[0].genome } };
  builder.stage = 2;
  
  const avgScore = Math.round(builder.population.reduce((s, c) => s + c.score, 0) / builder.population.length);
  fitnessHistory = [{ gen: 0, best: builder.best.score, avg: avgScore }];
  
  $("builderState").textContent = "STAGE 3";
  $("stageButton").textContent = "Stage 3: Evolve generation 1";
  stageLog(`Evaluated Gen 0: Initial best fitness = ${builder.best.score}/100, Population average = ${avgScore}/100, Diversity = ${computeDiversity(builder.population)}%.`);
  updateBuilder();
  drawChart();
}

function evolveGeneration() {
  if (builder.stage === 0) { initialize(); return; }
  if (builder.stage === 1) { evaluate(); return; }

  builder.population.sort((a, b) => b.score - a.score);
  const t = currentTuning;
  const eliteCount = Math.max(3, Math.round(builder.populationSize * t.elitismRatio));
  const elite = builder.population.slice(0, eliteCount).map(c => ({ genome: { ...c.genome }, score: c.score }));
  const next = elite.map(c => ({ genome: { ...c.genome }, score: c.score }));

  const diversity = Number(computeDiversity(builder.population));
  const adaptMut = diversity < 4.0 ? t.mutationRate * 1.5 : t.mutationRate;
  const spreadScale = adaptMut * 18;

  while (next.length < builder.populationSize) {
    let childGenome;
    if (Math.random() < t.crossoverRate) {
      const a = elite[Math.floor(Math.random() * elite.length)].genome;
      const b = elite[Math.floor(Math.random() * elite.length)].genome;
      const alpha = rand(0.35, 0.65);
      childGenome = {
        length: a.length * alpha + b.length * (1 - alpha) + rand(-spreadScale * 0.15, spreadScale * 0.15),
        wingspan: a.wingspan * alpha + b.wingspan * (1 - alpha) + rand(-spreadScale * 0.12, spreadScale * 0.12),
        mass: a.mass * alpha + b.mass * (1 - alpha) + rand(-spreadScale * 5000, spreadScale * 5000),
        payload: a.payload * alpha + b.payload * (1 - alpha) + rand(-spreadScale * 60, spreadScale * 60),
        engines: Math.max(2, Math.min(5, Math.round((a.engines + b.engines) / 2 + (Math.random() > 0.8 ? rand(-1, 1) : 0)))),
        reliability: Math.max(0.35, Math.min(0.99, (a.reliability + b.reliability) / 2 + rand(-spreadScale * 0.005, spreadScale * 0.008)))
      };
    } else {
      const a = elite[Math.floor(Math.random() * elite.length)].genome;
      childGenome = {
        length: a.length + rand(-spreadScale * 0.25, spreadScale * 0.25),
        wingspan: a.wingspan + rand(-spreadScale * 0.2, spreadScale * 0.2),
        mass: a.mass + rand(-spreadScale * 8000, spreadScale * 8000),
        payload: a.payload + rand(-spreadScale * 100, spreadScale * 100),
        engines: a.engines,
        reliability: Math.max(0.35, Math.min(0.99, a.reliability + rand(-spreadScale * 0.008, spreadScale * 0.01)))
      };
    }
    next.push({ genome: childGenome, score: fitness(childGenome) });
  }

  builder.population = next;
  builder.generation += 1;
  builder.population.sort((a, b) => b.score - a.score);

  if (!builder.best || builder.population[0].score > builder.best.score) {
    builder.best = { ...builder.population[0], genome: { ...builder.population[0].genome } };
  }

  const avgScore = Math.round(builder.population.reduce((s, c) => s + c.score, 0) / builder.population.length);
  fitnessHistory.push({ gen: builder.generation, best: builder.best.score, avg: avgScore });

  updateBuilder();
  drawChart();

  const isroDelta = (builder.best.score - 90.37).toFixed(1);
  const benchNote = builder.best.score >= 90.37 ? ` [Exceeds ISRO 90.4% Baseline (+${isroDelta}%)]` : ` [Baseline Target: 90.4% (${isroDelta}%)]`;

  if (builder.best.score >= builder.target || builder.generation >= 100) {
    builder.stage = 4;
    $("builderState").textContent = builder.best.score >= builder.target ? "TARGET REACHED" : "CYCLE CAP";
    $("stageButton").textContent = builder.best.score >= builder.target ? "Evolve further" : "Stage 4: Continue";
    stageLog(`Generation ${builder.generation}: Target fitness reached (${builder.best.score}/100)${benchNote}. AI model successfully optimized architecture.`);
    stopAutoRun();
  } else {
    $("builderState").textContent = "EVOLVING";
    $("stageButton").textContent = `Evolve Gen ${builder.generation + 1}`;
    stageLog(`Gen ${builder.generation} (AI Tuned): Best = ${builder.best.score}/100, Avg = ${avgScore}/100, Diversity = ${computeDiversity(builder.population)}%${benchNote}.`);
  }
}

// --- Real-Time Execution Controls ---
let autoRunTimer = null;
let isAutoRunning = false;

function toggleAutoRun() {
  if (isAutoRunning) {
    stopAutoRun();
  } else {
    startAutoRun();
  }
}

function startAutoRun() {
  if (builder.stage === 0) initialize();
  if (builder.stage === 1) evaluate();

  isAutoRunning = true;
  $("autoRunButton").textContent = "⏸ Pause Real-Time Evolution";
  $("autoRunButton").classList.add("running");

  const stepInterval = () => {
    if (!isAutoRunning) return;
    if (builder.stage === 4 || builder.generation >= 100 || (builder.best && builder.best.score >= builder.target)) {
      stopAutoRun();
      return;
    }
    evolveGeneration();
    const speedMs = Number($("simSpeed").value) || 150;
    autoRunTimer = setTimeout(stepInterval, speedMs);
  };

  const speedMs = Number($("simSpeed").value) || 150;
  autoRunTimer = setTimeout(stepInterval, speedMs);
}

function stopAutoRun() {
  isAutoRunning = false;
  if (autoRunTimer) {
    clearTimeout(autoRunTimer);
    autoRunTimer = null;
  }
  $("autoRunButton").textContent = "⚡ Auto-Evolve (Real-Time)";
  $("autoRunButton").classList.remove("running");
}

function renderCandidates() {
  if (!builder.population.length) {
    $("builderTable").innerHTML = "";
    return;
  }
  const rows = builder.population.slice(0, 5).map((candidate, index) =>
    `<tr><td>${index + 1}</td><td>${candidate.score}/100</td><td>${candidate.genome.length.toFixed(1)} m</td><td>${candidate.genome.wingspan.toFixed(1)} m</td><td>${Math.round(candidate.genome.mass).toLocaleString()} kg</td><td>${Math.round(candidate.genome.payload).toLocaleString()} kg</td></tr>`
  ).join("");
  $("builderTable").innerHTML = `<div class="candidate-table"><table><thead><tr><th>Rank</th><th>Fitness</th><th>Length</th><th>Wingspan</th><th>Mass</th><th>Payload</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function resetBuilder() {
  stopAutoRun();
  builder.stage = 0;
  builder.generation = 0;
  builder.population = [];
  builder.best = null;
  fitnessHistory = [];
  $("builderState").textContent = "STAGE 1";
  $("stageButton").textContent = "Stage 1: Initialize brief";
  $("resetBuilder").disabled = true;
  $("stageLog").innerHTML = '<div class="empty">The user-controlled evolutionary stages will appear here.</div>';
  updateBuilder();
  drawChart();
}

function nextStage() {
  if (builder.stage === 0) initialize();
  else if (builder.stage === 1) evaluate();
  else evolveGeneration();
}

// --- ISRO Dataset Rendering & Dynamic Sync ---
function renderIsroDataset() {
  const dynamicItems = getDynamicDomainProportions();
  const totalItem = dynamicItems.find(d => d.group === "TOTAL") || dynamicItems[dynamicItems.length - 1];
  const domainItems = dynamicItems.filter(d => d.group !== "TOTAL");

  // Update header badges and labels based on mode
  if ($("barsTitle")) {
    $("barsTitle").textContent = dashboardMode === "realtime"
      ? "Simulated Evolution vs. Extinction Proportions (Parameter-Reactive)"
      : "Historical ISRO Evolution vs. Extinction (1975–Present Catalog)";
  }
  if ($("isroSectionBadge")) {
    $("isroSectionBadge").textContent = dashboardMode === "realtime" ? "PARAMETER REACTIVE" : "STATIC 135-MISSION BENCHMARK";
  }
  if ($("isroSectionCaption")) {
    $("isroSectionCaption").textContent = dashboardMode === "realtime"
      ? `Dynamic simulation mode active: proportions recalculate in real-time under mutation pressure (μ=${(currentTuning.mutationRate * 100).toFixed(1)}%), elitism (${(currentTuning.elitismRatio * 100).toFixed(1)}%), and generation fitness.`
      : "Original historical flight dataset from 135 ISRO missions (1975–present). Reflects static aerospace flight record prior to evolutionary computation parameter tuning.";
  }
  if ($("legendModeNote")) {
    $("legendModeNote").textContent = dashboardMode === "realtime"
      ? "Reacting live to μ, e, and generation fitness"
      : "Static historical records";
  }
  if ($("liveIndicator")) {
    $("liveIndicator").style.display = dashboardMode === "realtime" ? "inline-flex" : "none";
  }
  if ($("livePopWrap")) {
    $("livePopWrap").style.display = dashboardMode === "realtime" ? "block" : "none";
  }

  // Metric cards
  $("isroMetrics").innerHTML = [
    {
      title: dashboardMode === "realtime" ? "SIMULATED FLEET" : "TOTAL MISSIONS",
      val: totalItem.total,
      sub: dashboardMode === "realtime" ? "Under tuned parameters" : "Across 5 strategic domains"
    },
    {
      title: dashboardMode === "realtime" ? "EVOLVED PROPORTION" : "EVOLVED MISSIONS",
      val: `${totalItem.displayS}%`,
      sub: `${totalItem.displayEvolved} of ${totalItem.total} viable`
    },
    {
      title: dashboardMode === "realtime" ? "EXTINCTION ATTRITION" : "EXTINCT ARCHITECTURES",
      val: `${totalItem.displayE}%`,
      sub: `${totalItem.displayExtinct} architectures retired`
    },
    {
      title: "PARAMETER IMPACT",
      val: dashboardMode === "realtime" ? `${totalItem.delta >= 0 ? '+' : ''}${totalItem.delta}%` : `${totalItem.evolvedPct}%`,
      sub: dashboardMode === "realtime" ? "vs ISRO historical baseline" : "Empirical fleet baseline"
    }
  ].map(m => `<div class="isro-metric-card"><b>${m.title}</b><strong>${m.val}</strong><span>${m.sub}</span></div>`).join("");

  // Horizontal proportional bars
  $("isroBars").innerHTML = domainItems.map(d => {
    const deltaTag = dashboardMode === "realtime" && d.delta !== 0
      ? `<span class="delta-tag ${d.delta > 0 ? 'delta-pos' : 'delta-neg'}">${d.delta > 0 ? '+' : ''}${d.delta}%</span>`
      : "";
    return `
      <div class="isro-bar-row">
        <span class="isro-bar-label" title="${d.group}">${d.group}</span>
        <div class="isro-bar-track">
          <div class="isro-bar-evolved" style="width:${d.displayS}%" title="${d.displayEvolved} Evolved (${d.displayS}%)"></div>
          <div class="isro-bar-extinct" style="width:${d.displayE}%" title="${d.displayExtinct} Extinct (${d.displayE}%)"></div>
        </div>
        <span class="isro-bar-val">${d.displayS}% ${deltaTag}</span>
      </div>
    `;
  }).join("");

  // Table rows
  $("isroTableBody").innerHTML = dynamicItems.map((d, idx) => {
    const deltaBadge = dashboardMode === "realtime" && d.delta !== 0
      ? `<span class="delta-tag ${d.delta > 0 ? 'delta-pos' : 'delta-neg'}">${d.delta > 0 ? '+' : ''}${d.delta}%</span>`
      : "";
    return `
      <tr class="isro-table-row ${d.group === 'TOTAL' ? 'total-row' : ''}" data-group="${d.group}">
        <td><strong>${d.group}</strong></td>
        <td>${d.total}</td>
        <td><span style="color:var(--green)">${d.displayEvolved}</span> (${d.displayS}%)</td>
        <td><span style="color:#ff7b7b">${d.displayExtinct}</span> (${d.displayE}%)</td>
        <td><strong>${d.displayS}%</strong> ${deltaBadge}</td>
        <td>${d.displayE}%</td>
        <td><span class="health-badge ${d.healthClass}">${d.health}</span></td>
      </tr>
    `;
  }).join("");

  // Interactive row selection
  document.querySelectorAll(".isro-table-row").forEach(row => {
    row.addEventListener("click", () => {
      document.querySelectorAll(".isro-table-row").forEach(r => r.classList.remove("selected"));
      row.classList.add("selected");
      const group = row.getAttribute("data-group");
      const item = isroData.find(d => d.group === group);
      if (item) {
        $("isroInsightTitle").textContent = item.group + (item.group === "TOTAL" ? " (Fleet Benchmark)" : "");
        $("isroInsightDesc").textContent = item.insight;
        if ($("isroDomainSelect")) {
          $("isroDomainSelect").value = group;
          currentTuning = computeAiTuning(group);
          updateAiTunerUI();
          stageLog(`[AI Tuner Recalibrated] Switched to ISRO domain: ${group}. Tuning parameters adapted in real time.`);
        }
      }
    });
  });
}

function init() {
  $("targetFitness").addEventListener("input", () => {
    $("targetFitnessValue").textContent = `${$("targetFitness").value}/100`;
    renderIsroDataset();
  });

  $("stageButton").addEventListener("click", nextStage);
  $("resetBuilder").addEventListener("click", resetBuilder);
  $("autoRunButton").addEventListener("click", toggleAutoRun);

  if ($("isroDomainSelect")) {
    $("isroDomainSelect").addEventListener("change", (e) => {
      currentTuning = computeAiTuning(e.target.value);
      updateAiTunerUI();
      stageLog(`[AI Tuner Active] Re-calibrated for domain: ${e.target.value}. &mu;=${(currentTuning.mutationRate*100).toFixed(1)}%, p_c=${(currentTuning.crossoverRate*100).toFixed(1)}%, e=${(currentTuning.elitismRatio*100).toFixed(1)}%.`);
    });
  }

  if ($("buildObjective")) {
    $("buildObjective").addEventListener("change", () => {
      renderIsroDataset();
    });
  }

  // Mode toggle buttons
  if ($("btnRealtimeMode") && $("btnHistoricalMode")) {
    $("btnRealtimeMode").addEventListener("click", () => {
      dashboardMode = "realtime";
      $("btnRealtimeMode").classList.add("active");
      $("btnHistoricalMode").classList.remove("active");
      renderIsroDataset();
    });

    $("btnHistoricalMode").addEventListener("click", () => {
      dashboardMode = "historical";
      $("btnHistoricalMode").classList.add("active");
      $("btnRealtimeMode").classList.remove("active");
      renderIsroDataset();
    });
  }

  window.addEventListener("resize", drawChart);

  renderProfile();
  renderComparison();
  renderShuttle();
  renderIsroDataset();
  updateAiTunerUI();
  updateBuilder();
  drawChart();
}

init();

