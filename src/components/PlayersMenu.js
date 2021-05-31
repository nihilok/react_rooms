import React from 'react';
import './components.css'
import {useSwipeable} from "react-swipeable";
import logo from '../logo.png'

const PlayersMenu = ({roomData, setRoomData, onLeave, myRef, hideMenu}) => {

    const handlers = useSwipeable({
        onSwiped: (eventData) => {
            const offset = eventData.deltaY
            if (offset > 0) {
                hideMenu();
            }
        },
        preventDefaultTouchmoveEvent: true
    })

    const refPassthrough = (el) => {
        // from react-swipeable docs:
        // call useSwipeable ref prop with el
        handlers.ref(el);

        // set myRef el so you can access it yourself
        myRef.current = el;
    }

    return (
        <div className="players-menu flex-col flex-center" {...handlers} ref={refPassthrough}>
            <img src={logo} alt="" className="logo"/>
            <div className="room-data">
                <div className="info-panel flex-col">
                    <div><span className="text-bold menu-heading">Room Name:</span> {roomData.room_name}</div>
                    <div><span className="text-bold menu-heading">Host:</span>{roomData.host}</div>
                    <div><span
                        className="text-bold menu-heading">Players:</span>
                        <ul>
                            {roomData.players.map((player, index) => {
                                return (
                                    <li className="player" key={player.username}>{player.connected ? player.username :
                                        <strike>{player.username}</strike>}</li>
                                )
                            })}
                        </ul>
                    </div>

                </div>
                <button onClick={onLeave} className="btn w-max-content danger mx-auto my-2">Leave Room</button>
            </div>
        </div>
    );
};

export default PlayersMenu;