import React from 'react';
import './components.css'

const PlayersMenu = ({roomData, setRoomData, onLeave, myRef}) => {
    return (
        <div className="players-menu flex-col" ref={myRef}>
            <h1>React Socket Room</h1>
            <div className="room-data">
                <div className="info-panel flex-col" ><div><span className="text-bold menu-heading">Room Name:</span> {roomData.room_name}</div><div><span className="text-bold menu-heading">Host:</span>{roomData.host}</div></div>
                <div className="info-panel players-list"><span className="text-bold menu-heading">Players:</span> {roomData.players.map((player, index) => {
                    return (
                        <div className="player" key={player.username}>{player.connected ? player.username :
                            <strike>{player.username}</strike>}</div>
                    )
                })}</div>

            </div>
            <button onClick={onLeave} className="btn w-max-content mx-auto my-2">Leave Room</button>
        </div>
    );
};

export default PlayersMenu;