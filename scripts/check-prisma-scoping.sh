#!/usr/bin/env bash
set -euo pipefail

VIOLATIONS=$(grep -rEn "db\.(user|profile|experienceRole|achievement|skill|skillCategory|skillApplication|softSkill|education|valuePrinciple|valueIndustryOpinion|valueLinkedInTheme|valueCareerNarrative|application|jobDescription|tailoringStrategy|companyNotes|interviewPrepBrief|artifact|importRun)\.(findFirst|findMany|create|update|delete)\(" app/ server/actions/ 2>/dev/null | grep -v "scopeToUser" || true)

if [ -n "$VIOLATIONS" ]; then
  echo "Raw Prisma calls without scopeToUser detected:"
  echo "$VIOLATIONS"
  exit 1
fi
echo "Prisma scoping check passed."
