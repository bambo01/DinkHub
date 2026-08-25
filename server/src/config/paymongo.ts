import axios from "axios";
import { env } from "./env.js";

export const paymongo = axios.create({
  baseURL: "https://api.paymongo.com/v1",
  headers: {
    Authorization: `Basic ${Buffer.from(`${env.PAYMONGO_SECRET_KEY}:`).toString(
      "base64",
    )}`,
    "Content-Type": "application/json",
  },
});
