import {pipe,fromEvent,filter,forEach,map,merge} from './libs/callbags.js'
import {getFromLocalStorage, setToLocalStorage, removeFromLocalStorage} from './libs/utils.js'

const $ = q => document.querySelector(q)
const c = $('.circle')
const sc = $('#startColor')
const mc = $('#middleColor')
const ec = $('#endColor')
const o = $('#opacity')
const i = $('#inhaleTime')
const p = $('#pauseTime')
const ex = $('#exhaleTime')
const configWindow = $('#edit_overlay')
const INHALE = 'inhale'
const PAUSE = 'pause'
const EXHALE = 'exhale'
const initialState = {
    startColor: '#BB32BF',
    middleColor: '#BF1E2C',
    endColor: '#382DBF',
    opacity: '0.6',
    inhaleTime: '3',
    pauseTime: '0.1',
    exhaleTime: '4',
}

const setConfigWindowValues = (config) =>{
    let configList = [sc,mc,ec,o,i,p,ex]
    configList.map(el => [el.id, el.value])
        .forEach(([id,val]) => {
            val =  config[id]
        })
}
const checkConfigExist = (initConfig) =>{
    let config = getFromLocalStorage('config')
    if(config === null) setToLocalStorage('config',initConfig)
    setConfigWindowValues(config)
}
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
const applyConfig =(config)=> ({id, value}) =>{
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
    root.style.setProperty(
        propName,
        id.includes('Time')?`${value}s`:value.toString()
    )
    config[id] = value.toString()
    console.log(config)
}
const mkeChangeListener = (target) =>{
    return pipe(
        fromEvent(target,'change'),
        map(e => ({id:e.target.id,value: e.target.value})),
    )
}
const onOpenConfigWindow = e =>{
    configWindow.style.display = ""
    c.classList.remove('draggable')
}
const onSave = e =>{
    setToLocalStorage(initialState)
    console.log('config saved:',initialState)
    configWindow.style.display = 'none'
    c.classList.add('draggable')
}

const saveClickEvt$ =
    pipe(
        fromEvent(configWindow,'click'),
        filter(e => e.target.tagName === 'BUTTON'),
        map(onSave)
    )
const openConfigEvt$ =
    pipe(
        fromEvent(document,'keydown'),
        filter(e => e.code ==='Escape'),
        map(onOpenConfigWindow)
    )
const animEvt$ =
    pipe(
        fromEvent(c,'animationend'),
        map(switchAnim)
    )
const inputChangeEvt$ =
    merge(
        mkeChangeListener(sc),
        mkeChangeListener(mc),
        mkeChangeListener(ec),
        mkeChangeListener(o),
        mkeChangeListener(i),
        mkeChangeListener(p),
        mkeChangeListener(ex),
    )
const clickEvt$ =
    merge(
        saveClickEvt$,
        openConfigEvt$,
        animEvt$,
    )

checkConfigExist(initialState)
forEach(applyConfig(initialState))(inputChangeEvt$)
forEach(x =>{})(clickEvt$)
