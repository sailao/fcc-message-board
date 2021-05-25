const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    const board = "my board";
    const text = "my thread";
    const reply_text = "my reply";
    const delete_password = "my password";

    const createThread = () => {
        return new Promise((resolve, reject) => {
            chai.request(server)
            .post(`/api/threads/${board}`)
            .set("content-type", "application/json")
            .send({text, delete_password})
            .end((err, res) => {
                if(err) return reject(err)
                resolve(res.body)
            })
        });
    }

    const deleteThread = (thread_id) => {
        return new Promise((resolve, reject) => {
            chai.request(server)
            .delete(`/api/threads/${board}`)
            .set("content-type", "application/json")
            .send({thread_id, delete_password})
            .end((err, res) => {
                if(err) return reject(err)
                resolve(res.body)
            })
        });
    }

    const createReply = (thread_id) => {
        return new Promise((resolve, reject) => {
            chai.request(server)
            .post(`/api/replies/${board}`)
            .set("content-type", "application/json")
            .send({thread_id, text: reply_text, delete_password})
            .end((err, res) => {
                if(err) return reject(err)
                resolve(res.body)
            })
        });
    }

    test("Creating a new thread: POST request to /api/threads/{board}", (done) => {
        chai.request(server)
        .post(`/api/threads/${board}`)
        .set("content-type", "application/json")
        .send({text, delete_password})
        .end((err, res) => {
            assert.equal(res.status, 201)
            assert.equal(res.body.text, text)
            assert.equal(res.body.reported, false)
            done()
        })
    })

    test("Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}", (done) => {
        chai.request(server)
        .get(`/api/threads/${board}`)
        .set("content-type", "application/json")
        .send({text, delete_password})
        .end((err, res) => {
            assert.equal(res.status, 200)
            assert.exists(res.body[0], 'exist thread')
            assert.equal(res.body[0].text, text)
            assert.equal(res.body[0].reported, false)
            done()
        })
    })

    test("Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password", async() => {
        let newThread = await createThread();
        
        chai.request(server)
        .delete(`/api/threads/${board}`)
        .set("content-type", "application/json")
        .send({thread_id: newThread._id, delete_password: "incorrect"})
        .end(async(err, res) => {
            assert.equal(res.status, 400)
            assert.equal(res.text, "Incorrect Password")
            await deleteThread(newThread._id)
        })
    })

    test("Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password", async() => {
        let newThread = await createThread();

        chai.request(server)
        .delete(`/api/threads/${board}`)
        .set("content-type", "application/json")
        .send({thread_id: newThread._id, delete_password})
        .end((err, res) => {
            assert.equal(res.status, 200)
            assert.equal(res.text, "Success")
        })
    })
    
    test("Reporting a thread: PUT request to /api/threads/{board}", async() => {
        let newThread = await createThread();

        chai.request(server)
        .put(`/api/threads/${board}`)
        .set("content-type", "application/json")
        .send({report_id: newThread._id})
        .end((err, res) => {
            assert.equal(res.status, 200)
            assert.equal(res.text, "Success")
        })
    })

    test("Creating a new reply: POST request to /api/replies/{board}", async() => {
        let newThread = await createThread();

        chai.request(server)
        .post(`/api/replies/${board}`)
        .set("content-type", "application/json")
        .send({thread_id: newThread._id, text: reply_text, delete_password})
        .end((err, res) => {
            assert.equal(res.status, 201)
            assert.equal(res.body.text, reply_text)
            assert.equal(res.body.reported, false)
        })
    })

    test("Viewing a single thread with all replies: GET request to /api/replies/{board}", async() => {
        let newThread = await createThread();
        let newReply = await createReply(newThread._id);
        
        chai.request(server)
        .get(`/api/replies/${board}`)
        .set("content-type", "application/json")
        .query({thread_id: newThread._id})
        .end((err, res) => {
            expect(res).to.be.json;
            expect(res).to.have.status(200);
            assert.equal(res.body._id, newThread._id)
            assert.equal(res.body.text, text)
            assert.equal(res.body.replies[0]._id, newReply._id)
            assert.equal(res.body.replies[0].text, reply_text)
        })
    })

    test("Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password", async() => {
        let newThread = await createThread();
        let newReply = await createReply(newThread._id);

        chai.request(server)
        .delete(`/api/replies/${board}`)
        .set("content-type", "application/json")
        .send({thread_id: newThread._id, reply_id: newReply._id, delete_password: "incorrect"})
        .end(async(err, res) => {
            assert.equal(res.status, 400)
            assert.equal(res.text, "Incorrect Password")
            await deleteThread(newThread._id)
        })
    })

    test("Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password", async() => {
        let newThread = await createThread();
        let newReply = await createReply(newThread._id);

        chai.request(server)
        .delete(`/api/replies/${board}`)
        .set("content-type", "application/json")
        .send({thread_id: newThread._id, reply_id: newReply._id, delete_password})
        .end((err, res) => {
            assert.equal(res.status, 200)
            assert.equal(res.text, "Success")
        })
    })
    
    test("Reporting a reply: PUT request to /api/replies/{board}", async() => {
        let newThread = await createThread();
        let newReply = await createReply(newThread._id);

        chai.request(server)
        .put(`/api/replies/${board}`)
        .set("content-type", "application/json")
        .send({reply_id: newReply._id})
        .end((err, res) => {
            assert.equal(res.status, 200)
            assert.equal(res.text, "Success")
        })
    })
});
