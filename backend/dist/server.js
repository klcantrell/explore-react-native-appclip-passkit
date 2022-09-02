"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
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
app.listen(port, () => {
    console.log(`Server is running at https://localhost:${port}`);
});
