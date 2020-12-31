import * as ReactPixi from '@inlet/react-pixi'
import { Point } from '../../common'
import * as PIXI from 'pixi.js'



export interface BoxProps {
  p1: Point
  p2: Point
  color: number
  alpha: number
  visible?: boolean
}

export const Box = ReactPixi.PixiComponent('Box', {
  create: () => new PIXI.Graphics(),
  applyProps: (g, _, props:BoxProps) => {
    if (props.visible) {
      const { p1, p2 } = props
      g.clear();
      g.beginFill(props.color, props.alpha);
      g.drawRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      g.endFill()
    } else {
      g.clear();
      g.endFill()
    }
  }
})

export default Box