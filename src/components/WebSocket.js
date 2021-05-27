import React, {useState, useEffect, useRef} from "react";
import socketIOClient from "socket.io-client";
import ConnectedIndicator from "./ConnectedIndicator";

const ENDPOINT = "192.168.1.95:8000";

const WebSocket = () => {

    const socket = useRef(null)
    const [roomName, setRoomName] = useState('')
    const [userName, setUserName] = useState('')
    const [connected, setConnected] = useState(false)
    const [inRoom, setInRoom] = useState(false)
    const [roomData, setRoomData] = useState({})
    const initialInputClass = "helper-text flex"
    const initialInputClasses = {user: initialInputClass, room: initialInputClass}
    const [inputClasses, setInputClasses] = useState(initialInputClasses)


    const handleChange = (e) => {
        switch (e.target.name) {
            default:
                return
            case "userName":
                setUserName(e.target.value);
                if (e.target.value) {
                    setInputClasses(() => ({
                        ...inputClasses,
                        user: initialInputClass + ' user'
                    }))
                } else {
                    setInputClasses(() => ({
                        ...inputClasses,
                        user: initialInputClass
                    }))
                }
                break;
            case "roomName":
                setRoomName(e.target.value);
                if (e.target.value) {
                    setInputClasses(() => ({
                        ...inputClasses,
                        room: initialInputClass + ' room'
                    }))
                } else {
                    setInputClasses(() => ({
                        ...inputClasses,
                        room: initialInputClass
                    }))
                }
                break;
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        joinCreateRoom();
    }

    const joinCreateRoom = () => {
        socket.current.emit("new_player", roomName, userName, (data) => {
            setRoomData(data);
            setInRoom(true);
        });
    }

    const checkRoomName = (roomName) => {
        if (roomName === roomData.room_name) {
            return true
        }
    }

    useEffect(() => {
        socket.current = socketIOClient(ENDPOINT);
        socket.current.on("connect", () => {
            setConnected(true);
        });
        socket.current.on("disconnect", () => {
            setConnected(false);
            setInRoom(false);
        });
        socket.current.on("update room", (data) => {
            console.log(data.room_name === roomData.room_name)
            if (data.room_name === roomData.room_name) {
            setRoomData(roomData => ({
                ...roomData,
                players: data.players
            }));
            }
        });

    }, []);


    return (
        <div className="login-screen">
            <ConnectedIndicator connected={connected}/>
            {!inRoom ? (
                <form onSubmit={handleSubmit} className={"join-room-form flex-col flex-center"}>
                    <div className={inputClasses.room}><input type="text" value={roomName} onChange={handleChange}
                                                              placeholder="Room Name" name="roomName"/></div>
                    <div className={inputClasses.user}><input type="text" value={userName} onChange={handleChange}
                                                              placeholder="Nickname" name="userName"/></div>
                    <input type="submit" value="Join/Create Room"/>
                </form>
            ) : roomData ? (
                <div className="room-data">
                    <div>Room Name: {roomData.room_name}</div>
                    <div>Host: {roomData.host}</div>
                    <div>Players: {roomData.players.map((player, index) => {
                        return (
                            <div key={player.username}>{player.connected ? player.username :
                                <strike>{player.username}</strike>}</div>
                        )
                    })}</div>
                </div>
            ) : ''}
            {/*{response ? <div>{response}</div> : <div>'No response'</div>}*/}

        </div>
);
}
;


export default WebSocket;