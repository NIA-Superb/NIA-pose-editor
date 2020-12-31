import _ from 'lodash';
import { Point, Rect } from '.'

export interface Viewport {
    imageWidth: number
    imageHeight: number
    containerWidth: number
    containerHeight: number

    // all in image coordinate
    viewportCenterX: number
    viewportCenterY: number
    viewportWidth?: number
    viewportHeight?: number

    magnification: number
    minMagnification: number
    maxMagnification: number
}

export const defaultViewport:Viewport = {
    imageWidth: 500,
    imageHeight: 500, 
    containerWidth: 300,
    containerHeight: 300,

    viewportCenterX: 50,
    viewportCenterY: 50,

    magnification: 1,
    maxMagnification: 100,
    minMagnification: 0.1,
}

export function baseMagnification(state:Viewport): number {
    let baseMag = _.min([
        state.containerWidth / state.imageWidth,
        state.containerHeight / state.imageHeight])!;
    return baseMag;
}

export function effectiveMagnification(state:Viewport): number {
    return baseMagnification(state) * state.magnification;
}

export function toImageCoord(state:Viewport, screenCoord:Point): Point {
    let effMag = effectiveMagnification(state);
    let imgX = (screenCoord.x - 0.5 * state.containerWidth ) / effMag + state.viewportCenterX;
    let imgY = (screenCoord.y - 0.5 * state.containerHeight ) / effMag + state.viewportCenterY;
    return { x: imgX, y: imgY }
}

export function toScreenCoord(state:Viewport, imgCoord:Point): Point {
    let effMag = effectiveMagnification(state);

    let scrX = (imgCoord.x - state.viewportCenterX) * effMag + 0.5 * state.containerWidth;
    let scrY = (imgCoord.y - state.viewportCenterY) * effMag + 0.5 * state.containerHeight;
    return { x: scrX, y:scrY }
}


export function toImageRct(state: Viewport, screenRct: Rect): Rect {
    return {
        p1: toImageCoord(state, screenRct.p1),
        p2: toImageCoord(state, screenRct.p2)
    }
}

export function toScreenRct(state: Viewport, imageRct: Rect): Rect {
    return {
        p1: toScreenCoord(state, imageRct.p1),
        p2: toScreenCoord(state, imageRct.p2)
    }
}

export function fixViewport(state:Viewport): boolean {
    let updated = false;

    if (state.magnification < state.minMagnification) {
        state.magnification = state.minMagnification;
        updated = true;
    } 

    if (state.magnification > state.maxMagnification) {
        state.magnification = state.maxMagnification;
        updated = true;
    }

    let visibleRct = toImageRct(state, {p1:{x:0, y:0}, p2:{x:state.containerWidth, y:state.containerHeight}});
    let viewportWidth = visibleRct.p2.x - visibleRct.p1.x
    let viewportHeight = visibleRct.p2.y - visibleRct.p1.y

    let x1 = state.imageWidth * 0.1 - viewportWidth * 0.5
    let x2 = state.imageWidth * 0.9 + viewportWidth * 0.5
    let y1 = state.imageHeight * 0.1 - viewportHeight * 0.5
    let y2 = state.imageHeight * 0.9 + viewportHeight * 0.5

    state.viewportCenterX = Math.min(Math.max(state.viewportCenterX, x1), x2)
    state.viewportCenterY = Math.min(Math.max(state.viewportCenterY, y1), y2)

    return updated
}

export function resetViewport(viewport: Viewport) {
    viewport.viewportCenterX = viewport.imageWidth / 2;
    viewport.viewportCenterY = viewport.imageHeight / 2;
    viewport.magnification = 1.0
    fixViewport(viewport);
}