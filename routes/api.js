'use strict';
const Board = require("../Models/Board");
const Thread = require("../Models/Thread");
const Reply = require("../Models/Reply");
const monboose = require("mongoose");
const ObjectId = monboose.Types.ObjectId;

module.exports = function (app) {
  
    let threadRoute = app.route('/api/threads/:board');

    threadRoute.post(async(req, res) => {
        try {
            let {board} = req.params;
            let {text, delete_password} = req.body;

            let thread = await Thread.create({text, delete_password});

            await Board.update({name: board}, {$addToSet: {threads: thread._id}}, {upsert: true});

            res.status(201).json(thread);
        } catch (error) {
            res.status(400).json({message: error.message});
        }
    });

    threadRoute.get(async(req, res) => {
        try {
            let {board} = req.params;
            
            let boardThread = await Board.aggregate([
                { $match: {name: board}},
                { $lookup: {
                    from: "threads",
                    localField: "threads",
                    foreignField: "_id",
                    as: "threads"
                }},
                { $unwind: "$threads"},
                { $replaceRoot: {newRoot: "$$ROOT.threads"}},
                { $lookup: {
                    from: "replies",
                    localField: "replies",
                    foreignField: "_id",
                    as: "replies"
                }},
                { $addFields: {replycount: {$size: "$replies"}}},
                // { $unset: "$replies.$.delete_password"},
                { $project: {
                    _id: "$_id",
                    text:  "$text",
                    created_on: "$created_on",
                    bumped_on: "$bumped_on",
                    reported: "$reported",
                    replies: "$replies",
                    replycount: "$replycount",
                }},
                {$sort: {bumped_on: -1}},
                {$limit: 10}
            ])

            res.json(boardThread);
        } catch (error) {
            res.status(400).json({message: error.message});
        }
    });

    threadRoute.put(async(req, res) => {
        try {
            let {report_id} = req.body;
            
            await Thread.findByIdAndUpdate(report_id, {$set: {reported: true, bumped_on: new Date()}})

            res.send("Success");
        } catch (error) {
            res.status(400).json({message: error.message});
        }
    });

    threadRoute.delete(async(req, res) => {
        try {
            let {board} = req.params
            let {thread_id, delete_password} = req.body;
            
            let dbThread = await Thread.findById(thread_id);

            if(dbThread.delete_password !== delete_password){
                return res.status(400).send("Incorrect Password")
            }

            await Thread.findByIdAndDelete(thread_id)

            await Board.updateOne({name: board}, {$pull: {threads: thread_id}})

            res.send("Success");
        } catch (error) {
            res.status(400).json({message: error.message});
        }
    });
    
    let replyRoute = app.route('/api/replies/:board');

    replyRoute.post(async(req, res) => {
        try {
            let {thread_id, text, delete_password} = req.body;


            let reply = await Reply.create({text, delete_password});

            await Thread.findByIdAndUpdate(thread_id, {$addToSet: {replies: reply._id}});

            res.status(201).json(reply);
        } catch (error) {
            res.status(400).json({message: error.message});
        }
    });

    replyRoute.get(async(req, res) => {
        try {
            let {thread_id} = req.query;
            let [threadReply] = await Thread.aggregate([
                { $match: {_id: ObjectId(thread_id)}},
                { $lookup: {
                    from: "replies",
                    localField: "replies",
                    foreignField: "_id",
                    as: "replies"
                }},
                { $project: {
                    _id: "$_id",
                    text:  "$text",
                    created_on: "$created_on",
                    bumped_on: "$bumped_on",
                    reported: "$reported",
                    replies: "$replies",
                    replycount: "$replycount",
                }},
            ])

            res.json(threadReply);
        } catch (error) {
            res.status(400).json({message: error.message});
        }
    });

    replyRoute.put(async(req, res) => {
        try {
            let {reply_id} = req.body;
            
            await Reply.findByIdAndUpdate(reply_id, {$set: {reported: true, bumped_on: new Date()}})

            res.send("Success");
        } catch (error) {
            res.status(400).json({message: error.message});
        }
    });

    replyRoute.delete(async(req, res) => {
        try {
            let {thread_id, reply_id, delete_password} = req.body;
            
            let dbReply = await Reply.findById(reply_id);

            if(dbReply.delete_password !== delete_password){
                return res.status(400).send("Incorrect Password")
            }

            await Reply.findByIdAndDelete(reply_id)

            await Thread.findByIdAndUpdate(thread_id, {$pull: {replies: reply_id}})

            res.send("Success");
        } catch (error) {
            res.status(400).json({message: error.message});
        }
    });
};
