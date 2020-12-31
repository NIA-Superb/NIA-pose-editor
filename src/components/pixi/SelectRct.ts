import * as ReactPixi from '@inlet/react-pixi'
import { Point } from '../../common'
import * as PIXI from 'pixi.js'



export interface SelectRctProps {
  p1: Point
  p2: Point
  visible?: boolean
}

export const SelectRct = ReactPixi.PixiComponent('SelectRct', {
  create: () => new PIXI.Graphics(),
  applyProps: (g, _, props:SelectRctProps) => {
    if (props.visible) {
      const { p1, p2 } = props
      g.clear();
      g.beginFill(0xFFFFFF, 0.3);
      g.lineStyle(2, 0xFFFFFF, 0.9);
      g.drawRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      g.endFill()
    } else {
      g.clear();
      g.endFill()
    }
  }
})

export default SelectRct