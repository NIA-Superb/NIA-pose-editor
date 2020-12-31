import { CamParams } from "../common/predict3dPoints";
import types from "../actions/types";
import { Action } from '../actions'
import _ from "lodash";

export interface ConfigsState {
  camParams: {[key:string]:CamParams}
  boneConnections: [string, string][]
}

const init: ConfigsState = {
  camParams: {},
  boneConnections: []
}

export function configsState(state: ConfigsState=init, action: Action):
ConfigsState{
  switch(action.type) {
    case types.UPDATE_CAM_PARAMS:
      {
        let newState = _.clone(state)
        newState.camParams = action.camParams
        return newState
      }
    case types.UPDATE_BONE_CONNECTIONS:
      {
        let newState = _.clone(state)
        newState.boneConnections = action.boneConnections
        return newState
      }
    default:
  }
  return state;
}