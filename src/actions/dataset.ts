import types from './types';
import { Point } from '../common';
import { Dataset, Point3dSet, PointSet } from '../common/dataset'

export interface ActionUpdateDatapoint {
  type: types.UPDATE_DATAPOINT,
  frame: number,
  viewName: string,
  data: {[key:string]:Point}
}

export function updateDatapoint(frame: number, viewName: string, data:{[key:string]:Point}): ActionUpdateDatapoint {
  return {
    type: types.UPDATE_DATAPOINT,
    frame,
    viewName,
    data
  }
}

export interface ActionDeleteDatapoint {
  type: types.DELETE_DATAPOINT,
  frame: number,
  viewName: string,
  data: string[]
}

export function deleteDatapoint(frame: number, viewName: string, data:string[]): ActionDeleteDatapoint {
  return {
    type: types.DELETE_DATAPOINT,
    frame,
    viewName,
    data
  }
}

export interface ActionLoadedDataset {
  type: types.LOADED_DATASET,
  dataset: Dataset,
}

export function loadedDataset(dataset:Dataset): ActionLoadedDataset {
  return {
    type: types.LOADED_DATASET,
    dataset
  }
}

export interface ActionUndo {
  type: types.UNDO
  frame: number,
  viewName: string,
}

export function undo(frame:number, viewName: string): ActionUndo {
  return {
    type: types.UNDO,
    frame,
    viewName,
  }
}

export interface ActionRedo {
  type: types.REDO
  frame: number,
  viewName: string,
}

export function redo(frame:number, viewName: string): ActionRedo {
  return {
    type: types.REDO,
    frame,
    viewName,
  }
}

export interface ActionCopyFromFrame {
  type: types.COPY_FROM_FRAME
  frameFrom: number,
  frameTo: number
}

export function copyFromFrame(frameFrom:number, frameTo:number): ActionCopyFromFrame {
  return {
    type: types.COPY_FROM_FRAME,
    frameFrom,
    frameTo
  }
}

export interface ActionUpdateFrameType {
  type: types.UPDATE_FRAME_TYPE
  frame: number,
  frameType: string
}

export function updateFrameType(frame:number, frameType: string): ActionUpdateFrameType {
  return {
    type: types.UPDATE_FRAME_TYPE,
    frame,
    frameType
  }
}

export interface ActionUpdateCalculatedPoints {
  type: types.UPDATE_CALCULATED_POINTS
  frame: number
  viewName: string
  pointSet: PointSet
}

export function updateCalculatedPoints(frame:number, viewName: string, pointSet:PointSet):
  ActionUpdateCalculatedPoints {
  return {
    type: types.UPDATE_CALCULATED_POINTS,
    frame,
    viewName, 
    pointSet
  }
}

export interface ActionUpdateCalculatedPoints3D {
  type: types.UPDATE_CALCULATED_POINTS3D
  frame:number 
  point3dSet: Point3dSet
}

export function updateCalculatedPoints3d(frame:number, point3dSet:Point3dSet):
  ActionUpdateCalculatedPoints3D {
  return {
    type: types.UPDATE_CALCULATED_POINTS3D,
    frame,
    point3dSet
  }
}

export interface ActionUpdateBoneConnections {
  type: types.UPDATE_BONE_CONNECTIONS
  boneConnections: [string, string][]
}

export function updateBoneConnections(boneConnections:[string, string][]): 
ActionUpdateBoneConnections {
  return {
    type: types.UPDATE_BONE_CONNECTIONS,
    boneConnections
  }
}