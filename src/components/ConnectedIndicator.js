import React, {useEffect, useState} from 'react';

const ConnectedIndicator = ({connected}) => {

    const SIZE = '15px'

    const [colour, setColour] = useState('rgba(255, 0, 0, 0.7)')

    const style = {
        backgroundColor: colour,
        borderRadius: '50%',
        height: SIZE,
        width: SIZE,
        boxShadow: `0 2px 10px ${colour}`
    }

    useEffect(() => {
        if (!connected) {
            setColour('rgba(255, 0, 0, 0.7)')

        } else {
            setColour('rgba(0, 255, 0, 0.7)')
        }
    }, [connected])

    return (
        <div className="connected-indicator flex">
            <div className="connected-text">{connected ? 'Online' : 'Offline'}</div>
            <div style={style} className="connected-light"/>
        </div>
    );
};

export default ConnectedIndicator;