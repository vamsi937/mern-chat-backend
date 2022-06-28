const express=require("express");
const dotenv=require("dotenv");
const colors=require("colors");
const cors=require("cors");
const path=require("path");
const connectDB = require("./config/db");
const userRoutes=require("./routes/userRoutes");
const chatRoutes=require("./routes/chatRoutes");
const messageRoutes=require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app=express();

app.use(cors());
app.use(express.json()); //to accept JSON data  

dotenv.config();
connectDB();

const PORT=process.env.PORT || 5000;

app.get("/",(req,res)=>{
    res.send("API is running");
})

app.use("/api/user",userRoutes);
app.use("/api/chats",chatRoutes);
app.use("/api/messages",messageRoutes);


// ------------------- Deployment ------------------
// const __dirname1=path.resolve();
// if(process.env.NODE_ENV==="production"){
//     app.use(express.static(path.join(__dirname1,"/frontend/build")));

//     app.get("*",(req,res)=>{
//         res.sendFile(path.resolve(__dirname1,"frontend","build","index.html"));
//     })
// }else{
// }

//---------------------Deployment ------------------

app.get("/", (req, res) => {
  res.send("API is Running successfully");
});


app.use(notFound);

app.use(errorHandler);

const server=app.listen(PORT, console.log(`Server running on PORT: ${PORT}`.yellow.bold));

const io = require("socket.io")(server, {
  pingTimeout: 60000, //ms
  cors: {
    origin: ["http://localhost:3000", "https://talk-mern-chat.netlify.app"],
  },
});

io.on("connection",(socket)=>{
    console.log("Connected to socket.io");

    socket.on("setup",(userData)=>{
        socket.join(userData._id);
        socket.emit("connected");
    });

    socket.on("join chat",(room)=>{
        socket.join(room);
        console.log("User Joined Room: "+room);
    });

    socket.on("typing", (room) => socket.in(room).emit("typing"));

    socket.on("stop typing",(room)=>socket.in(room).emit("stop typing"));

    socket.on("new message",(newMessageReceived)=>{
        var chat = newMessageReceived.chat;

        if(!chat.users) return console.log("chat.users not defined");

        chat.users.forEach(user=>{
            if(user._id===newMessageReceived.sender._id) return;

            socket.in(user._id).emit("message received",newMessageReceived);
        })
    });

    socket.off("setup",()=>{
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
    })
})