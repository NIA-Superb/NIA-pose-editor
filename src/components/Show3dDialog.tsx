import React from 'react';
import { createStyles, Theme, WithStyles, withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';

import { Canvas } from 'react-three-fiber'
import _ from 'lodash'
import { Point3dSet } from '../common/dataset';
import { Mesh } from 'three';
import { CameraControls } from './three/CameraControls'
import * as three from 'three'


interface PointProps {
  x: number
  y: number
  z: number
  scale: number
}

interface BoneProps {
  x1: number
  y1: number
  z1: number
  x2: number
  y2: number
  z2: number
  scale: number
}

class Bone extends React.Component<BoneProps> {
  protected mesh: React.Ref<Mesh>;

  constructor(props: BoneProps) {
    super(props)
    this.mesh = React.createRef()
  }

  render() {
    const cx = (this.props.x1 + this.props.x2) / 2
    const cy = (this.props.y1 + this.props.y2) / 2
    const cz = (this.props.z1 + this.props.z2) / 2

    let dx = (this.props.x2 - this.props.x1) 
    let dy = (this.props.y2 - this.props.y1) 
    let dz = (this.props.z2 - this.props.z1) 
    const sz = Math.sqrt( dx * dx + dy * dy + dz * dz )

    dx /= sz
    dy /= sz
    dz /= sz

    if (dz < 0) {
      dx = -dx
      dy = -dy
      dz = -dz
    }

    const phi = Math.asin(dz)
    let psi = Math.asin(Math.abs(dx) / Math.sqrt(1 - dz * dz))
    if (dx > 0 && dy > 0 ) {
      psi = -psi
    } else if (dx > 0 && dy <= 0) {
      psi = -(3.141592 - psi)
    } else if (dx <= 0 && dy > 0) {
      // do nothing
    } else if (dx <= 0 && dy <= 0) {
      psi = (3.141592 - psi)
    }
    const angle = new three.Euler(phi, 0, psi, 'ZXY')

    return (
      <mesh
        ref={this.mesh}
        scale={[1, 1, 1]}
        position={[cx, cy, cz]}
        rotation={angle}
      >
        <cylinderBufferGeometry attach="geometry"
        args={[this.props.scale, this.props.scale, sz]} />
        <meshStandardMaterial attach="material" color={'orange'} />
      </mesh>
    )
  }
}

class Point extends React.Component<PointProps> {
  protected mesh: React.Ref<Mesh>;

  constructor(props: PointProps) {
    super(props)
    this.mesh = React.createRef()
  }

  render() {
    return (
      <mesh
        ref={this.mesh}
        scale={[this.props.scale, this.props.scale, this.props.scale]}
        position={[this.props.x, this.props.y, this.props.z]} >
        <sphereBufferGeometry attach="geometry" args={[1, 16, 12]} />
        <meshStandardMaterial attach="material" color={'hotpink'} />
      </mesh>
    )
  }
}


const styles = (theme: Theme) => createStyles({
  root: {
    margin: 0,
    padding: theme.spacing(2),
  },

  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },

  title: {
    padding: theme.spacing(2),
  },

  content: {
    padding: theme.spacing(2),
  },

  actions: {
    margin: 0,
    padding: theme.spacing(1),
  },
});

export interface DialogProps extends WithStyles<typeof styles>{
  open?: boolean
  onClose?: (()=>any)
  title?: React.ReactNode
  pos3dMap?: Point3dSet
  boneConnections?: [string, string][]
}

export interface DialogState {
}


export const Show3dDialog = withStyles(styles)(
class extends React.Component<DialogProps, DialogState> {
  constructor(props: DialogProps) {
    super(props);
    this.state = {
      cameraDist: 2,
      vec: [0, 0, -1]
    }
  }

  renderTitle() {
    const classes = this.props.classes;

    return (
      <MuiDialogTitle disableTypography className={classes.title}>
        <Typography variant="h6">{this.props.title}</Typography>
        {this.props.onClose ? (
          <IconButton aria-label="close" className={classes.closeButton} onClick={this.props.onClose}>
            <CloseIcon />
          </IconButton>
        ) : null}
      </MuiDialogTitle>
    );
  }

  renderPoints() {
    const res:React.ReactNode[] = [];
    if (this.props.pos3dMap !== undefined) {
      for (const ptsType of _.keys(this.props.pos3dMap)) {
        const ent = this.props.pos3dMap[ptsType]
        res.push(
          <Point key={`point-${ptsType}`}
            x={ent.x}
            y={ent.y}
            z={ent.z}
            scale={0.01}
          />
        )
      }
    }

    return res
  }

  renderBones() {
    const res:React.ReactNode[] = [];

    if (this.props.pos3dMap !== undefined && this.props.boneConnections !== undefined) {
      for (const pair of this.props.boneConnections) {
        const p1 = pair[0]
        const p2 = pair[1]
        if (_.has(this.props.pos3dMap, p1) && _.has(this.props.pos3dMap, p2)) {
          const coord1 = this.props.pos3dMap[p1]
          const coord2 = this.props.pos3dMap[p2]
          res.push(
            <Bone 
              x1={coord1.x} y1={coord1.y} z1={coord1.z}
              x2={coord2.x} y2={coord2.y} z2={coord2.z}
              scale={0.005}
              key={`bone-${p1}-${p2}`}
            />
          )          
        }
      }
    }

    return res
  }

  render() {
  return (
    <div>
      <Dialog
      onClose={this.props.onClose} 
      aria-labelledby="customized-dialog-title" 
      open={(this.props.open)?true:false}
      fullScreen={true}>
        {this.renderTitle()}
        <MuiDialogContent dividers className={this.props.classes.content}>
          <Canvas>
            <CameraControls 
              enablePan={false}
              maxDistance={1.5}
              minDistance={0.6}
            />
            <ambientLight />
            <pointLight position={[10, 10, 10]} />
            {this.renderPoints()}
            {this.renderBones()}
          </Canvas>
        </MuiDialogContent>
        <MuiDialogActions className={this.props.classes.actions}>
          <Button autoFocus onClick={this.props.onClose} color="primary">
            Close
          </Button>
        </MuiDialogActions>
      </Dialog>
    </div>
  );
  }
})

export default Show3dDialog;