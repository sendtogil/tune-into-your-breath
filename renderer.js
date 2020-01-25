import {pipe,fromEvent,filter,forEach,map,merge} from './libs/callbags.js'

const $ = q => document.querySelector(q)

let c = $('.circle')
let sc = $('#startColor')
let mc = $('#middleColor')
let ec = $('#endColor')
let o = $('#opacity')
let i = $('#inhaleTime')
let p = $('#pauseTime')
let ex = $('#exhaleTime')
let config = $('#edit_overlay')

const INHALE = 'inhale'
const PAUSE = 'pause'
const EXHALE = 'exhale'

const switchAnim = e =>{
    let animState = e.animationName
    switch (animState) {
        case INHALE:
            e.target.classList.remove('play-inhale')
            e.target.classList.add('play-pause')
            break
        case PAUSE:
            e.target.classList.remove('play-pause')
            e.target.classList.add('play-exhale')
            break
        case EXHALE:
            e.target.classList.remove('play-exhale')
            e.target.classList.add('play-inhale')
            break
        default:
            return
    }
}

// const anim$ = pipe(
//     fromEvent(c,'animationend'),
//     forEach(switchAnim)
// )

pipe(
    fromEvent(c,'animationend'),
    forEach(switchAnim)

)


const updateConfig = ({id, value}) =>{
    let root = document.documentElement
    let getPropName = id => {
        switch (id) {
            case 'startColor':
                return '--color-start'
            case 'middleColor':
                return '--color-middle'
            case 'endColor':
                return '--color-end'
            case 'inhaleTime':
                return '--inhale'
            case 'pauseTime':
                return '--pause'
            case 'exhaleTime':
                return '--exhale'
            case 'opacity':
                return '--opacity'
            default:
                return null
        }
    }
    let propName = getPropName(id).toString()
    root.style.setProperty(propName, id.includes('Time')?`${value}s`:value);
}

const changeListener = (target) =>{
    return pipe(
        fromEvent(target,'change'),
        map(e => ({id:e.target.id,value: e.target.value})),
    )
}

pipe(
    fromEvent(config,'click'),
    filter(e => e.target.tagName === 'BUTTON'),
    forEach(e => {/* do save event */})
)
//
const input$ =
merge(
    changeListener(sc),
    changeListener(mc),
    changeListener(ec),
    changeListener(o),
    changeListener(i),
    changeListener(p),
    changeListener(ex),
)

forEach(updateConfig)(input$)