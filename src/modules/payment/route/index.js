import express from "express";
import Stripe from "stripe";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/service-provider-account-create", async (req, res) => {
  const { email } = req.body;

  const account = await stripe.accounts.create({
    type: "express",
    email,
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: "http://localhost:5173/payment-cancel",
    return_url: "http://localhost:5173/payment-success",
    type: "account_onboarding",
  });

  res.send(accountLink);
});

// checkout session
router.post("/create-checkout-session", async (req, res) => {
  const { priceId } = req.body;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: 300,
      transfer_data: {
        destination: "acct_1NuPtDBC7hefq2GN",
      },
    },
    success_url: "http://localhost:5173/payment-success",
    cancel_url: "http://localhost:5173/payment-cancel",
  });

  res.send(session);
});

router.post("/webhook", async (req, res) => {
  //TO-DO need to make sure this webhook works.
  const event = req.body;

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      console.log(session);
      break;
    case "checkout.session.async_payment_succeeded":
      const session2 = event.data.object;
      console.log(session2);
      break;
    case "checkout.session.async_payment_failed":
      const session3 = event.data.object;
      console.log(session3);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.send();
});

//connect webhook
// router.post("/connect-webhook", async (req, res) => {
//   const event = req.body;

//   switch (event.type) {
//     case "account.updated":
//       const account = event.data.object;
//       console.log(account);
//       break;
//     default:
//       console.log(`Unhandled event type ${event.type}`);
//   }

//   res.send();
// });

// the webhook setup above is unnecessary because we will do this portion manually as there are way less service providers than customers.

export default router;
