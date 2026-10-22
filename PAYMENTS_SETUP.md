# MuskySocials payment setup (test mode only)

## Safety status

- The checkout Edge Function accepts only a Paystack **test secret key** beginning with `sk_test_`.
- Do not place a Paystack secret key in GitHub, HTML, JavaScript shipped to the browser, or screenshots.
- Coins and memberships are granted only after the signed webhook is received and the transaction is verified against Paystack.
- Silver, Gold, and Diamond checkout is disabled from 1 January 2027 until their standard prices are approved.
- Gold, Diamond, and Platinum currently grant fixed membership periods with manual renewal. Automatic recurring billing is not enabled in this first test rollout.

## Configure Paystack test mode

1. In the Paystack dashboard, switch to **Test Mode** and copy the test secret key.
2. In the Supabase project for MuskySocials, open **Edge Functions → Secrets** and add `PAYSTACK_SECRET_KEY` with that test key. Never add it to the repository.
3. In Paystack Test Mode, set the webhook URL to:
   `https://jnsbttwyiwcqhuhveikq.supabase.co/functions/v1/paystack-webhook`
4. Enable the successful-charge webhook event (`charge.success`).
5. Use Paystack's official test payment details while in Test Mode. Do not use a real card or real money for these checks.

## Test checklist

- Sign in with a MuskySocials account that has an email address.
- Open Profile → Upgrade to Pro.
- Choose a plan and complete a Paystack test transaction.
- Confirm the transaction appears in `public.payment_transactions`.
- Confirm the webhook marks it paid and credits coins exactly once.
- For Gold, Diamond, or Platinum, confirm the active membership and expiry date.
- Send the same webhook again and confirm it does not add coins twice.
- Confirm an unsuccessful or amount-mismatched payment grants no coins or membership.

## Current plan terms

- Silver: ₦400 for 500 coins during the promotion, daily package; no paid membership is added.
- Gold: ₦2,300 for 3,000 coins and a 7-day membership period.
- Diamond: ₦7,000 for 7,500 coins and a 30-day membership period.
- Platinum: ₦18,000 for a 365-day membership with included-tool access; chargeable actions still deduct coins.
- Promotion end: 31 December 2026 in Nigeria time. New Silver, Gold, and Diamond prices have not been supplied yet.
