import { Dataset, pushDatasetHistory, getCurrentDataset, undoDatasetHistory, redoDatasetHistory } from "../common/dataset";
import { Action } from "../actions";
import types from '../actions/types';
import _ from 'lodash';

export interface DatasetState {
  dataset: Dataset
}

const init: DatasetState = {
  dataset: {
    imgRoot: '/',
    frameTypes: ['frame'],
    pointTypes: ['point'],
    viewNames: ['view1', 'view2', 'view3', 'view4'],
    frames: []
  }
}

export function datasetState(state: DatasetState = init, action: Action): DatasetState {
  switch (action.type) {
    case types.UPDATE_DATAPOINT:
      {
        let newState: DatasetState = _.clone(state);
        let curpts = _.cloneDeep(getCurrentDataset(newState.dataset, action.frame, action.viewName));

        curpts = {
          ...curpts,
          ...action.data
        }
        pushDatasetHistory(state.dataset, action.frame, action.viewName, curpts);
        return newState;
      }
    case types.DELETE_DATAPOINT:
      {
        let newState: DatasetState = _.clone(state);
        let curpts = _.cloneDeep(getCurrentDataset(newState.dataset, action.frame, action.viewName));

        for (let idx in action.data) {
          delete curpts[action.data[idx]]
        }
        pushDatasetHistory(state.dataset, action.frame, action.viewName, curpts);
        return newState;
      }
    case types.LOADED_DATASET:
      {
        let newState: DatasetState = _.clone(state);
        newState.dataset = action.dataset
        return newState;
      }
    case types.UNDO:
      {
        let newState: DatasetState = _.clone(state);
        undoDatasetHistory(newState.dataset, action.frame, action.viewName);
        return newState;
      }
    case types.REDO:
      {
        let newState: DatasetState = _.clone(state);
        redoDatasetHistory(newState.dataset, action.frame, action.viewName);
        return newState;
      }
    case types.COPY_FROM_FRAME:
      {
        let newState: DatasetState = _.clone(state);
        for (const viewIdx in newState.dataset.viewNames) {
          const viewName = newState.dataset.viewNames[viewIdx];
          let fromFrame = _.clone(getCurrentDataset(newState.dataset, action.frameFrom, viewName))
          pushDatasetHistory(newState.dataset, action.frameTo, viewName, fromFrame )
        }
        return newState;
      }
    case types.UPDATE_FRAME_TYPE:
      {
        if (state.dataset.frameTypes.find((x)=>{ return x === action.frameType })){
          let newState: DatasetState = _.clone(state);
          newState.dataset.frames[action.frame].frameType = action.frameType;
          return newState;
        }
        break;
      }
    case types.UPDATE_CALCULATED_POINTS:
      {
        let newState: DatasetState = _.clone(state)
        newState.dataset.frames[action.frame].views[action.viewName].calculatedPoints = action.pointSet
        return newState;
      }
    case types.UPDATE_CALCULATED_POINTS3D:
      {
        let newState: DatasetState = _.clone(state)
        newState.dataset.frames[action.frame].computedPosition = action.point3dSet
        return newState;
      }
  }
  return state;
}