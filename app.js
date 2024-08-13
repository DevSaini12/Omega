const express = require("express")
const SocketIO = require("socket.io")
const http = require("http")
const path = require("path")
const app = express()
const server = http.createServer(app)
const io = SocketIO(server)

app.use(express.static(path.join(__dirname, "public")))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set("view engine", "ejs")
require("dotenv").config()

let waitingUser = []
let room = {}

io.on("connection", (socket) => {
    let roomName;
    socket.on("joinroom", () => {
        if (waitingUser.length > 0) {
            let partner = waitingUser.shift()
            roomName = `${socket.id}-${partner.id}`
            socket.join(roomName)
            partner.join(roomName)
            io.to(roomName).emit("joined", roomName)
        } else {
            waitingUser.push(socket)
        }
    })
    socket.on("disconnect", () => {
        let removePerson = waitingUser.findIndex((waitingUserID) => waitingUserID.id === socket.id)
        waitingUser.splice(removePerson, 1)
    })

    socket.on("message", (data) => {
        socket.broadcast.to(data.room).emit("message", data.message)
    })

    socket.on("signalingMessage", function (data) {
        socket.broadcast.to(data.room).emit("signalingMessage", data.message)
    })
    socket.on("startVideoCall", ({ room }) => {
        socket.broadcast.to(room).emit("incomingCall")
    })
    socket.on("acceptCall", ({ room }) => {
        socket.broadcast.to(room).emit("callAccepted")
    })

})





app.get("/", (req, res) => {
    res.render("index")
})
app.get("/chat", (req, res) => {
    res.render("chat")
})

server.listen(process.env.PORT)