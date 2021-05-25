const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const threadSchema = new Schema({
    text: String,
    delete_password: String,
    created_on: {type: Date, default: new Date()},
    bumped_on: {type: Date, default: new Date()},
    reported: {type: Boolean, default: false},
    replies: [{type: mongoose.Schema.ObjectId, ref: "Reply"}]
});

module.exports = mongoose.model("Thread", threadSchema)