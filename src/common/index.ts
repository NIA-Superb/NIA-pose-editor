export interface Point {
  x: number
  y: number
}

export interface Point3d {
  x: number,
  y: number,
  z: number
}

export interface Rect {
  p1: Point // top left
  p2: Point // bottom right
}


export function makeRect(p1: Point, p2:Point) {
  const [x1, x2] = (p1.x < p2.x)? [p1.x, p2.x]: [p2.x, p1.x];
  const [y1, y2] = (p1.y < p2.y)? [p1.y, p2.y]: [p2.y, p1.y];
  return {
    p1: {x:x1, y:y1},
    p2: {x:x2, y:y2},
  }
}

function intersection1d(
  p11:number,
  p12:number,
  p21:number,
  p22:number
): [number, number] | null {
  if (p11 > p12) {
    [p11, p12] = [p12, p11];
  }
  if (p21 > p22) {
    [p21, p22] = [p22, p21];
  }
  let p1 = (p11 < p21)? p21: p11;
  let p2 = (p12 < p22)? p22: p12;
  if (p1 > p2) return null;
  return [p1, p2];
}

export function rectIntersection(r1: Rect, r2:Rect): Rect | null {
  let interx = intersection1d(r1.p1.x, r1.p2.x, r2.p1.x, r2.p2.x);
  let intery = intersection1d(r1.p1.y, r1.p2.y, r2.p1.y, r2.p2.y);
  if (interx ===null || intery===null) return null;
  return {
    p1: {x: interx[0], y: intery[0]},
    p2: {x: interx[1], y: intery[1]}
  }
}

export function rectArea(r: Rect): number {
  return Math.abs((r.p1.x - r.p2.x) * (r.p1.y - r.p2.y));
}

export function isIncluded(r: Rect, p: Point): boolean {
  return (
    r.p1.x <= p.x && r.p2.x >= p.x &&
    r.p1.y <= p.y && r.p2.y >= p.y 
    );
}