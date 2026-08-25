import axios from "axios";
import { env } from "./env.js";

export const resend = axios.create({
  baseURL: "https://api.resend.com",
  headers: {
    Authorization: `Bearer ${env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  },
});
