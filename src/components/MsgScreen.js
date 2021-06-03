import React, {useState, useEffect, useRef} from "react";
import ClickableLetter from "./ClickableLetter";

const MsgScreen = ({socket, roomData, playerData, username, scrollRef}) => {

    const [gameInput, setGameInput] = useState('')

    const handleSubmit = (e) => {
        socket.current.emit('send_message', roomData.room_name, {sender: playerData.username, msg: gameInput})
        setGameInput('')
        e.preventDefault();
    }

    const handleChange = async (e) => {
        const input = e.target.value
        setGameInput(input);
    }

    useEffect(() => {
        setGameInput('')
        console.log(username)
    }, [username])


    return (
        <div className="game-screen flex">

            <div className="game-screen-section" ref={scrollRef}>
                <div className="game" >
                    {roomData.messages.map(msg => (
                        <>
                            {(msg.sender !== username) ?
                                <div className="message flex-col">
                                    <div className="message-meta">{msg.sender} - {new Date(msg.time * 1000).getHours() + ':' + new Date(msg.time * 1000).getMinutes()}</div>
                                    <div className="message-body">{msg.msg}</div>
                                </div> :
                                <div className="message flex-col own-message">
                                    <div className="message-meta">{msg.sender} - {new Date(msg.time * 1000).getHours() + ':' + new Date(msg.time * 1000).getMinutes()}</div>
                                    <div className="message-body">{msg.msg}</div>
                                </div>}
                        </>
                    ))}
                </div>
            </div>
            <div className="game-screen-section controls">
                <form onSubmit={handleSubmit} className="flex"><input type="text" onChange={handleChange}
                                                                      value={gameInput}
                                                                      required/>
                    <button type="submit" className="btn btn-primary btn-round send-btn"> >>></button>
                </form>

            </div>
        </div>
    );
}


export default MsgScreen;