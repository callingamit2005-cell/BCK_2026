-- Add loan_details JSONB column to emis table
-- This migration adds support for detailed loan information including:
-- - Principal amount, interest rate, tenure
-- - Provider details and loan type
-- - Interest calculation method (REDUCING or FLAT)
-- - Start date for amortization tracking

ALTER TABLE public.emis ADD COLUMN IF NOT EXISTS loan_details JSONB;

-- Add comment explaining the column structure
COMMENT ON COLUMN public.emis.loan_details IS 'Optional JSON object containing detailed loan information:
{
  "loanAmount": number,
  "loanType": string (e.g., "Home Loan", "Car Loan"),
  "providerName": string (e.g., "HDFC", "SBI"),
  "providerType": string ("BANK" or "APP"),
  "interestRateAnnual": number (percentage),
  "interestType": string ("REDUCING" or "FLAT"),
  "tenureMonths": number,
  "startDate": ISO date string (YYYY-MM-DD)
}';

-- Create index for faster queries if filtering by loanType
CREATE INDEX IF NOT EXISTS idx_emis_loan_type 
ON public.emis USING GIN (loan_details);
