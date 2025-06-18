import * as mongoose from 'mongoose';

export const ForgottenPasswordSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  newPasswordToken: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});
