"use client";

import { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import styles from "./page.module.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Facility = "speed" | "stamina" | "power" | "guts" | "wisdom" | "beach";

interface Card {
  name: string;
  specialty: Facility;
}

const facilities: Facility[] = [
  "speed",
  "stamina",
  "power",
  "guts",
  "wisdom",
  "beach",
];

const baseWeights: Record<Facility, number> = {
  speed: 100,
  stamina: 100,
  power: 100,
  guts: 100,
  wisdom: 100,
  beach: 50,
};

function createCard(name: string, specialty: Facility): Card {
  return { name, specialty };
}

const cards: Card[] = [
  createCard("Card1", "speed"),
  createCard("Card2", "stamina"),
  createCard("Card3", "power"),
  createCard("Card4", "guts"),
  createCard("Card5", "wisdom"),
  createCard("Card6", "speed"),
  createCard("Card7", "power"),
  createCard("Card8", "beach"),
];

function weightedPick(weights: Record<Facility, number>, excluded: Set<Facility>): Facility | null {
  const entries = facilities
    .filter((f) => !excluded.has(f))
    .map((f) => ({ f, w: weights[f] }));
  const total = entries.reduce((sum, e) => sum + e.w, 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const e of entries) {
    r -= e.w;
    if (r < 0) return e.f;
  }
  return entries[entries.length - 1].f;
}

function simulateOnce(mult: number, add: number): number {
  const placements: Record<Facility, Card[]> = {
    speed: [],
    stamina: [],
    power: [],
    guts: [],
    wisdom: [],
    beach: [],
  };

  for (const card of cards) {
    const tried = new Set<Facility>();
    while (tried.size < facilities.length) {
      const weights: Record<Facility, number> = {} as Record<Facility, number>;
      for (const fac of facilities) {
        const base = baseWeights[fac];
        if (fac === card.specialty) {
          weights[fac] = base * mult + add;
        } else {
          weights[fac] = base;
        }
      }
      const facility = weightedPick(weights, tried);
      if (!facility) break;
      if (placements[facility].length < 5) {
        placements[facility].push(card);
        break;
      }
      tried.add(facility);
    }
  }

  let count = 0;
  for (const fac of facilities) {
    if (placements[fac].some((c) => c.specialty === fac)) count += 1;
  }
  return count;
}

function runSimulations(n: number, mult: number, add: number): number[] {
  const results: number[] = [];
  for (let i = 0; i < n; i++) {
    results.push(simulateOnce(mult, add));
  }
  return results;
}

export default function Home() {
  const [numSim, setNumSim] = useState(1000);
  const [threshold, setThreshold] = useState(3);
  const [tries, setTries] = useState(1);
  const [weightMult, setWeightMult] = useState(1);
  const [weightAdd, setWeightAdd] = useState(0);
  const [results, setResults] = useState<number[]>([]);

  const handleRun = () => {
    setResults(runSimulations(numSim, weightMult, weightAdd));
  };

  const distribution = Array(7).fill(0);
  for (const r of results) distribution[r] += 1;

  const pSingle =
    results.length > 0
      ? results.filter((r) => r >= threshold).length / results.length
      : 0;
  const pAtLeastOnce = 1 - Math.pow(1 - pSingle, tries);

  const chartData = {
    labels: distribution.map((_, i) => i.toString()),
    datasets: [
      {
        label: "Frequency",
        data: distribution,
        backgroundColor: "rgba(75, 192, 192, 0.5)",
      },
    ],
  };

  return (
    <div className={styles.container}>
      <h1>Card Placement Simulator</h1>
      <div className={styles.controls}>
        <label>
          Simulations:
          <input
            type="number"
            value={numSim}
            onChange={(e) => setNumSim(Number(e.target.value))}
          />
        </label>
        <label>
          Threshold:
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
        </label>
        <label>
          Tries:
          <input
            type="number"
            value={tries}
            onChange={(e) => setTries(Number(e.target.value))}
          />
        </label>
        <label>
          Multiplier:
          <input
            type="number"
            value={weightMult}
            onChange={(e) => setWeightMult(Number(e.target.value))}
          />
        </label>
        <label>
          Add:
          <input
            type="number"
            value={weightAdd}
            onChange={(e) => setWeightAdd(Number(e.target.value))}
          />
        </label>
        <button className={styles.btn} onClick={handleRun}>Run</button>
      </div>
      {results.length > 0 && (
        <>
          <Bar data={chartData} />
          <p>
            Probability of &gt;= {threshold} matching facilities in {tries} tries: {" "}
            {(pAtLeastOnce * 100).toFixed(2)}%
          </p>
        </>
      )}
    </div>
  );
}

