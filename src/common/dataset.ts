import {Point, Point3d} from '.'
import _ from 'lodash'

export type PointSet = {[key:string]:Point}
export type Point3dSet = {[key:string]:Point3d}

export interface Picture {
  dataPointsHist: PointSet[]
  calculatedPoints: PointSet
  revertLevel: number
  image: string
}

export interface Frame {
  views: {[key:string]: Picture}
  computedPosition: Point3dSet
  frameType: string
}

export interface Dataset {
  viewNames: string[]
  frames: Frame[]
  pointTypes: string[]
  frameTypes: string[]
  imgRoot: string
}

const maxHistoryDepth = 10;

export function getCurrentDataset(dataset:Dataset, frame:number, view:string):PointSet {
  if (frame >= dataset.frames.length || frame < 0) return {}

  let curView = dataset.frames[frame].views[view];
  let hist = curView.dataPointsHist;
  let histLen = hist.length
  if (histLen === 0) {
    return {};
  }
  return hist[histLen-1-curView.revertLevel];
}

export function pushDatasetHistory(dataset:Dataset, frame:number, view:string, data:PointSet) {
  if (frame >= dataset.frames.length || frame < 0) return {}

  let curView = dataset.frames[frame].views[view];
  let hist = curView.dataPointsHist;
  let histLen = hist.length
  hist = hist.slice(_.max([histLen - curView.revertLevel - maxHistoryDepth + 1, 0]), histLen - curView.revertLevel)
  hist.push(data)
  
  curView.revertLevel = 0;
  curView.dataPointsHist = hist;
  return hist[hist.length-1];
}

export function undoDatasetHistory(dataset:Dataset, frame:number, view:string) {
  if (frame >= dataset.frames.length || frame < 0) return;

  let curView = dataset.frames[frame].views[view];
  let hist = curView.dataPointsHist;
  curView.revertLevel = _.min([hist.length-1, curView.revertLevel + 1])!;
}

export function redoDatasetHistory(dataset:Dataset, frame:number, view:string) {
  if (frame >= dataset.frames.length || frame < 0) return;

  let curView = dataset.frames[frame].views[view];
  curView.revertLevel = _.max([0, curView.revertLevel - 1])!;
}

export function canUndo(dataset:Dataset, frame:number, view:string):boolean {
  if (frame >= dataset.frames.length || frame < 0) return false;

  let curView = dataset.frames[frame].views[view];
  let hist = curView.dataPointsHist;
  return (hist.length-1) > curView.revertLevel
}

export function canRedo(dataset:Dataset, frame:number, view:string):boolean {
  if (frame >= dataset.frames.length || frame < 0) return false;

  let curView = dataset.frames[frame].views[view];
  return curView.revertLevel > 0;
}

export function getFrameType(dataset: Dataset, frame:number): string {
  if (frame >= dataset.frames.length || frame < 0) return dataset.frameTypes[0];
  return dataset.frames[frame].frameType
}

export function getPictureUrl(dataset: Dataset, frame: number, viewName: string): string {
  const whenFailed = 'img/empty.jpg'
  if (frame >= dataset.frames.length || frame < 0) return whenFailed;
  if (!_.has(dataset.frames[frame].views, viewName)) return whenFailed;
  const imgRoot = dataset.imgRoot;
  return imgRoot + dataset.frames[frame].views[viewName].image
}

export function getCalculatedPoints(dataset: Dataset, frame:number, viewName: string): PointSet {
  const whenFailed = {}
  if (frame >= dataset.frames.length || frame < 0) return whenFailed;
  if (!_.has(dataset.frames[frame].views, viewName)) return whenFailed;
  return dataset.frames[frame].views[viewName].calculatedPoints
}

export function getCalculated3dPoints(dataset: Dataset, frame: number): Point3dSet {
  const whenFailed = {}
  if (frame >= dataset.frames.length || frame < 0) return whenFailed;
  return dataset.frames[frame].computedPosition
}
