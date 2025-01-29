import mongosoe, { Schema, model, Document } from "mongoose";

export interface IMessage extends Document {
  roomId: string;
  username: string;
  message: string;
}

const messageSchema = new Schema<IMessage>({
  roomId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

export const MessageModel = model("message", messageSchema);
