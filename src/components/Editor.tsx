import React, { ReactChild, ReactNode } from 'react';
import { Viewport, defaultViewport, fixViewport, effectiveMagnification, toScreenCoord, toImageCoord, resetViewport } from '../common/viewport';
import { Stage, TilingSprite, Sprite, Text} from '@inlet/react-pixi';
import * as PIXI  from 'pixi.js';
import { Point, Rect, makeRect, isIncluded, rectArea } from '../common';
import { PointSet } from '../common/dataset'

import _ from 'lodash';
import ResizeOberver from 'resize-observer-polyfill';
import { classCodeToColor, colorCodeToColorNum, classCodeToName } from '../common/config';
import { SimpleKeyboardEventListener } from '../common/utils';
import Marker from './pixi/Marker';
import SimpleMarker from './pixi/SimpleMarker';
import SelectRct from './pixi/SelectRct';
import Box from './pixi/Box';

/*
FSM을 이용해 에디터의 상태를 모델링한다.

# editState 
- Normal: 평시
  * LBtnDown
    * 태그를 클릭했을 시
      * 선택된 태그가 아닐 경우: 선택된 태그 없애고 클릭한 태그만 선택 -> MovingSelected
      * 선택된 태그였을 경우: -> MovingSelected
    * 빈공간을 클릭했을 시: 선택된 태그를 없앰 -> Selecting
- Selecting: 드래그를 통해 선택영역을 만드는 중
  * MouseMove: 선택영역 변경
  * LBtnUp: 선택영역 사이즈가 작으면 태그를 box로, 크면 태그를 점으로 취급. 선택된 태그 업데이트 -> Normal
  
- MovingSelected: 선택된 태그를 옮기는 상태
  * MouseMove: 선택된 태그들의 복제품을 반투명 상태로 평행이동 시켜서 그림.
  * LBtnUp:  선택된 태그들을 주어진 위치로 이동시키는 핸들러 호출 -> Normal

# viewportChanging
- false - 평시
  * RBtnDown: -> true

- true  - 사진 평행이동 중 (viewport 바꾸는 중)
  * RBtnUp -> false
  * MouseMove -> 뷰포트를 바꿈

*/
enum EditState {
    Normal,
    Selecting,
    MovingSelected
}

export enum MarkStyle {
    Normal,
    Selected,
    Moving
}

interface EditorState {
    viewport: Viewport
    
    editState: EditState
    viewportChanging: boolean

    draggingWithLBtn: boolean
    lbtnDragStartScrCoord: Point | null
    lbtnDragStartImgCoord: Point | null

    draggingWithRBtn: boolean
    rbtnDragStartScrCoord: Point | null
    rbtnDragStartImgCoord: Point | null
    dragStartViewport: Viewport | null

    magLevel: number

    selectionRct: Rect | null
    selectedPoints: Set<string>

    pointsToBeUpdated: {[key:string]: Point}
}

export interface EditorProps {
    backgroundUrl: string
    foregroundUrl: string
    points: PointSet
    calculatedPoints: PointSet
    isSelectMode: boolean,
    isFocused: boolean
    showPoints?: boolean

    onFocused?:(()=>void)
    onDeleteDataPoints?:((points:Set<string>)=>void)
    onSetDataPoint?:((imgCoord:Point, scrCoord:Point)=>void)
    onMoveDataPoints?:((updated:PointSet)=>void)
    onUndo?:(()=>void)
    onRedo?:(()=>void)

}


export class Editor extends React.Component<EditorProps, EditorState> {
    protected containerRef: (e: HTMLDivElement | null)=>any;
    protected containerElem: HTMLDivElement | null = null;
    protected containerResizeObserver: any;

    protected imageRef: PIXI.Sprite | null = null;
    protected pixiApp: PIXI.Application | null = null;
    protected keyboardEventListener: SimpleKeyboardEventListener

    protected curTexture: PIXI.Texture | null = null;
    protected curTextureUrl: string | null = null;

    protected textStyles: {[key:number]: PIXI.TextStyle} = {}

    constructor(props: EditorProps) {
        super(props);
        this.state = {
            viewport: defaultViewport,

            editState: EditState.Normal,
            viewportChanging: false,

            draggingWithLBtn: false,
            draggingWithRBtn: false,
            lbtnDragStartScrCoord: null,
            lbtnDragStartImgCoord: null,
            rbtnDragStartScrCoord: null,
            rbtnDragStartImgCoord: null,

            dragStartViewport: null,
            magLevel: 0,

            selectionRct: null,
            selectedPoints: new Set(),

            pointsToBeUpdated: {}
        }
        this.containerRef = (e: HTMLDivElement | null) => {
            if (e) {
                this.containerElem = e;
                this.containerResizeObserver = new ResizeOberver(entries => {
                    if (entries.length === 1) {
                        const width = entries[0].contentRect.width;
                        const height = entries[0].contentRect.height;
                        this.updateContainerSize({
                            width, height
                        })
                    }
                });
                this.containerResizeObserver.observe(e);
            }
        }
        this.keyboardEventListener = new SimpleKeyboardEventListener((ev:KeyboardEvent)=>{
            this.handleKeyDown(ev);
        })
    }

    updateContainerSize(rct:{width:number, height:number}) {
        let containerWidth = this.state.viewport.containerWidth;
        let containerHeight = this.state.viewport.containerHeight ;
        let rctWidth = _.max([Math.floor(rct.width), 1])!;
        let rctHeight = _.max([Math.floor(rct.height), 1])!;
        if ((containerHeight !== rctHeight || containerWidth !== rctWidth)) {
            let newViewport = _.clone(this.state.viewport);
            newViewport.containerWidth = rctWidth
            newViewport.containerHeight = rctHeight
            fixViewport(newViewport);
            this.setState( { viewport: newViewport })
        }
    }

    updateImageSize(rct:{width:number, height:number}) {
        let imageWidth = this.state.viewport.imageWidth;
        let imageHeight = this.state.viewport.imageHeight ;
        let rctWidth = _.max([Math.floor(rct.width), 1])!;
        let rctHeight = _.max([Math.floor(rct.height), 1])!;
        if (imageHeight !== rctHeight || imageWidth !== rctWidth) {
            let newViewport = _.clone(this.state.viewport);
            newViewport.imageHeight = rctHeight;
            newViewport.imageWidth = rctWidth;
            newViewport.viewportCenterX = rctWidth / 2;
            newViewport.viewportCenterY = rctHeight / 2;
            fixViewport(newViewport);
            this.setState( { viewport: newViewport })
        }
    }

    componentDidMount() {
        document.addEventListener("keydown", this.keyboardEventListener);
    }

    componentWillUnmount() {
        if (this.containerResizeObserver)
            this.containerResizeObserver.disconnect();
        document.removeEventListener("keydown", this.keyboardEventListener);
    }

    handleMouseDown(e: PIXI.InteractionEvent) {
        if (this.props.onFocused && !this.props.isFocused)
            this.props.onFocused();

        let leftButton = (e.data.button === 0);
        let rightButton = (e.data.button === 2);

        let scrCoord: Point = { x: e.data.global.x, y: e.data.global.y }
        let imgCoord = toImageCoord(this.state.viewport, scrCoord);

        if (leftButton) {
            this.setState({
                draggingWithLBtn: true,
                lbtnDragStartScrCoord: scrCoord,
                lbtnDragStartImgCoord: imgCoord,
            })
        }

        if (rightButton) {
            this.setState({
                draggingWithRBtn: true,
                rbtnDragStartScrCoord: scrCoord,
                rbtnDragStartImgCoord: imgCoord,
                dragStartViewport: _.clone(this.state.viewport),
            })
        }

        if (leftButton) {
            if (this.props.isSelectMode) {
                if (this.state.editState === EditState.Normal) {
                    let clickedTag = null;

                    for (let key in this.props.points) {
                        let tagImgCoord = this.props.points[key];
                        let tagScrCoord = toScreenCoord(this.state.viewport, tagImgCoord);

                        let sz = 20 / 2; // TODO: replace const to configurable value
                        let rgn = makeRect({x:tagScrCoord.x-sz, y:tagScrCoord.y-sz}, {x:tagScrCoord.x+sz, y:tagScrCoord.y+sz})
                        if (isIncluded(rgn, scrCoord)) {
                            clickedTag = key;
                            break;
                        }
                    }

                    if (clickedTag) {
                        if (this.state.selectedPoints.has(clickedTag)) {
                            this.setState({
                                selectionRct: null,
                                editState: EditState.MovingSelected,
                            })
                        } else {
                            let selectedPoints:Set<string> = new Set()
                            selectedPoints.add(clickedTag);
                            this.setState({
                                selectionRct: null,
                                editState: EditState.MovingSelected,
                                selectedPoints
                            })
                        }
                    } else {
                        this.setState({
                            selectionRct: null,
                            editState: EditState.Selecting,
                            selectedPoints: new Set()
                        })
                    }
                }
            } else {
                if (this.props.onSetDataPoint)
                    this.props.onSetDataPoint(imgCoord, scrCoord);
            }
        }

        if (rightButton) {
            this.setState({
                viewportChanging: true
            })
        }
    }

    handleMouseLeave (e:PIXI.InteractionEvent) {
    }

    handleMouseLBtnUp(e:PIXI.InteractionEvent) {
        let scrCoord: Point = { x: e.data.global.x, y: e.data.global.y }
        let imgCoord = toImageCoord(this.state.viewport, scrCoord);

        if (this.props.isSelectMode) {
            if (this.state.editState === EditState.Selecting) {
                const selectRgnImg = makeRect(this.state.lbtnDragStartImgCoord!, imgCoord);
                const selectRgnScr = makeRect(toScreenCoord(this.state.viewport, this.state.lbtnDragStartImgCoord!), scrCoord)

                let singleTagSelectMode = (rectArea(selectRgnScr) < 2);
                let newSelectedPoints: Set<string> = new Set();

                if (singleTagSelectMode) {
                    for (let key in this.props.points) {
                        let tagImgCoord = this.props.points[key];
                        let tagScrCoord = toScreenCoord(this.state.viewport, tagImgCoord);

                        let sz = 20 / 2; // TODO: replace const to configurable value
                        let rgn = makeRect({x:tagScrCoord.x-sz, y:tagScrCoord.y-sz}, {x:tagScrCoord.x+sz, y:tagScrCoord.y+sz})
                        if (isIncluded(rgn, scrCoord)) {
                            newSelectedPoints.add(key);
                            break;
                        }
                    }
                } else {
                    for (let key in this.props.points) {
                        let tagImgCoord = this.props.points[key];
                        if (isIncluded(selectRgnImg, tagImgCoord)) {
                            newSelectedPoints.add(key);
                        }
                    }
                }
                
                this.setState({
                    editState: EditState.Normal,
                    selectionRct: null,
                    selectedPoints: newSelectedPoints
                })
            } else if (this.state.editState === EditState.MovingSelected) {
                const diff_x = scrCoord.x - this.state.lbtnDragStartScrCoord!.x;
                const diff_y = scrCoord.y - this.state.lbtnDragStartScrCoord!.y;
                const diff_r = (diff_x * diff_x) + (diff_y * diff_y);

                if (this.props.onMoveDataPoints && diff_r > 4) {
                    this.props.onMoveDataPoints(_.clone(this.state.pointsToBeUpdated))
                }
                this.setState({
                    editState: EditState.Normal,
                    pointsToBeUpdated:{}
                })
            }
        }

        this.setState({
            draggingWithLBtn: false,
            lbtnDragStartImgCoord: null,
            lbtnDragStartScrCoord: null
        })
    }

    handleMouseRBtnUp(e:PIXI.InteractionEvent) {
        this.setState({
            viewportChanging: false,
            rbtnDragStartImgCoord: null,
            rbtnDragStartScrCoord: null,
            dragStartViewport: null
        })
    }

    handleMouseUp(e:PIXI.InteractionEvent) {
        let leftButton = (e.data.button === 0);
        let rightButton = (e.data.button === 2);
        if (leftButton) this.handleMouseLBtnUp(e);
        if (rightButton) this.handleMouseRBtnUp(e);
    }

    handleMouseMove(e:PIXI.InteractionEvent) {
        let leftButton = ((e.data.buttons & 1) === 1);
        let rightButton = ((e.data.buttons & 2) === 2);

        if (!leftButton && this.state.draggingWithLBtn) {
            this.handleMouseLBtnUp(e)
        }

        if (!rightButton && this.state.draggingWithRBtn) {
            this.handleMouseRBtnUp(e)
        }

        if (this.state.viewportChanging) {
            let scrCoord: Point = { x: e.data.global.x, y: e.data.global.y }
            let effMag = effectiveMagnification(this.state.viewport)
            let diffX = (scrCoord.x - this.state.rbtnDragStartScrCoord!.x) / effMag;
            let diffY = (scrCoord.y - this.state.rbtnDragStartScrCoord!.y) / effMag;

            let newViewport = _.clone(this.state.viewport);
            newViewport.viewportCenterX = - diffX + this.state.dragStartViewport!.viewportCenterX;
            newViewport.viewportCenterY = - diffY + this.state.dragStartViewport!.viewportCenterY;
            fixViewport(newViewport);

            this.setState({
                viewport: newViewport
            })
        }

        if (this.props.isSelectMode) {
            if (this.state.editState === EditState.Selecting && leftButton) {
                let scrCoord: Point = { x: e.data.global.x, y: e.data.global.y }
                const p1 = this.state.lbtnDragStartImgCoord!;
                const p2 =  toImageCoord(this.state.viewport, scrCoord);
                const selectionRct = makeRect(p1, p2);
                
                this.setState({
                        selectionRct,
                })
            } else if (this.state.editState === EditState.MovingSelected) {
                let scrCoord: Point = { x: e.data.global.x, y: e.data.global.y }
                let imgCoord = toImageCoord(this.state.viewport, scrCoord);
                let diffX = (imgCoord.x - this.state.lbtnDragStartImgCoord!.x);
                let diffY = (imgCoord.y - this.state.lbtnDragStartImgCoord!.y);

                let pointsToBeUpdated:{[key:string]:Point} = {}
                for (let key of this.state.selectedPoints) {
                   pointsToBeUpdated[key] = _.clone(this.props.points[key]); 
                   pointsToBeUpdated[key].x += diffX;
                   pointsToBeUpdated[key].y += diffY;
                }
                this.setState({
                    pointsToBeUpdated
                })
            }
        }
    }

    handleWheel(e:React.WheelEvent<HTMLCanvasElement>) { 
        let newViewport = _.clone(this.state.viewport);
        let newMagLevel = this.state.magLevel;
        if (e.deltaY > 0) 
            newMagLevel += 1;
        else newMagLevel -= 1;
        if (newMagLevel < -10) newMagLevel = -10;
        if (newMagLevel > 10) newMagLevel = 10;

        newViewport.magnification = Math.pow(1.2, newMagLevel);
        fixViewport(newViewport);
        this.setState( { 
            viewport: newViewport,
            magLevel: newMagLevel,
         })
    }
    
    handleCompletedSpriteLoading() {
        const sprite = this.imageRef;
        if (sprite) {
            const height = sprite?.texture.height;
            const width = sprite?.texture.width;
            const sz = {width, height};
            this.updateImageSize(sz);
        }
    }

    renderSelectionRct(): ReactChild[] {
        if (this.state.selectionRct) {
            const p1 = toScreenCoord(this.state.viewport, this.state.selectionRct.p1);
            const p2 = toScreenCoord(this.state.viewport, this.state.selectionRct.p2);
            return [(
                <SelectRct p1={p1} p2={p2} visible={this.state.selectionRct !== undefined} key="selection-rct"/>
            )]
        } 
        return []
    }

    renderSimpleMark(p: Point, color: number, size:number, tag:string): ReactChild[] {
        const scrPt = toScreenCoord(this.state.viewport, p);
        const x = scrPt.x;
        const y = scrPt.y;

        return [(
            <SimpleMarker point={{x, y}} color={color} size={size} key={`simplemark-${tag}`}/>
        )]
    }

    

    renderMark(p: Point, color:number, size:number, holeSize:number, style:MarkStyle , tag:string): ReactChild[] {
        const scrPt = toScreenCoord(this.state.viewport, p);
        const x = scrPt.x;
        const y = scrPt.y;

        if (this.textStyles[color] === undefined) {
            this.textStyles[color] = new PIXI.TextStyle ({
                align: 'center',
                fontFamily: '"Source Sans Pro", Helvetica, sans-serif',
                fontSize: 15,
                fill: [color], // gradient
                stroke: '#000000',
                strokeThickness: 2,
                letterSpacing: 1,
                dropShadow: false,
                wordWrap: false,
            })
        }

        return [ (
            <Marker 
                point={{x, y}} 
                color={color} 
                size={size} 
                holeSize={holeSize} 
                style={style} 
                key={`mark-${style}-${tag}`}
            />
        ),
        (
            <Text text={classCodeToName(tag)}
            x={x + 1.5 * size} y={y-size}
            anchor={0.5}
            key={`mark-${style}-${tag}-tag`}
            style={this.textStyles[color]} />
        )]
    }

    handleKeyDown(e:KeyboardEvent) {
        if (this.props.isFocused) {
            if (e.key === "Backspace" || e.key === "Delete") {
                if (this.props.onDeleteDataPoints)
                    this.props.onDeleteDataPoints(this.state.selectedPoints);
                this.setState( {selectedPoints: new Set()})
            }

            if (e.key === '4') {
                if (this.props.onUndo)
                    this.props.onUndo()
                this.setState( {selectedPoints: new Set()})
            }

            if (e.key === '5') {
                if (this.props.onRedo)
                    this.props.onRedo()
                this.setState( {selectedPoints: new Set()})
            }
            
            if (e.key === 'r') {
                let newViewport = _.clone(this.state.viewport)
                const newMagLevel = 0.0
                resetViewport(newViewport);
                this.setState( { 
                    viewport: newViewport,
                    magLevel: newMagLevel,
                })
            }
        }
    }

    render() {
        const props = this.props;
        const state = this.state;
        const effMag = effectiveMagnification(state.viewport);
        const scrCoord = toScreenCoord(this.state.viewport, {x:0, y:0});

        const points = props.points;
        let pointGraphics:ReactNode[]=[];
        const visibility = (this.props.showPoints === undefined || this.props.showPoints) 

        if (visibility) {
            for (let key in points) {
                let color = colorCodeToColorNum(classCodeToColor(key));
                let selected = this.state.selectedPoints.has(key);
                let e = this.renderMark(points[key], color, 20, 3, ((selected)?MarkStyle.Selected:MarkStyle.Normal), key);
                pointGraphics.push.apply(pointGraphics, e);
            }

            for (let key in props.calculatedPoints) {
                let color = colorCodeToColorNum(classCodeToColor(key));
                let e = this.renderSimpleMark(props.calculatedPoints[key], color, 3, key);
                pointGraphics.push.apply(pointGraphics, e);
            }
        }

        for (let key in this.state.pointsToBeUpdated) {
            let color = colorCodeToColorNum(classCodeToColor(key));
            let e = this.renderMark(this.state.pointsToBeUpdated[key], color, 20, 3, MarkStyle.Moving, key);
            pointGraphics.push.apply(pointGraphics, e);
        }

        if (this.imageRef) {
            this.imageRef.texture.on('added', ()=>{
                this.handleCompletedSpriteLoading();
            })
        }

        if (this.curTextureUrl !== this.props.foregroundUrl) {
            this.curTextureUrl = this.props.foregroundUrl
            PIXI.Texture.fromURL(this.curTextureUrl).then((texture:PIXI.Texture)=>{
                if (this.imageRef) {
                    if (this.imageRef.texture !== null)
                        this.imageRef.texture.baseTexture.destroy();
                    this.imageRef.texture = texture;
                    this.handleCompletedSpriteLoading();
                }
            })
        }

        const rctGraphics = this.renderSelectionRct();
        
        const wrapperStyle:React.CSSProperties = (props.isFocused)? {
            border: '2px solid #4aaeff',
            boxShadow: '0 0 12px #4aaeff',
            overflow: 'hidden'
        }:{
            border: '2px solid #0e395c',
            overflow: 'hidden'
        }

        const outFocusShadow:ReactNode[] = []
        if (!this.props.isFocused) {
            outFocusShadow.push(
            <Box 
            p1={{x:0, y:0}}
            p2={{x:this.state.viewport.containerWidth, y:this.state.viewport.containerHeight}}
            color={0}
            alpha={0.3}
            visible={true}
            key="out-focus-shadow"
            />
            )
        }

        return (
            <div ref={this.containerRef} style={{ width: '99%', height:'99%'}}>
            <div style={wrapperStyle}>
            <Stage width={state.viewport.containerWidth} height={state.viewport.containerHeight} 
                onWheel={(e:React.WheelEvent<HTMLCanvasElement>)=>{this.handleWheel(e)}}
                onContextMenu={(e:React.MouseEvent<HTMLCanvasElement, MouseEvent>)=>{e.preventDefault();}}
                onMount = {_app => { 
                        this.pixiApp = _app;
                        this.pixiApp.loader.onComplete.add(()=>{
                            this.handleCompletedSpriteLoading();
                        });
                        this.pixiApp.stage.interactive = true;
                        this.pixiApp.stage.on('pointerup', (e:PIXI.InteractionEvent)=>{ this.handleMouseUp(e);})
                        this.pixiApp.stage.on('pointerdown', (e:PIXI.InteractionEvent)=>{ this.handleMouseDown(e);})
                        this.pixiApp.stage.on('pointerleave', (e:PIXI.InteractionEvent)=>{ this.handleMouseLeave(e);})
                        this.pixiApp.stage.on('pointermove', (e:PIXI.InteractionEvent)=>{ this.handleMouseMove(e);})
                    }}
                options={
                    {
                        sharedLoader:false
                    }
                }
                >

                <TilingSprite source={props.backgroundUrl}
                    width={state.viewport.containerWidth}
                    height={state.viewport.containerHeight}
                    tilePosition={{x : 0, y: 0}}
                    />
                <Sprite texture={PIXI.Texture.EMPTY}
                    scale={{x: effMag, y:effMag}}
                    x = {scrCoord.x}
                    y = {scrCoord.y}
                    ref = {(e:PIXI.Sprite | null) => {
                        if (e !== this.imageRef && e !== null) {
                            this.imageRef = e;
                        }
                    }}
                />
                {pointGraphics}
                {rctGraphics}
                {outFocusShadow}
            </Stage>
            </div>
            </div>
        );
    }
}

export default Editor;