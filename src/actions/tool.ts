import types, { ToolSelected } from './types';

export interface ActionMoveToFrame {
  type: typeof types.MOVE_TO_FRAME
  index: number
}

export function moveToFrame(index: number): ActionMoveToFrame {
  return {
    type: types.MOVE_TO_FRAME,
    index: index
  }
}

export interface ActionSetPointClass {
  type: typeof types.SET_POINT_CLASS
  pointClass: string 
}

export function setPointClass(pointClass:string ): ActionSetPointClass {
  return {
    type: types.SET_POINT_CLASS,
    pointClass
  }
}

export interface ActionSelectTool {
  type: typeof types.SELECT_TOOL
  tool: ToolSelected
}

export function selectTool(tool:ToolSelected): ActionSelectTool {
  return {
    type: types.SELECT_TOOL,
    tool
  }
}

export interface ActionSetFocusToView {
  type: typeof types.SET_FOCUS_TO_VIEW,
  viewName: string
}

export function setFocusToView(viewName: string): ActionSetFocusToView {
  return {
    type: types.SET_FOCUS_TO_VIEW,
    viewName
  }
}

export interface ActionSetCalculationAvailability{
  type: typeof types.SET_CALCULATION_AVAILABILITY
  available: boolean
}

export function setCalculationAvailability(available: boolean): ActionSetCalculationAvailability {
  return {
    type: types.SET_CALCULATION_AVAILABILITY,
    available
  }
}

export interface ActionSetPointVisibility {
  type: typeof types.SET_POINT_VISIBILITY
  visibility: boolean
}

export function setPointVisibility(visibility: boolean): ActionSetPointVisibility {
  return {
    type: types.SET_POINT_VISIBILITY,
    visibility
  }
}