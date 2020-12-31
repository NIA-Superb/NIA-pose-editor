import * as tf from '@tensorflow/tfjs';
import { LayerArgs as BaseLayerArgs } from '@tensorflow/tfjs-layers/dist/engine/topology'
import { Point } from '.';
import { Point3dSet, PointSet } from './dataset';
import _ from 'lodash'

export interface CamParams {
  R:number[]
  T:number[]
  f:number[]
  c:number[]
}

interface Proj3dTo2dLayerArgs extends BaseLayerArgs {
  camParams: {[key:string]:CamParams}
  numPoints: number
  views: string[]
  inputShape?:any
}

class Project3dTo2dLayer extends tf.layers.Layer {
  protected matR: {[key:string]:tf.Tensor}
  protected vecT: {[key:string]:tf.Tensor}
  protected vecF: {[key:string]:tf.Tensor}
  protected vecC: {[key:string]:tf.Tensor}
  protected x: tf.LayerVariable | undefined
  protected views: string[]
  protected numPoints: number

  constructor(config: Proj3dTo2dLayerArgs) {
    super(config);
    
    const vars = tf.tidy(()=>{
      let R: {[key:string]:tf.Tensor} = {}
      let T: {[key:string]:tf.Tensor} = {}
      let f: {[key:string]:tf.Tensor} = {}
      let c: {[key:string]:tf.Tensor} = {}
      for (const idx in config.camParams) {
        R[idx] = tf.tensor2d(config.camParams[idx].R, [3, 3])
        T[idx] = tf.tensor1d(config.camParams[idx].T)
        f[idx] = tf.tensor1d(config.camParams[idx].f)
        c[idx] = tf.tensor1d(config.camParams[idx].c)
      }
      return { R, T, f, c };
    })
    this.matR = vars.R
    this.vecT = vars.T
    this.vecF = vars.f
    this.vecC = vars.c
    this.numPoints = config.numPoints
    this.views = config.views
  }
  
  build(inputShape: any) {
    this.x = this.addWeight('x', [3, this.numPoints], 'float32', tf.initializers.zeros());
  }

  /**
   * call() contains the actual numerical computation of the layer.
   *
   * It is "tensor-in-tensor-out". I.e., it receives one or more
   * tensors as the input and should produce one or more tensors as
   * the return value.
   *
   * Be sure to use tidy() to avoid WebGL memory leak. 
   */
  call(inputs:tf.Tensor[]): tf.Tensor[] {
    return tf.tidy(() => {
      let diffs:tf.Tensor[] = [];
      for (let idx = 0; idx < this.views.length; idx++) {
        const viewName = this.views[idx];
        const inputPts = inputs[idx * 2]
        const inputMask = inputs[idx * 2 + 1]
        const translated =  this.x!.read().add(this.vecT[viewName].reshape([3, 1])) // [3, numPts]
        const r = tf.matMul(this.matR[viewName], translated); // [3, numPts]
        const xy = r.slice([0, 0], [2, this.numPoints])
        const z = r.slice([2, 0], [1, this.numPoints])
        const xyDivZ = xy.div(z) // [2, numPts]
        const projected= xyDivZ.mul(this.vecF[viewName].reshape([2, 1])).add(this.vecC[viewName].reshape([2, 1]))
        const diff = projected.sub(inputPts).mul(inputMask.reshape([1, this.numPoints]))
        diffs.push(diff)
      }
      return diffs
    });
  }

  /**
   * getConfig() generates the JSON object that is used
   * when saving and loading the custom layer object.
   */
  getConfig() {
    const config = super.getConfig();
    return config;
  }
  
  /**
   * The static className getter is required by the 
   * registration step (see below).
   */
  static get className() {
    return 'Project3dTo2d';
  }

  computeOutputShape(inputShape:tf.Shape[]):tf.Shape[] {
    const numInputs = inputShape.length / 2
    const res: tf.Shape[] = [];
    for (let i=0; i < numInputs; i++)
      res.push(inputShape[2 * i])
    return res;
  }
}

async function predict3dPoints(
  viewConfig: {[key:string]:CamParams},
  pts: {[key:string]: PointSet}, // pts[viewName][ptsType]
  initPoint3d?: Point3dSet
) {
  let viewNames:string[] = [];
  let ptsTypes: string[] = [];

  // set ViewNames
  viewNames = Object.keys(viewConfig)

  // set ptsTypes
  {
    let ptsTypeSet: Set<string> = new Set();
    for (let viewName of Object.keys(pts)) {
      const ptsSet = pts[viewName]
      for (let ptsType of Object.keys(ptsSet)) {
        ptsTypeSet.add(ptsType)
      }
    }
    ptsTypeSet.forEach((x)=>ptsTypes.push(x))
    ptsTypes.sort()
  }

  const numPoints = ptsTypes.length
  const inputData = tf.tidy(()=>{
    let inputs = [];

    for (let viewName of viewNames) {
      let raw_input: number[] = [];
      let mask: number[] = [];
      for (let ptsType of ptsTypes) {
        const ent: Point | undefined = pts[viewName][ptsType]
        if (ent === undefined) {
          mask.push(0)
          raw_input.push(0, 0)
        } else {
          mask.push(1)
          raw_input.push(ent.x, ent.y)
        }
      }

      let input_tensor = tf.tensor(raw_input, [raw_input.length / 2, 2]).transpose().reshape([1, 2, (raw_input.length / 2)])
      let input_mask = tf.tensor(mask, [1, (raw_input.length / 2)])

      inputs.push(input_tensor)
      inputs.push(input_mask)
    }

    return { inputs, viewNames }
  })

  const initPos3d= (initPoint3d)?tf.tidy(()=>{
    const rawData:number[] = [];
    ptsTypes.forEach((ptsType)=>{rawData.push(initPoint3d[ptsType]?.x || (Math.random()-0.5))})
    ptsTypes.forEach((ptsType)=>{rawData.push(initPoint3d[ptsType]?.y || (Math.random()-0.5))})
    ptsTypes.forEach((ptsType)=>{rawData.push(initPoint3d[ptsType]?.z || (Math.random()-0.5))})
    return tf.tensor2d(rawData, [3, rawData.length / 3])
  }): null;

  const inputs = inputData.inputs
  const views = inputData.viewNames

  const targets: tf.Tensor[] = [];
  for (let i=0; i < inputs.length; i += 2)
    targets.push(tf.zerosLike(inputs[i]))

  const inputTensors: tf.SymbolicTensor[] = []
  for (let idx=0; idx < inputs.length; idx++) 
    inputTensors.push(tf.input({shape:inputs[idx].shape.slice(1)}))
  
  const projectLayer = new Project3dTo2dLayer({
    camParams: viewConfig,
    numPoints,
    views,
  })
  const projErr = projectLayer.apply(inputTensors) as tf.SymbolicTensor
  const model = tf.model({inputs: inputTensors, outputs: projErr});

  model.compile({
    optimizer: tf.train.momentum(1.0, 0.3, true),
    loss: tf.losses.meanSquaredError,
    metrics: ['mse']
  })

  if (initPos3d)
    projectLayer.setWeights([initPos3d])


  for (let i=0; i<100; i++) {
    const history = await model.fit(inputs, targets, {
      epochs: 10,
      batchSize: 1,
      verbose: 1,
    })
    let loss = history.history.loss as number[]
    loss = loss.map(x=>(Math.sqrt(x/numPoints / 2))) // rms difference
    const diff = Math.abs((loss[0] - loss[loss.length - 1]) / (loss[0] + 1e-12)) / loss.length
    if (diff < 1e-3 && i > 10) break
  }

  let newPosMap: {[key:string]:PointSet} = {}
  const diffTensors = model.predict(inputs) as tf.Tensor[]
  const diffArr: Float32Array[] = [];

  for (let i=0; i<diffTensors.length; i++)
    diffArr.push((await diffTensors[i].data()) as Float32Array)
  
  viewNames.forEach((viewName, viewIdx)=>{
    newPosMap[viewName] = {}
    const diff = diffArr[viewIdx]
    ptsTypes.forEach((ptsType, ptsIdx)=>{
      const x = pts[viewName][ptsType].x + diff[ptsIdx + 0]
      const y = pts[viewName][ptsType].y + diff[ptsIdx + 0]
      newPosMap[viewName][ptsType] = {x, y}
    })
  })

  const pos3d = await projectLayer.getWeights()[0].data()
  let newPos3dMap: Point3dSet = {}
  ptsTypes.forEach((ptsName, ptsidx)=>{
    newPos3dMap[ptsName] = {
      x: pos3d[ptsidx],
      y: pos3d[1 * ptsTypes.length + ptsidx],
      z: pos3d[2 * ptsTypes.length + ptsidx],
    }
  })

  return {
    pos3d: newPos3dMap,
    pos: newPosMap
  }
}

export function normalizePoint3dSet(pos3dMap: Point3dSet): Point3dSet {
  let meanX: number = 0
  let meanY: number = 0
  let meanZ: number = 0
  let cnt: number = 0
  let scaleX: number = 0
  let scaleY: number = 0
  let scaleZ: number = 0

  for (const ptsType of _.keys(pos3dMap)) {
    const ent = pos3dMap[ptsType]
    meanX += ent.x
    meanY += ent.y
    meanZ += ent.z
    cnt += 1
  }
  meanX /= (cnt + 1e-10)
  meanY /= (cnt + 1e-10)
  meanZ /= (cnt + 1e-10)

  for (const ptsType of _.keys(pos3dMap)) {
    const ent = pos3dMap[ptsType]
    scaleX = Math.max(scaleX, Math.abs(ent.x - meanX))
    scaleY = Math.max(scaleY, Math.abs(ent.y - meanY))
    scaleZ = Math.max(scaleZ, Math.abs(ent.z - meanZ))
  }

  const scale = Math.max(scaleX, scaleY, scaleZ)
  const scaleMin = Math.min(scaleX, scaleY, scaleZ)

  let newPos3dMap: Point3dSet = {}
  for (const ptsType of _.keys(pos3dMap)) {
    const ent = pos3dMap[ptsType]
    let x = (ent.x - meanX) / scale
    let y = (ent.y - meanY) / scale
    let z = (ent.z - meanZ) / scale
    if (scaleX === scaleMin) {
      if (scaleY === scale) 
        newPos3dMap[ptsType]={ x: z, y: -y, z: x }
      else 
        newPos3dMap[ptsType]={ x: -y, y: -z, z: x }
    } else if (scaleY === scaleMin) {
      if (scaleX === scale) 
        newPos3dMap[ptsType]={ x: -z, y: -x, z: y }
      else 
        newPos3dMap[ptsType]={ x: x, y: -z, z: y }
    } else {
      if (scaleX === scale) 
        newPos3dMap[ptsType]={ x: -y, y: x, z: z }
      else 
        newPos3dMap[ptsType]={ x: x, y: y, z: z }
    }

  }
  return newPos3dMap 
}


export default predict3dPoints;
