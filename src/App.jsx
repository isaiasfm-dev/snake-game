import { useEffect, useMemo, useState } from 'react'
import './App.css'

const BOARD_SIZE = 16
const INITIAL_SNAKE = [
  { x: 8, y: 8 },
  { x: 7, y: 8 },
  { x: 6, y: 8 },
]
const INITIAL_DIRECTION = { x: 1, y: 0 }
const TICK_MS = 140

const isSameCell = (firstCell, secondCell) =>
  firstCell.x === secondCell.x && firstCell.y === secondCell.y

const randomFoodPosition = (snake) => {
  const freeCells = []

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const isOccupied = snake.some((segment) => segment.x === x && segment.y === y)

      if (!isOccupied) {
        freeCells.push({ x, y })
      }
    }
  }

  return freeCells[Math.floor(Math.random() * freeCells.length)] ?? null
}

function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE)
  const [direction, setDirection] = useState(INITIAL_DIRECTION)
  const [queuedDirection, setQueuedDirection] = useState(INITIAL_DIRECTION)
  const [food, setFood] = useState(() => randomFoodPosition(INITIAL_SNAKE))
  const [isRunning, setIsRunning] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [score, setScore] = useState(0)

  const cells = useMemo(() => {
    return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
      const x = index % BOARD_SIZE
      const y = Math.floor(index / BOARD_SIZE)
      const isSnakeHead = isSameCell(snake[0], { x, y })
      const isSnakeBody = snake.slice(1).some((segment) => segment.x === x && segment.y === y)
      const isFood = food ? isSameCell(food, { x, y }) : false

      return {
        key: `${x}-${y}`,
        isSnakeHead,
        isSnakeBody,
        isFood,
      }
    })
  }, [food, snake])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const pressedKey = event.key.toLowerCase()
      const nextDirectionByKey = {
        arrowup: { x: 0, y: -1 },
        w: { x: 0, y: -1 },
        arrowdown: { x: 0, y: 1 },
        s: { x: 0, y: 1 },
        arrowleft: { x: -1, y: 0 },
        a: { x: -1, y: 0 },
        arrowright: { x: 1, y: 0 },
        d: { x: 1, y: 0 },
      }

      if (pressedKey === ' ') {
        event.preventDefault()
        if (!isGameOver) {
          setIsRunning((currentValue) => !currentValue)
        }
        return
      }

      const nextDirection = nextDirectionByKey[pressedKey]

      if (!nextDirection) {
        return
      }

      event.preventDefault()

      const isOppositeDirection =
        nextDirection.x === -direction.x && nextDirection.y === -direction.y

      if (isOppositeDirection) {
        return
      }

      setQueuedDirection(nextDirection)

      if (!isGameOver) {
        setIsRunning(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [direction, isGameOver])

  useEffect(() => {
    if (!isRunning || isGameOver || !food) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setSnake((currentSnake) => {
        const nextDirection = queuedDirection
        const currentHead = currentSnake[0]
        const nextHead = {
          x: currentHead.x + nextDirection.x,
          y: currentHead.y + nextDirection.y,
        }

        const hitWall =
          nextHead.x < 0 ||
          nextHead.x >= BOARD_SIZE ||
          nextHead.y < 0 ||
          nextHead.y >= BOARD_SIZE

        const willEatFood = isSameCell(nextHead, food)
        const tailSafeSnake = willEatFood ? currentSnake : currentSnake.slice(0, -1)
        const hitSelf = tailSafeSnake.some((segment) => isSameCell(segment, nextHead))

        if (hitWall || hitSelf) {
          setIsRunning(false)
          setIsGameOver(true)
          return currentSnake
        }

        setDirection(nextDirection)

        const nextSnake = [nextHead, ...currentSnake]

        if (willEatFood) {
          setScore((currentScore) => currentScore + 1)
          setFood(randomFoodPosition(nextSnake))
          return nextSnake
        }

        nextSnake.pop()
        return nextSnake
      })
    }, TICK_MS)

    return () => window.clearInterval(intervalId)
  }, [food, isGameOver, isRunning, queuedDirection])

  const resetGame = () => {
    setSnake(INITIAL_SNAKE)
    setDirection(INITIAL_DIRECTION)
    setQueuedDirection(INITIAL_DIRECTION)
    setFood(randomFoodPosition(INITIAL_SNAKE))
    setIsRunning(false)
    setIsGameOver(false)
    setScore(0)
  }

  return (
    <main className="app">
      <section className="panel">
        <div className="heading">
          <div>
            <p className="eyebrow">React mini game</p>
            <h1>Snake</h1>
          </div>
          <button type="button" className="restart-button" onClick={resetGame}>
            Reiniciar
          </button>
        </div>

        <div className="status-bar">
          <article className="status-card">
            <span>Puntuación</span>
            <strong>{score}</strong>
          </article>
          <article className="status-card">
            <span>Estado</span>
            <strong>{isGameOver ? 'Perdiste' : isRunning ? 'Jugando' : 'Pausado'}</strong>
          </article>
        </div>

        <div className="board-wrapper">
          <div
            className={`board ${isGameOver ? 'board--game-over' : ''}`}
            style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
          >
            {cells.map((cell) => (
              <div
                key={cell.key}
                className={[
                  'cell',
                  cell.isSnakeHead ? 'cell--head' : '',
                  cell.isSnakeBody ? 'cell--snake' : '',
                  cell.isFood ? 'cell--food' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            ))}
          </div>

          {isGameOver ? (
            <div className="overlay">
              <h2>Fin de la partida</h2>
              <p>Tu puntuación fue {score}. Pulsa reiniciar para volver a jugar.</p>
            </div>
          ) : null}
        </div>

        <div className="help">
          <p>
            Usa <code>↑ ↓ ← →</code> o <code>W A S D</code> para mover la serpiente.
          </p>
          <p>
            Pulsa <code>espacio</code> para pausar o reanudar.
          </p>
        </div>
      </section>
    </main>
  )
}

export default App
