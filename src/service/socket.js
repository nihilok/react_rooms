import io from "socket.io-client";

const ENDPOINT = "192.168.1.95:8000";
// const ENDPOINT = "localhost:5000";


export const socketio = io(ENDPOINT);