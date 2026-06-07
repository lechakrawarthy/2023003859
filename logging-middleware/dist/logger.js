"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = Log;
const axios_1 = __importDefault(require("axios"));
const LOG_API = "http://4.224.186.213/evaluation-service/logs";
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJsc3JlZW5pdkBnaXRhbS5pbiIsImV4cCI6MTc4MDgxNjQ4NSwiaWF0IjoxNzgwODE1NTg1LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNmIyNGJkNDEtZTc5Yi00YWRiLTg4MzktMmUzNzQwMWY1OTFlIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoibCBlIGNoYWtyYXdhcnRoeSBzcmVlbml2YXMiLCJzdWIiOiIxMDYyYmJiNy0yZDM1LTRhZTUtYTExYS1iNTI5ODhkMWU5NmQifSwiZW1haWwiOiJsc3JlZW5pdkBnaXRhbS5pbiIsIm5hbWUiOiJsIGUgY2hha3Jhd2FydGh5IHNyZWVuaXZhcyIsInJvbGxObyI6IjIwMjMwMDM4NTkiLCJhY2Nlc3NDb2RlIjoid2dLdGdaIiwiY2xpZW50SUQiOiIxMDYyYmJiNy0yZDM1LTRhZTUtYTExYS1iNTI5ODhkMWU5NmQiLCJjbGllbnRTZWNyZXQiOiJLTkJQQmVkYnhSam5yWllHIn0.wqnQmcwl1mWypAdU4o1DyanuVQqZaDuh0S6QLDHL0gc";
async function Log(stack, level, pkg, message) {
    try {
        console.log(`[${stack.toUpperCase()}] [${level.toUpperCase()}] [${pkg}] ${message}`);
        await axios_1.default.post(LOG_API, {
            stack,
            level,
            package: pkg,
            message
        }, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });
    }
    catch (error) {
        console.error("Logging failed:", error);
    }
}
//# sourceMappingURL=logger.js.map