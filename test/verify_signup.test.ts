import assert from "node:assert/strict";
import { signupSchema } from "../src/verify_signup.js";
assert.equal(signupSchema.safeParse({ email: "donor@example.org", donorName: "Lin", campaign: "Food fund" }).success, true);
assert.equal(signupSchema.safeParse({ email: "bad", donorName: "Lin", campaign: "Food fund" }).success, false);
console.log("signup boundary: valid donor accepted, malformed email rejected");
