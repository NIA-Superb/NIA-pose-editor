import { PointSet, Dataset, Frame, Picture, getCurrentDataset, Point3dSet } from "./dataset";
import _ from 'lodash'

export interface JSONPicture {
  pts: PointSet
  calPts: PointSet
  img: string
}

export interface JSONFrame {
  views: {[key:string]: JSONPicture}
  pts3d?: Point3dSet
  frmType: string
}

export interface JSONDataset {
  frames: JSONFrame[]
  ptsTypes: string[]
  frmTypes: string[]
}

export function convertDatasetToJSONDataset(dataset: Dataset):JSONDataset {
  const frames = dataset.frames
  let newFrames: JSONFrame[] = []
  for (let frameIdx = 0; frameIdx < frames.length; frameIdx++) {
    const frame = dataset.frames[frameIdx]
    const newFrame: JSONFrame = {
      views: {},
      frmType: frame.frameType,
      pts3d: _.cloneDeep(frame.computedPosition)
    }
    for (const viewName of _.keys(frame.views)) {
      const pts = _.cloneDeep(getCurrentDataset(dataset, frameIdx, viewName))
      const calPts = _.cloneDeep(frame.views[viewName].calculatedPoints)
      const newPicture: JSONPicture = {
        pts,
        calPts,
        img: frame.views[viewName].image
      }
      newFrame.views[viewName] = newPicture
    }
    newFrames.push(newFrame)
  }

  let newDataset: JSONDataset = {
    frames: newFrames,
    ptsTypes: _.cloneDeep(dataset.pointTypes),
    frmTypes: _.cloneDeep(dataset.frameTypes)
  }
  return newDataset
}

export function convertJSONDatasetToDataset(jsonDataset:JSONDataset, imgRoot: string): Dataset {
  let viewNames = new Set<string>();
  let ptsTypes = new Set<string>();
  let frameTypes = new Set<string>();
  jsonDataset.frmTypes.forEach((x)=>frameTypes.add(x))
  jsonDataset.ptsTypes.forEach((x)=>ptsTypes.add(x))
  
  if (jsonDataset.frames.length > 0)
    _.keys(jsonDataset.frames[0].views).forEach((x)=> viewNames.add(x));
  
  let newFrames: Frame[] = [];

  for (let frameIdx = 0; frameIdx < jsonDataset.frames.length; frameIdx++) {
    const frame = jsonDataset.frames[frameIdx]
    let newFrame: Frame = {
      views: {},
      frameType: frame.frmType,
      computedPosition: (frame.pts3d)?(_.cloneDeep(frame.pts3d)):{}
    }

    frameTypes.add(frame.frmType);
    const curViews = _.keys(frame.views) 
    let viewComplete = curViews.map((x)=>viewNames.has(x)).reduce((x, y)=>(x && y));
    if (!viewComplete || curViews.length !== viewNames.size) {
      throw new Error(`invalid views: [${curViews.join(', ')}]. expected [${Array.from(viewNames.values()).join(', ')}]`)
    }
    for (const viewName of curViews) {
      const picture = frame.views[viewName]
      const newPicture: Picture = {
        dataPointsHist:[_.cloneDeep(picture.pts)],
        revertLevel: 0,
        calculatedPoints: _.cloneDeep(picture.calPts),
        image: picture.img
      }
      newFrame.views[viewName] = newPicture
    }
    newFrames.push(newFrame)
  }
  const newDataset: Dataset = {
    viewNames: Array.from(viewNames),
    frames: newFrames,
    pointTypes: Array.from(ptsTypes),
    frameTypes: Array.from(frameTypes),
    imgRoot
  }
  return newDataset
}