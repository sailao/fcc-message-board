const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let boardSchema = new Schema({
    name: String,
    threads: [{type: mongoose.Schema.ObjectId, ref: "Thread"}]
});

module.exports = mongoose.model("Board", boardSchema);