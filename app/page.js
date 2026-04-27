'use client'
import { useState, useEffect, useMemo } from "react";
import { seedAndGetStories, upsertStory, upsertStories, deleteStory as dbDeleteStory, getExperience, saveExperience, getProfile, saveProfile } from '@/lib/data';

// ─── CONFIG ───────────────────────────────────────────────
const MODEL   = "claude-sonnet-4-6";
const SK      = "phis5";
const EXP_SK   = "phis5_exp";

// ─── CANDIDATE ────────────────────────────────────────────
const CANDIDATE = {
  name:     "Adam Waldman, CFA",
  subtitle: "VP, Enterprise Strategy  |  Insight & Analytics Leadership  |  Executive Advisory",
  contact:  "Toronto, ON  ·  647-999-2791  ·  adam.c.waldman@gmail.com  ·  linkedin.com/in/adam-waldman-cfa",
};
const ADAM = {
  name: "Adam Waldman",
  headline: "AVP/VP – Enterprise Planning, Capital, Risk & Insight Leadership",
  narrative: "Systems-driven finance and strategy leader known for building insight engines, transforming planning models, and enabling organizations to think instead of react.",
  targetRoles: ["AVP","VP"],
  industry: "Financial Services, Pension, Insurance",
  location: "Toronto, ON (Hybrid)",
  topCompetencies: ["Driver-based modeling","Forecasting","Capital planning","FP&A","KPI/OKR architecture","Data strategy","Insight leadership","Change leadership","Stakeholder management"],
};
const COMPETENCIES = "Enterprise Strategy & Operating Models · Capital Markets Intelligence · C-Suite Advisory · Strategic Planning & Roadmapping · KPI/OKR Architecture · Competitive Benchmarking · Portfolio Risk & Return Frameworks · Insight Engine Design · Organizational Transformation · Scenario Modelling · Governance & Risk Culture · Team Leadership & Talent Development";
const CM_EXPERTISE = "Equities · Fixed Income · Derivatives · Private Markets · Expected Return Modelling\nDuration & Beta Decomposition · Long-Horizon Yield Forecasting · Macro/Micro Integration\nCapital Allocation Strategy · Risk-Adjusted Performance Frameworks";

// ─── EXPERIENCE (canonical record — editable) ─────────────
const EXPERIENCE_DEFAULT = [
  {
    id:"exp_001",
    role:"AVP, Head of Business Insights & Reporting — Global COO",
    org:"Manulife Global Wealth & Asset Management",
    dates:"2022–Present",
    scope:"Lead the Business Insights & Reporting function within Data & Analytics under the Global COO organization, supporting a multi-billion-dollar global wealth and asset management business with enterprise reporting, analytics, and strategic insight.",
    mandate:"Transform Global W&AM from reactive reporting to proactive, insight-driven decision-making. Build the systems, culture, governance, and operating model required for enterprise intelligence across the COO organization.",
    responsibilities:[
      "Own enterprise reporting, insight generation, and executive analytics for Global W&AM",
      "Lead the design, governance, and evolution of the GRID enterprise reporting platform",
      "Define and govern the enterprise KPI framework and reporting architecture",
      "Partner with the Global COO, CFO, and business leaders to drive strategic decisions",
      "Oversee data strategy, quality, and governance initiatives across the COO organization",
      "Develop talent, culture, and capability across the insights and reporting function",
    ],
    bullets:[
      "Built GRID into the enterprise single source of truth for reporting and insight, enabling consistent cross-regional strategic decision-making",
      "Redesigned the enterprise KPI framework, eliminating misaligned metrics and introducing outcome-based measures; adopted globally across three regions",
      "Created the Insight Engine — a system that defines how insight is generated, reviewed, and delivered — shifting analysts from report producers to strategic advisors",
      "Led global alignment of metric definitions through NARM DAWG, achieving formal adoption across all regions",
      "Improved forecast accuracy and planning cycle speed through driver-based model redesign",
      "Elevated team capability through structured coaching, capability roadmaps, and succession planning",
    ],
    themes:["Insight Leadership","Data Strategy","Enterprise Reporting","Organizational Design","COO Transformation"],
    fullNarrative:"When I stepped into this role in 2022, reporting was fragmented, reactive, and inconsistent across regions. Leaders lacked a single source of truth, analysts were buried in manual work, and insight was treated as an optional add-on rather than a strategic capability. My mandate was to change that fundamentally. I built GRID into the enterprise reporting and insight platform, redesigned KPIs, created the Insight Engine, and rebuilt the culture. Today the Business Insights & Reporting function is a strategic engine powering decisions across the global wealth and asset management business.",
  },
  {
    id:"exp_002",
    role:"AVP, Finance & Strategy Advisory / Global CFO Reporting",
    org:"Manulife Global Wealth & Asset Management",
    dates:"2021–2023",
    scope:"Led enterprise financial insight, strategic advisory, and global CFO reporting for a multi-billion-dollar global business across Canada, the U.S., and Asia.",
    mandate:"Elevate the quality, independence, and strategic value of financial insight delivered to the Global CFO. Build the models, narratives, and operating rhythms that enable better capital allocation, performance management, and strategic decision-making.",
    responsibilities:[
      "Owned enterprise-level financial insight and reporting for the Global CFO",
      "Developed strategic narratives for quarterly business reviews and executive forums",
      "Built financial models to evaluate product performance, capital allocation, and growth strategy",
      "Partnered with Strategy and Product to shape pricing, investment, and distribution decisions",
      "Led the AIR & Retention insight agenda, integrating behavioral analytics into financial storytelling",
      "Created frameworks for sponsor analytics, product profitability, and enterprise KPI alignment",
    ],
    bullets:[
      "Functioned as embedded strategy consultant to the Global CFO — maintaining political independence, personally validating all outputs, and advising on capital allocation, product strategy, and enterprise risk",
      "Delivered sponsor analytics that shaped pricing, product, and distribution strategy",
      "Built behavioral insight models that improved member retention and informed AIR platform enhancements",
      "Created financial narratives that improved executive clarity and decision velocity",
      "Received multiple enterprise awards including Ovation, Cheer, and Applause recognitions",
    ],
    themes:["Strategic Finance","Executive Influence","Capital Allocation","Behavioral Insights","Enterprise Reporting"],
    fullNarrative:"As AVP, Finance & Strategy Advisory, I served as a strategic advisor to the Global CFO of Manulife Global W&AM. I owned enterprise-level financial insight and reporting, developing the narratives that shaped quarterly business reviews and strategic planning cycles. I built financial models evaluating product performance, capital allocation, and growth strategy, and led the AIR & Retention insight agenda integrating behavioral analytics into financial storytelling.",
  },
  {
    id:"exp_003",
    role:"Director, Advisory, Insights & Data",
    org:"Manulife Retirement",
    dates:"2019–2021",
    scope:"Led advisory analytics, strategic insight development, and enterprise reporting modernization for the retirement business.",
    mandate:"Elevate the quality, clarity, and strategic value of insights delivered to executives. Build the foundations for a modern, insight-driven organization.",
    responsibilities:[
      "Owned enterprise reporting modernization and commentary transformation",
      "Developed strategic insights for executives and senior leadership",
      "Built behavioural, financial, and demographic insight models",
      "Partnered with product, marketing, and finance to shape strategy",
      "Led data quality, governance, and standardization initiatives",
    ],
    bullets:[
      "Transformed reporting culture by introducing commentary reporting, narrative expectations, and insight reviews — shifting analysts from number-senders to strategic advisors",
      "Built behavioral models including withdrawal insights and member segmentation that informed product, marketing, and service strategy",
      "Created the first enterprise member journey map, providing a unified view of member experience across touchpoints",
      "Standardized global reporting definitions and templates across regions",
      "Preserved strategic decision quality through a 25% workforce reduction by automating workflows and redesigning team structure",
    ],
    themes:["Insight Leadership","Reporting Modernization","Behavioural Analytics","Cross-Functional Strategy","Data Governance"],
    fullNarrative:"As Director of Advisory, Insights & Data, I was responsible for elevating the quality and strategic value of insights across the retirement business. I introduced commentary reporting, insight reviews, and narrative expectations that shifted the culture from number-sending to storytelling. I built behavioral models, created the first enterprise member journey map, and standardized global reporting definitions. This role laid the foundation for the enterprise intelligence transformation I would later lead as AVP.",
  },
  {
    id:"exp_004",
    role:"Manager, Corporate Finance FP&A — Head of Insights & Analysis",
    org:"OMERS",
    dates:"2017–2019",
    scope:"Led the Insights & Analysis function within Corporate Finance FP&A, providing independent financial insight, capital allocation analysis, and strategic advisory support to the CFO of a global pension fund.",
    mandate:"Elevate the quality, independence, and strategic value of financial insight delivered to the CFO. Build models, frameworks, and narratives that clarify risk, performance, and capital allocation decisions.",
    responsibilities:[
      "Owned enterprise-level financial insight and analysis for the CFO",
      "Built and maintained the enterprise cost of capital model",
      "Evaluated capital allocation decisions and investment performance",
      "Developed scenario and sensitivity frameworks for strategic planning",
      "Created executive-ready narratives and recommendations for the CFO",
      "Provided independent analysis in politically complex situations",
    ],
    bullets:[
      "Operated as internal strategy consultant to the CFO — scoping ambiguous problems, building independent analytical frameworks, and delivering recommendations that cut through departmental agendas",
      "Built the enterprise cost of capital model from first principles; adopted by the CFO as the organization standard for capital allocation decisions",
      "Introduced the Required Return + Duration framework following competitive benchmarking of peer pension funds — reshaped executive understanding of long-horizon capital-markets exposure",
      "Challenged the CIO's cash-yield narrative by surfacing derivative-driven duration risk and levered beta; presented a total-return perspective directly to the CFO",
      "Corrected a misapplication of GIPS performance standards, protecting organizational credibility",
    ],
    themes:["Financial Modeling","Executive Influence","Capital Allocation","Strategic Insight","Political Navigation"],
    fullNarrative:"At OMERS, I served as Head of Insights & Analysis within Corporate Finance FP&A — a role that required analytical depth, political awareness, and the ability to influence senior leadership through clarity and independent thinking. I built the enterprise cost of capital model, developed scenario frameworks, and provided the CFO with unbiased insight that cut through organizational noise. My independence became a strategic asset.",
  },
  {
    id:"exp_005",
    role:"Director, Private Markets Operations & Insights",
    org:"Manulife Private Asset Management",
    dates:"2014–2017",
    scope:"Built the operations, client reporting, and insight function for Manulife's private markets business from inception, supporting multi-billion-dollar real estate and private asset portfolios.",
    mandate:"Create the operational, analytical, and governance infrastructure required to scale private markets investing. Deliver insight frameworks that enable leadership to evaluate strategy, performance, and risk with clarity.",
    responsibilities:[
      "Built the operations and reporting function for private markets from inception",
      "Designed and governed the gold-copy book of record and third-party oversight model",
      "Developed thesis-driven insight reviews for portfolio strategy and performance",
      "Led cross-functional initiatives involving Investments, Legal, and Finance",
      "Managed complex operational issues including tax rulings and regulatory interpretation",
    ],
    bullets:[
      "Built the full operational, analytical, and governance infrastructure for Manulife's private markets business from inception — including the gold-copy book of record and third-party oversight model",
      "Led thesis-driven insight reviews including leverage optimization analysis that improved property-level returns across the platform",
      "Challenged and overturned Deloitte's interpretation of an Ontario LTT ruling, engaging directly with the Ministry of Finance to secure a revised ruling that preserved approximately 1% in annual client returns",
      "Received the Pinnacle Award for Service Excellence for operational leadership and client impact",
    ],
    themes:["Operations","Insight Leadership","Governance","Private Markets","Strategic Analysis"],
    fullNarrative:"As Director of Private Market Operations & Insights, I built the operational and analytical backbone for Manulife's private markets business from the ground up. I designed and governed the gold-copy book of record, built the operations and reporting function, and created thesis-driven insight reviews. One of the most impactful initiatives was overturning a Deloitte interpretation of an Ontario LTT ruling — worth approximately 1% in annual client returns.",
  },
  {
    id:"exp_006",
    role:"AVP, Accounting Operations & Relationship Management",
    org:"State Street Trust Company Canada",
    dates:"2007–2014",
    scope:"Led large-scale fund operations, client solutions, and relationship management for major institutional clients, overseeing complex NAV processes, ETF launches, and operational transformation initiatives.",
    mandate:"Deliver operational excellence, build innovative client solutions, and lead large teams through complex fund operations while maintaining exceptional service quality and control rigor.",
    responsibilities:[
      "Oversaw daily fund accounting, NAV production, and operational controls for complex funds",
      "Led client relationship management for major institutional clients",
      "Partnered with client solutions teams to design and launch new fund structures",
      "Managed operational risk, controls, and regulatory compliance",
      "Developed and coached large teams through rapid growth and transformation",
    ],
    bullets:[
      "Played a key operational role in launching BlackRock's and Vanguard's first Canadian ETFs — designing fund structures, NAV processes, and reporting infrastructure for these landmark capital markets product launches",
      "Developed innovative client solutions including a daily NAV property fund with embedded performance fee structures, demonstrating cross-asset product knowledge across equities, fixed income, and alternatives",
      "Progressed from Analyst to AVP in seven years, leading 100+ staff across complex institutional fund operations",
      "Received five Super Service Awards and two Above & Beyond Awards for operational excellence and client outcomes",
    ],
    themes:["Operations","Client Leadership","Fund Accounting","ETF Launch","Operational Excellence"],
    fullNarrative:"At State Street, I progressed through four promotions in seven years to AVP, leading more than 100 staff across complex fund operations. I played a key role in launching BlackRock's and Vanguard's first Canadian ETFs, partnering with client solutions teams to design the fund structures, NAV processes, and reporting infrastructure. My leadership was recognized with five Super Service Awards and two Above & Beyond Awards.",
  },
];


// ─── EDUCATION ────────────────────────────────────────────
const EDUCATION_DATA = [
  { cred:"Chartered Financial Analyst (CFA)",   org:"CFA Institute",          year:"2013", note:"CFA Society Toronto Corporate Finance Committee (2017–2022)" },
  { cred:"Honours B.Sc. — Mathematics & Economics", org:"University of Toronto", year:"2005", note:"VP University Affairs · Merit Award for Student Leadership" },
  { cred:"NLP Master Practitioner",             org:"NLP Canada Training Inc.", year:"",    note:"Applied NLP methodologies for executive influence and strategic communication" },
];

// ─── AWARDS ───────────────────────────────────────────────
const AWARDS_DATA = [
  { year:2025, award:"Ovation Award — Participant Outcomes Index",           org:"Manulife", narrative:"Recognized for designing and operationalizing the Participant Outcomes Index, shifting the organization from activity-based to outcome-based value measurement." },
  { year:2024, award:"Ovation Award — Retirement Investment Product",        org:"Manulife", narrative:"Awarded for strategic insight and financial leadership supporting the launch and scaling of a key retirement investment product." },
  { year:2023, award:"Cheer Award (5,000 pts) — AIR & Retention",           org:"Manulife", narrative:"Recognized for developing behavioral insights that improved member retention and informed AIR platform enhancements." },
  { year:2023, award:"Applause Award — Sponsor Analytics",                   org:"Manulife", narrative:"Awarded for delivering sponsor-level insights that shaped product, pricing, and distribution strategy." },
  { year:2022, award:"Ovation Award — Digital KPI",                          org:"Manulife", narrative:"Recognized for leading the redesign of digital KPIs aligned with customer outcomes and enterprise strategy." },
  { year:2022, award:"Stars of Excellence Nomination — KPI Redesign",        org:"Manulife", narrative:"Nominated for enterprise-wide impact in redesigning KPIs and eliminating misaligned metrics." },
  { year:2020, award:"Stars of Excellence Award — AIR Platform",             org:"Manulife", narrative:"Awarded for insight leadership that shaped the AIR platform and improved member engagement and retention." },
  { year:2016, award:"Pinnacle Award — Service Excellence",                  org:"Manulife Private Asset Management", narrative:"Recognized for exceptional leadership and service excellence within Private Markets Operations." },
  { year:"2007–2014", award:"Super Service Award ×5",                        org:"State Street", narrative:"Five Super Service Awards for consistently delivering exceptional client outcomes across multiple operational and transformation roles." },
  { year:"2007–2014", award:"Above and Beyond Award ×2",                     org:"State Street", narrative:"Awarded twice for leadership and execution during high-risk fund conversions and operational transformation initiatives." },
];

// ─── TYPES / THEMES / USE_FOR ─────────────────────────────
const TYPES = [
  { id:"career",     label:"Career story",  color:"#185FA5", bg:"#dbeafe", dot:"#3b82f6" },
  { id:"insight",    label:"Insight work",  color:"#065f46", bg:"#d1fae5", dot:"#10b981" },
  { id:"research",   label:"Research",      color:"#4c1d95", bg:"#ede9fe", dot:"#8b5cf6" },
  { id:"leadership", label:"Leadership",    color:"#92400e", bg:"#fef3c7", dot:"#f59e0b" },
];
const THEMES = ["Insight Leadership","Data Strategy","Change Leadership","Crisis Leadership","Political Navigation","People Leadership","Innovation","Ethical Judgment","Communication","Strategic Thinking","Stakeholder Management","Resilience","Entrepreneurship","Operations","Project Management","Analytics","Financial Modeling","Governance","Organizational Design"];
const USE_FOR = ["Resume","Cover Letter","Interview","Book","LinkedIn"];
const EMPTY = { id:null, type:"career", title:"", employer:"", situation:"", obstacle:"", action:"", result:"", impact:"", fullStory:"", themes:[], skills:[], useFor:[], notes:"", dateAdded:"" };

// ─── SEED STORIES (v2 library, normalized with skills) ────
const SEEDS = [
  {id:1,type:"career",title:"Building the Data & Analytics Department",employer:"Manulife Retirement",situation:"Manulife Retirement lacked a unified data and analytics function. Five siloed teams produced overlapping reports that didn't align, leaving leaders frustrated and nobody trusting the numbers.",obstacle:"Teams were territorial and resistant. A structural reorg would fail — a value narrative was the only path.",action:"Mapped every report, process, and dependency. Met with every leader to understand pain points. Built a vision around outcomes. Consolidated five teams into one, redesigned roles, and built a unified reporting suite.",result:"Eliminated duplication, improved insight quality, and established a modern analytics organization.",impact:"",fullStory:"When I joined Manulife Retirement, the analytics landscape was fragmented. Five different teams were producing overlapping reports, none of which aligned. I knew that if I approached this as a structural reorg, it would fail. So I approached it as a value narrative. I consolidated five teams into one, redesigned roles, built a unified reporting suite, and created scalable data infrastructure.",themes:["Data Strategy","Change Leadership","People Leadership","Strategic Thinking","Stakeholder Management"],skills:["data strategy","change management","people leadership","strategic thinking","stakeholder management"],useFor:["Interview","Book","Resume"],notes:"",dateAdded:"2026-03-24"},
  {id:2,type:"career",title:"25% Workforce Reduction Without Losing Value",employer:"Manulife Retirement",situation:"The business mandated a 25% headcount reduction with the explicit requirement to maintain service and insight delivery.",obstacle:"Cutting staff risked losing critical capabilities and damaging morale.",action:"Mapped every process, found dozens of reports nobody read and tasks ready for automation. Redesigned workflows, automated reporting, and restructured roles before the reduction came.",result:"Reduced team size by 25% while maintaining — and in some areas improving — output and quality.",impact:"25% headcount reduction, output maintained or improved",fullStory:"When the business mandated a 25% reduction in my department, I started by mapping every process and identifying where manual work consumed time without adding value. I found dozens of reports that no one read, processes that existed only because 'we've always done it', and tasks that could be automated. When the reduction came, we lost 25% of the team — but we didn't lose 25% of the value.",themes:["Change Leadership","People Leadership","Operations"],skills:["change management","people leadership","operations","workforce planning","automation"],useFor:["Interview","Resume","Book"],notes:"",dateAdded:"2026-03-24"},
  {id:3,type:"insight",title:"Creating an Organic Insight Engine",employer:"Manulife Retirement",situation:"The business had plenty of reports but very little insight. Leaders were drowning in numbers but starving for meaning.",obstacle:"Teams believed their job was to send numbers, not interpret them.",action:"Built AIR, NARM DAWG, commentary reporting, and a research function — each piece reinforcing the others.",result:"Transformed the organization's ability to make data-driven decisions. Leaders received insight proactively without having to ask.",impact:"",fullStory:"Manulife Retirement had plenty of reports but very little insight. I built AIR, NARM DAWG, commentary reporting, and a research function. The first time a leader said 'I didn't know this — and I didn't have to ask for it,' I knew we had succeeded.",themes:["Insight Leadership","Data Strategy","Change Leadership","Innovation","Communication","Strategic Thinking"],skills:["insight leadership","data strategy","change management","innovation","communication","strategic thinking"],useFor:["Interview","Book","Resume"],notes:"",dateAdded:"2026-03-24"},
  {id:4,type:"insight",title:"Independent Insight for the CFO",employer:"OMERS",situation:"The CFO needed unbiased analysis in a politically charged environment where every report appeared influenced by internal agendas.",obstacle:"Delivering unfiltered insight required precision and courage — it challenged existing power structures.",action:"Built independent analytical frameworks not tied to any department's data. Validated everything personally before presenting.",result:"The CFO gained clarity and confidence. Became a trusted advisor. CFO said: 'This is the first time I've seen the full picture.'",impact:"",fullStory:"The CFO needed clarity. The organization was politically charged, and every report seemed influenced by someone's agenda. I built independent analytical frameworks that didn't rely on any one department's data or narrative. When I presented the findings, the CFO paused and said, 'This is the first time I've seen the full picture.'",themes:["Insight Leadership","Political Navigation","Communication","Stakeholder Management"],skills:["insight leadership","political navigation","executive advisory","communication","analytical frameworks"],useFor:["Interview","Book","Resume"],notes:"",dateAdded:"2026-03-24"},
  {id:5,type:"career",title:"Calling Out Misapplied GIPS Standards",employer:"OMERS",situation:"A senior leader misapplied GIPS standards to influence performance narratives, creating reputational risk.",obstacle:"Challenging a senior leader publicly risked significant political fallout.",action:"Conducted a technical review, documented the correct interpretation, presented findings privately first, then escalated respectfully when the leader resisted.",result:"The organization corrected its reporting and avoided reputational risk. The CFO personally thanked him.",impact:"",fullStory:"A senior leader misapplied GIPS standards to influence performance narratives. I conducted a technical review, documented the correct interpretation, and presented it privately first. When the leader resisted, I escalated — respectfully but firmly. The organization corrected its reporting.",themes:["Ethical Judgment","Political Navigation","Analytics"],skills:["ethical judgment","political navigation","analytics","governance","regulatory compliance"],useFor:["Interview","Book"],notes:"",dateAdded:"2026-03-24"},
  {id:6,type:"leadership",title:"Standing Up to the Head of Risk",employer:"OMERS",situation:"The Head of Risk challenged his analysis aggressively in a public meeting — not to understand it, but to undermine it.",obstacle:"Backing down would lose credibility. Escalating emotionally would lose professionalism.",action:"Stayed completely calm. Walked through the analysis step by step. Invited the challenger to identify any errors. He couldn't find any.",result:"Earned lasting respect and reinforced credibility. Multiple leaders said: 'You handled that perfectly.'",impact:"",fullStory:"During a meeting, the Head of Risk challenged my analysis aggressively — not to understand it, but to undermine it. The room went silent. I stayed calm. I walked through the analysis step by step. I invited him to point out any errors. He couldn't. The room shifted.",themes:["Communication","Resilience","Political Navigation","Ethical Judgment"],skills:["communication","resilience","political navigation","executive presence","analytical rigor"],useFor:["Interview","Book"],notes:"",dateAdded:"2026-03-24"},
  {id:7,type:"insight",title:"Reframing Pension Health — Required Return Framework",employer:"OMERS",situation:"OMERS needed a clearer way to evaluate pension sustainability. Existing metrics were incomplete and frequently misleading.",obstacle:"Leaders were attached to traditional metrics.",action:"Introduced the Required Return + Duration framework. Built models and scenarios demonstrating how existing metrics masked real risk.",result:"Leadership adopted the new framework. It became the foundation of the pension health narrative.",impact:"",fullStory:"OMERS needed a better way to evaluate pension sustainability. The existing metrics were incomplete and often misleading. I introduced a new framework: Required Return + Duration. I built models, ran scenarios, and demonstrated how the old metrics masked risk. Leadership adopted it.",themes:["Insight Leadership","Strategic Thinking","Innovation","Communication"],skills:["insight leadership","strategic thinking","financial modelling","pension strategy","capital markets"],useFor:["Interview","Book","Resume"],notes:"",dateAdded:"2026-03-24"},
  {id:8,type:"leadership",title:"Navigating a Toxic Leadership Chain",employer:"OMERS",situation:"Worked under a chain of leaders who systematically excluded him from meetings, misrepresented his work, and engaged in political sabotage.",obstacle:"The sabotage was subtle but constant.",action:"Focused on delivering visible value. Built alliances outside the toxic chain. Documented everything. Maintained professionalism consistently.",result:"Reputation grew stronger than the opposing narrative. Multiple leaders on departure said he handled the environment with exceptional grace.",impact:"",fullStory:"I worked under a chain of leaders who undermined me. They excluded me from meetings, misrepresented my work, and tried to diminish my influence. I focused on delivering value. I built alliances with leaders outside the toxic chain. I documented everything. Over time, my reputation grew stronger than their narrative.",themes:["Resilience","Political Navigation","Stakeholder Management"],skills:["resilience","political navigation","stakeholder management","self-advocacy","professional integrity"],useFor:["Interview","Book"],notes:"",dateAdded:"2026-03-24"},
  {id:9,type:"insight",title:"Building a Thesis-Driven Insight Function",employer:"Manulife Private Markets",situation:"Private Markets had data scattered across disconnected teams but no coherent insight strategy.",obstacle:"Teams were fragmented and protective of their data.",action:"Created a unified reporting model with cross-team workflows. Introduced thesis-driven insight reviews: start with a hypothesis, build the analysis to test it.",result:"Leadership gained clear visibility into portfolio performance and strategic opportunities for the first time.",impact:"",fullStory:"Private Markets had data — but no insight strategy. I created a unified reporting model, built cross-team workflows, and introduced thesis-driven insight reviews. Leadership finally had a clear view of portfolio performance and strategic opportunities.",themes:["Insight Leadership","Strategic Thinking","Analytics","Data Strategy"],skills:["insight leadership","strategic thinking","analytics","data strategy","private markets"],useFor:["Interview","Book","Resume"],notes:"",dateAdded:"2026-03-24"},
  {id:10,type:"leadership",title:"Leading a High-Risk Fund Conversion",employer:"State Street",situation:"As a first-time manager, was assigned a complex high-risk fund conversion with a demanding client, tight timeline, and significant operational risk.",obstacle:"Had never led anything this operationally complex at this scale.",action:"Mobilized teams across functions, built detailed control frameworks, ran failure scenario simulations, and stayed calm when issues surfaced.",result:"Conversion completed without errors or any client impact. Zero incidents.",impact:"Zero errors, zero client impact",fullStory:"As a first-time manager, I was assigned a high-risk fund conversion. The client was demanding, the timeline was tight, and the operational risk was enormous. I mobilized teams across functions, built detailed controls, and ran simulations. When issues surfaced, I stayed calm and solution-focused. The conversion succeeded without errors or client impact.",themes:["Crisis Leadership","Project Management","Stakeholder Management"],skills:["crisis leadership","project management","stakeholder management","operational excellence","risk management"],useFor:["Interview","Book","Resume"],notes:"",dateAdded:"2026-03-24"},
  {id:11,type:"career",title:"Becoming an Entrepreneur in Australia",employer:"Early Career",situation:"Moved to Australia with no local network, no experience, and very limited resources. Needed to generate income quickly.",obstacle:"No clients, no credibility, no referrals, no roadmap.",action:"Launched a small business from scratch — marketed proactively, delivered exceptional service, built client relationships one at a time.",result:"Achieved financial stability and developed foundational entrepreneurial skills.",impact:"",fullStory:"When I moved to Australia, I had no network, no local experience, and limited resources. I needed income — fast. So I built a small business from scratch. I hustled. I marketed myself. I delivered exceptional service. Slowly, clients came. Then referrals. Then stability.",themes:["Entrepreneurship","Resilience","Operations"],skills:["entrepreneurship","resilience","operations","business development","self-reliance"],useFor:["Interview","Book","LinkedIn"],notes:"",dateAdded:"2026-03-24"},
  {id:12,type:"insight",title:"Global Metric Alignment — NARM DAWG",employer:"Manulife Retirement",situation:"Global teams used inconsistent definitions for the same metrics, creating systematic confusion and unreliable cross-regional reporting.",obstacle:"Intense territorialism — each region believed their definitions were correct.",action:"Led NARM DAWG, a global cross-regional working group. Facilitated discussions focused on principles rather than preferences. Built consensus around shared logic.",result:"The organization formally adopted unified global metrics, approved by global leadership.",impact:"",fullStory:"Global teams used different definitions for the same metrics. I led NARM DAWG — a global working group — to fix it. I facilitated discussions, mapped differences, and built a unified metric framework. When global leadership approved the unified metrics, it became a turning point for the organization.",themes:["Data Strategy","Change Leadership","Communication","Strategic Thinking","Analytics"],skills:["data strategy","change management","communication","global alignment","metric governance"],useFor:["Interview","Resume","Book"],notes:"",dateAdded:"2026-03-24"},
  {id:13,type:"insight",title:"Transforming Reporting Culture",employer:"Manulife Retirement",situation:"Reporting was passive and disconnected from strategy. Teams sent numbers without context; leaders didn't trust what they received.",obstacle:"Analysts genuinely believed their job ended the moment the report was sent.",action:"Introduced commentary reporting, insight reviews, and narrative expectations. Personally coached analysts on how to tell the story behind the numbers.",result:"Reporting became strategic and insight-driven. Leaders actively cited reports as decision inputs.",impact:"",fullStory:"Reporting was passive. Teams sent numbers without context. I introduced commentary reporting, insight reviews, and narrative expectations. I coached teams on how to tell the story behind the numbers. The first time a leader said, 'This report tells me what I need to know,' I knew we had changed the game.",themes:["Insight Leadership","Communication","Change Leadership","People Leadership"],skills:["insight leadership","communication","change management","people leadership","coaching"],useFor:["Interview","Resume","Book"],notes:"",dateAdded:"2026-03-24"},
  {id:14,type:"insight",title:"Capture Rate Redesign",employer:"Manulife Retirement",situation:"The capture rate metric was structurally misleading — rewarding wrong behaviors and obscuring real performance drivers.",obstacle:"Leaders were deeply attached to the familiar metric.",action:"Deconstructed the metric, documented its flaws, built a redesigned version aligned with business reality, and socialized with concrete before-and-after examples.",result:"Leadership adopted the new metric and decision-making quality improved measurably.",impact:"",fullStory:"The capture rate metric was misleading. It rewarded the wrong behaviours and obscured the true drivers of performance. I deconstructed the metric, identified its flaws, and built a new version that aligned with business reality. They adopted it — and decision-making improved immediately.",themes:["Insight Leadership","Innovation","Strategic Thinking","Analytics"],skills:["insight leadership","innovation","strategic thinking","analytics","kpi design"],useFor:["Interview","Resume","Book"],notes:"",dateAdded:"2026-03-24"},
  {id:15,type:"insight",title:"KPI Redesign",employer:"Manulife Retirement",situation:"KPIs were outdated and misaligned with strategy — not driving the behaviors the organization actually needed.",obstacle:"Every stakeholder had a different view of priorities.",action:"Facilitated structured workshops, aligned KPIs to strategic pillars, built a balanced scorecard reflecting what truly mattered organizationally.",result:"New KPIs clarified priorities, improved accountability, and became the foundation of strategic reviews.",impact:"",fullStory:"Our KPIs were outdated. They didn't reflect strategy, and they didn't drive behaviour. I facilitated workshops, aligned KPIs to strategic pillars, and built a balanced scorecard that reflected what truly mattered. The new KPIs clarified priorities and improved accountability.",themes:["Strategic Thinking","Communication","Change Leadership","Data Strategy","Insight Leadership","Analytics"],skills:["kpi design","strategic thinking","change management","data strategy","insight leadership","governance"],useFor:["Interview","Resume","Book"],notes:"",dateAdded:"2026-03-24"},
  {id:16,type:"career",title:"Building GRID — Enterprise Single Source of Truth",employer:"Manulife Retirement",situation:"Data was scattered across dozens of systems and teams. No single source of truth existed.",obstacle:"Entrenched fragmentation — teams had built their own data empires and were reluctant to give up control.",action:"Built GRID, a centralized insight and reporting platform. Unified data sources, standardized definitions, designed to deliver insight rather than raw data.",result:"GRID became the undisputed single source of truth, adopted across the business.",impact:"Enterprise single source of truth",fullStory:"Data was scattered across systems, teams, and formats. No one had a single source of truth. I unified data sources, standardized definitions, and built a platform that delivered insight, not just numbers. GRID became the backbone of the organization's decision-making.",themes:["Data Strategy","Innovation","Insight Leadership","Strategic Thinking","Analytics"],skills:["data strategy","innovation","insight leadership","platform architecture","analytics"],useFor:["Interview","Resume","Book"],notes:"",dateAdded:"2026-03-24"},
  {id:17,type:"leadership",title:"Leading Through Resistance",employer:"Manulife Retirement",situation:"A major transformation faced significant internal resistance — some openly pushing back, others quietly stalling.",obstacle:"Fear was the root cause. People weren't resisting the change — they were resisting the loss of control.",action:"Led with radical transparency. Explained the why clearly, demonstrated early tangible value, and involved resistant stakeholders in shaping the process.",result:"Resistance softened. Adoption accelerated across the organization.",impact:"",fullStory:"A major transformation initiative faced resistance. Teams feared losing control or relevance. I built trust through transparency. I explained the why, demonstrated value, and involved people in the process. Slowly, resistance softened. Adoption accelerated.",themes:["Change Leadership","People Leadership","Communication","Stakeholder Management"],skills:["change management","people leadership","communication","stakeholder management","organizational transformation"],useFor:["Interview","Resume","Book"],notes:"",dateAdded:"2026-03-24"},
  {id:18,type:"leadership",title:"Handling Sensitive Conversations",employer:"Manulife Retirement",situation:"A senior leader made inappropriate comments to a team member — subtle but harmful. The team member was uncomfortable and afraid to escalate.",obstacle:"Politically delicate — mishandling it could damage multiple careers and relationships.",action:"Approached the leader privately, framed the conversation around impact rather than intent, explained clearly how the comment was received.",result:"The leader understood and apologized. Team member felt supported. Issue resolved without escalation.",impact:"",fullStory:"A senior leader made inappropriate comments to a team member. It was subtle but harmful. I approached the leader privately, framed the conversation around impact rather than intent, and explained how the comment had been received. He understood immediately and apologized. The team member felt supported.",themes:["Ethical Judgment","Communication","People Leadership","Resilience"],skills:["ethical judgment","communication","people leadership","conflict resolution","emotional intelligence"],useFor:["Interview","Book"],notes:"",dateAdded:"2026-03-24"},
  {id:19,type:"career",title:"Orchestrating a Last-Minute Year-End NAV Fix",employer:"State Street",situation:"A critical NAV error surfaced hours before year-end reporting deadline. Team was exhausted.",obstacle:"Extreme urgency with zero margin for error.",action:"Pulled the team together, assigned clear roles, created a rapid-response plan. Traced the error systematically, corrected, recalculated, and validated every step.",result:"Corrected NAV delivered on time. The client experienced none of the chaos happening behind the scenes.",impact:"",fullStory:"It was year-end when we discovered a NAV error hours before the deadline. I pulled everyone together, assigned roles, and created a rapid-response plan. We traced the error, corrected the data, recalculated the NAV, and validated every step. We delivered on time. The client never felt the chaos behind the scenes.",themes:["Crisis Leadership","Project Management","Operations","Stakeholder Management"],skills:["crisis leadership","project management","operations","stakeholder management","precision execution"],useFor:["Interview","Book","Resume"],notes:"",dateAdded:"2026-03-24"},
  {id:20,type:"leadership",title:"Prioritizing Human Safety Over Process",employer:"State Street",situation:"A team member experienced a serious medical emergency during a high-pressure shift. Organizational culture strongly discouraged stopping work.",obstacle:"Deep cultural inertia — the belief that the work must continue regardless.",action:"Stopped operations immediately, called for medical help, and stayed with the employee until care arrived. Chose the person over the process.",result:"The employee recovered. Leadership praised the judgment call as exactly right.",impact:"",fullStory:"During a shift, a team member experienced a medical emergency. The environment was high-pressure, and operational culture discouraged stopping work. But nothing mattered except the person in front of me. I stopped operations immediately, called for help, and stayed with the employee until medical support arrived.",themes:["Ethical Judgment","People Leadership","Crisis Leadership"],skills:["ethical judgment","people leadership","crisis leadership","human-centered leadership"],useFor:["Interview","Book"],notes:"",dateAdded:"2026-03-24"},
  {id:21,type:"career",title:"Navigating Reorganization Through Strategic Self-Advocacy",employer:"State Street",situation:"A major reorg threatened his role and team. Decisions were being made quickly, politically, and opaquely.",obstacle:"People who didn't advocate for themselves were being sidelined.",action:"Documented the team's value, quantified impact, and positioned their work as essential to the new structure. Met with decision-makers to demonstrate alignment — not plead.",result:"When the reorg settled, the team was not only intact — it was elevated.",impact:"",fullStory:"A reorganization threatened my role and my team. I documented our team's value, quantified our impact, and positioned our work as essential to the new structure. I met with decision-makers, not to plead, but to demonstrate alignment with the future state. When the dust settled, my team was not only intact — we were elevated.",themes:["Political Navigation","Communication","Strategic Thinking","Change Leadership"],skills:["political navigation","communication","strategic thinking","change management","self-advocacy"],useFor:["Interview","Book"],notes:"",dateAdded:"2026-03-24"},
  {id:22,type:"insight",title:"Automating Tax Distributions",employer:"State Street",situation:"Tax distribution calculations were entirely manual, error-prone, and a chronic source of stress.",obstacle:"Complex process with years of entrenched manual practice. People didn't believe automation was possible.",action:"Decomposed the process step by step, mapped every dependency, built a rules-based engine with validation controls, exception reporting, and audit trails.",result:"Accuracy improved dramatically, processing time dropped significantly.",impact:"",fullStory:"Tax distribution calculations were one of the most painful processes in our group. Everything was manual, error-prone, and stressful. I broke the process down step by step, mapped every dependency, and built a rules-based engine. The first time the automated process ran end-to-end without errors, the team stared at the screen in disbelief. Then the relief hit.",themes:["Innovation","Operations","Analytics","Project Management"],skills:["innovation","operations","analytics","automation","project management"],useFor:["Interview","Resume","Book"],notes:"",dateAdded:"2026-03-24"},
  {id:23,type:"leadership",title:"Standing Up to an Abusive Client",employer:"State Street",situation:"A client manager routinely berated the team — yelling, insulting people — and everyone tolerated it because 'that's just how he is.'",obstacle:"Major power imbalance — the client was significant and internal leaders were hesitant to act.",action:"When a junior team member was attacked, stepped in calmly but firmly. Stated the behavior was unacceptable, refused to continue until he spoke respectfully, documented and escalated.",result:"Internal leadership supported the action. The client was formally warned. The abuse stopped permanently.",impact:"",fullStory:"We had a client manager who regularly berated my team. One day, after he verbally attacked a junior team member, I stepped in. Calmly but firmly, I told him his behavior was unacceptable and that we would not continue the call until he spoke respectfully. Leadership supported me. The client was warned. The abuse stopped.",themes:["Ethical Judgment","People Leadership","Crisis Leadership","Resilience"],skills:["ethical judgment","people leadership","crisis leadership","resilience","advocacy"],useFor:["Interview","Book"],notes:"",dateAdded:"2026-03-24"},
  {id:24,type:"insight",title:"Building Cost of Capital Model — CFO Advisory",employer:"OMERS",situation:"The CFO needed a defensible cost of capital model; different teams used inconsistent assumptions and no one trusted anyone else's numbers.",obstacle:"No one had a unified framework; political agendas shaped every analysis.",action:"Built a comprehensive cost of capital model from first principles. Integrated market data, risk factors, and portfolio characteristics. Created scenario-based outputs. Documented all assumptions for governance.",result:"CFO adopted the model as the enterprise standard. Improved consistency and confidence in investment decisions.",impact:"Enterprise cost of capital model adopted as OMERS standard",fullStory:"Investment decisions were being made without a unified view of the cost of capital. I built a cost of capital model from first principles, integrating market data, risk factors, and portfolio characteristics. I presented it directly to the CFO, walking through the logic and assumptions. He adopted it as the enterprise standard.",themes:["Financial Modeling","Insight Leadership","Strategic Thinking"],skills:["financial modelling","cost of capital","capital markets","executive advisory","strategic thinking"],useFor:["Resume","Interview","Book"],notes:"",dateAdded:"2026-03-24"},
];

const EXTENDED_SOAR = [
  {
    "id": "soar_001_building_grid",
    "type": "insight",
    "title": "Building GRID – Enterprise Data Infrastructure",
    "employer": "Manulife Retirement",
    "situation": "Data was scattered across dozens of systems and teams, with no single source of truth. Reporting was inconsistent, definitions varied by region, and leaders lacked confidence in the numbers.",
    "obstacle": "Entrenched fragmentation and territorial data ownership made alignment difficult. Each team had built its own data empire and was reluctant to give up control.",
    "action": "Unified data sources across regions and teams Standardized metric definitions and logic Built GRID, a centralized insight and reporting platform Designed GRID to deliver insight rather than raw data Partnered with stakeholders to ensure adoption and trust",
    "result": "GRID became the undisputed single source of truth Adopted across the business as the foundation for reporting Enabled consistent, automated, insight-driven decision-making",
    "impact": "",
    "fullStory": "Data was scattered across systems, teams, and formats. No one had a single source of truth. Leaders were frustrated, analysts were exhausted, and every conversation began with 'Which number is right?' I unified data sources, standardized definitions, and built GRID — a platform designed not just to store data, but to deliver insight. GRID became the single source of truth across the business. It changed how leaders made decisions and how analysts worked. It was one of the most transformative data initiatives in the organization.",
    "themes": [
      "Insight Leadership",
      "Data Strategy",
      "Change Leadership"
    ],
    "skills": [
      "insight leadership",
      "data strategy",
      "change leadership",
      "stakeholder management",
      "strategic thinking"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2023"
  },
  {
    "id": "soar_002_kpi_redesign",
    "type": "insight",
    "title": "KPI Redesign – Shifting Executive Focus",
    "employer": "Manulife Retirement",
    "situation": "The business relied on KPIs that unintentionally drove the wrong behaviours, including a %‑of‑revenue metric that penalized growth.",
    "obstacle": "Executives were accustomed to the existing KPIs, and changing them required cross‑functional alignment and a compelling rationale. Stakeholders had conflicting priorities and preferred metrics.",
    "action": "Analyzed behavioural impacts of existing KPIs Partnered with regional CFOs to redesign the KPI suite Introduced diversified revenue categories and governance Eliminated the misaligned %‑of‑revenue KPI Created the Participant Outcome Index to measure retirement readiness",
    "result": "Shifted executive focus toward absolute revenue growth Improved alignment between KPIs and business strategy Provided a more accurate and actionable view of business performance",
    "impact": "",
    "fullStory": "Our KPIs were outdated. They didn’t reflect strategy, and they didn’t drive the behaviours the business actually needed. I facilitated workshops, aligned KPIs to strategic pillars, and built a balanced scorecard that reflected what truly mattered. The new KPIs clarified priorities, improved accountability, and shifted executive focus toward sustainable revenue growth. It was a fundamental reset of how the business measured success.",
    "themes": [
      "Strategic Thinking",
      "Insight Leadership",
      "Change Leadership"
    ],
    "skills": [
      "strategic thinking",
      "insight leadership",
      "data strategy",
      "stakeholder management",
      "change leadership"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2022"
  },
  {
    "id": "soar_003_capture_rate",
    "type": "insight",
    "title": "Capture Rate Redesign – Fixing a Misleading Metric",
    "employer": "Manulife Retirement",
    "situation": "The capture rate metric was structurally misleading — rewarding the wrong behaviours and obscuring real performance drivers.",
    "obstacle": "Leaders were deeply attached to the familiar metric. Familiarity had become a substitute for accuracy. Changing it required restating historical results and aligning global teams.",
    "action": "Deconstructed the existing capture rate metric Documented its flaws and behavioural impacts Built a redesigned version aligned with business reality Socialized the change with concrete before‑and‑after examples Aligned global CFOs and regional leaders on the new definition",
    "result": "Leadership adopted the new metric Decision‑making quality improved immediately Reporting became clearer, more accurate, and more actionable",
    "impact": "",
    "fullStory": "The capture rate metric was misleading. It rewarded the wrong behaviours and obscured the true drivers of performance. I deconstructed the metric, identified its flaws, and built a new version that aligned with business reality. I socialized it with leaders using clear before‑and‑after examples. They adopted it — and decision‑making improved immediately. A flawed metric can quietly steer an organization in the wrong direction, and fixing it can change everything.",
    "themes": [
      "Insight Leadership",
      "Innovation",
      "Analytics"
    ],
    "skills": [
      "insight leadership",
      "innovation",
      "analytics",
      "strategic thinking",
      "communication"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2021"
  },
  {
    "id": "soar_004_global_metric_alignment",
    "type": "insight",
    "title": "Global Metric Alignment – NARM DAWG",
    "employer": "Manulife Retirement",
    "situation": "Global teams used inconsistent definitions for the same metrics, creating systematic confusion and unreliable cross‑regional reporting.",
    "obstacle": "Each region believed their definitions were the correct standard. Territorialism was intense, and alignment seemed politically impossible.",
    "action": "Led NARM DAWG, a global cross‑regional working group Mapped differences in definitions, logic, and data sources Facilitated principle‑based discussions rather than preference‑based debates Built a unified metric framework with clear governance Socialized the framework with CFOs and regional leaders",
    "result": "Unified global metric definitions adopted across the organization Improved comparability and clarity in reporting Reduced confusion and rework across regions",
    "impact": "",
    "fullStory": "Global teams used different definitions for the same metrics. It created confusion, misalignment, and inconsistent reporting. I was asked to lead a global working group — NARM DAWG — to fix it. I facilitated discussions, mapped differences, and built a unified metric framework. I focused on principles, not preferences. Slowly, alignment emerged. When global leadership approved the unified metrics, it became a turning point for the organization. Alignment is achieved through shared principles, not forced consensus.",
    "themes": [
      "Data Strategy",
      "Change Leadership",
      "Communication"
    ],
    "skills": [
      "data strategy",
      "change leadership",
      "communication",
      "strategic thinking",
      "stakeholder management"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2022"
  },
  {
    "id": "soar_005_transforming_reporting_culture",
    "type": "insight",
    "title": "Transforming Reporting Culture – From Numbers to Insight",
    "employer": "Manulife Retirement",
    "situation": "Reporting was passive and disconnected from strategy. Teams sent numbers without context, and leaders didn’t trust what they received.",
    "obstacle": "Analysts genuinely believed their job ended the moment the report was sent. The culture was deeply rooted in 'number‑sending' rather than insight generation.",
    "action": "Introduced commentary reporting and narrative expectations Built insight reviews to replace raw reporting Coached analysts on storytelling and strategic framing Created automated reporting infrastructure to free up time for insight Repositioned the team identity from report producers to advisors",
    "result": "Reporting became strategic and insight‑driven Leaders actively cited reports as decision inputs Team morale and identity improved significantly",
    "impact": "",
    "fullStory": "Reporting was passive. Teams sent numbers without context. Leaders didn’t trust the reports, and analysts didn’t feel responsible for insight. I introduced commentary reporting, insight reviews, and narrative expectations. I coached teams on how to tell the story behind the numbers. The first time a leader said, 'This report tells me what I need to know,' I knew we had changed the game. Insight is not a number — it's a narrative.",
    "themes": [
      "Insight Leadership",
      "Communication",
      "Change Leadership"
    ],
    "skills": [
      "insight leadership",
      "communication",
      "change leadership",
      "people leadership",
      "strategic thinking"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2020"
  },
  {
    "id": "soar_006_independent_insight_for_cfo",
    "type": "insight",
    "title": "Independent Insight for the CFO – Cutting Through Politics",
    "employer": "OMERS",
    "situation": "The CFO needed unbiased analysis in a politically charged environment where every report appeared influenced by internal agendas.",
    "obstacle": "Delivering unfiltered insight required precision and courage — it challenged existing power structures and risked political backlash.",
    "action": "Built independent analytical frameworks not tied to any department’s narrative Validated all data personally to ensure accuracy and neutrality Presented findings directly to the CFO with clear logic and evidence Maintained political independence despite pressure from multiple sides",
    "result": "CFO gained clarity and confidence in decision‑making Became a trusted advisor due to independence and accuracy CFO stated: 'This is the first time I've seen the full picture.'",
    "impact": "",
    "fullStory": "The CFO needed clarity. The organization was politically charged, and every report seemed influenced by someone’s agenda. He asked me for independent insight — not the official view, but the truth. I built independent analytical frameworks that didn’t rely on any one department’s data or narrative. I validated everything myself. When I presented the findings, the CFO paused and said, 'This is the first time I've seen the full picture.' That moment changed our working relationship. Credibility is earned when you tell the truth no one else is willing to say.",
    "themes": [
      "Insight Leadership",
      "Political Navigation",
      "Communication"
    ],
    "skills": [
      "insight leadership",
      "political navigation",
      "communication",
      "stakeholder management",
      "ethical judgment"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2018"
  },
  {
    "id": "soar_007_cost_of_capital_model",
    "type": "insight",
    "title": "Building the Cost of Capital Model – CFO Advisory",
    "employer": "OMERS",
    "situation": "The CFO needed a clear, defensible cost of capital model to guide investment decisions, but existing approaches were inconsistent and lacked analytical rigor.",
    "obstacle": "Different teams used different assumptions, methodologies, and discount rates. No one trusted anyone else’s numbers, and the CFO had no unified framework.",
    "action": "Built a comprehensive cost of capital model from first principles Integrated market data, risk factors, and portfolio characteristics Created scenario‑based outputs to support strategic decision‑making Presented the model directly to the CFO with clear logic and rationale Documented assumptions and governance for long‑term sustainability",
    "result": "CFO adopted the model as the enterprise standard Improved consistency and confidence in investment decisions Model became a foundational tool for capital allocation",
    "impact": "",
    "fullStory": "Investment decisions were being made without a unified view of the cost of capital. Each team used its own assumptions, and the CFO had no consistent framework. I built a cost of capital model from first principles, integrating market data, risk factors, and portfolio characteristics. I presented it directly to the CFO, walking through the logic and assumptions. He adopted it as the enterprise standard. It became a foundational tool for capital allocation and strategic planning. When you build something from first principles, you create clarity where none existed.",
    "themes": [
      "Financial Modeling",
      "Insight Leadership",
      "Strategic Thinking"
    ],
    "skills": [
      "financial modeling",
      "strategic thinking",
      "insight leadership",
      "stakeholder management",
      "analytical rigor"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2018"
  },
  {
    "id": "soar_008_fund_conversions",
    "type": "transformation",
    "title": "Leading Major Fund Conversions – Operational Transformation",
    "employer": "State Street",
    "situation": "State Street was onboarding several large fund clients, requiring complex conversions involving data migration, reconciliations, and operational redesign.",
    "obstacle": "Conversions were high‑risk, high‑visibility, and involved multiple teams with conflicting priorities. Errors could damage client trust and trigger financial penalties.",
    "action": "Led cross‑functional teams through end‑to‑end conversion cycles Mapped legacy processes and designed future‑state workflows Coordinated data migration, reconciliation, and validation Created risk mitigation plans and escalation pathways Communicated directly with clients to manage expectations",
    "result": "Delivered multiple major conversions on time and with zero critical issues Strengthened client relationships through transparency and reliability Improved internal processes and reduced operational risk",
    "impact": "",
    "fullStory": "Fund conversions are high‑risk, high‑visibility events. A single error can damage client trust. I led multiple major conversions, coordinating cross‑functional teams, mapping legacy processes, and designing future‑state workflows. I managed data migration, reconciliations, and client communication. Every conversion was delivered on time with zero critical issues. Clients trusted us because we were transparent, organized, and calm under pressure. Operational excellence is built on discipline and clarity.",
    "themes": [
      "Operational Excellence",
      "Risk Management",
      "Project Leadership"
    ],
    "skills": [
      "project leadership",
      "operational excellence",
      "risk management",
      "stakeholder management",
      "communication"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2016"
  },
  {
    "id": "soar_009_okr_transition",
    "type": "transformation",
    "title": "Enterprise OKR Transition – Driving Strategic Alignment",
    "employer": "Manulife",
    "situation": "The organization needed to transition from traditional goal‑setting to an OKR framework to improve alignment, focus, and accountability.",
    "obstacle": "Teams were unfamiliar with OKRs, skeptical of the change, and concerned about losing autonomy. Leaders feared the framework would become bureaucratic.",
    "action": "Designed the enterprise OKR framework and governance model Facilitated workshops with executives and cross‑functional teams Built templates, examples, and guidance to ensure consistency Coached leaders on writing measurable, outcome‑driven OKRs Integrated OKRs into planning, reporting, and performance cycles",
    "result": "Successful enterprise‑wide adoption of OKRs Improved alignment between strategy and execution Increased clarity of priorities and measurable outcomes",
    "impact": "",
    "fullStory": "The organization needed a better way to align strategy with execution. Traditional goal‑setting wasn’t working. I designed the OKR framework, facilitated workshops, and coached leaders on writing measurable, outcome‑driven objectives. I integrated OKRs into planning and reporting cycles so they became part of how the business operated. Adoption was successful, and leaders began to see the value of clarity and focus. OKRs work when they become a habit, not a document.",
    "themes": [
      "Change Leadership",
      "Strategic Planning",
      "Organizational Design"
    ],
    "skills": [
      "change leadership",
      "strategic planning",
      "communication",
      "facilitation",
      "organizational design"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2023"
  },
  {
    "id": "soar_010_insight_engine",
    "type": "insight",
    "title": "Building the Insight Engine – From Reporting to Intelligence",
    "employer": "Manulife Retirement",
    "situation": "The organization relied heavily on manual reporting and reactive analysis. Leaders lacked forward‑looking insight and had no mechanism to anticipate risks or opportunities.",
    "obstacle": "Teams were overwhelmed with manual work, skeptical of automation, and unsure how to shift from reporting to insight generation. There was no shared definition of 'insight'.",
    "action": "Designed the Insight Engine framework to systematize insight creation Defined insight categories, triggers, and workflows Built automated pipelines to free analysts from manual reporting Created a governance model for insight quality and consistency Trained teams on storytelling, pattern recognition, and strategic framing",
    "result": "Insight Engine became the backbone of strategic reporting Analysts shifted from manual tasks to high‑value advisory work Leaders received proactive, forward‑looking intelligence",
    "impact": "",
    "fullStory": "The business was drowning in manual reporting. Analysts were stuck producing numbers instead of generating insight. I designed the Insight Engine — a system that defined what insight is, how it’s created, and how it flows through the organization. I automated reporting pipelines, built governance, and trained teams on storytelling and pattern recognition. The Insight Engine became the backbone of strategic reporting. Analysts became advisors, and leaders received proactive intelligence instead of reactive data. Insight is not an accident — it’s a system.",
    "themes": [
      "Insight Leadership",
      "Innovation",
      "Organizational Design"
    ],
    "skills": [
      "insight leadership",
      "innovation",
      "strategic thinking",
      "organizational design",
      "change leadership"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2023"
  },
  {
    "id": "soar_011_withdrawal_insights",
    "type": "insight",
    "title": "Withdrawal Insights – Understanding Member Behaviour",
    "employer": "Manulife Retirement",
    "situation": "Leaders lacked visibility into why members were withdrawing funds, how behaviour varied across segments, and what actions could improve retention.",
    "obstacle": "Data was fragmented across systems, and no one had connected behavioural, demographic, and plan‑level drivers into a unified view.",
    "action": "Consolidated behavioural, demographic, and plan data into a unified model Identified key drivers of withdrawals using statistical analysis Segmented members into behavioural cohorts Built dashboards and narratives to explain insights to executives Recommended targeted interventions to improve retention",
    "result": "Leaders gained a clear understanding of withdrawal behaviour Insights informed product, service, and communication strategies Improved retention through targeted interventions",
    "impact": "",
    "fullStory": "Withdrawal behaviour was a mystery. Leaders didn’t know why members were withdrawing funds or how behaviour varied across segments. I consolidated data across systems, built a behavioural model, and identified the key drivers of withdrawals. I created dashboards and narratives that made the insights clear and actionable. The findings informed product, service, and communication strategies. When you understand behaviour, you can influence outcomes.",
    "themes": [
      "Analytics",
      "Insight Leadership",
      "Data Strategy"
    ],
    "skills": [
      "analytics",
      "insight leadership",
      "strategic thinking",
      "data strategy",
      "communication"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2021"
  },
  {
    "id": "soar_012_advice_strategy",
    "type": "strategy",
    "title": "Advice Strategy – Designing the Future of Member Guidance",
    "employer": "Manulife Retirement",
    "situation": "The business needed a cohesive advice strategy to help members make better financial decisions, but existing offerings were fragmented and inconsistent.",
    "obstacle": "Different teams owned different parts of the advice ecosystem, and no one had a unified view of member needs or the competitive landscape.",
    "action": "Conducted a full assessment of the advice ecosystem Mapped member needs across life stages and financial journeys Analyzed competitive offerings and market trends Designed an integrated advice strategy with clear value propositions Presented the strategy to executives with a roadmap for execution",
    "result": "Leadership aligned on a unified advice strategy Clear roadmap created for product, digital, and service enhancements Improved clarity on how to support members across their financial journey",
    "impact": "",
    "fullStory": "The advice ecosystem was fragmented. Different teams owned different pieces, and members received inconsistent guidance. I conducted a full assessment of member needs, competitive offerings, and market trends. I designed an integrated advice strategy with clear value propositions and a roadmap for execution. Leadership aligned around the strategy, and it became the foundation for future product and digital enhancements. Strategy is the art of creating clarity where complexity once lived.",
    "themes": [
      "Strategy",
      "Insight Leadership",
      "Market Analysis"
    ],
    "skills": [
      "strategy development",
      "insight leadership",
      "market analysis",
      "communication",
      "cross‑functional leadership",
      "strategy"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2022"
  },
  {
    "id": "soar_013_data_lake_governance",
    "type": "transformation",
    "title": "Data Lake Governance – Bringing Order to Chaos",
    "employer": "Manulife",
    "situation": "The enterprise data lake had grown rapidly without proper governance. Data was inconsistent, undocumented, and difficult for teams to trust or use.",
    "obstacle": "Multiple teams were loading data independently, each with different standards, naming conventions, and quality thresholds. No one owned the problem.",
    "action": "Conducted a full audit of data lake assets and ingestion processes Defined governance standards for naming, documentation, and quality Created a centralized intake and approval workflow Partnered with engineering to automate validation and metadata capture Established a cross‑functional governance council for ongoing oversight",
    "result": "Improved data quality, consistency, and discoverability Reduced duplication and rework across analytics teams Increased trust in the data lake as a strategic asset",
    "impact": "",
    "fullStory": "The data lake had become a dumping ground. Teams loaded data independently, with no standards or governance. Analysts didn’t trust the data, and leaders questioned its value. I conducted a full audit, defined governance standards, and built a centralized intake workflow. I partnered with engineering to automate validation and metadata capture. We established a governance council to maintain discipline. Over time, the data lake transformed from a chaotic repository into a trusted strategic asset. Governance is what turns data into intelligence.",
    "themes": [
      "Data Strategy",
      "Governance",
      "Operational Excellence"
    ],
    "skills": [
      "data strategy",
      "governance",
      "cross‑functional leadership",
      "operational excellence",
      "change leadership"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2021"
  },
  {
    "id": "soar_014_planning_model_redesign",
    "type": "insight",
    "title": "Planning Model Redesign – Building a Driver‑Based Forecast",
    "employer": "Manulife Retirement",
    "situation": "The planning model was overly manual, opaque, and disconnected from real business drivers. Forecasts lacked credibility and required constant manual adjustments.",
    "obstacle": "Stakeholders were accustomed to the old model and skeptical of change. The business had never used a true driver‑based approach.",
    "action": "Mapped key business drivers across revenue, expenses, and member behaviour Redesigned the planning model using statistical and economic relationships Automated manual inputs and created transparent logic flows Partnered with FP&A and business leaders to validate assumptions Built scenario capabilities to support strategic planning",
    "result": "Forecast accuracy improved significantly Planning cycles became faster and more strategic Leaders gained confidence in the model and its insights",
    "impact": "",
    "fullStory": "The planning model was a black box. It required endless manual adjustments and didn’t reflect how the business actually worked. I redesigned it from the ground up using a driver‑based approach. I mapped the true economic and behavioural drivers, automated manual inputs, and built transparent logic flows. I partnered with FP&A and business leaders to validate assumptions. Forecast accuracy improved, planning cycles sped up, and leaders finally trusted the model. A good forecast is a story about how the world works.",
    "themes": [
      "Financial Modeling",
      "Insight Leadership",
      "Strategic Planning"
    ],
    "skills": [
      "financial modeling",
      "insight leadership",
      "strategic thinking",
      "cross‑functional collaboration",
      "analytics",
      "strategic planning"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2022"
  },
  {
    "id": "soar_015_crisis_navigation",
    "type": "leadership",
    "title": "Crisis Navigation – Stabilizing the Business During Volatility",
    "employer": "Manulife Retirement",
    "situation": "During a period of extreme market volatility and operational strain, leaders needed rapid insight to make decisions affecting millions of members.",
    "obstacle": "Data was changing daily, teams were overwhelmed, and leadership needed clarity faster than existing processes could deliver.",
    "action": "Built rapid‑response insight dashboards to track key indicators Created daily briefings for executives with clear recommendations Coordinated cross‑functional teams to align on priorities Identified emerging risks and opportunities before they materialized Maintained calm, clarity, and direction during uncertainty",
    "result": "Leadership made faster, more informed decisions Reduced operational risk during a period of instability Strengthened trust in the insights function as a strategic partner",
    "impact": "",
    "fullStory": "When the world became volatile, leaders needed clarity. Data was changing daily, and teams were overwhelmed. I built rapid‑response dashboards, created daily executive briefings, and coordinated cross‑functional teams to align on priorities. I identified emerging risks before they materialized and provided clear recommendations. Leadership made faster, more informed decisions, and trust in the insights function deepened. In a crisis, clarity is the most valuable currency.",
    "themes": [
      "Crisis Leadership",
      "Insight Leadership",
      "Strategic Thinking"
    ],
    "skills": [
      "crisis leadership",
      "insight leadership",
      "communication",
      "strategic thinking",
      "cross‑functional collaboration"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2020"
  },
  {
    "id": "soar_016_behavioral_economics_framework",
    "type": "insight",
    "title": "Behavioral Economics Framework – Understanding Member Decision-Making",
    "employer": "Manulife Retirement",
    "situation": "Leaders lacked a structured understanding of why members made suboptimal financial decisions, leading to ineffective interventions and inconsistent engagement strategies.",
    "obstacle": "The organization had never applied behavioral economics systematically. Teams relied on intuition rather than evidence, and there was no shared language for understanding member behaviour.",
    "action": "Developed a behavioral economics framework tailored to retirement decision-making Mapped cognitive biases influencing member actions across key journeys Analyzed behavioural data to identify friction points and decision failures Created playbooks for nudges, choice architecture, and communication design Educated leaders and teams on applying behavioral insights to strategy",
    "result": "Improved member engagement through targeted behavioural interventions Enhanced product and communication strategies Created a shared organizational language for understanding behaviour",
    "impact": "",
    "fullStory": "Members often make suboptimal financial decisions, but the organization lacked a structured way to understand why. I built a behavioral economics framework tailored to retirement decision-making. I mapped cognitive biases, analyzed behavioural data, and identified friction points. I created playbooks for nudges, choice architecture, and communication design. Leaders began using the framework to shape strategy, and member engagement improved. When you understand the psychology behind decisions, you can design better outcomes.",
    "themes": [
      "Behavioral Economics",
      "Insight Leadership",
      "Member Experience"
    ],
    "skills": [
      "insight leadership",
      "behavioral science",
      "strategic thinking",
      "communication",
      "innovation",
      "behavioral economics",
      "member experience"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2022"
  },
  {
    "id": "soar_017_global_reporting_standardization",
    "type": "transformation",
    "title": "Global Reporting Standardization – Creating a Unified Reporting Backbone",
    "employer": "Manulife Retirement",
    "situation": "Reporting across regions was inconsistent, duplicative, and misaligned with enterprise strategy. Leaders struggled to compare performance globally.",
    "obstacle": "Each region had its own reporting culture, tools, and definitions. Attempts at standardization had failed due to politics, preferences, and lack of governance.",
    "action": "Conducted a global audit of reporting practices, tools, and definitions Designed a unified reporting architecture aligned to strategic pillars Standardized templates, definitions, and commentary expectations Built governance processes to maintain consistency over time Partnered with regional CFOs to drive adoption and accountability",
    "result": "Global reporting became consistent, comparable, and strategy-aligned Reduced duplication and manual effort across regions Improved leadership’s ability to make cross-market decisions",
    "impact": "",
    "fullStory": "Global reporting was fragmented. Each region had its own tools, definitions, and commentary style. Leaders couldn’t compare performance across markets. I conducted a global audit, designed a unified reporting architecture, and standardized templates and definitions. I built governance processes and partnered with regional CFOs to drive adoption. Reporting became consistent, comparable, and aligned with strategy. Standardization is not about control — it’s about clarity.",
    "themes": [
      "Reporting Transformation",
      "Data Strategy",
      "Governance"
    ],
    "skills": [
      "change leadership",
      "data strategy",
      "insight leadership",
      "governance",
      "cross-functional leadership",
      "reporting transformation"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2021"
  },
  {
    "id": "soar_018_member_outcome_index",
    "type": "insight",
    "title": "Member Outcome Index – Measuring Retirement Readiness",
    "employer": "Manulife Retirement",
    "situation": "The organization lacked a meaningful way to measure whether members were on track for retirement success. Existing metrics focused on activity, not outcomes.",
    "obstacle": "Retirement readiness is complex and influenced by behaviour, contributions, market conditions, and plan design. No single team owned the problem.",
    "action": "Designed the Member Outcome Index to measure retirement readiness holistically Integrated behavioural, financial, and demographic data Created a scoring methodology aligned with academic research Built dashboards and narratives to communicate insights to executives Partnered with product and marketing teams to design interventions",
    "result": "Leadership gained a clear view of member retirement readiness Index became a core KPI for strategy and reporting Enabled targeted interventions to improve member outcomes",
    "impact": "",
    "fullStory": "The business had no way to measure whether members were truly on track for retirement success. Activity metrics weren’t enough. I designed the Member Outcome Index — a holistic measure of retirement readiness. I integrated behavioural, financial, and demographic data and built a scoring methodology grounded in research. The index became a core KPI and informed product, marketing, and service strategies. When you measure what matters, you can improve what matters.",
    "themes": [
      "Member Outcomes",
      "Analytics",
      "Insight Leadership"
    ],
    "skills": [
      "insight leadership",
      "analytics",
      "strategic thinking",
      "innovation",
      "cross-functional collaboration",
      "member outcomes"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2022"
  },
  {
    "id": "soar_019_operational_risk_reduction",
    "type": "transformation",
    "title": "Operational Risk Reduction – Eliminating Failure Points in Reporting",
    "employer": "Manulife Retirement",
    "situation": "Critical reporting processes relied on manual steps, tribal knowledge, and undocumented logic. Errors were common and risk exposure was high.",
    "obstacle": "Teams were accustomed to patchwork processes and hesitant to change workflows they had relied on for years. No one had a full view of the end-to-end process.",
    "action": "Mapped end-to-end reporting workflows across teams and systems Identified failure points, manual dependencies, and undocumented logic Automated high-risk steps and standardized data transformations Created documentation, controls, and validation checkpoints Partnered with risk and audit teams to formalize governance",
    "result": "Significant reduction in operational risk and reporting errors Improved audit readiness and compliance posture Reporting processes became faster, more reliable, and more transparent",
    "impact": "",
    "fullStory": "Reporting processes were fragile. Manual steps, undocumented logic, and tribal knowledge created constant risk. I mapped the end-to-end workflows, identified failure points, and automated high-risk steps. I built controls, documentation, and validation checkpoints. Partnering with risk and audit teams, we formalized governance and strengthened the entire reporting ecosystem. Errors dropped, confidence increased, and the business became more resilient. Risk reduction is the quiet foundation of strategic execution.",
    "themes": [
      "Operational Excellence",
      "Risk Management",
      "Governance"
    ],
    "skills": [
      "operational excellence",
      "risk management",
      "process optimization",
      "cross-functional leadership",
      "governance"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2020"
  },
  {
    "id": "soar_020_stakeholder_alignment",
    "type": "leadership",
    "title": "Stakeholder Alignment – Unifying Conflicting Priorities",
    "employer": "Manulife Retirement",
    "situation": "Multiple teams had conflicting priorities and competing interpretations of strategic goals. Misalignment slowed execution and created friction.",
    "obstacle": "Each stakeholder group believed their priorities were the most important. Historical tensions and communication gaps made alignment difficult.",
    "action": "Facilitated alignment workshops to surface assumptions and priorities Mapped interdependencies and clarified ownership across teams Translated strategic goals into shared operational objectives Created a unified roadmap with clear sequencing and accountability Established recurring alignment forums to maintain cohesion",
    "result": "Teams aligned on shared goals and execution sequencing Reduced friction and improved cross-functional collaboration Accelerated delivery of strategic initiatives",
    "impact": "",
    "fullStory": "Teams were working at cross-purposes. Each group had its own priorities and interpretations of strategy. I facilitated alignment workshops to surface assumptions, map interdependencies, and clarify ownership. I translated strategic goals into shared operational objectives and built a unified roadmap. Alignment forums kept everyone moving together. The result was faster execution, reduced friction, and a stronger sense of shared purpose. Alignment is the engine of execution.",
    "themes": [
      "Stakeholder Alignment",
      "Communication",
      "Strategic Execution"
    ],
    "skills": [
      "stakeholder management",
      "communication",
      "facilitation",
      "strategic thinking",
      "cross-functional leadership",
      "stakeholder alignment",
      "strategic execution"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2021"
  },
  {
    "id": "soar_021_reporting_automation",
    "type": "transformation",
    "title": "Reporting Automation – Freeing Analysts for High-Value Work",
    "employer": "Manulife Retirement",
    "situation": "Analysts spent the majority of their time manually preparing reports, leaving little capacity for insight generation or strategic analysis.",
    "obstacle": "Teams were skeptical of automation due to past failures and feared losing control or visibility into the reporting process.",
    "action": "Identified high-volume, high-effort reporting processes suitable for automation Partnered with engineering to build automated pipelines and validation checks Redesigned reporting templates to support automated data flows Trained analysts on how to shift from reporting to insight generation Created monitoring dashboards to ensure automation reliability",
    "result": "Reporting time reduced dramatically across teams Analysts shifted focus to insight, storytelling, and advisory work Improved accuracy, consistency, and timeliness of reporting",
    "impact": "",
    "fullStory": "Analysts were stuck in manual reporting cycles, leaving little time for insight. I identified high-effort processes, partnered with engineering to automate them, and redesigned templates to support automated flows. I trained analysts to shift from reporting to advisory work. Reporting time dropped dramatically, accuracy improved, and the team’s identity evolved. Automation isn’t about replacing people — it’s about elevating them.",
    "themes": [
      "Automation",
      "Insight Leadership",
      "Operational Excellence"
    ],
    "skills": [
      "automation",
      "insight leadership",
      "operational excellence",
      "change leadership",
      "analytics"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2020"
  },
  {
    "id": "soar_022_kpi_governance",
    "type": "governance",
    "title": "KPI Governance – Creating Discipline Around Performance Measurement",
    "employer": "Manulife Retirement",
    "situation": "KPIs across the business were inconsistent, poorly defined, and often misaligned with strategy. Leaders interpreted metrics differently, leading to confusion and misdirected effort.",
    "obstacle": "Teams were protective of their existing KPIs and hesitant to adopt standardized definitions or governance. Historical inconsistencies had become normalized.",
    "action": "Conducted a full audit of KPIs across functions and regions Identified inconsistencies, gaps, and misaligned incentives Created a KPI governance framework with clear definitions and ownership Established a review cadence to ensure ongoing alignment Partnered with executives to socialize and enforce the new standards",
    "result": "KPIs became consistent, comparable, and strategically aligned Improved decision-making through clearer performance signals Reduced confusion and rework across teams",
    "impact": "",
    "fullStory": "KPIs were inconsistent and misaligned. Leaders interpreted metrics differently, creating confusion and misdirected effort. I audited KPIs across the business, identified inconsistencies, and built a governance framework with clear definitions and ownership. I partnered with executives to socialize and enforce the standards. KPIs became consistent, comparable, and aligned with strategy. Governance is the backbone of meaningful measurement.",
    "themes": [
      "Governance",
      "Insight Leadership",
      "Strategic Alignment"
    ],
    "skills": [
      "governance",
      "insight leadership",
      "strategic thinking",
      "cross-functional leadership",
      "communication",
      "strategic alignment"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2022"
  },
  {
    "id": "soar_023_data_quality_initiative",
    "type": "transformation",
    "title": "Data Quality Initiative – Restoring Trust in Enterprise Data",
    "employer": "Manulife Retirement",
    "situation": "Leaders had lost confidence in key data sources due to recurring errors, inconsistencies, and unexplained variances. Decision-making slowed as teams double-checked everything manually.",
    "obstacle": "Data issues were systemic and spanned multiple systems, owners, and processes. No single team felt responsible for solving the problem.",
    "action": "Performed a root-cause analysis of recurring data issues Created a data quality scorecard with clear ownership and thresholds Implemented automated validation checks and exception reporting Established a cross-functional data quality council Partnered with engineering to remediate upstream data issues",
    "result": "Significant reduction in data errors and variances Restored leadership confidence in enterprise data Reduced manual rework and accelerated decision-making",
    "impact": "",
    "fullStory": "Data quality issues were slowing the business down. Leaders didn’t trust the numbers, and teams spent hours validating data manually. I conducted a root-cause analysis, built a data quality scorecard, and implemented automated validation checks. I established a cross-functional council and partnered with engineering to fix upstream issues. Errors dropped, confidence increased, and decision-making accelerated. Data quality is the foundation of insight.",
    "themes": [
      "Data Quality",
      "Governance",
      "Operational Excellence"
    ],
    "skills": [
      "data strategy",
      "operational excellence",
      "governance",
      "cross-functional leadership",
      "problem solving",
      "data quality"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2021"
  },
  {
    "id": "soar_024_insight_storytelling",
    "type": "insight",
    "title": "Insight Storytelling – Elevating Analytics Through Narrative",
    "employer": "Manulife Retirement",
    "situation": "Analysts produced technically correct analyses, but leaders struggled to understand the implications. Insights were buried in charts rather than communicated through narrative.",
    "obstacle": "Analysts were trained to focus on accuracy, not storytelling. Many were uncomfortable simplifying complex analysis for executive audiences.",
    "action": "Created a storytelling framework for insight communication Trained analysts on narrative structure, framing, and executive communication Redesigned reporting templates to emphasize insight over data Built examples and playbooks to model effective storytelling Coached teams through real executive presentations",
    "result": "Insights became clearer, more actionable, and more influential Leaders cited improved understanding and faster decision-making Analysts gained confidence and shifted into advisory roles",
    "impact": "",
    "fullStory": "Analysts produced accurate analysis, but leaders struggled to understand what it meant. Insights were buried in charts. I created a storytelling framework, trained analysts on narrative structure, and redesigned templates to emphasize insight over data. I coached teams through real executive presentations. Insights became clearer, decisions became faster, and analysts grew into advisors. Storytelling is the bridge between analysis and action.",
    "themes": [
      "Insight Storytelling",
      "Communication",
      "Leadership Development"
    ],
    "skills": [
      "communication",
      "insight leadership",
      "coaching",
      "strategic thinking",
      "executive influence",
      "insight storytelling",
      "leadership development"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2020"
  },
  {
    "id": "soar_025_cross_functional_insight_forums",
    "type": "leadership",
    "title": "Cross-Functional Insight Forums – Creating an Enterprise Intelligence Rhythm",
    "employer": "Manulife Retirement",
    "situation": "Insight generation was fragmented across teams. Each group produced its own analysis, but there was no shared forum to align on trends, risks, or opportunities.",
    "obstacle": "Teams were accustomed to working in silos and were hesitant to share unfinished thinking or expose analytical gaps in front of peers.",
    "action": "Created a recurring cross-functional insight forum Established a structured agenda focused on trends, risks, and opportunities Encouraged teams to bring early-stage insights for collaborative refinement Built a shared repository for insight tracking and follow-up Facilitated discussions to connect insights across domains",
    "result": "Improved enterprise-wide awareness of emerging trends Accelerated insight development through collaboration Reduced duplication of analysis across teams",
    "impact": "",
    "fullStory": "Insight generation was happening in silos. Teams produced analysis independently, and no one had a full view of trends or risks. I created a cross-functional insight forum with a structured agenda focused on emerging patterns. Teams brought early-stage insights, and we refined them collaboratively. We built a shared repository to track themes and follow-ups. The forum improved enterprise awareness, accelerated insight development, and reduced duplication. Insight becomes powerful when it becomes collective.",
    "themes": [
      "Insight Leadership",
      "Collaboration",
      "Strategic Awareness"
    ],
    "skills": [
      "insight leadership",
      "facilitation",
      "cross-functional collaboration",
      "strategic thinking",
      "communication",
      "collaboration",
      "strategic awareness"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2021"
  },
  {
    "id": "soar_026_member_segmentation_model",
    "type": "insight",
    "title": "Member Segmentation Model – Personalizing the Retirement Journey",
    "employer": "Manulife Retirement",
    "situation": "The business lacked a clear understanding of member segments, leading to generic communications and one-size-fits-all engagement strategies.",
    "obstacle": "Data was scattered across systems, and no single team had the mandate or capability to build a holistic segmentation model.",
    "action": "Consolidated behavioural, demographic, and financial data Built a segmentation model using clustering and behavioural analysis Identified distinct member personas with unique needs and patterns Created playbooks for targeted communication and product strategies Partnered with marketing and product teams to operationalize insights",
    "result": "Enabled personalized engagement strategies across the member journey Improved communication effectiveness and member satisfaction Provided a foundation for targeted product and service design",
    "impact": "",
    "fullStory": "The business treated all members the same, but their needs were very different. I consolidated behavioural, demographic, and financial data and built a segmentation model using clustering techniques. We identified distinct personas and created playbooks for targeted communication and product strategies. Marketing and product teams used the insights to personalize engagement. Segmentation transformed how we understood and supported members. Personalization begins with understanding.",
    "themes": [
      "Member Experience",
      "Analytics",
      "Insight Leadership"
    ],
    "skills": [
      "analytics",
      "insight leadership",
      "strategic thinking",
      "cross-functional collaboration",
      "innovation",
      "member experience"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2022"
  },
  {
    "id": "soar_027_financial_wellness_framework",
    "type": "strategy",
    "title": "Financial Wellness Framework – Defining What It Means to Thrive",
    "employer": "Manulife Retirement",
    "situation": "The organization wanted to position itself as a leader in financial wellness, but lacked a clear definition, framework, or measurement approach.",
    "obstacle": "Financial wellness is broad and subjective. Different teams had different interpretations, and no one agreed on what should be measured or prioritized.",
    "action": "Developed a comprehensive financial wellness framework Defined pillars across behaviour, literacy, resilience, and outcomes Mapped member needs and pain points across life stages Created measurement tools and KPIs to track progress Presented the framework to executives as a strategic differentiator",
    "result": "Leadership aligned on a unified definition of financial wellness Framework became the foundation for product and service strategy Enabled measurable progress toward improving member wellbeing",
    "impact": "",
    "fullStory": "Financial wellness was a strategic priority, but no one could define it consistently. I built a comprehensive framework with pillars across behaviour, literacy, resilience, and outcomes. I mapped member needs across life stages and created measurement tools to track progress. Leadership aligned around the framework, and it became the foundation for product and service strategy. When you define what matters, you can build toward it intentionally.",
    "themes": [
      "Financial Wellness",
      "Strategy",
      "Member Outcomes"
    ],
    "skills": [
      "strategy development",
      "insight leadership",
      "market analysis",
      "communication",
      "innovation",
      "financial wellness",
      "strategy",
      "member outcomes"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2022"
  },
  {
    "id": "soar_028_plan_sponsor_insights",
    "type": "insight",
    "title": "Plan Sponsor Insights – Elevating B2B Understanding",
    "employer": "Manulife Retirement",
    "situation": "The business lacked a structured understanding of plan sponsor needs, behaviours, and pain points. Sales, service, and product teams operated with fragmented insights.",
    "obstacle": "Data on plan sponsors was scattered across CRM systems, service logs, surveys, and anecdotal feedback. No unified view existed.",
    "action": "Consolidated plan sponsor data across CRM, service, and product systems Identified behavioural and demographic patterns across sponsor segments Built a plan sponsor insight model highlighting needs and friction points Created narratives and dashboards for sales, service, and product teams Partnered with leadership to embed insights into strategy and roadmaps",
    "result": "Improved understanding of plan sponsor needs and behaviours Enabled targeted sales and service strategies Informed product roadmap decisions with evidence-based insights",
    "impact": "",
    "fullStory": "Plan sponsor understanding was fragmented. Sales, service, and product teams each had pieces of the puzzle, but no unified view. I consolidated data across CRM, service logs, and product systems, built a segmentation and insight model, and created narratives and dashboards tailored to each team. Leadership used the insights to shape strategy and roadmaps. When you unify fragmented knowledge, you unlock strategic clarity.",
    "themes": [
      "B2B Insights",
      "Analytics",
      "Strategic Enablement"
    ],
    "skills": [
      "insight leadership",
      "analytics",
      "strategic thinking",
      "cross-functional collaboration",
      "communication",
      "b2b insights",
      "strategic enablement"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2021"
  },
  {
    "id": "soar_029_member_journey_mapping",
    "type": "strategy",
    "title": "Member Journey Mapping – Designing for Real Human Behaviour",
    "employer": "Manulife Retirement",
    "situation": "The organization lacked a clear understanding of the end-to-end member journey. Pain points were addressed reactively rather than strategically.",
    "obstacle": "Teams owned different parts of the journey and had never collaborated to build a holistic view. Data and insights were siloed.",
    "action": "Mapped the full member journey across onboarding, contributions, engagement, and retirement Identified behavioural friction points and emotional drivers Integrated quantitative and qualitative insights into a unified narrative Created journey personas and opportunity maps Partnered with product, marketing, and service teams to embed journey insights into strategy",
    "result": "Created the first enterprise-wide member journey map Enabled targeted improvements across digital, product, and service Shifted the organization toward human-centered design",
    "impact": "",
    "fullStory": "The member journey was poorly understood. Each team owned a piece, but no one saw the whole. I mapped the full journey, identified behavioural friction points, and integrated quantitative and qualitative insights into a unified narrative. We created personas and opportunity maps and embedded them into product, marketing, and service strategies. The organization shifted toward human-centered design. When you see the whole journey, you can finally design for it.",
    "themes": [
      "Member Experience",
      "Design Thinking",
      "Strategy"
    ],
    "skills": [
      "strategy",
      "insight leadership",
      "design thinking",
      "cross-functional leadership",
      "communication",
      "member experience"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2021"
  },
  {
    "id": "soar_030_data_strategy_blueprint",
    "type": "strategy",
    "title": "Data Strategy Blueprint – Building the Foundation for Enterprise Intelligence",
    "employer": "Manulife Retirement",
    "situation": "The organization needed a cohesive data strategy to support analytics, reporting, and digital transformation, but efforts were fragmented and reactive.",
    "obstacle": "Different teams had different priorities, tools, and definitions of what 'data strategy' meant. No unified vision or roadmap existed.",
    "action": "Developed a comprehensive data strategy blueprint covering governance, architecture, quality, and insight Defined strategic pillars and capabilities required for maturity Mapped current-state gaps and future-state opportunities Created a multi-year roadmap with clear sequencing and ownership Presented the blueprint to executives to secure alignment and investment",
    "result": "Leadership aligned on a unified data strategy Roadmap guided investment and prioritization decisions Created clarity on how data supports enterprise transformation",
    "impact": "",
    "fullStory": "Data efforts were fragmented and reactive. The organization needed a cohesive strategy. I built a data strategy blueprint covering governance, architecture, quality, and insight. I mapped gaps, defined future-state capabilities, and created a multi-year roadmap. Leadership aligned around the strategy, and it guided investment decisions. Strategy is the art of creating clarity and direction in a complex environment.",
    "themes": [
      "Data Strategy",
      "Transformation",
      "Strategic Planning"
    ],
    "skills": [
      "data strategy",
      "strategic planning",
      "insight leadership",
      "executive communication",
      "organizational design",
      "transformation"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2023"
  },
  {
    "id": "soar_031_operating_rhythm_design",
    "type": "leadership",
    "title": "Operating Rhythm Design – Creating a Cadence for Strategic Execution",
    "employer": "Manulife Retirement",
    "situation": "The organization lacked a consistent operating rhythm. Meetings were reactive, reporting cycles were misaligned, and teams struggled to stay synchronized.",
    "obstacle": "Different functions had their own cadences and priorities. Attempts to standardize rhythms in the past had failed due to lack of clarity and governance.",
    "action": "Mapped existing meeting and reporting cadences across functions Identified redundancies, gaps, and misalignments Designed a unified operating rhythm aligned to strategic cycles Defined purpose, inputs, and outputs for each meeting type Implemented governance to maintain discipline and consistency",
    "result": "Improved alignment across teams and leadership levels Reduced meeting fatigue and increased strategic focus Created a predictable cadence that supported execution",
    "impact": "",
    "fullStory": "The organization lacked a consistent operating rhythm. Meetings were reactive, reporting cycles were misaligned, and teams struggled to stay synchronized. I mapped existing cadences, identified redundancies and gaps, and designed a unified operating rhythm aligned to strategic cycles. I defined the purpose, inputs, and outputs for each meeting type and implemented governance to maintain discipline. The result was improved alignment, reduced meeting fatigue, and a predictable cadence that supported execution. Rhythm is the heartbeat of strategy.",
    "themes": [
      "Operating Rhythm",
      "Strategic Execution",
      "Organizational Design"
    ],
    "skills": [
      "organizational design",
      "strategic planning",
      "leadership",
      "governance",
      "cross-functional collaboration",
      "operating rhythm",
      "strategic execution"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2023"
  },
  {
    "id": "soar_032_insight_maturity_model",
    "type": "strategy",
    "title": "Insight Maturity Model – Defining the Path from Reporting to Intelligence",
    "employer": "Manulife Retirement",
    "situation": "The organization wanted to evolve from basic reporting to advanced insight generation, but lacked a clear understanding of what maturity looked like or how to get there.",
    "obstacle": "Teams had different interpretations of 'insight' and were at varying levels of analytical capability. Without a shared framework, progress was inconsistent.",
    "action": "Developed an insight maturity model with clear stages and capabilities Defined criteria across data, tools, skills, governance, and culture Assessed current-state maturity across teams Created a roadmap to advance maturity over time Presented the model to executives to align expectations and investment",
    "result": "Created a shared language for insight maturity Enabled targeted capability-building across teams Guided investment in tools, training, and governance",
    "impact": "",
    "fullStory": "Everyone agreed we needed to evolve from reporting to insight, but no one could define what maturity looked like. I built an insight maturity model with clear stages and criteria across data, tools, skills, governance, and culture. I assessed current-state maturity and created a roadmap for capability-building. Executives aligned around the model, and it guided investment decisions. Maturity is not a destination — it’s a disciplined progression.",
    "themes": [
      "Insight Maturity",
      "Strategy",
      "Organizational Development"
    ],
    "skills": [
      "insight leadership",
      "strategic planning",
      "organizational design",
      "communication",
      "capability building",
      "insight maturity",
      "strategy",
      "organizational development"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2023"
  },
  {
    "id": "soar_033_data_literacy_program",
    "type": "transformation",
    "title": "Data Literacy Program – Empowering the Organization to Use Data Effectively",
    "employer": "Manulife Retirement",
    "situation": "Leaders and frontline teams struggled to interpret data, leading to misinformed decisions and overreliance on analysts for basic interpretation.",
    "obstacle": "Data literacy varied widely across the organization. Some teams were advanced, while others lacked foundational skills. A one-size-fits-all approach wouldn’t work.",
    "action": "Assessed data literacy levels across functions and roles Developed a tiered curriculum tailored to different skill levels Created training modules on interpretation, visualization, and storytelling Built hands-on exercises using real business data Partnered with HR and L&D to embed data literacy into development programs",
    "result": "Improved data confidence and capability across the organization Reduced dependency on analysts for basic interpretation Enabled faster, more informed decision-making",
    "impact": "",
    "fullStory": "Data literacy was uneven across the organization. Leaders and frontline teams struggled to interpret data, slowing decisions and increasing dependency on analysts. I assessed literacy levels, built a tiered curriculum, and created training modules on interpretation, visualization, and storytelling. We used real business data for hands-on learning and embedded the program into development pathways. The result was improved confidence, faster decisions, and a more data-enabled culture. Literacy is the foundation of empowerment.",
    "themes": [
      "Data Literacy",
      "Capability Building",
      "Insight Leadership"
    ],
    "skills": [
      "capability building",
      "insight leadership",
      "communication",
      "organizational development",
      "change leadership",
      "data literacy"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2022"
  },
  {
    "id": "soar_034_insight_operating_model",
    "type": "strategy",
    "title": "Insight Operating Model – Defining How Insight Flows Through the Enterprise",
    "employer": "Manulife Retirement",
    "situation": "Insight creation was inconsistent across teams. Some groups produced high-quality analysis, while others focused on raw reporting. There was no unified operating model for how insight should be generated, reviewed, and delivered.",
    "obstacle": "Teams had different levels of analytical maturity and different interpretations of what 'insight' meant. Without a shared framework, quality and consistency varied widely.",
    "action": "Designed an enterprise insight operating model defining roles, workflows, and quality standards Mapped insight creation from data ingestion to executive delivery Defined insight categories, triggers, and review processes Built templates and playbooks to standardize insight communication Partnered with leaders to embed the model into planning and reporting cycles",
    "result": "Created a unified, enterprise-wide approach to insight generation Improved consistency and quality of insight delivered to executives Enabled teams to shift from reporting to advisory work",
    "impact": "",
    "fullStory": "Insight creation was inconsistent. Some teams produced high-quality analysis, while others focused on raw reporting. I designed an insight operating model that defined roles, workflows, and quality standards. I mapped the full lifecycle of insight, built templates and playbooks, and embedded the model into planning and reporting cycles. The result was a unified, enterprise-wide approach that elevated insight quality and shifted teams toward advisory work. When insight becomes systematic, it becomes powerful.",
    "themes": [
      "Insight Leadership",
      "Organizational Design",
      "Strategic Enablement"
    ],
    "skills": [
      "insight leadership",
      "organizational design",
      "strategic planning",
      "communication",
      "cross-functional leadership",
      "strategic enablement"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2023"
  },
  {
    "id": "soar_035_change_management_playbook",
    "type": "leadership",
    "title": "Change Management Playbook – Guiding Teams Through Transformation",
    "employer": "Manulife Retirement",
    "situation": "The organization was undergoing multiple simultaneous transformations, but teams lacked a structured approach to change management. Adoption was inconsistent and resistance was high.",
    "obstacle": "Different teams had different levels of change readiness. Some were overwhelmed, others skeptical, and many had never been trained in structured change practices.",
    "action": "Developed a change management playbook tailored to the organization Defined stages of change, communication strategies, and adoption metrics Created templates for stakeholder mapping, readiness assessments, and risk mitigation Trained leaders and managers on how to guide teams through change Embedded the playbook into major transformation initiatives",
    "result": "Improved adoption rates across transformation programs Reduced resistance and increased engagement Provided leaders with a practical toolkit for managing change",
    "impact": "",
    "fullStory": "The organization was undergoing multiple transformations, but teams lacked a structured approach to change. I built a change management playbook with stages, communication strategies, and adoption metrics. I created templates for stakeholder mapping and readiness assessments and trained leaders on how to guide teams through change. Adoption improved, resistance decreased, and leaders finally had a practical toolkit. Change succeeds when people feel guided, not pushed.",
    "themes": [
      "Change Leadership",
      "Organizational Development",
      "Leadership Enablement"
    ],
    "skills": [
      "change leadership",
      "communication",
      "organizational development",
      "facilitation",
      "strategic thinking",
      "leadership enablement"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2022"
  },
  {
    "id": "soar_036_data_visualization_standards",
    "type": "transformation",
    "title": "Data Visualization Standards – Making Insight Instantly Understandable",
    "employer": "Manulife Retirement",
    "situation": "Reports and dashboards varied widely in quality. Visualizations were inconsistent, cluttered, and often confusing for executives.",
    "obstacle": "Analysts had different levels of design skill and no shared standards. Many believed that more charts meant more value, leading to visual noise rather than clarity.",
    "action": "Created enterprise data visualization standards based on best practices Defined rules for chart selection, colour usage, layout, and annotation Built templates for dashboards, executive reports, and insight summaries Trained analysts on visual storytelling and cognitive load principles Embedded standards into reporting tools and governance processes",
    "result": "Improved clarity and consistency of visualizations across the organization Executives understood insights faster and with less explanation Analysts produced cleaner, more impactful visual narratives",
    "impact": "",
    "fullStory": "Visualizations were inconsistent and often confusing. Analysts used different styles, colours, and chart types, making it hard for executives to interpret insights. I created data visualization standards, built templates, and trained analysts on visual storytelling. We embedded the standards into reporting tools and governance. Visual clarity improved dramatically, and executives understood insights faster. Good visualization is not decoration — it’s communication.",
    "themes": [
      "Visualization",
      "Insight Communication",
      "Design Standards"
    ],
    "skills": [
      "communication",
      "insight leadership",
      "design thinking",
      "operational excellence",
      "coaching",
      "visualization",
      "insight communication",
      "design standards"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2021"
  },
  {
    "id": "soar_037_team_culture_reset",
    "type": "leadership",
    "title": "Team Culture Reset – Rebuilding Identity and Performance",
    "employer": "Manulife Retirement",
    "situation": "The analytics and reporting team had low morale, unclear identity, and inconsistent performance. They saw themselves as order-takers rather than strategic contributors.",
    "obstacle": "Years of reactive work had eroded confidence. Analysts were hesitant to speak up, and leaders viewed the team as tactical rather than advisory.",
    "action": "Redefined the team’s purpose around insight, influence, and strategic partnership Introduced new rituals: insight reviews, learning sessions, and peer coaching Set clear expectations for quality, ownership, and communication Celebrated wins publicly to rebuild confidence and identity Mentored analysts individually to develop strengths and career paths",
    "result": "Team morale and confidence improved dramatically Analysts shifted from order-takers to trusted advisors Leadership recognized the team as a strategic asset",
    "impact": "",
    "fullStory": "The analytics team had lost its identity. They saw themselves as order-takers, not advisors. I reset the culture by redefining purpose, introducing new rituals, and setting clear expectations for quality and ownership. I coached analysts individually and celebrated wins publicly. Over time, confidence grew, performance improved, and the team became a trusted strategic partner. Culture is built through clarity, consistency, and belief.",
    "themes": [
      "Leadership",
      "Culture",
      "Team Development"
    ],
    "skills": [
      "people leadership",
      "coaching",
      "culture building",
      "communication",
      "strategic enablement",
      "leadership",
      "culture",
      "team development"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2020"
  },
  {
    "id": "soar_038_executive_simplification",
    "type": "insight",
    "title": "Executive Simplification – Turning Complexity Into Clarity",
    "employer": "Manulife Retirement",
    "situation": "Executives struggled to understand complex financial and operational issues because analysis was presented with too much detail and not enough narrative clarity.",
    "obstacle": "Analysts were afraid to simplify for fear of being seen as inaccurate or incomplete. Leaders were overwhelmed by technical detail and lacked actionable takeaways.",
    "action": "Created a simplification framework for executive communication Redesigned presentations to focus on the 'so what' and recommended actions Coached analysts on distilling complexity into clear narratives Built templates for executive readouts with structured logic flows Partnered with senior leaders to refine messaging for high-stakes meetings",
    "result": "Executives gained clarity and made faster decisions Analysts became more confident and influential Complex issues were communicated with precision and impact",
    "impact": "",
    "fullStory": "Executives were overwhelmed by complex analysis. Analysts feared simplifying, so presentations were dense and technical. I created a simplification framework, redesigned executive readouts, and coached analysts on narrative clarity. Leaders began making decisions faster, and analysts became more influential. Simplicity is not the opposite of intelligence — it is the expression of it.",
    "themes": [
      "Executive Communication",
      "Insight Storytelling",
      "Leadership"
    ],
    "skills": [
      "communication",
      "insight leadership",
      "executive influence",
      "coaching",
      "strategic thinking",
      "executive communication",
      "insight storytelling",
      "leadership"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2021"
  },
  {
    "id": "soar_039_transformation_governance",
    "type": "governance",
    "title": "Transformation Governance – Bringing Discipline to Enterprise Change",
    "employer": "Manulife Retirement",
    "situation": "The organization was running multiple transformation initiatives without a unified governance structure. Priorities conflicted, timelines slipped, and leaders lacked visibility.",
    "obstacle": "Each initiative had its own steering committee, cadence, and reporting format. No one had a consolidated view of risks, dependencies, or progress.",
    "action": "Designed an enterprise transformation governance model Created a unified steering committee structure with clear decision rights Standardized reporting, risk tracking, and dependency management Built dashboards for executive visibility across all initiatives Aligned leaders on prioritization and sequencing",
    "result": "Improved coordination across transformation programs Increased transparency and reduced execution risk Enabled leadership to make informed, enterprise-level decisions",
    "impact": "",
    "fullStory": "Transformation efforts were happening in silos. Each initiative had its own governance, and leaders lacked a consolidated view. I designed an enterprise governance model, standardized reporting, and built dashboards for executive visibility. Leaders gained clarity, risks decreased, and execution improved. Governance is the structure that turns ambition into reality.",
    "themes": [
      "Transformation Governance",
      "Strategic Execution",
      "Risk Management"
    ],
    "skills": [
      "governance",
      "strategic planning",
      "cross-functional leadership",
      "risk management",
      "organizational design",
      "transformation governance",
      "strategic execution"
    ],
    "useFor": [
      "Resume",
      "Interview",
      "Book"
    ],
    "notes": "",
    "dateAdded": "2023"
  }
];

// ─── HELPERS ──────────────────────────────────────────────
async function callClaude(system, user, maxTokens=1000) {
  const r = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:MODEL, max_tokens:maxTokens, system, messages:[{role:"user",content:user}] }),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d.content?.[0]?.text || "";
}

function parseJSON(text) {
  try {
    const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    return JSON.parse((m?.[1] || m?.[0] || text).trim());
  } catch { return null; }
}

function normalizeStory(s) {
  return {
    ...s,
    skills:  s.skills?.length  ? s.skills  : (s.themes||[]).map(t=>t.toLowerCase()),
    themes:  s.themes?.length  ? s.themes  : [],
    useFor:  s.useFor          ? s.useFor  : [],
    obstacle: s.obstacle || "",
    impact:  s.impact  || "",
    fullStory: s.fullStory || "",
  };
}

function buildExpContext(exp) {
  return (exp||EXPERIENCE_DEFAULT).map(e=>`${e.role} at ${e.org} (${e.dates}):\nMandate: ${e.mandate||""}\n${e.bullets.map(b=>`• ${b}`).join("\n")}`).join("\n\n");
}

function buildStoryContext(stories) {
  return stories.slice(0,30).map(s=>`SOAR: ${s.title} (${s.employer})\nSkills: ${(s.skills||s.themes||[]).join(", ")}\nAction: ${s.action}\nResult: ${s.result}`).join("\n\n");
}

function tierStyle(score) {
  if (score >= 80) return { bg:"#EAF3DE", color:"#3B6D11", label:"Strong", bar:"#639922" };
  if (score >= 60) return { bg:"#FAEEDA", color:"#854F0B", label:"Partial", bar:"#EF9F27" };
  return { bg:"#FCEBEB", color:"#A32D2D", label:"Gap", bar:"#E24B4A" };
}

function typeOf(id) { return TYPES.find(t=>t.id===id)||TYPES[0]; }

function parseDates(datesStr) {
  const parts = (datesStr||"").split(/[–-]/).map(s=>s.trim());
  return {
    startYear: parseInt(parts[0]) || 2000,
    endYear:   parts[1]==="Present"||!parts[1] ? null : parseInt(parts[1]),
  };
}

function isRelatedOrg(storyEmployer, expOrg) {
  const e=(storyEmployer||"").toLowerCase();
  const o=(expOrg||"").toLowerCase();
  if(o.includes("state street")) return e.includes("state street")||e.includes("early career");
  if(o.includes("omers"))        return e.includes("omers");
  if(o.includes("private asset")) return e.includes("private market")||e.includes("private asset");
  if(o.includes("manulife"))     return e.includes("manulife");
  return false;
}



function downloadBlob(content, filename, mime) {
  const blob=new Blob([content],{type:mime});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ─── STYLES ───────────────────────────────────────────────
const css = {
  card:  { background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, padding:"1rem 1.25rem", cursor:"pointer" },
  inp:   { width:"100%", fontSize:13, padding:"7px 10px", border:"0.5px solid var(--color-border-tertiary)", borderRadius:6, background:"var(--color-background-secondary)", color:"var(--color-text-primary)", fontFamily:"var(--font-sans)", boxSizing:"border-box" },
  lbl:   { fontSize:12, fontWeight:500, color:"var(--color-text-secondary)", marginBottom:4, display:"block" },
  ghost: { fontSize:12, padding:"5px 12px", border:"0.5px solid var(--color-border-secondary)", borderRadius:6, background:"none", color:"var(--color-text-secondary)", cursor:"pointer" },
};
const S = {
  card:     { background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, padding:"1.25rem" },
  btn:      { padding:"8px 14px", borderRadius:8, border:"0.5px solid var(--color-border-secondary)", background:"transparent", cursor:"pointer", fontSize:13, color:"var(--color-text-primary)", fontWeight:400, fontFamily:"inherit" },
  primary:  { padding:"10px 20px", borderRadius:8, border:"none", background:"#185FA5", cursor:"pointer", fontSize:14, color:"#fff", fontWeight:500, fontFamily:"inherit" },
  inp:      { width:"100%", padding:"9px 12px", borderRadius:8, border:"0.5px solid var(--color-border-secondary)", background:"var(--color-background-primary)", color:"var(--color-text-primary)", fontSize:13, fontFamily:"inherit", boxSizing:"border-box" },
  textarea: { width:"100%", padding:"9px 12px", borderRadius:8, border:"0.5px solid var(--color-border-secondary)", background:"var(--color-background-primary)", color:"var(--color-text-primary)", fontSize:13, fontFamily:"inherit", boxSizing:"border-box", resize:"vertical" },
  label:    { display:"block", fontSize:10, fontWeight:500, letterSpacing:"0.07em", textTransform:"uppercase", color:"var(--color-text-tertiary)", marginBottom:5 },
  tag:      { fontSize:10, padding:"2px 8px", borderRadius:20, background:"var(--color-background-info)", color:"var(--color-text-info)" },
};

// ─── STORY COMPONENTS ─────────────────────────────────────
function Pill({typeId,sm=true}) {
  const t=typeOf(typeId);
  return <span style={{fontSize:sm?10:11,fontWeight:600,padding:sm?"2px 7px":"3px 10px",borderRadius:20,background:t.bg,color:t.color,whiteSpace:"nowrap"}}>{t.label}</span>;
}
function Tag({label,variant="theme"}) {
  if(variant==="use"){
    const C={Resume:["#dbeafe","#1e40af"],"Cover Letter":["#d1fae5","#065f46"],Interview:["#fef3c7","#92400e"],Book:["#ede9fe","#4c1d95"],LinkedIn:["#fce7f3","#9d174d"]};
    const [bg,fg]=C[label]||["#f3f4f6","#374151"];
    return <span style={{fontSize:11,padding:"2px 7px",borderRadius:4,background:bg,color:fg,fontWeight:500}}>{label}</span>;
  }
  if(variant==="skill") return <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"var(--color-background-info)",color:"var(--color-text-info)"}}>{label}</span>;
  return <span style={{fontSize:11,padding:"2px 7px",borderRadius:4,background:"var(--color-background-secondary)",color:"var(--color-text-secondary)",border:"0.5px solid var(--color-border-tertiary)"}}>{label}</span>;
}

function StoryCard({story,onClick}) {
  const t=typeOf(story.type);
  return (
    <div onClick={onClick} style={{...css.card,borderLeft:`3px solid ${t.dot}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:6}}>
        <div style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)",lineHeight:1.4,flex:1}}>{story.title}</div>
        <Pill typeId={story.type}/>
      </div>
      {story.employer&&<div style={{fontSize:12,color:"var(--color-text-tertiary)",marginBottom:6}}>{story.employer}</div>}
      <div style={{fontSize:13,color:"var(--color-text-secondary)",lineHeight:1.5,marginBottom:8,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{story.situation}</div>
      {story.impact&&<div style={{fontSize:12,fontWeight:600,color:t.color,marginBottom:6}}>{story.impact}</div>}
      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
        {(story.skills||story.themes||[]).slice(0,3).map(sk=><Tag key={sk} label={sk} variant="skill"/>)}
        {(story.skills||story.themes||[]).length>3&&<span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>+{(story.skills||story.themes||[]).length-3}</span>}
      </div>
    </div>
  );
}

function DetailView({story,onBack,onEdit,onDelete}) {
  const [showFull,setShowFull]=useState(false);
  const t=typeOf(story.type);
  const copy=(fmt)=>{
    const texts={
      bullet:`• ${story.action} → ${story.result}${story.impact?" ("+story.impact+")":""}`,
      interview:`Story: ${story.title}\nContext: ${story.situation}\nChallenge: ${story.obstacle}\nWhat I did: ${story.action}\nOutcome: ${story.result}`,
    };
    navigator.clipboard?.writeText(texts[fmt]||story.fullStory||story.action);
  };
  return (
    <div style={{paddingTop:"1.5rem"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"1.5rem"}}>
        <button onClick={onBack} style={{...css.ghost}}>← Back</button>
        {onEdit&&<button onClick={onEdit} style={{...css.ghost}}>Edit</button>}
        {onDelete&&<button onClick={()=>{if(window.confirm("Delete this story?"))onDelete(story.id);}} style={{...css.ghost,color:"#b91c1c",borderColor:"#fca5a5"}}>Delete</button>}
      </div>
      <div style={{marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><Pill typeId={story.type} sm={false}/></div>
        <div style={{fontSize:22,fontWeight:500,color:"var(--color-text-primary)",lineHeight:1.3,marginBottom:4}}>{story.title}</div>
        <div style={{fontSize:14,color:"#1d4ed8",marginBottom:"1.5rem"}}>{story.employer}</div>
      </div>
      {[["Situation",story.situation],["Obstacle",story.obstacle],["Action",story.action],["Result",story.result],["Impact",story.impact]].map(([l,v])=>v&&(
        <div key={l} style={{marginBottom:"1.25rem"}}>
          <div style={{fontSize:11,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>{l}</div>
          <div style={{fontSize:13,color:"var(--color-text-secondary)",lineHeight:1.7}}>{v}</div>
        </div>
      ))}
      {story.fullStory&&(
        <div style={{marginBottom:"1.25rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{fontSize:11,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.05em"}}>Full Story</div>
            <button onClick={()=>setShowFull(f=>!f)} style={{...css.ghost,fontSize:11}}>{showFull?"Hide":"Show"}</button>
          </div>
          {showFull&&<div style={{fontSize:13,color:"var(--color-text-secondary)",lineHeight:1.8,padding:"1rem",background:"var(--color-background-secondary)",borderRadius:8,whiteSpace:"pre-wrap"}}>{story.fullStory}</div>}
        </div>
      )}
      <div style={{marginBottom:"1.25rem"}}>
        <div style={{fontSize:11,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Skills</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{(story.skills||story.themes||[]).map(s=><Tag key={s} label={s} variant="skill"/>)}</div>
      </div>
      {story.themes?.length>0&&<div style={{marginBottom:"1.25rem"}}>
        <div style={{fontSize:11,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Themes</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{story.themes.map(th=><Tag key={th} label={th}/>)}</div>
      </div>}
      {story.useFor?.length>0&&<div style={{marginBottom:"1.5rem"}}>
        <div style={{fontSize:11,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Use for</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{story.useFor.map(u=><Tag key={u} label={u} variant="use"/>)}</div>
      </div>}
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {[["Bullet","bullet"],["Interview Format","interview"]].map(([l,f])=>(
          <button key={f} onClick={()=>copy(f)} style={{...css.ghost}}>{l} ↗</button>
        ))}
      </div>
    </div>
  );
}

function StoryEditForm({initial,onSave,onCancel}) {
  const [form,setForm]=useState(initial||{...EMPTY,dateAdded:new Date().toISOString().slice(0,10)});
  const [ok,setOk]=useState(false);
  const isEdit=!!initial?.id;
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const toggle=(arr,v)=>arr.includes(v)?arr.filter(x=>x!==v):[...arr,v];
  function handleSave(){
    const story=normalizeStory({...form,id:form.id||Date.now(),dateAdded:form.dateAdded||new Date().toISOString().slice(0,10)});
    onSave(story);setOk(true);setTimeout(()=>setOk(false),1200);
  }
  const handleCancel=()=>onCancel();
  return (
    <div style={{paddingTop:"1.5rem",maxWidth:680}}>
      <div style={{fontSize:18,fontWeight:500,color:"var(--color-text-primary)",marginBottom:"1.5rem"}}>{isEdit?"Edit story":"Add new story"}</div>
      {[["Title","text","title","Story title"],["Employer","text","employer","Company name"]].map(([lbl,type,key,ph])=>(
        <div key={key} style={{marginBottom:"1rem"}}><label style={css.lbl}>{lbl}</label><input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={ph} style={css.inp}/></div>
      ))}
      <div style={{marginBottom:"1rem"}}>
        <label style={css.lbl}>Type</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {TYPES.map(t=><button key={t.id} onClick={()=>set("type",t.id)} style={{fontSize:12,padding:"4px 12px",borderRadius:20,border:`1.5px solid ${form.type===t.id?t.dot:"transparent"}`,cursor:"pointer",background:form.type===t.id?t.bg:"var(--color-background-secondary)",color:form.type===t.id?t.color:"var(--color-text-secondary)"}}>{t.label}</button>)}
        </div>
      </div>
      {[["Situation","situation","What was the context or challenge?"],["Obstacle","obstacle","What made this difficult?"],["Action","action","What did you specifically do?"],["Result","result","What was the outcome?"],["Impact","impact","Quantifiable impact if any"],["Full Story","fullStory","Write it in first person — as you'd tell it in an interview room..."]].map(([lbl,key,ph])=>(
        <div key={key} style={{marginBottom:"1rem"}}><label style={css.lbl}>{lbl}</label><textarea value={form[key]||""} onChange={e=>set(key,e.target.value)} placeholder={ph} style={{...css.inp,minHeight:key==="fullStory"?110:66,resize:"vertical"}}/></div>
      ))}
      <div style={{marginBottom:"1rem"}}>
        <label style={css.lbl}>Skills (comma-separated)</label>
        <input value={(form.skills||[]).join(", ")} onChange={e=>set("skills",e.target.value.split(",").map(s=>s.trim()).filter(Boolean))} placeholder="e.g. financial modelling, stakeholder management, change leadership" style={css.inp}/>
      </div>
      <div style={{marginBottom:"1rem"}}>
        <label style={css.lbl}>Themes</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:5,padding:"8px 10px",border:"0.5px solid var(--color-border-tertiary)",borderRadius:6,background:"var(--color-background-secondary)"}}>
          {THEMES.map(th=><button key={th} onClick={()=>set("themes",toggle(form.themes||[],th))} style={{fontSize:11,padding:"3px 9px",borderRadius:20,border:"none",cursor:"pointer",background:(form.themes||[]).includes(th)?"var(--color-text-primary)":"var(--color-background-primary)",color:(form.themes||[]).includes(th)?"var(--color-background-primary)":"var(--color-text-secondary)"}}>{th}</button>)}
        </div>
      </div>
      <div style={{marginBottom:"1.5rem"}}>
        <label style={css.lbl}>Use for</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {USE_FOR.map(u=><button key={u} onClick={()=>set("useFor",toggle(form.useFor||[],u))} style={{fontSize:12,padding:"4px 12px",borderRadius:20,border:"0.5px solid var(--color-border-secondary)",cursor:"pointer",background:(form.useFor||[]).includes(u)?"var(--color-text-primary)":"none",color:(form.useFor||[]).includes(u)?"var(--color-background-primary)":"var(--color-text-secondary)"}}>{u}</button>)}
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={handleSave} disabled={!form.title||!form.situation} style={{padding:"8px 18px",borderRadius:6,cursor:form.title&&form.situation?"pointer":"default",background:ok?"#10b981":form.title&&form.situation?"var(--color-text-primary)":"var(--color-background-secondary)",color:ok||form.title&&form.situation?"var(--color-background-primary)":"var(--color-text-tertiary)",border:"none",fontSize:13,fontWeight:500}}>
          {ok?"Saved!":isEdit?"Save changes":"Add to library"}
        </button>
        <button onClick={handleCancel} style={{...css.ghost}}>Cancel</button>
      </div>
    </div>
  );
}

// ─── FREE-FORM CAPTURE ────────────────────────────────────
function FreeAddView({stories, experience, onSave, onUpdateExperience, onCancel}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [proposals, setProposals] = useState(null);
  const [accepted, setAccepted] = useState({});
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const expData = experience || EXPERIENCE_DEFAULT;

  const examples = [
    "I led a migration of our data warehouse to Snowflake — took six months, involved four teams, and cut query times by 80%",
    "I built a behavioral segmentation model that identified three member cohorts and informed a product redesign",
    "I presented an independent capital allocation analysis to the CFO that changed how we evaluated new products",
    "I coached a junior analyst over six months and they were promoted — first time anyone on the team had been promoted in three years",
    "I won an award for delivering an insight framework that the entire enterprise adopted",
  ];

  async function analyze() {
    if (!input.trim() || busy) return;
    setBusy(true); setErr(""); setProposals(null); setSaved(false); setAccepted({});
    try {
      const expSummary = expData.map(e => `${e.id}: ${e.role} at ${e.org} (${e.dates})`).join("\n");
      const text = await callClaude(
        `You are a career data assistant for Adam Waldman, a senior finance and analytics executive. Given a free-form description of something he did, create structured career data. You must decide what to create — you can create multiple items if appropriate. For example, a major project might warrant both a SOAR story AND one or two new experience bullets under the relevant role.

Return ONLY valid JSON in this exact shape:
{
  "analysis": "one sentence describing what was captured",
  "items": [
    {
      "type": "soar",
      "label": "short human-readable label",
      "data": {
        "title": "string",
        "type": "career|insight|leadership|research",
        "employer": "string",
        "situation": "string",
        "obstacle": "string",
        "action": "string",
        "result": "string",
        "impact": "string (quantifiable if possible, else empty)",
        "fullStory": "3-4 sentences in first person",
        "themes": ["theme1","theme2"],
        "skills": ["skill1","skill2"],
        "useFor": ["Resume","Interview"]
      }
    },
    {
      "type": "experience_bullet",
      "label": "short human-readable label",
      "exp_id": "exp_001",
      "data": {
        "bullets": ["bullet 1 starting with strong action verb", "bullet 2 if warranted"]
      }
    },
    {
      "type": "award",
      "label": "short human-readable label",
      "data": {
        "award": "string",
        "org": "string",
        "year": 2024,
        "narrative": "string"
      }
    }
  ]
}

Rules:
- Always create a SOAR story if there is a clear situation→action→result arc
- Create experience_bullet items if the story belongs to a specific role and adds something not already captured — match exp_id to the role list provided
- Create an award item only if an award is explicitly mentioned
- Use "education" type (with fields cred, org, year, note) only if a credential is mentioned
- Be specific and use Adam's voice — confident, direct, outcome-focused
- For SOAR fullStory: write as Adam would say it in an interview room
- Keep experience bullets to 1-2 lines, strong action verbs, quantified where possible`,

        `Adam's description:
"${input}"

His current roles (for exp_id matching):
${expSummary}`
      );
      const parsed = parseJSON(text);
      if (!parsed?.items?.length) throw new Error("No items returned — please try rephrasing.");
      const initAccepted = {};
      parsed.items.forEach((_,i) => initAccepted[i] = true);
      setProposals(parsed);
      setAccepted(initAccepted);
    } catch(e) {
      setErr(e.message || "Something went wrong — please try again.");
    }
    setBusy(false);
  }

  function toggle(i) { setAccepted(a => ({...a, [i]: !a[i]})); }

  function saveAll() {
    if (!proposals) return;
    const expCopy = expData.map(e => ({...e, bullets:[...e.bullets]}));
    let experienceChanged = false;

    proposals.items.forEach((item, i) => {
      if (!accepted[i]) return;
      if (item.type === "soar") {
        const story = normalizeStory({
          ...item.data,
          id: Date.now() + i,
          dateAdded: new Date().toISOString().slice(0,10),
        });
        onSave(story);
      } else if (item.type === "experience_bullet") {
        const expEntry = expCopy.find(e => e.id === item.exp_id);
        if (expEntry && item.data?.bullets?.length) {
          expEntry.bullets = [...expEntry.bullets, ...item.data.bullets];
          experienceChanged = true;
        }
      }
      // award and education — show as "saved to profile" note; user manages manually for now
    });

    if (experienceChanged) onUpdateExperience(expCopy);
    setSaved(true);
  }

  const typeColors = {
    soar:              { bg:"#d1fae5", color:"#065f46", label:"SOAR Story"          },
    experience_bullet: { bg:"#dbeafe", color:"#1e40af", label:"Experience Bullet"   },
    award:             { bg:"#fef3c7", color:"#92400e", label:"Award"               },
    education:         { bg:"#ede9fe", color:"#4c1d95", label:"Education"           },
  };

  if (saved) return (
    <div style={{paddingTop:"1.5rem",maxWidth:640}}>
      <div style={{background:"#d1fae5",borderRadius:10,padding:"1.5rem",marginBottom:"1.5rem",borderLeft:"3px solid #10b981"}}>
        <div style={{fontSize:16,fontWeight:500,color:"#065f46",marginBottom:4}}>✓ Saved to your library</div>
        <div style={{fontSize:13,color:"#065f46",lineHeight:1.6}}>
          {proposals.items.filter((_,i)=>accepted[i]).map((item,i)=>{
            const tc = typeColors[item.type]||typeColors.soar;
            return <div key={i} style={{marginBottom:3}}>· <strong>{item.label}</strong> → <span style={{background:tc.bg,color:tc.color,fontSize:11,padding:"1px 6px",borderRadius:4,fontWeight:500}}>{tc.label}</span></div>;
          })}
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>{setInput("");setProposals(null);setAccepted({});setSaved(false);}} style={{...css.ghost}}>Capture another</button>
        <button onClick={onCancel} style={{...css.ghost}}>Back to library</button>
      </div>
    </div>
  );

  return (
    <div style={{paddingTop:"1.5rem",maxWidth:640}}>
      <div style={{marginBottom:"1.5rem"}}>
        <div style={{fontSize:20,fontWeight:500,color:"var(--color-text-primary)",marginBottom:4}}>Capture something</div>
        <div style={{fontSize:13,color:"var(--color-text-secondary)",lineHeight:1.6}}>
          Describe what happened in plain language. The AI will figure out what it is — a SOAR story, experience bullets, an award — and structure it for you.
        </div>
      </div>

      <div style={{marginBottom:14}}>
        <textarea
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey)analyze();}}
          placeholder="e.g. I led a data lake migration at Manulife that took eight months and involved consolidating 14 source systems. The project was politically complex because each team owned their own data. I built a governance model, established a data council, and standardized definitions across the organization. By the end, query times dropped 80% and the CFO cited it in the annual report…"
          style={{...css.inp,minHeight:140,resize:"vertical",lineHeight:1.7,display:"block"}}
        />
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
          <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>The more detail you give, the richer the output. ⌘+Enter to submit.</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={onCancel} style={{...css.ghost}}>Cancel</button>
            <button onClick={analyze} disabled={!input.trim()||busy}
              style={{padding:"8px 18px",borderRadius:8,border:"none",cursor:input.trim()&&!busy?"pointer":"default",background:input.trim()&&!busy?"var(--color-text-primary)":"var(--color-background-secondary)",color:input.trim()&&!busy?"var(--color-background-primary)":"var(--color-text-tertiary)",fontSize:13,fontWeight:500}}>
              {busy?"Analyzing…":"Analyze →"}
            </button>
          </div>
        </div>
      </div>

      {!proposals&&!busy&&(
        <div>
          <div style={{fontSize:12,color:"var(--color-text-tertiary)",marginBottom:8}}>Examples of what you can capture:</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {examples.map((ex,i)=>(
              <button key={i} onClick={()=>setInput(ex)}
                style={{fontSize:12,padding:"8px 12px",border:"0.5px solid var(--color-border-secondary)",borderRadius:8,background:"none",color:"var(--color-text-secondary)",cursor:"pointer",textAlign:"left",lineHeight:1.5}}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {busy&&(
        <div style={{textAlign:"center",padding:"3rem",color:"var(--color-text-secondary)",fontSize:13}}>
          <div style={{fontSize:22,marginBottom:12}}>🧠</div>
          Analyzing and structuring your experience…
        </div>
      )}

      {err&&<div style={{fontSize:13,color:"#b91c1c",padding:"10px 14px",background:"#fee2e2",borderRadius:8,marginBottom:"1rem"}}>{err}</div>}

      {proposals&&(
        <div>
          <div style={{background:"var(--color-background-secondary)",borderRadius:8,padding:"10px 14px",marginBottom:"1.25rem",fontSize:13,color:"var(--color-text-primary)",lineHeight:1.6,borderLeft:"3px solid #3b82f6"}}>
            {proposals.analysis}
          </div>

          <div style={{fontSize:11,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"0.75rem"}}>
            Proposed additions — review and accept or discard
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:"1.5rem"}}>
            {proposals.items.map((item,i)=>{
              const tc = typeColors[item.type]||typeColors.soar;
              const isOn = accepted[i];
              const expMatch = item.type==="experience_bullet" ? expData.find(e=>e.id===item.exp_id) : null;
              return (
                <div key={i} style={{border:`1.5px solid ${isOn?tc.color+"55":"var(--color-border-tertiary)"}`,borderRadius:10,padding:"1rem 1.25rem",background:isOn?"var(--color-background-primary)":"var(--color-background-secondary)",opacity:isOn?1:0.55,transition:"all 0.15s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:tc.bg,color:tc.color,fontWeight:600}}>{tc.label}</span>
                      <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>{item.label}</span>
                    </div>
                    <button onClick={()=>toggle(i)} style={{...css.ghost,fontSize:11,padding:"3px 10px",color:isOn?"#b91c1c":"#065f46",borderColor:isOn?"#fca5a5":"#6ee7b7"}}>
                      {isOn?"Discard":"Accept"}
                    </button>
                  </div>

                  {item.type==="soar"&&item.data&&(
                    <div style={{fontSize:12,color:"var(--color-text-secondary)",lineHeight:1.65}}>
                      {item.data.situation&&<div style={{marginBottom:4}}><strong>Situation:</strong> {item.data.situation}</div>}
                      {item.data.action&&<div style={{marginBottom:4}}><strong>Action:</strong> {item.data.action}</div>}
                      {item.data.result&&<div style={{marginBottom:4}}><strong>Result:</strong> {item.data.result}</div>}
                      {item.data.impact&&<div style={{marginBottom:4}}><strong>Impact:</strong> {item.data.impact}</div>}
                      {item.data.skills?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>{item.data.skills.map(s=><Tag key={s} label={s} variant="skill"/>)}</div>}
                    </div>
                  )}

                  {item.type==="experience_bullet"&&item.data&&(
                    <div style={{fontSize:12,color:"var(--color-text-secondary)",lineHeight:1.65}}>
                      {expMatch&&<div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:6}}>Adding to: {expMatch.role} · {expMatch.org}</div>}
                      {(item.data.bullets||[]).map((b,bi)=>(
                        <div key={bi} style={{display:"flex",gap:8,marginBottom:4,alignItems:"flex-start"}}>
                          <span style={{color:"#10b981",fontWeight:700,flexShrink:0,fontSize:11,marginTop:1}}>+</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.type==="award"&&item.data&&(
                    <div style={{fontSize:12,color:"var(--color-text-secondary)",lineHeight:1.65}}>
                      <div><strong>{item.data.award}</strong> · {item.data.org} · {item.data.year}</div>
                      {item.data.narrative&&<div style={{marginTop:4}}>{item.data.narrative}</div>}
                      <div style={{fontSize:11,color:"#92400e",marginTop:6,padding:"4px 8px",background:"#fef3c7",borderRadius:4}}>Awards are saved as a note — edit the Awards section to add manually.</div>
                    </div>
                  )}

                  {item.type==="education"&&item.data&&(
                    <div style={{fontSize:12,color:"var(--color-text-secondary)",lineHeight:1.65}}>
                      <div><strong>{item.data.cred}</strong> · {item.data.org} {item.data.year?"("+item.data.year+")":""}</div>
                      {item.data.note&&<div style={{marginTop:4}}>{item.data.note}</div>}
                      <div style={{fontSize:11,color:"#4c1d95",marginTop:6,padding:"4px 8px",background:"#ede9fe",borderRadius:4}}>Education is saved as a note — update your credentials in Profile.</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={saveAll}
              disabled={!Object.values(accepted).some(Boolean)}
              style={{padding:"10px 22px",borderRadius:8,border:"none",cursor:Object.values(accepted).some(Boolean)?"pointer":"default",background:Object.values(accepted).some(Boolean)?"var(--color-text-primary)":"var(--color-background-secondary)",color:Object.values(accepted).some(Boolean)?"var(--color-background-primary)":"var(--color-text-tertiary)",fontSize:14,fontWeight:500}}>
              Save accepted ({Object.values(accepted).filter(Boolean).length})
            </button>
            <button onClick={()=>{setProposals(null);setAccepted({});}} style={{...css.ghost}}>← Try again</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HOME VIEW ────────────────────────────────────────────
function HomeView({stories,experience,onStoryClick}) {
  const exp = experience || EXPERIENCE_DEFAULT;
  const [expandedRole,setExpandedRole]=useState(null);

  function linkedStories(expItem) {
    return stories.filter(s=>isRelatedOrg(s.employer,expItem.org));
  }
  function roleAwards(expItem) {
    const {startYear,endYear}=parseDates(expItem.dates);
    return AWARDS_DATA.filter(a=>{
      const yr=typeof a.year==="number"?a.year:null;
      if(!yr)return false;
      const inPeriod=yr>=startYear&&yr<=(endYear||2026);
      const orgMatch=isRelatedOrg(a.org,expItem.org)||isRelatedOrg(expItem.org,a.org);
      return inPeriod&&orgMatch;
    });
  }
  return (
    <div style={{paddingTop:"1.5rem",maxWidth:760}}>
      <div style={{marginBottom:"2rem",paddingBottom:"1.5rem",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
        <div style={{fontSize:22,fontWeight:600,color:"var(--color-text-primary)",letterSpacing:"-0.02em",marginBottom:3}}>{ADAM.name}</div>
        <div style={{fontSize:14,color:"#1d4ed8",fontWeight:500,marginBottom:8}}>{ADAM.headline}</div>
        <div style={{fontSize:13,color:"var(--color-text-secondary)",lineHeight:1.75,marginBottom:12}}>{ADAM.narrative}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{ADAM.topCompetencies.map(c=><Tag key={c} label={c}/>)}</div>
      </div>

      <div style={{marginBottom:"2rem"}}>
        <div style={{fontSize:11,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"1.25rem"}}>Work Experience</div>
        <div style={{display:"flex",flexDirection:"column"}}>
          {exp.map((exp,i)=>{
            const linked=linkedStories(exp);
            const awards=roleAwards(exp);
            const isOpen=expandedRole===exp.role;
            return (
              <div key={exp.role+exp.dates} style={{display:"flex",gap:0}}>
                <div style={{width:28,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{width:9,height:9,borderRadius:"50%",background:"#1d4ed8",border:"2px solid var(--color-background-primary)",boxShadow:"0 0 0 1.5px #1d4ed8",marginTop:19,flexShrink:0}}/>
                  {i<exp.length&&<div style={{width:1,flex:1,minHeight:8,background:"var(--color-border-tertiary)",marginTop:3}}/>}
                </div>
                <div style={{flex:1,paddingLeft:14,paddingBottom:"1.5rem"}}>
                  <div onClick={()=>setExpandedRole(isOpen?null:exp.role)} style={{cursor:"pointer"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                      <div>
                        <div style={{fontSize:14,fontWeight:600,color:"var(--color-text-primary)",lineHeight:1.4,marginBottom:2}}>{exp.role}</div>
                        <div style={{fontSize:13,color:"#1d4ed8",marginBottom:2}}>{exp.org}</div>
                        <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{exp.dates}</div>
                      </div>
                      <span style={{fontSize:10,color:"var(--color-text-tertiary)",flexShrink:0,marginTop:3}}>{isOpen?"▲":"▼"}</span>
                    </div>
                  </div>
                  {isOpen&&(
                    <div style={{marginTop:12,paddingTop:12,borderTop:"0.5px solid var(--color-border-tertiary)"}}>
                      <div style={{marginBottom:"1rem"}}>
                        <div style={{fontSize:10,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Key Achievements</div>
                        {exp.bullets.map((b,bi)=>(
                          <div key={bi} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
                            <span style={{color:"#10b981",fontWeight:700,flexShrink:0,fontSize:11,marginTop:1}}>✓</span>
                            <span style={{fontSize:12,color:"var(--color-text-secondary)",lineHeight:1.65}}>{b}</span>
                          </div>
                        ))}
                      </div>
                      {linked.length>0&&(
                        <div style={{marginBottom:"0.875rem"}}>
                          <div style={{fontSize:10,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:7}}>Stories ({linked.length})</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                            {linked.map(s=>{const t=typeOf(s.type);return(
                              <button key={s.id} onClick={()=>onStoryClick(s)} style={{fontSize:11,padding:"3px 10px",borderRadius:20,border:"none",background:t.bg,color:t.color,cursor:"pointer",fontWeight:500,lineHeight:1.5}}>
                                {s.title.length>44?s.title.substring(0,42)+"…":s.title}
                              </button>
                            );})}
                          </div>
                        </div>
                      )}
                      {awards.length>0&&(
                        <div>
                          <div style={{fontSize:10,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:7}}>Awards</div>
                          {awards.map((a,ai)=>(
                            <div key={ai} style={{display:"flex",gap:7,marginBottom:4,alignItems:"flex-start"}}>
                              <span style={{color:"#f59e0b",flexShrink:0,fontSize:12}}>★</span>
                              <span style={{fontSize:12,color:"var(--color-text-secondary)",lineHeight:1.5}}>{a.award} <span style={{color:"var(--color-text-tertiary)"}}>· {a.year}</span></span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{paddingTop:"1.25rem",borderTop:"0.5px solid var(--color-border-tertiary)"}}>
        <div style={{fontSize:11,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"0.75rem"}}>Education & Credentials</div>
        {EDUCATION_DATA.map((e,i)=>(
          <div key={i} style={{marginBottom:"0.875rem"}}>
            <div style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)",marginBottom:2}}>{e.cred}</div>
            <div style={{fontSize:12,color:"#1d4ed8",marginBottom:2}}>{e.org}{e.year?` · ${e.year}`:""}</div>
            <div style={{fontSize:12,color:"var(--color-text-secondary)",lineHeight:1.65}}>{e.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ASK VIEW ─────────────────────────────────────────────
const INTERVIEW_RX=/^(tell me about|describe a time|give me an example|how have you|what('s| is) a (time|situation|example)|walk me through|can you (tell|describe|give)|share an example|talk (me )?through)/i;

function AskView({stories}) {
  const [q,setQ]=useState("");
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState(null);
  const [mode,setMode]=useState(null);
  const [copied,setCopied]=useState(false);
  const [err,setErr]=useState("");
  const [drill,setDrill]=useState(null);
  const examples=["Preparing for a Head of Data & Analytics interview at a financial services firm","What stories best demonstrate leadership under pressure?","Writing a cover letter for a Chief Data Officer role","What are my strongest examples of driving organizational change?","What experiences show ability to influence without authority?","I'm writing a book chapter on KPI development"];

  async function ask(){
    if(!q.trim()||busy)return;
    const isInterviewQ=INTERVIEW_RX.test(q.trim());
    setBusy(true);setErr("");setResult(null);setDrill(null);setCopied(false);
    setMode(isInterviewQ?"interview":"library");
    try{
      if(isInterviewQ){
        const ctx=stories.map(s=>`STORY: ${s.title} (${s.employer})\n${s.fullStory||[s.situation,s.obstacle,s.action,s.result].filter(Boolean).join(" ")}`).join("\n\n---\n\n");
        const ans=await callClaude(
          `You are Adam Waldman, a senior finance and analytics executive. Answer interview questions in first person, naturally and confidently. Be specific — name the initiative, the obstacle, the outcome. 3 to 4 paragraphs. No bullets. No headers. No hedging. Sound like a human being who has done real things. When answering questions about whether Adam has done something, interpret the question generously. Contributing a chapter to a book counts as writing for that book. Co-authoring counts. Speaking on a topic counts as expertise. Don't refuse credit for things the stories clearly demonstrate. If a story partially matches the question, surface it and explain the nature of his involvement rather than answering "no."`,
          `INTERVIEW QUESTION: "${q}"\n\nSTORIES TO DRAW FROM:\n${ctx}`,
          600
        );
        setResult({prose:ans.trim()});
      } else {
        const summaries=stories.map(s=>({id:s.id,title:s.title,employer:s.employer,type:s.type,skills:s.skills||s.themes||[],situation:(s.situation||"").substring(0,120),action:(s.action||"").substring(0,120),result:(s.result||"").substring(0,80),impact:s.impact}));
        const ans=await callClaude(
          `You help Adam Waldman find the most relevant stories from his experience library. Return ONLY valid JSON.`,
          `His question: "${q}"\n\nLibrary: ${JSON.stringify(summaries)}\n\nReturn JSON: {"headline":"one sentence","stories":[{"id":N,"relevance":"2-3 sentences","angle":"1 sentence"}],"advice":"2-3 sentences"}`,
          1000
        );
        setResult(parseJSON(ans));
      }
    }catch(e){setErr("Something went wrong — try rephrasing.");}
    setBusy(false);
  }

  function copyAnswer(){if(result?.prose){navigator.clipboard?.writeText(result.prose);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
  if(drill)return <DetailView story={drill} onBack={()=>setDrill(null)}/>;
  return (
    <div style={{padding:"1.5rem 0"}}>
      <div style={{marginBottom:"1.5rem"}}>
        <div style={{fontSize:20,fontWeight:500,color:"var(--color-text-primary)",marginBottom:4}}>Ask your library</div>
        <div style={{fontSize:13,color:"var(--color-text-secondary)"}}>Describe what you're preparing for — or ask a direct interview question to get a composed answer.</div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <textarea value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ask();}}} placeholder="e.g. What stories show I can lead through uncertainty? or Tell me about a time you led through resistance." style={{flex:1,fontSize:13,padding:"9px 12px",border:"0.5px solid var(--color-border-tertiary)",borderRadius:8,background:"var(--color-background-secondary)",color:"var(--color-text-primary)",fontFamily:"var(--font-sans)",resize:"none",lineHeight:1.6,minHeight:66}}/>
        <button onClick={ask} disabled={busy||!q.trim()} style={{padding:"9px 16px",borderRadius:8,cursor:q.trim()&&!busy?"pointer":"default",background:q.trim()&&!busy?"var(--color-text-primary)":"var(--color-background-secondary)",color:q.trim()&&!busy?"var(--color-background-primary)":"var(--color-text-tertiary)",border:"none",fontSize:13,fontWeight:500,alignSelf:"flex-end",whiteSpace:"nowrap"}}>
          {busy?"Thinking…":"Ask →"}
        </button>
      </div>
      {!result&&!busy&&<div><div style={{fontSize:12,color:"var(--color-text-tertiary)",marginBottom:8}}>Try asking:</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{examples.map((ex,i)=><button key={i} onClick={()=>setQ(ex)} style={{fontSize:12,padding:"5px 11px",border:"0.5px solid var(--color-border-secondary)",borderRadius:20,background:"none",color:"var(--color-text-secondary)",cursor:"pointer",textAlign:"left"}}>{ex}</button>)}</div></div>}
      {busy&&<div style={{textAlign:"center",padding:"2rem",color:"var(--color-text-secondary)",fontSize:13}}>{mode==="interview"?"Composing Adam's answer…":"Searching your experiences…"}</div>}
      {err&&<div style={{fontSize:13,color:"#b91c1c",padding:"10px 14px",background:"#fee2e2",borderRadius:8}}>{err}</div>}
      {result&&mode==="interview"&&result.prose&&(
        <div>
          <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
            <span style={{background:"#ede9fe",color:"#4c1d95",fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:10}}>Interview answer</span>
          </div>
          <div style={{background:"var(--color-background-secondary)",borderRadius:10,padding:"1.25rem 1.5rem",marginBottom:"1rem",borderLeft:"3px solid #1d4ed8"}}>
            <div style={{fontSize:14,color:"var(--color-text-primary)",lineHeight:1.85,whiteSpace:"pre-wrap"}}>{result.prose}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={ask} style={{...css.ghost}}>↺ Regenerate</button>
            <button onClick={copyAnswer} style={{...css.ghost,color:copied?"#065f46":"var(--color-text-secondary)",borderColor:copied?"#10b981":"var(--color-border-secondary)"}}>{copied?"✓ Copied":"Copy answer"}</button>
          </div>
        </div>
      )}
      {result&&mode==="library"&&(
        <div>
          <div style={{background:"var(--color-background-secondary)",borderRadius:8,padding:"12px 16px",marginBottom:"1.25rem",fontSize:14,color:"var(--color-text-primary)",lineHeight:1.6,borderLeft:"3px solid #3b82f6"}}>{result.headline}</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:"1.25rem"}}>
            {result.stories?.map((rs,idx)=>{
              const s=stories.find(x=>x.id===rs.id);if(!s)return null;
              const t=typeOf(s.type);
              return(
                <div key={rs.id} style={{...css.card,borderLeft:`3px solid ${t.dot}`,cursor:"default"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                    <div style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>{idx+1}. {s.title}</div>
                    <Pill typeId={s.type}/>
                  </div>
                  <div style={{fontSize:12,color:"var(--color-text-tertiary)",marginBottom:7}}>{s.employer}</div>
                  <div style={{fontSize:13,color:"var(--color-text-secondary)",lineHeight:1.6,marginBottom:8}}>{rs.relevance}</div>
                  {rs.angle&&<div style={{fontSize:12,fontWeight:500,color:t.color,padding:"5px 10px",background:t.bg,borderRadius:6,marginBottom:10}}>Angle: {rs.angle}</div>}
                  <button onClick={()=>setDrill(s)} style={{...css.ghost,color:t.color,border:`0.5px solid ${t.dot}`}}>Open story →</button>
                </div>
              );
            })}
          </div>
          {result.advice&&<div style={{borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:"1rem"}}><div style={{fontSize:11,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Strategic advice</div><div style={{fontSize:13,color:"var(--color-text-secondary)",lineHeight:1.7}}>{result.advice}</div></div>}
        </div>
      )}
    </div>
  );
}

// ─── INTERVIEW VIEW ───────────────────────────────────────
function InterviewView({stories}) {
  const [q,setQ]=useState("");
  const [busy,setBusy]=useState(false);
  const [answer,setAnswer]=useState(null);
  const [copied,setCopied]=useState(false);
  const [err,setErr]=useState("");
  const examples=["Tell me about a time you led through significant resistance.","Describe a situation where you had to influence without authority.","Give me an example of how you've used data to change an organization's direction.","Tell me about a time you had to deliver difficult news to senior leadership.","How have you handled a politically toxic work environment?","Walk me through how you built something meaningful from scratch.","Tell me about your most significant career failure and what you learned.","Describe a time you had to navigate a major organizational change."];

  async function ask(question) {
    const prompt=question||q;
    if(!prompt.trim()||busy)return;
    setBusy(true);setErr("");setAnswer(null);setCopied(false);
    try{
      const ctx=stories.map(s=>`STORY: ${s.title} (${s.employer})\n${s.fullStory||[s.situation,s.obstacle,s.action,s.result].filter(Boolean).join(" ")}`).join("\n\n---\n\n");
      const ans=await callClaude(
        `You are Adam Waldman, a senior finance and analytics executive with 15+ years of experience building insight-driven organizations. You are in a job interview. Draw from the specific stories in your library to compose your answer. Write in first person, naturally and confidently, as you would speak in a real interview room. Be specific — name the initiative, the obstacle, what you did, what happened. 3 to 4 paragraphs. No bullets. No headers. No hedging. Sound like a human being who has done real things. When answering questions about whether Adam has done something, interpret the question generously. Contributing a chapter to a book counts as writing for that book. Co-authoring counts. Speaking on a topic counts as expertise. Don't refuse credit for things the stories clearly demonstrate. If a story partially matches the question, surface it and explain the nature of his involvement rather than answering "no."`,
        `INTERVIEW QUESTION: "${prompt}"\n\nYOUR STORIES TO DRAW FROM:\n${ctx}`,
        600
      );
      setAnswer(ans.trim());
    }catch(e){setErr("Something went wrong — please try again.");}
    setBusy(false);
  }

  function copy(){if(answer){navigator.clipboard?.writeText(answer);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
  return (
    <div style={{padding:"1.5rem 0",maxWidth:680}}>
      <div style={{marginBottom:"1.5rem"}}>
        <div style={{fontSize:20,fontWeight:500,color:"var(--color-text-primary)",marginBottom:4}}>Interview Adam</div>
        <div style={{fontSize:13,color:"var(--color-text-secondary)"}}>Ask any interview question and get one composed answer in Adam's voice, drawn from his SOAR library.</div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <textarea value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ask();}}} placeholder="e.g. Tell me about a time you led through resistance…" style={{flex:1,fontSize:13,padding:"9px 12px",border:"0.5px solid var(--color-border-tertiary)",borderRadius:8,background:"var(--color-background-secondary)",color:"var(--color-text-primary)",fontFamily:"var(--font-sans)",resize:"none",lineHeight:1.6,minHeight:66}}/>
        <button onClick={()=>ask()} disabled={busy||!q.trim()} style={{padding:"9px 16px",borderRadius:8,cursor:q.trim()&&!busy?"pointer":"default",background:q.trim()&&!busy?"var(--color-text-primary)":"var(--color-background-secondary)",color:q.trim()&&!busy?"var(--color-background-primary)":"var(--color-text-tertiary)",border:"none",fontSize:13,fontWeight:500,alignSelf:"flex-end",whiteSpace:"nowrap"}}>
          {busy?"Thinking…":"Ask →"}
        </button>
      </div>
      {!answer&&!busy&&<div><div style={{fontSize:12,color:"var(--color-text-tertiary)",marginBottom:8}}>Try asking:</div><div style={{display:"flex",flexDirection:"column",gap:5}}>{examples.map((ex,i)=><button key={i} onClick={()=>{setQ(ex);ask(ex);}} style={{fontSize:12,padding:"8px 12px",border:"0.5px solid var(--color-border-secondary)",borderRadius:8,background:"none",color:"var(--color-text-secondary)",cursor:"pointer",textAlign:"left",lineHeight:1.5}}>{ex}</button>)}</div></div>}
      {busy&&<div style={{textAlign:"center",padding:"2.5rem",color:"var(--color-text-secondary)",fontSize:13}}><div style={{fontSize:20,marginBottom:10}}>🎤</div>Composing Adam's answer…</div>}
      {err&&<div style={{fontSize:13,color:"#b91c1c",padding:"10px 14px",background:"#fee2e2",borderRadius:8}}>{err}</div>}
      {answer&&(
        <div>
          <div style={{background:"var(--color-background-secondary)",borderRadius:10,padding:"1.5rem",marginBottom:"1rem",borderLeft:"3px solid #1d4ed8"}}>
            <div style={{fontSize:14,color:"var(--color-text-primary)",lineHeight:1.9,whiteSpace:"pre-wrap"}}>{answer}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>ask()} style={{...css.ghost}}>↺ Regenerate</button>
            <button onClick={copy} style={{...css.ghost,color:copied?"#065f46":"var(--color-text-secondary)",borderColor:copied?"#10b981":"var(--color-border-secondary)"}}>{copied?"✓ Copied":"Copy answer"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EXPERIENCE EDIT FORM ─────────────────────────────────
function ExperienceEditForm({entry, onSave, onCancel}) {
  const [form, setForm] = useState(entry);
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));
  return(
    <div style={{paddingTop:"1.5rem",maxWidth:700}}>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:"1.5rem"}}>
        <button onClick={onCancel} style={{...css.ghost}}>← Cancel</button>
        <div style={{fontSize:16,fontWeight:500,color:"var(--color-text-primary)"}}>Edit Role</div>
      </div>
      {[["Role Title","role"],["Organisation","org"],["Dates","dates"]].map(([lbl,key])=>(
        <div key={key} style={{marginBottom:"1rem"}}>
          <label style={css.lbl}>{lbl}</label>
          <input value={form[key]||""} onChange={e=>setF(key,e.target.value)} style={css.inp}/>
        </div>
      ))}
      {[["Scope","scope"],["Mandate","mandate"]].map(([lbl,key])=>(
        <div key={key} style={{marginBottom:"1rem"}}>
          <label style={css.lbl}>{lbl}</label>
          <textarea value={form[key]||""} onChange={e=>setF(key,e.target.value)} style={{...css.inp,minHeight:66,resize:"vertical"}}/>
        </div>
      ))}
      <div style={{marginBottom:"1rem"}}>
        <label style={css.lbl}>Key Achievements — one per line (used in resumes & CV)</label>
        <textarea
          defaultValue={(form.bullets||[]).join("\n")}
          onChange={e=>setF("bullets",e.target.value.split("\n").map(l=>l.trim()).filter(Boolean))}
          style={{...css.inp,minHeight:160,resize:"vertical",fontFamily:"var(--font-sans)",lineHeight:1.7}}/>
      </div>
      <div style={{marginBottom:"1rem"}}>
        <label style={css.lbl}>Key Responsibilities — one per line (shown in detail view)</label>
        <textarea
          defaultValue={(form.responsibilities||[]).join("\n")}
          onChange={e=>setF("responsibilities",e.target.value.split("\n").map(l=>l.trim()).filter(Boolean))}
          style={{...css.inp,minHeight:120,resize:"vertical",fontFamily:"var(--font-sans)",lineHeight:1.7}}/>
      </div>
      <div style={{marginBottom:"1.5rem"}}>
        <label style={css.lbl}>Full Narrative (optional)</label>
        <textarea value={form.fullNarrative||""} onChange={e=>setF("fullNarrative",e.target.value)} style={{...css.inp,minHeight:100,resize:"vertical"}}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>onSave(form)} style={{padding:"8px 18px",borderRadius:6,border:"none",cursor:"pointer",background:"var(--color-text-primary)",color:"var(--color-background-primary)",fontSize:13,fontWeight:500}}>Save changes</button>
        <button onClick={onCancel} style={{...css.ghost}}>Cancel</button>
      </div>
    </div>
  );
}

// ─── EXPERIENCE VIEW ──────────────────────────────────────
function ExperienceView({experience,setExperience}) {
  const [sel,setSel]=useState(null);
  const [editing,setEditing]=useState(null); // holds the entry being edited
  const expData=experience||EXPERIENCE_DEFAULT;
  const entry=sel?expData.find(e=>e.id===sel):null;

  function saveEntry(updated){
    const next=expData.map(e=>e.id===updated.id?updated:e);
    setExperience(next);
    setEditing(null);
  }

  // ── Edit form ─────────────────────────────────────────
  if(editing){
    return <ExperienceEditForm entry={editing} onSave={saveEntry} onCancel={()=>setEditing(null)}/>;
  }

  // ── Detail view ───────────────────────────────────────
  if(entry)return(
    <div style={{paddingTop:"1.5rem",maxWidth:700}}>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:"1.5rem"}}>
        <button onClick={()=>setSel(null)} style={{...css.ghost}}>← Back</button>
        <button onClick={()=>setEditing(entry)} style={{...css.ghost}}>Edit</button>
      </div>
      <div style={{fontSize:11,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{entry.dates}</div>
      <div style={{fontSize:20,fontWeight:500,color:"var(--color-text-primary)",lineHeight:1.3,marginBottom:4}}>{entry.role}</div>
      <div style={{fontSize:14,color:"#1d4ed8",marginBottom:"1.5rem"}}>{entry.org}</div>
      {entry.scope&&<div style={{marginBottom:"1.25rem"}}><div style={{fontSize:11,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Scope</div><div style={{fontSize:13,color:"var(--color-text-secondary)",lineHeight:1.7}}>{entry.scope}</div></div>}
      {entry.mandate&&<div style={{marginBottom:"1.25rem"}}><div style={{fontSize:11,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Mandate</div><div style={{fontSize:13,color:"var(--color-text-secondary)",lineHeight:1.7}}>{entry.mandate}</div></div>}
      <div style={{marginBottom:"1.25rem"}}>
        <div style={{fontSize:11,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Key Achievements</div>
        {(entry.bullets||[]).map((b,i)=><div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}><span style={{color:"#10b981",fontWeight:700,flexShrink:0,marginTop:1}}>✓</span><span style={{fontSize:13,color:"var(--color-text-secondary)",lineHeight:1.6}}>{b}</span></div>)}
      </div>
      {entry.responsibilities?.length>0&&<div style={{marginBottom:"1.25rem"}}>
        <div style={{fontSize:11,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Key Responsibilities</div>
        {entry.responsibilities.map((r,i)=><div key={i} style={{display:"flex",gap:10,marginBottom:6,alignItems:"flex-start"}}><span style={{color:"#3b82f6",flexShrink:0,fontSize:11,marginTop:2}}>›</span><span style={{fontSize:13,color:"var(--color-text-secondary)",lineHeight:1.6}}>{r}</span></div>)}
      </div>}
      {entry.fullNarrative&&<div style={{marginBottom:"1rem",padding:"1rem",background:"var(--color-background-secondary)",borderRadius:8,borderLeft:"3px solid #1d4ed8"}}><div style={{fontSize:11,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Full Narrative</div><div style={{fontSize:13,color:"var(--color-text-secondary)",lineHeight:1.8}}>{entry.fullNarrative}</div></div>}
    </div>
  );

  // ── List view ─────────────────────────────────────────
  return(
    <div style={{paddingTop:"1.5rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"}}>
        <div>
          <div style={{fontSize:20,fontWeight:500,color:"var(--color-text-primary)",marginBottom:4}}>Work Experience</div>
          <div style={{fontSize:13,color:"var(--color-text-secondary)"}}>Click any role for full details and editing.</div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {expData.map(e=>(
          <div key={e.id||e.role} onClick={()=>setSel(e.id||e.role)} style={{...css.card,borderLeft:"3px solid #1d4ed8",cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <div style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)",flex:1,lineHeight:1.4}}>{e.role}</div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0,marginLeft:8}}>
                <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{e.dates}</div>
                <button onClick={ev=>{ev.stopPropagation();setEditing(e);}} style={{...css.ghost,padding:"3px 8px",fontSize:11}}>Edit</button>
              </div>
            </div>
            <div style={{fontSize:13,color:"#1d4ed8",marginBottom:4}}>{e.org}</div>
            {e.mandate&&<div style={{fontSize:12,color:"var(--color-text-secondary)",lineHeight:1.5}}>{e.mandate}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AWARDS VIEW ──────────────────────────────────────────
function AwardsView() {
  return(
    <div style={{paddingTop:"1.5rem"}}>
      <div style={{fontSize:20,fontWeight:500,color:"var(--color-text-primary)",marginBottom:4}}>Awards & Recognition</div>
      <div style={{fontSize:13,color:"var(--color-text-secondary)",marginBottom:"1.5rem"}}>{AWARDS_DATA.length} recognitions across your career.</div>
      <div>
        {AWARDS_DATA.map((a,i)=>(
          <div key={i} style={{display:"flex",gap:16,paddingBottom:"1.25rem",marginBottom:"1.25rem",borderBottom:i<AWARDS_DATA.length-1?"0.5px solid var(--color-border-tertiary)":"none"}}>
            <div style={{flexShrink:0,width:64,textAlign:"right"}}>
              <div style={{fontSize:12,fontWeight:600,color:"var(--color-text-tertiary)"}}>{a.year}</div>
              <div style={{fontSize:10,color:"var(--color-text-tertiary)",marginTop:2}}>{a.org}</div>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)",marginBottom:5}}><span style={{color:"#f59e0b",marginRight:6}}>★</span>{a.award}</div>
              <div style={{fontSize:12,color:"var(--color-text-secondary)",lineHeight:1.7}}>{a.narrative}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PIPELINE COMPONENTS (v4) ─────────────────────────────
const STEPS = [
  { id:"analyze", label:"Analyze JD",   desc:"Extracting requirements…" },
  { id:"score",   label:"Score (CPS)",  desc:"Scoring your experience…" },
  { id:"draft",   label:"Draft Resume", desc:"Maximizing CPS content…"  },
  { id:"letter",  label:"Cover Letter", desc:"Addressing key gaps…"     },
];
const STEP_IDX = { idle:-1, analyze:0, score:1, draft:2, letter:3, done:4 };

function PipelineProgress({step}) {
  const idx=STEP_IDX[step]??-1;
  const running=["analyze","score","draft","letter"].includes(step);
  const done=step==="done";
  return(
    <div style={{display:"flex",alignItems:"flex-start",gap:0,padding:"0.5rem 0"}}>
      {STEPS.map((s,i)=>{
        const isDone=i<idx||done;
        const isActive=i===idx&&running;
        return(
          <div key={s.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
            {i>0&&<div style={{position:"absolute",left:"-50%",top:12,width:"100%",height:2,background:isDone?"#639922":"var(--color-border-tertiary)",zIndex:0}}/>}
            <div style={{width:24,height:24,borderRadius:"50%",zIndex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:500,border:isActive?"2px solid #185FA5":"2px solid transparent",background:isDone?"#639922":isActive?"#185FA5":"var(--color-background-secondary)",color:isDone||isActive?"#fff":"var(--color-text-tertiary)"}}>
              {isDone?"✓":i+1}
            </div>
            <div style={{fontSize:11,fontWeight:isActive?500:400,color:isDone?"#639922":isActive?"#185FA5":"var(--color-text-tertiary)",marginTop:4,textAlign:"center"}}>{s.label}</div>
            {isActive&&<div style={{fontSize:10,color:"var(--color-text-tertiary)",textAlign:"center",marginTop:2}}>{s.desc}</div>}
          </div>
        );
      })}
    </div>
  );
}

function CPSScorecard({scores,onAddEvidence}) {
  const avg=scores?Math.round(scores.reduce((a,s)=>a+s.score,0)/scores.length):0;
  const avgColor=avg>=75?"#639922":avg>=60?"#BA7517":"#A32D2D";
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8,marginBottom:"1rem"}}>
        {[{label:"Overall CPS",val:avg,color:avgColor},{label:"Strong",val:scores?.filter(s=>s.score>=80).length||0,color:"#639922"},{label:"Partial",val:scores?.filter(s=>s.score>=60&&s.score<80).length||0,color:"#BA7517"},{label:"Gaps",val:scores?.filter(s=>s.score<60).length||0,color:"#A32D2D"}].map(c=>(
          <div key={c.label} style={{background:"var(--color-background-secondary)",borderRadius:8,padding:"0.75rem"}}>
            <div style={{fontSize:20,fontWeight:500,color:c.color}}>{c.val}</div>
            <div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:1}}>{c.label}</div>
          </div>
        ))}
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,tableLayout:"fixed"}}>
        <colgroup><col style={{width:"22%"}}/><col style={{width:"8%"}}/><col style={{width:"35%"}}/><col style={{width:"35%"}}/></colgroup>
        <thead>
          <tr>{["Skill","CPS","Resume Evidence","How to Improve"].map(h=><th key={h} style={{padding:"7px 8px",textAlign:"left",borderBottom:"0.5px solid var(--color-border-tertiary)",fontSize:10,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em",color:"var(--color-text-tertiary)"}}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {scores?.map((row,i)=>{
            const t=tierStyle(row.score);
            return(
              <tr key={i} style={{borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
                <td style={{padding:"9px 8px",verticalAlign:"top"}}>
                  <div style={{fontWeight:500,color:"var(--color-text-primary)",marginBottom:3,fontSize:12}}>{row.skill}</div>
                  <span style={{fontSize:10,padding:"2px 7px",borderRadius:4,background:t.bg,color:t.color,fontWeight:500}}>{t.label}</span>
                  <div style={{marginTop:5,background:"var(--color-background-secondary)",borderRadius:3,height:4}}><div style={{height:4,borderRadius:3,width:`${row.score}%`,background:t.bar}}/></div>
                </td>
                <td style={{padding:"9px 8px",textAlign:"center",verticalAlign:"middle"}}><span style={{fontSize:17,fontWeight:500,color:t.bar}}>{row.score}</span></td>
                <td style={{padding:"9px 8px",verticalAlign:"top"}}><p style={{margin:0,color:"var(--color-text-secondary)",fontStyle:"italic",borderLeft:"2px solid var(--color-border-tertiary)",paddingLeft:7,lineHeight:1.5}}>{row.evidence}</p></td>
                <td style={{padding:"9px 8px",verticalAlign:"top"}}>
                  <p style={{margin:0,color:"var(--color-text-primary)",lineHeight:1.5,marginBottom:row.score<75?6:0}}>{row.improve}</p>
                  {row.score<75&&<button onClick={()=>onAddEvidence(row)} style={{...S.btn,fontSize:11,padding:"3px 9px",color:"var(--color-text-info)",borderColor:"var(--color-border-info)"}}>+ Add evidence ↗</button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AddEvidencePanel({targetGap,onSave,onCancel}) {
  const [desc,setDesc]=useState("");
  const [loading,setLoading]=useState(false);
  const [structured,setStructured]=useState(null);
  const [err,setErr]=useState(null);

  async function structure(){
    if(!desc.trim())return;
    setLoading(true);setErr(null);
    try{
      const text=await callClaude(
        `Convert a candidate's experience into a structured SOAR story. Return ONLY valid JSON: {"title":"string","type":"insight","employer":"string","situation":"string","action":"string","result":"string","skills":["string"]}. No markdown.`,
        `Gap to address: ${targetGap?.skill}\nImprovement needed: ${targetGap?.improve}\nCandidate description:\n${desc}`
      );
      const parsed=parseJSON(text);
      if(parsed)setStructured(parsed);
      else setErr("Could not structure story — please try again.");
    }catch(e){setErr(e.message);}
    setLoading(false);
  }

  if(structured)return(
    <div>
      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:8}}>AI-structured — review before saving:</div>
      <div style={{background:"var(--color-background-secondary)",borderRadius:8,padding:"1rem",marginBottom:"1rem",fontSize:12}}>
        <div style={{fontWeight:500,marginBottom:6,fontSize:13}}>{structured.title}</div>
        <div style={{marginBottom:4}}><strong>Situation:</strong> {structured.situation}</div>
        <div style={{marginBottom:4}}><strong>Action:</strong> {structured.action}</div>
        <div style={{marginBottom:8}}><strong>Result:</strong> {structured.result}</div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{structured.skills?.map(s=><span key={s} style={S.tag}>{s}</span>)}</div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>onSave(normalizeStory(structured))} style={S.primary}>Save & Re-score</button>
        <button onClick={()=>setStructured(null)} style={S.btn}>Edit</button>
        <button onClick={onCancel} style={S.btn}>Cancel</button>
      </div>
    </div>
  );

  return(
    <div>
      <div style={{fontSize:13,fontWeight:500,marginBottom:3}}>Add evidence for: <em>{targetGap?.skill}</em></div>
      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:"0.75rem"}}>{targetGap?.improve}</div>
      <label style={S.label}>Describe the experience or achievement</label>
      <textarea value={desc} onChange={e=>setDesc(e.target.value)} style={{...S.textarea,minHeight:110,marginBottom:"0.75rem"}} placeholder="Be specific — name the organizations, metrics, outcomes, and context…"/>
      {err&&<div style={{fontSize:12,color:"#A32D2D",marginBottom:8}}>{err}</div>}
      <div style={{display:"flex",gap:8}}>
        <button onClick={structure} disabled={!desc.trim()||loading} style={{...S.primary,opacity:!desc.trim()||loading?0.5:1}}>{loading?"Structuring…":"Structure as SOAR ↗"}</button>
        <button onClick={onCancel} style={S.btn}>Cancel</button>
      </div>
    </div>
  );
}

function ResumeOutput({content}) {
  return(
    <div style={{fontFamily:"Georgia,serif",fontSize:12.5,lineHeight:1.7,color:"var(--color-text-primary)"}}>
      <div style={{textAlign:"center",marginBottom:"1.25rem",paddingBottom:"1rem",borderBottom:"1px solid var(--color-border-secondary)"}}>
        <div style={{fontSize:20,fontWeight:700,letterSpacing:"0.04em"}}>{CANDIDATE.name}</div>
        <div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:4}}>{CANDIDATE.subtitle}</div>
        <div style={{fontSize:10,color:"var(--color-text-tertiary)",marginTop:3}}>{CANDIDATE.contact}</div>
      </div>
      <pre style={{whiteSpace:"pre-wrap",fontFamily:"Georgia,serif",fontSize:12.5,margin:0,lineHeight:1.7,color:"var(--color-text-primary)"}}>{content}</pre>
    </div>
  );
}

// ─── RTF UTILITIES (for resume download) ──────────────────
function escRTF(str) {
  if(!str)return'';
  let s=str.replace(/\\/g,'\\\\').replace(/\{/g,'\\{').replace(/\}/g,'\\}').replace(/[\u2013\u2014]/g,'\\endash ').replace(/[\u2018\u2019']/g,"\\'27").replace(/[\u201c\u201d"]/g,"\\'22").replace(/\u2022/g,'\\u8226?');
  let out='';
  for(const c of s){const code=c.charCodeAt(0);if(code<128)out+=c;else if(code<256)out+="\\'"+code.toString(16).padStart(2,'0');else out+='\\u'+code+'?';}
  return out;
}

function buildResumeRTF(resumeText, exp) {
  const expData = exp || EXPERIENCE_DEFAULT;
  const p='#1e3a5f',a='#2563eb';
  function h2c(hex){const h=(hex||'#000').replace('#','');return[parseInt(h.slice(0,2),16)||0,parseInt(h.slice(2,4),16)||0,parseInt(h.slice(4,6),16)||0];}
  const [pr,pg,pb]=h2c(p);const [ar,ag,ab]=h2c(a);
  const fontTbl='{\\fonttbl{\\f0\\fswiss\\fcharset0 Calibri;}}';
  const colorTbl='{\\colortbl ;\\red'+pr+'\\green'+pg+'\\blue'+pb+';\\red'+ar+'\\green'+ag+'\\blue'+ab+';\\red31\\green41\\blue55;\\red107\\green114\\blue128;}';
  function secHead(t){return'\\pard\\sb200\\sa40\\cf1\\f0\\fs17\\b\\caps '+escRTF(t)+'\\b0\\caps0\\par\n'+'\\pard\\sb0\\sa80\\brdrb\\brdrs\\brdrw10\\brdrcolor2 \\par\n';}
  let body='';
  body+='\\pard\\sb0\\sa50\\cf1\\f0\\fs44\\b '+escRTF(CANDIDATE.name)+'\\b0\\par\n';
  body+='\\pard\\sb0\\sa40\\cf3\\f0\\fs20 '+escRTF(CANDIDATE.subtitle)+'\\par\n';
  body+='\\pard\\sb0\\sa160\\cf4\\f0\\fs17 '+escRTF(CANDIDATE.contact)+'\\par\n';
  body+='\\pard\\sb0\\sa0\\brdrb\\brdrs\\brdrw20\\brdrcolor1 \\par\n';
  body+=secHead('Professional Experience');
  expData.forEach(exp=>{
    body+='\\pard\\sb140\\sa0\\tqr\\tx9360\\cf3\\f0\\fs20\\b '+escRTF(exp.role)+'\\b0\\tab\\cf4\\fs17 '+escRTF(exp.dates)+'\\par\n';
    body+='\\pard\\sb0\\sa50\\cf2\\f0\\fs17\\i '+escRTF(exp.org)+'\\i0\\par\n';
    exp.bullets.forEach(b=>{body+='\\pard\\fi-200\\li360\\sb0\\sa40\\cf3\\f0\\fs18 \\u8226?  '+escRTF(b)+'\\par\n';});
    body+='\\pard\\sa80\\par\n';
  });
  body+=secHead('Education & Credentials');
  EDUCATION_DATA.forEach(e=>{
    body+='\\pard\\sb100\\sa0\\tqr\\tx9360\\cf3\\f0\\fs20\\b '+escRTF(e.cred)+'\\b0\\tab\\cf4\\fs17 '+escRTF(e.year||'')+'\\par\n';
    body+='\\pard\\sb0\\sa24\\cf2\\f0\\fs17\\i '+escRTF(e.org)+'\\i0\\par\n';
    body+='\\pard\\fi360\\sb0\\sa60\\cf3\\f0\\fs17 '+escRTF(e.note)+'\\par\n';
  });
  body+=secHead('Awards & Recognition');
  AWARDS_DATA.forEach(a=>{
    body+='\\pard\\sb80\\sa0\\tqr\\tx9360\\cf1\\f0\\fs18\\b \\u9733? '+escRTF(a.award)+'\\b0\\tab\\cf4\\fs17 '+escRTF(String(a.year))+'\\par\n';
    body+='\\pard\\fi360\\sb0\\sa60\\cf3\\f0\\fs17 '+escRTF(a.narrative)+'\\par\n';
  });
  // Append AI-generated resume content
  if(resumeText){
    body+=secHead('Tailored Summary & Competencies');
    resumeText.split('\n').filter(l=>l.trim()).forEach(line=>{
      const isBullet=/^[\u2022\u00B7\-]\s/.test(line);
      if(isBullet)body+='\\pard\\fi-200\\li360\\sb0\\sa40\\cf3\\f0\\fs18 \\u8226?  '+escRTF(line.replace(/^[\u2022\u00B7\-\s]+/,''))+'\\par\n';
      else body+='\\pard\\sb0\\sa50\\cf3\\f0\\fs18 '+escRTF(line)+'\\par\n';
    });
  }
  return'{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1033\n'+fontTbl+'\n'+colorTbl+'\n\\paperw12240\\paperh15840\\margl1008\\margr1008\\margt1008\\margb1008\n'+body+'}';
}

// ─── FULL CV EXPORTER ─────────────────────────────────────
function FullCVExporter({stories,experience,onClose}) {
  const overlay={position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"};
  const box={background:"#ffffff",borderRadius:12,padding:"1.5rem",maxWidth:480,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.3)",color:"#111"};

  function download(){
    const rtf=buildResumeRTF(null,experience);
    downloadBlob(rtf,'adam_waldman_full_cv.rtf','application/rtf');
  }

  return(
    <div style={overlay} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={box}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem"}}>
          <div style={{fontSize:16,fontWeight:600,color:"#111"}}>Full CV — Recruiter Edition</div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#888"}}>✕</button>
        </div>
        <div style={{padding:"12px 14px",background:"#f0fdf4",borderRadius:8,border:"1px solid #86efac",marginBottom:"1.25rem"}}>
          <div style={{fontSize:12,fontWeight:600,color:"#065f46",marginBottom:4}}>What's included</div>
          <div style={{fontSize:12,color:"#374151",lineHeight:1.7}}>
            ✓ All 6 roles with full achievement bullets<br/>
            ✓ Education & Credentials ({EDUCATION_DATA.length} entries)<br/>
            ✓ All {AWARDS_DATA.length} awards and recognitions<br/>
            ✓ Professional layout — navy/blue executive styling
          </div>
        </div>
        <div style={{padding:"10px 14px",background:"#eff6ff",borderRadius:6,borderLeft:"3px solid #3b82f6",marginBottom:"1.25rem"}}>
          <div style={{fontSize:11,fontWeight:600,color:"#1e40af",marginBottom:3}}>How to get your .docx</div>
          <div style={{fontSize:12,color:"#1e3a8a",lineHeight:1.6}}>Download the .rtf → Open in Microsoft Word → File → Save As → .docx</div>
        </div>
        <button onClick={download} style={{width:"100%",padding:"10px",borderRadius:8,cursor:"pointer",background:"#1e3a5f",color:"#fff",border:"none",fontSize:13,fontWeight:600}}>
          ↓ Download Full CV (.rtf)
        </button>
      </div>
    </div>
  );
}

// ─── APPLICATION ENGINE (v4 CPS + RTF download) ───────────
function ApplyView({stories,setStories,experience}) {
  const [jd,setJd]=useState("");
  const [pipe,setPipe]=useState({step:"idle",jdData:null,cps:null,resume:null,letter:null,error:null});
  const [tab,setTab]=useState("resume");
  const [addingFor,setAddingFor]=useState(null);
  const [downloaded,setDownloaded]=useState(false);

  const isRunning=["analyze","score","draft","letter"].includes(pipe.step);
  const isDone=pipe.step==="done";
  const overall=pipe.cps?Math.round(pipe.cps.reduce((a,s)=>a+s.score,0)/pipe.cps.length):0;

  const eduCtx=EDUCATION_DATA.map(e=>`${e.cred} — ${e.org}${e.year?" ("+e.year+")":""}: ${e.note}`).join("; ");
  const awardsCtx=AWARDS_DATA.slice(0,6).map(a=>`${a.award} (${a.year})`).join("; ");

  async function runPipeline(storyList) {
    const sl=storyList||stories;
    const expCtx=buildExpContext(experience);
    const storyCtx=buildStoryContext(sl);
    setDownloaded(false);
    try{
      setPipe(p=>({...p,step:"analyze",error:null}));
      const jdText=await callClaude(
        `You are a senior recruiter. Extract key skills from a job description. Return ONLY valid JSON — no markdown. Schema: {"role":"string","company":"string","skills":[{"name":"string","weight":1-10,"category":"domain|leadership|technical|soft","required":true}]}. Extract 10-14 skills. Weight 10 = must-have.`,
        `JD:\n${jd}`
      );
      const jdData=parseJSON(jdText);
      if(!jdData?.skills)throw new Error("Could not extract skills. Please check the JD is complete.");
      setPipe(p=>({...p,step:"score",jdData}));

      const cpsText=await callClaude(
        `You are a career scoring expert. Score the candidate against each skill 0-100. Cite specific evidence. Return ONLY valid JSON — no markdown fences, no preamble, no trailing text. Schema: {"scores":[{"skill":"string","score":0-100,"evidence":"specific quote","gap":"what is missing","improve":"one actionable sentence"}]}`,
        `Skills:\n${JSON.stringify(jdData.skills)}\n\nExperience:\n${expCtx}\n\nSOAR stories:\n${storyCtx}\n\nEducation: ${eduCtx}\n\nCompetencies: ${COMPETENCIES}`,
        3000
      );
      console.log('[CPS] raw response:', cpsText.slice(0,500));
      const cpsData=parseJSON(cpsText);
      if(!cpsData?.scores){
        console.error('[CPS] parseJSON failed. Full response:', cpsText);
        throw new Error(`Could not calculate CPS scores. Raw response: ${cpsText.slice(0,200)}`);
      }
      setPipe(p=>({...p,step:"draft",cps:cpsData.scores}));

      const topGaps=cpsData.scores.filter(s=>s.score<70).map(s=>s.skill).join(", ");
      const resumeText=await callClaude(
        `You are an expert resume writer. Generate resume CONTENT that maximizes CPS for the target role. Use ALL CAPS for section headers followed by a colon. Bullet points start with •. Strong action verbs, quantified outcomes. 3 pages max. Address gaps through framing where genuine experience exists.`,
        `Target: ${jdData.role} at ${jdData.company}\nHigh-weight skills: ${jdData.skills.filter(s=>s.weight>=7).map(s=>s.name).join(", ")}\nGaps to address: ${topGaps}\n\nExperience:\n${expCtx}\n\nSOAR stories:\n${storyCtx}\n\nCompetencies: ${COMPETENCIES}\nCapital Markets: ${CM_EXPERTISE}\nEducation: ${eduCtx}\nAwards: ${awardsCtx}`,
        2000
      );
      setPipe(p=>({...p,step:"letter",resume:resumeText}));

      const scoreAvg=Math.round(cpsData.scores.reduce((a,s)=>a+s.score,0)/cpsData.scores.length);
      const gapList=cpsData.scores.filter(s=>s.score<70).map(s=>`${s.skill}: ${s.gap}`).join("\n");
      const letterText=await callClaude(
        `Write a warm, confident, genuinely human cover letter. No clichés like "I am excited to apply." 4 paragraphs. Professional but conversational. Address key gaps directly and positively.`,
        `Target: ${jdData.role} at ${jdData.company}\nOverall CPS: ${scoreAvg}/100\nKey gaps:\n${gapList}\n\nCandidate: Adam Waldman, CFA — 20 years in financial services. AVP Head of Business Insights (Manulife $800B+ W&AM), AVP Global CFO Reporting, internal strategy consultant to CFO (OMERS), launched BlackRock and Vanguard's first Canadian ETFs (State Street). Capital markets fluency: equities, fixed income, derivatives, private markets, cost of capital, duration modelling.`
      );
      setPipe(p=>({...p,step:"done",letter:letterText}));
    }catch(err){
      setPipe(p=>({...p,step:"idle",error:err.message}));
    }
  }

  async function handleAddEvidence(rawStory) {
    const newStory={...rawStory,id:Date.now(),dateAdded:new Date().toISOString().split("T")[0]};
    const updated=[...stories,newStory];
    setStories(updated);
    setAddingFor(null);
    if(pipe.jdData){
      setPipe(p=>({...p,step:"score",cps:null,resume:null,letter:null}));
      const expCtx=buildExpContext(experience);
      const storyCtx=buildStoryContext(updated);
      try{
        const cpsText=await callClaude(
          `Score the candidate against each skill 0-100. Return ONLY valid JSON — no markdown fences, no preamble. Schema: {"scores":[{"skill":"string","score":0-100,"evidence":"string","gap":"string","improve":"string"}]}`,
          `Skills:\n${JSON.stringify(pipe.jdData.skills)}\n\nExperience:\n${expCtx}\n\nSOAR stories:\n${storyCtx}\n\nCredentials: ${eduCtx}`,
          3000
        );
        console.log('[CPS re-score] raw response:', cpsText.slice(0,500));
        const cpsData=parseJSON(cpsText);
        if(!cpsData?.scores){
          console.error('[CPS re-score] parseJSON failed. Full response:', cpsText);
          throw new Error(`Re-scoring failed. Raw response: ${cpsText.slice(0,200)}`);
        }
        setPipe(p=>({...p,step:"draft",cps:cpsData.scores}));
        const resumeText=await callClaude(
          `Generate updated resume CONTENT maximizing CPS. ALL CAPS section headers. Bullet points start with •. 3 pages max.`,
          `Target: ${pipe.jdData.role} at ${pipe.jdData.company}\nExperience:\n${expCtx}\nSOAR stories:\n${storyCtx}\nCompetencies: ${COMPETENCIES}`,
          2000
        );
        setPipe(p=>({...p,step:"letter",resume:resumeText}));
        const letterText=await callClaude(
          `Write a warm, professional cover letter. 4 paragraphs. No clichés. Human-sounding.`,
          `Role: ${pipe.jdData.role} at ${pipe.jdData.company}\nCandidate: Adam Waldman, CFA — 20 years financial services, capital markets fluency, senior CFO advisory.`
        );
        setPipe(p=>({...p,step:"done",letter:letterText}));
      }catch(e){setPipe(p=>({...p,step:"done",error:e.message}));}
    }
  }

  function downloadRTF(){
    const rtf=buildResumeRTF(pipe.resume,experience);
    downloadBlob(rtf,'adam_waldman_resume_tailored.rtf','application/rtf');
    setDownloaded(true);
  }

  return(
    <div>
      <div style={{marginBottom:"1.5rem"}}>
        <div style={{fontSize:22,fontWeight:500}}>Application Engine</div>
        <div style={{fontSize:13,color:"var(--color-text-secondary)",marginTop:2}}>Paste a job description. The engine analyzes it, scores your profile (CPS), and generates a tailored resume and cover letter — ready to submit.</div>
      </div>

      {!isDone&&(
        <div style={{...S.card,marginBottom:"1rem"}}>
          <label style={S.label}>Job description</label>
          <textarea value={jd} onChange={e=>setJd(e.target.value)} style={{...S.textarea,minHeight:220,marginBottom:"1rem"}} placeholder="Paste the full job posting here…" disabled={isRunning}/>
          {pipe.error&&<div style={{fontSize:12,color:"#A32D2D",marginBottom:8,padding:"8px 12px",background:"#FCEBEB",borderRadius:6}}>⚠ {pipe.error}</div>}
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>runPipeline()} disabled={!jd.trim()||isRunning} style={{...S.primary,opacity:!jd.trim()||isRunning?0.5:1}}>
              {isRunning?"Running pipeline…":"Run Full Pipeline →"}
            </button>
            {isRunning&&<div style={{fontSize:12,color:"var(--color-text-secondary)"}}>This takes about 30 seconds…</div>}
          </div>
        </div>
      )}

      {(isRunning||isDone)&&(
        <div style={{...S.card,marginBottom:"1rem"}}>
          <PipelineProgress step={pipe.step}/>
          {isDone&&(
            <div style={{marginTop:"0.75rem",paddingTop:"0.75rem",borderTop:"0.5px solid var(--color-border-tertiary)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:13,color:"var(--color-text-secondary)"}}>
                Pipeline complete — Overall CPS: <strong style={{color:overall>=75?"#639922":overall>=60?"#BA7517":"#A32D2D"}}>{overall}/100</strong>
                {pipe.jdData&&<span style={{marginLeft:8}}>· {pipe.jdData.role} at {pipe.jdData.company}</span>}
              </div>
              <button onClick={()=>setPipe({step:"idle",jdData:null,cps:null,resume:null,letter:null,error:null})} style={S.btn}>← New application</button>
            </div>
          )}
        </div>
      )}

      {isDone&&(
        <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:"1rem",alignItems:"start"}}>
          <div>
            <div style={{display:"flex",background:"var(--color-background-secondary)",borderRadius:8,padding:3,marginBottom:"1rem",gap:2}}>
              {[{id:"resume",label:"Resume"},{id:"letter",label:"Cover Letter"}].map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"6px 0",border:"none",cursor:"pointer",fontSize:13,borderRadius:6,fontFamily:"inherit",background:tab===t.id?"var(--color-background-primary)":"transparent",color:tab===t.id?"var(--color-text-primary)":"var(--color-text-secondary)",fontWeight:tab===t.id?500:400}}>{t.label}</button>
              ))}
            </div>
            {tab==="resume"&&(
              <div style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
                  <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>Optimized for {pipe.jdData?.role} · {pipe.jdData?.company}</div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>navigator.clipboard?.writeText([`${CANDIDATE.name}\n${CANDIDATE.subtitle}\n${CANDIDATE.contact}`,pipe.resume].join("\n\n"))} style={{...S.btn,fontSize:11,padding:"4px 10px"}}>Copy ↗</button>
                    <button onClick={downloadRTF} style={{...S.btn,fontSize:11,padding:"4px 10px",color:downloaded?"#065f46":"var(--color-text-primary)",borderColor:downloaded?"#10b981":"var(--color-border-secondary)"}}>{downloaded?"✓ Downloaded":"↓ .rtf"}</button>
                  </div>
                </div>
                <ResumeOutput content={pipe.resume}/>
              </div>
            )}
            {tab==="letter"&&(
              <div style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
                  <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>Cover letter · {pipe.jdData?.role} · {pipe.jdData?.company}</div>
                  <button onClick={()=>navigator.clipboard?.writeText(pipe.letter||"")} style={{...S.btn,fontSize:11,padding:"4px 10px"}}>Copy ↗</button>
                </div>
                <div style={{fontSize:13,lineHeight:1.8,color:"var(--color-text-primary)",whiteSpace:"pre-wrap"}}>{pipe.letter}</div>
              </div>
            )}
          </div>
          <div style={S.card}>
            <div style={{fontSize:14,fontWeight:500,marginBottom:"1rem"}}>Candidate Profile Score</div>
            {addingFor?(
              <AddEvidencePanel targetGap={addingFor} onSave={handleAddEvidence} onCancel={()=>setAddingFor(null)}/>
            ):(
              <CPSScorecard scores={pipe.cps} onAddEvidence={setAddingFor}/>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROFILE VIEW ─────────────────────────────────────────
function SalaryInput({label, value, onChange}) {
  const [raw, setRaw] = useState("");
  const [focused, setFocused] = useState(false);
  return (
    <div style={{marginBottom:"1rem"}}>
      <label style={S.label}>{label}</label>
      <input
        style={S.inp}
        type="text"
        inputMode="numeric"
        value={focused ? raw : (value||0).toLocaleString()}
        onFocus={()=>{ setRaw(String(value||"")); setFocused(true); }}
        onChange={e=>setRaw(e.target.value)}
        onBlur={()=>{ setFocused(false); const n=parseInt(raw.replace(/,/g,""),10); if(!isNaN(n)&&n>0)onChange(n); }}
      />
    </div>
  );
}

function ProfileView({profile,setProfile}) {
  return(
    <div>
      <div style={{fontSize:22,fontWeight:500,marginBottom:4}}>Profile & Settings</div>
      <div style={{fontSize:13,color:"var(--color-text-secondary)",marginBottom:"1.5rem"}}>These preferences are applied to every resume and cover letter the engine generates.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem",maxWidth:700}}>
        <div style={{display:"flex",flexDirection:"column",gap:"1.5rem"}}>
          <div style={S.card}>
            <div style={{fontSize:14,fontWeight:500,marginBottom:"1rem"}}>Generation preferences</div>
            {[
              {key:"tone",label:"Cover letter tone",opts:[{v:"professional",l:"Professional & warm"},{v:"direct",l:"Direct & confident"},{v:"formal",l:"Formal"}]},
              {key:"pageLimit",label:"Resume page limit",opts:[{v:2,l:"2 pages"},{v:3,l:"3 pages"},{v:4,l:"4 pages"}]},
              {key:"seniority",label:"Target seniority",opts:[{v:"VP",l:"VP"},{v:"AVP",l:"AVP"},{v:"Director",l:"Director"},{v:"MD",l:"MD / Managing Director"}]},
            ].map(f=>(
              <div key={f.key} style={{marginBottom:"1rem"}}>
                <label style={S.label}>{f.label}</label>
                <select value={profile[f.key]} onChange={e=>setProfile(p=>({...p,[f.key]:e.target.value}))} style={S.inp}>
                  {f.opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={{fontSize:14,fontWeight:500,marginBottom:"0.25rem"}}>Salary targets</div>
            <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:"1rem"}}>Used by the Application Engine to flag comp mismatches.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
              <SalaryInput label="Base salary — from" value={profile.baseSalaryFrom} onChange={v=>setProfile(p=>({...p,baseSalaryFrom:v}))}/>
              <SalaryInput label="Base salary — to"   value={profile.baseSalaryTo}   onChange={v=>setProfile(p=>({...p,baseSalaryTo:v}))}/>
              <SalaryInput label="Total comp — from"  value={profile.totalCompFrom}  onChange={v=>setProfile(p=>({...p,totalCompFrom:v}))}/>
              <SalaryInput label="Total comp — to"    value={profile.totalCompTo}    onChange={v=>setProfile(p=>({...p,totalCompTo:v}))}/>
            </div>
          </div>
        </div>
        <div style={S.card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:"1rem"}}>Candidate on file</div>
          <div style={{fontSize:13,fontWeight:500,marginBottom:4}}>{CANDIDATE.name}</div>
          <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:2}}>{CANDIDATE.subtitle}</div>
          <div style={{fontSize:12,color:"var(--color-text-tertiary)",marginBottom:"1.25rem"}}>{CANDIDATE.contact}</div>
          <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Education & Credentials</div>
          {EDUCATION_DATA.map((e,i)=><div key={i} style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:3}}>{e.cred} · {e.org}{e.year?" ("+e.year+")":""}</div>)}
          <div style={{marginTop:"1rem",fontSize:11,fontWeight:500,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Recognition</div>
          {AWARDS_DATA.slice(0,5).map((a,i)=><div key={i} style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:3}}>★ {a.award} ({a.year})</div>)}
        </div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────
export default function App() {
  const [stories,setStories]=useState([]);
  const [loading,setLoading]=useState(true);
  const [page,setPage]=useState("home");
  const [selected,setSelected]=useState(null);
  const [editing,setEditing]=useState(null);
  const [filters,setFilters]=useState({type:"",employer:"",search:""});
  const [showFullCV,setShowFullCV]=useState(false);
  const [profile,setProfile]=useState({tone:"professional",pageLimit:3,seniority:"VP",baseSalaryFrom:185000,baseSalaryTo:220000,totalCompFrom:285000,totalCompTo:350000});
  const [experience,setExperience]=useState(EXPERIENCE_DEFAULT);

  useEffect(()=>{
    (async()=>{
      try{
        const allBase=[...SEEDS,...EXTENDED_SOAR];
        const loaded=await seedAndGetStories(allBase);
        setStories(loaded.map(normalizeStory));
      }catch(e){setStories([...SEEDS,...EXTENDED_SOAR].map(normalizeStory));}
      try{
        const exp=await getExperience();
        if(exp.length>0)setExperience(exp);
      }catch(e){}
      try{
        const prof=await getProfile();
        if(prof)setProfile(p=>({...p,
          baseSalaryFrom: prof.base_salary_from ?? p.baseSalaryFrom,
          baseSalaryTo:   prof.base_salary_to   ?? p.baseSalaryTo,
          totalCompFrom:  prof.total_comp_from   ?? p.totalCompFrom,
          totalCompTo:    prof.total_comp_to     ?? p.totalCompTo,
        }));
      }catch(e){}
      setLoading(false);
    })();
  },[]);

  async function persist(d){try{await upsertStories(d);}catch(e){}}
  async function persistExp(d){try{await saveExperience(d);}catch(e){}}
  async function persistProfile(p){try{await saveProfile({base_salary_from:p.baseSalaryFrom,base_salary_to:p.baseSalaryTo,total_comp_from:p.totalCompFrom,total_comp_to:p.totalCompTo});}catch(e){}}
  function saveStory(form){
    const exists=stories.find(s=>s.id===form.id);
    const updated=exists?stories.map(s=>s.id===form.id?form:s):[...stories,form];
    setStories(updated);persist(updated);
    setSelected(form);setEditing(null);setPage("detail");
  }
  function deleteStory(id){
    const updated=stories.filter(s=>s.id!==id);
    setStories(updated);persist(updated);
    setSelected(null);setPage("browse");
  }
  function updateStories(updated){setStories(updated.map(normalizeStory));persist(updated);}

  const sf=(k,v)=>setFilters(f=>({...f,[k]:f[k]===v?"":v}));
  const employers=[...new Set(stories.map(s=>s.employer).filter(Boolean))].sort();
  const counts=useMemo(()=>{const c={};TYPES.forEach(t=>{c[t.id]=stories.filter(s=>s.type===t.id).length;});return c;},[stories]);
  const filtered=useMemo(()=>stories.filter(s=>{
    const q=filters.search.toLowerCase();
    return(!q||[s.title,s.situation,s.action,s.result,s.employer,...(s.skills||[])].some(f=>f?.toLowerCase().includes(q)))
      &&(!filters.type||s.type===filters.type)
      &&(!filters.employer||s.employer===filters.employer);
  }),[stories,filters]);

  const isLib=["browse","detail","add","ask","interview","capture"].includes(page);

  const navBtn=(id,lbl,active,color)=>(
    <button onClick={()=>{setPage(id);if(!["detail"].includes(id)){setSelected(null);}}} style={{textAlign:"left",padding:"7px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:13,fontWeight:400,background:active?"var(--color-background-secondary)":"none",color:color||"var(--color-text-primary)"}}>{lbl}</button>
  );

  if(loading)return <div style={{padding:"2rem",color:"var(--color-text-secondary)",fontSize:14}}>Loading PHIS…</div>;

  return(
    <div style={{display:"flex",fontFamily:"var(--font-sans)",minHeight:600}}>
      {/* Sidebar */}
      <div style={{width:196,flexShrink:0,borderRight:"0.5px solid var(--color-border-tertiary)",paddingRight:"1rem",paddingTop:"1.25rem",display:"flex",flexDirection:"column",gap:0}}>
        <div style={{fontSize:14,fontWeight:700,color:"var(--color-text-primary)",letterSpacing:"-0.01em",marginBottom:1}}>PHIS <span style={{fontSize:10,fontWeight:400,color:"var(--color-text-tertiary)"}}>v5</span></div>
        <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:"1.25rem"}}>Adam Waldman · {stories.length} stories</div>

        <div style={{marginBottom:"1.25rem"}}>
          {navBtn("home","Meet Adam",page==="home")}
        </div>

        <div style={{fontSize:10,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4,padding:"0 10px"}}>SOAR Library</div>
        <div style={{display:"flex",flexDirection:"column",gap:1,marginBottom:"1.25rem"}}>
          {navBtn("browse","Browse stories",page==="browse"||page==="detail")}
          {navBtn("ask","Ask AI ✦",page==="ask","#1d4ed8")}
          {navBtn("interview","Interview Adam ✦",page==="interview","#1d4ed8")}
          {navBtn("capture","✦ Capture something",page==="capture","#1d4ed8")}
        </div>

        {isLib&&(
          <>
            <div style={{fontSize:10,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>Type</div>
            <div style={{display:"flex",flexDirection:"column",gap:1,marginBottom:"1rem"}}>
              {TYPES.map(t=>(
                <button key={t.id} onClick={()=>{sf("type",t.id);setPage("browse");setSelected(null);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",borderRadius:6,border:"none",cursor:"pointer",background:filters.type===t.id?t.bg:"none",color:filters.type===t.id?t.color:"var(--color-text-secondary)",fontSize:12}}>
                  <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:6,height:6,borderRadius:"50%",background:t.dot,flexShrink:0}}/>{t.label}</span>
                  <span style={{opacity:.6}}>{counts[t.id]||0}</span>
                </button>
              ))}
            </div>
            <div style={{fontSize:10,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>Employer</div>
            <div style={{display:"flex",flexDirection:"column",gap:1,marginBottom:"1rem"}}>
              {employers.map(e=>(
                <button key={e} onClick={()=>{sf("employer",e);setPage("browse");setSelected(null);}} style={{textAlign:"left",padding:"4px 8px",borderRadius:4,border:"none",cursor:"pointer",background:filters.employer===e?"var(--color-background-secondary)":"none",color:filters.employer===e?"var(--color-text-primary)":"var(--color-text-secondary)",fontSize:11}}>{e}</button>
              ))}
            </div>
            {(filters.type||filters.employer)&&<button onClick={()=>setFilters(f=>({...f,type:"",employer:""}))} style={{fontSize:11,color:"var(--color-text-tertiary)",background:"none",border:"none",cursor:"pointer",padding:"4px 8px",textDecoration:"underline",textAlign:"left"}}>Clear filters</button>}
          </>
        )}

        <div style={{fontSize:10,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4,padding:"0 10px",marginTop:isLib?0:"1rem"}}>Career Profile</div>
        <div style={{display:"flex",flexDirection:"column",gap:1,marginBottom:"1.25rem"}}>
          {navBtn("experience","Experience",page==="experience")}
          {navBtn("awards","Awards ★",page==="awards")}
          <button onClick={()=>setShowFullCV(true)} style={{textAlign:"left",padding:"7px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:13,fontWeight:400,background:"none",color:"#1e3a5f"}}>↓ Full CV</button>
        </div>

        <div style={{fontSize:10,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4,padding:"0 10px"}}>Job Search</div>
        <div style={{display:"flex",flexDirection:"column",gap:1,marginBottom:"1.25rem"}}>
          {navBtn("apply","Application Engine ✦",page==="apply","#1d4ed8")}
        </div>

        <div style={{fontSize:10,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4,padding:"0 10px"}}>Settings</div>
        <div style={{display:"flex",flexDirection:"column",gap:1}}>
          {navBtn("profile","Profile & Settings",page==="profile")}
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,paddingLeft:"1.5rem",minWidth:0,overflowY:"auto"}}>
        {page==="home"&&<HomeView stories={stories} experience={experience} onStoryClick={s=>{setSelected(s);setPage("detail");}}/>}

        {page==="browse"&&!selected&&(
          <div style={{paddingTop:"1.5rem"}}>
            <input value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))} placeholder="Search stories, skills, employers…" style={{...css.inp,marginBottom:"1rem"}}/>
            <div style={{fontSize:12,color:"var(--color-text-tertiary)",marginBottom:"1rem"}}>{filtered.length} {filtered.length===1?"story":"stories"}{filters.search||filters.type||filters.employer?" matching filters":""}</div>
            {filtered.length===0
              ?<div style={{textAlign:"center",padding:"3rem",color:"var(--color-text-tertiary)",fontSize:14}}>No stories match your filters.</div>
              :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>{filtered.map(s=><StoryCard key={s.id} story={s} onClick={()=>{setSelected(s);setPage("detail");}}/>)}</div>
            }
          </div>
        )}

        {page==="detail"&&selected&&(
          <DetailView story={selected} onBack={()=>{setPage("browse");setSelected(null);}} onEdit={()=>{setEditing(selected);setPage("add");}} onDelete={()=>deleteStory(selected.id)}/>
        )}
        {page==="add"&&editing&&(
          <StoryEditForm initial={editing} onSave={saveStory} onCancel={()=>{setEditing(null);setPage("detail");}}/>
        )}
        {page==="capture"&&(
          <FreeAddView stories={stories} experience={experience} onSave={saveStory} onUpdateExperience={exp=>{setExperience(exp);persistExp(exp);}} onCancel={()=>setPage("browse")}/>
        )}
        {page==="ask"&&<AskView stories={stories}/>}
        {page==="interview"&&<InterviewView stories={stories}/>}
        {page==="experience"&&<ExperienceView experience={experience} setExperience={exp=>{setExperience(exp);persistExp(exp);}}/>}
        {page==="awards"&&<AwardsView/>}
        {page==="apply"&&<ApplyView stories={stories} setStories={updateStories} experience={experience}/>}
        {page==="profile"&&<ProfileView profile={profile} setProfile={p=>{const next=typeof p==='function'?p(profile):p;setProfile(next);persistProfile(next);}}/>}
      </div>

      {showFullCV&&<FullCVExporter stories={stories} experience={experience} onClose={()=>setShowFullCV(false)}/>}
    </div>
  );
}
