import React, {useState, useEffect, useRef, useCallback} from "react";
import socketIOClient from "socket.io-client";
import ConnectedIndicator from "./ConnectedIndicator";

const ENDPOINT = "192.168.1.95:8000";

const WebSocket = () => {

        const socket = useRef(null)
        const [roomName, setRoomName] = useState('')
        const [userName, setUserName] = useState('')
        const [connected, setConnected] = useState(false)
        const [inRoom, setInRoom] = useState(false)
        const initialRoomData = {
            room_name: '',
            players: [],
            host: ''
        }
        const [roomData, setRoomData] = useState(initialRoomData)
        const initialInputClass = "helper-text flex"
        const initialInputClasses = {user: initialInputClass, room: initialInputClass}
        const [inputClasses, setInputClasses] = useState(initialInputClasses)
        const [token, setToken] = useState(null)


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
            socket.current.emit("new_player", roomName, userName, localStorage.getItem('token'), (data) => {
                if (!data.message) {
                    setRoomData(data);
                    setInRoom(true);
                } else {
                    alert(data.message);
                }
            });
        }

        const leaveRoom = () => {
            console.log(token)
            socket.current.emit('leave_room', roomName, token, () => {
                setInRoom(false);
                setRoomData(initialRoomData)
            })

        }

        const checkRoomName = useCallback((roomName) => {
            if (roomName === roomData.room_name) {
                return true
            }
        }, [roomData.room_name])

        const handleToken = useCallback(() => {
            socket.current.emit('get_token', (data) => {
                setToken(data);
                if (data !== localStorage.getItem('token')) {
                    console.log(token)
                    console.log(data)
                    localStorage.setItem('token', data);
                }
                setConnected(true)
            })
        }, [token])

        useEffect(() => {
            socket.current = socketIOClient(ENDPOINT);
            socket.current.on("connect", () => {
                handleToken();
            });
            socket.current.on("connect_error", (e) => {
                console.log(e.message);
            })
            socket.current.on("disconnect", () => {
                setConnected(false);
                setInRoom(false);
            });
            socket.current.on("update room", (data) => {
                if (checkRoomName(data.room_name)) {
                    setRoomData(roomData => ({
                        ...roomData,
                        room_name: data.room_name,
                        players: data.players
                    }));
                }
            });
            // return () => {
            //     if (inRoom) {
            //         console.log('leaving room');
            //         socket.emit('client_disconnect')
            //     }
            // }

        }, [checkRoomName, handleToken]);


        return (
            <div className="login-screen">
                <ConnectedIndicator connected={connected}/>
                {!inRoom ? (
                    <form onSubmit={handleSubmit} className={"join-room-form flex-col flex-center"}>
                        <div className={inputClasses.room}><input type="text" value={roomName} onChange={handleChange}
                                                                  placeholder="Room Name" name="roomName" required/></div>
                        <div className={inputClasses.user}><input type="text" value={userName} onChange={handleChange}
                                                                  placeholder="Nickname" name="userName" required/></div>
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
                        <button onClick={leaveRoom} className="btn w-max-content mx-auto">Leave Room</button>
                    </div>
                ) : ''}
                {/*{response ? <div>{response}</div> : <div>'No response'</div>}*/}

            </div>
        );
    }
;


export default WebSocket;