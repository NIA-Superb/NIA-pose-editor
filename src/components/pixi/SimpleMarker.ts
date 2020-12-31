import * as ReactPixi from '@inlet/react-pixi'
import { Point } from '../../common'
import * as PIXI from 'pixi.js'

export interface SimpleMarkerProps {
  point: Point
  color: number
  size: number
}

export const SimpleMarker = ReactPixi.PixiComponent('SimpleMarker', {
  create: () => new PIXI.Graphics(),
  applyProps: (g, _, props:SimpleMarkerProps) => {
    const { point, color, size } = props
    const { x, y } = point
    g.clear();

    g.lineStyle(3, 0x0, 0.3);
    g.drawCircle(x, y, size);

    g.beginFill(color, 0.6);
    g.lineStyle(1, color, 0.6);
    g.drawCircle(x, y, size);
    g.endFill()
  }
})

export default SimpleMarker