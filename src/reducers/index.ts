import { combineReducers, CombinedState } from 'redux';
import { DatasetState, datasetState } from './dataset';
import { ToolState, toolState } from './tool';
import { ConfigsState, configsState } from './configs';

export type AppState = CombinedState<{
  datasetState:DatasetState,
  toolState:ToolState,
  configsState: ConfigsState,
}>;

export default combineReducers({
  datasetState,
  toolState,
  configsState
});