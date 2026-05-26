import type { Company, Person, Score, ScoringConfig, Tier } from "./types";

export function tierFromScore(score: number, config: ScoringConfig): Tier {
  if (score >= config.tiers.A) return "A";
  if (score >= config.tiers.B) return "B";
  return "C";
}

export function scorePerson(
  person: Person,
  company: Company | undefined,
  config: ScoringConfig,
  now: Date = new Date(),
): Score {
  let industryScore = 0;
  let sizeScore = 0;
  let locationScore = 0;
  let roleScore = 0;
  let intentScore = 0;

  if (company) {
    if (company.industry) {
      industryScore = config.industry[company.industry] ?? 0;
    }
    if (company.size) {
      sizeScore = config.size[company.size] ?? 0;
    }
    if (company.location) {
      // location is "City, Region" — try matching by leading city.
      for (const [key, weight] of Object.entries(config.location)) {
        if (company.location.toLowerCase().includes(key.toLowerCase())) {
          locationScore = Math.max(locationScore, weight);
        }
      }
    }
  }

  if (person.role) {
    for (const { pattern, weight } of config.rolePatterns) {
      try {
        if (new RegExp(pattern, "i").test(person.role)) {
          roleScore = Math.max(roleScore, weight);
        }
      } catch {
        // Invalid regex in config — skip.
      }
    }
  }

  if (person.lastEngagedAt) {
    const engaged = new Date(person.lastEngagedAt + "T00:00:00Z");
    const days = Math.round(
      (now.getTime() - engaged.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (days <= config.intent.recentEngagedDays) {
      intentScore = config.intent.weight;
    }
  }

  const total = industryScore + sizeScore + locationScore + roleScore + intentScore;
  return {
    score: total,
    tier: tierFromScore(total, config),
    breakdown: {
      industry: industryScore,
      size: sizeScore,
      location: locationScore,
      role: roleScore,
      intent: intentScore,
    },
  };
}

/**
 * Score many people in one pass. The `companies` map should already be loaded
 * (so we don't query inside the loop).
 */
export function scoreMany(
  people: Person[],
  companies: Map<string, Company>,
  config: ScoringConfig,
  now: Date = new Date(),
): Map<string, Score> {
  const out = new Map<string, Score>();
  for (const p of people) {
    const c = p.companyId ? companies.get(p.companyId) : undefined;
    out.set(p.id, scorePerson(p, c, config, now));
  }
  return out;
}
