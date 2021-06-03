import React, {useState, useEffect, useRef, useCallback} from "react";
import {socketio} from "../service/socket";
import ConnectedIndicator from "./ConnectedIndicator";
import PlayersMenu from "./PlayersMenu";
import GameScreen from "./GameScreen";
import {useSwipeable} from "react-swipeable";
import LoginScreen from "./LoginScreen";
import MsgScreen from "./MsgScreen";


const WebSocketRoom = () => {

    const socket = useRef(null)
    const menu = useRef(null)
    const scrollRef = useRef(null)
    const [roomName, setRoomName] = useState('')
    const [userName, setUserName] = useState('')
    const [connected, setConnected] = useState(false)
    const [inRoom, setInRoom] = useState(false)
    const initialRoomData = {
        room_name: '',
        players: [],
        messages: [],
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
            menu.current.style.transform = 'translateY(95%)';
            menu.current.style.zIndex = 100;
        }
    }

    const showMenu = () => {
        if (menu.current.style.transform === 'translateY(95%)')
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
                    host: data.host,
                    messages: data.messages
                }));
                checkHost(data.host);
            }
            if (scrollRef.current) {
                scrollRef.current.scroll(0, scrollRef.current.scrollHeight);
            }
        });

    }, [checkRoomName, checkHost, handleConnect]);


    return (
        <div className="login-screen">


            {!inRoom ? (
                <LoginScreen connected={connected}
                             roomName={roomName}
                             handleSubmit={handleSubmit}
                             handleChange={handleChange}
                             userName={userName}
                             inputClasses={inputClasses}/>
            ) : roomData ? (
                <div style={{
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <PlayersMenu roomData={roomData} setRoomData={setRoomData} onLeave={leaveRoom} myRef={menu}
                                 hideMenu={hideMenu}/>
                    <MsgScreen socket={socket} roomData={roomData} playerData={playerData} username={userName} scrollRef={scrollRef}/>
                    <div className="swipe-area" {...handlers}/>
                </div>
            ) : ''}
        </div>
    );
}


export default WebSocketRoom;