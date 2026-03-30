-- Add onboarding completion state for unified post-signup flow
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

-- Existing users are treated as already onboarded to avoid redirect loops
UPDATE "User"
SET "onboardingCompletedAt" = COALESCE("onboardingCompletedAt", NOW());
