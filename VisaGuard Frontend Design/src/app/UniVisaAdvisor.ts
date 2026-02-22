/**
 * UniVisa AI Advisor — hardcoded Q&A from UniVisaAdvisor.jsx.
 * Answers are matched by keywords; edit QA_BANK to change responses.
 */

const QA_BANK: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["work", "20", "hours", "campus", "on-campus"],
    answer: `F-1 students may work on campus up to 20 hours per week during the academic year. During official school breaks (summer, winter), you may work full-time up to 40 hours.

⚠️ IMPORTANT: Exceeding 20 hrs/week during the semester — even by one hour — is a deportable SEVIS violation.

Source: USCIS F-1 On-Campus Employment Guidelines §214.2(f)(9)`,
  },
  {
    keywords: ["opt", "deadline", "miss", "optional practical"],
    answer: `Missing your OPT application deadline means losing your right to work in the US after graduation — this cannot be reversed.

You must apply no earlier than 90 days before your program end date. USCIS processing takes 3–5 months, so apply as early as possible.

⚠️ IMPORTANT: If you miss the OPT window entirely, you lose eligibility for that degree level.

Source: USCIS OPT Guide (M-1438), Section 4`,
  },
  {
    keywords: ["address", "report", "move", "moved", "new address"],
    answer: `Yes — F-1 students are legally required to report any US address change to their DSO within 10 days of moving.

Your DSO updates this in your SEVIS record. Failure to report is a SEVIS violation even if everything else is in compliance.

Steps: Email your DSO → provide new address → confirm SEVIS has been updated.

Source: SEVIS Reporting Requirements §214.2(f)(17)(ii)`,
  },
  {
    keywords: ["cpt", "curricular practical", "off campus", "off-campus work"],
    answer: `CPT (Curricular Practical Training) allows F-1 students to work off-campus as part of their curriculum — but it must be authorized by your DSO BEFORE you start working.

⚠️ IMPORTANT: Working without CPT authorization is unauthorized employment — one of the most serious F-1 violations. Also, 12+ months of full-time CPT makes you ineligible for OPT.

Source: USCIS CPT Guidelines §214.2(f)(10)(i)`,
  },
  {
    keywords: ["travel", "leave", "trip", "go back", "visit home", "fly"],
    answer: `Before traveling outside the US, verify all three of the following:

1. Your visa stamp is still valid for re-entry
2. Your I-20 travel signature is less than 6 months old (12 months if on OPT)
3. Your passport is valid for at least 6 months beyond your return date

⚠️ If any of these are expired, you may be denied re-entry even if your status is valid.

Source: CBP F-1 Re-entry Requirements`,
  },
  {
    keywords: ["full time", "full-time", "drop", "part time", "credits", "enrollment"],
    answer: `F-1 students must maintain full-time enrollment during the academic year — minimum 12 credits for undergraduates, 9 credits for graduate students.

Dropping below full-time without prior DSO authorization is a SEVIS violation.

Authorized exceptions exist for: final semester, medical reasons, or academic difficulty — but ALL must be approved by your DSO in writing BEFORE dropping.

Source: INA §101(a)(15)(F), USCIS §214.2(f)(6)`,
  },
  {
    keywords: ["sevis", "terminated", "termination", "out of status"],
    answer: `A SEVIS termination means your F-1 status has been revoked. You have two options:

1. Apply for reinstatement within 5 months (if eligible)
2. Leave the US and re-enter on a new visa/I-20

⚠️ IMPORTANT: Do NOT continue studying or working after a SEVIS termination — it compounds the violation. Contact your DSO immediately.

Source: USCIS Reinstatement Guidelines §214.2(f)(16)`,
  },
  {
    keywords: ["transfer", "new school", "change university", "switch school"],
    answer: `To transfer schools, your SEVIS record must be transferred from your current institution to the new one BEFORE you begin at the new school.

You have a 15-day window after your program end date at the original school to begin the transfer process.

Steps: Notify current DSO → get transfer release → new school DSO issues new I-20.

Source: SEVIS Transfer Procedures §214.2(f)(8)`,
  },
  {
    keywords: ["ssn", "social security", "social security number"],
    answer: `You need an SSN to work on-campus, file taxes, open a US bank account, and complete I-9 employment verification forms.

To apply: Get a DSO letter confirming employment eligibility → wait 10 days after arriving in the US → visit your local Social Security Administration office with your passport, visa, I-20, and DSO letter.

Source: SSA Publication No. 05-10096`,
  },
  {
    keywords: ["tax", "taxes", "file", "8843", "irs"],
    answer: `ALL international students must file a US federal tax return — even if you had zero income. At minimum, you must file Form 8843 every year you are in the US.

If you had income (on-campus job, stipend, scholarship), additional forms are required. The filing deadline is April 15.

⚠️ Failure to file can affect future visa applications and OPT eligibility.

Source: IRS Publication 519 — US Tax Guide for Aliens`,
  },
  {
    keywords: ["health", "insurance", "waive", "medical"],
    answer: `Most universities require international students to be enrolled in the school's health insurance plan unless you can demonstrate comparable alternative coverage.

Enrollment windows are typically only open for 2–3 weeks at the start of each semester — missing the window means you are automatically enrolled and charged.

A single US emergency room visit can cost $5,000–$50,000 without insurance.

Source: Your university's ISO office and health services portal`,
  },
  {
    keywords: ["stem", "stem opt", "24 month", "extension"],
    answer: `STEM OPT extends your post-completion OPT by 24 months if you have a qualifying STEM degree and a qualifying employer enrolled in E-Verify.

You must apply 90 days before your standard OPT expires. Your employer must submit a formal training plan (Form I-983).

⚠️ You cannot apply after your OPT expires — apply early.

Source: USCIS STEM OPT Guidelines, 8 CFR 214.2(f)(10)(ii)(C)`,
  },
  {
    keywords: ["grace period", "after graduation", "program end", "60 days"],
    answer: `After your program end date, F-1 students have a 60-day grace period to either depart the US, begin OPT, or transfer to another program.

You CANNOT work during the grace period unless you have an active EAD card for OPT.

⚠️ The grace period is not extendable. Plan your next steps before your program ends.

Source: USCIS F-1 Grace Period §214.2(f)(5)(iv)`,
  },
  {
    keywords: ["dso", "designated school official", "international office", "iso"],
    answer: `Your DSO (Designated School Official) is your legal point of contact for all SEVIS-related actions — they are the only person authorized to update your visa record.

You should know: their name, email, phone number, and office hours.

Contact your DSO immediately for: enrollment changes, travel, OPT/CPT authorization, address updates, and any compliance concerns.

Find them at your university's International Student Office (ISO).`,
  },
  {
    keywords: ["h1b", "h-1b", "cap gap", "after opt"],
    answer: `If your H-1B petition is approved and you are on OPT, the cap-gap rule automatically extends your OPT and F-1 status until October 1 (H-1B start date).

⚠️ Traveling outside the US during the cap-gap period is extremely risky — many students are denied re-entry. Consult your DSO before any travel during this window.

Source: USCIS Cap-Gap Extension Guidelines`,
  },
];

const DEFAULT_ANSWER = `That's a great question. Based on current F-1/J-1 policy, I'd recommend confirming this directly with your DSO, as the answer may depend on your specific situation and university.

For authoritative guidance, visit uscis.gov or contact your International Student Office.

Source: USCIS General F-1 Regulations §214.2(f)`;

/**
 * Get answer from the hardcoded QA bank (same logic as UniVisaAdvisor.jsx).
 * Uses keyword match: first entry where the user's input includes at least one keyword wins.
 */
export function getAnswer(input: string): string {
  const lower = input.toLowerCase().trim();
  for (const qa of QA_BANK) {
    if (qa.keywords.some((k) => lower.includes(k))) {
      return qa.answer;
    }
  }
  return DEFAULT_ANSWER;
}
