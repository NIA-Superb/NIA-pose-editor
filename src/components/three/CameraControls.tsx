import React from 'react';
import { extend, ReactThreeFiber, useFrame, useThree } from 'react-three-fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

extend({ OrbitControls });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'orbitControls': ReactThreeFiber.Object3DNode<OrbitControls, typeof OrbitControls>;
    }
  }
}

type orbitControls = ReactThreeFiber.Object3DNode<OrbitControls, typeof OrbitControls>;

export const CameraControls = (props:{[key:string]:any}) => {
  const {
    camera,
    gl: { domElement },
  } = useThree();
  const controls = React.createRef<orbitControls>();
  useFrame((state) => (controls.current!==null && controls.current.update !== undefined)?controls.current.update():null);
  return (<orbitControls
    {...props}
    ref={controls}
    args={[camera, domElement]}
  />);
};
