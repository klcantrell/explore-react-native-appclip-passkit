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
const userId = "testUser123";
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
        accountName: "Kal Cantrell",
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
        accountName: "Kal Cantrell",
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
app.listen(port, () => {
    console.log(`Server is running at https://localhost:${port}`);
});
function isGoogleApiError(error) {
    return (error.response != null &&
        error.response.status != null);
}
