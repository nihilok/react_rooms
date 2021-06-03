import io from "socket.io-client";

const ENDPOINT = "XX:XX:XX:XX:8000";
// const ENDPOINT = "localhost:5000";


export const socketio = io(ENDPOINT);