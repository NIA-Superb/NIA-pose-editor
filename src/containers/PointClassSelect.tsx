import { AppState } from "../reducers";
import { setPointClass } from "../actions";
import { ThunkDispatch } from "redux-thunk";
import { connect } from 'react-redux';
import { classCodeToName, classCodeToColor } from '../common/config';
import { Select, MenuItem } from '@material-ui/core';
import React from 'react';
import { ArrowDropDown } from "@material-ui/icons";

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

export class PointClassSelectComponent extends React.Component<SelectProps, SelectState> {
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
    let children: React.ReactNode[] = [];
    for (let idx in this.props.classes) {
      let clscode = this.props.classes[idx];
      let name = classCodeToName(clscode);
      children.push((
        <MenuItem value={clscode} key={`ptsselectclass-item-${clscode}`} >
          <span style={{width:'1em', height:'1em', border: '1px solid #000', background: classCodeToColor(clscode), marginRight:'0.5em'}}></span>
          {name}
        </MenuItem>
      ));
    }
    let selected: string | null = this.props.selected

    if (selected !== null) {
      let found = false
      for (const ent of this.props.classes) {
        if (ent === selected) {
          found = true
          break
        }
      }
      if (!found) selected = null
    } 
    if (selected === null) selected = '';

    return (
      <Select 
        onOpen={() => { this.setState({ open: true })
      console.log('open')
     }}
        onClose={() => { this.setState({ open: false }) 
      console.log('close')
      }}
        open={this.state.open}
        value={selected}
        style={{ width: '100%' }}
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
            return (<div><div style={{
              border: '1px solid #000',
              background: classCodeToColor(vstr),
              width: '1em',
              height: '1em',
              marginLeft: '0.1em',
            }}></div>
            </div>);
          } else {
            return (<div><div style={{
              border: '1px solid #000',
              background: classCodeToColor(vstr),
              width: '1em',
              height: '1em',
              marginLeft: '0.1em',
              marginRight: '0.5em',
              display: 'inline-block',
              verticalAlign: 'middle',
            }}></div>
              {classCodeToName(vstr)}
            </div>);
          }
        }}>
        {children}
      </Select>
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
  onChange: ((v:string)=>any)
}

type Props = StateProps & DispatchProps & OwnProps

function mapStateToProps(state: AppState, ownProps: OwnProps): StateProps {
  return {
    classes: state.datasetState.dataset.pointTypes,
    selected: state.toolState.pointClassSelected
  }
}

function mapDispatchToProps(dispatch:ThunkDispatch<{}, {}, any>, ownProps:OwnProps): DispatchProps {
  return {
    onChange: (v:string) => {
      dispatch(setPointClass(v))
    },
  }
}

export default connect<StateProps, DispatchProps, OwnProps, AppState>(mapStateToProps, mapDispatchToProps, null, {forwardRef: true})(PointClassSelectComponent);

