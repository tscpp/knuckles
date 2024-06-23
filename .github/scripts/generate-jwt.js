import { readFileSync } from "fs";
import jsonwebtoken from "jsonwebtoken";

const { APP_ID } = process.env;

const privateKey = readFileSync("/dev/stdin", "utf8");
const payload = {
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 10 * 60,
  iss: APP_ID,
};
const token = jsonwebtoken.sign(payload, privateKey, { algorithm: "RS256" });
console.log(token);
