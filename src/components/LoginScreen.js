import React from 'react';
import ConnectedIndicator from "./ConnectedIndicator";

const LoginScreen = ({connected, handleSubmit, inputClasses, roomName, userName, handleChange}) => {
    return (
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
    );
};

export default LoginScreen;