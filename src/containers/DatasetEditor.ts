import { Action as ReduxAction } from 'redux'
import { AppState } from "../reducers";
import Editor from "../components/Editor";
import { getCurrentDataset, PointSet, getCalculatedPoints, getPictureUrl } from "../common/dataset";
import { ToolSelected } from "../actions/types";
import { updateDatapoint, deleteDatapoint, undo, redo } from "../actions";
import { Point } from "../common";
import _ from 'lodash'
import { ThunkAction, ThunkDispatch } from "redux-thunk";
import { connect } from 'react-redux';

// 아래 링크에 설명된 컨벤션을 따랐다.
// https://medium.com/@peatiscoding/typescripts-with-redux-redux-thunk-recipe-fcce4ffca405


interface StateProps {  // Store에서 매핑되는 Props
  foregroundUrl: string,
  points: PointSet,
  calculatedPoints: PointSet,
  isSelectMode: boolean,
  isFocused: boolean,
  showPoints: boolean
}

interface OwnProps { // 컴포넌트의 보통 Props
  viewName: string,
}

interface DispatchProps { // Dispatch 가능한 method들
  onSetDataPoint: (imgCoord:Point, scrCoord:Point) => any;
  onMoveDataPoints: (updated:PointSet) => void;
  onUndo:()=>void;
  onRedo:()=>void;
  onDeleteDataPoints:(points:Set<string>)=>void;
}

type Props = StateProps & DispatchProps & OwnProps

function mapStateToProps(state: AppState, ownProps: OwnProps): StateProps {
  const frame = state.toolState.curFrame
  const view = ownProps.viewName
  const curPoints = getCurrentDataset(state.datasetState.dataset, frame, view);
  const imgUrl = getPictureUrl(state.datasetState.dataset, frame, view);
  const calculatedPoints = getCalculatedPoints(state.datasetState.dataset, frame, view)

  const res = {
    foregroundUrl: imgUrl,
    points: curPoints,
    calculatedPoints: calculatedPoints,
    isSelectMode: (state.toolState.toolSelected === ToolSelected.SelectMode),
    isFocused: (state.toolState.focusedView === ownProps.viewName),
    showPoints: state.toolState.showPoints
  }

  return res;
}

function thunkSetDataPoint(imgCoord:Point):
ThunkAction<void, AppState, unknown, ReduxAction<string>> 
{
  return (dispatch, getState) => {
    let state = getState();
    let frame = state.toolState.curFrame
    let view = state.toolState.focusedView
    let pointCls = state.toolState.pointClassSelected;
    if (pointCls) {
      let newData = _.clone(getCurrentDataset(state.datasetState.dataset, frame, view));
      newData[pointCls]=imgCoord
      dispatch(updateDatapoint(frame, view, newData))
    }
  }
}

function thunkMoveDataPoints(updated:PointSet):
ThunkAction<void, AppState, unknown, ReduxAction<string>> 
{
  return (dispatch, getState) => {
    let state = getState();
    let frame = state.toolState.curFrame
    let view = state.toolState.focusedView
    let newData = _.clone(getCurrentDataset(state.datasetState.dataset, frame, view));
    newData = {
      ...newData,
      ...updated
    };
    dispatch(updateDatapoint(frame, view, newData));
  }
}

function thunkDeleteDataPoints(selected:Set<string>):
ThunkAction<void, AppState, unknown, ReduxAction<string>> 
{
  return (dispatch, getState) => {
    if (selected.size === 0)
      return;

    let state = getState();
    let frame = state.toolState.curFrame
    let view = state.toolState.focusedView

    let del: string[] = [];

    for (let cls of selected) {
      del.push(cls);
    }
    dispatch(deleteDatapoint(frame, view, del));
  }
}

function thunkUndo():
ThunkAction<void, AppState, unknown, ReduxAction<string>> 
{
  return (dispatch, getState) => {
    let state = getState();
    let frame = state.toolState.curFrame
    let view = state.toolState.focusedView
    dispatch(undo(frame, view));
  }
}

function thunkRedo():
ThunkAction<void, AppState, unknown, ReduxAction<string>> 
{
  return (dispatch, getState) => {
    let state = getState();
    let frame = state.toolState.curFrame
    let view = state.toolState.focusedView
    dispatch(redo(frame, view));
  }
}

function mapDispatchToProps(dispatch:ThunkDispatch<{}, {}, any>, ownProps:OwnProps): DispatchProps {
  return {
    onSetDataPoint: (imgCoord:Point, scrCoord:Point) => {
      dispatch(thunkSetDataPoint(imgCoord))
    },
   onMoveDataPoints: (updated:PointSet)  => {
      dispatch(thunkMoveDataPoints(updated))
   },
   onUndo: () => {
     dispatch(thunkUndo())
   },
   onRedo: () => {
     dispatch(thunkRedo())
   },
   onDeleteDataPoints: (points:Set<string>) => {
     dispatch(thunkDeleteDataPoints(points))
   }
  }
}

export default connect<StateProps, DispatchProps, OwnProps, AppState>(mapStateToProps, mapDispatchToProps)(Editor);
