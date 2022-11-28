"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const google_auth_library_1 = require("google-auth-library");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const stripe_1 = __importDefault(require("stripe"));
const SECRET_STRIPE_KEY = "REDACTED";
const STRIPE_WEBHOOK_SECRET = "REDACTED";
const TEST_SUBSCRIPTION_PRICE_ID = "price_1LmRYKFUK6dPhUL2jPQIEldI";
const stripe = new stripe_1.default(SECRET_STRIPE_KEY, {
    apiVersion: "2022-08-01",
});
const app = (0, express_1.default)();
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
const credentials = require(path_1.default.join(__dirname, keyFilePath));
const httpClient = new google_auth_library_1.GoogleAuth({
    credentials: credentials,
    scopes: "https://www.googleapis.com/auth/wallet_object.issuer",
});
const TEST_STRIPE_CUSTOMER = "cus_MUJX8mCKVJAHld";
const PUBLISHABLE_STRIPE_KEY = "pk_test_chkGUsA5T8WUB5vgc1FMoRgX00Qi1Nq1t4";
app.get("/applepass/:id", (req, res) => {
    let fileName;
    if (req.params.id === "bgsksfuioa") {
        fileName = "myFirstPass.pkpass";
    }
    else if (req.params.id === "analternateserialnumber") {
        fileName = "mySecondPass.pkpass";
    }
    if (fileName) {
        res.sendFile(path_1.default.join(__dirname, fileName), {
            type: "application/vnd.apple.pkpass",
        });
    }
    else {
        res.status(404).send("Invalid pass ID");
    }
});
app.get("/applepass", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "/mySecondPass.pkpass"), {
        type: "application/vnd.apple.pkpass",
    });
});
app.get("/androidpass", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    ///////////////////////////////////////////////////////////////////////////////
    // Get or create an object via the API.
    ///////////////////////////////////////////////////////////////////////////////
    // [START object]
    const objectUrl = "https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/";
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
        objectResponse = yield httpClient.request({
            url: objectUrl + objectId,
            method: "GET",
        });
    }
    catch (error) {
        if (isGoogleApiError(error) && error.response.status === 404) {
            // Object does not yet exist
            // Send POST request to create it
            objectResponse = yield httpClient.request({
                url: objectUrl,
                method: "POST",
                data: objectPayload,
            });
        }
        else {
            objectResponse = error;
        }
    }
    console.log("object GET or POST response:", objectResponse);
    res.json(objectResponse);
    // [END object]
}));
app.get("/androidpassjwt", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    ///////////////////////////////////////////////////////////////////////////////
    // Get or create an object via the API.
    ///////////////////////////////////////////////////////////////////////////////
    // [START object]
    const objectUrl = "https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/";
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
        objectResponse = yield httpClient.request({
            url: objectUrl + objectId,
            method: "GET",
        });
    }
    catch (error) {
        if (isGoogleApiError(error) && error.response.status === 404) {
            // Object does not yet exist
            // Send POST request to create it
            objectResponse = yield httpClient.request({
                url: objectUrl,
                method: "POST",
                data: objectPayload,
            });
        }
        else {
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
    const token = jsonwebtoken_1.default.sign(claims, credentials.private_key, {
        algorithm: "RS256",
    });
    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;
    console.log(saveUrl);
    // [END jwt]
    res.json({
        passJwt: token,
    });
}));
app.get("/androidpass/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const objectUrl = `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${req.params.id}`;
    const response = yield httpClient.request({
        url: objectUrl,
        method: "GET",
    });
    res.json(response);
}));
app.post("/payment-method", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ephemeralKey = yield stripe.ephemeralKeys.create({ customer: TEST_STRIPE_CUSTOMER }, { apiVersion: "2022-08-01" });
    const setupIntent = yield stripe.setupIntents.create({
        customer: TEST_STRIPE_CUSTOMER,
    });
    res.json({
        setupIntent: setupIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: TEST_STRIPE_CUSTOMER,
        publishableKey: PUBLISHABLE_STRIPE_KEY,
    });
}));
app.post("/payment-sheet", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ephemeralKey = yield stripe.ephemeralKeys.create({ customer: TEST_STRIPE_CUSTOMER }, { apiVersion: "2022-08-01" });
    const paymentIntent = yield stripe.paymentIntents.create({
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
}));
app.delete("/payment-method/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield stripe.paymentMethods.detach(req.params.id);
    res.status(201).send();
}));
app.get("/list-payment-methods", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const paymentMethods = yield stripe.paymentMethods.list({
        customer: TEST_STRIPE_CUSTOMER,
        type: "card",
    });
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json(paymentMethods.data);
}));
app.post("/create-subscription", express_1.default.json({ type: "application/json" }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const paymentMethod = req.body.paymentMethod;
    let subscription;
    if (paymentMethod != null) {
        subscription = yield stripe.subscriptions.create({
            default_payment_method: paymentMethod,
            customer: TEST_STRIPE_CUSTOMER,
            items: [
                {
                    price: TEST_SUBSCRIPTION_PRICE_ID,
                },
            ],
            expand: ["latest_invoice.payment_intent"],
        });
    }
    else {
        subscription = yield stripe.subscriptions.create({
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
    console.log(`Subscription session created: { id=${subscription.id}, current_period_end=${subscription.current_period_end}, status=${subscription.status} }`);
    res.json({
        subscriptionStatus: subscription.status,
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice
            .payment_intent.client_secret,
    });
}));
app.get("/subscription", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const customer = (yield stripe.customers.retrieve(TEST_STRIPE_CUSTOMER, {
        expand: ["subscriptions"],
    }));
    res.json(customer.subscriptions);
}));
app.post("/stripe-webhook", express_1.default.raw({ type: "application/json" }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sig = req.headers["stripe-signature"];
    let event;
    let subscription;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    }
    catch (error) {
        const message = `Webhook Error: ${error.message}`;
        console.log(message);
        res.status(400).send(message);
        return;
    }
    switch (event.type) {
        case "customer.subscription.created":
            subscription = event.data.object;
            console.log(`Subscription created: { id=${subscription.id}, status=${subscription.status} }}`);
            break;
        case "customer.subscription.deleted":
            subscription = event.data.object;
            console.log(`Subscription canceled: { id=${subscription.id}, status=${subscription.status} }}`);
            break;
        case "customer.subscription.updated":
            subscription = event.data.object;
            console.log(`Subscription updated: { id=${subscription.id}, status=${subscription.status} }}`);
            break;
        case "payment_method.attached":
            const attachedPaymentMethod = event.data.object;
            yield stripe.customers.update(TEST_STRIPE_CUSTOMER, {
                invoice_settings: {
                    default_payment_method: attachedPaymentMethod.id,
                },
            });
            break;
        case "payment_intent.succeeded":
            const successfulPaymentIntent = event.data
                .object;
            console.log("Payment intent succeeded", successfulPaymentIntent);
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    // Return a 200 response to acknowledge receipt of the event
    res.send();
}));
app.listen(port, () => {
    console.log(`Server is running at https://localhost:${port}`);
});
function isGoogleApiError(error) {
    return (error.response != null &&
        error.response.status != null);
}
