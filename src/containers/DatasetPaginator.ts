import { AppState } from "../reducers";
import { moveToFrame } from "../actions";
import _ from 'lodash'
import { ThunkDispatch } from "redux-thunk";
import { connect } from 'react-redux';
import { Paginator } from '../components/Paginator';

// 아래 링크에 설명된 컨벤션을 따랐다.
// https://medium.com/@peatiscoding/typescripts-with-redux-redux-thunk-recipe-fcce4ffca405


interface StateProps {  // Store에서 매핑되는 Props
  minPage: number
  maxPage: number
  currentPage: number
}

interface OwnProps { // 컴포넌트의 보통 Props
}

interface DispatchProps { // Dispatch 가능한 method들
  onPageChange: ((v:number)=>any)
}

type Props = StateProps & DispatchProps & OwnProps

function mapStateToProps(state: AppState, ownProps: OwnProps): StateProps {
  const frame = state.toolState.curFrame
  const numFrames = state.datasetState.dataset.frames.length;

  const res = {
    minPage: 1,
    maxPage: _.max([1, numFrames])!,
    currentPage: frame + 1
  };
  return res;
}

function mapDispatchToProps(dispatch:ThunkDispatch<{}, {}, any>, ownProps:OwnProps): DispatchProps {
  return {
    onPageChange: (v:number) => {
      dispatch(moveToFrame(v-1));
    },
  }
}

export default connect<StateProps, DispatchProps, OwnProps, AppState>(mapStateToProps, mapDispatchToProps)(Paginator);
