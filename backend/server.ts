import path from "path";

import express from "express";
import { GoogleAuth } from "google-auth-library";
import jwt from "jsonwebtoken";
import Stripe from "stripe";

import type { Express, Request, Response } from "express";

const stripe = new Stripe("REDACTED", {
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
    publishableKey: "pk_test_TYooMQauvdEDq54NiTphI7jx",
  });
});

app.delete("/payment-method/:id", async (req: Request, res: Response) => {
  console.log(`DELETING PAYMENT METHOD ${req.params.id}`);
  await stripe.paymentMethods.detach(req.params.id);
  res.status(201).send();
});

app.get("/list-payment-methods", async (_req: Request, res: Response) => {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: TEST_STRIPE_CUSTOMER,
    type: "card",
  });
  res.json(paymentMethods.data);
});

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
