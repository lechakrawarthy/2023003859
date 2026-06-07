"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = Log;
const axios_1 = __importDefault(require("axios"));
const LOG_API = "http://4.224.186.213/evaluation-service/logs";
async function Log(stack, level, pkg, message, accessToken) {
    try {
        const response = await axios_1.default.post(LOG_API, {
            stack,
            level,
            package: pkg,
            message
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        return response.data;
    }
    catch (error) {
        console.error(error);
    }
}
//# sourceMappingURL=logger.js.map