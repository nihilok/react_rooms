import React, {useState, useEffect, useRef, useCallback} from "react";
import {socketio} from "../service/socket";
import ConnectedIndicator from "./ConnectedIndicator";
import PlayersMenu from "./PlayersMenu";
import GameScreen from "./GameScreen";

const WebSocketRoom = () => {

        const socket = useRef(null)
        const menu = useRef(null)
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
        const [menuState, setMenuState] = useState('Menu')


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
            showHideMenu();
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
                    console.log('token changed')
                }
                setConnected(true)
            })
        }, [token])

        const showHideMenu = () => {
            if (menu.current.style.transform === 'translateY(0px)') {
                setMenuState('Menu')
                menu.current.style.transform = 'translateY(100%)';
            } else {
                setMenuState('Hide')
                menu.current.style.transform = 'translateY(0px)';
            }
        }

        useEffect(() => {
            socket.current = socketio;
            socket.current.on("connect", () => {
                handleToken();
            });
            socket.current.on("connect_error", (e) => {
                console.log(e.message);
            })
            socket.current.on("disconnect", () => {
                setConnected(false);
                setInRoom(false);
                window.location.reload();
            });
            socket.current.on("update room", (data) => {
                if (checkRoomName(data.room_name)) {
                    setRoomData(roomData => ({
                        ...roomData,
                        room_name: data.room_name,
                        players: data.players,
                        host: data.host
                    }));
                    console.log(data.players)
                }
            });

        }, [checkRoomName, handleToken]);


        return (
            <div className="login-screen">


                {!inRoom ? (
                    <>
                        <ConnectedIndicator connected={connected}/>
                        <form onSubmit={handleSubmit} className={"join-room-form flex-col flex-center"}>
                            <div className={inputClasses.room}><input type="text" value={roomName}
                                                                      onChange={handleChange}
                                                                      placeholder="Room Name" name="roomName" required/>
                            </div>
                            <div className={inputClasses.user}><input type="text" value={userName}
                                                                      onChange={handleChange}
                                                                      placeholder="Nickname" name="userName" required/>
                            </div>
                            <input type="submit" value="Join/Create Room" className="btn"/>
                        </form>
                    </>
                ) : roomData ? (
                    <>
                        <button className="btn btn-primary btn-round" onClick={showHideMenu} style={{
                            position: 'fixed',
                            right: '.5rem',
                            bottom: '.5rem',
                            margin: '1rem auto 1rem 1rem',
                            zIndex: 9999
                        }}>{menuState}</button>
                        <PlayersMenu roomData={roomData} setRoomData={setRoomData} onLeave={leaveRoom} myRef={menu}/>
                        <GameScreen/>
                    </>
                ) : ''}
                {/*{response ? <div>{response}</div> : <div>'No response'</div>}*/}

            </div>
        );
    }
;


export default WebSocketRoom;