import React, {useState, useEffect, useRef} from "react";
import ClickableLetter from "./ClickableLetter";

const GameScreen = ({socket, roomData, host}) => {

    const [gameInput, setGameInput] = useState('')
    const [words, setWords] = useState([])
    const [wordString, setWordString] = useState('')
    const [anagramObj, setAnagramObj] = useState({
        word: '',
        anagram: ''
    })


    const handleSubmit = (e) => {
        setWords(words => [...words, gameInput])
        socket.current.emit('check_word', roomData.room_name, anagramObj.word, anagramObj.anagram, gameInput)
        e.preventDefault();
    }

    const handleChange = async (e) => {
        const input = e.target.value
        setGameInput(input);
    }


    const getWord = () => {
        socket.current.emit('get_word', roomData.room_name)
    }

    useEffect(() => {
        setWordString(words.join(', '))
        setGameInput('')
        socket.current.on('receive_word', (data) => {
            if (data.room_name === roomData.room_name) {
                if (data.message) {
                    return setAnagramObj(anagramObj => ({
                        ...anagramObj,
                        anagram: data.message
                    }))
                } else {
                    setAnagramObj(data)
                }
            }

        })
    }, [words, socket, roomData.room_name])

    const anagramArray = anagramObj.anagram.split('')

    const [anagramTest, setAnagramTest] = useState([])

    const submissionFunc = (letter) => {
        setAnagramTest(anagramTest => [...anagramTest, letter])
    }

    const retractionFunc = (letter) => {
        setAnagramTest(anagramArray => anagramArray.filter((item, i) => i !== anagramArray.length - 1))
    }

    return (
        <div className="game-screen flex">

            <div className="game-screen-section">
                <div className="game">
                    <div>{wordString}</div>
                    <h1>{anagramObj.anagram}</h1>
                    {host ? <div className="flex flex-center">
                        <button onClick={getWord} className="btn btn-primary btn-round send-btn">GET</button>
                    </div> : ''}
                    <div>{anagramTest.join('')}</div>
                </div>
            </div>
            <div className="game-screen-section controls">
                {/*<form onSubmit={handleSubmit} className="flex"><input type="text" onChange={handleChange}*/}
                {/*                                                      value={gameInput}*/}
                {/*                                                      required/>*/}
                {/*    <button type="submit" className="btn btn-primary btn-round send-btn"> >>></button>*/}
                {/*</form>*/}
                {anagramArray.map((letter) => (
                    <ClickableLetter letter={letter} submissionFunc={submissionFunc} retractionFunc={retractionFunc}/>
                ))}

            </div>
        </div>
    );
}


export default GameScreen;