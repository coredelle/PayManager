export interface GeorgiaLegalSections {
  purposeOfReport: string;
  georgiaDvStandard: string;
  mabrySummary: string;
  permaLesseeSummary?: string;
  directiveSummary: string;
  certificationText: string;
  disclaimerText: string;
}

export function buildGeorgiaLegalSections(params: { isLeased: boolean }): GeorgiaLegalSections {
  const purposeOfReport = `
This report has been prepared to determine whether the subject vehicle has suffered inherent diminished value as a result of a collision in the State of Georgia. Inherent diminished value refers to the reduction in fair market value that remains after proper physical repairs, due to the vehicle's now-documented accident history, stigma in the marketplace, and related buyer concerns.
  `.trim();

  const georgiaDvStandard = `
Under Georgia law, recoverable property damage to a motor vehicle is measured as the difference between the vehicle's fair market value immediately before the loss and its fair market value immediately after repairs have been completed, together with reasonable repair costs where applicable, not to exceed pre-loss value. When a vehicle is properly repaired, the owner may still recover any remaining loss in value, often referred to as diminished value.
  `.trim();

  const mabrySummary = `
In Mabry v. State Farm Mut. Auto. Ins. Co., 274 Ga. 498 (2001), the Georgia Supreme Court confirmed that automobile insurers must evaluate and pay inherent diminished value where it exists under first-party physical damage coverage. Mabry makes clear that payment of repair costs alone is not always sufficient if the vehicle's post-repair market value remains lower than its pre-loss value.
  `.trim();

  const permaLesseeSummary = params.isLeased
    ? `
In Perma Ad Ideas of Am., Inc. v. Mayville, 158 Ga. App. 707 (1981), the Court of Appeals held that it is immaterial that title to the vehicle is in another party's name. The party in possession who suffers the financial loss may recover. For leased vehicles where the lessee bears responsibility for the vehicle's condition or residual value, this principle supports the lessee's right to pursue diminished value.
    `.trim()
    : undefined;

  const directiveSummary = `
The Georgia Office of Insurance and Safety Fire Commissioner, in Directive 08-P&C-2, has advised that no single formula is approved as a mandatory standard for calculating diminished value. Each claim must be evaluated on its own facts, and insurers should not represent that a particular formula result is the only amount owed. This report follows that guidance by relying on real market data, a recognized third-party valuation source, and a transparent, case-specific analysis.
  `.trim();

  const certificationText = `
I, the undersigned appraiser, certify that this diminished value appraisal report has been prepared independently and impartially, using information believed to be accurate and reliable. The opinions and conclusions expressed herein are my professional judgments, based on the data reviewed, standard appraisal practices, and my experience in automotive valuation.

I have no present or contemplated financial interest in the vehicle that is the subject of this report, other than customary compensation for preparing this appraisal. My fee is not contingent upon the outcome of any claim or dispute related to this report.

Certified Auto Appraiser
IACP Certification #00000000
  `.trim();

  const disclaimerText = `
This report is intended to assist the vehicle owner and other interested parties in understanding the estimated inherent diminished value of the subject vehicle under Georgia law as of the date of loss and completion of repairs. All conclusions are based on the information available at the time of preparation, including third-party valuation data and market listings believed to be reliable but not guaranteed.

Final settlement of any claim remains a matter between the vehicle owner and the insurer or other responsible party. This report does not constitute legal advice, and users should consult legal counsel regarding their specific rights and remedies under Georgia law.
  `.trim();

  return {
    purposeOfReport,
    georgiaDvStandard,
    mabrySummary,
    permaLesseeSummary,
    directiveSummary,
    certificationText,
    disclaimerText,
  };
}
