import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const commentSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },      
    album: { type: Types.ObjectId, ref: "Album", required : false},   
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },  
    message: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },

  },
  {
    timestamps: true, 
  }
);


const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
