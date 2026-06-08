# Training Requests Implementation Plan

1. Add failing tests for the reduced public form and its success/privacy copy.
2. Add failing tests for the public training request API and admin request API.
3. Update the Supabase schema to the new compact model and status constraint.
4. Implement the public API with validation, Supabase insert, and admin email.
5. Update the form markup and frontend submission logic.
6. Add the protected admin requests section, filtering, refresh, and status UI.
7. Implement protected list and status-update API behavior.
8. Verify that training CTAs use the form and online products use cart/Stripe.
9. Run automated and browser verification on desktop and mobile.
