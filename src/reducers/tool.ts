import types, { ToolSelected } from "../actions/types";
import { Action } from "../actions";
import _ from "lodash";

export interface ToolState {
  curFrame: number
  focusedView: string
  toolSelected: ToolSelected
  pointClassSelected: string | null
  canCalculate: boolean
  showPoints: boolean
}

const init: ToolState = {
  curFrame: 0,
  focusedView: 'view1',
  toolSelected: ToolSelected.SelectMode,
  pointClassSelected: 'r-eye',
  canCalculate: true,
  showPoints: true
}

export function toolState(state: ToolState = init, action: Action) {
  switch(action.type) {
    case types.SELECT_TOOL:
      {
        let newState = _.clone(state);
        newState.toolSelected = action.tool;
        return newState;
      }
    case types.SET_POINT_CLASS:
      {
        let newState = _.clone(state);
        newState.pointClassSelected= action.pointClass;
        return newState;
      }
    case types.MOVE_TO_FRAME:
      {
        let newState = _.clone(state);
        newState.curFrame = action.index;
        return newState;
      }
    case types.SET_FOCUS_TO_VIEW:
      {
        let newState = _.clone(state);
        newState.focusedView = action.viewName;
        return newState;
      }
    case types.SET_CALCULATION_AVAILABILITY:
      {
        let newState = _.clone(state)
        newState.canCalculate = action.available
        return newState;
      }
    case types.SET_POINT_VISIBILITY:
      {
        let newState = _.clone(state)
        newState.showPoints = action.visibility
        return newState
      }
  }

  return state;
}