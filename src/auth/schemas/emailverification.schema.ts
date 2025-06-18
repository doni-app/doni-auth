import * as mongoose from 'mongoose';

export const EmailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  emailToken: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});
