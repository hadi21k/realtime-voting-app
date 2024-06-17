import express from "express"
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import Redis from "ioredis"


const app = express();

app.use(cors());

const server = http.createServer(app);

const pub = new Redis(process.env.REDIS_URL);
const sub = new Redis(process.env.REDIS_URL);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true,
    }
});

sub.on("message", (channel, message) => {
    io.to(channel).emit("room-update", message)
})

sub.on("error", (error) => {
    console.error(error)
})

io.on("connection", async (socket) => {
    const { id } = socket;

    socket.on("join-room", async (room: string) => {
        console.log(`User ${id} joined room ${room}`);

        const subscribedRooms = await pub.smembers("subscribed-rooms")
        await socket.join(room)
        await pub.sadd(`rooms:${id}`, room);
        await pub.hincrby("room-connections", room, 1);

        if (!subscribedRooms.includes(room)) {
            sub.subscribe(room, async (err) => {
                if (err) {
                    console.error(err)
                } else {
                    await pub.sadd("subscribed-rooms", room)

                    console.log(`Subscribed to room ${room}`)
                }
            })
        }
    })

    socket.on("disconnect", async () => {
        const { id } = socket

        const joinedRooms = await pub.smembers(`room:${id}`);
        await pub.del(`room:${id}`);

        joinedRooms.forEach(async (room) => {
            const remainingConnection = await pub.hincrby("room-connections", room, -1);

            if (remainingConnection <= 0) {
                await pub.hdel(`room-connections`, room);

                sub.unsubscribe(room, async (err) => {
                    if (err) {
                        console.error(err)
                    } else {
                        await pub.srem("subscribed-rooms", room);
                        console.log(`Unsubscribed from room ${room}`)
                    }
                })
            }
        })
    })
})

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
    console.log("Server is running on port 8000")
})