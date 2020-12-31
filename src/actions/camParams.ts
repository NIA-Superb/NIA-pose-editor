import { types } from './types'
import { CamParams } from '../common/predict3dPoints';

export interface ActionUpdateCamParams {
  type: types.UPDATE_CAM_PARAMS
  camParams: {[key:string]:CamParams}
}

export function updateCamParams(camParams:{[key:string]:CamParams}):
  ActionUpdateCamParams {
  return {
    type: types.UPDATE_CAM_PARAMS,
    camParams
  }
}