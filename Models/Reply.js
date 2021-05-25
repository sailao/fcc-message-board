const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const replySchema = new Schema({
    text: String,
    delete_password: String,
    created_on: {type: Date, default: new Date()},
    bumped_on: {type: Date, default: new Date()},
    reported: {type: Boolean, default: false}
});

module.exports = mongoose.model("Reply", replySchema)