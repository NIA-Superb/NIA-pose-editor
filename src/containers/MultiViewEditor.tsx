import { AppState } from "../reducers";
import { setFocusToView } from "../actions";
import { ThunkDispatch } from "redux-thunk";
import { connect } from 'react-redux';
import React from "react";
import DatasetEditor from "./DatasetEditor";


interface StateProps {  // Store에서 매핑되는 Props
  views: string[]
}

interface OwnProps { // 컴포넌트의 보통 Props
  backgroundUrl: string,
}

interface DispatchProps { // Dispatch 가능한 method들
  onFocused:(viewName:string)=>any
}

type Props = StateProps & DispatchProps & OwnProps

class MultiViewFrame extends React.Component<Props> {
  render() {
    let numViews = this.props.views.length;
    let numCol = Math.ceil(Math.sqrt(numViews));
    let numRow = Math.ceil(numViews / numCol);
    let elems: React.ReactNode[] = [];
    for (let i=0; i<numRow; i++) {
      let colElems: React.ReactNode[] = [];
      for (let j=0; j<numCol; j++) {
        let idx = i * numCol + j;
        if (idx >= this.props.views.length)
            continue;
        let curView = this.props.views[idx];
        let elem = (
            <div style={{
                width:`calc(${100.0 / numCol}% - 3px)`, 
                height:`calc(100.0% - 3px)`,
                display:'inline-flex',
                }}
                key={`div-DatasetEditor-for-${curView}`} 
                >
            <DatasetEditor
              viewName={curView}
              key={`DatasetEditor-for-${curView}`} 
              backgroundUrl={this.props.backgroundUrl}
              onFocused={()=>{this.props.onFocused(curView);}}
            />
            </div>
        );
        colElems.push(elem);
      }
      elems.push(
          <div style={{
              height:`calc(${100.0 / numRow}% - 3px)`,
              width: `calc(100% - 10px)`,
              marginBottom: '6px',
          }}
          key={`div-DatasetEditor-row-${i}`} 
          >
            {colElems}
          </div>
      );
    }
    return elems;
  }
}

function mapStateToProps(state: AppState, ownProps: OwnProps): StateProps {
  const views = state.datasetState.dataset.viewNames;

  const res = {
    views
  };
  return res;
}

function mapDispatchToProps(dispatch:ThunkDispatch<{}, {}, any>, ownProps:OwnProps): DispatchProps {
  return {
    onFocused: (v:string) => {
      dispatch(setFocusToView(v));
    },
  }
}

export default connect<StateProps, DispatchProps, OwnProps, AppState>(mapStateToProps, mapDispatchToProps)(MultiViewFrame);
