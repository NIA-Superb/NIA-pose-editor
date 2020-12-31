type ColorMap = {[key:string]:string };

export const pointClassColorMap: ColorMap = {
  'r-eye': '#FF0000',
  'l-eye': '#00FF00'
};

export const pointClassNameMap: {[key:string]:string} = {
  'r-eye': 'Right Eye',
  'l-eye': 'Left Eye',
};

export function classCodeToName(code: string):string {
  if (pointClassNameMap[code] === undefined)
    return code;
  return pointClassNameMap[code];
}

export function classCodeToColor(point:string):string {
  let names = Object.getOwnPropertyNames(pointClassColorMap);
  for (let i=0; i < names.length; i++) {
    if (names[i] === point) return pointClassColorMap[names[i]];
  }
  return '#FFFFFF'
}

export function colorCodeToColorNum(color:string):number {
  if (color.length === 4) {
    let res = (parseInt(color.substr(1,1), 16) * 16 + 15);
    res += res * 256 + (parseInt(color.substr(2,1), 16) * 16 + 15);
    res += res * 256 + (parseInt(color.substr(3,1), 16) * 16 + 15);
    return res;
  }
  else if (color.length === 7) {
    let res = (parseInt(color.substr(1,2), 16));
    res = res * 256 + (parseInt(color.substr(3,2), 16));
    res = res * 256 + (parseInt(color.substr(5,2), 16));
    return res;
  } else {
    return 0;
  }
}