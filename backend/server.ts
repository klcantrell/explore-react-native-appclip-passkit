import path from "path";

import express from "express";
import { GoogleAuth } from "google-auth-library";
import jwt from "jsonwebtoken";
import Stripe from "stripe";

import type { Express, Request, Response } from "express";

const SECRET_STRIPE_KEY = "REDACTED";
const STRIPE_WEBHOOK_SECRET = "REDACTED";

const TEST_SUBSCRIPTION_PRICE_ID = "price_1LmRYKFUK6dPhUL2jPQIEldI";

const stripe = new Stripe(SECRET_STRIPE_KEY, {
  apiVersion: "2022-08-01",
});

const app: Express = express();
const port = process.env.PORT || 3000;

/*
 * keyFilePath - Path to service account key file from Google Cloud Console
 *             - Environment variable: GOOGLE_APPLICATION_CREDENTIALS
 */
const keyFilePath = "/wallet-spike-web-client-1161686fdc40.json";

/*
 * issuerId - The issuer ID being updated in this request
 *          - Environment variable: WALLET_ISSUER_ID
 */
const issuerId = "3388000000022130058";

/*
 * classId - Developer-defined ID for the wallet class
 *         - Environment variable: WALLET_CLASS_ID
 */
const classId = "pass.com.explorereactnativeappclippasskit";

/*
 * userId - Developer-defined ID for the user, such as an email address
 *        - Environment variable: WALLET_USER_ID
 */
const userId = "testUser12";

/*
 * objectId - ID for the wallet object
 *          - Format: `issuerId.identifier`
 *          - Should only include alphanumeric characters, '.', '_', or '-'
 *          - `identifier` is developer-defined and unique to the user
 */
const objectId = `${issuerId}.${userId.replace(/[^\w.-]/g, "_")}-${classId}`;

///////////////////////////////////////////////////////////////////////////////
// Create authenticated Google API client, using service account file.
///////////////////////////////////////////////////////////////////////////////

const credentials = require(path.join(__dirname, keyFilePath));

const httpClient = new GoogleAuth({
  credentials: credentials,
  scopes: "https://www.googleapis.com/auth/wallet_object.issuer",
});

const TEST_STRIPE_CUSTOMER = "cus_MUJX8mCKVJAHld";
const PUBLISHABLE_STRIPE_KEY = "pk_test_chkGUsA5T8WUB5vgc1FMoRgX00Qi1Nq1t4";

app.get("/applepass/:id", (req: Request<{ id: string }>, res: Response) => {
  let fileName: string | undefined;
  if (req.params.id === "bgsksfuioa") {
    fileName = "myFirstPass.pkpass";
  } else if (req.params.id === "analternateserialnumber") {
    fileName = "mySecondPass.pkpass";
  }

  if (fileName) {
    res.sendFile(path.join(__dirname, fileName), {
      type: "application/vnd.apple.pkpass",
    });
  } else {
    res.status(404).send("Invalid pass ID");
  }
});

app.get("/applepass", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "/mySecondPass.pkpass"), {
    type: "application/vnd.apple.pkpass",
  });
});

app.get("/androidpass", async (req: Request, res: Response) => {
  ///////////////////////////////////////////////////////////////////////////////
  // Get or create an object via the API.
  ///////////////////////////////////////////////////////////////////////////////

  // [START object]
  const objectUrl =
    "https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/";
  const objectPayload = {
    id: objectId,
    classId: `${issuerId}.${classId}`,
    accountId: userId,
    accountName: "Kal12",
    state: "active",
    loyaltyPoints: {
      balance: {
        int: "47",
      },
      label: "Bottles Avoided",
    },
    barcode: {
      type: "QR_CODE",
      value: "kajsdhlkajshdklajshdlk",
    },
  };

  let objectResponse;

  try {
    objectResponse = await httpClient.request({
      url: objectUrl + objectId,
      method: "GET",
    });
  } catch (error) {
    if (isGoogleApiError(error) && error.response.status === 404) {
      // Object does not yet exist
      // Send POST request to create it
      objectResponse = await httpClient.request({
        url: objectUrl,
        method: "POST",
        data: objectPayload,
      });
    } else {
      objectResponse = error;
    }
  }

  console.log("object GET or POST response:", objectResponse);
  res.json(objectResponse);
  // [END object]
});

app.get("/androidpassjwt", async (req: Request, res: Response) => {
  ///////////////////////////////////////////////////////////////////////////////
  // Get or create an object via the API.
  ///////////////////////////////////////////////////////////////////////////////

  // [START object]
  const objectUrl =
    "https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/";
  const objectPayload = {
    id: objectId,
    classId: `${issuerId}.${classId}`,
    accountId: userId,
    accountName: "Kal12",
    state: "active",

    loyaltyPoints: {
      balance: {
        int: "47",
      },
      label: "Bottles Avoided",
    },
    barcode: {
      type: "QR_CODE",
      value: "kajsdhlkajshdklajshdlk",
    },
  };

  let objectResponse;

  try {
    objectResponse = await httpClient.request({
      url: objectUrl + objectId,
      method: "GET",
    });
  } catch (error) {
    if (isGoogleApiError(error) && error.response.status === 404) {
      // Object does not yet exist
      // Send POST request to create it
      objectResponse = await httpClient.request({
        url: objectUrl,
        method: "POST",
        data: objectPayload,
      });
    } else {
      objectResponse = error;
    }
  }

  console.log("object GET or POST response:", objectResponse);
  // [END object]

  ///////////////////////////////////////////////////////////////////////////////
  // Create a JWT for the object, and encode it to create a 'Save' URL.
  ///////////////////////////////////////////////////////////////////////////////

  // [START jwt]
  const claims = {
    iss: credentials.client_email,
    aud: "google",
    origins: ["localhost:3000"],
    typ: "savetowallet",
    payload: {
      loyaltyObjects: [
        {
          id: objectId,
        },
      ],
    },
  };

  const token = jwt.sign(claims, credentials.private_key, {
    algorithm: "RS256",
  });
  const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

  console.log(saveUrl);
  // [END jwt]
  res.json({
    passJwt: token,
  });
});

app.get("/androidpass/:id", async (req: Request, res: Response) => {
  const objectUrl = `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${req.params.id}`;
  const response = await httpClient.request({
    url: objectUrl,
    method: "GET",
  });
  res.json(response);
});

app.post("/payment-method", async (_req: Request, res: Response) => {
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: TEST_STRIPE_CUSTOMER },
    { apiVersion: "2022-08-01" }
  );
  const setupIntent = await stripe.setupIntents.create({
    customer: TEST_STRIPE_CUSTOMER,
  });
  res.json({
    setupIntent: setupIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: TEST_STRIPE_CUSTOMER,
    publishableKey: PUBLISHABLE_STRIPE_KEY,
  });
});

app.post("/payment-sheet", async (_req: Request, res: Response) => {
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: TEST_STRIPE_CUSTOMER },
    { apiVersion: "2022-08-01" }
  );
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 100,
    currency: "usd",
    customer: TEST_STRIPE_CUSTOMER,
    setup_future_usage: "off_session",
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.json({
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: TEST_STRIPE_CUSTOMER,
    publishableKey: PUBLISHABLE_STRIPE_KEY,
  });
});

app.delete("/payment-method/:id", async (req: Request, res: Response) => {
  await stripe.paymentMethods.detach(req.params.id);
  res.status(201).send();
});

app.get("/list-payment-methods", async (_req: Request, res: Response) => {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: TEST_STRIPE_CUSTOMER,
    type: "card",
  });
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json(paymentMethods.data);
});

app.post(
  "/create-subscription",
  express.json({ type: "application/json" }),
  async (
    req: Request<{}, {}, { paymentMethod: string | null }>,
    res: Response
  ) => {
    const paymentMethod = req.body.paymentMethod;
    let subscription: Stripe.Response<Stripe.Subscription>;
    if (paymentMethod != null) {
      subscription = await stripe.subscriptions.create({
        default_payment_method: paymentMethod,
        customer: TEST_STRIPE_CUSTOMER,
        items: [
          {
            price: TEST_SUBSCRIPTION_PRICE_ID,
          },
        ],
        expand: ["latest_invoice.payment_intent"],
      });
    } else {
      subscription = await stripe.subscriptions.create({
        customer: TEST_STRIPE_CUSTOMER,
        items: [
          {
            price: TEST_SUBSCRIPTION_PRICE_ID,
          },
        ],
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
        },
        expand: ["latest_invoice.payment_intent"],
      });
    }
    console.log(
      `Subscription session created: { id=${subscription.id}, current_period_end=${subscription.current_period_end}, status=${subscription.status} }`
    );
    res.json({
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
      clientSecret: (
        (subscription.latest_invoice as Stripe.Invoice)
          .payment_intent as Stripe.PaymentIntent
      ).client_secret,
    });
  }
);

app.get("/subscription", async (_req: Request, res: Response) => {
  const customer = (await stripe.customers.retrieve(TEST_STRIPE_CUSTOMER, {
    expand: ["subscriptions"],
  })) as Stripe.Customer;
  res.json(customer.subscriptions);
});

app.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;

    let event: Stripe.Event;
    let subscription: Stripe.Subscription;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      const message = `Webhook Error: ${(error as Error).message}`;
      console.log(message);
      res.status(400).send(message);
      return;
    }

    switch (event.type) {
      case "customer.subscription.created":
        subscription = event.data.object as Stripe.Subscription;
        console.log(
          `Subscription created: { id=${subscription.id}, status=${subscription.status} }}`
        );
        break;
      case "customer.subscription.deleted":
        subscription = event.data.object as Stripe.Subscription;
        console.log(
          `Subscription canceled: { id=${subscription.id}, status=${subscription.status} }}`
        );
        break;
      case "customer.subscription.updated":
        subscription = event.data.object as Stripe.Subscription;
        console.log(
          `Subscription updated: { id=${subscription.id}, status=${subscription.status} }}`
        );
        break;
      case "payment_method.attached":
        const attachedPaymentMethod = event.data.object as Stripe.PaymentMethod;
        await stripe.customers.update(TEST_STRIPE_CUSTOMER, {
          invoice_settings: {
            default_payment_method: attachedPaymentMethod.id,
          },
        });
        break;
      case "payment_intent.succeeded":
        const successfulPaymentIntent = event.data
          .object as Stripe.PaymentIntent;
        console.log("Payment intent succeeded", successfulPaymentIntent);
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
  }
);

app.listen(port, () => {
  console.log(`Server is running at https://localhost:${port}`);
});

interface GoogleApiError {
  response: {
    status: number;
  };
}

function isGoogleApiError(error: unknown): error is GoogleApiError {
  return (
    (error as GoogleApiError).response != null &&
    (error as GoogleApiError).response.status != null
  );
}
