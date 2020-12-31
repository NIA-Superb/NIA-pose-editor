import * as ReactPixi from '@inlet/react-pixi'
import { Point } from '../../common'
import { MarkStyle } from "../Editor"
import * as PIXI from 'pixi.js'

export interface MarkerProps {
  point: Point
  color: number
  size: number
  holeSize: number,
  style: MarkStyle
}

export const Marker = ReactPixi.PixiComponent('Marker', {
  create: () => new PIXI.Graphics(),
  applyProps: (g, _, props: MarkerProps) => {
    const x = props.point.x
    const y = props.point.y
    const {color, size, holeSize, style} = props
    g.clear();

    switch (props.style) {
      case MarkStyle.Normal:
        g.lineStyle(3, 0x0, 1.0);
        break;
      case MarkStyle.Selected:
        g.lineStyle(5, 0x0, 1.0);
        break;
      case MarkStyle.Moving:
        g.lineStyle(3, 0x0, 0.3);
        break;
    }

    g.moveTo(x - size, y);
    g.lineTo(x - holeSize, y);
    g.moveTo(x + holeSize, y);
    g.lineTo(x + size, y);
    g.moveTo(x, y - size);
    g.lineTo(x, y - holeSize);
    g.moveTo(x, y + holeSize);
    g.lineTo(x, y + size);
    g.drawCircle(x, y, (size + holeSize) / 2);

    switch (style) {
      case MarkStyle.Normal:
        g.lineStyle(1, color, 1.0);
        break;
      case MarkStyle.Selected:
        g.lineStyle(1, color, 1.0);
        break;
      case MarkStyle.Moving:
        g.lineStyle(1, color, 0.3);
        break;
    }

    g.moveTo(x - size, y);
    g.lineTo(x - holeSize, y);
    g.moveTo(x + holeSize, y);
    g.lineTo(x + size, y);
    g.moveTo(x, y - size);
    g.lineTo(x, y - holeSize);
    g.moveTo(x, y + holeSize);
    g.lineTo(x, y + size);

    switch (style) {
      case MarkStyle.Normal:
        g.beginFill(color, 0.3);
        break;
      case MarkStyle.Selected:
        g.beginFill(color, 0.6);
        break;
      case MarkStyle.Moving:
        g.beginFill(color, 0.1);
        break;
    }

    g.drawCircle(x, y, (size + holeSize) / 2);
    g.endFill()
  }
})

export default Marker
