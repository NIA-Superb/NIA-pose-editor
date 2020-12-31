import React from 'react';
import clsx from 'clsx';
import ObserveSize from 'react-observe-size';

import { Action as ReduxAction } from 'redux'
import { connect } from 'react-redux';
import { ThunkDispatch, ThunkAction } from 'redux-thunk';

import { Theme } from '@material-ui/core/styles'
import { 
  AppBar, 
  Toolbar,
  Grid,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  WithStyles,
  withStyles,
  createStyles,
  Typography,
  Drawer,
  Divider,
  List,
  CssBaseline, 
  CircularProgress
} from '@material-ui/core';

import MenuIcon from '@material-ui/icons/Menu'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import CreateIcon from '@material-ui/icons/Create'
import SelectIcon from '@material-ui/icons/SelectAll'
import UndoIcon from '@material-ui/icons/Undo'
import RedoIcon from '@material-ui/icons/Redo'
import FileCopyIcon from '@material-ui/icons/FileCopy'
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import PlayCircleFilledIcon from '@material-ui/icons/PlayCircleFilled'
import PhotoLibraryIcon from '@material-ui/icons/PhotoLibrary'
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';

import PointClassSelect, { PointClassSelectComponent } from './PointClassSelect'
import DatasetPaginator from './DatasetPaginator'
import theme from '../theme';
import { AppState } from '../reducers';
import { ToolSelected } from '../actions/types';
import { selectTool, undo, redo, copyFromFrame, loadedDataset, updateCamParams, setPointClass, moveToFrame, updateCalculatedPoints, updateCalculatedPoints3d, setCalculationAvailability, updateBoneConnections, setPointVisibility } from '../actions';
import { canUndo, canRedo, getCurrentDataset, PointSet, Point3dSet } from '../common/dataset';
import FrameClassSelect, { FrameClassSelectComponent } from './FrameClassSelect';
import { Api } from '../common/api';
import { convertJSONDatasetToDataset, convertDatasetToJSONDataset } from '../common/convertDatasetFormat';
import predict3dPoints, { normalizePoint3dSet } from '../common/predict3dPoints';
import _ from 'lodash';
import Show3dDialog from '../components/Show3dDialog';
import { SimpleKeyboardEventListener } from '../common/utils';

const leftToolbarFullWidth = '15em';


const styles = (theme:Theme)=> createStyles({
  root : {
    display: 'flex',
    padding: 0,
    width: '100vw',
    height:' 100vh',
    overflow: 'hidden',
  },

  appBar: {
    position:'absolute',
    zIndex: theme.zIndex.drawer + 2,
    padding: 0,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },

  appBarShifted: {
    marginLeft: `${leftToolbarFullWidth}`,
    width: `calc(100% - ${leftToolbarFullWidth})`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },

  appBarTitle: {
    justifyContent: 'space-around'
  },
  expandToolbarButton: {
    marginRight: 36
  },
  expandToolbarButtonHidden: {
    display: 'none',
  },
  leftToolbar: {
    position: 'absolute',
    overflowX: 'hidden',
    whiteSpace: 'nowrap',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
  },
  leftToolbarOpened: {
    position: 'absolute',
    overflowX: 'hidden',
    whiteSpace: 'nowrap',
    width: leftToolbarFullWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  content: {
    position: 'absolute',
    margin: 0,
    padding: 0,
  },
});

interface FrameState {
  toolbarExpanded: boolean
  screenWidth: number
  screenHeight: number
  show3dDialogOpen: boolean
}

interface FrameProps extends WithStyles<typeof styles> {
  title: string
  children?:React.ReactNode
  toolInAddingMode?:boolean
  toolInSelectMode?:boolean
  canUndo?:boolean
  canRedo?:boolean
  onAddingMode?:(()=>any)
  onSelectMode?:(()=>any)
  onUndo?:(()=>any)
  onRedo?:(()=>any)
  onLoad?:(()=>any)

  onCopyFromPreviousFrame?:(()=>any)

  showPoints?: boolean
  onTogglePointVisibility?:(()=>any)

  onSave?:(()=>any)
  canCalculate?:boolean
  onCalculate?:(()=>any)

  canShow3d?:boolean
  onShow3d?:(()=>any)
  pos3dMap?: Point3dSet
  boneConnections?: [string, string][]
}

export const Frame = withStyles(styles)(
class extends React.Component<FrameProps, FrameState> {
  
  protected keyboardEventListener: SimpleKeyboardEventListener
  protected pointClassSelectRef: React.RefObject<PointClassSelectComponent>
  protected frameClassSelectRef: React.RefObject<FrameClassSelectComponent>

  constructor(props: FrameProps) {
    super(props);
    this.state = {
      toolbarExpanded: false,
      screenHeight: 0,
      screenWidth: 0,
      show3dDialogOpen: false
    }

    this.pointClassSelectRef = React.createRef()
    this.frameClassSelectRef = React.createRef()

    this.keyboardEventListener = new SimpleKeyboardEventListener((ev:KeyboardEvent)=>{
      if (ev.key === '1') {
        if (this.props.onAddingMode) this.props.onAddingMode()
      } else if (ev.key === '2') {
        this.pointClassSelectRef.current?.toggleMenu()
      } else if (ev.key === '3') {
        if (this.props.onSelectMode) this.props.onSelectMode()
      } else if (ev.key === '6') {
        if (this.props.onSave) this.props.onSave()
      } else if (ev.key === '7') {
        if (this.props.onCopyFromPreviousFrame) this.props.onCopyFromPreviousFrame()
      } else if (ev.key === '8') {
        if (this.props.onCalculate) this.props.onCalculate()
      } else if (ev.key === '9') {
        if (this.props.canShow3d) {
          if (!this.state.show3dDialogOpen)
            this.handleShow3dDialogOpen(); 
          else
            this.handleShow3dDialogClose(); 
        }
      } else if (ev.key === '0') {
        this.frameClassSelectRef.current?.toggleMenu()
      } else if (ev.key === 'v') {
        if (this.props.onTogglePointVisibility) this.props.onTogglePointVisibility()
      }
    })

  }

  handleShow3dDialogClose() {
    this.setState({
      show3dDialogOpen: false
    })
  }

  handleShow3dDialogOpen() {
    this.setState({
      show3dDialogOpen: true
    })
  }

  handleExpandToolbar() {
    this.setState({
      toolbarExpanded: true
    })
  }

  handleShrinkToolbar() {
    this.setState({
      toolbarExpanded: false
    })
  }

  updateScreenSize(rct:{width:number, height:number}) {
    this.setState({
      screenWidth: rct.width,
      screenHeight: rct.height,
    });
  }

  componentDidMount() {
    document.addEventListener("keydown", this.keyboardEventListener);
    if (this.props.onLoad)
      this.props.onLoad()
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.keyboardEventListener);
  }

  renderAppBar() {
    const props = this.props;
    const state = this.state;

    return (
      <div className={props.classes.root}>
      <AppBar position="absolute" className={clsx(props.classes.appBar, state.toolbarExpanded && props.classes.appBarShifted)}>
        <Toolbar>
          <IconButton 
              edge="start"
              className={clsx(props.classes.expandToolbarButton, state.toolbarExpanded && props.classes.expandToolbarButtonHidden )}
              color="inherit"
              aria-label="open drawer"
              onClick={()=>{this.handleExpandToolbar()}}
              >
            <MenuIcon />
          </IconButton>
          <Grid justify="space-between" container spacing={2}>
            <Grid item>
              <Typography variant="h6" color="inherit">
                {props.title}
              </Typography>
            </Grid>
            <Grid item>
              <DatasetPaginator />
            </Grid>
            <Grid item style={{width:'10%'}}></Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      </div>
    );
  }

  renderLeftToolbar() {
    const props = this.props;
    const state = this.state;
    return (
      <Drawer
        variant="permanent"
        classes={{
          paper: clsx(props.classes.leftToolbar, state.toolbarExpanded && props.classes.leftToolbarOpened),
        }}
        open={state.toolbarExpanded}>
        <div className={props.classes.toolbarIcon} onClick={()=>{this.handleShrinkToolbar()}}>
          <IconButton
            aria-label="close drawer">
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <List style={{overflow:"hidden"}}>
          <ListItem button selected={this.props.toolInAddingMode} onClick={()=>{if (this.props.onAddingMode) this.props.onAddingMode(); }}>
            <ListItemIcon><CreateIcon /> </ListItemIcon>
            <ListItemText primary="New point" />
          </ListItem>
          <ListItem button> 
            <PointClassSelect isShrinked={!state.toolbarExpanded} ref={this.pointClassSelectRef}/> 
          </ListItem>
          <ListItem button selected={this.props.toolInSelectMode} onClick={()=>{if (this.props.onSelectMode) this.props.onSelectMode(); }}>
            <ListItemIcon><SelectIcon /> </ListItemIcon>
            <ListItemText primary="Select" />
          </ListItem>
          <Divider variant="middle" />
          <ListItem button disabled={!this.props.canUndo} onClick={()=>{if (this.props.onUndo) this.props.onUndo(); }}>
            <ListItemIcon><UndoIcon /> </ListItemIcon>
            <ListItemText primary="Undo" />
          </ListItem>
          <ListItem button disabled={!this.props.canRedo} onClick={()=>{if (this.props.onRedo) this.props.onRedo(); }}>
            <ListItemIcon><RedoIcon /> </ListItemIcon>
            <ListItemText primary="Redo" />
          </ListItem>
          <Divider variant="middle" />
          <ListItem button onClick={()=>{if (this.props.onSave) this.props.onSave();}}>
            <ListItemIcon><SaveAltIcon /> </ListItemIcon>
            <ListItemText primary="Save" />
          </ListItem> 
          <ListItem button onClick={()=>{if (this.props.onCopyFromPreviousFrame) this.props.onCopyFromPreviousFrame();}}>
            <ListItemIcon><FileCopyIcon /> </ListItemIcon>
            <ListItemText primary="From prev frame" />
          </ListItem> 
          {
            (props.canCalculate)?(
              <ListItem button onClick={()=>{if (this.props.onCalculate) this.props.onCalculate(); }}>
                <ListItemIcon><PlayCircleFilledIcon /> </ListItemIcon>
                <ListItemText primary="Calculate" />
              </ListItem>
            ):
            (
              <ListItem>
                <ListItemIcon>
                  <CircularProgress size={25} />
                </ListItemIcon>
                <ListItemText primary="Calculate" />
              </ListItem>
            )
          }
          <Divider variant="middle" />
          <ListItem button disabled={!this.props.canShow3d} onClick={()=>{this.handleShow3dDialogOpen(); }}>
            <ListItemIcon><PhotoLibraryIcon/> </ListItemIcon>
            <ListItemText primary="Show 3D" />
          </ListItem>
          <Divider variant="middle" />
          <ListItem button>
            <FrameClassSelect ref={this.frameClassSelectRef} isShrinked={!state.toolbarExpanded}/> 
          </ListItem>
          <Divider variant="middle" />
          {
            (this.props.showPoints === undefined || this.props.showPoints === true) ?
              (
                <ListItem button onClick={() => { if (this.props.onTogglePointVisibility) this.props.onTogglePointVisibility() }}>
                  <ListItemIcon><VisibilityIcon /></ListItemIcon>
                  <ListItemText primary="Visible" />
                </ListItem>
              ) : (
                <ListItem button onClick={() => { if (this.props.onTogglePointVisibility) this.props.onTogglePointVisibility() }}>
                  <ListItemIcon><VisibilityOffIcon /></ListItemIcon>
                  <ListItemText primary="Hidden" />
                </ListItem>
              )
          }
        </List>
      </Drawer>
    )
  }
  
  render() {
    const state = this.state;
    const props = this.props;
    
    return (
      <ObserveSize observerFn={(rct: { width: number; height: number; })=>{this.updateScreenSize(rct)}}>
      <div className={props.classes.root} style={{width:'100vw', height:'100vh'}}>
        <CssBaseline />
        {this.renderAppBar()}
        {this.renderLeftToolbar()}
        <div className={props.classes.content} style={{
          left: theme.spacing(8),
          top: theme.spacing(9),
          width: state.screenWidth - theme.spacing(9),
          height: state.screenHeight - theme.spacing(10)
        }}>
          {props.children}
        </div>
        <Show3dDialog 
        open={this.state.show3dDialogOpen} 
        onClose={()=>{this.handleShow3dDialogClose();}} 
        pos3dMap={this.props.pos3dMap}
        boneConnections={this.props.boneConnections}
        title={"Preview"}/>
      </div>
      </ObserveSize>
    );
  }
})


interface StateProps {  // Store에서 매핑되는 Props
  toolInAddingMode?:boolean
  toolInSelectMode?:boolean
  canUndo?:boolean
  canRedo?:boolean
  canCalculate?: boolean
  canShow3d?: boolean
  pos3dMap?: Point3dSet
  boneConnections?: [string, string][]
  showPoints?: boolean
}

interface OwnProps { // 컴포넌트의 보통 Props
  title: string
  children?:React.ReactNode
}

interface DispatchProps { // Dispatch 가능한 method들
  onAddingMode?:(()=>any)
  onSelectMode?:(()=>any)
  onUndo?:(()=>any)
  onRedo?:(()=>any)
  onCopyFromPreviousFrame?:(()=>any)
  onCalculate?:(()=>any)
  onLoad?:(()=>any)
  onSave?:(()=>any)
  onTogglePointVisibility?:(()=>any)
}

type Props = StateProps & DispatchProps & OwnProps

function mapStateToProps(state: AppState, ownProps: OwnProps): StateProps {
  const toolState = state.toolState;
  const dataset = state.datasetState.dataset;
  const undoable = canUndo(dataset, toolState.curFrame, toolState.focusedView);
  const redoable = canRedo(dataset, toolState.curFrame, toolState.focusedView);
  const pos3d = dataset.frames[toolState.curFrame]?.computedPosition
  const canShow3d = (pos3d !== undefined) && (_.keys(pos3d).length > 0)
  const boneConnections = state.configsState.boneConnections

  return {
    toolInSelectMode: (state.toolState.toolSelected === ToolSelected.SelectMode),
    toolInAddingMode: (state.toolState.toolSelected === ToolSelected.AddingMode),
    canUndo: undoable,
    canRedo: redoable,
    canCalculate: state.toolState.canCalculate,
    canShow3d,
    pos3dMap: normalizePoint3dSet(pos3d),
    boneConnections,
    showPoints: state.toolState.showPoints
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

function thunkCopyFromPreviousFrame():
ThunkAction<void, AppState, unknown, ReduxAction<string>> 
{
  return (dispatch, getState) => {
    let state = getState();
    let frame = state.toolState.curFrame
    if (frame > 0)
      dispatch(copyFromFrame(frame-1, frame));
  }
}


function thunkCalculate():
ThunkAction<void, AppState, unknown, ReduxAction<string>> 
{
  return async (dispatch, getState) => {
    if (!getState().toolState.canCalculate)
      return

    dispatch(setCalculationAvailability(false))

    const state = getState()
    const dataset = state.datasetState.dataset
    const curFrame = state.toolState.curFrame
    const viewNames = state.datasetState.dataset.viewNames

    const camParams = state.configsState.camParams
    const pts: {[key:string]: PointSet} = {}

    viewNames.forEach((viewName)=>{
      const curViewPts = getCurrentDataset(dataset, curFrame, viewName)
      pts[viewName] = curViewPts
    })

    const point3d = state.datasetState.dataset.frames[curFrame].computedPosition
    const res = await predict3dPoints(camParams, pts, point3d)

    const newPos = res.pos
    const newPos3d = res.pos3d
    _.keys(newPos).forEach((viewName)=>{
      dispatch(updateCalculatedPoints(
        curFrame, viewName, newPos[viewName]
      ))
    })
    dispatch(updateCalculatedPoints3d(curFrame, newPos3d))
    dispatch(setCalculationAvailability(true))
  }
}

function thunkLoadDatasetAndConfigs():
ThunkAction<void, AppState, unknown, ReduxAction<string>> 
{
  return async (dispatch, getState) => {
    const api = new Api()
    const jsonDataset = await api.loadDataset();
    const imgRoot = await api.imageRoot();
    const dataset = convertJSONDatasetToDataset(jsonDataset, imgRoot)
    const camParams = await api.camParams();
    const boneConnections = await api.boneConnections();

    dispatch(updateCamParams(camParams))
    dispatch(loadedDataset(dataset))
    dispatch(setPointClass(dataset.pointTypes[0]))
    dispatch(updateBoneConnections(boneConnections))
    dispatch(moveToFrame(0))
  }
}

function thunkSaveDataset():
ThunkAction<void, AppState, unknown, ReduxAction<string>> 
{
  return async (dispatch, getState) => {
    const dataset = getState().datasetState.dataset
    const jsonDataset = convertDatasetToJSONDataset(dataset)

    const api = new Api()
    await api.saveDataset(jsonDataset)
  }
}

function thunkTogglePointVisibility():
ThunkAction<void, AppState, unknown, ReduxAction<string>> 
{
  return async (dispatch, getState) => {
    dispatch(setPointVisibility(!getState().toolState.showPoints))
  }
}

function mapDispatchToProps(dispatch:ThunkDispatch<{}, {}, any>, ownProps:OwnProps): DispatchProps {
  return {
    onAddingMode: () => {
      dispatch(selectTool(ToolSelected.AddingMode))
    },
    onSelectMode: () => {
      dispatch(selectTool(ToolSelected.SelectMode))
    },
    onUndo: () => {
      dispatch(thunkUndo());
    },
    onRedo: () => {
      dispatch(thunkRedo());
    },
    onCopyFromPreviousFrame: () => {
      dispatch(thunkCopyFromPreviousFrame());
    },
    onCalculate: () => {
      dispatch(thunkCalculate());
    },
    onLoad: () => {
      dispatch(thunkLoadDatasetAndConfigs());
    },
    onSave: () => {
      dispatch(thunkSaveDataset());
    },
    onTogglePointVisibility: () => {
      dispatch(thunkTogglePointVisibility());
    },
  }
}

export const ToolFrame = connect<StateProps, DispatchProps, OwnProps, AppState>(mapStateToProps, mapDispatchToProps)(Frame);
export default ToolFrame;

