'use client';

import React, { useState, useEffect } from "react";
import { WORDS } from "../../lib/constants";
import Layout from "../../components/layout";


/**
 * WordGuesser component for playing a word guessing game.
 */
export default function WordGuesser({preview}) {
    // State variables
    const [isClient, setIsClient] = useState(false);
    const [inputValue, setInputValue] = useState(""); // User input value
    const [wordList, setWordList] = useState<string[]>([]); // List of entered words
    const [enteredWord, setEnteredWord] = useState<JSX.Element | undefined>(undefined); // Display of entered words
    const [wordOfTheDay, setWordOfTheDay] = useState<string>(""); // Word of the day
    const [wordifiedWord, setWordifiedWord] = useState<string>(""); // Word of the day with hints
    const [win, setWin] = useState<boolean>(false); // Flag for winning state
    const [attempts, setAttempts] = useState<number>(1); // Number of attempts

    // Initialize the game with a random word
    useEffect(() => {
        const randomWord = getRandomWord(WORDS);
        setWordOfTheDay(randomWord);
        setWordifiedWord(WORDS.get(randomWord) || "");
        setIsClient(true);
    }, []);

    // Ensure client is set to true
    useEffect(() => {
        setIsClient(true);  
    }, []);

    /**
     * Get a random word from a collection.
     * @param collection - The collection of words.
     * @returns A random word.
     */
    function getRandomWord(collection: Map<string, string>): string {
        const keys = Array.from(collection.keys());
        return keys[Math.floor(Math.random() * keys.length)];
    }

    /**
     * Handle submission of the word.
     * @param event - The button click event.
     */
    const handleWordifySubmit = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (inputValue.length != 5) {
            alert("Please enter a 5 letter word");
        } else if (confirmWord()) {
            setWordList(prev => {
                const updatedList = [...prev, inputValue.toLocaleUpperCase()];
                setEnteredWord(breakOutInput(updatedList));
                return updatedList;
            });
            setWin(true);
        } else {
            setWordList(prev => {
                const updatedList = [...prev, inputValue.toLocaleUpperCase()];
                setEnteredWord(breakOutInput(updatedList));
                return updatedList;
            });
            setInputValue("");
            setAttempts(attempts + 1);
        }
    }

    /**
     * Check if the entered word matches the word of the day.
     * @returns True if the word is correct, false otherwise.
     */
    function confirmWord(): boolean {
        if (inputValue.toLocaleUpperCase() === wordOfTheDay) {
            return true;
        }
        return false;
    }

    /**
     * Display the entered words with styling.
     * @param listOfWords - The list of entered words.
     * @returns JSX element displaying the entered words.
     */
    function breakOutInput(listOfWords: string[]): JSX.Element {
        return (
            <React.Fragment>
                {listOfWords.map((item: string, index) => (
                    <React.Fragment key={index}>
                        <li>
                            {item.split('').map((char: string, charIndex: number) => (
                                <span className={confirmChar(char, charIndex)} key={charIndex}>{char}</span>
                            ))}
                        </li>
                    </React.Fragment>
                ))}
            </React.Fragment>
        );
    }

    /**
     * Check if the entered word has 5 letters.
     * @returns True if the word has 5 letters, false otherwise.
     */
    function confirm5Letters(): boolean {
        if (inputValue.length == 5) {
            return true;
        } 
        return false;
    }

    /**
     * Determine the styling for a character based on correctness.
     * @param character - The character to check.
     * @param charIndex - The index of the character.
     * @returns The CSS class for styling the character.
     */
    function confirmChar(character: string, charIndex: number): string {
        if (character === wordOfTheDay.charAt(charIndex)) {
            return "correct-char";
        } else if (wordOfTheDay.includes(character)) {
            return "wrong-index-char";
        } else {
            return "incorrect-char";
        }
    }

    // Ensure input value does not exceed 5 characters
    useEffect(() => {
        if (inputValue.length > 5) {
            setInputValue(inputValue.slice(0, 5));
        }
    }, [inputValue]);

    // Render the WordGuesser component
    return (
        <Layout preview={preview}>
        <article className="flex w-full flex-col items-center justify-center">
            <div className="word-guesser">
                <h1 className="text-2xl mb-5 text-center font-bold">5 Character Puzzle</h1>
                {/* <h2>Word of the Day: {isClient ? wordifiedWord : "Loading..."}</h2> */}
                <ul id="word-list">
                    {enteredWord}
                </ul>

                {
                    win ? 
                    <div className="you-win">You won 🥳</div> : 
                    attempts >= 6 ? 
                    <div className="you-lose">You lost 🥺</div> :
                    <form id="word-form">
                        <input type="text" aria-autocomplete="none" maxLength={5} id="word-input" value={inputValue} onChange={(event) => setInputValue(event.target.value)}  />
                        {confirm5Letters() === true ?
                        <button id="submit" onClick={handleWordifySubmit}>Submit</button>
                        :
                        <button id="submit" disabled>Submit</button>}

                    </form>

                }

            </div>
        </article>
        </Layout>
    );
}
