import React, {useState, useEffect, useRef, useCallback} from "react";
import {socketio} from "../service/socket";
import ConnectedIndicator from "./ConnectedIndicator";
import PlayersMenu from "./PlayersMenu";
import GameScreen from "./GameScreen";
import {useSwipeable} from "react-swipeable";


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
    const initialPlayerData = {
        username: '',
        room: '',
        token: '',
        host:  true
    }
    const [playerData, setPlayerData] = useState(initialPlayerData)
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
                // console.log(data)
                setRoomData(data.room);
                setPlayerData(playerData => ({
                    ...playerData,
                    username: data.player.username,
                    room: data.player.room,
                    token: data.player.token,
                    host: data.player.host
                }))
                checkHost(data.room.host, data.player.username)
                setInRoom(true);
            } else {
                alert(data.message);
            }
        });
    }

    const leaveRoom = () => {
        hideMenu();
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



    const hideMenu = () => {
        if (menu.current.style.transform === 'translateY(0px)') {
            setMenuState('hidden')
            menu.current.style.transform = 'translateY(90%)';
            menu.current.style.zIndex = 100;
        }
    }

    const showMenu = () => {
        if (menu.current.style.transform === 'translateY(90%)')
            setMenuState('open')
        menu.current.style.transform = 'translateY(0px)';
        menu.current.style.zIndex = 102;

    }

    const handlers = useSwipeable({
        onSwiped: (eventData) => {
            const offset = eventData.deltaY
            if (offset < 0) {
                showMenu();
            }
        },
        preventDefaultTouchmoveEvent: true
    })

    const checkHost = useCallback((host, username=playerData.username) => {
        // console.log(host)
        // console.log(username)
        if (host === username) {
            setPlayerData(playerData => ({
                ...playerData,
                host: true
            }))
        } else {
            setPlayerData(playerData => ({
                ...playerData,
                host: false
            }))
        }
    }, [playerData.username])


    const handleConnect = useCallback((data) => {
        if (data.token !== localStorage.getItem('token')) {
            localStorage.setItem('token', data.token);
            console.log('token added/changed')
        }
        setToken(data.token);
        setPlayerData(playerData => ({
            ...playerData,
            token: data.token
        }))
        setConnected(true)
    }, [])


    useEffect(() => {
        socket.current = socketio;
        socket.current.on("connected", (data) => {
            handleConnect(data);
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
                checkHost(data.host);
            }

        });

    }, [checkRoomName, checkHost, handleConnect]);


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
                <div style={{
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <PlayersMenu roomData={roomData} setRoomData={setRoomData} onLeave={leaveRoom} myRef={menu}
                                 hideMenu={hideMenu}/>
                    <GameScreen socket={socket} roomData={roomData} host={playerData.host}/>
                    <div className="swipe-area" {...handlers}/>
                </div>
            ) : ''}
        </div>
    );
}


export default WebSocketRoom;