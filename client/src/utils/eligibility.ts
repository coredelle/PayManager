import { PreAccidentValueBucket } from "@/types/appraisal";

export function isGuaranteeEligible(bucket: PreAccidentValueBucket | ""): boolean {
  if (!bucket || bucket === "<5000") return false;
  return true;
}
