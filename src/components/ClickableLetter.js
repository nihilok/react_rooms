import React, {useState} from 'react';

const ClickableLetter = ({letter, submissionFunc, retractionFunc}) => {

    const [clicked, setClicked] = useState(false);

    const className = `clickable-letter`;

    const toggleClicked = (e) => {
        if (clicked) {
            setClicked(false);
            e.target.style.transform = 'translate(0px, 0px)';
            retractionFunc(letter);
        } else {
            setClicked(true);
            e.target.style.transform = 'translate(0px, -10px)';
            submissionFunc(letter);
        }
    }

    return (
        <div className={className} onClick={toggleClicked}>
            {letter}
        </div>
    );
};

export default ClickableLetter;