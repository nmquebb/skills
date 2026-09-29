// Statistics for eval runs: seeded sampling, fixed train/test splits, per-case bootstrap intervals,
// and paired deltas between runs. Trials cluster by case, so every interval resamples cases, never
// individual trials.

/** A seeded PRNG (mulberry32), so splits, trial order, and bootstrap intervals reproduce. */
export function random(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

/** A 32-bit seed from text (FNV-1a), for seeding from a suite name or run label. */
export function seedOf(text) {
  let hash = 0x811c9dc5
  for (const character of String(text)) {
    hash ^= character.codePointAt(0)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }

  return hash
}

export function shuffle(items, next) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(next() * (index + 1))
    ;[copy[index], copy[other]] = [copy[other], copy[index]]
  }

  return copy
}

export function mean(values) {
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length
}

/** Per-case means of `value(row)`, skipping rows where it is null. */
export function perCase(rows, value) {
  const groups = new Map()
  for (const row of rows) {
    const observed = value(row)
    if (observed === null || observed === undefined) {
      continue
    }

    if (!groups.has(row.case)) {
      groups.set(row.case, [])
    }

    groups.get(row.case).push(observed)
  }

  return new Map([...groups].map(([name, values]) => [name, mean(values)]))
}

function bootstrap(values, next, samples) {
  const means = []
  for (let sample = 0; sample < samples; sample++) {
    let sum = 0
    for (let index = 0; index < values.length; index++) {
      sum += values[Math.floor(next() * values.length)]
    }

    means.push(sum / values.length)
  }

  means.sort((left, right) => left - right)
  return { low: means[Math.floor(0.025 * samples)], high: means[Math.ceil(0.975 * samples) - 1] }
}

/** The mean over cases of each case's mean, with a 95% bootstrap interval over cases. */
export function caseMean(rows, value, { samples = 5000, seed = 1 } = {}) {
  const means = [...perCase(rows, value).values()]
  if (means.length === 0) {
    return null
  }

  return { mean: mean(means), ...bootstrap(means, random(seed), samples), cases: means.length }
}

/**
 * The mean paired difference (after - before) over the cases both sides ran, each case averaged over
 * its repeats, with a 95% bootstrap interval over cases. `significant` means the interval excludes
 * zero.
 */
export function pairedDelta(before, after, value, { samples = 5000, seed = 1 } = {}) {
  const left = perCase(before, value)
  const right = perCase(after, value)
  const deltas = [...left.keys()].filter((name) => right.has(name)).map((name) => right.get(name) - left.get(name))
  if (deltas.length === 0) {
    return null
  }

  const interval = bootstrap(deltas, random(seed), samples)
  return {
    delta: mean(deltas),
    ...interval,
    cases: deltas.length,
    significant: interval.low > 0 || interval.high < 0,
  }
}

/**
 * A fixed train/test split, stratified by each case's first tag, so the hillclimber can read train
 * transcripts while test stays unseen. Strata too small to spare a test case stay in train.
 */
export function split(cases, { seed, testFraction = 0.4 }) {
  const next = random(seed)
  const strata = new Map()
  for (const entry of [...cases].sort((left, right) => left.id.localeCompare(right.id))) {
    const tag = entry.tags?.[0] ?? ""
    if (!strata.has(tag)) {
      strata.set(tag, [])
    }

    strata.get(tag).push(entry.id)
  }

  const train = []
  const test = []
  for (const tag of [...strata.keys()].sort()) {
    const members = shuffle(strata.get(tag), next)
    const count = Math.round(members.length * testFraction)
    test.push(...members.slice(0, count))
    train.push(...members.slice(count))
  }

  return { seed, testFraction, train: train.sort(), test: test.sort() }
}

/**
 * The hillclimbing decision for one change, from paired deltas on the train and test splits: keep a
 * change only when train improves and test improves too; a train gain that does not transfer
 * suggests overfitting, and any regression reverts.
 */
export function decide(train, test) {
  if (!train || !test) {
    return "undecided: both splits need paired results"
  }

  if (test.high < 0 || train.high < 0) {
    return "revert: a split regressed beyond noise"
  }

  if (train.delta <= 0) {
    return "revert: no train gain"
  }

  if (test.delta <= 0) {
    return "revert: the train gain did not reach test (possible overfitting)"
  }

  return test.significant ? "keep: train and test improved" : "undecided: test improved within noise"
}
