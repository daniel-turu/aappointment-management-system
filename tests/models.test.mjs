import test from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Department from "../models/Department.js";
import Notification from "../models/Notification.js";
import Patient from "../models/Patient.js";
import Staff from "../models/Staff.js";

test("Mongoose Models Registration Tests", async (t) => {
  await t.test("should export User model with correct model name", () => {
    assert.strictEqual(User.modelName, "User");
  });

  await t.test("should export Appointment model with correct model name", () => {
    assert.strictEqual(Appointment.modelName, "Appointment");
  });

  await t.test("should export Department model with correct model name", () => {
    assert.strictEqual(Department.modelName, "Department");
  });

  await t.test("should export Notification model with correct model name", () => {
    assert.strictEqual(Notification.modelName, "Notification");
  });

  await t.test("should export Patient model with correct model name", () => {
    assert.strictEqual(Patient.modelName, "Patient");
  });

  await t.test("should export Staff model with correct model name", () => {
    assert.strictEqual(Staff.modelName, "Staff");
  });
});
