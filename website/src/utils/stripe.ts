// import { loadStripe } from "@stripe/stripe-js";
// import { createClient } from "@/utils/supabase/client";

// const createStripeUser = async (email: string) => {
//   const supabase = createClient();

//   const { data, error } = await supabase.functions.invoke(
//     "create_stripe_user",
//     {
//       body: { email },
//     }
//   );

//   if (error) {
//     throw new Error(error.message);
//   }

//   return data?.stripeCustomerId;
// };

// const getStripeCustomerId = async (profile: any): Promise<string> => {
//   let stripeCustomerId = profile.stripe_customer_id;

//   if (!stripeCustomerId) {
//     const supabase = createClient();
//     stripeCustomerId = await createStripeUser(profile.email);

//     if (!error) {
//       await supabase.auth.refreshSession();
//     }
//   }

//   return stripeCustomerId;
// };

// type CreatePaymentSessionProps = {
//   stripeCustomerId: string;
// };

// const createPaymentSession = async ({
//   stripeCustomerId,
// }: CreatePaymentSessionProps) => {
//   const supabase = createClient();

//   const { data, error } = await supabase.functions.invoke(
//     "create_payment_session",
//     {
//       body: { stripeCustomerId },
//     }
//   );

//   if (error) {
//     throw new Error(error.message);
//   }

//   return data.id;
// };

// type Props = {
//   isLoggedIn: boolean;
//   isSubscribed: boolean;
//   profile: any;
// };

// export const handleSubscribeClick = async ({
//   isLoggedIn,
//   isSubscribed,
//   profile,
// }: Props) => {
//   if (!isLoggedIn || isSubscribed) return;

//   try {
//     const stripeCustomerId = await getStripeCustomerId(profile);
//     const sessionId = await createPaymentSession({ stripeCustomerId });

//     const stripe = await loadStripe(
//       process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
//     );

//     if (!stripe) {
//       throw new Error("Stripe failed to load");
//     }

//     await stripe.redirectToCheckout({ sessionId });
//   } catch (error) {
//     console.error("Failed to initiate subscription:", error);
//   }
// };
