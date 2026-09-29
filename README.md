# ECE Explorer-1 Visualizer

Dataset-driven browser visualization of the conceptual ECE Explorer-1 evolutionary shuttle.

## Features

- Illustrative SVG shuttle image using supplied dimensions and component counts
- Dataset value profile
- Payload ratio and geometry summaries
- Comparison table against a conventional aerospace engineering workflow
- User-controlled evolutionary builder with mission objective, population, target fitness, and staged generation advancement
- Candidate ranking table showing the best simulated shuttle genomes
- Live SVG diagram updates after every user-controlled stage and generation
- Explicit distinction between conceptual design claims and validated aerospace evidence
- **ISRO Evolutionary Computation Dataset Integration**:
  - Live metric cards and breakdown across 135 missions and 5 strategic aerospace groups
  - Proportional Evolution vs. Extinction ratio charts
  - Interactive mission table with clickable architectural lineage insights
  - Empirical 90.37% fleet survival benchmark integrated into the genetic algorithm builder
- **Neuro-Heuristic AI Parameter Tuning Model**:
  - Dynamically tunes mutation rate ($\mu$), crossover rate ($p_c$), and elitism ($e$) conditioned on real-world ISRO domain survival and extinction rates
  - Evaluates domain architectural entropy ($H$) to prevent premature genetic convergence
  - Real-time parameter radar / status gauges
- **Real-Time Evolutionary Execution Engine**:
  - Automated continuous generational optimization loop (`⚡ Auto-Evolve`) with adjustable simulation speeds (Normal, Fast, Turbo)
  - Live canvas chart visualizing fitness convergence curves against the ISRO 90.37% Fleet Baseline
  - Real-time genetic diversity tracking ($D_g\%$) and live SVG shuttle morphing
- **Dynamic Parameter-Reactive Evolution vs. Extinction Dashboard**:
  - Proportions dynamically recalculate in real-time as hyperparameters ($\mu$, $e$, $p_c$), population size, or generation fitness change
  - **Active Population Survival Bar**: Tracks live viable candidates vs culled/extinct candidates at each generation
  - **Dual-Mode Toggle**: Seamlessly switch between `⚡ Dynamic Simulation (Parameter-Reactive)` and `📊 Static Benchmark (1975–Present ISRO Flight Catalog)`

## Run

```powershell
Set-Location E:\ECE-1
npx http-server . -p 8009
```

Open `http://localhost:8009`.

The visual is not a flight model, CAD model, certification artifact, or proof of deep-space capability.

The builder is an educational evolutionary-optimization demonstration. Its fitness score is synthetic and does not represent aerospace certification, flight readiness, or real-world safety.
