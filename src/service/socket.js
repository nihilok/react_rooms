import io from "socket.io-client";

const ENDPOINT = "86.129.91.108:8000";
// const ENDPOINT = "localhost:5000";


export const socketio = io(ENDPOINT);