import './App.css'
import React, { useEffect } from 'react';

function App() {
  // All the const that are used from index.html file
  const gamesBoardContainer = document.querySelector('#gamesboard-container');
  const optionContainer = document.querySelector('.option-container');
  const flipButton = document.querySelector('#flip-button');
  const startButton = document.querySelector('#start-button');
  const restartButton = document.querySelector('#restart-button')
  const infoDisplay = document.querySelector('#info');
  const turnDisplay = document.querySelector('#turn-display');

  // flip function using rotate style to flip ships in options container
  let angle = 0;
  function flip() {
    const optionShips = Array.from(optionContainer.children);
    angle = angle === 90 ? 0 : 90;
    optionShips.forEach(optionShip => optionShip.style.transform = `rotate(${angle}deg)`);
  }
  flipButton.addEventListener('click', flip);

  // creating the 10x10 board with user ID and colour
  const width = 10;
  function createBoard(color, user) {
    const gameBoardContainer = document.createElement('div');
    gameBoardContainer.classList.add('game-board');
    gameBoardContainer.style.backgroundColor = color;
    gameBoardContainer.id = user

    for (let i = 0; i < width * width; i++) {
      const block = document.createElement('div')
      block.classList.add('block')
      block.id = i
      gameBoardContainer.append(block)
    }
    gamesBoardContainer.append(gameBoardContainer)
  }
  useEffect(() => {
    createBoard('lightseagreen', 'player');
    createBoard('lightseagreen', 'computer');
  }, []);

  // creating Ship class that will be used to identify each particular ship
  class Ship {
    constructor(name, length) {
      this.name = name
      this.length = length
    }
  }
  const ship1 = new Ship('ship1', 2)
  const ship2 = new Ship('ship2', 3)
  const ship3 = new Ship('ship3', 4)
  const ship4 = new Ship('ship4', 4)
  const ship5 = new Ship('ship5', 5)

  const ships = [ship1, ship2, ship3, ship4, ship5]
  let notDropped

  // addShip function
  function addShip(user, ship, startId) {
    // add ship based on either player or computer
    const boardBlocks = document.querySelectorAll(`#${user} div`)
    // randomizes where the ships are placed for computer
    let randomBoolean = Math.random() < 0.5
    let isHorizontal = user === 'player' ? angle === 0 : randomBoolean
    let randomStartIndex = Math.floor(Math.random() * width * width)

    let startIndex = startId ? startId : randomStartIndex
    let validStart = isHorizontal ? startIndex <= width * width - ship.length ? startIndex :
      width * width - ship.length :
      startIndex <= width * width - width * ship.length ? startIndex :
        startIndex - ship.length * width + width

    // shipBlocks array is created to keep track of where the ships are on the board
    let shipBlocks = []
    // checking both vertically and horizontally if a ship can be placed
    for (let i = 0; i < ship.length; i++) {
      if (isHorizontal) {
        shipBlocks.push(boardBlocks[Number(validStart) + i])
      } else {
        shipBlocks.push(boardBlocks[Number(validStart) + i * width])
      }
    }
    let valid
    if (isHorizontal) {
      shipBlocks.every((_shipBlock, index) =>
        valid = shipBlocks[0].id % width !== width - (shipBlocks.length - (index + 1))
      );
    } else {
      shipBlocks.every((_shipBlock, index) =>
        valid = shipBlocks[0].id < 90 + (width * index + 1)
      );
    }

    // Once it has been checked, 'taken' class is added and ship is added to shipBlock array
    const notTaken = shipBlocks.every(shipBlock => !shipBlock.classList.contains('taken'))
    if (valid && notTaken) {
      shipBlocks.forEach(shipBlock => {
        shipBlock.classList.add(ship.name)
        shipBlock.classList.add('taken')
      })
    } else {
      // Adding ship based on type of user
      if (user === 'computer') addShip(user, ship, startId)
      if (user === 'player') notDropped = true
    }

  }

  useEffect(() => {
    ships.forEach(ship => addShip('computer', ship))
  }, []);


  // Calling all the functions used for dragging and dropping ships
  let draggedShip
  useEffect(() => {
    // Cross checking player board blocks with the ships and calling the event functions
    const optionShips = Array.from(optionContainer.children)
    optionShips.forEach(optionShip => optionShip.addEventListener('dragstart', dragStart))
    const allPlayerBlocks = document.querySelectorAll('#player .block')
    allPlayerBlocks.forEach(playerBlock => {
      playerBlock.addEventListener('dragover', dragOver)
      playerBlock.addEventListener('drop', dropShip)
    })
  })

  // Event functions for dragStart, dragOver, dropShip
  function dragStart(e) {
    notDropped = false
    draggedShip = e.target
  }
  function dragOver(e) {
    e.preventDefault()
    const ship = ships[draggedShip.id]

  }
  function dropShip(e) {
    const startId = e.target.id
    const ship = ships[draggedShip.id]
    addShip('player', ship, startId)
    if (!notDropped) {
      draggedShip.remove()
    }
  }

  let gameOver = false
  let playerTurn

  // Function for starting game, mainly checking for clicks on boardBlocks and outputting the text content on UI
  function startGame() {
    if (playerTurn === undefined) {
      if (optionContainer.children.length != 0) {
        infoDisplay.textContent = 'Please place all your pieces first'
      } else {
        // Similar to previous useEffect(), checking for computer moves and outputting on UI
        const allBoardBlocks = document.querySelectorAll('#computer div')
        allBoardBlocks.forEach(block => block.addEventListener('click', handleClick))
        playerTurn = true
        turnDisplay.textContent = 'Your Go'
        infoDisplay.textContent = 'Game has started'
      }
    }
  }
  useEffect(() => {
    startButton.addEventListener('click', startGame)
  }, []);

  // Arrays created to check for hits and ships destroyed
  let playerHits = []
  let computerHits = []
  const playerSunkShips = []
  const computerSunkShips = []

  // Function handleClick() to check each click on board
  function handleClick(e) {
    if (!gameOver) {
      // Conditional if statements based if ship is already there and adding the indicator that ship is hit
      if (e.target.classList.contains('taken')) {
        e.target.classList.add('boom')
        infoDisplay.textContent = 'You hit a computer ship!'
        let classes = Array.from(e.target.classList)
        classes = classes.filter(className => className !== 'block')
        classes = classes.filter(className => className !== 'boom')
        classes = classes.filter(className => className !== 'taken')
        playerHits.push(...classes)
        checkScore('player', playerHits, playerSunkShips)
      }

      // If statement to put miss on empty click
      if (!e.target.classList.contains('taken')) {
        infoDisplay.textContent = 'Missed hit'
        e.target.classList.add('empty')
      }
      // This updates the board and sets up for computer to take turn
      playerTurn = false
      const allBoardBlocks = document.querySelectorAll('#computer div')
      allBoardBlocks.forEach(block => block.replaceWith(block.cloneNode(true)))
      setTimeout(computerGo, 2000)
    }
  }

  // Function for computer turn
  function computerGo() {
    if (!gameOver) {
      turnDisplay.textContent = `Computer's turn`
      infoDisplay.textContent = 'The computer is playing'

      setTimeout(() => {
        let randomGo = Math.floor(Math.random() * width * width)
        const allBoardBlocks = document.querySelectorAll('#player div')
        // conditional if statements to cross check computer randomized clicks
        if (allBoardBlocks[randomGo].classList.contains('taken') &&
          allBoardBlocks[randomGo].classList.contains('boom')) {
          computerGo()
          return
        } 
        // If computer hit a player ship, update class on that block and output info on UI
        else if (allBoardBlocks[randomGo].classList.contains('taken') && !allBoardBlocks[randomGo].classList.contains('boom')) {
          allBoardBlocks[randomGo].classList.add('boom')
          infoDisplay.textContent = 'The computer hit your ship'
          let classes = Array.from(allBoardBlocks[randomGo].classList)
          classes = classes.filter(className => className !== 'block')
          classes = classes.filter(className => className !== 'boom')
          classes = classes.filter(className => className !== 'taken')
          // add to array
          computerHits.push(...classes)
          // check through computer's record of hits and ships
          checkScore('computer', computerHits, computerSunkShips)
        } else {
          infoDisplay.textContent = 'Computer missed'
          allBoardBlocks[randomGo].classList.add('empty')
        }
      }, 2000)

      setTimeout(() => {
        playerTurn = true
        turnDisplay.textContent = 'Your turn'
        infoDisplay.textContent = 'Make your next move'
        const allBoardBlocks = document.querySelectorAll('#computer div')
        allBoardBlocks.forEach(block => block.addEventListener('click', handleClick))
      }, 4000)
    }
  }

  // function to keep track of ships being destroyed
  function checkScore(user, userHits, userSunkShips) {
    function checkShip(shipName, shipLength) {
      if (
        // get the ship that was destroyed based on its length
        userHits.filter(storedShipName => storedShipName === shipName).length === shipLength
      ) {
        // display info based on which user sunk ship
        if (user === 'player') {
          infoDisplay.textContent = `you sunk the computer's ${shipName}`
          playerHits = userHits.filter(storedShipName => storedShipName !== shipName)
        }
        if (user === 'computer') {
          infoDisplay.textContent = `The computer sunk your ${shipName}`
          computerHits = userHits.filter(storedShipName => storedShipName !== shipName)
        }
        // add the destroyed ship the array
        userSunkShips.push(shipName)
      }
    }

    checkShip('ship1', 2)
    checkShip('ship2', 3)
    checkShip('ship3', 4)
    checkShip('ship4', 4)
    checkShip('ship5', 5)

    // if statements to end the game when one user destroys all the ships
    if (playerSunkShips.length === 5) {
      infoDisplay.textContent = 'All Computer Ships have sunk. YOU WON!!!'
      gameOver = true
    }
    if (computerSunkShips.length === 5) {
      infoDisplay.textContent = 'The Computer sunk all your ships. YOU LOST!!!'
      gameOver = true
    }
  }

  // function to restart game, could not figure a way to restart game without reloading
  function handleRestart() {
    // temporary: to add some functioanlity, reloads page
    window.location.reload();
  }
  restartButton.addEventListener('click', handleRestart);

  return (
    <div className="app"></div>
  );
}
export default App;






