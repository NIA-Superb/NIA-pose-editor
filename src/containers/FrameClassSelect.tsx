import { AppState } from "../reducers";
import { Action as ReduxAction } from 'redux'
import { ThunkDispatch, ThunkAction } from "redux-thunk";
import { connect } from 'react-redux';
import { Select, MenuItem, FormControl, InputLabel } from '@material-ui/core';
import React from 'react';
import { ArrowDropDown } from "@material-ui/icons";
import { updateFrameType } from "../actions/dataset";
import { getFrameType } from "../common/dataset";

// 아래 링크에 설명된 컨벤션을 따랐다.
// https://medium.com/@peatiscoding/typescripts-with-redux-redux-thunk-recipe-fcce4ffca405

interface SelectProps {
  classes: string[],
  selected: string | null,
  onChange?: ((v:string)=>any),
  isShrinked: boolean
}

interface SelectState {
  open: boolean
}

export class FrameClassSelectComponent extends React.Component<SelectProps, SelectState> {
  constructor(props:SelectProps) {
    super(props)
    this.state = {
      open: false
    }
  }

  openMenu() {
    this.setState({open: true})
  }

  closeMenu() {
    this.setState({open: false})
  }

  toggleMenu() {
    const nextOpen = !this.state.open
    this.setState({open: nextOpen})
  }

  render() {
    let children: React.ReactChild[] = [];
    for (let idx in this.props.classes) {
      let clscode = this.props.classes[idx];
      children.push((
        <MenuItem value={clscode} key={`frameselectclass-item-${clscode}`}>
          {clscode}
        </MenuItem>
      ));
    }
    return (
      <FormControl style={
      (this.props.isShrinked)?{width:"1.5em"}: {width:'100%'}
      }>
      <InputLabel id="frame-class-select">class</InputLabel>
        <Select
          onOpen={() => {
            this.setState({ open: true })
            console.log('open')
          }}
          onClose={() => {
            this.setState({ open: false })
            console.log('close')
          }}
          open={this.state.open}
          labelId='frame-class-select'
          value={this.props.selected}
          style={
            (this.props.isShrinked) ? { width: "1.5em" } : { width: '100%' }
          }
          onChange={(e: React.ChangeEvent<{ name?: string | undefined; value: unknown; }>) => {
            if (this.props.onChange !== undefined) {
              let value = e.target.value as string;
              this.props.onChange(value);
            }
          }}
          IconComponent={(this.props.isShrinked) ? ("b") : ArrowDropDown}
          renderValue={(v) => {
            let vstr = `${v}`;
            if (this.props.isShrinked) {
              return (<span>...</span>);
            } else {
              return (<div> {vstr} </div>);
            }
          }}>
          {children}
        </Select>
      </FormControl>
    );
  }
}


interface StateProps {  // Store에서 매핑되는 Props
  classes: string[],
  selected: string | null,
}

interface OwnProps { // 컴포넌트의 보통 Props
}

interface DispatchProps { // Dispatch 가능한 method들
  onChange: ((v: string) => any)
}

type Props = StateProps & DispatchProps & OwnProps

function thunkUpdateFrameType(frameType: string):
ThunkAction<void, AppState, unknown, ReduxAction<string>> 
{
  return (dispatch, getState) => {
    const state = getState();
    dispatch(updateFrameType(state.toolState.curFrame, frameType))
  }
}
function mapStateToProps(state: AppState, ownProps: OwnProps): StateProps {
  return {
    classes: state.datasetState.dataset.frameTypes,
    selected: getFrameType(state.datasetState.dataset, state.toolState.curFrame)
  }
}

function mapDispatchToProps(dispatch:ThunkDispatch<{}, {}, any>, ownProps:OwnProps): DispatchProps {
  return {
    onChange: (v:string) => {
      dispatch(thunkUpdateFrameType(v))
    },
  }
}

export default connect<StateProps, DispatchProps, OwnProps, AppState>(mapStateToProps, mapDispatchToProps, null, {forwardRef: true})(FrameClassSelectComponent);

