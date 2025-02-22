/* global R */
import AnalysisView from './AnalysisView'
import canvasView from './canvasView'
import Gobbler from './Gobbler'
import environment from './environment'
import stats from './stats'
const {filter, sort} = R
let gobblers = []
const analysisView = AnalysisView()

const calculateAttackStrength = ({attackCoefficient, energy}) => attackCoefficient * energy
const calculateDefenceStrength = ({defenceCoefficient, energy}) => defenceCoefficient * energy

const attack = (gobbler0, gobbler1, stats) => {
  if (calculateAttackStrength(gobbler0) >= calculateDefenceStrength(gobbler1)) {
    stats.eatCount++
    gobbler0.energy += gobbler1.energy
    gobbler1.energy = 0
  }
  return gobbler0
}

const removeDead = filter(gobbler => {
  if (gobbler.energy < 0.1) {
    stats.deathCount++
    environment.increaseAtmosphereOxygenComposition(-gobbler.energy)
    return false
  }
  return true
})

const checkPossibleContactX = (gobbler0, gobbler1) => {
  const x0 = gobbler0.x
  const radius0 = gobbler0.radius
  const x1 = gobbler1.x
  const radius1 = gobbler1.radius

  return x0 + radius0 >= x1 - radius1 && x0 - radius0 <= x1 + radius1
}

const checkContact = (gobbler0, gobbler1) => {
  const x0 = gobbler0.x
  const y0 = gobbler0.y
  const radius0 = gobbler0.radius
  const x1 = gobbler1.x
  const y1 = gobbler1.y
  const radius1 = gobbler1.radius

  return Math.pow(Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2), 0.5) <= radius0 + radius1
}

// initial spawn
for (let i = 0; i < environment.initialGobblersCount; i++) {
  const gobblerParams = {
    attackCoefficient: 0.8,
    defenceCoefficient: 0.8,
    energy: environment.initialGobblerEnergy,
    generation: 0,
    photosynthesisCoefficient: 3, 
    v: 1,
    x: 0,
    y: 0,
  }
  gobblers[i] = new Gobbler(gobblerParams)
  const radius = gobblers[i].radius
  gobblers[i].x = Math.random() * (environment.sideLength - 2 * radius) + radius
  gobblers[i].y = Math.random() * (environment.sideLength - 2 * radius) + radius
  gobblers[i].mutate()
}

const animationloop = t => {
  window.requestAnimationFrame(animationloop)

  stats.resetValuesCalculatedEachIteration()

  gobblers = sort((gobbler0, gobbler1) => gobbler0.x - gobbler1.x, gobblers)

  for (let i = 0; i < gobblers.length; i++) {
    const gobbler0 = gobblers[i]
    let j = i - 1

    while (j >= 0 && checkPossibleContactX(gobbler0, gobblers[j])) {
      const gobbler1 = gobblers[j]
      if (checkContact(gobbler0, gobbler1)) {
        attack(gobbler0, gobbler1, stats)
      }
      j--
    }
    j = i + 1
    while (j < gobblers.length && checkPossibleContactX(gobbler0, gobblers[j])) {
      const gobbler1 = gobblers[j]
      if (checkContact(gobbler0, gobbler1)) {
        attack(gobbler0, gobbler1, stats)
      }
      j++
    }

    gobbler0
			.photosynthesize(environment)
			.move(environment)
			.reproduce(stats, gobblers)
			.respire(environment)

    stats.recordGobblerPropertiesForThisIteration(gobbler0)
  }

  gobblers = removeDead(gobblers)
  stats.totalGobblers = gobblers.length
  analysisView.render({
    environment,
    secondsElapsed: (t / 1000).toFixed(0),
    stats,
  })

  canvasView.render({
    gobblers,
    lightLevel: (environment.light() * 255).toFixed(0),
    totalAttackCoefficient: stats.totalAttackCoefficient,
    totalDefenceCoefficient: stats.totalDefenceCoefficient,
    totalPhotosynthesisCoefficient: stats.totalPhotosynthesisCoefficient,
  })
}

window.requestAnimationFrame(animationloop)
