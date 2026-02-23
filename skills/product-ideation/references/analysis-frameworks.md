# Analysis Frameworks Reference

This file provides the analytical frameworks used by product-ideation sub-agents. Each agent's prompt specifies which sections to apply.

---

## 1. PESTLE Analysis

Use for: market-researcher, competitive-analyzer

PESTLE identifies macro-environmental forces that shape market conditions.

| Factor | Questions to Answer |
|--------|---------------------|
| **Political** | Relevant regulations, government policy direction, trade restrictions, stability of operating regions |
| **Economic** | Market size, GDP trends, consumer spending power, inflation impact, funding climate (VC activity) |
| **Social** | Demographics of target users, cultural adoption patterns, behavioral shifts, trust in the category |
| **Technological** | Enabling technologies (AI, APIs, platforms), infrastructure maturity, technology adoption curve |
| **Legal** | Data privacy laws (GDPR, CCPA), IP landscape, licensing requirements, liability exposure |
| **Environmental** | Sustainability expectations, supply chain concerns, carbon footprint considerations |

**Application**: Flag any PESTLE factor that is a significant enabler or blocker. Enablers support a BUY signal; blockers shift toward HOLD or SELL.

---

## 2. Porter's Five Forces

Use for: competitive-analyzer

Porter's Five Forces assesses the structural attractiveness of an industry.

| Force | What to Assess | Signal |
|-------|---------------|--------|
| **Threat of New Entrants** | Capital requirements, brand moat, switching costs, regulatory barriers | High threat = harder to win |
| **Bargaining Power of Suppliers** | Dependency on key vendors (cloud, APIs, data), concentration of supply | High power = margin pressure |
| **Bargaining Power of Buyers** | Customer concentration, price sensitivity, ease of switching | High power = pricing difficulty |
| **Threat of Substitutes** | Adjacent solutions, DIY alternatives, workarounds | High threat = limited pricing |
| **Competitive Rivalry** | Number of direct competitors, differentiation, growth rate of market | High rivalry = costly to win |

**Scoring**: Rate each force as Low / Medium / High. Aggregate: 0-1 High = attractive, 2-3 High = mixed, 4-5 High = unattractive.

---

## 3. TAM / SAM / SOM Estimation

Use for: market-researcher, segment-analyzer

| Term | Definition | How to Estimate |
|------|-----------|-----------------|
| **TAM** (Total Addressable Market) | Everyone who could theoretically use this type of product | Industry reports, population × usage rate, or comparable market data |
| **SAM** (Serviceable Addressable Market) | Subset reachable with your specific model, geography, and segment | TAM × (target geography %) × (target segment %) |
| **SOM** (Serviceable Obtainable Market) | Realistic capture in years 1-3 given competition and go-to-market | SAM × (realistic market share %) — typically 0.5-5% for new entrants |

**Guidance:**
- Use top-down (industry report → narrow) AND bottom-up (unit count × price) where possible
- Cite sources with recency (prefer 2023+)
- If TAM < $500M, flag as niche — consider whether that is a strength (defensible) or weakness (ceiling)
- If TAM > $50B, flag market crowding risk — large markets attract well-funded competitors

---

## 4. SWOT Analysis Template

Use for: idea-validator, strategist

| Quadrant | Internal | External |
|----------|----------|----------|
| **Positive** | Strengths (what the idea has going for it) | Opportunities (market conditions that favor it) |
| **Negative** | Weaknesses (gaps, risks, resource needs) | Threats (competitors, regulations, trends working against it) |

**Application**: The strategist uses SWOT as a synthesis lens to validate the BUY/HOLD/SELL recommendation. At least 2 items per quadrant.

---

## 5. Jobs-to-be-Done (JTBD) Framework

Use for: segment-analyzer

JTBD focuses on the functional, social, and emotional jobs users hire a product to do.

**Three job types:**

| Type | Definition | Example |
|------|-----------|---------|
| **Functional** | The practical task to accomplish | "Track client invoices without spreadsheets" |
| **Social** | How the user wants to be perceived | "Look professional to clients" |
| **Emotional** | How the user wants to feel | "Feel in control of my cash flow" |

**Persona structure** (produce at minimum 2 personas):

```
Persona name: {descriptive name, not a real name}
Role / context: {who this person is and their situation}
Primary JTBD (functional): {the core job}
Primary JTBD (emotional): {the emotional driver}
Current solution: {what they use today — this is the real competitor}
Switching trigger: {what would make them switch}
Willingness to pay: {estimated price range per month or per use}
Segment size estimate: {rough count within SAM}
```

---

## 6. BUY / HOLD / SELL Recommendation Thresholds

Use for: strategist

Apply these criteria as a weighted scoring guide, not a rigid checklist. Judgment is required.

### BUY — Strong Opportunity

All three gates must clear, plus at least 4 of the 6 amplifiers:

**Gates (all required):**
- Market size: TAM >= $1B OR SAM >= $100M with defensible niche
- Competitive gap: Identifiable unmet need not served by top 3 competitors
- Timing: Technology or behavioral shift actively enabling this category now

**Amplifiers (4 of 6):**
- Idea validation verdict: PASS
- Porter's Five Forces aggregate: 0-2 High forces (attractive industry)
- PESTLE blockers: 0-1 significant blocker
- Willingness to pay: At least 1 segment with clear WTP above likely cost basis
- Pattern evidence: At least 2 documented success patterns apply to this idea
- Failed competitor lesson: Primary failure reasons are avoidable by this approach

### HOLD — Needs Refinement

Use HOLD when there is genuine merit but material concerns exist:

- Idea validation: CONDITIONAL (merit present but concerns noted)
- Market exists but gap is not clearly differentiated — needs pivot or sharper focus
- 2-3 significant PESTLE blockers that are addressable with more planning
- Timing is early (technology not yet mature) or late (market is consolidating)
- TAM is attractive but top competitors are very well-funded (>$100M raised)

HOLD output must include: what specific changes would shift this to BUY, and a recommended re-evaluation horizon (e.g., "revisit in 6 months when X matures").

### SELL — Pass on This Idea

Recommend SELL when evidence shows the idea is not viable in its current form:

- Idea validation: FAIL (fundamental feasibility or uniqueness problem)
- Market is saturated: 5+ funded competitors with no clear differentiation path
- PESTLE: 2+ insurmountable blockers (e.g., pending regulation that bans the model)
- TAM < $200M AND no evidence of a defensible niche
- Failed competitor graveyard: Many attempts with similar approaches have all failed for structural reasons

SELL output must include: primary reasons and, where possible, alternative opportunity areas adjacent to this space.

---

## 7. Confidence Level Definitions

Use for: strategist

| Level | Criteria |
|-------|----------|
| **High** | Market data is current and quantified; 5+ competitors profiled; 2+ validated user segments; all pipeline agents completed successfully |
| **Medium** | Some data gaps; market size estimated rather than sourced; fewer than 5 competitors; 1 validated segment |
| **Low** | Significant data gaps; market size speculative; competitive landscape thin; 1 or more pipeline stages failed or returned partial output |
